// === УЛУЧШЕННЫЙ SCRIPT.JS - ИСПРАВЛЕННАЯ ВЕРСИЯ ===

// ==== State & Prices ====
let cameraCount = 0;
let memoryCount = 0;
let wantMemory = false;
const basePrice   = 8900;
const memoryPrice = 500;

// ==== UI Helpers ====
const priceDisplay     = () => document.getElementById('priceDisplay');
const purchaseButtons  = () => document.querySelector('.purchase-buttons');
const cookieBanner     = () => document.querySelector('.cookie-banner');
const acceptCookiesBtn = () => document.getElementById('accept-cookies');

// ==== Ожидание менеджеров ====
function waitForManagers() {
  return new Promise((resolve) => {
    const checkManagers = () => {
      if (window.CartManager && window.OrderManager) {
        console.log('[Script] Все менеджеры загружены');
        resolve();
      } else {
        console.log('[Script] Ожидание менеджеров...');
        setTimeout(checkManagers, 100);
      }
    };
    checkManagers();
  });
}

// ==== Persist Cart State ====
function loadCartState() {
  try {
    if (window.CartManager) {
      const data = window.CartManager.getCartData();
      cameraCount = data.cameraCount || 0;
      memoryCount = data.memoryCount || 0;
      console.log('[Script] Состояние корзины загружено через CartManager:', { cameraCount, memoryCount });
    } else {
      // Fallback на старый способ
      const data = JSON.parse(localStorage.getItem('cartData') || '{}');
      cameraCount = data.cameraCount || 0;
      memoryCount = data.memoryCount || 0;
      console.log('[Script] Состояние корзины загружено из localStorage:', { cameraCount, memoryCount });
    }
  } catch (error) {
    console.error('[Script] Ошибка загрузки состояния корзины:', error);
    cameraCount = 0;
    memoryCount = 0;
  }
}

function saveCartState() {
  try {
    // Определяем выбранный цвет
    const selectedColorBtn = document.querySelector('#colorOptions .option-btn.selected');
    const cartColor = selectedColorBtn?.dataset.color === 'black' ? 'Чёрный' : 'Белый';

    if (window.CartManager) {
      const success = window.CartManager.saveCartData(cameraCount, memoryCount, cartColor);
      if (success) {
        console.log('[Script] Состояние корзины сохранено через CartManager:', { cameraCount, memoryCount, cartColor });
      }
    } else {
      // Fallback на старый способ
      const data = { cameraCount, memoryCount, cartColor };
      localStorage.setItem('cartData', JSON.stringify(data));
      console.log('[Script] Состояние корзины сохранено в localStorage:', data);

      // Обновляем счетчик вручную если нет CartManager
      updateCartCounterFallback();
    }
  } catch (error) {
    console.error('[Script] Ошибка сохранения состояния корзины:', error);
  }
}

function updateCartCounterFallback() {
  const totalCount = cameraCount + memoryCount;
  const counters = document.querySelectorAll('.cart-count, #cart-count, .cart-badge');

  counters.forEach(counter => {
    if (counter) {
      counter.textContent = totalCount;
      counter.style.display = totalCount > 0 ? 'flex' : 'flex';
    }
  });
}

// ==== Update Price Display ====
function updatePriceDisplay() {
  const dp = priceDisplay();
  if (!dp) return;

  const unit = basePrice + (wantMemory ? memoryPrice : 0);
  if (cameraCount + memoryCount === 0) {
    dp.innerHTML = `Итоговая цена:<br>${unit.toLocaleString('ru-RU')} ₽`;
  } else {
    const total = cameraCount * basePrice + memoryCount * memoryPrice;
    dp.innerHTML = `Итоговая цена:<br>${total.toLocaleString('ru-RU')} ₽`;
  }
}

// ==== Add to Cart Handler - ИСПРАВЛЕНО ====
function addToCart() {
  console.log('[AddToCart] Добавление в корзину...');
  console.log('[AddToCart] Текущие количества ДО:', { cameraCount, memoryCount });

  // ИСПРАВЛЕНИЕ: Каждый раз добавляем по одному товару
  cameraCount++; // Всегда добавляем камеру
  if (wantMemory) {
    memoryCount++; // Добавляем память только если выбрана
  }

  console.log('[AddToCart] Новые количества ПОСЛЕ:', { cameraCount, memoryCount });

  updatePriceDisplay();
  saveCartState();

  // Показываем уведомление
  showAddToCartNotification();

  // Flying animation
  createFlyingAnimation();

  // Проверяем OrderManager для уведомлений
  if (window.OrderManager) {
    console.log('[Script] OrderManager доступен, статистика:', window.OrderManager.getStats());
  }
}

