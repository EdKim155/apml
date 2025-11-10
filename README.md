# APML Squad Masters - Payment Integration System

Полная система интеграции оплаты для турнира PUBG Mobile Squad Masters на платформе Tilda с использованием ЮKassa и Google Sheets.

## 📋 Обзор проекта

Этот репозиторий содержит все необходимые компоненты для реализации системы регистрации и оплаты участия в турнире:

- **Backend сервер** на Node.js/Express для обработки платежей
- **Frontend код** для Tilda (Zero Blocks) для всех страниц
- **Интеграция с ЮKassa** для приема платежей
- **Синхронизация с Google Sheets** для учета регистраций и оплат
- **Полная документация** по развертыванию и настройке

## 🎯 Возможности

✅ **Автоматическая регистрация команд**
- Форма регистрации на Tilda
- Автоматическое сохранение в Google Sheets
- Передача данных между страницами через localStorage

✅ **Обработка платежей**
- Интеграция с ЮKassa API
- Создание платежей с уникальным order_id
- Проверка на повторную оплату
- Webhook обработка для обновления статусов

✅ **Синхронизация данных**
- Автоматическое обновление статусов в Google Sheets
- Запись timestamp регистрации и оплаты
- Связь платежа с конкретной командой

✅ **Безопасность**
- Защита от прямого доступа к страницам оплаты
- Проверка данных перед созданием платежа
- Логирование всех операций

✅ **UX/UI**
- Информативные сообщения об ошибках
- Индикаторы загрузки
- Автоматическая проверка статуса оплаты
- Доступ к Telegram чату только после оплаты

## 📁 Структура проекта

```
apml/
├── payment-server/           # Backend сервер
│   ├── server.js            # Основной файл сервера
│   ├── package.json         # Зависимости Node.js
│   ├── .env.example         # Пример переменных окружения
│   ├── .gitignore          # Исключения для Git
│   ├── README.md           # Подробная документация сервера
│   └── GOOGLE_SHEETS_SETUP.md  # Инструкция по Google Sheets API
│
├── tilda-code/              # Код для Tilda Zero Blocks
│   ├── registration-page.html  # Код для страницы регистрации
│   ├── payment-page.html      # Код для страницы оплаты
│   └── success-page.html      # Код для страницы успеха
│
└── README.md               # Этот файл
```

## 🚀 Быстрый старт

### 1. Backend сервер

```bash
# Перейдите в директорию сервера
cd payment-server

# Установите зависимости
npm install

# Настройте переменные окружения
cp .env.example .env
# Отредактируйте .env и заполните необходимые значения

# Настройте Google Sheets API
# Следуйте инструкции в GOOGLE_SHEETS_SETUP.md

# Запустите сервер
npm start
```

### 2. Tilda интеграция

Для каждой страницы:

1. Откройте страницу в редакторе Tilda
2. Добавьте блок **T123: Zero Block**
3. Скопируйте код из соответствующего файла в `tilda-code/`
4. **Замените** `YOUR-BACKEND-URL` на ваш реальный URL сервера
5. Сохраните и опубликуйте

**Страницы:**
- Регистрация: `registration-page.html`
- Оплата: `payment-page.html`
- Успех: `success-page.html`

## 📚 Документация

### Основные документы

- 📖 [Полная инструкция по развертыванию](payment-server/README.md)
- 🔧 [Настройка Google Sheets API](payment-server/GOOGLE_SHEETS_SETUP.md)

### Быстрые ссылки

