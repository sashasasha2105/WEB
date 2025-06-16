// === MAIN/SCRIPT.JS - ОПТИМИЗИРОВАННАЯ ПРЕМИАЛЬНАЯ ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ ===
// Основано на премиальной дизайн-системе clip & go с максимальной производительностью

console.log('[PremiumMain] 🚀 Загрузка оптимизированного премиального интерфейса...');

// ==== ПРЕМИАЛЬНЫЕ КОНСТАНТЫ ====
const PREMIUM_CONFIG = {
  animations: {
    slideUpDuration: 800,
    slideUpEasing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    elasticEasing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smoothEasing: 'ease-in-out',
    hapticDuration: 200,
    shimmerDuration: 600,
    countUpDuration: 2000
  },
  slider: {
    autoSlideInterval: 6000,
    transitionDuration: 700
  },
  glassmorphism: {
    blurIntensity: 20,
    borderOpacity: 0.2,
    backgroundOpacity: 0.12
  }
};

// ==== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ====
let premiumState = {
  // Состояние корзины
  cameraCount: 0,
  memoryCount: 0,
  selectedMemory: '8gb',
  selectedColor: 'black',

  // Состояние UI
  currentTab: 'product',
  currentSlide: 0,
  slidesCount: 5,
  slideInterval: null,
  managersReady: false,
  pageInitialized: false,

  // Цены
  basePrice: 7490,
  memoryPrice: 500
};

// ==== КЭШИРОВАНИЕ DOM ЭЛЕМЕНТОВ ====
const DOM = {
  // Основные контейнеры
  mainContent: () => document.getElementById('mainContent'),

  // Табы
  tabBtns: () => document.querySelectorAll('.tab-btn'),
  tabContents: () => document.querySelectorAll('.tab-content'),
  productTab: () => document.getElementById('productTab'),
  infoTab: () => document.getElementById('infoTab'),

  // Слайдер
  slides: () => document.querySelectorAll('.slider-img'),
  dots: () => document.querySelectorAll('.dot'),

  // Покупка
  colorOptions: () => document.querySelectorAll('.color-option-btn'),
  memoryOptions: () => document.querySelectorAll('.memory-option-btn'),
  priceDisplay: () => document.getElementById('priceDisplay'),
  addToCartBtn: () => document.getElementById('addToCartBtn'),

  // Информационные карточки
  charContainer: () => document.getElementById('charTableContainer'),
  faqContainer: () => document.getElementById('faqContainer'),
  shippingContainer: () => document.getElementById('shippingContainer'),

  // Уведомления
  cookieBanner: () => document.querySelector('.cookie-banner'),
  acceptCookiesBtn: () => document.getElementById('accept-cookies')
};

// ==== ОЖИДАНИЕ МЕНЕДЖЕРОВ ====
async function waitForPremiumManagers() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 30; // 3 секунды максимум

    const checkManagers = () => {
      attempts++;

      if (window.CartManager && window.OrderManager) {
        console.log('[PremiumMain] ✨ Менеджеры загружены');
        premiumState.managersReady = true;
        resolve(true);
      } else if (attempts >= maxAttempts) {
        console.warn('[PremiumMain] ⚠️ Менеджеры не загрузились, продолжаем без них');
        resolve(false);
      } else {
        setTimeout(checkManagers, 100);
      }
    };

    checkManagers();
  });
}

// ==== ОТОБРАЖЕНИЕ ОШИБОК ====
function showErrorNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'premium-notification error-notification';
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    left: 20px;
    max-width: 400px;
    margin: 0 auto;
    background: rgba(239, 68, 68, 0.95);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
    color: white;
    font-size: 0.9em;
    z-index: 100000;
    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
    animation: notificationSlideIn 0.4s ease;
    transform: translateZ(0);
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 1.4em;">⚠️</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Ошибка</div>
        <div style="font-size: 0.85em; opacity: 0.9;">${message}</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'notificationSlideOut 0.4s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 400);
  }, 4000);
}

