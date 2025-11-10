/**
 * APML Squad Masters Payment Server
 * Сервер для обработки платежей турнира Squad Masters
 *
 * Основной функционал:
 * - Создание платежей через CodeePay API
 * - Обработка webhook уведомлений от платежной системы
 * - Синхронизация статусов с Google Sheets
 * - Проверка статусов оплаты команд
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// НАСТРОЙКИ И MIDDLEWARE
// ============================================

// Middleware для парсинга JSON
app.use(express.json());

// CORS настройки - разрешаем запросы с Tilda и ucnominal.ru
app.use(cors({
  origin: ['https://apml.online', 'http://apml.online', 'https://ucnominal.ru'],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// КОНФИГУРАЦИЯ GOOGLE SHEETS
// ============================================

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Лист1';

/**
 * Авторизация в Google Sheets API через Service Account
 * @returns {Promise<GoogleAuth>}
 */
async function authorizeSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Ошибка авторизации Google Sheets:', error.message);
    throw error;
  }
}

/**
 * Обновление статуса оплаты в Google Sheets (упрощенная версия - только столбец X)
 * @param {string} teamName - Название команды
 * @param {string} paymentStatus - Статус оплаты
 */
async function updatePaymentStatus(teamName, paymentStatus) {
  try {
    const sheets = await authorizeSheets();

    // Получаем все данные из таблицы
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:X`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('Таблица пуста');
    }

    // Ищем строку с нужной командой (столбец B = TeamName)
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) { // Начинаем с 1, пропускаем заголовок
      const row = rows[i];
      const rowTeamName = row[1]; // Столбец B (TeamName)

      if (rowTeamName && rowTeamName.toLowerCase().trim() === teamName.toLowerCase().trim()) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error(`Команда "${teamName}" не найдена в таблице`);
    }

    // Обновляем столбец X (payment_status) - индекс 23
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!X${targetRowIndex + 1}`,
      valueInputOption: 'RAW',
      resource: {
        values: [[paymentStatus]]
      }
    });

    console.log(`✅ Обновлена строка ${targetRowIndex + 1} для команды "${teamName}" - статус: ${paymentStatus}`);

    return { success: true, rowIndex: targetRowIndex + 1 };
  } catch (error) {
    console.error('Ошибка обновления Google Sheets:', error.message);
    throw error;
  }
}

/**
 * Получение статуса оплаты команды из Google Sheets
 * @param {string} teamName - Название команды
 * @returns {Promise<Object>} - { paid: boolean, payment_status: string }
 */