- [Установка и настройка backend](payment-server/README.md#быстрый-старт)
- [Развертывание на VPS](payment-server/README.md#вариант-a-vps-рекомендуется-для-продакшн)
- [Развертывание на Railway](payment-server/README.md#вариант-b-railwayapp-быстрое-развертывание)
- [Настройка Tilda](payment-server/README.md#шаг-4-настройка-tilda)
- [Тестирование](payment-server/README.md#тестирование)
- [Устранение неполадок](payment-server/README.md#устранение-неполадок)

## 🔗 URL страниц турнира

- **Основная страница:** https://apml.online/squad-masters-21-23nov2025
- **Регистрация (Группа А):** https://apml.online/squad-masters-reg-21nov2025-group-a
- **Оплата (Группа А):** https://apml.online/groupa-payments-squad-masters-21nov
- **Успех (Группа А):** https://apml.online/groupa-reg-squad-masters-success-21nov
- **Google Sheets:** https://docs.google.com/spreadsheets/d/1xrEdEvfmxNlP-86PJJVn8QqeOXQbCvusguA_SHipwvI/edit

## 🛠️ Технологии

### Backend
- Node.js (>= 16.0.0)
- Express.js - веб-фреймворк
- Google APIs (googleapis) - интеграция с Google Sheets
- Axios - HTTP клиент для запросов к ЮKassa
- dotenv - управление переменными окружения
- CORS - обработка кросс-доменных запросов

### Frontend
- Vanilla JavaScript - без дополнительных фреймворков
- jQuery (из Tilda) - для работы с DOM и событиями
- localStorage API - для передачи данных между страницами
- Fetch API - для запросов к backend

### Интеграции
- **ЮKassa API** - платежная система
- **Google Sheets API** - хранение данных
- **Tilda Forms** - формы регистрации
- **Telegram** (опционально) - уведомления

## 📊 Поток данных

```
1. РЕГИСТРАЦИЯ
   Форма Tilda → Google Sheets (автоматически)
                ↓
   JavaScript обработчик → localStorage
                ↓
   Автоматический переход на страницу оплаты

2. ОПЛАТА
   Страница оплаты → Чтение из localStorage
                    ↓
   Кнопка "Оплатить" → POST /api/create-payment
                      ↓
   Backend → ЮKassa API (создание платежа)
           ↓
   Google Sheets (статус: "Ожидает оплаты")
           ↓
   Redirect → Страница оплаты ЮKassa

3. ПОДТВЕРЖДЕНИЕ
   ЮKassa → Webhook → POST /api/payment-callback
                    ↓
   Backend → Google Sheets (статус: "Оплачено")
           ↓
   Пользователь → return_url → Страница успеха

4. УСПЕХ
   Страница успеха → GET /api/check-payment
                   ↓
   Проверка статуса → Показ ссылки на Telegram
                    ↓
   Очистка localStorage
```

## 🔑 Переменные окружения

Основные переменные в `.env`:

```env
# Сервер
PORT=3000
NODE_ENV=production

# Google Sheets
GOOGLE_SPREADSHEET_ID=1xrEdEvfmxNlP-86PJJVn8QqeOXQbCvusguA_SHipwvI
GOOGLE_SHEET_NAME=Лист1
GOOGLE_CREDENTIALS_PATH=./credentials.json

# ЮKassa
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_API_KEY=ваш_api_key
YOOKASSA_SEND_RECEIPT=false

# URLs
BACKEND_URL=https://ваш-домен.com
FRONTEND_SUCCESS_URL=https://apml.online/groupa-reg-squad-masters-success-21nov

# Telegram (опционально)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 🧪 Тестирование

### Локальное тестирование backend

```bash
# Health check
curl http://localhost:3000/api/health

# Тест создания платежа
curl -X POST http://localhost:3000/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "team_name": "Test Team",
    "captain_telegram": "@test",
    "group": "Группа А",
    "amount": 5000,
    "success_url": "https://apml.online/groupa-reg-squad-masters-success-21nov",
    "registration_timestamp": 1699999999999
  }'
```

### Тестовые карты ЮKassa

- **Успешная оплата:** 5555 5555 5555 4477
- **Отклоненная оплата:** 5555 5555 5555 4444
- CVV: любой трехзначный код
- Срок: любая будущая дата

## 📝 Чеклист для развертывания

### Google Sheets
- [ ] Проект создан в Google Cloud Console
- [ ] Google Sheets API включен
- [ ] Service Account создан
- [ ] credentials.json скачан
- [ ] Service Account добавлен в Google Sheets
- [ ] Столбцы X, Y, Z, AA добавлены в таблицу

### ЮKassa
- [ ] Аккаунт зарегистрирован
- [ ] Верификация пройдена
- [ ] API ключи получены (shopId, Secret Key)
- [ ] Webhook URL настроен

### Backend
- [ ] Сервер развернут (VPS/Railway/Render)
- [ ] Зависимости установлены (npm install)
- [ ] .env файл настроен
- [ ] credentials.json загружен на сервер
- [ ] Сервер запущен и доступен
- [ ] SSL сертификат установлен (для webhook)
- [ ] Health endpoint работает

### Tilda
- [ ] Код добавлен на страницу регистрации
- [ ] Код добавлен на страницу оплаты
- [ ] Код добавлен на страницу успеха
- [ ] BACKEND_API_URL заменен на реальный URL
- [ ] Ссылка на Telegram чат настроена
- [ ] Все страницы опубликованы

### Тестирование
- [ ] Полный flow протестирован (регистрация → оплата → успех)
- [ ] Тестовая оплата прошла успешно
- [ ] Данные записываются в Google Sheets
- [ ] Webhook от ЮKassa работает
- [ ] Статусы обновляются корректно
- [ ] Ссылка на Telegram чат показывается после оплаты

## 📞 Поддержка

### Полезные ресурсы

- 📖 [Документация ЮKassa API](https://yookassa.ru/developers/api)
- 📖 [Документация Google Sheets API](https://developers.google.com/sheets/api)
- 📖 [Документация Tilda](https://help.tilda.cc)

### Контакты

Если у вас возникли вопросы:

1. Проверьте раздел [Troubleshooting](payment-server/README.md#устранение-неполадок)
2. Просмотрите логи сервера: `pm2 logs apml-payment`
3. Проверьте Console браузера (F12) для frontend ошибок
4. Проверьте Network tab для анализа API запросов

## 📄 Лицензия

MIT License

## 👥 Авторы

**APML Team**

---

**Версия:** 1.0.0
**Дата:** 2025-11-10
**Статус:** Production Ready
