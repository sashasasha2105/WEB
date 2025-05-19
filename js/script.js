// js/script.js

// ==== State & Prices ====
let cameraCount = 0;
let memoryCount = 0;
let wantMemory = false;
const basePrice   = 8900;
const memoryPrice = 500;

// ==== UI Helpers ====
const cartBadge        = () => document.querySelector('.cart-count');
const priceDisplay     = () => document.getElementById('priceDisplay');
const purchaseButtons  = () => document.querySelector('.purchase-buttons');
const cookieBanner     = () => document.querySelector('.cookie-banner');
const acceptCookiesBtn = () => document.getElementById('accept-cookies');

// ==== Persist Cart State ====
function saveCartState() {
  const data = {
    cameraCount,
    memoryCount,
    cartColor: document
      .querySelector('#colorOptions .option-btn.selected')
      .dataset.color === 'black'
        ? 'Чёрный'
        : 'Белый'
  };
  localStorage.setItem('cartData', JSON.stringify(data));
}

// ==== Update Badge & Price ====
function updateCartBadge() {
  const badge = cartBadge();
  if (badge) badge.textContent = cameraCount + memoryCount;
}
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

// ==== Add to Cart Handler ====
function addToCart() {
  if (cameraCount === 0) cameraCount = 1;
  if (wantMemory && memoryCount === 0) memoryCount = 1;

  updateCartBadge();
  updatePriceDisplay();
  saveCartState();

  const pb = purchaseButtons();
  if (pb) {
    pb.innerHTML = '';
    const goBtn = document.createElement('button');
    goBtn.id = 'goToCartBtn';
    goBtn.textContent = 'В корзину';
    goBtn.style.display = 'block';
    goBtn.style.margin = '0 auto';
    goBtn.onclick = () => window.location.href = '../cart/cart.html';
    pb.append(goBtn);
  }

  // Flying animation
  const img = document.querySelector('.slider-img.active');
  if (!img) return;
  const fly = document.createElement('img');
  fly.src = img.src;
  fly.style.position = 'fixed';
  fly.style.width    = '100px';
  fly.style.zIndex   = '10000';
  const rect = img.getBoundingClientRect();
  const startX = rect.left + rect.width / 2 - 50;
  const startY = rect.top  + rect.height/ 2 - 50;
  fly.style.left = `${startX}px`;
  fly.style.top  = `${startY}px`;
  document.body.append(fly);
  const ci = document.querySelector('.cart-icon').getBoundingClientRect();
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
}

// ==== Cookie Banner Logic ====
// Показываем баннер при скролле до .purchase-section
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

  updateCartBadge();
  updatePriceDisplay();

  // Цвет камеры
  document.querySelectorAll('#colorOptions .option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#colorOptions .option-btn')
        .forEach(x => x.classList.remove('selected'));
      btn.classList.add('selected');
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
  if (addBtn) addBtn.addEventListener('click', addToCart);

  // Инициализация баннера cookies
  initCookieBanner();

  // Слайдер старт
  showSlide(0);

  // Шапка при скролле
  initHeaderScroll();
});