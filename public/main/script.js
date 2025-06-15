// === MAIN/SCRIPT.JS - ТОЛЬКО ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ ===
// Общие менеджеры загружаются из ../js/cart-manager.js и ../js/order-manager.js

console.log('[MainPage] 🚀 Загрузка главной страницы...');

// ==== Состояние главной страницы ====
let cameraCount = 0;
let memoryCount = 0;
let wantMemory = false;
const basePrice = 8900;
const memoryPrice = 500;

// Флаги инициализации
let managersReady = false;
let pageInitialized = false;

// ==== Кэширование DOM элементов ====
const DOM = {
  priceDisplay: () => document.getElementById('priceDisplay'),
  addToCartBtn: () => document.getElementById('addToCartBtn'),
  cookieBanner: () => document.querySelector('.cookie-banner'),
  acceptCookiesBtn: () => document.getElementById('accept-cookies'),
  colorOptions: () => document.querySelectorAll('#colorOptions .option-btn'),
  memoryOptions: () => document.querySelectorAll('#memoryOptions .memory-btn'),
  slides: () => document.querySelectorAll('.slider-img')
};

// ==== Ожидание менеджеров ====
async function waitForManagers() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 секунд максимум

    const checkManagers = () => {
      attempts++;

      if (window.CartManager && window.OrderManager) {
        console.log('[MainPage] ✅ Общие менеджеры загружены');
        managersReady = true;
        resolve(true);
      } else if (attempts >= maxAttempts) {
        console.warn('[MainPage] ⚠️ Менеджеры не загрузились за 5 секунд, продолжаем без них');
        resolve(false);
      } else {
        console.log(`[MainPage] ⏳ Ожидание менеджеров... (попытка ${attempts}/${maxAttempts})`);
        setTimeout(checkManagers, 100);
      }
    };

    checkManagers();
  });
}

// ==== Управление состоянием корзины ====
function loadCartState() {
  try {
    if (window.CartManager) {
      const data = window.CartManager.getCartData();
      cameraCount = data.cameraCount || 0;
      memoryCount = data.memoryCount || 0;
      console.log('[MainPage] Состояние корзины загружено через CartManager:', { cameraCount, memoryCount });
    } else {
      // Fallback на localStorage
      const data = JSON.parse(localStorage.getItem('cartData') || '{}');
      cameraCount = data.cameraCount || 0;
      memoryCount = data.memoryCount || 0;
      console.log('[MainPage] Состояние корзины загружено из localStorage:', { cameraCount, memoryCount });
    }
  } catch (error) {
    console.error('[MainPage] Ошибка загрузки состояния корзины:', error);
    cameraCount = 0;
    memoryCount = 0;
  }
}

function saveCartState() {
  try {
    const selectedColorBtn = document.querySelector('#colorOptions .option-btn.selected');
    const cartColor = selectedColorBtn?.dataset.color === 'black' ? 'Чёрный' : 'Белый';

    if (window.CartManager) {
      const success = window.CartManager.saveCartData(cameraCount, memoryCount, cartColor);
      if (success) {
        console.log('[MainPage] Состояние корзины сохранено через CartManager:', { cameraCount, memoryCount, cartColor });
      }
    } else {
      // Fallback на localStorage
      const data = { cameraCount, memoryCount, cartColor };
      localStorage.setItem('cartData', JSON.stringify(data));
      console.log('[MainPage] Состояние корзины сохранено в localStorage:', data);
    }
  } catch (error) {
    console.error('[MainPage] Ошибка сохранения состояния корзины:', error);
  }
}

// ==== Обновление отображения цены ====
function updatePriceDisplay() {
  const priceDisplay = DOM.priceDisplay();
  if (!priceDisplay) return;

  const unit = basePrice + (wantMemory ? memoryPrice : 0);

  if (cameraCount + memoryCount === 0) {
    priceDisplay.innerHTML = `Итоговая цена:<br><strong>${unit.toLocaleString('ru-RU')} ₽</strong>`;
  } else {
    const total = cameraCount * basePrice + memoryCount * memoryPrice;
    priceDisplay.innerHTML = `Итоговая цена:<br><strong>${total.toLocaleString('ru-RU')} ₽</strong>`;
  }
}

