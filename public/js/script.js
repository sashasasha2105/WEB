// === File: js/script.js - ИСПРАВЛЕННАЯ ВЕРСИЯ ===

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

// ==== Persist Cart State (теперь через CartManager) ====
function loadCartState() {
  if (window.CartManager) {
    const data = window.CartManager.getCartData();
    cameraCount = data.cameraCount || 0;
    memoryCount = data.memoryCount || 0;
  } else {
    // Fallback на старый способ
    try {
      const data = JSON.parse(localStorage.getItem('cartData') || '{}');
      cameraCount = data.cameraCount || 0;
      memoryCount = data.memoryCount || 0;
    } catch {
      cameraCount = 0;
      memoryCount = 0;
    }
  }
}

function saveCartState() {
  // Определяем выбранный цвет
  const selectedColorBtn = document.querySelector('#colorOptions .option-btn.selected');
  const cartColor = selectedColorBtn?.dataset.color === 'black' ? 'Чёрный' : 'Белый';

  if (window.CartManager) {
    window.CartManager.saveCartData(cameraCount, memoryCount, cartColor);
  } else {
    // Fallback на старый способ
    const data = {
      cameraCount,
      memoryCount,
      cartColor
    };
    localStorage.setItem('cartData', JSON.stringify(data));

    if (window.updateCartCounter) {
      window.updateCartCounter();
    }
  }
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

  // ИСПРАВЛЕНИЕ: Каждый раз добавляем по одному товару, а не устанавливаем в 1
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
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(40,167,69,0.3);
    z-index: 9999;
    font-weight: 500;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 300px;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 1.5em;">🛒</span>
      <div>
        <div style="font-weight: 600;">Добавлено в корзину!</div>
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
  fly.style.position = 'fixed';
  fly.style.width    = '100px';
  fly.style.zIndex   = '10000';
  fly.style.pointerEvents = 'none';

  const rect = img.getBoundingClientRect();
  const startX = rect.left + rect.width / 2 - 50;
  const startY = rect.top  + rect.height/ 2 - 50;
  fly.style.left = `${startX}px`;
  fly.style.top  = `${startY}px`;

  document.body.append(fly);

  const cartIcon = document.querySelector('.cart-icon');
  if (cartIcon) {
    const ci = cartIcon.getBoundingClientRect();
    const dx = ci.left + ci.width/2 - 50 - startX;
    const dy = ci.top  + ci.height/2 - 50 - startY;

    fly.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(0) rotate(720deg)`, opacity: 0 }
    ], {
      duration: 1000,
      easing: 'ease-in-out',
      fill: 'forwards'
    }).onfinish = () => fly.remove();
  } else {
    // Если корзину не нашли, просто удаляем элемент
    setTimeout(() => fly.remove(), 1000);
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
      window.removeEventListener('scroll', onScroll);
    }
  }
  window.addEventListener('scroll', onScroll);

  btn.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted','true');
    banner.style.display = 'none';
  });
}

// ==== Slider ====
const slides = document.querySelectorAll('.slider-img');
let currentSlide = 0;
function showSlide(i) {
  slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
}
function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(currentSlide);
}
function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

// ==== Header scroll effect ====
function initHeaderScroll() {
  const header = document.querySelector('header');
  const hero   = document.querySelector('.hero-gif');
  window.addEventListener('scroll', () => {
    if (!header) return;
    const threshold = hero ? hero.offsetHeight : 0;
    header.classList.toggle('scrolled', window.scrollY > threshold);
  });
}

// ==== Tabs ====
const tabIds = ['charTableContainer', 'faqContainer', 'shippingContainer'];
function toggleTab(id) {
  tabIds.forEach(other => {
    const cnt = document.getElementById(other);
    const hdr = cnt?.closest('.tab-item')?.querySelector('.tab-header');
    if (!cnt || !hdr) return;
    const open = (other === id) && !cnt.classList.contains('open');
    cnt.classList.toggle('open', open);
    hdr.classList.toggle('opened', open);
  });
}
function toggleCharacteristics() { toggleTab('charTableContainer'); }
function toggleFAQ()             { toggleTab('faqContainer'); }
function toggleShipping()        { toggleTab('shippingContainer'); }

// ==== Initialization ====
document.addEventListener('DOMContentLoaded', () => {
  // Ждем инициализации CartManager
  const initializeAfterCartManager = () => {
    if (window.CartManager) {
      // Считываем из CartManager
      loadCartState();
      updatePriceDisplay();

      // Слушаем события обновления корзины
      window.addEventListener('cartUpdated', () => {
        console.log('[Script] Событие cartUpdated получено, обновляем состояние');
        loadCartState();
        updatePriceDisplay();
      });

      console.log('[Script] CartManager найден и подключен');
    } else {
      // Если CartManager еще не загружен, повторяем через 100мс
      setTimeout(initializeAfterCartManager, 100);
    }
  };

  initializeAfterCartManager();

  // Fade-in on scroll
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

  // Цвет камеры
  document.querySelectorAll('#colorOptions .option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#colorOptions .option-btn')
          .forEach(x => x.classList.remove('selected'));
      btn.classList.add('selected');
      // Пересохраняем с новым цветом
      saveCartState();
    });
  });

  // Память
  document.querySelectorAll('#memoryOptions .memory-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wantMemory = btn.dataset.memory === '8gb';
      document.querySelectorAll('#memoryOptions .memory-btn')
          .forEach(x => x.classList.remove('selected'));
      btn.classList.add('selected');
      updatePriceDisplay();
    });
  });

  // Добавить в корзину
  const addBtn = document.getElementById('addToCartBtn');
  if (addBtn) {
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[Event] Клик по кнопке "Добавить в корзину"');
      addToCart();
    });
  }

  // Инициализация баннера cookies
  initCookieBanner();

  // Слайдер старт
  if (slides.length > 0) {
    showSlide(0);
  }

  // Шапка при скролле
  initHeaderScroll();
});