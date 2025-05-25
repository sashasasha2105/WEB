// === File: cart/cart.js ===

// ==== Prices ====
const prices = {
  camera: 8900,
  memory: 500
};

// ==== State ====
let counts = {
  camera: 0,
  memory: 0
};
let discountPercent = 0;

// ==== Selectors ====
const badgeEl = () => document.querySelector('.cart-count');
const totalEl = () => document.getElementById('cartTotalValue');
const colorEl = () => document.getElementById('cameraColor');
const memoryImgEl = () => document.querySelector('.cart-item[data-id="memory"] img');

// ==== Load from localStorage ====
function loadCart() {
  const raw = localStorage.getItem('cartData');
  if (!raw) return;
  const data = JSON.parse(raw);
  counts.camera = data.cameraCount || 0;
  counts.memory = data.memoryCount || 0;
  if (colorEl()) colorEl().textContent = data.cartColor || '—';

  // Ensure memory image is set
  if (memoryImgEl()) {
    memoryImgEl().src = 'CardPhoto.png';
    memoryImgEl().alt = 'Карта памяти 8 ГБ';
  }
}

// ==== Save to localStorage ====
function saveCart() {
  const data = {
    cameraCount: counts.camera,
    memoryCount: counts.memory,
    cartColor: colorEl() ? colorEl().textContent : ''
  };
  localStorage.setItem('cartData', JSON.stringify(data));
}

// ==== Update Cart UI ====
function updateUI() {
  const badge = badgeEl();
  if (badge) badge.textContent = counts.camera + counts.memory;

  const total = totalEl();
  if (total) {
    let sum = counts.camera * prices.camera + counts.memory * prices.memory;
    sum -= Math.round(sum * discountPercent / 100);
    total.textContent = sum.toLocaleString('ru-RU');
  }

  ['camera','memory'].forEach(id => {
    const block = document.querySelector(`.cart-item[data-id="${id}"]`);
    const qty   = document.querySelector(`.quantity-value[data-id="${id}"]`);
    if (!block || !qty) return;
    qty.textContent = counts[id];
    block.style.display = counts[id] > 0 ? 'flex' : 'none';
  });
}

// ==== Change Quantity ====
function changeCount(id, delta) {
  counts[id] = Math.max(0, counts[id] + delta);
  saveCart();
  updateUI();
}

// ==== Remove Item ====
function removeItem(id) {
  counts[id] = 0;
  saveCart();
  updateUI();
}

// ==== Init Cart Page ====
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  updateUI();

  document.querySelectorAll('.plus-btn').forEach(btn =>
    btn.addEventListener('click', () => changeCount(btn.dataset.id, +1))
  );
  document.querySelectorAll('.minus-btn').forEach(btn =>
    btn.addEventListener('click', () => changeCount(btn.dataset.id, -1))
  );
  document.querySelectorAll('.remove-item-btn').forEach(btn =>
    btn.addEventListener('click', () => removeItem(btn.dataset.id))
  );

  // Promo code logic (unchanged)
  const promoInput     = document.getElementById('promoInput');
  const applyPromoBtn  = document.getElementById('applyPromoBtn');
  const removePromoBtn = document.getElementById('removePromoBtn');

  if (applyPromoBtn && removePromoBtn && promoInput) {
    applyPromoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toLowerCase();
      if (code === 'clipgo25')       discountPercent = 7;
      else if (code === 'clipgo222') discountPercent = 20;
      else return alert('Неверный промокод!');
      applyPromoBtn.disabled = true;
      removePromoBtn.style.display = 'inline-block';
      updateUI();
    });
    removePromoBtn.addEventListener('click', () => {
      discountPercent = 0;
      promoInput.value = '';
      applyPromoBtn.disabled = false;
      removePromoBtn.style.display = 'none';
      updateUI();
    });
  }
});