// ==== Добавление в корзину ====
function addToCart() {
  console.log('[MainPage] Добавление в корзину...');
  console.log('[MainPage] Состояние ДО:', { cameraCount, memoryCount, wantMemory });

  // Добавляем товары
  cameraCount++;
  if (wantMemory) {
    memoryCount++;
  }

  console.log('[MainPage] Состояние ПОСЛЕ:', { cameraCount, memoryCount });

  // Обновляем интерфейс
  updatePriceDisplay();
  saveCartState();

  // Показываем уведомления и анимации
  showAddToCartNotification();
  createFlyingAnimation();

  // Принудительно обновляем счетчик через CartManager
  if (window.CartManager && typeof window.CartManager.forceUpdateCounter === 'function') {
    setTimeout(() => {
      window.CartManager.forceUpdateCounter();
    }, 100);
  }
}

// ==== Уведомления ====
function showAddToCartNotification() {
  // Удаляем предыдущее уведомление если есть
  const existingNotification = document.querySelector('.cart-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(40,167,69,0.3);
    z-index: 9999;
    font-weight: 600;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 300px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 1.5em;">🛒</span>
      <div>
        <div style="font-weight: 800; margin-bottom: 4px;">Добавлено в корзину!</div>
        <div style="font-size: 0.9em; opacity: 0.9;">Товары: ${cameraCount + memoryCount} шт.</div>
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
    }, 400);
  }, 3000);
}

function createFlyingAnimation() {
  const activeSlide = document.querySelector('.slider-img.active');
  if (!activeSlide) return;

  const flyingImg = document.createElement('img');
  flyingImg.src = activeSlide.src;
  flyingImg.style.cssText = `
    position: fixed;
    width: 100px;
    height: 100px;
    z-index: 10000;
    pointer-events: none;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    object-fit: cover;
  `;

  const rect = activeSlide.getBoundingClientRect();
  const startX = rect.left + rect.width / 2 - 50;
  const startY = rect.top + rect.height / 2 - 50;

  flyingImg.style.left = `${startX}px`;
  flyingImg.style.top = `${startY}px`;

  document.body.appendChild(flyingImg);

  // Ищем цель для анимации (иконка корзины)
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
      duration: 1200,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });

    animation.onfinish = () => {
      flyingImg.remove();

      // Анимация корзины
      if (cartIcon) {
        cartIcon.style.animation = 'cartBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        setTimeout(() => {
          cartIcon.style.animation = '';
        }, 600);
      }
    };
  } else {
    // Если корзину не нашли, просто удаляем элемент
    setTimeout(() => flyingImg.remove(), 1200);
  }
}

// ==== Cookie Banner ====
function initCookieBanner() {
  const banner = DOM.cookieBanner();
  const acceptBtn = DOM.acceptCookiesBtn();

  if (!banner || !acceptBtn) {
    console.warn('[MainPage] Cookie banner elements not found');
    return;
  }

  // Проверяем, приняты ли уже cookies
  if (localStorage.getItem('cookiesAccepted')) {
    banner.style.display = 'none';
    return;
  }

  // Показываем баннер при прокрутке к секции покупки
  let bannerShown = false;

  function onScroll() {
    if (bannerShown) return;

    const purchaseSection = document.querySelector('.purchase-section');
    if (!purchaseSection) return;

    const rect = purchaseSection.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      banner.style.display = 'flex';
      banner.style.animation = 'slideInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      bannerShown = true;
      window.removeEventListener('scroll', onScroll);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Обработчик принятия cookies
  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted', 'true');
    banner.style.animation = 'slideOutDown 0.3s ease-out forwards';
    setTimeout(() => {
      banner.style.display = 'none';
    }, 300);
  });
}

// ==== Слайдер ====
let currentSlide = 0;
let slideInterval = null;

