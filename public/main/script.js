// === MAIN/SCRIPT.JS - ПРЕМИАЛЬНАЯ ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ ===
// Основано на премиальной дизайн-системе clip & go с glassmorphism

console.log('[PremiumMain] 🎨 Загрузка премиального интерфейса...');

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
  wantMemory: false,
  selectedColor: 'black',

  // Состояние UI
  currentTab: 'product',
  currentSlide: 0,
  slidesCount: 5,
  slideInterval: null,
  managersReady: false,
  pageInitialized: false,

  // Цены
  basePrice: 8900,
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

function savePremiumCartState() {
  try {
    if (window.CartManager) {
      const colorMapping = { 'black': 'Чёрный', 'white': 'Белый' };
      const cartColor = colorMapping[premiumState.selectedColor] || 'Чёрный';

      const success = window.CartManager.saveCartData(
          premiumState.cameraCount,
          premiumState.memoryCount,
          cartColor
      );

      if (success) {
        console.log('[PremiumMain] 💾 Состояние сохранено через CartManager');
      }
    } else {
      // Fallback на localStorage
      const data = {
        cameraCount: premiumState.cameraCount,
        memoryCount: premiumState.memoryCount,
        cartColor: premiumState.selectedColor === 'black' ? 'Чёрный' : 'Белый'
      };
      localStorage.setItem('cartData', JSON.stringify(data));
    }
  } catch (error) {
    console.error('[PremiumMain] ❌ Ошибка сохранения состояния:', error);
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

  const unit = premiumState.basePrice + (premiumState.wantMemory ? premiumState.memoryPrice : 0);

  if (premiumState.cameraCount + premiumState.memoryCount === 0) {
    priceDisplay.innerHTML = `
      <div style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px;">Итоговая цена:</div>
      <strong>${unit.toLocaleString('ru-RU')} ₽</strong>
    `;
  } else {
    const total = premiumState.cameraCount * premiumState.basePrice + premiumState.memoryCount * premiumState.memoryPrice;
    priceDisplay.innerHTML = `
      <div style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px;">Итоговая цена:</div>
      <strong>${total.toLocaleString('ru-RU')} ₽</strong>
    `;
  }

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
    this.setupColorOptions();
    this.setupMemoryOptions();
    this.setupAddToCartButton();

    updatePremiumPriceDisplay();
    console.log('[PremiumMain] 🛒 Премиальная система покупок инициализирована');
  }

  static setupColorOptions() {
    const colorOptions = DOM.colorOptions();

    colorOptions.forEach(btn => {
      btn.addEventListener('click', () => {
        // Убираем выделение с других кнопок
        colorOptions.forEach(b => b.classList.remove('selected'));

        // Выделяем выбранную кнопку
        btn.classList.add('selected');
        premiumState.selectedColor = btn.dataset.color;

        // Премиальная анимация
        PremiumAnimations.hapticFeedback(btn);

        savePremiumCartState();
        console.log(`[PremiumMain] 🎨 Выбран цвет: ${premiumState.selectedColor}`);
      });
    });
  }

  static setupMemoryOptions() {
    const memoryOptions = DOM.memoryOptions();

    memoryOptions.forEach(btn => {
      btn.addEventListener('click', () => {
        // Убираем выделение с других кнопок
        memoryOptions.forEach(b => b.classList.remove('selected'));

        // Выделяем выбранную кнопку
        btn.classList.add('selected');
        premiumState.wantMemory = btn.dataset.memory === '8gb';

        // Премиальная анимация
        PremiumAnimations.hapticFeedback(btn);

        updatePremiumPriceDisplay();
        console.log(`[PremiumMain] 💾 Память: ${premiumState.wantMemory ? '8GB' : 'без накопителя'}`);
      });
    });
  }

  static setupAddToCartButton() {
    const addBtn = DOM.addToCartBtn();
    if (!addBtn) return;

    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.addToCart();
    });
  }

  static addToCart() {
    console.log('[PremiumMain] 🛒 Добавление в премиальную корзину...');

    // Обновляем состояние
    premiumState.cameraCount++;
    if (premiumState.wantMemory) {
      premiumState.memoryCount++;
    }
    const totalItems = premiumState.cameraCount + premiumState.memoryCount;

    // Анимация кнопки
    const addBtn = DOM.addToCartBtn();
    PremiumAnimations.hapticFeedback(addBtn);

    // Обновляем интерфейс
    updatePremiumPriceDisplay();
    updatePremiumStats();
    savePremiumCartState();

    // Премиальные уведомления
    this.showPremiumNotification(totalItems);
    this.createPremiumFlyingAnimation();

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
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: white;
      padding: 20px 25px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      z-index: 9999;
      font-weight: 600;
      transform: translateX(100%);
      transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      max-width: 350px;
      font-family: 'Montserrat', sans-serif;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px;">
        <span style="font-size: 2em;">✨</span>
        <div>
          <div style="font-weight: 800; margin-bottom: 6px; color: #1ca6f8;">Добавлено в корзину!</div>
          <div style="font-size: 0.9em; opacity: 0.9;">Товары: ${totalItems} шт.</div>
          <div style="font-size: 0.85em; opacity: 0.8; margin-top: 4px;">Премиальное качество ✨</div>
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

  static createPremiumFlyingAnimation() {
    const activeSlide = document.querySelector('.slider-img.active');
    if (!activeSlide) return;

    const flyingImg = document.createElement('div');
    flyingImg.style.cssText = `
      position: fixed;
      width: 100px;
      height: 100px;
      background-image: url(${activeSlide.src});
      background-size: cover;
      background-position: center;
      z-index: 10000;
      pointer-events: none;
      border-radius: 16px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    `;

    const rect = activeSlide.getBoundingClientRect();
    const startX = rect.left + rect.width / 2 - 50;
    const startY = rect.top + rect.height / 2 - 50;

    flyingImg.style.left = `${startX}px`;
    flyingImg.style.top = `${startY}px`;

    document.body.appendChild(flyingImg);

    // Ищем цель для анимации
    const cartIcon = document.querySelector('.cart-icon, .header-actions .cart-btn, [href*="cart"]');

    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect();
      const endX = cartRect.left + cartRect.width / 2 - 50;
      const endY = cartRect.top + cartRect.height / 2 - 50;

      const animation = flyingImg.animate([
        {
          transform: 'translate(0, 0) scale(1) rotate(0deg)',
          opacity: 1
        },
        {
          transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.3) rotate(360deg)`,
          opacity: 0
        }
      ], {
        duration: 1500,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });

      animation.onfinish = () => {
        flyingImg.remove();

        // Анимация корзины
        if (cartIcon) {
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
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    color: white;
    padding: 25px 30px;
    border-radius: 20px;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    z-index: 9999;
    font-weight: 600;
    transform: translateX(100%);
    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    max-width: 380px;
    font-family: 'Montserrat', sans-serif;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 18px;">
      <span style="font-size: 2.5em;">🎉</span>
      <div>
        <div style="font-weight: 800; margin-bottom: 8px; color: #10b981; font-size: 1.1em;">Заказ создан!</div>
        <div style="font-size: 0.95em; opacity: 0.9; margin-bottom: 4px;">№ ${order.id}</div>
        <div style="font-size: 0.9em; opacity: 0.8;">Сумма: ${order.amount?.toLocaleString('ru-RU')} ₽</div>
        <div style="font-size: 0.8em; opacity: 0.7; margin-top: 6px;">Премиальное обслуживание ✨</div>
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

// ==== ГЛАВНАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ====
async function initPremiumMainPage() {
  try {
    console.log('[PremiumMain] 🎨 === ИНИЦИАЛИЗАЦИЯ ПРЕМИАЛЬНОГО ИНТЕРФЕЙСА ===');

    // Сначала показываем контент
    const mainContent = DOM.mainContent();
    if (mainContent) {
      mainContent.style.opacity = '1';
    }

    // Добавляем премиальные стили анимаций
    addPremiumAnimationStyles();

    // Инициализация состояния
    loadPremiumCartState();
    updatePremiumPriceDisplay();
    updatePremiumStats();

    // Инициализация компонентов
    PremiumTabSystem.init();
    PremiumSlider.init();
    PremiumInfoCards.init();
    PremiumPurchaseSystem.init();
    PremiumCookieBanner.init();

    // Ждем загрузки менеджеров асинхронно
    waitForPremiumManagers().then(managersLoaded => {
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

    // Отмечаем как инициализированную
    premiumState.pageInitialized = true;

    console.log('[PremiumMain] 🎉 === ПРЕМИАЛЬНЫЙ ИНТЕРФЕЙС ИНИЦИАЛИЗИРОВАН ===');

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
    wantMemory: premiumState.wantMemory
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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPremiumMainPage);
} else {
  initPremiumMainPage();
}

console.log('[PremiumMain] 🚀 Премиальный скрипт готов к инициализации!');