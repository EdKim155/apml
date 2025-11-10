# Быстрая настройка CodeePay для APML Squad Masters

## 🚀 Краткая инструкция

### 1. Настройка Google Sheets (УПРОЩЕННАЯ)

**Вам нужен только ОДИН столбец!**

1. Откройте таблицу: https://docs.google.com/spreadsheets/d/1xrEdEvfmxNlP-86PJJVn8QqeOXQbCvusguA_SHipwvI/edit

2. Добавьте **столбец X** с заголовком `payment_status` после существующих столбцов

3. Все данные команды (название, игроки, Telegram) уже заполняются формой Tilda автоматически

4. Настройте Google Sheets API (см. `payment-server/GOOGLE_SHEETS_SETUP.md`):
   - Создайте Service Account
   - Скачайте credentials.json
   - Добавьте Service Account в таблицу с правами "Редактор"

### 2. Настройка Backend сервера

```bash
cd payment-server

# Установите зависимости
npm install

# Создайте .env файл
cp .env.example .env
```

**Отредактируйте `.env`:**

```env
# Google Sheets
GOOGLE_SPREADSHEET_ID=1xrEdEvfmxNlP-86PJJVn8QqeOXQbCvusguA_SHipwvI
GOOGLE_SHEET_NAME=Лист1
GOOGLE_CREDENTIALS_PATH=./credentials.json

# CodeePay API
CODEEPAY_API_KEY=0b5ef975-08e9-4d47-ae75-c0a4197ef498
CODEEPAY_API_URL=https://api.codeepay.com

# Backend URL (должен быть ucnominal.ru для webhook)
BACKEND_URL=https://ucnominal.ru

# Success URL
FRONTEND_SUCCESS_URL=https://apml.online/groupa-reg-squad-masters-success-21nov
```

**Запустите сервер:**

```bash
# Для разработки
npm run dev

# Для продакшн
npm start
```

### 3. Настройка Webhook CodeePay

**Важная информация:**
- CodeePay отправляет webhook только с IP: `83.222.9.37`
- Webhook URL: `https://ucnominal.ru/api/payment-callback`
- Сервер должен отвечать HTTP 200 OK

**Формат webhook от CodeePay:**

```json
{
  "order_id": "APML_1699999999_ABC123",
  "amount": 5000,
  "final_amount": 4750,
  "commission_amount": 250,
  "method": "sbp",
  "metadata": {
    "team_name": "Test Team",
    "captain_telegram": "@captain",
    "group": "Группа А",
    "notification_url": "https://ucnominal.ru/api/payment-callback"
  }
}
```

### 4. Настройка Tilda (минимальные изменения)

Frontend код (в `tilda-code/`) практически не изменился:

**Что изменилось:**
- API endpoint остался тот же: `/api/create-payment`
- Добавлен параметр `method` (по умолчанию 'sbp')
- Упрощена логика - нет registration_timestamp

**Что делать:**
1. Откройте каждую страницу в Tilda
2. Найдите Zero Block с кодом
3. Замените `YOUR-BACKEND-URL` на `https://ucnominal.ru`
4. Опубликуйте страницы

### 5. API Endpoints

**Создание платежа:**
```bash
POST https://ucnominal.ru/api/create-payment

Body:
{
  "team_name": "Test Team",
  "captain_telegram": "@test",
  "group": "Группа А",
  "amount": 5000,
  "method": "sbp"  // или "card"
}

Response:
{
  "success": true,
  "payment_url": "https://...",
  "payment_order_id": "APML_...",
  "qr_url": "https://...",  // для СБП
  "method": "sbp"
}
```

**Проверка статуса:**
```bash
GET https://ucnominal.ru/api/check-payment/Test%20Team

Response:
{
  "success": true,
  "team_name": "Test Team",
  "paid": true,
  "payment_status": "Оплачено"
}
```

### 6. Методы оплаты CodeePay

- **`sbp`** - Система быстрых платежей (рекомендуется)
  - Быстрая оплата через СБП
  - Генерируется QR код
  - Низкая комиссия

- **`card`** - Карточная оплата
  - Оплата банковской картой
  - Универсальный метод