function initSlider() {
  const slides = DOM.slides();
  if (slides.length === 0) return;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      if (i === index) {
        slide.style.animation = 'slideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      }
    });
  }

  // Глобальные функции для кнопок в HTML
  window.prevSlide = function() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
    resetAutoSlider();
  };

  window.nextSlide = function() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
    resetAutoSlider();
  };

  function resetAutoSlider() {
    if (slideInterval) {
      clearInterval(slideInterval);
    }
    startAutoSlider();
  }

  function startAutoSlider() {
    if (slides.length > 1) {
      slideInterval = setInterval(() => {
        window.nextSlide();
      }, 5000);
    }
  }

  // Инициализация
  showSlide(0);
  startAutoSlider();

  console.log('[MainPage] Слайдер инициализирован с', slides.length, 'слайдами');
}

// ==== Вкладки ====
function initTabs() {
  const tabIds = ['charTableContainer', 'faqContainer', 'shippingContainer'];

  function toggleTab(targetId) {
    tabIds.forEach(id => {
      const content = document.getElementById(id);
      const header = content?.closest('.tab-item')?.querySelector('.tab-header');

      if (!content || !header) return;

      const isCurrentlyOpen = content.classList.contains('open');
      const shouldOpen = (id === targetId) && !isCurrentlyOpen;

      // Закрываем все вкладки
      content.classList.remove('open');
      header.classList.remove('opened');

      if (shouldOpen) {
        // Открываем выбранную вкладку с небольшой задержкой
        setTimeout(() => {
          content.classList.add('open');
          header.classList.add('opened');
          content.style.animation = 'tabSlideDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 100);
      }
    });
  }

  // Глобальные функции для обработчиков в HTML
  window.toggleCharacteristics = () => toggleTab('charTableContainer');
  window.toggleFAQ = () => toggleTab('faqContainer');
  window.toggleShipping = () => toggleTab('shippingContainer');

  console.log('[MainPage] Вкладки инициализированы');
}

// ==== Scroll эффекты ====
function initScrollEffects() {
  // Fade-in анимации
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.style.animation = 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in-on-scroll').forEach(el => {
    observer.observe(el);
  });

  // Параллакс для hero секции
  const hero = document.querySelector('.hero-gif');
  if (hero) {
    let ticking = false;

    function updateParallax() {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.3;
      hero.style.transform = `translateY(${rate}px)`;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  console.log('[MainPage] Scroll эффекты инициализированы');
}

// ==== Обработчики событий ====
function setupEventListeners() {
  // Выбор цвета
  DOM.colorOptions().forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.colorOptions().forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // Анимация выбора
      btn.style.animation = 'buttonSelect 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      setTimeout(() => {
        btn.style.animation = '';
      }, 300);

      saveCartState();
    });
  });

  // Выбор памяти
  DOM.memoryOptions().forEach(btn => {
    btn.addEventListener('click', () => {
      wantMemory = btn.dataset.memory === '8gb';
      DOM.memoryOptions().forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // Анимация выбора
      btn.style.animation = 'buttonSelect 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      setTimeout(() => {
        btn.style.animation = '';
      }, 300);

      updatePriceDisplay();
    });
  });

  // Кнопка добавления в корзину
  const addBtn = DOM.addToCartBtn();
  if (addBtn) {
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[MainPage] Клик по кнопке "Добавить в корзину"');

      // Анимация кнопки
      addBtn.style.animation = 'buttonPress 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      setTimeout(() => {
        addBtn.style.animation = '';
      }, 200);

      addToCart();
    });
  }

  console.log('[MainPage] Обработчики событий настроены');
}

// ==== События менеджеров ====
function setupManagerEvents() {
  // Слушаем обновления корзины
  window.addEventListener('cartUpdated', (e) => {
    console.log('[MainPage] Событие cartUpdated получено:', e.detail);
    loadCartState();
    updatePriceDisplay();
  });

  // Слушаем обновления заказов
  window.addEventListener('ordersUpdated', (e) => {
    console.log('[MainPage] Событие ordersUpdated получено:', e.detail);

    if (e.detail.action === 'added' && e.detail.order) {
      showOrderNotification(e.detail.order);
    }
  });

  console.log('[MainPage] События менеджеров настроены');
}

