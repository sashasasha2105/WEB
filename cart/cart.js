// File: cart/cart.js

// === Prices & state ===
const prices = { camera: 8900, memory: 500 };
let counts = { camera: 0, memory: 0 }, discount = 0, shipping = 0;

// === DOM shortcuts ===
const badgeEl          = () => document.querySelector('.cart-count');
const totalEl          = () => document.getElementById('cartTotalValue');
const shipEl           = () => document.getElementById('shippingCostValue');
const cityIn           = () => document.getElementById('addressInput');
const citySug          = () => document.getElementById('citySuggestions');
const streetWrapper    = () => document.getElementById('streetWrapper');
const streetIn         = () => document.getElementById('streetInput');
const deliverySection  = () => document.getElementById('deliveryMethodSection');
const mapContainer     = () => document.getElementById('map');
const loadingIndicator = () => document.getElementById('pvz-loading');
const infoPanel        = () => document.getElementById('pvz-info-panel');
const mapWrapper       = () => document.querySelector('.map-wrapper');

// === Yandex map & CDEK variables ===
let mapInstance, cityClusterer, postamatClusterer, streetMarker;
let currentCity = '', cityCode = null;

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  // Loader element
  const loader = document.createElement('div');
  loader.id = 'pvz-loading';
  loader.style.cssText = `
    display:none;
    position:absolute; top:50%; left:50%;
    transform:translate(-50%,-50%);
    padding:10px 20px; background:rgba(255,255,255,0.9);
    border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.2);
    z-index:2000;
  `;
  loader.textContent = 'Загружаем карту…';
  document.body.appendChild(loader);

  // Ensure map wrapper is relative
  mapWrapper().style.position = 'relative';

  // Info panel already in HTML
  // Load config.js then initialize all
  const s = document.createElement('script');
  s.src = '/config.js';
  s.onload = initAll;
  document.head.appendChild(s);
});