// Уведомление о добавлении в корзину
function showAddToCartNotification() {
  const notification = document.createElement('div');
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

// Анимация летящего товара
function createFlyingAnimation() {
  const img = document.querySelector('.slider-img.active');
  if (!img) return;

  const fly = document.createElement('img');
  fly.src = img.src;
  fly.style.cssText = `
        position: fixed;
        width: 100px;
        height: 100px;
        z-index: 10000;
        pointer-events: none;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        object-fit: cover;
    `;

  const rect = img.getBoundingClientRect();
  const startX = rect.left + rect.width / 2 - 50;
  const startY = rect.top  + rect.height/ 2 - 50;
  fly.style.left = `${startX}px`;
  fly.style.top  = `${startY}px`;

  document.body.append(fly);

  // Ищем иконку корзины
  const cartIcon = document.querySelector('.cart-icon, [href*="cart"], .header-cart');
  if (cartIcon) {
    const ci = cartIcon.getBoundingClientRect();
    const dx = ci.left + ci.width/2 - 50 - startX;
    const dy = ci.top  + ci.height/2 - 50 - startY;

    fly.animate([
      {
        transform: 'translate(0,0) scale(1) rotate(0deg)',
        opacity: 1,
        filter: 'brightness(1)'
      },
      {
        transform: `translate(${dx}px,${dy}px) scale(0.3) rotate(360deg)`,
        opacity: 0,
        filter: 'brightness(1.5)'
      }
    ], {
      duration: 1200,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    }).onfinish = () => {
      fly.remove();

      // Анимация корзины при получении товара
      if (cartIcon) {
        cartIcon.style.animation = 'cartBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        setTimeout(() => {
          cartIcon.style.animation = '';
        }, 600);
      }
    };
  } else {
    // Если корзину не нашли, просто удаляем элемент
    setTimeout(() => fly.remove(), 1200);
  }
}

// ==== Cookie Banner Logic ====
function initCookieBanner() {
  const banner = cookieBanner();
  const btn    = acceptCookiesBtn();
  if (!banner || !btn) return;

  // Скрываем баннер, если уже принято
  if (localStorage.getItem('cookiesAccepted')) {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = 'none';

  function onScroll() {
    const sec = document.querySelector('.purchase-section');
    if (!sec) return;
    const rect = sec.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      banner.style.display = 'flex';
      banner.style.animation = 'slideInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      window.removeEventListener('scroll', onScroll);
    }
  }
  window.addEventListener('scroll', onScroll);

  btn.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted','true');
    banner.style.animation = 'slideOutDown 0.3s ease-out forwards';
    setTimeout(() => {
      banner.style.display = 'none';
    }, 300);
  });
}

// ==== Slider ====
const slides = document.querySelectorAll('.slider-img');
let currentSlide = 0;

