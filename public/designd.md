# 🎨 Премиальная дизайн-система clip & go

## 📋 Оглавление
1. [Цветовая палитра](#цветовая-палитра)
2. [Glassmorphism эффекты](#glassmorphism-эффекты)
3. [Типографика](#типографика)
4. [Компоненты](#компоненты)
5. [Анимации](#анимации)
6. [Адаптивность](#адаптивность)
7. [Интерактивность](#интерактивность)
8. [Система отступов](#система-отступов)

---

## 🎨 Цветовая палитра

### Основные цвета
```css
:root {
    /* Фирменные цвета */
    --primary-dark: #0057c2;  /* Темно-синий */
    --primary: #1ca6f8;       /* Голубой акцент */
    --white: #ffffff;         /* Белый */
    --black: #000000;         /* Черный */
    --gray: #e5e5e5;          /* Серый */

    /* Премиальная палитра */
    --navy-deep: #002a5c;     /* Глубокий темно-синий */
    --navy-elegant: #003d7a;  /* Элегантный синий */
    --blue-accent: #1ca6f8;   /* Голубой акцент */
    --blue-soft: #e8f4ff;     /* Мягкий голубой */
}
```

### Градиентный фон
```css
body {
    background: linear-gradient(135deg, 
        var(--navy-deep) 0%, 
        var(--navy-elegant) 50%, 
        var(--primary-dark) 100%) !important;
    background-attachment: fixed !important;
}
```

### Семантические цвета
```css
:root {
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
}
```

---

## ✨ Glassmorphism эффекты

### Основной glassmorphism
```css
:root {
    --glass-bg: rgba(255, 255, 255, 0.85);
    --glass-border: rgba(255, 255, 255, 0.2);
    --glass-blur: blur(20px);
}

.glass-card {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-2xl);
}
```

### Премиальные тени
```css
:root {
    --shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.08);
    --shadow-soft: 0 4px 12px rgba(0, 0, 0, 0.15);
    --shadow-medium: 0 8px 24px rgba(0, 0, 0, 0.12);
    --shadow-large: 0 16px 40px rgba(0, 0, 0, 0.15);
    --shadow-glow: 0 0 20px rgba(28, 166, 248, 0.15);
}
```

---

## 📝 Типографика

### Шрифты
```css
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
```

### Заголовки
```css
.hero-title {
    font-size: 2.75rem;
    font-weight: 800;
    color: var(--gray-900);
    letter-spacing: -0.02em;
    line-height: 1.1;
}

.section-title {
    font-size: 2.25rem;
    font-weight: 800;
    color: var(--white);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    letter-spacing: -0.01em;
}

.card-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--gray-900);
    letter-spacing: -0.01em;
}
```

---

## 🧩 Компоненты

### Премиальные кнопки
```css
.premium-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px 28px;
    border: none;
    border-radius: var(--radius-lg);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition-smooth);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: relative;
    overflow: hidden;
}

.premium-btn.primary {
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--blue-accent) 100%);
    color: var(--white);
    box-shadow: var(--shadow-medium);
}

.premium-btn.primary:hover {
    background: linear-gradient(135deg, var(--navy-deep) 0%, var(--primary-dark) 100%);
    transform: translateY(-2px);
    box-shadow: var(--shadow-large);
}
```

### Карточки
```css
.premium-card {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-2xl);
    padding: 36px;
    box-shadow: var(--shadow-medium);
    transition: var(--transition-smooth);
    position: relative;
    overflow: hidden;
}

.premium-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-large);
    border-color: rgba(28, 166, 248, 0.2);
}
```

### Статистические блоки
```css
.stat-item {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    text-align: center;
    padding: 24px 28px;
    border-radius: var(--radius-lg);
    transition: var(--transition-smooth);
}

.stat-number {
    font-size: 2.2rem;
    font-weight: 800;
    color: var(--primary-dark);
    font-variant-numeric: tabular-nums;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.stat-label {
    font-size: 0.85rem;
    color: var(--gray-600);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
}
```

### Toggle переключатель
```css
.premium-toggle {
    position: relative;
    display: inline-block;
    width: 56px;
    height: 32px;
    cursor: pointer;
}

.toggle-slider {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--gray-300);
    transition: var(--transition-smooth);
    border-radius: 32px;
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.1);
}

.toggle input:checked + .toggle-slider {
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--blue-accent) 100%);
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.2), var(--shadow-glow);
}
```

---

## 🎬 Анимации

### Базовые переходы
```css
:root {
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-fast: all 0.15s ease-out;
    --transition-smooth: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Премиальные keyframes
```css
@keyframes premiumSlideUp {
    from {
        opacity: 0;
        transform: translateY(40px) scale(0.96);
        filter: blur(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
    }
}

@keyframes premiumPopIn {
    0% {
        opacity: 0;
        transform: scale(0.85) translateY(20px);
        filter: blur(3px);
    }
    60% {
        opacity: 1;
        transform: scale(1.02) translateY(-3px);
        filter: blur(0);
    }
    100% {
        opacity: 1;
        transform: scale(1) translateY(0);
        filter: blur(0);
    }
}

@keyframes premiumFloat {
    0%, 100% {
        transform: translateY(0) rotate(0deg);
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    }
    25% {
        transform: translateY(-8px) rotate(2deg);
        filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2));
    }
    50% {
        transform: translateY(-4px) rotate(0deg);
        filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
    }
    75% {
        transform: translateY(-10px) rotate(-2deg);
        filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2));
    }
}
```

### Применение анимаций
```css
.hero-card {
    animation: premiumSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.stat-item {
    animation: premiumPopIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.stat-item:nth-child(1) { animation-delay: 0.1s; }
.stat-item:nth-child(2) { animation-delay: 0.15s; }
.stat-item:nth-child(3) { animation-delay: 0.2s; }

.empty-icon {
    animation: premiumFloat 4s ease-in-out infinite;
}
```

---

## 📱 Адаптивность

### Система радиусов
```css
:root {
    --radius-sm: 6px;
    --radius: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --radius-2xl: 24px;
}
```

### Мобильные стили
```css
@media (max-width: 768px) {
    /* Принудительный фон для мобильных */
    html, body {
        background: linear-gradient(135deg, #002a5c 0%, #003d7a 50%, #0057c2 100%) !important;
        background-attachment: fixed !important;
        min-height: 100vh !important;
    }
    
    .hero-card {
        padding: 24px 20px;
        gap: 20px;
        flex-direction: column;
        text-align: center;
    }
    
    .premium-card {
        padding: 28px 24px;
    }
}
```

### Мобильные touch эффекты
```css
@media (max-width: 768px) {
    .premium-btn:active {
        transform: scale(0.97) translateY(1px) !important;
        transition: transform 0.12s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    .premium-card:active {
        transform: scale(0.98) translateY(-2px) !important;
        transition: transform 0.12s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
}
```

---

## 🎯 Интерактивность

### Hover эффекты
```css
.interactive-element:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-medium);
    border-color: rgba(28, 166, 248, 0.3);
}
```

### Ripple эффекты для мобильных
```css
.touchable::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, 
        rgba(28, 166, 248, 0.25) 0%, 
        rgba(0, 87, 194, 0.1) 40%, 
        transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    pointer-events: none;
    z-index: 1;
}

.touchable:active::before {
    width: 120px;
    height: 120px;
}
```

### Премиальные уведомления
```css
.premium-notification {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-left: 4px solid var(--success);
    border-radius: 16px;
    padding: 20px 24px;
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15);
    animation: premiumNotificationSlide 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

---

## 📏 Система отступов

### Основные размеры
```css
:root {
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    --spacing-2xl: 48px;
    --spacing-3xl: 64px;
}
```

### Контейнеры
```css
.main-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-2xl) var(--spacing-lg);
}

.content-section {
    margin-bottom: var(--spacing-xl);
}

.card-grid {
    display: grid;
    gap: var(--spacing-lg);
}
```

---

## 🚀 Применение на практике

### 1. Создание новой страницы
```css
/* Основа страницы */
.page-container {
    background: linear-gradient(135deg, var(--navy-deep) 0%, var(--navy-elegant) 50%, var(--primary-dark) 100%);
    background-attachment: fixed;
    min-height: 100vh;
}

/* Контентные блоки */
.content-block {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-2xl);
    margin-bottom: var(--spacing-xl);
    animation: premiumSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### 2. Использование иконок-эмодзи
```html
<button class="premium-btn primary">
    <span>🛒</span>
    <span>В корзину</span>
</button>

<div class="stat-item">
    <div class="stat-number">📦 <span>42</span></div>
    <div class="stat-label">Заказов</div>
</div>
```

### 3. Добавление анимированных элементов
```css
.animated-element {
    animation: premiumSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.animated-element:nth-child(1) { animation-delay: 0.1s; }
.animated-element:nth-child(2) { animation-delay: 0.2s; }
.animated-element:nth-child(3) { animation-delay: 0.3s; }
```

---

## ✅ Чек-лист для новых страниц

- [ ] Применен градиентный фон
- [ ] Использованы glassmorphism эффекты
- [ ] Добавлены премиальные тени
- [ ] Настроены hover и touch эффекты
- [ ] Добавлены анимации появления
- [ ] Проверена адаптивность на мобильных
- [ ] Использованы системные цвета и отступы
- [ ] Добавлены эмодзи-иконки
- [ ] Настроены уведомления и диалоги
- [ ] Проверена accessibility

---

## 🎨 Быстрые CSS классы

```css
/* Утилитарные классы */
.glass { 
    background: var(--glass-bg); 
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
}

.shadow-soft { box-shadow: var(--shadow-soft); }
.shadow-medium { box-shadow: var(--shadow-medium); }
.shadow-large { box-shadow: var(--shadow-large); }

.animate-slide-up { animation: premiumSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.animate-pop-in { animation: premiumPopIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.animate-float { animation: premiumFloat 4s ease-in-out infinite; }

.touchable { position: relative; overflow: hidden; }
.interactive:hover { transform: translateY(-4px); }
```

---

Этот гайд поможет вам создавать согласованный и премиальный дизайн для всех страниц сайта clip & go! 🎉