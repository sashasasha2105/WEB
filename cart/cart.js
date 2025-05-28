// File: cart/cart.js

// === Prices & state ===
const prices = { camera: 8900, memory: 500 };
let counts = { camera: 0, memory: 0 }, discount = 0, shipping = 0;

// === DOM shortcuts ===
const badgeEl = () => document.querySelector('.cart-count');
const totalEl = () => document.getElementById('cartTotalValue');
const shipEl  = () => document.getElementById('shippingCostValue');
const cityIn  = () => document.getElementById('addressInput');
const citySug = () => document.getElementById('citySuggestions');
const deliverySection = () => document.getElementById('deliveryMethodSection');

// === Yandex map variables ===
let mapInstance = null;
let currentCity = '';

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  // Загружаем ключи из config.js
  const script = document.createElement('script');
  script.src = '/config.js';
  script.onload = () => {
    initAll();
  };
  document.head.appendChild(script);
});

function initAll() {
  loadCart();
  updateUI();
  initCartControls();
  initCitySuggest();
  initDeliveryToggle();
}

// === Load/save cart ===
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

// === Update UI ===
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

// === Cart controls ===
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
    document.getElementById('removePromoBtn').style.display = 'inline-block';
    updateUI();
  });
  document.getElementById('removePromoBtn').addEventListener('click', () => {
    discount = 0;
    document.getElementById('removePromoBtn').style.display = 'none';
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
    currentCity = '';              // сброс перед новым вводом
    hideMap();                     // скрыть карту
    deliverySection().style.display = 'none';
    citySug().innerHTML = '';
    if (q.length < 2) return;
    try {
      // Автоподбор через прокси на сервере
      const resp = await fetch(`/api/yandex/suggest?text=${encodeURIComponent(q)}`);
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      const json = await resp.json();
      renderSuggestions(json.results);
    } catch (err) {
      console.error('[Suggest] Error:', err);
    }
  }), 300);
}

// === Render suggestions ===
function renderSuggestions(items) {
  const ul = citySug();
  ul.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    const text = item.title.text + (item.subtitle ? ', ' + item.subtitle.text : '');
    li.textContent = text;
    li.addEventListener('click', () => {
      cityIn().value = text;
      currentCity = text;           // сохраняем выбранный город
      ul.innerHTML = '';
      deliverySection().style.display = 'block';
    });
    ul.append(li);
  });
}

// === Init delivery method toggling ===
function initDeliveryToggle() {
  document.getElementById('deliveryPvz').addEventListener('change', () => {
    if (document.getElementById('deliveryPvz').checked) {
      showMap(currentCity);
    }
  });
  document.getElementById('deliveryCourier').addEventListener('change', () => {
    if (document.getElementById('deliveryCourier').checked) {
      hideMap();
    }
  });
}

// === Show Yandex map centered on city ===
function showMap(city) {
  const mapContainer = document.getElementById('map');
  mapContainer.style.display = 'block';
  if (!city) return;
  ymaps.ready(() => {
    ymaps.geocode(city).then(res => {
      const coords = res.geoObjects.get(0).geometry.getCoordinates();
      if (mapInstance) {
        mapInstance.setCenter(coords);
      } else {
        mapInstance = new ymaps.Map('map', {
          center: coords,
          zoom: 10,
          controls: ['zoomControl']
        });
      }
    });
  });
}

// === Hide map ===
function hideMap() {
  const mapContainer = document.getElementById('map');
  mapContainer.style.display = 'none';
}

// === Debounce helper ===
function debounce(fn, ms=300) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}