function showOrderNotification(order) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #1ca6f8, #0ea5e9);
    color: white;
    padding: 20px 24px;
    border-radius: 16px;
    box-shadow: 0 12px 35px rgba(28, 166, 248, 0.3);
    z-index: 9999;
    font-weight: 600;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 350px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px;">
      <span style="font-size: 2em;">📦</span>
      <div>
        <div style="font-weight: 800; margin-bottom: 6px;">Заказ создан!</div>
        <div style="font-size: 0.9em; opacity: 0.9;">№ ${order.id}</div>
        <div style="font-size: 0.85em; opacity: 0.8; margin-top: 4px;">Сумма: ${order.amount?.toLocaleString('ru-RU')} ₽</div>
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
    }, 400);
  }, 4000);
}

// ==== Добавление CSS анимаций ====
function addAnimationStyles() {
  if (document.getElementById('main-page-animations')) return;

  const style = document.createElement('style');
  style.id = 'main-page-animations';
  style.textContent = `
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideOutDown {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(30px); }
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes tabSlideDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes buttonSelect {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    @keyframes buttonPress {
      0% { transform: scale(1); }
      50% { transform: scale(0.98); }
      100% { transform: scale(1); }
    }
    
    @keyframes cartBounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
  `;

  document.head.appendChild(style);
}

// ==== Главная функция инициализации ====
async function initMainPage() {
  try {
    console.log('[MainPage] 🚀 Начинаем инициализацию главной страницы');

    // Добавляем стили анимаций
    addAnimationStyles();

    // Ждем загрузки общих менеджеров
    const managersLoaded = await waitForManagers();

    if (managersLoaded) {
      console.log('[MainPage] ✅ Общие менеджеры загружены успешно');
      setupManagerEvents();
    } else {
      console.warn('[MainPage] ⚠️ Продолжаем без менеджеров');
    }

    // Инициализация состояния
    loadCartState();
    updatePriceDisplay();

    // Принудительное обновление счетчика корзины
    if (window.CartManager && typeof window.CartManager.forceUpdateCounter === 'function') {
      setTimeout(() => {
        window.CartManager.forceUpdateCounter();
        console.log('[MainPage] 🔄 Принудительное обновление счетчика корзины');
      }, 200);
    }

    // Инициализация компонентов страницы
    initSlider();
    initTabs();
    initScrollEffects();
    initCookieBanner();

    // Настройка обработчиков событий
    setupEventListeners();

    // Отмечаем как инициализированную
    pageInitialized = true;

    console.log('[MainPage] ✅ Главная страница инициализирована успешно');

  } catch (error) {
    console.error('[MainPage] ❌ Ошибка инициализации:', error);

    // Fallback инициализация
    loadCartState();
    updatePriceDisplay();
    initSlider();
    initTabs();
    initCookieBanner();
    setupEventListeners();

    console.log('[MainPage] ⚠️ Fallback инициализация выполнена');
  }
}

// ==== Отладочные функции ====
window.debugMainPage = function() {
  console.log('=== DEBUG MAIN PAGE ===');
  console.log('Состояние:', {
    pageInitialized,
    managersReady,
    cameraCount,
    memoryCount,
    wantMemory,
    cartManager: !!window.CartManager,
    orderManager: !!window.OrderManager
  });

  if (window.CartManager) {
    console.log('CartManager данные:', window.CartManager.getCartData());
    console.log('CartManager счетчик:', window.CartManager.getTotalCount());
  }
};

window.testAddToCart = function() {
  console.log('=== TEST ADD TO CART ===');
  addToCart();
};

window.resetCart = function() {
  console.log('=== RESET CART ===');
  cameraCount = 0;
  memoryCount = 0;
  saveCartState();
  updatePriceDisplay();
  if (window.CartManager) {
    window.CartManager.forceUpdateCounter();
  }
};

// ==== Запуск инициализации ====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMainPage);
} else {
  initMainPage();
}

console.log('[MainPage] 🎉 Скрипт главной страницы готов к инициализации!');