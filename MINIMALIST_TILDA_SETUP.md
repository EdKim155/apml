# Минималистичная установка скриптов на Tilda

## 🎯 Особенности

Все скрипты работают **ПОЛНОСТЬЮ В ФОНЕ** без визуальных элементов:
- ❌ Нет HTML блоков
- ❌ Нет индикаторов загрузки
- ❌ Нет сообщений об ошибках
- ✅ Только чистая логика в фоновом режиме
- ✅ Используются существующие элементы Tilda

## 📄 Установка скриптов

### 1. Страница регистрации
**URL:** https://apml.online/squad-masters-reg-21nov2025-group-a

**Что делает:**
- Перехватывает успешную отправку формы Tilda
- Сохраняет данные команды в localStorage
- Автоматически перенаправляет на страницу оплаты через 500ms

**Установка:**
1. Откройте страницу в редакторе Tilda
2. Добавьте блок **T123: Zero Block**
3. Вставьте весь код из `tilda-code/registration-page.html`
4. Сохраните и опубликуйте

**Код:**
```html
<script>
(function() {
  'use strict';
  const PAYMENT_PAGE_URL = 'https://apml.online/groupa-payments-squad-masters-21nov';

  $(document).on('tildaform:aftersuccess', function(event, form) {
    try {
      const formData = {};
      $(form).find('input, select, textarea').each(function() {
        const name = $(this).attr('name');
        const value = $(this).val();
        if (name && name !== 'tildaspec-cookie' && name !== 'tildaspec-referer') {
          formData[name] = value || '';
        }
      });

      if (!formData.TeamName || !formData.nickname_Telegram_captain) {
        return;
      }

      localStorage.setItem('apml_registration_data', JSON.stringify({
        TeamName: formData.TeamName,
        nickname_Telegram_captain: formData.nickname_Telegram_captain,
        Group_qual: formData.Group_qual || ''
      }));

      setTimeout(function() {
        window.location.href = PAYMENT_PAGE_URL;
      }, 500);
    } catch (error) {
      console.error('Ошибка обработки формы:', error);
    }
  });
})();
</script>
```

---

### 2. Страница оплаты
**URL:** https://apml.online/groupa-payments-squad-masters-21nov

**Что делает:**
- Читает данные из localStorage
- Находит кнопку оплаты на странице Tilda
- Перехватывает клик по кнопке
- Создает платеж через backend API
- Перенаправляет на страницу оплаты CodeePay

**Установка:**
1. Откройте страницу в редакторе Tilda
2. Добавьте блок **T123: Zero Block**
3. Вставьте весь код из `tilda-code/payment-page.html`
4. **ВАЖНО:** Замените `YOUR-BACKEND-URL` на `https://ucnominal.ru`
5. Сохраните и опубликуйте

**Требования:**
- На странице должна быть кнопка с текстом "Оплатить" или "Регистр"
- Скрипт автоматически найдет кнопку по классам `.t-btn`, `.t-submit`

**Ключевая строка для замены:**
```javascript
const BACKEND_API_URL = 'https://ucnominal.ru'; // Замените YOUR-BACKEND-URL
```

---

### 3. Страница успеха
**URL:** https://apml.online/groupa-reg-squad-masters-success-21nov

**Что делает:**
- Проверяет статус оплаты на сервере
- Если оплачено → показывает ссылку на Telegram
- Если не оплачено → скрывает ссылку
- Очищает localStorage после подтверждения

**Установка:**
1. Откройте страницу в редакторе Tilda
2. На странице добавьте ссылку на Telegram чат:
   ```html
   <a href="https://t.me/+StEnmHkKvGdlNmUy" style="display:none">
     Присоединиться к капитанскому чату
   </a>
   ```
3. Добавьте блок **T123: Zero Block**
4. Вставьте весь код из `tilda-code/success-page.html`
5. **ВАЖНО:** Замените `YOUR-BACKEND-URL` на `https://ucnominal.ru`
6. Сохраните и опубликуйте

**Требования:**
- На странице должна быть ссылка с `href` содержащим `t.me`
- Ссылка должна быть скрыта: `style="display:none"`
- Скрипт автоматически покажет ссылку после подтверждения оплаты

