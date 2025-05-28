// === Prices & state ===
const prices = { camera: 8900, memory: 500 };
let counts = { camera: 0, memory: 0 }, discount = 0, shipping = 0;

// === DOM shortcuts ===
const badgeEl = () => document.querySelector('.cart-count');
const totalEl = () => document.getElementById('cartTotalValue');
const shipEl  = () => document.getElementById('shippingCostValue');
const cityIn  = () => document.getElementById('addressInput');
const citySug = () => document.getElementById('citySuggestions');

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  updateUI();
  initCartControls();
  initCitySuggest();
});

// Load/save cart
function loadCart() {
  const d = JSON.parse(localStorage.getItem('cartData') || '{}');
  counts.camera = d.cameraCount || 0;
  counts.memory = d.memoryCount || 0;
}
function saveCart() {
  localStorage.setItem('cartData', JSON.stringify({
    cameraCount: counts.camera,
    memoryCount: counts.memory
  }));
}

// Update UI
function updateUI() {
  if (badgeEl()) badgeEl().textContent = (counts.camera + counts.memory);
  shipEl().textContent = shipping.toLocaleString('ru-RU');
  let sum = counts.camera * prices.camera + counts.memory * prices.memory;
  sum -= Math.round(sum * discount / 100);
  sum += shipping;
  totalEl().textContent = sum.toLocaleString('ru-RU');

  ['camera','memory'].forEach(id => {
    const block = document.querySelector(`.cart-item[data-id="${id}"]`);
    const qty   = document.querySelector(`.quantity-value[data-id="${id}"]`);
    if (!block || !qty) return;
    block.style.display = counts[id] > 0 ? 'flex' : 'none';
    qty.textContent = counts[id];
  });
}

// Cart controls
function initCartControls() {
  document.querySelectorAll('.plus-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        counts[btn.dataset.id]++;
        saveCart();
        updateUI();
      })
  );
  document.querySelectorAll('.minus-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        counts[btn.dataset.id] = Math.max(0, counts[btn.dataset.id] - 1);
        saveCart();
        updateUI();
      })
  );
  document.querySelectorAll('.remove-item-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        counts[btn.dataset.id] = 0;
        saveCart();
        updateUI();
      })
  );
  document.getElementById('applyPromoBtn').addEventListener('click', () => {
    const code = document.getElementById('promoInput').value.trim().toLowerCase();
    if (code === 'clipgo25') discount = 7;
    else if (code === 'clipgo222') discount = 20;
    else return alert('Неверный промокод!');
    updateUI();
  });
  document.getElementById('checkoutBtn').addEventListener('click', () => {
    alert('Заказ успешно оформлен!');
  });
}

// === City Suggest via HTTP API ===
function initCitySuggest() {
  cityIn().addEventListener('input', debounce(async e => {
    const q = e.target.value.trim();
    citySug().innerHTML = '';
    if (q.length < 2) return;
    try {
      const url = new URL('https://suggest-maps.yandex.ru/v1/suggest');
      url.searchParams.set('apikey', 'b957c69b-a847-42b4-af58-58feaa2359f9');
      url.searchParams.set('text', q);
      url.searchParams.set('sessiontoken', '123e4567-e89b-12d3-a456-426614174000');
      url.searchParams.set('lang', 'ru_RU');
      url.searchParams.set('results', '7');
      url.searchParams.set('types', 'locality');
      url.searchParams.set('print_address', '1');
      url.searchParams.set('strict_bounds', '0');

      console.log('[Suggest] URL:', url.toString());
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      const json = await resp.json();
      renderSuggestions(json.results);
    } catch (err) {
      console.error('[Suggest] Error:', err);
    }
  }), 300);
}

// Render list
function renderSuggestions(items) {
  const ul = citySug();
  ul.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.title.text + (item.subtitle ? ', ' + item.subtitle.text : '');
    li.addEventListener('click', () => {
      cityIn().value = li.textContent;
      ul.innerHTML = '';
    });
    ul.append(li);
  });
}

// Debounce helper
function debounce(fn, ms=300) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}