// ==== СОХРАНЕНИЕ СОСТОЯНИЯ КОРЗИНЫ ====
function savePremiumCartState() {
  try {
    const cartColor = premiumState.selectedColor;
    const memoryCard = premiumState.selectedMemory;
    const basePrice = premiumState.basePrice;
    const memoryPrice = memoryCard === '64gb' ? premiumState.memoryPrice : 0;
    const finalPrice = basePrice + memoryPrice;
    
    const cartColorRus = cartColor === 'black' ? 'чёрный' : 'белый';
    const memoryDesc = memoryCard === '8gb' ? '8 ГБ (встроенная)' : '64 ГБ microSD';
    const productDescription = `clip & go 1st edition (${cartColorRus}, ${memoryDesc})`;
    
    if (window.CartManager && typeof window.CartManager.addToCart === 'function') {
      // Enhanced CartManager integration with proper data structure
      const productData = {
        id: `clip-go-${Date.now()}`,
        name: 'clip & go 1st edition',
        price: finalPrice,
        color: cartColor,
        colorRus: cartColorRus,
        memory: memoryCard,
        memoryDesc: memoryDesc,
        description: productDescription,
        quantity: 1,
        image: '../assets/images/cam1.jpg',
        category: 'camera',
        sku: `CLIP-GO-${cartColor.toUpperCase()}-${memoryCard.toUpperCase()}`
      };
      
      console.log('[PremiumMain] 📦 Добавляем товар через CartManager:', productData);
      const success = window.CartManager.addToCart(productData);
      
      if (success) {
        console.log('[PremiumMain] ✅ Товар успешно добавлен через CartManager');
        return true;
      } else {
        console.warn('[PremiumMain] ⚠️ CartManager вернул false, используем fallback');
        throw new Error('CartManager failed');
      }
    } else {
      console.log('[PremiumMain] 📦 CartManager недоступен, используем localStorage fallback');
      throw new Error('CartManager not available');
    }
  } catch (error) {
    console.warn('[PremiumMain] ⚠️ Ошибка с CartManager, используем localStorage fallback:', error);
    
    try {
      // Comprehensive localStorage fallback
      const cartColor = premiumState.selectedColor;
      const memoryCard = premiumState.selectedMemory;
      const basePrice = premiumState.basePrice;
      const memoryPrice = memoryCard === '64gb' ? premiumState.memoryPrice : 0;
      const finalPrice = basePrice + memoryPrice;
      
      const cartColorRus = cartColor === 'black' ? 'чёрный' : 'белый';
      const memoryDesc = memoryCard === '8gb' ? '8 ГБ (встроенная)' : '64 ГБ microSD';
      
      const existingCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
      
      const newItem = {
        id: `clip-go-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'clip & go 1st edition',
        price: finalPrice,
        color: cartColor,
        colorRus: cartColorRus,
        memory: memoryCard,
        memoryDesc: memoryDesc,
        description: `clip & go 1st edition (${cartColorRus}, ${memoryDesc})`,
        quantity: 1,
        image: '../assets/images/cam1.jpg',
        addedAt: new Date().toISOString(),
        category: 'camera',
        sku: `CLIP-GO-${cartColor.toUpperCase()}-${memoryCard.toUpperCase()}`
      };
      
      existingCart.push(newItem);
      localStorage.setItem('cartItems', JSON.stringify(existingCart));
      
      // Update cart counter if exists
      const cartCounter = document.querySelector('.cart-counter');
      if (cartCounter) {
        cartCounter.textContent = existingCart.length;
        cartCounter.style.display = existingCart.length > 0 ? 'flex' : 'none';
      }
      
      console.log('[PremiumMain] ✅ Товар успешно добавлен через localStorage fallback');
      console.log('[PremiumMain] 📦 Текущая корзина:', existingCart);
      
      return true;
    } catch (fallbackError) {
      console.error('[PremiumMain] ❌ Критическая ошибка добавления товара в корзину:', fallbackError);
      showErrorNotification('Не удалось добавить товар в корзину. Попробуйте позже.');
      return false;
    }
  }
}

// ==== ПРЕМИАЛЬНЫЕ АНИМАЦИИ ====
class PremiumAnimations {
  static slideUp(elements, delay = 0) {
    if (!elements || elements.length === 0) return;

    elements.forEach((element, index) => {
      if (!element) return;

      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, delay + (index * 100));
    });
  }

  static hapticFeedback(element) {
    if (!element) return;

    element.style.transform = 'scale(0.98)';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 150);
  }

  static countUp(element, target, duration = 1000) {
    if (!element || isNaN(target)) return;

    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 50);
    let current = start;

    const timer = setInterval(() => {
      current += increment;

      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        current = target;
        clearInterval(timer);
      }

      element.textContent = Math.floor(current);
    }, 50);
  }
}

// ==== УПРАВЛЕНИЕ СОСТОЯНИЕМ КОРЗИНЫ ====
function loadPremiumCartState() {
  try {
    if (window.CartManager) {
      const data = window.CartManager.getCartData();
      premiumState.cameraCount = data.cameraCount || 0;
      premiumState.memoryCount = data.memoryCount || 0;
      console.log('[PremiumMain] 🛒 Состояние корзины загружено:', {
        cameraCount: premiumState.cameraCount,
        memoryCount: premiumState.memoryCount
      });
    } else {
      // Fallback на localStorage
      const data = JSON.parse(localStorage.getItem('cartData') || '{}');
      premiumState.cameraCount = data.cameraCount || 0;
      premiumState.memoryCount = data.memoryCount || 0;
    }

    updatePremiumStats();
  } catch (error) {
    console.error('[PremiumMain] ❌ Ошибка загрузки состояния корзины:', error);
    premiumState.cameraCount = 0;
    premiumState.memoryCount = 0;
    premiumState.cartItems = 0;
  }
}


// ==== ОБНОВЛЕНИЕ СТАТИСТИКИ ====
function updatePremiumStats() {
  // Функция пока пустая, так как убрали статистику из hero
  // Можно добавить обновление счетчика корзины в хедере
  if (window.CartManager && typeof window.CartManager.forceUpdateCounter === 'function') {
    window.CartManager.forceUpdateCounter();
  }
}

// ==== ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ ЦЕНЫ ====
function updatePremiumPriceDisplay() {
  const priceDisplay = DOM.priceDisplay();
  if (!priceDisplay) return;

  const memoryPrice = premiumState.selectedMemory === '64gb' ? premiumState.memoryPrice : 0;
  const unit = premiumState.basePrice + memoryPrice;

  priceDisplay.innerHTML = `
    <div style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px;">Итоговая цена:</div>
    <strong>${unit.toLocaleString('ru-RU')} ₽</strong>
  `;

  // Добавляем блеск к цене
  priceDisplay.style.animation = 'countUp 0.5s ease';
  setTimeout(() => {
    priceDisplay.style.animation = '';
  }, 500);
}

// ==== ПРЕМИАЛЬНАЯ СИСТЕМА ТАБОВ ====
class PremiumTabSystem {
  static init() {
    const tabBtns = DOM.tabBtns();
    const tabContents = DOM.tabContents();

    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    console.log('[PremiumMain] 📂 Премиальная система табов инициализирована');
  }

  static switchTab(targetTab) {
    const tabBtns = DOM.tabBtns();
    const tabContents = DOM.tabContents();

    // Обновляем состояние
    premiumState.currentTab = targetTab;

    // Убираем активные классы
    tabBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === targetTab) {
        btn.classList.add('active');
        PremiumAnimations.hapticFeedback(btn);
      }
    });

    // Переключаем контент с анимацией
    tabContents.forEach(content => {
      if (content.id === `${targetTab}Content`) {
        content.style.display = 'none';
        setTimeout(() => {
          content.style.display = 'block';
          content.style.animation = 'premiumSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 150);
        content.classList.add('active');
      } else {
        content.classList.remove('active');
        content.style.display = 'none';
      }
    });

    console.log(`[PremiumMain] 🔄 Переключен на таб: ${targetTab}`);
  }
}

// ==== ПРЕМИАЛЬНЫЙ СЛАЙДЕР ====
class PremiumSlider {
  static init() {
    const slides = DOM.slides();
    console.log('[PremiumMain] 🎞️ Найдено слайдов:', slides.length);
    if (slides.length === 0) return;

    this.showSlide(0);
    this.updateDots();
    this.startAutoSlider();

    // Глобальные функции для кнопок
    window.prevSlide = () => this.prevSlide();
    window.nextSlide = () => this.nextSlide();
    window.currentSlide = (n) => this.goToSlide(parseInt(n) - 1);

    console.log('[PremiumMain] 🎞️ Премиальный слайдер инициализирован');
  }

  static showSlide(index) {
    const slides = DOM.slides();

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      if (i === index) {
        slide.style.animation = 'slideIn 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      }
    });

    premiumState.currentSlide = index;
    this.updateDots();
  }

  static updateDots() {
    const dots = DOM.dots();
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === premiumState.currentSlide);
    });
  }

  static prevSlide() {
    const newIndex = (premiumState.currentSlide - 1 + premiumState.slidesCount) % premiumState.slidesCount;
    this.showSlide(newIndex);
    this.resetAutoSlider();
  }

  static nextSlide() {
    const newIndex = (premiumState.currentSlide + 1) % premiumState.slidesCount;
    this.showSlide(newIndex);
    this.resetAutoSlider();
  }

  static goToSlide(index) {
    this.showSlide(index);
    this.resetAutoSlider();
  }

  static startAutoSlider() {
    if (premiumState.slidesCount > 1) {
      premiumState.slideInterval = setInterval(() => {
        this.nextSlide();
      }, PREMIUM_CONFIG.slider.autoSlideInterval);
    }
  }

  static resetAutoSlider() {
    if (premiumState.slideInterval) {
      clearInterval(premiumState.slideInterval);
    }
    this.startAutoSlider();
  }
}

// ==== ИНФОРМАЦИОННЫЕ КАРТОЧКИ ====
class PremiumInfoCards {
  static init() {
    // Глобальные функции для обработчиков в HTML
    window.toggleCharacteristics = () => this.toggleCard('charTableContainer');
    window.toggleFAQ = () => this.toggleCard('faqContainer');
    window.toggleShipping = () => this.toggleCard('shippingContainer');

    console.log('[PremiumMain] 📋 Информационные карточки инициализированы');
  }

  static toggleCard(targetId) {
    const containers = ['charTableContainer', 'faqContainer', 'shippingContainer'];

    containers.forEach(id => {
      const content = document.getElementById(id);
      const header = content?.closest('.info-card')?.querySelector('.info-card-header');

      if (!content || !header) return;

      const isCurrentlyOpen = content.classList.contains('open');
      const shouldOpen = (id === targetId) && !isCurrentlyOpen;

      // Закрываем все карточки
      content.classList.remove('open');
      header.classList.remove('opened');

      if (shouldOpen) {
        // Открываем выбранную карточку с задержкой
        setTimeout(() => {
          content.classList.add('open');
          header.classList.add('opened');
          content.style.animation = 'premiumSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 100);
      }
    });
  }
}

// ==== СИСТЕМА ПОКУПОК ====
class PremiumPurchaseSystem {
  static init() {
    console.log('[PremiumMain] 🛒 Инициализация системы покупок...');
    try {
      this.setupColorOptions();
      this.setupMemoryOptions();
      this.setupAddToCartButton();
      updatePremiumPriceDisplay();
      console.log('[PremiumMain] ✅ Премиальная система покупок инициализирована');
    } catch (error) {
      console.error('[PremiumMain] ❌ Ошибка инициализации системы покупок:', error);
    }
  }

  static setupColorOptions() {
    const colorOptions = DOM.colorOptions();
    console.log('[PremiumMain] 🎨 Найдено цветовых кнопок:', colorOptions.length);

    colorOptions.forEach(btn => {
      btn.addEventListener('click', () => {
        // Убираем выделение с других кнопок
        colorOptions.forEach(b => b.classList.remove('selected'));

        // Выделяем выбранную кнопку
        btn.classList.add('selected');
        premiumState.selectedColor = btn.dataset.color;

        // Премиальная анимация
        PremiumAnimations.hapticFeedback(btn);

        updatePremiumPriceDisplay();
        console.log(`[PremiumMain] 🎨 Выбран цвет: ${premiumState.selectedColor}`);
      });
    });
  }

  static setupMemoryOptions() {
    const memoryOptions = DOM.memoryOptions();
    console.log('[PremiumMain] 💾 Найдено кнопок памяти:', memoryOptions.length);

    memoryOptions.forEach(btn => {
      btn.addEventListener('click', () => {
        // Убираем выделение с других кнопок
        memoryOptions.forEach(b => b.classList.remove('selected'));

        // Выделяем выбранную кнопку
        btn.classList.add('selected');
        premiumState.selectedMemory = btn.dataset.memory;

        // Премиальная анимация
        PremiumAnimations.hapticFeedback(btn);

        updatePremiumPriceDisplay();
        console.log(`[PremiumMain] 💾 Память: ${premiumState.selectedMemory}`);
      });
    });
  }

  static setupAddToCartButton() {
    const addBtn = DOM.addToCartBtn();
    console.log('[PremiumMain] 🛒 Кнопка добавления в корзину найдена:', !!addBtn);
    if (!addBtn) return;

    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.addToCart();
    });
  }

  static addToCart() {
    console.log('[PremiumMain] 🛒 Добавление в премиальную корзину...');

    // Анимация кнопки
    const addBtn = DOM.addToCartBtn();
    PremiumAnimations.hapticFeedback(addBtn);

    // Добавляем товар в корзину
    const addResult = savePremiumCartState();

    if (addResult) {
      console.log('[PremiumMain] ✅ Товар успешно добавлен в корзину');
      
      // Обновляем интерфейс
      updatePremiumPriceDisplay();
      updatePremiumStats();

      // Небольшая задержка для обновления CartManager
      setTimeout(() => {
        // Получаем актуальное количество товаров
        let currentCartCount = 1;
        if (window.CartManager && typeof window.CartManager.getTotalCount === 'function') {
          currentCartCount = window.CartManager.getTotalCount();
        } else {
          // Fallback для localStorage
          try {
            const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
            currentCartCount = cartItems.length;
          } catch (e) {
            currentCartCount = 1;
          }
        }
        
        // Премиальные уведомления с актуальным количеством
        this.showPremiumNotification(currentCartCount);
        this.createPremiumFlyingAnimation();
      }, 150);
    } else {
      console.error('[PremiumMain] ❌ Не удалось добавить товар в корзину');
      
      // Показываем ошибку пользователю
      this.showErrorNotification('Не удалось добавить товар в корзину. Попробуйте снова.');
    }

    // Принудительно обновляем счетчик
    if (window.CartManager && typeof window.CartManager.forceUpdateCounter === 'function') {
      setTimeout(() => {
        window.CartManager.forceUpdateCounter();
      }, 100);
    }

    console.log('[PremiumMain] ✨ Товар добавлен в премиальную корзину');
  }

  static showPremiumNotification(totalItems) {
    // Удаляем предыдущее уведомление
    const existing = document.querySelector('.premium-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'premium-notification';
    // Проверяем размер карты памяти для анимации
    const hasMemoryCard = premiumState.selectedMemory === '64gb';
    const memoryDesc = hasMemoryCard ? '64 ГБ' : '8 ГБ';
    const colorName = premiumState.selectedColor === 'black' ? 'Чёрный' : 'Белый';
    
    // Получаем актуальное количество товаров в корзине
    let currentCartCount = totalItems || 1;
    if (window.CartManager && typeof window.CartManager.getTotalCount === 'function') {
      currentCartCount = window.CartManager.getTotalCount();
    } else {
      // Fallback: пытаемся получить из localStorage
      try {
        const cartData = JSON.parse(localStorage.getItem('cartItems') || '[]');
        currentCartCount = cartData.length || 1;
      } catch (e) {
        console.warn('[PremiumMain] Fallback cart count failed:', e);
        currentCartCount = totalItems || 1;
      }
    }

    notification.innerHTML = `
      <div class="notification-content" style="display: flex; align-items: center; gap: 15px;">
        <span class="notification-icon" style="font-size: 2em;">🛒</span>
        <div>
          <div class="notification-title" style="font-weight: 800; margin-bottom: 6px; color: #1ca6f8;">Добавлено в корзину!</div>
          <div class="notification-text" style="font-size: 0.9em; opacity: 0.9;">clip & go 1st edition</div>
          <div class="notification-text" style="font-size: 0.85em; opacity: 0.8; margin-top: 2px;">${colorName}, ${memoryDesc}</div>
          ${hasMemoryCard ? '<div class="notification-text" style="font-size: 0.8em; opacity: 0.7; margin-top: 2px;">+ Карта памяти 64 ГБ</div>' : ''}
          <div class="notification-text" style="font-size: 0.8em; opacity: 0.7; margin-top: 4px; color: #1ca6f8;">В корзине: ${currentCartCount} ${this.getItemWord(currentCartCount)}</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Автоматическое скрытие
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 600);
    }, 4000);
  }

  static getItemWord(count) {
    const cases = [2, 0, 1, 1, 1, 2];
    const titles = ['товар', 'товара', 'товаров'];
    return titles[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]];
  }

  static createPremiumFlyingAnimation() {
    const activeSlide = document.querySelector('.slider-img.active');
    if (!activeSlide) return;

    const hasMemoryCard = premiumState.selectedMemory === '64gb';

    // Создаем анимацию камеры
    this.createFlyingItem(activeSlide.src, 'camera');

    // Если выбрана карта памяти 64ГБ, добавляем анимацию карты памяти
    if (hasMemoryCard) {
      setTimeout(() => {
        this.createFlyingItem('../assets/images/memory-card.png', 'memory');
      }, 300);
    }
  }

  static createFlyingItem(imageSrc, type) {
    const activeSlide = document.querySelector('.slider-img.active');
    if (!activeSlide) return;

    const flyingImg = document.createElement('div');
    const size = type === 'memory' ? 60 : 100;
    
    flyingImg.style.cssText = `
      position: fixed;
      width: ${size}px;
      height: ${size}px;
      background-image: url(${imageSrc});
      background-size: cover;
      background-position: center;
      z-index: 10000;
      pointer-events: none;
      border-radius: ${type === 'memory' ? '8px' : '16px'};
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    `;

    const rect = activeSlide.getBoundingClientRect();
    const offsetX = type === 'memory' ? 30 : 0;
    const startX = rect.left + rect.width / 2 - size/2 + offsetX;
    const startY = rect.top + rect.height / 2 - size/2;

    flyingImg.style.left = `${startX}px`;
    flyingImg.style.top = `${startY}px`;

    document.body.appendChild(flyingImg);

    // Ищем цель для анимации
    const cartIcon = document.querySelector('.cart-icon, .header-actions .cart-btn, [href*="cart"]');

    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect();
      const endX = cartRect.left + cartRect.width / 2 - size/2;
      const endY = cartRect.top + cartRect.height / 2 - size/2;

      const animation = flyingImg.animate([
        {
          transform: 'translate(0, 0) scale(1) rotate(0deg)',
          opacity: 1
        },
        {
          transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.3) rotate(${type === 'memory' ? '180deg' : '360deg'})`,
          opacity: 0
        }
      ], {
        duration: type === 'memory' ? 1200 : 1500,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });

      animation.onfinish = () => {
        flyingImg.remove();

        // Анимация корзины только для последнего элемента
        if (cartIcon && (!hasMemoryCard || type === 'memory')) {
          cartIcon.style.animation = 'cartBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
          setTimeout(() => {
            cartIcon.style.animation = '';
          }, 800);
        }
      };
    } else {
      setTimeout(() => flyingImg.remove(), 1500);
    }
  }
}

// ==== ПРЕМИАЛЬНЫЙ COOKIE BANNER ====
class PremiumCookieBanner {
  static init() {
    const banner = DOM.cookieBanner();
    const acceptBtn = DOM.acceptCookiesBtn();

    if (!banner || !acceptBtn) return;

    // Проверяем, приняты ли уже cookies
    if (localStorage.getItem('cookiesAccepted')) {
      banner.style.display = 'none';
      return;
    }

    // Показываем баннер при прокрутке
    let bannerShown = false;

    function onScroll() {
      if (bannerShown) return;

      const purchaseSection = document.querySelector('.premium-purchase-section');
      if (!purchaseSection) return;

      const rect = purchaseSection.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        banner.style.display = 'flex';
        banner.style.animation = 'premiumSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        bannerShown = true;
        window.removeEventListener('scroll', onScroll);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Обработчик принятия cookies
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('cookiesAccepted', 'true');
      banner.style.animation = 'premiumFadeOut 0.4s ease-out forwards';
      setTimeout(() => {
        banner.style.display = 'none';
      }, 400);
    });

    console.log('[PremiumMain] 🍪 Премиальный cookie banner инициализирован');
  }
}

// ==== СОБЫТИЯ МЕНЕДЖЕРОВ ====
function setupPremiumManagerEvents() {
  // Слушаем обновления корзины
  window.addEventListener('cartUpdated', (e) => {
    console.log('[PremiumMain] 🔄 Событие cartUpdated получено:', e.detail);
    loadPremiumCartState();
    updatePremiumPriceDisplay();
  });

  // Слушаем обновления заказов
  window.addEventListener('ordersUpdated', (e) => {
    console.log('[PremiumMain] 📦 Событие ordersUpdated получено:', e.detail);

    if (e.detail.action === 'added' && e.detail.order) {
      showPremiumOrderNotification(e.detail.order);
    }
  });

  console.log('[PremiumMain] 🎧 События премиальных менеджеров настроены');
}

function showPremiumOrderNotification(order) {
  const notification = document.createElement('div');
  notification.className = 'premium-notification order-notification';

  notification.innerHTML = `
    <div class="notification-content" style="display: flex; align-items: center; gap: 18px;">
      <span class="notification-icon" style="font-size: 2.5em;">🎉</span>
      <div>
        <div class="notification-title" style="font-weight: 800; margin-bottom: 8px; color: #10b981; font-size: 1.1em;">Заказ создан!</div>
        <div class="notification-text" style="font-size: 0.95em; opacity: 0.9; margin-bottom: 4px;">№ ${order.id}</div>
        <div class="notification-text" style="font-size: 0.9em; opacity: 0.8;">Сумма: ${order.amount?.toLocaleString('ru-RU')} ₽</div>
        <div class="notification-text" style="font-size: 0.8em; opacity: 0.7; margin-top: 6px;">Премиальное обслуживание ✨</div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 600);
  }, 5000);
}

