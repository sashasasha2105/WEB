# Инструкция по обновлению проекта clip & go

## 🔧 Шаг 1: Установка новых зависимостей

```bash
# Удалите старые node_modules и package-lock.json
rm -rf node_modules package-lock.json

# Установите новые зависимости
npm install

# Установите dev-зависимости
npm install --save-dev clean-css-cli terser nodemon
```

## 📁 Шаг 2: Создание новых файлов

Создайте следующие файлы в корне проекта:

1. **public/404.html** - страница ошибки 404
2. **public/robots.txt** - для поисковых роботов
3. **public/sitemap.xml** - карта сайта
4. **RECOMMENDATIONS.md** - план развития
5. **UPGRADE.md** - этот файл

## 🔐 Шаг 3: Обновление .env

1. Сделайте резервную копию текущего .env:
   ```bash
   cp .env .env.backup
   ```

2. Обновите .env согласно новому шаблону

3. **ВАЖНО**: Получите API ключи Яндекса:
    - [Яндекс.Карты API](https://developer.tech.yandex.ru/services/3)
    - [Яндекс.Геосаджест API](https://yandex.ru/dev/geosuggest/)

## 🚀 Шаг 4: Запуск обновленного сервера

### Режим разработки:
```bash
npm run dev
```

### Продакшн режим:
```bash
# Сначала соберите минифицированные файлы
npm run build

# Затем запустите
NODE_ENV=production npm start
```

## ✅ Шаг 5: Проверка работоспособности

1. **Проверьте здоровье API**:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Проверьте защиту**:
    - Откройте Network в DevTools
    - Убедитесь, что заголовки безопасности присутствуют

3. **Тестирование rate limiting**:
    - Попробуйте сделать много запросов подряд
    - После 100 запросов должна появиться ошибка

4. **Проверьте 404 страницу**:
    - Перейдите на несуществующий URL
    - Должна отобразиться красивая страница ошибки

## 🌐 Шаг 6: Настройка домена (когда будет готов)

1. Обновите в коде все упоминания `yourdomain.com` на ваш реальный домен
2. Обновите `DOMAIN` и `PROTOCOL` в .env
3. Обновите `return_url` в платежной системе

## 📊 Шаг 7: Подключение аналитики

1. **Google Analytics**:
   ```html
   <!-- Добавьте перед </head> -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

2. **Яндекс.Метрика**:
   ```html
   <!-- Добавьте перед </body> -->
   <script type="text/javascript">
      (function(m,e,t,r,i,k,a){/* Код метрики */})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
      ym(00000000, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true });
   </script>
   ```

## 🐛 Устранение проблем

### Ошибка "Cannot find module"
```bash
npm cache clean --force
npm install
```

### Ошибка с правами доступа
```bash
sudo chown -R $(whoami) ~/.npm
```

### Порт уже занят
```bash
# Найти процесс
lsof -i :3000

# Убить процесс
kill -9 <PID>
```

## 🔄 Откат изменений (если что-то пошло не так)

```bash
# Восстановить старый .env
cp .env.backup .env

# Восстановить старый package.json
git checkout -- package.json

# Переустановить старые зависимости
npm install