По умолчанию используется СБП.

### 7. Поток данных (УПРОЩЕННЫЙ)

```
1. Пользователь заполняет форму на Tilda
   ↓
2. Данные автоматически сохраняются в Google Sheets (включая название команды)
   ↓
3. JavaScript перенаправляет на страницу оплаты
   ↓
4. Пользователь нажимает "Оплатить"
   ↓
5. Backend создает платеж в CodeePay
   ↓
6. Backend обновляет Google Sheets: столбец X = "Ожидает оплаты"
   ↓
7. Пользователь оплачивает через CodeePay
   ↓
8. CodeePay отправляет webhook на backend
   ↓
9. Backend обновляет Google Sheets: столбец X = "Оплачено"
   ↓
10. Пользователь возвращается на страницу успеха
   ↓
11. Показывается ссылка на Telegram чат
```

### 8. Проверка работоспособности

**1. Health Check:**
```bash
curl https://ucnominal.ru/api/health
```

Ответ:
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T...",
  "service": "APML Payment Server (CodeePay)"
}
```

**2. Тестовый платеж:**
```bash
curl -X POST https://ucnominal.ru/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "team_name": "Test Team",
    "captain_telegram": "@test",
    "group": "Группа А",
    "amount": 5000,
    "method": "sbp"
  }'
```

### 9. Структура Google Sheets

**ВАЖНО:** Нужен только столбец X!

| A | B | C | ... | W | **X** |
|---|---|---|-----|---|-------|
| Group_qual | TeamName | Captain | ... | Player5_ID | **payment_status** |
| Группа А | Test Team | @captain | ... | 123456 | **Оплачено** |

**Возможные статусы:**
- Пустое поле или "Не оплачено" - команда не оплатила
- "Ожидает оплаты" - платеж создан, ожидание оплаты
- "Оплачено" - оплата подтверждена

### 10. Развертывание

**Вариант А: VPS**
```bash
# На сервере
cd /var/www/apml/payment-server
npm install
cp .env.example .env
# Отредактируйте .env
npm install -g pm2
pm2 start server.js --name apml-payment
pm2 save
```

**Вариант Б: Railway / Render**
- Подключите GitHub репозиторий
- Добавьте переменные окружения через UI
- Загрузите credentials.json как Secret File
- Автоматический деплой

### 11. Важные замечания

✅ **Должно быть:**
- Домен ucnominal.ru для backend
- Публично доступный HTTPS endpoint
- Firewall разрешает 83.222.9.37 (webhook IP)
- credentials.json на сервере
- Столбец X добавлен в Google Sheets

❌ **Частые ошибки:**
- Webhook URL не публично доступен
- Неверный API ключ CodeePay
- Service Account нет в Google Sheets
- Столбец X не добавлен или неправильное название

### 12. Логи и отладка

**Просмотр логов:**
```bash
# PM2
pm2 logs apml-payment

# Railway/Render
# Смотрите в веб-интерфейсе раздел "Logs"
```

**Что искать в логах:**
- `🔔 Получен webhook от CodeePay` - приходит webhook
- `✅ Платеж создан` - успешное создание платежа
- `✅ Статус команды обновлен` - успешное обновление Google Sheets

### 13. Тестирование

1. Зарегистрируйте тестовую команду
2. Проверьте, что данные попали в Google Sheets
3. Перейдите на страницу оплаты
4. Создайте тестовый платеж (amount: 1)
5. Проверьте, что статус изменился на "Ожидает оплаты"
6. После оплаты проверьте статус "Оплачено"

### 14. Поддержка

**Документация:**
- [Полная инструкция](payment-server/README.md)
- [Google Sheets API](payment-server/GOOGLE_SHEETS_SETUP.md)
- [CodeePay API](https://api.codeepay.com/docs)

**Проблемы:**
- Webhook не приходит → проверьте firewall и домен
- Не обновляется Google Sheets → проверьте credentials.json и права
- Ошибка создания платежа → проверьте API ключ CodeePay

---

**Готово!** Система упрощена и готова к работе с CodeePay. 🚀