// ==== ПРЕМИАЛЬНЫЕ CSS АНИМАЦИИ ====
function addPremiumAnimationStyles() {
  if (document.getElementById('premium-main-animations')) return;

  const style = document.createElement('style');
  style.id = 'premium-main-animations';
  style.textContent = `
    @keyframes premiumSlideUp {
      0% { opacity: 0; transform: translateY(30px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes premiumFadeOut {
      0% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-10px); }
    }
    
    @keyframes premiumHaptic {
      0% { transform: scale(1); }
      50% { transform: scale(0.98); }
      100% { transform: scale(1); }
    }
    
    @keyframes slideIn {
      0% { opacity: 0; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }
    
    @keyframes avatarPulse {
      0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3); }
      70% { box-shadow: 0 0 0 20px rgba(255, 255, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
    }
    
    @keyframes countUp {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes cartBounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
  `;

  document.head.appendChild(style);
}


// ==== INTERSECTION OBSERVER ДЛЯ ЛЕНИВЫХ АНИМАЦИЙ ====
class LazyAnimationObserver {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              this.observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      );

      this.observeElements();
    } else {
      // Fallback для старых браузеров
      this.fallbackAnimation();
    }
  }

  observeElements() {
    const elements = document.querySelectorAll('.fade-in-on-scroll');
    elements.forEach(el => {
      this.observer.observe(el);
    });
  }

  fallbackAnimation() {
    const elements = document.querySelectorAll('.fade-in-on-scroll');
    elements.forEach(el => {
      el.classList.add('visible');
    });
  }
}