**Ключевая строка для замены:**
```javascript
const BACKEND_API_URL = 'https://ucnominal.ru'; // Замените YOUR-BACKEND-URL
```

---

## 🔄 Полный поток работы

```
1. РЕГИСТРАЦИЯ
   ├─ Пользователь заполняет форму
   ├─ Tilda отправляет данные в Google Sheets
   ├─ Скрипт перехватывает событие
   ├─ Сохраняет в localStorage
   └─ Перенаправляет на оплату (500ms)

2. ОПЛАТА
   ├─ Скрипт читает localStorage
   ├─ Находит кнопку на странице
   ├─ Пользователь кликает кнопку
   ├─ Скрипт создает платеж (API)
   ├─ Backend обновляет Google Sheets
   └─ Перенаправляет на CodeePay

3. CODEPAY
   ├─ Пользователь оплачивает
   ├─ CodeePay отправляет webhook
   ├─ Backend обновляет статус
   └─ Пользователь возвращается

4. УСПЕХ
   ├─ Скрипт проверяет статус (API)
   ├─ Если оплачено → показывает Telegram
   ├─ Очищает localStorage
   └─ Готово!
```

---

## ⚙️ Настройки

### Изменение метода оплаты

В `payment-page.html` найдите:
```javascript
method: 'sbp' // Можно изменить на 'card'
```

**Доступные методы:**
- `sbp` - Система быстрых платежей (по умолчанию)
- `card` - Карточная оплата

### Изменение суммы оплаты

В `payment-page.html` найдите:
```javascript
const PAYMENT_AMOUNT = 5000; // Сумма в рублях
```

---

## 🐛 Отладка

### Проверка localStorage

Откройте консоль браузера (F12) и выполните:
```javascript
// Проверить данные регистрации
console.log(localStorage.getItem('apml_registration_data'));

// Проверить order_id платежа
console.log(localStorage.getItem('apml_payment_order_id'));

// Очистить localStorage
localStorage.clear();
```

### Логи в консоли

Все ошибки выводятся в консоль браузера (F12 → Console):
- Ошибки обработки формы
- Ошибки создания платежа
- Ошибки проверки статуса

### Проверка работы скриптов

1. **Регистрация:**
   - Заполните форму → отправьте
   - Должно автоматически перенаправить на оплату
   - Проверьте localStorage (должны быть данные)

2. **Оплата:**
   - Нажмите кнопку оплаты
   - Кнопка должна изменить текст на "Обработка..."
   - Должно перенаправить на CodeePay

3. **Успех:**
   - После оплаты вернетесь на страницу
   - Ссылка на Telegram должна появиться
   - localStorage должен очиститься

---

## ❓ Частые проблемы

### Не перенаправляет на оплату после регистрации

**Причины:**
- Скрипт не добавлен на страницу
- jQuery не загружен (Tilda загружает автоматически)
- Нет обязательных полей TeamName или nickname_Telegram_captain

**Решение:**
- Проверьте консоль на ошибки (F12)
- Убедитесь что скрипт добавлен в Zero Block

### Не работает кнопка оплаты

**Причины:**
- Скрипт не может найти кнопку на странице
- Неправильный BACKEND_API_URL
- localStorage пуст (не прошли регистрацию)

**Решение:**
- Убедитесь что на странице есть кнопка с текстом "Оплат" или "Регистр"
- Проверьте что заменили YOUR-BACKEND-URL на ucnominal.ru
- Пройдите регистрацию заново

### Не показывается ссылка на Telegram

**Причины:**
- Ссылка не скрыта на странице (нет style="display:none")
- Оплата не подтверждена на сервере
- Неправильный BACKEND_API_URL

**Решение:**
- Добавьте `style="display:none"` к ссылке
- Проверьте Google Sheets - статус должен быть "Оплачено"
- Проверьте что заменили YOUR-BACKEND-URL

---

## 📞 Поддержка

**Документация:**
- [Быстрая настройка CodeePay](CODEEPAY_SETUP.md)
- [Полная инструкция](payment-server/README.md)

**Логи:**
- Frontend: Консоль браузера (F12)
- Backend: `pm2 logs apml-payment`

---

**Готово!** Скрипты работают полностью в фоне. 🎉
