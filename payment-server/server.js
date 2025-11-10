/**
 * APML Squad Masters Payment Server
 * Сервер для обработки платежей турнира Squad Masters
 *
 * Основной функционал:
 * - Создание платежей через ЮKassa API
 * - Обработка webhook уведомлений от платежной системы
 * - Синхронизация статусов с Google Sheets
 * - Проверка статусов оплаты команд
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// НАСТРОЙКИ И MIDDLEWARE
// ============================================

// Middleware для парсинга JSON
app.use(express.json());

// CORS настройки - разрешаем запросы с Tilda
app.use(cors({
  origin: ['https://apml.online', 'http://apml.online'],
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
 * Обновление данных в Google Sheets
 * @param {string} teamName - Название команды
 * @param {number} registrationTimestamp - Timestamp регистрации
 * @param {Object} updates - Объект с обновлениями { payment_status, payment_order_id, payment_timestamp }
 */
async function updateGoogleSheet(teamName, registrationTimestamp, updates) {
  try {
    const sheets = await authorizeSheets();

    // Получаем все данные из таблицы
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AA`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('Таблица пуста');
    }

    // Ищем строку с нужной командой
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) { // Начинаем с 1, пропускаем заголовок
      const row = rows[i];
      const rowTeamName = row[1]; // Столбец B (TeamName)
      const rowTimestamp = row[26]; // Столбец AA (registration_timestamp)

      // Сравниваем название команды
      if (rowTeamName && rowTeamName.toLowerCase() === teamName.toLowerCase()) {
        // Если есть timestamp регистрации, проверяем его (в пределах ±2 минут)
        if (registrationTimestamp && rowTimestamp) {
          const timeDiff = Math.abs(Number(rowTimestamp) - registrationTimestamp);
          if (timeDiff > 120000) { // 2 минуты в миллисекундах
            continue; // Пропускаем, если время не совпадает
          }
        }
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error(`Команда "${teamName}" не найдена в таблице`);
    }

    // Формируем обновления
    const updateRequests = [];

    // Столбец X (payment_status) - индекс 23
    if (updates.payment_status) {
      updateRequests.push({
        range: `${SHEET_NAME}!X${targetRowIndex + 1}`,
        values: [[updates.payment_status]]
      });
    }

    // Столбец Y (payment_order_id) - индекс 24
    if (updates.payment_order_id) {
      updateRequests.push({
        range: `${SHEET_NAME}!Y${targetRowIndex + 1}`,
        values: [[updates.payment_order_id]]
      });
    }

    // Столбец Z (payment_timestamp) - индекс 25
    if (updates.payment_timestamp) {
      updateRequests.push({
        range: `${SHEET_NAME}!Z${targetRowIndex + 1}`,
        values: [[updates.payment_timestamp]]
      });
    }

    // Столбец AA (registration_timestamp) - индекс 26
    if (updates.registration_timestamp) {
      updateRequests.push({
        range: `${SHEET_NAME}!AA${targetRowIndex + 1}`,
        values: [[updates.registration_timestamp.toString()]]
      });
    }

    // Выполняем batch update
    if (updateRequests.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          valueInputOption: 'RAW',
          data: updateRequests
        }
      });

      console.log(`✅ Обновлена строка ${targetRowIndex + 1} для команды "${teamName}"`);
    }

    return { success: true, rowIndex: targetRowIndex + 1 };
  } catch (error) {
    console.error('Ошибка обновления Google Sheets:', error.message);
    throw error;
  }
}

/**
 * Получение статуса оплаты команды из Google Sheets
 * @param {string} teamName - Название команды
 * @returns {Promise<Object>} - { paid: boolean, order_id: string, paid_at: string }
 */
async function getPaymentStatus(teamName) {
  try {
    const sheets = await authorizeSheets();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AA`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { paid: false };
    }

    // Ищем команду
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowTeamName = row[1]; // Столбец B

      if (rowTeamName && rowTeamName.toLowerCase() === teamName.toLowerCase()) {
        const paymentStatus = row[23]; // Столбец X
        const orderId = row[24]; // Столбец Y
        const paidAt = row[25]; // Столбец Z

        return {
          paid: paymentStatus === 'Оплачено',
          payment_status: paymentStatus,
          order_id: orderId,
          paid_at: paidAt
        };
      }
    }

    return { paid: false };
  } catch (error) {
    console.error('Ошибка получения статуса оплаты:', error.message);
    throw error;
  }
}