// ==== ГЛАВНАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ====
async function initPremiumMainPage() {
  try {
    console.log('[PremiumMain] 🚀 === ИНИЦИАЛИЗАЦИЯ ОПТИМИЗИРОВАННОГО ПРЕМИАЛЬНОГО ИНТЕРФЕЙСА ===');

    // Проверяем что все основные элементы есть в DOM
    const mainContent = document.getElementById('mainContent');
    const colorBtns = document.querySelectorAll('.color-option-btn');
    const memoryBtns = document.querySelectorAll('.memory-option-btn');
    const addToCartBtn = document.getElementById('addToCartBtn');
    
    console.log('[PremiumMain] 🔍 DOM check:', {
      mainContent: !!mainContent,
      colorBtns: colorBtns.length,
      memoryBtns: memoryBtns.length,
      addToCartBtn: !!addToCartBtn
    });

    // Добавляем премиальные стили анимаций
    addPremiumAnimationStyles();

    // Инициализация состояния
    loadPremiumCartState();
    updatePremiumPriceDisplay();
    updatePremiumStats();

    // Инициализация компонентов в оптимальном порядке
    console.log('[PremiumMain] 🔧 Инициализируем компоненты...');
    PremiumTabSystem.init();
    PremiumSlider.init();
    PremiumInfoCards.init();
    PremiumPurchaseSystem.init();
    PremiumCookieBanner.init();

    // Инициализируем Intersection Observer для ленивых анимаций
    const lazyAnimations = new LazyAnimationObserver();

    // Ждем загрузки менеджеров асинхронно
    const managersPromise = waitForPremiumManagers().then(managersLoaded => {
      if (managersLoaded) {
        console.log('[PremiumMain] ✨ Менеджеры загружены успешно');
        setupPremiumManagerEvents();

        // Принудительное обновление счетчика корзины
        if (window.CartManager && typeof window.CartManager.forceUpdateCounter === 'function') {
          setTimeout(() => {
            window.CartManager.forceUpdateCounter();
            console.log('[PremiumMain] 🔄 Принудительное обновление счетчика корзины');
          }, 300);
        }
      }
    });

    // Контент готов и видим
    if (mainContent) {
      mainContent.style.opacity = '1';
      mainContent.style.transform = 'translateY(0)';
    }

    // Отмечаем как инициализированную
    premiumState.pageInitialized = true;

    console.log('[PremiumMain] 🎉 === ОПТИМИЗИРОВАННЫЙ ПРЕМИАЛЬНЫЙ ИНТЕРФЕЙС ИНИЦИАЛИЗИРОВАН ===');

    // Ждем завершения загрузки менеджеров
    await managersPromise;

  } catch (error) {
    console.error('[PremiumMain] ❌ Ошибка инициализации:', error);

    // Fallback инициализация
    const mainContent = DOM.mainContent();
    if (mainContent) {
      mainContent.style.opacity = '1';
    }

    loadPremiumCartState();
    updatePremiumPriceDisplay();
    PremiumTabSystem.init();
    PremiumSlider.init();
    PremiumInfoCards.init();
    PremiumPurchaseSystem.init();

    console.log('[PremiumMain] ⚠️ Fallback инициализация выполнена');
  }
}

