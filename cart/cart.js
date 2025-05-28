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

// === Yandex map & CDEK variables ===
let mapInstance = null;
let currentCity = '';
let cityCode = null;
let pvzPlacemarks = [];

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  const script = document.createElement('script');
  script.src = '/config.js';
  script.onload = initAll;
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
    currentCity = '';
    cityCode = null;
    clearPvzPlacemarks();
    hideMap();
    deliverySection().style.display = 'none';
    citySug().innerHTML = '';
    if (q.length < 2) return;
    const resp = await fetch(`/api/yandex/suggest?text=${encodeURIComponent(q)}`);
    const json = await resp.json();
    renderSuggestions(json.results);
  }), 300);
}

function renderSuggestions(items) {
  const ul = citySug();
  ul.innerHTML = '';
  items.forEach(item => {
    const text = item.title.text + (item.subtitle ? ', ' + item.subtitle.text : '');
    const li = document.createElement('li');
    li.textContent = text;
    li.addEventListener('click', async () => {
      cityIn().value = text;
      currentCity = text;
      ul.innerHTML = '';
      await fetchCdekCityCode(text);
      deliverySection().style.display = 'block';
    });
    ul.append(li);
  });
}

// === Fetch CDEK city code ===
async function fetchCdekCityCode(cityName) {
  const resp = await fetch(`/api/cdek/cities?search=${encodeURIComponent(cityName)}`);
  const json = await resp.json();
  const first = Array.isArray(json) ? json[0] : (json.results && json.results[0]);
  cityCode = first ? (first.code || first.cityCode || first.id) : null;
}

// === Init delivery method toggling ===
function initDeliveryToggle() {
  document.getElementById('deliveryPvz').addEventListener('change', () => {
    if (document.getElementById('deliveryPvz').checked) {
      showMap(currentCity, fetchAndPlotPvz);
    }
  });
  document.getElementById('deliveryCourier').addEventListener('change', () => {
    if (document.getElementById('deliveryCourier').checked) {
      hideMap();
      clearPvzPlacemarks();
    }
  });
}

// === Fetch PVZ points and plot on map ===
async function fetchAndPlotPvz() {
  if (!cityCode || !mapInstance) return;
  const url = `/api/cdek/pvz?cityId=${encodeURIComponent(cityCode)}`;
  const resp = await fetch(url);
  const items = await resp.json();
  items.forEach(point => {
    const loc = point.location || {};
    const coords = loc.latitude && loc.longitude
        ? [loc.latitude, loc.longitude]
        : null;
    if (coords) {
      const placemark = new ymaps.Placemark(
          coords,
          { balloonContent: point.address_full || point.name },
          { preset: 'islands#violetDotIcon' }
      );
      mapInstance.geoObjects.add(placemark);
      pvzPlacemarks.push(placemark);
    }
  });
  if (pvzPlacemarks.length) {
    const bounds = mapInstance.geoObjects.getBounds();
    mapInstance.setBounds(bounds, { checkZoomRange: true });
  }
}

// === Clear existing PVZ markers ===
function clearPvzPlacemarks() {
  pvzPlacemarks.forEach(pm => mapInstance && mapInstance.geoObjects.remove(pm));
  pvzPlacemarks = [];
}

// === Show Yandex map centered on city ===
function showMap(city, callback) {
  const mapContainer = document.getElementById('map');
  mapContainer.style.display = 'block';
  if (!city) {
    if (callback) callback();
    return;
  }
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
      if (callback) callback();
    });
  });
}

// === Hide map ===
function hideMap() {
  const mapContainer = document.getElementById('map');
  mapContainer.style.display = 'none';
}

// === Debounce helper ===
function debounce(fn, ms = 300) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}