// ============================================
// YOOKASSA API ИНТЕГРАЦИЯ
// ============================================

/**
 * Создание платежа в ЮKassa
 * @param {Object} orderData - Данные заказа
 * @returns {Promise<Object>} - { payment_url, payment_id }
 */
async function createYookassaPayment(orderData) {
  try {
    const auth = Buffer.from(
      `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_API_KEY}`
    ).toString('base64');

    const paymentData = {
      amount: {
        value: orderData.amount.toFixed(2),
        currency: orderData.currency || 'RUB'
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: orderData.success_url
      },
      description: orderData.description,
      metadata: {
        team_name: orderData.team_name,
        captain_telegram: orderData.captain_telegram,
        group: orderData.group,
        registration_timestamp: orderData.registration_timestamp,
        order_id: orderData.order_id
      }
    };

    // Если нужен чек (для 54-ФЗ)
    if (process.env.YOOKASSA_SEND_RECEIPT === 'true') {
      paymentData.receipt = {
        customer: {
          email: orderData.customer_email || 'noreply@apml.online'
        },
        items: [{
          description: orderData.description,
          quantity: '1.00',
          amount: {
            value: orderData.amount.toFixed(2),
            currency: 'RUB'
          },
          vat_code: 1, // НДС не облагается
          payment_mode: 'full_payment',
          payment_subject: 'service'
        }]
      };
    }

    console.log('Создание платежа ЮKassa:', paymentData);

    const response = await axios.post(
      'https://api.yookassa.ru/v3/payments',
      paymentData,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Idempotence-Key': orderData.order_id, // Защита от дублирования
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Платеж создан:', response.data.id);

    return {
      payment_url: response.data.confirmation.confirmation_url,
      payment_id: response.data.id,
      status: response.data.status
    };
  } catch (error) {
    console.error('Ошибка создания платежа ЮKassa:', error.response?.data || error.message);
    throw new Error(error.response?.data?.description || 'Ошибка создания платежа');
  }
}

/**
 * Проверка подписи webhook от ЮKassa
 * @param {Object} notification - Объект уведомления
 * @returns {boolean}
 */
function verifyYookassaSignature(notification) {
  // ЮKassa не использует HMAC подпись для webhook
  // Вместо этого рекомендуется проверять IP адрес отправителя
  // Список IP: https://yookassa.ru/developers/using-api/webhooks#ip

  // Для дополнительной безопасности можно добавить секретный токен в URL
  return true; // В продакшене добавьте реальную проверку
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
    service: 'APML Payment Server'
  });
});

/**
 * Создание платежа
 * POST /api/create-payment
 * Body: { team_name, captain_telegram, group, amount, description, success_url, registration_timestamp }
 */
