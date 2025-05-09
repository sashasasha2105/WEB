// main page/js/script.js

// ==== Reveal on scroll ====
document.addEventListener('DOMContentLoaded', () => {
  const elems = document.querySelectorAll('.fade-in-on-scroll');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  elems.forEach(el => io.observe(el));

  updateCartBadge();
  updatePriceDisplay();

  document.querySelectorAll('#colorOptions .option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#colorOptions .option-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  document.querySelectorAll('#memoryOptions .memory-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wantMemory = btn.dataset.memory === '8gb';
      document.querySelectorAll('#memoryOptions .memory-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updatePriceDisplay();
    });
  });

  document.getElementById('addToCartBtn').addEventListener('click', addToCart);

  showSlide(0);
});

// ==== State & Prices ====
let cameraCount = 0;
let memoryCount = 0;
let wantMemory = false;
const basePrice = 8900;
const memoryPrice = 500;

// ==== UI Helpers ====
const cartBadge       = () => document.querySelector('.cart-count');
const priceDisplay    = () => document.getElementById('priceDisplay');
const purchaseButtons = () => document.querySelector('.purchase-buttons');

// ==== Persist to localStorage ====
function saveCartState() {
  const data = {
    cameraCount,
    memoryCount,
    cartColor: document.querySelector('#colorOptions .option-btn.selected').dataset.color === 'black'
      ? 'Чёрный'
      : 'Белый'
  };
  localStorage.setItem('cartData', JSON.stringify(data));
}

// ==== Update Main UI ====
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

  const img = document.querySelector('.slider-img.active');
  if (!img) return;
  const fly = document.createElement('img');
  fly.src = img.src;
  fly.style.position = 'fixed';
  fly.style.width = '100px';
  fly.style.zIndex = '10000';
  const rect = img.getBoundingClientRect();
  const startX = rect.left + rect.width/2 - 50;
  const startY = rect.top + rect.height/2 - 50;
  fly.style.left = `${startX}px`;
  fly.style.top = `${startY}px`;
  document.body.append(fly);
  const cartIcon = document.querySelector('.cart-icon');
  const cr = cartIcon.getBoundingClientRect();
  const targetX = cr.left + cr.width/2 - 50;
  const targetY = cr.top + cr.height/2 - 50;
  fly.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${targetX - startX}px,${targetY - startY}px) scale(0) rotate(720deg)`, opacity: 0 }
  ], {
    duration: 1000,
    easing: 'ease-in-out',
    fill: 'forwards'
  }).onfinish = () => fly.remove();
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
window.addEventListener('scroll', () => {
  const hdr = document.querySelector('header');
  const heroH = document.querySelector('.hero-gif')?.offsetHeight || 0;
  if (hdr) hdr.classList.toggle('scrolled', window.scrollY > heroH);
});

// ==== Tabs ====
const tabIds = ['charTableContainer','faqContainer','shippingContainer'];
function toggleTab(id) {
  tabIds.forEach(other => {
    const cnt = document.getElementById(other);
    const hdr = cnt?.closest('.tab-item')?.querySelector('.tab-header');
    if (!cnt || !hdr) return;
    if (other === id) {
      const open = !cnt.classList.contains('open');
      cnt.classList.toggle('open', open);
      hdr.classList.toggle('opened', open);
    } else {
      cnt.classList.remove('open');
      hdr.classList.remove('opened');
    }
  });
}
function toggleCharacteristics() { toggleTab('charTableContainer'); }
function toggleFAQ()            { toggleTab('faqContainer'); }
function toggleShipping()       { toggleTab('shippingContainer'); }