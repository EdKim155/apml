# Настройка Google Sheets API

Подробная пошаговая инструкция по настройке Google Sheets API для интеграции с платежной системой APML Squad Masters.

## 📋 Содержание

1. [Создание проекта в Google Cloud Console](#1-создание-проекта-в-google-cloud-console)
2. [Включение Google Sheets API](#2-включение-google-sheets-api)
3. [Создание Service Account](#3-создание-service-account)
4. [Получение credentials.json](#4-получение-credentialsjson)
5. [Предоставление доступа к таблице](#5-предоставление-доступа-к-таблице)
6. [Настройка таблицы](#6-настройка-таблицы)
7. [Проверка работоспособности](#7-проверка-работоспособности)
8. [Устранение неполадок](#8-устранение-неполадок)

---

## 1. Создание проекта в Google Cloud Console

### Шаг 1.1: Переход в Google Cloud Console

1. Откройте браузер и перейдите по ссылке:
   ```
   https://console.cloud.google.com
   ```

2. Войдите в свой Google аккаунт (если еще не вошли)

### Шаг 1.2: Создание нового проекта

1. В верхней части страницы нажмите на выпадающий список с названием проекта
   (по умолчанию будет написано "Select a project")

2. В открывшемся окне нажмите кнопку **"NEW PROJECT"** (Создать проект)

3. Заполните форму создания проекта:
   - **Project name:** `APML Payment Integration`
   - **Location:** оставьте "No organization" (если нет организации)

4. Нажмите кнопку **"CREATE"** (Создать)

5. Дождитесь создания проекта (обычно 10-30 секунд)

6. Выберите созданный проект в выпадающем списке

### Шаг 1.3: Проверка выбранного проекта

Убедитесь, что в верхней части страницы отображается название вашего проекта:
```
APML Payment Integration
```

---

## 2. Включение Google Sheets API

### Шаг 2.1: Переход в библиотеку API

1. В левом боковом меню найдите раздел **"APIs & Services"** (API и сервисы)

2. Нажмите на **"Library"** (Библиотека)

   Или перейдите напрямую:
   ```
   https://console.cloud.google.com/apis/library
   ```

### Шаг 2.2: Поиск Google Sheets API

1. В строке поиска вверху страницы введите:
   ```
   Google Sheets API
   ```

2. Нажмите Enter или кликните на иконку поиска

3. В результатах найдите **"Google Sheets API"** с иконкой зеленой таблицы

4. Кликните на карточку API

### Шаг 2.3: Включение API

1. На странице Google Sheets API нажмите синюю кнопку **"ENABLE"** (Включить)

2. Дождитесь активации API (5-10 секунд)

3. После активации вы будете перенаправлены на страницу с информацией об API

**Статус:** API должен быть активирован. Вы увидите сообщение:
```
API enabled
```

---

## 3. Создание Service Account

Service Account - это специальный аккаунт для автоматизированного доступа к Google API без участия пользователя.

### Шаг 3.1: Переход в раздел Credentials

1. В левом боковом меню выберите:
   **APIs & Services** → **Credentials** (Учетные данные)

   Или перейдите напрямую:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

### Шаг 3.2: Создание нового Service Account

1. Нажмите кнопку **"+ CREATE CREDENTIALS"** вверху страницы

2. В выпадающем меню выберите **"Service account"**

### Шаг 3.3: Заполнение информации о Service Account

**Экран 1: Service account details**

1. Заполните поля:
   - **Service account name:** `payment-bot`
   - **Service account ID:** `payment-bot` (заполнится автоматически)
   - **Service account description:** `Bot for APML payment processing and Google Sheets integration`

2. Нажмите **"CREATE AND CONTINUE"**

**Экран 2: Grant this service account access to project**

1. В поле **"Select a role"** начните вводить: `Editor`

2. Выберите роль **"Editor"** (Редактор)
   - Путь: `Basic` → `Editor`

   **Примечание:** Если вам нужен только доступ на чтение/запись таблицы, можно выбрать:
   - `Project` → `Viewer` (Просмотр)

   Но рекомендуется `Editor` для полного контроля.

3. Нажмите **"CONTINUE"**

**Экран 3: Grant users access to this service account** (необязательно)

1. Это необязательный шаг, можете оставить поля пустыми

2. Нажмите **"DONE"**

### Шаг 3.4: Проверка созданного Service Account

Вы должны увидеть созданный Service Account в списке:

```
payment-bot@apml-payment-integration.iam.gserviceaccount.com
```

**Важно:** Запомните или скопируйте этот email - он понадобится на следующем шаге!

---

## 4. Получение credentials.json

### Шаг 4.1: Создание ключа

1. В списке Service Accounts найдите созданный аккаунт `payment-bot`

2. Кликните на email или название Service Account

3. Вы попадете на страницу деталей Service Account

4. Перейдите на вкладку **"KEYS"** (Ключи)

### Шаг 4.2: Генерация JSON ключа

1. Нажмите кнопку **"ADD KEY"** → **"Create new key"**

2. В открывшемся окне выберите тип ключа:
   - ✅ **JSON** (рекомендуется)
   - ❌ P12 (не выбирайте)

3. Нажмите **"CREATE"**

4. Файл `credentials.json` автоматически скачается на ваш компьютер

### Шаг 4.3: Сохранение файла

1. Найдите скачанный файл в папке загрузок
   - Обычно называется: `apml-payment-integration-xxxxx.json`

2. Переименуйте файл в:
   ```
   credentials.json
   ```

3. Переместите файл в директорию вашего проекта:
   ```
   payment-server/credentials.json
   ```

### Шаг 4.4: Проверка содержимого файла

Откройте `credentials.json` в текстовом редакторе. Файл должен содержать:

```json
{
  "type": "service_account",
  "project_id": "apml-payment-integration",
  "private_key_id": "xxxxx...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "payment-bot@apml-payment-integration.iam.gserviceaccount.com",
  "client_id": "xxxxx...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

**Важные поля:**
- `client_email` - email Service Account (понадобится для Google Sheets)
- `private_key` - приватный ключ (НЕ ДЕЛИТЕСЬ НИМ!)

⚠️ **БЕЗОПАСНОСТЬ:**
- НЕ публикуйте этот файл в Git!
- НЕ отправляйте его по незащищенным каналам!
- Добавьте `credentials.json` в `.gitignore`

---

## 5. Предоставление доступа к таблице

Теперь нужно дать Service Account доступ к вашей Google Sheets таблице.

### Шаг 5.1: Получение email Service Account

1. Откройте файл `credentials.json`

2. Найдите поле `"client_email"` и скопируйте его значение

   Например:
   ```
   payment-bot@apml-payment-integration.iam.gserviceaccount.com
   ```

### Шаг 5.2: Открытие Google Sheets

1. Откройте вашу таблицу с регистрациями:
   ```
   https://docs.google.com/spreadsheets/d/1xrEdEvfmxNlP-86PJJVn8QqeOXQbCvusguA_SHipwvI/edit
   ```

2. Убедитесь, что вы вошли в аккаунт с правами редактирования

### Шаг 5.3: Предоставление доступа

1. В правом верхнем углу таблицы нажмите кнопку **"Share"** (Настройки доступа)

2. В открывшемся окне в поле **"Add people and groups"** вставьте email Service Account:
   ```
   payment-bot@apml-payment-integration.iam.gserviceaccount.com
   ```

3. Справа от email выберите роль:
   - ✅ **Editor** (Редактор) - рекомендуется
   - или **Viewer** (Просмотр) - если нужен только доступ на чтение

4. **ВАЖНО:** Снимите галочку **"Notify people"** (Уведомить людей)
   - Иначе Google попытается отправить email на адрес Service Account

5. Нажмите **"Share"** или **"Send"**

### Шаг 5.4: Проверка доступа

1. В таблице нажмите **"Share"** еще раз

2. В списке "People with access" должен появиться Service Account:
   ```
   payment-bot@apml-payment-integration.iam.gserviceaccount.com (Editor)
   ```

**Готово!** Service Account теперь имеет доступ к таблице.

---

## 6. Настройка таблицы

### Шаг 6.1: Проверка существующих столбцов

Откройте таблицу и проверьте наличие следующих столбцов (они должны быть уже созданы формой Tilda):

| Столбец | Название поля | Описание |
|---------|---------------|----------|
| A | Group_qual | Группа квалификации |
| B | TeamName | Название команды |
| C | nickname_Telegram_captain | Telegram капитана |
| D | Nick_Pubg_captain | Nick PUBG капитана |
| E | id_Pubg_captain | ID PUBG капитана |
| F-N | (игроки 2-4) | Данные остальных игроков |
| O-W | (дополнительные) | Дополнительные поля |

### Шаг 6.2: Добавление нового столбца для оплаты

**ВАЖНО:** Нужен только ОДИН столбец Y!

Добавьте столбец Y после существующих столбцов:

#### Столбец Y: payment_status
- **Заголовок:** `payment_status`
- **Описание:** Статус оплаты
- **Возможные значения:**
  - `Ожидает оплаты` - платеж создан, ожидание оплаты
  - `Оплачено` - оплата подтверждена
  - Пустое поле или `Не оплачено` - команда не оплатила

### Шаг 6.3: Пример структуры

Итоговая структура таблицы должна выглядеть так:

```
| A | B | C | ... | X | Y |
| Group | Team | Captain | ... | Player5_ID | payment_status |
```

### Шаг 6.4: Настройка форматирования (опционально)

Для удобства можно настроить:

1. **Условное форматирование для столбца payment_status:**
   - Выделите столбец Y
   - Формат → Условное форматирование
   - Добавьте правила:
     - "Оплачено" → зеленый фон
     - "Ожидает оплаты" → желтый фон

2. **Защита столбца:**
   - Выделите столбец Y
   - Правый клик → Защитить диапазон
   - Это предотвратит случайное редактирование данных оплаты

### Шаг 6.5: Определение имени листа

1. В нижней части таблицы посмотрите название листа (вкладки)
   - Обычно это "Лист1" или "Sheet1"

2. Если название другое, запомните его

3. Это название нужно будет указать в `.env`:
   ```env
   GOOGLE_SHEET_NAME=Лист1
   ```

### Шаг 6.6: Получение ID таблицы

ID таблицы находится в URL:

```
https://docs.google.com/spreadsheets/d/[ID_ТАБЛИЦЫ]/edit
                                        ↑
                                   Скопируйте это
```

Например, для вашей таблицы:
```
https://docs.google.com/spreadsheets/d/1xrEdEvfmxNlP-86PJJVn8QqeOXQbCvusguA_SHipwvI/edit
```

ID таблицы:
```
1xrEdEvfmxNlP-86PJJVn8QqeOXQbCvusguA_SHipwvI
```

Этот ID нужно указать в `.env`:
```env
GOOGLE_SPREADSHEET_ID=1xrEdEvfmxNlP-86PJJVn8QqeOXQbCvusguA_SHipwvI
```

---

## 7. Проверка работоспособности

### Шаг 7.1: Настройка .env файла

В файле `payment-server/.env` убедитесь, что указаны корректные значения:

```env
GOOGLE_SPREADSHEET_ID=1xrEdEvfmxNlP-86PJJVn8QqeOXQbCvusguA_SHipwvI
GOOGLE_SHEET_NAME=Лист1
GOOGLE_CREDENTIALS_PATH=./credentials.json
```

### Шаг 7.2: Тестовый скрипт

Создайте файл `test-sheets.js` в директории `payment-server/`:

```javascript
require('dotenv').config();
const { google } = require('googleapis');

async function testGoogleSheets() {
  try {
    console.log('🔍 Тестирование подключения к Google Sheets...\n');

    // Авторизация
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('✅ Авторизация успешна\n');

    // Чтение данных
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: `${process.env.GOOGLE_SHEET_NAME}!A1:AA1`,
    });

    console.log('✅ Подключение к таблице успешно\n');
    console.log('📊 Заголовки столбцов:');
    console.log(response.data.values[0]);

    console.log('\n✅ Все работает корректно!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

testGoogleSheets();
```

Запустите тест:

```bash
node test-sheets.js
```

**Ожидаемый результат:**

```
🔍 Тестирование подключения к Google Sheets...

✅ Авторизация успешна

✅ Подключение к таблице успешно

📊 Заголовки столбцов:
[
  'Group_qual',
  'TeamName',
  'nickname_Telegram_captain',
  ...
  'payment_status',
  'payment_order_id',
  'payment_timestamp',
  'registration_timestamp'
]

✅ Все работает корректно!
```

### Шаг 7.3: Тест записи данных

Добавьте в `test-sheets.js` функцию для теста записи:

```javascript
async function testWrite() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: './credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Запись тестовых данных
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: `${process.env.GOOGLE_SHEET_NAME}!A:AA`,
      valueInputOption: 'RAW',
      resource: {
        values: [[
          'Тест',
          'Test Team',
          '@test_captain',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          'Ожидает оплаты',
          'TEST_ORDER_123',
          '',
          Date.now().toString()
        ]]
      }
    });

    console.log('✅ Запись в таблицу прошла успешно!');
    console.log('Проверьте таблицу - должна появиться новая строка с "Test Team"');

  } catch (error) {
    console.error('❌ Ошибка записи:', error.message);
  }
}

// Раскомментируйте для теста записи:
// testWrite();
```

---

## 8. Устранение неполадок

### Проблема: "Error: Could not load the default credentials"

**Причина:** Файл `credentials.json` не найден или указан неверный путь

**Решение:**
1. Проверьте, что файл `credentials.json` существует в директории `payment-server/`
2. Проверьте путь в `.env`:
   ```env
   GOOGLE_CREDENTIALS_PATH=./credentials.json
   ```
3. Попробуйте указать абсолютный путь:
   ```env
   GOOGLE_CREDENTIALS_PATH=/home/user/apml/payment-server/credentials.json
   ```

### Проблема: "Error: The caller does not have permission"

**Причина:** Service Account не имеет доступа к таблице

**Решение:**
1. Откройте Google Sheets
2. Нажмите "Share"
3. Проверьте, что email Service Account есть в списке с правами "Editor"
4. Если нет - добавьте его еще раз
5. Скопируйте email точно из `credentials.json` поля `client_email`

### Проблема: "Error: Requested entity was not found"

**Причина:** Неверный ID таблицы или название листа

**Решение:**
1. Проверьте `GOOGLE_SPREADSHEET_ID` в `.env`
2. Скопируйте ID из URL таблицы еще раз
3. Проверьте `GOOGLE_SHEET_NAME` - оно должно точно совпадать с названием листа (включая регистр)

### Проблема: "Error: Invalid JSON in credentials file"

**Причина:** Файл `credentials.json` поврежден или содержит ошибки

**Решение:**
1. Откройте файл в текстовом редакторе
2. Проверьте, что это валидный JSON (можно использовать jsonlint.com)
3. Если файл поврежден - скачайте его заново из Google Cloud Console
4. Убедитесь, что при копировании файла не были добавлены лишние символы

### Проблема: "403: The API is not enabled for your project"

**Причина:** Google Sheets API не включен для проекта

**Решение:**
1. Перейдите в Google Cloud Console
2. Выберите ваш проект
3. APIs & Services → Library
4. Найдите "Google Sheets API"
5. Нажмите "Enable"
6. Дождитесь активации (5-10 секунд)

### Проблема: Данные не записываются в нужную строку

**Причина:** Неверная логика поиска строки в коде

**Решение:**
1. Проверьте, что в столбце B (TeamName) есть уникальные названия команд
2. Убедитесь, что registration_timestamp совпадает (в пределах ±2 минут)
3. Добавьте логирование в функцию `updateGoogleSheet` для отладки

### Проблема: Ошибка "ENOENT: no such file or directory"

**Причина:** Node.js не может найти файл `credentials.json`

**Решение:**
1. Убедитесь, что запускаете сервер из правильной директории:
   ```bash
   cd payment-server
   node server.js
   ```
2. Или используйте абсолютный путь в `.env`

---

## ✅ Чеклист финальной проверки

Перед запуском в продакшн убедитесь:

- ✅ Проект создан в Google Cloud Console
- ✅ Google Sheets API включен
- ✅ Service Account создан
- ✅ Файл `credentials.json` скачан и размещен в `payment-server/`
- ✅ Service Account добавлен в Google Sheets с правами "Editor"
- ✅ В таблице добавлен столбец Y (payment_status)
- ✅ В `.env` указаны правильные GOOGLE_SPREADSHEET_ID и GOOGLE_SHEET_NAME
- ✅ Тестовый скрипт `test-sheets.js` выполнен успешно
- ✅ Файл `credentials.json` добавлен в `.gitignore`

---

**Готово!** Google Sheets API настроен и готов к использованию.

Вернитесь к [README.md](./README.md) для продолжения настройки проекта.