async function getPaymentStatus(teamName) {
  try {
    const sheets = await authorizeSheets();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:X`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { paid: false };
    }

    // Ищем команду
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowTeamName = row[1]; // Столбец B

      if (rowTeamName && rowTeamName.toLowerCase().trim() === teamName.toLowerCase().trim()) {
        const paymentStatus = row[23]; // Столбец X

        return {
          paid: paymentStatus === 'Оплачено',
          payment_status: paymentStatus || 'Не оплачено'
        };
      }
    }

    return { paid: false, payment_status: 'Команда не найдена' };
  } catch (error) {
    console.error('Ошибка получения статуса оплаты:', error.message);
    throw error;
  }
}

// ============================================
// CODEEPAY API ИНТЕГРАЦИЯ
// ============================================

const CODEEPAY_API_URL = process.env.CODEEPAY_API_URL || 'https://api.codeepay.com';
const CODEEPAY_API_KEY = process.env.CODEEPAY_API_KEY;

/**
 * Создание платежа в CodeePay
 * @param {Object} orderData - Данные заказа
 * @returns {Promise<Object>} - { payment_url, order_id, qr_url }
 */
async function createCodeePayPayment(orderData) {
  try {
    console.log('📤 Создание платежа CodeePay:', {
      order_id: orderData.order_id,
      amount: orderData.amount,
      method: orderData.method
    });

    const response = await axios.post(
      `${CODEEPAY_API_URL}/initiate_payment`,
      {
        order_id: orderData.order_id,
        amount: orderData.amount,
        method: orderData.method, // 'sbp' или 'card'
        metadata: {
          team_name: orderData.team_name,
          captain_telegram: orderData.captain_telegram,
          group: orderData.group,
          notification_url: `${process.env.BACKEND_URL}/api/payment-callback`
        }
      },
      {
        headers: {
          'X-Api-Key': CODEEPAY_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Платеж CodeePay создан:', response.data);

    return {
      payment_url: response.data.payment_url,
      order_id: response.data.order_id,
      qr_url: response.data.qr_url || null,
      method: response.data.method
    };
  } catch (error) {
    console.error('❌ Ошибка создания платежа CodeePay:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Ошибка создания платежа');
  }
}

/**
 * Проверка статуса платежа в CodeePay
 * @param {string} orderId - ID заказа
 * @returns {Promise<Object>}
 */
async function checkCodeePayPayment(orderId) {
  try {
    const response = await axios.post(
      `${CODEEPAY_API_URL}/get_payment`,
      {
        order_id: orderId
      },
      {
        headers: {
          'X-Api-Key': CODEEPAY_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ Ошибка проверки платежа:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Healthcheck endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'APML Payment Server (CodeePay)'
  });
});

/**
 * Создание платежа
 * POST /api/create-payment
 * Body: { team_name, captain_telegram, group, amount, method }
 */
app.post('/api/create-payment', async (req, res) => {
  try {
    const {
      team_name,
      captain_telegram,
      group,
      amount,
      method = 'sbp' // По умолчанию СБП
    } = req.body;

    // Валидация обязательных полей
    if (!team_name || !captain_telegram || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные поля: team_name, captain_telegram, amount'
      });
    }

    console.log(`\n📝 Запрос на создание платежа от команды: ${team_name}`);

    // Проверяем, не оплачена ли уже команда
    const paymentStatus = await getPaymentStatus(team_name);
    if (paymentStatus.paid) {
      return res.status(400).json({
        success: false,
        error: 'Команда уже оплатила участие',
        already_paid: true
      });
    }

    // Генерируем уникальный order_id
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const order_id = `APML_${timestamp}_${random}`;

    // Создаем платеж в CodeePay
    const payment = await createCodeePayPayment({
      order_id,
      team_name,
      captain_telegram,
      group,
      amount,
      method
    });

    // Обновляем статус в Google Sheets
    await updatePaymentStatus(team_name, 'Ожидает оплаты');

    console.log(`✅ Платеж создан для команды ${team_name}, order_id: ${order_id}`);

    // Возвращаем данные платежа
    res.json({
      success: true,
      payment_url: payment.payment_url,
      payment_order_id: order_id,
      qr_url: payment.qr_url,
      method: payment.method
    });

  } catch (error) {
    console.error('❌ Ошибка создания платежа:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка создания платежа'
    });
  }
});

/**
 * Webhook для обработки уведомлений от CodeePay
 * POST /api/payment-callback
 *
 * Формат webhook:
 * {
 *   "order_id": "ABC123",
 *   "amount": 100,
 *   "final_amount": 95,
 *   "commission_amount": 5,
 *   "method": "card",
 *   "metadata": {
 *     "team_name": "...",
 *     "captain_telegram": "...",
 *     "notification_url": "https://..."
 *   }
 * }
 */
app.post('/api/payment-callback', async (req, res) => {
  try {
    console.log('\n🔔 Получен webhook от CodeePay');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Проверка IP адреса (опционально, но рекомендуется)
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`📍 IP отправителя: ${clientIp}`);

    // ВАЖНО: В продакшене раскомментируйте проверку IP
    // const ALLOWED_IP = '83.222.9.37';
    // if (!clientIp.includes(ALLOWED_IP)) {
    //   console.error('❌ Неразрешенный IP адрес');
    //   return res.status(403).json({ error: 'Forbidden' });
    // }

    const webhook = req.body;
    const orderId = webhook.order_id;
    const metadata = webhook.metadata || {};
    const teamName = metadata.team_name;

    if (!teamName) {
      console.error('❌ Отсутствует team_name в metadata');
      return res.status(400).json({ error: 'Missing team_name in metadata' });
    }

    console.log(`💰 Платеж для команды: ${teamName}`);
    console.log(`💵 Сумма: ${webhook.amount}, Получено: ${webhook.final_amount}, Комиссия: ${webhook.commission_amount}`);
    console.log(`💳 Метод: ${webhook.method}`);

    // Обновляем статус в Google Sheets на "Оплачено"
    await updatePaymentStatus(teamName, 'Оплачено');

    console.log(`✅ Статус команды "${teamName}" обновлен на "Оплачено"`);

    // Опционально: отправка уведомления в Telegram
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await sendTelegramNotification(
        `✅ Новая оплата!\n\n` +
        `Команда: ${teamName}\n` +
        `Сумма: ${webhook.final_amount} ₽\n` +
        `Метод: ${webhook.method}\n` +
        `Order ID: ${orderId}`
      );
    }

    // ВАЖНО: Возвращаем 200 OK для подтверждения получения webhook
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Ошибка обработки webhook:', error.message);
    // Все равно возвращаем 200, чтобы избежать повторных попыток
    res.status(200).json({ success: false, error: error.message });
  }
});

/**
 * Проверка статуса оплаты команды
 * GET /api/check-payment/:teamName
 */
app.get('/api/check-payment/:teamName', async (req, res) => {
  try {
    const teamName = decodeURIComponent(req.params.teamName);
    console.log(`\n🔍 Проверка статуса оплаты для команды: ${teamName}`);

    const status = await getPaymentStatus(teamName);

    res.json({
      success: true,
      team_name: teamName,
      ...status
    });

  } catch (error) {
    console.error('❌ Ошибка проверки статуса:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Проверка статуса платежа по order_id в CodeePay
 * GET /api/check-order/:orderId
 */
app.get('/api/check-order/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(`\n🔍 Проверка статуса заказа в CodeePay: ${orderId}`);

    const payment = await checkCodeePayPayment(orderId);

    res.json({
      success: true,
      order_id: orderId,
      ...payment
    });

  } catch (error) {
    console.error('❌ Ошибка проверки заказа:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Отправка уведомления в Telegram
 * @param {string} message - Текст сообщения
 */
async function sendTelegramNotification(message) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return;
    }

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });

    console.log('✅ Уведомление отправлено в Telegram');
  } catch (error) {
    console.error('❌ Ошибка отправки в Telegram:', error.message);
  }
}

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 APML Payment Server запущен (CodeePay)');
  console.log('='.repeat(50));
  console.log(`📡 Порт: ${PORT}`);
  console.log(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Google Sheets ID: ${SPREADSHEET_ID}`);
  console.log(`📄 Лист: ${SHEET_NAME}`);
  console.log(`💳 CodeePay API: ${CODEEPAY_API_URL}`);
  console.log('='.repeat(50) + '\n');

  // Проверка переменных окружения
  const requiredEnvVars = [
    'GOOGLE_SPREADSHEET_ID',
    'CODEEPAY_API_KEY',
    'BACKEND_URL'
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    console.warn('⚠️  ВНИМАНИЕ: Отсутствуют переменные окружения:');
    missingVars.forEach(v => console.warn(`   - ${v}`));
    console.warn('');
  }
});

// Обработка ошибок
process.on('unhandledRejection', (error) => {
  console.error('Необработанная ошибка Promise:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Необработанное исключение:', error);
  process.exit(1);
});