app.post('/api/create-payment', async (req, res) => {
  try {
    const {
      team_name,
      captain_telegram,
      group,
      amount,
      description,
      success_url,
      registration_timestamp
    } = req.body;

    // Валидация обязательных полей
    if (!team_name || !captain_telegram || !amount || !success_url) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные поля'
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
    const order_id = `APML_GROUPA_${timestamp}_${random}`;

    // Создаем платеж в ЮKassa
    const payment = await createYookassaPayment({
      order_id,
      team_name,
      captain_telegram,
      group,
      amount,
      currency: 'RUB',
      description: description || `Оплата участия в турнире Squad Masters - ${team_name} - Группа А`,
      success_url,
      registration_timestamp
    });

    // Обновляем статус в Google Sheets
    await updateGoogleSheet(team_name, registration_timestamp, {
      payment_status: 'Ожидает оплаты',
      payment_order_id: order_id,
      registration_timestamp: registration_timestamp || timestamp
    });

    console.log(`✅ Платеж создан для команды ${team_name}, order_id: ${order_id}`);

    // Возвращаем данные платежа
    res.json({
      success: true,
      payment_url: payment.payment_url,
      payment_order_id: order_id,
      payment_id: payment.payment_id
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
 * Webhook для обработки уведомлений от ЮKassa
 * POST /api/payment-callback
 */
app.post('/api/payment-callback', async (req, res) => {
  try {
    console.log('\n🔔 Получен webhook от ЮKassa');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const notification = req.body;

    // Проверка подписи (в продакшене обязательно!)
    // if (!verifyYookassaSignature(notification)) {
    //   console.error('❌ Неверная подпись webhook');
    //   return res.status(403).json({ error: 'Invalid signature' });
    // }

    // Извлекаем данные платежа
    const paymentObject = notification.object;
    const paymentStatus = paymentObject.status;
    const metadata = paymentObject.metadata || {};
    const orderId = metadata.order_id;
    const teamName = metadata.team_name;
    const registrationTimestamp = Number(metadata.registration_timestamp);

    console.log(`Статус платежа: ${paymentStatus}, Order ID: ${orderId}, Команда: ${teamName}`);

    // Обрабатываем успешную оплату
    if (paymentStatus === 'succeeded') {
      console.log('✅ Платеж успешно проведен');

      // Обновляем статус в Google Sheets
      await updateGoogleSheet(teamName, registrationTimestamp, {
        payment_status: 'Оплачено',
        payment_timestamp: new Date().toISOString()
      });

      console.log(`✅ Статус команды "${teamName}" обновлен на "Оплачено"`);

      // Опционально: отправка уведомления в Telegram
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        await sendTelegramNotification(
          `✅ Новая оплата!\n\nКоманда: ${teamName}\nСумма: ${paymentObject.amount.value} ${paymentObject.amount.currency}\nOrder ID: ${orderId}`
        );
      }
    } else if (paymentStatus === 'canceled') {
      console.log('❌ Платеж отменен');

      // Можно обновить статус на "Отменено"
      await updateGoogleSheet(teamName, registrationTimestamp, {
        payment_status: 'Отменено'
      });
    }

    // Важно: возвращаем 200 OK, чтобы ЮKassa не повторяла webhook
    res.json({ success: true });

  } catch (error) {
    console.error('❌ Ошибка обработки webhook:', error.message);
    // Все равно возвращаем 200, чтобы не было повторных попыток
    res.json({ success: false, error: error.message });
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
 * Проверка статуса оплаты по order_id
 * GET /api/check-order/:orderId
 */
app.get('/api/check-order/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(`\n🔍 Проверка статуса заказа: ${orderId}`);

    const sheets = await authorizeSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AA`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json({ success: false, error: 'Таблица пуста' });
    }

    // Ищем заказ
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowOrderId = row[24]; // Столбец Y

      if (rowOrderId === orderId) {
        const teamName = row[1]; // Столбец B
        const paymentStatus = row[23]; // Столбец X
        const paidAt = row[25]; // Столбец Z

        return res.json({
          success: true,
          team_name: teamName,
          paid: paymentStatus === 'Оплачено',
          payment_status: paymentStatus,
          paid_at: paidAt
        });
      }
    }

    res.json({ success: false, error: 'Заказ не найден' });

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
  console.log('🚀 APML Payment Server запущен');
  console.log('='.repeat(50));
  console.log(`📡 Порт: ${PORT}`);
  console.log(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Google Sheets ID: ${SPREADSHEET_ID}`);
  console.log(`📄 Лист: ${SHEET_NAME}`);
  console.log('='.repeat(50) + '\n');

  // Проверка переменных окружения
  const requiredEnvVars = [
    'GOOGLE_SPREADSHEET_ID',
    'YOOKASSA_SHOP_ID',
    'YOOKASSA_API_KEY'
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
