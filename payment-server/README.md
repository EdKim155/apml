# APML Squad Masters - Payment Integration

Полная интеграция системы оплаты для турнира Squad Masters на платформе Tilda с использованием ЮKassa и Google Sheets.

## 📋 Содержание

- [Обзор](#обзор)
- [Архитектура](#архитектура)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Подробная инструкция по развертыванию](#подробная-инструкция-по-развертыванию)
- [Настройка Tilda](#настройка-tilda)
- [Тестирование](#тестирование)
- [Устранение неполадок](#устранение-неполадок)

## 🎯 Обзор

Этот проект обеспечивает полную интеграцию оплаты для турнира PUBG Mobile Squad Masters:

**Функционал:**
- ✅ Регистрация команд через формы Tilda
- ✅ Автоматическая синхронизация с Google Sheets
- ✅ Создание платежей через ЮKassa API
- ✅ Обработка webhook уведомлений
- ✅ Проверка статуса оплаты
- ✅ Доступ к закрытому Telegram чату после оплаты

**Поток данных:**
```
Форма регистрации (Tilda)
    ↓
Google Sheets (автоматическая запись)
    ↓
Страница оплаты (localStorage → Backend API)
    ↓
ЮKassa (платежная система)
    ↓
Webhook → Backend → Google Sheets (обновление статуса)
    ↓
Страница успеха → Telegram чат
```

## 🏗️ Архитектура

### Backend сервер (Node.js/Express)
- `server.js` - основной файл сервера
- Endpoints:
  - `POST /api/create-payment` - создание платежа
  - `POST /api/payment-callback` - webhook от ЮKassa
  - `GET /api/check-payment/:teamName` - проверка статуса по команде
  - `GET /api/check-order/:orderId` - проверка статуса по заказу

### Frontend (Tilda Zero Blocks)
- `registration-page.html` - код для страницы регистрации
- `payment-page.html` - код для страницы оплаты
- `success-page.html` - код для страницы успеха

### Интеграции
- **Google Sheets API** - хранение данных регистраций
- **ЮKassa API** - обработка платежей
- **Telegram** (опционально) - уведомления об оплате

## 📦 Требования

### Обязательные
- Node.js >= 16.0.0
- npm или yarn
- Аккаунт ЮKassa (https://yookassa.ru)
- Google Cloud Platform аккаунт
- Доступ к редактированию сайта на Tilda

### Опциональные
- VPS сервер или облачный хостинг (Railway, Render, Heroku)
- Telegram Bot (для уведомлений)
- Домен с SSL сертификатом

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
# Перейдите в директорию payment-server
cd payment-server

# Установите зависимости
npm install

# Создайте файл .env
cp .env.example .env
```

### 2. Настройка переменных окружения

Отредактируйте `.env` и заполните необходимые значения:

```env
# Server
PORT=3000
NODE_ENV=production

# Google Sheets
GOOGLE_SPREADSHEET_ID=1xrEdEvfmxNlP-86PJJVn8QqeOXQbCvusguA_SHipwvI
GOOGLE_SHEET_NAME=Лист1
GOOGLE_CREDENTIALS_PATH=./credentials.json

# YooKassa
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_API_KEY=ваш_api_key

# URLs
BACKEND_URL=https://ваш-домен.com
FRONTEND_SUCCESS_URL=https://apml.online/groupa-reg-squad-masters-success-21nov
```

### 3. Настройка Google Sheets API

См. файл [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)

### 4. Запуск сервера

```bash
# Локальный запуск для разработки
npm run dev

# Продакшн запуск
npm start
```

Сервер запустится на `http://localhost:3000`

### 5. Проверка работоспособности

```bash
# Проверьте health endpoint
curl http://localhost:3000/api/health
```

Должен вернуть:
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T...",
  "service": "APML Payment Server"
}
```

## 📖 Подробная инструкция по развертыванию

### Шаг 1: Настройка Google Cloud и Sheets API

#### 1.1 Создание проекта в Google Cloud Console

1. Перейдите на https://console.cloud.google.com
2. Нажмите "Select a project" → "New Project"
3. Введите название: "APML Payment Integration"
4. Нажмите "Create"

#### 1.2 Включение Google Sheets API

1. В боковом меню выберите "APIs & Services" → "Library"
2. Найдите "Google Sheets API"
3. Нажмите "Enable"

#### 1.3 Создание Service Account

1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "Service Account"
3. Заполните:
   - Service account name: `payment-bot`
   - Service account ID: `payment-bot`
   - Description: `Bot for APML payment processing`
4. Нажмите "Create and Continue"
5. В "Grant this service account access to project":
   - Role: Editor (или Viewer, если нужен только доступ на чтение)
6. Нажмите "Continue" → "Done"

#### 1.4 Создание ключа (credentials.json)

1. В списке Service Accounts найдите созданный аккаунт
2. Нажмите на него
3. Перейдите во вкладку "Keys"
4. Нажмите "Add Key" → "Create new key"
5. Выберите "JSON"
6. Нажмите "Create"
7. Файл `credentials.json` автоматически скачается
8. Переместите файл в директорию `payment-server/`

#### 1.5 Предоставление доступа к таблице

1. Откройте файл `credentials.json`
2. Найдите поле `"client_email"`, скопируйте email (вида `payment-bot@project-name.iam.gserviceaccount.com`)
3. Откройте вашу Google Sheets таблицу:
   https://docs.google.com/spreadsheets/d/1xrEdEvfmxNlP-86PJJVn8QqeOXQbCvusguA_SHipwvI/edit
4. Нажмите "Share" (Настройки доступа)
5. Добавьте скопированный email
6. Установите права: "Editor" (Редактор)
7. Снимите галочку "Notify people" (чтобы не отправлять email)
8. Нажмите "Share"

#### 1.6 Добавление столбца в Google Sheets

**ВАЖНО:** Нужен только ОДИН столбец Y!

Откройте таблицу и добавьте столбец Y после существующих:

| Столбец | Название | Описание |
|---------|----------|----------|
| Y | payment_status | Статус оплаты (Ожидает оплаты / Оплачено) |

### Шаг 2: Настройка ЮKassa

#### 2.1 Регистрация в ЮKassa

1. Перейдите на https://yookassa.ru
2. Нажмите "Подключить ЮKassa"
3. Заполните форму регистрации
4. Пройдите верификацию (потребуются документы компании/ИП)

#### 2.2 Получение API ключей

1. Войдите в личный кабинет ЮKassa
2. Перейдите в "Настройки" → "Протокол API"
3. В разделе "HTTP-уведомления" нажмите "Создать ключ"
4. Сохраните:
   - **shopId** (идентификатор магазина)
   - **Секретный ключ** (Secret Key)

⚠️ **ВАЖНО:** Сохраните секретный ключ в безопасном месте! Он показывается только один раз.

#### 2.3 Настройка webhook

1. В разделе "HTTP-уведомления" нажмите "Добавить"
2. Введите URL вашего сервера:
   ```
   https://ваш-домен.com/api/payment-callback
   ```
3. Выберите события:
   - ✅ Успешный платеж (payment.succeeded)
   - ✅ Отмена платежа (payment.canceled)
4. Нажмите "Сохранить"

#### 2.4 Настройка тестового режима (опционально)

Для тестирования используйте тестовые ключи:
1. В личном кабинете переключитесь в "Тестовый режим"
2. Получите тестовые shopId и Secret Key
3. Используйте их в `.env` для тестирования

**Тестовые карты ЮKassa:**
- Успешная оплата: `5555 5555 5555 4477`
- Отклоненная оплата: `5555 5555 5555 4444`
- CVV: любой трехзначный код
- Срок: любая будущая дата

### Шаг 3: Развертывание Backend сервера

#### Вариант A: VPS (рекомендуется для продакшн)

**3.1 Подключение к серверу**

```bash
ssh user@your-server-ip
```

**3.2 Установка Node.js**

```bash
# Для Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка установки
node --version
npm --version
```

**3.3 Клонирование кода**

```bash
# Создайте директорию для проекта
mkdir -p /var/www/apml
cd /var/www/apml

# Скопируйте файлы вашего проекта
# (через git, scp, или другой способ)
```

**3.4 Установка зависимостей**

```bash
cd payment-server
npm install --production
```

**3.5 Настройка .env**

```bash
# Создайте .env файл
nano .env

# Вставьте ваши настройки и сохраните (Ctrl+X, Y, Enter)
```

**3.6 Загрузка credentials.json**

```bash
# Загрузите credentials.json на сервер
# Например, через scp:
scp credentials.json user@your-server-ip:/var/www/apml/payment-server/
```

**3.7 Установка PM2 (процесс-менеджер)**

```bash
# Установка PM2 глобально
sudo npm install -g pm2

# Запуск приложения
pm2 start server.js --name apml-payment

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save

# Просмотр логов
pm2 logs apml-payment

# Проверка статуса
pm2 status
```

**3.8 Настройка Nginx (для SSL и проксирования)**

```bash
# Установка Nginx
sudo apt-get install nginx

# Создание конфигурации
sudo nano /etc/nginx/sites-available/apml-payment
```

Вставьте конфигурацию:

```nginx
server {
    listen 80;
    server_name ваш-домен.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/apml-payment /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**3.9 Настройка SSL с Let's Encrypt**

```bash
# Установка Certbot
sudo apt-get install certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d ваш-домен.com

# Автопродление сертификата
sudo certbot renew --dry-run
```

#### Вариант B: Railway.app (быстрое развертывание)

**3.1 Подготовка проекта**

1. Создайте файл `railway.json` в корне `payment-server/`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**3.2 Развертывание**

1. Перейдите на https://railway.app
2. Войдите через GitHub
3. Нажмите "New Project" → "Deploy from GitHub repo"
4. Выберите ваш репозиторий
5. Railway автоматически обнаружит Node.js проект

**3.3 Настройка переменных окружения**

1. В проекте Railway перейдите в "Variables"
2. Добавьте все переменные из `.env`:
   - `PORT=3000`
   - `NODE_ENV=production`
   - `GOOGLE_SPREADSHEET_ID=...`
   - `YOOKASSA_SHOP_ID=...`
   - и т.д.

**3.4 Загрузка credentials.json**

1. Закодируйте содержимое `credentials.json` в base64:
   ```bash
   cat credentials.json | base64
   ```
2. В Railway добавьте переменную:
   - `GOOGLE_CREDENTIALS_BASE64=<результат base64>`
3. Измените `server.js` для декодирования:
   ```javascript
   // В начале функции authorizeSheets()
   if (process.env.GOOGLE_CREDENTIALS_BASE64) {
     const credentials = Buffer.from(
       process.env.GOOGLE_CREDENTIALS_BASE64,
       'base64'
     ).toString('utf-8');
     const auth = new google.auth.GoogleAuth({
       credentials: JSON.parse(credentials),
       scopes: ['https://www.googleapis.com/auth/spreadsheets'],
     });
     return google.sheets({ version: 'v4', auth });
   }
   ```

**3.5 Получение URL**

1. После деплоя Railway предоставит URL вида: `https://your-app.up.railway.app`
2. Используйте этот URL как `BACKEND_URL` в настройках

#### Вариант C: Render.com

1. Перейдите на https://render.com
2. Создайте новый "Web Service"
3. Подключите GitHub репозиторий
4. Настройки:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Добавьте переменные окружения
6. Загрузите credentials.json как Secret File

### Шаг 4: Настройка Tilda

#### 4.1 Страница регистрации

1. Откройте страницу в редакторе:
   https://apml.online/squad-masters-reg-21nov2025-group-a
2. Добавьте блок **T123: Zero Block** после формы регистрации
3. В HTML-редакторе Zero Block вставьте код из `tilda-code/registration-page.html`
4. Сохраните и опубликуйте страницу

#### 4.2 Страница оплаты

1. Откройте страницу:
   https://apml.online/groupa-payments-squad-masters-21nov
2. Добавьте блок **T123: Zero Block**
3. Вставьте код из `tilda-code/payment-page.html`
4. **ВАЖНО:** Найдите строку:
   ```javascript
   const BACKEND_API_URL = 'https://YOUR-BACKEND-URL.com';
   ```
5. Замените `YOUR-BACKEND-URL.com` на ваш реальный URL сервера
6. Сохраните и опубликуйте

#### 4.3 Страница успеха

1. Откройте страницу:
   https://apml.online/groupa-reg-squad-masters-success-21nov
2. Добавьте блок **T123: Zero Block**
3. Вставьте код из `tilda-code/success-page.html`
4. Замените `YOUR-BACKEND-URL.com` на ваш URL
5. **Настройка ссылки на Telegram:**
   - Добавьте на странице ссылку на Telegram чат
   - Установите для ссылки `style="display:none"`
   - Добавьте ID: `id="telegram-chat-link"`
   - Или просто используйте href с `t.me` - скрипт найдет автоматически
6. Сохраните и опубликуйте

## 🧪 Тестирование

### Тест 1: Проверка backend сервера

```bash
# Health check
curl https://ваш-домен.com/api/health

# Проверка создания платежа
curl -X POST https://ваш-домен.com/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "team_name": "Test Team",
    "captain_telegram": "@test",
    "group": "Группа А",
    "amount": 5000,
    "success_url": "https://apml.online/groupa-reg-squad-masters-success-21nov",
    "registration_timestamp": 1234567890
  }'
```

### Тест 2: Полный flow регистрации и оплаты

1. **Регистрация:**
   - Откройте страницу регистрации
   - Откройте DevTools (F12) → Console
   - Заполните форму и отправьте
   - В консоли должны появиться сообщения:
     ```
     ✅ Скрипт обработки регистрации загружен
     🎉 Форма успешно отправлена!
     ✅ Данные сохранены в localStorage
     🔄 Перенаправление на страницу оплаты...
     ```
   - Проверьте Google Sheets - должна появиться новая запись

2. **Оплата:**
   - Вы должны автоматически перейти на страницу оплаты
   - Проверьте, что отображается информация о команде
   - Нажмите кнопку "Оплатить"
   - В консоли:
     ```
     🔘 Нажата кнопка оплаты
     📤 Отправка запроса на создание платежа
     ✅ Платеж создан
     ✅ Перенаправление на страницу оплаты...
     ```
   - Вы будете перенаправлены на страницу ЮKassa
   - Проверьте Google Sheets - статус должен быть "Ожидает оплаты"

3. **Тестовая оплата:**
   - Используйте тестовую карту: `5555 5555 5555 4477`
   - CVV: любой
   - Срок: любая будущая дата
   - Завершите оплату

4. **Страница успеха:**
   - После оплаты вы вернетесь на страницу успеха
   - Должен появиться зеленый блок "Оплата успешно завершена"
   - Ссылка на Telegram чат должна стать видимой
   - Проверьте Google Sheets - статус должен быть "Оплачено"

### Тест 3: Проверка webhook

```bash
# Просмотр логов на сервере
pm2 logs apml-payment

# Или в Railway/Render - откройте раздел Logs

# После тестовой оплаты в логах должно появиться:
# 🔔 Получен webhook от ЮKassa
# ✅ Платеж успешно проведен
# ✅ Статус команды "Test Team" обновлен на "Оплачено"
```

## 🔧 Устранение неполадок

### Проблема: "Данные регистрации не найдены"

**Причина:** localStorage пуст или данные не передались

**Решение:**
1. Откройте DevTools → Application → Local Storage
2. Проверьте наличие ключа `apml_registration_data`
3. Если его нет - пройдите регистрацию заново
4. Убедитесь, что скрипт на странице регистрации работает (смотрите Console)

### Проблема: "Ошибка создания платежа"

**Причина:** Backend недоступен или неверные ключи ЮKassa

**Решение:**
1. Проверьте, что backend сервер запущен:
   ```bash
   curl https://ваш-домен.com/api/health
   ```
2. Проверьте логи сервера:
   ```bash
   pm2 logs apml-payment
   ```
3. Проверьте переменные окружения `.env`
4. Убедитесь, что YOOKASSA_SHOP_ID и YOOKASSA_API_KEY корректные

### Проблема: "Команда уже оплатила участие"

**Причина:** В Google Sheets уже есть запись с статусом "Оплачено" для этой команды

**Решение:**
1. Откройте Google Sheets
2. Найдите команду по названию
3. Проверьте столбец payment_status (Y)
4. Если нужно - измените статус вручную или удалите запись

### Проблема: Webhook не приходит от ЮKassa

**Причина:** Неверный URL webhook или сервер недоступен извне

**Решение:**
1. Проверьте настройки webhook в личном кабинете ЮKassa
2. URL должен быть публично доступен (не localhost!)
3. Проверьте, что endpoint `/api/payment-callback` работает:
   ```bash
   curl https://ваш-домен.com/api/payment-callback
   ```
4. Проверьте firewall - порт должен быть открыт

### Проблема: "Не удается обновить Google Sheets"

**Причина:** Неверные credentials или нет доступа к таблице

**Решение:**
1. Проверьте, что `credentials.json` существует
2. Проверьте, что Service Account имеет доступ к таблице
3. В Google Sheets проверьте список пользователей с доступом
4. Убедитесь, что email из credentials.json есть в списке
5. Проверьте GOOGLE_SPREADSHEET_ID в `.env`

### Проблема: CORS ошибки

**Причина:** Backend не разрешает запросы с домена Tilda

**Решение:**
1. Откройте `server.js`
2. Проверьте настройки CORS:
   ```javascript
   app.use(cors({
     origin: ['https://apml.online', 'http://apml.online'],
     methods: ['GET', 'POST'],
     credentials: true
   }));
   ```
3. Добавьте ваш домен в список `origin`, если нужно

## 📞 Поддержка

Если у вас возникли вопросы:

1. Проверьте [Troubleshooting](#устранение-неполадок)
2. Просмотрите логи сервера
3. Проверьте Console в браузере (DevTools)
4. Проверьте Network tab для запросов API

## 📄 Лицензия

MIT License

---

**Автор:** APML Team
**Дата:** 2025-11-10
**Версия:** 1.0.0