// ==== ОТЛАДОЧНЫЕ ФУНКЦИИ ====
window.debugPremiumMain = function() {
  console.log('=== DEBUG PREMIUM MAIN PAGE ===');
  console.log('Премиальное состояние:', {
    pageInitialized: premiumState.pageInitialized,
    managersReady: premiumState.managersReady,
    currentTab: premiumState.currentTab,
    currentSlide: premiumState.currentSlide,
    cameraCount: premiumState.cameraCount,
    memoryCount: premiumState.memoryCount,
    selectedColor: premiumState.selectedColor,
    selectedMemory: premiumState.selectedMemory
  });

  if (window.CartManager) {
    console.log('CartManager данные:', window.CartManager.getCartData());
    console.log('CartManager счетчик:', window.CartManager.getTotalCount());
  }

  // Диагностика hero секции
  const heroGif = document.querySelector('.hero-gif');
  if (heroGif) {
    const rect = heroGif.getBoundingClientRect();
    console.log('Hero гифка:', {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      visible: rect.width > 0 && rect.height > 0,
      minHeight: window.getComputedStyle(heroGif).minHeight,
      isFullscreen: rect.height >= window.innerHeight * 0.9
    });
  } else {
    console.warn('Hero гифка не найдена');
  }
};

window.testPremiumAddToCart = function() {
  console.log('=== TEST PREMIUM ADD TO CART ===');
  PremiumPurchaseSystem.addToCart();
};