function initAll() {
  loadCart();
  updateUI();
  initCartControls();
  initCitySuggest();
  initDeliveryToggle();
  initStreetInput();
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
  if (badgeEl()) badgeEl().textContent = counts.camera + counts.memory;
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
        counts[btn.dataset.id]++; saveCart(); updateUI();
      })
  );
  document.querySelectorAll('.minus-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        counts[btn.dataset.id] = Math.max(0, counts[btn.dataset.id] - 1);
        saveCart(); updateUI();
      })
  );
  document.querySelectorAll('.remove-item-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        counts[btn.dataset.id] = 0; saveCart(); updateUI();
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

// === City suggest ===
function initCitySuggest() {
  cityIn().addEventListener('input', debounce(async e => {
    const q = e.target.value.trim();
    currentCity = ''; cityCode = null;
    clearClusters(); hideMap();
    deliverySection().style.display = 'none';
    streetWrapper().style.display = 'none';
    citySug().innerHTML = '';
    if (q.length < 2) return;
    const resp = await fetch(`/api/yandex/suggest?text=${encodeURIComponent(q)}`);
    const json = await resp.json();
    renderSuggestions(json.results);
  }), 300);
}

function renderSuggestions(items) {
  const ul = citySug(); ul.innerHTML = '';
  items.forEach(item => {
    const text = item.title.text + (item.subtitle ? ', ' + item.subtitle.text : '');
    const li = document.createElement('li');
    li.textContent = text;
    li.addEventListener('click', async () => {
      cityIn().value = text; currentCity = text; ul.innerHTML = '';
      await fetchCdekCityCode(text);
      deliverySection().style.display = 'block';
    });
    ul.append(li);
  });
}

async function fetchCdekCityCode(cityName) {
  try {
    const resp = await fetch(`/api/cdek/cities?search=${encodeURIComponent(cityName)}`);
    const json = await resp.json();
    const first = Array.isArray(json) ? json[0] : (json.results && json.results[0]);
    cityCode = first ? (first.code || first.cityCode || first.id) : null;
  } catch (err) {
    console.error('CDEK Cities error', err);
  }
}

// === Street input & geocode ===
function initStreetInput() {
  streetIn().addEventListener('change', async () => {
    const addr = streetIn().value.trim();
    if (!addr || !mapInstance) return;
    const full = `${currentCity}, ${addr}`;
    try {
      const res = await ymaps.geocode(full);
      const coords = res.geoObjects.get(0).geometry.getCoordinates();
      mapInstance.setCenter(coords, 14, { duration: 500 });
      if (streetMarker) mapInstance.geoObjects.remove(streetMarker);
      streetMarker = new ymaps.Placemark(coords, {}, {
        preset: 'islands#circleIcon',
        iconColor: '#FF5733'
      });
      mapInstance.geoObjects.add(streetMarker);
    } catch (e) {
      console.error('Geocode street error', e);
    }
  });
}

// === Delivery toggle ===
function initDeliveryToggle() {
  document.getElementById('deliveryPvz').addEventListener('change', () => {
    if (!cityCode) return;
    loadingIndicator().style.display = 'block';
    showMap(currentCity, async () => {
      await fetchAndPlotPvz();
      streetWrapper().style.display = 'block';
      loadingIndicator().style.display = 'none';
    });
  });
  document.getElementById('deliveryCourier').addEventListener('change', () => {
    hideMap(); clearClusters();
    streetWrapper().style.display = 'none';
    mapWrapper().classList.remove('with-panel');
  });
}

// === Fetch & plot PVZ/POSTAMAT ===
async function fetchAndPlotPvz() {
  if (!cityCode || !mapInstance) return;

  if (!cityClusterer) {
    cityClusterer = new ymaps.Clusterer({
      preset: 'islands#invertedDarkBlueClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      clusterOpenBalloonOnClick: true
    });
    postamatClusterer = new ymaps.Clusterer({
      preset: 'islands#invertedLightBlueClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      clusterOpenBalloonOnClick: true
    });
  }
  clearClusters();

  let page = 0, totalPages = 1, allItems = [];
  while (page < totalPages) {
    const url = `/api/cdek/pvz?cityId=${encodeURIComponent(cityCode)}&type=ALL&size=1000&page=${page}`;
    const resp = await fetch(url);
    const items = await resp.json();
    allItems.push(...items);
    totalPages = parseInt(resp.headers.get('x-total-pages') || '1', 10);
    page++;
  }

  allItems.forEach(pt => {
    const loc = pt.location || {};
    if (!loc.latitude || !loc.longitude) return;
    const coords = [loc.latitude, loc.longitude];
    const type = (pt.type || '').toUpperCase();
    const iconHref = type === 'PVZ'
        ? '/assets/icons/pvz.png'
        : '/assets/icons/postamat.png';

    const pm = new ymaps.Placemark(coords, {}, {
      iconLayout: 'default#image',
      iconImageHref: iconHref,
      iconImageSize: [32, 32],
      iconImageOffset: [-16, -32]
    });

    pm.events.add('click', () => {
      mapInstance.panTo(coords, { duration: 500 });
      // populate and show info panel
      let html = '';
      const imgs = (pt.office_image_list || []).slice(0,3);
      if (imgs.length) {
        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
        imgs.forEach(i => {
          html += `<img src="${i.url}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;">`;
        });
        html += '</div>';
      }
      html += `<h3 style="margin:4px 0;">${type==='PVZ'?'Пункт выдачи':'Постамат'}</h3>`;
      html += `<p><strong>Адрес:</strong> ${loc.address_full||'—'}</p>`;
      html += `<p><strong>Время:</strong> ${pt.work_time||'—'}</p>`;
      html += `<p><strong>Тел:</strong> ${(pt.phones||[]).map(p=>p.number).join(', ')||'—'}</p>`;
      html += `<p><strong>Оплата:</strong> наличные ${pt.have_cash?'есть':'нет'}, безнал ${pt.have_cashless?'есть':'нет'}</p>`;

      infoPanel().innerHTML = html;
      mapWrapper().classList.add('with-panel');
    });

    if (type === 'PVZ') cityClusterer.add(pm);
    else postamatClusterer.add(pm);
  });

  mapInstance.geoObjects
      .add(cityClusterer)
      .add(postamatClusterer);

  const allGeo = cityClusterer.getGeoObjects().concat(postamatClusterer.getGeoObjects());
  if (allGeo.length) {
    const bounds = ymaps.geoQuery(allGeo).getBounds();
    mapInstance.setBounds(bounds, { checkZoomRange: true });
  }
}

// === Helpers ===
function clearClusters() {
  if (cityClusterer) cityClusterer.removeAll();
  if (postamatClusterer) postamatClusterer.removeAll();
}
function showMap(city, cb) {
  mapContainer().style.display = 'block';
  ymaps.ready(() => {
    ymaps.geocode(city).then(r => {
      const c = r.geoObjects.get(0).geometry.getCoordinates();
      if (!mapInstance) {
        mapInstance = new ymaps.Map('map', {
          center: c,
          zoom: 10,
          controls: ['zoomControl']
        });
      } else {
        mapInstance.setCenter(c);
      }
      cb && cb();
    });
  });
}
function hideMap() {
  mapContainer().style.display = 'none';
}
function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}