function showSlide(i) {
  slides.forEach((s, idx) => {
    s.classList.toggle('active', idx === i);
    if (idx === i) {
      s.style.animation = 'slideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
  });
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(currentSlide);
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

// Автоматическое переключение слайдов
function initAutoSlider() {
  setInterval(() => {
    if (slides.length > 1) {
      nextSlide();
    }
  }, 5000); // Каждые 5 секунд
}

// ==== Header scroll effect ====
function initHeaderScroll() {
  const header = document.querySelector('header, .site-header');
  const hero   = document.querySelector('.hero-gif, .hero-section');

  if (!header) return;

  const threshold = hero ? hero.offsetHeight / 2 : 100;

  function handleScroll() {
    const scrolled = window.scrollY > threshold;
    header.classList.toggle('scrolled', scrolled);

    // Добавляем плавный эффект
    if (scrolled) {
      header.style.animation = 'headerSlideDown 0.3s ease-out';
    }
  }

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Вызываем сразу для начального состояния
}

// ==== Tabs ====
const tabIds = ['charTableContainer', 'faqContainer', 'shippingContainer'];

function toggleTab(id) {
  tabIds.forEach(other => {
    const cnt = document.getElementById(other);
    const hdr = cnt?.closest('.tab-item')?.querySelector('.tab-header');
    if (!cnt || !hdr) return;

    const isCurrentlyOpen = cnt.classList.contains('open');
    const shouldOpen = (other === id) && !isCurrentlyOpen;

    // Закрываем все табы
    cnt.classList.remove('open');
    hdr.classList.remove('opened');

    if (shouldOpen) {
      // Открываем выбранный таб с анимацией
      setTimeout(() => {
        cnt.classList.add('open');
        hdr.classList.add('opened');
        cnt.style.animation = 'tabSlideDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      }, 100);
    }
  });
}

function toggleCharacteristics() { toggleTab('charTableContainer'); }
function toggleFAQ()             { toggleTab('faqContainer'); }
function toggleShipping()        { toggleTab('shippingContainer'); }

// ==== Премиальные анимации и эффекты ====
function initPremiumEffects() {
  // Параллакс эффект для hero секции
  const hero = document.querySelector('.hero-gif, .hero-section');
  if (hero) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.3;
      hero.style.transform = `translateY(${rate}px)`;
    });
  }

  // Анимация появления элементов при скролле
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

  // Применяем наблюдатель к элементам
  document.querySelectorAll('.fade-in-on-scroll').forEach(el => {
    observer.observe(el);
  });
}

// ==== Обработка событий менеджеров ====
function setupManagerEventListeners() {
  // Слушаем обновления корзины
  window.addEventListener('cartUpdated', (e) => {
    console.log('[Script] Событие cartUpdated получено:', e.detail);
    loadCartState();
    updatePriceDisplay();
  });

  // Слушаем обновления заказов
  window.addEventListener('ordersUpdated', (e) => {
    console.log('[Script] Событие ordersUpdated получено:', e.detail);

    // Можем показать уведомление о новом заказе
    if (e.detail.action === 'added' && e.detail.order) {
      showOrderNotification(e.detail.order);
    }
  });
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

// ==== Initialization ====
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Script] 🚀 Главная страница загружается...');

  try {
    // Ждем загрузки менеджеров
    await waitForManagers();

    // Инициализация состояния
    loadCartState();
    updatePriceDisplay();

    // Настройка обработчиков событий менеджеров
    setupManagerEventListeners();

    // Fade-in анимации
    document.querySelectorAll('.fade-in-on-scroll').forEach(el => {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      io.observe(el);
    });

    // Обработчики выбора цвета
    document.querySelectorAll('#colorOptions .option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#colorOptions .option-btn')
            .forEach(x => x.classList.remove('selected'));
        btn.classList.add('selected');

        // Анимация выбора
        btn.style.animation = 'buttonSelect 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        setTimeout(() => {
          btn.style.animation = '';
        }, 300);

        // Пересохраняем с новым цветом
        saveCartState();
      });
    });

    // Обработчики выбора памяти
    document.querySelectorAll('#memoryOptions .memory-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wantMemory = btn.dataset.memory === '8gb';
        document.querySelectorAll('#memoryOptions .memory-btn')
            .forEach(x => x.classList.remove('selected'));
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
    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[Event] Клик по кнопке "Добавить в корзину"');

        // Анимация кнопки
        addBtn.style.animation = 'buttonPress 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        setTimeout(() => {
          addBtn.style.animation = '';
        }, 200);

        addToCart();
      });
    }

    // Инициализация остальных компонентов
    initCookieBanner();
    initHeaderScroll();
    initPremiumEffects();

    // Слайдер
    if (slides.length > 0) {
      showSlide(0);
      if (slides.length > 1) {
        initAutoSlider();
      }
    }

    console.log('[Script] ✅ Главная страница инициализирована');

  } catch (error) {
    console.error('[Script] ❌ Ошибка инициализации:', error);

    // Fallback инициализация без менеджеров
    loadCartState();
    updatePriceDisplay();
    initCookieBanner();
    initHeaderScroll();

    if (slides.length > 0) {
      showSlide(0);
    }
  }
});

// ==== Добавляем недостающие CSS анимации ====
if (!document.getElementById('main-page-animations')) {
  const style = document.createElement('style');
  style.id = 'main-page-animations';
  style.textContent = `
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideOutDown {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(30px);
            }
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        @keyframes headerSlideDown {
            from {
                transform: translateY(-10px);
                opacity: 0.8;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes tabSlideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(40px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes buttonSelect {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                transform: scale(1);
            }
        }
        
        @keyframes buttonPress {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(0.98);
            }
            100% {
                transform: scale(1);
            }
        }
        
        @keyframes cartBounce {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.2);
            }
        }
        
        .fade-in-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .fade-in-on-scroll.visible {
            opacity: 1;
            transform: translateY(0);
        }
    `;
  document.head.appendChild(style);
}

console.log('[Script] 🎉 Главная страница готова к использованию!');