window.testPremiumAnimations = function() {
  console.log('=== TEST PREMIUM ANIMATIONS ===');
  // Тестируем анимации для существующих элементов
  const priceDisplay = DOM.priceDisplay();
  if (priceDisplay) {
    priceDisplay.style.animation = 'countUp 0.5s ease';
  }
};

window.resetPremiumCart = function() {
  console.log('=== RESET PREMIUM CART ===');
  premiumState.cameraCount = 0;
  premiumState.memoryCount = 0;
  savePremiumCartState();
  updatePremiumPriceDisplay();
  if (window.CartManager) {
    window.CartManager.forceUpdateCounter();
  }
};

// ==== ЗАПУСК ПРЕМИАЛЬНОЙ ИНИЦИАЛИЗАЦИИ ====
console.log('[PremiumMain] 📄 Document state:', document.readyState);
if (document.readyState === 'loading') {
  console.log('[PremiumMain] ⏳ Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initPremiumMainPage);
} else {
  console.log('[PremiumMain] ✅ DOM ready, starting initialization...');
  initPremiumMainPage();
}

console.log('[PremiumMain] 🚀 Премиальный скрипт готов к инициализации!');

// ==== ИНИЦИАЛИЗАЦИЯ HEADER MANAGER ====
function initHeaderManager() {
  let attempts = 0;
  const maxAttempts = 50;
  
  const checkHeader = () => {
    attempts++;
    
    if (window.headerManager && window.headerManager.isInitialized) {
      console.log('[Main] ✅ HeaderManager найден и работает');
      window.headerManager.forceUpdateBadges();
      return;
    }
    
    if (window.HeaderManager && !window.headerManager) {
      console.log('[Main] 🔧 Создаем HeaderManager...');
      try {
        window.headerManager = new window.HeaderManager();
        if (window.headerManager.isInitialized) {
          console.log('[Main] ✅ HeaderManager создан и инициализирован');
          window.headerManager.forceUpdateBadges();
          return;
        }
      } catch (error) {
        console.error('[Main] ❌ Ошибка создания HeaderManager:', error);
      }
    }
    
    if (attempts < maxAttempts) {
      setTimeout(checkHeader, 100);
    } else {
      console.warn('[Main] ⚠️ HeaderManager не удалось инициализировать');
    }
  };
  
  checkHeader();
}

// Запускаем инициализацию HeaderManager
setTimeout(initHeaderManager, 500);

