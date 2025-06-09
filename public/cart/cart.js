// File: public/cart/cart.js

/* === Цены и параметры === */
const prices = { camera: 8900, memory: 500 };
const CAMERA_WEIGHT_KG   = 0.327;
const MEMORY_WEIGHT_KG   = 0.008;
const CAMERA_DIMENSIONS  = { length: 20, width: 12, height: 6 };
const MEMORY_DIMENSIONS  = { length: 13, width: 8, height: 1 };
const FROM_LOCATION      = 44;  // код склада СДЕК

/* === Состояние === */
let counts = { camera: 0, memory: 0 };
let discount = 0;
let shipping = 0;

let cityCode = null;
let currentCity = '';
let cachedPreviews = {};
let selectedTariff = null;  // { code, type, pvzCode, address }
let justSelectedCity = false;

/* === DOM-шорткаты === */
const badgeEl         = () => document.querySelector('.cart-count');
const totalEl         = () => document.getElementById('cartTotalValue');
const shipEl          = () => document.getElementById('shippingCostValue');
const deliveryInfoEl  = () => document.getElementById('deliveryInfo');
const cityIn          = () => document.getElementById('addressInput');
const citySug         = () => document.getElementById('citySuggestions');
const deliverySection = () => document.getElementById('deliveryMethodSection');
const streetWrapper   = () => document.getElementById('streetWrapper');
const streetIn        = () => document.getElementById('streetInput');
const mapContainer    = () => document.getElementById('map');
const infoPanel       = () => document.getElementById('pvz-info-panel');
const mapWrapper      = () => document.querySelector('.map-wrapper');
const tariffContainer = document.getElementById('tariffOptions');
const recNameIn       = () => document.getElementById('recipientName');
const recPhoneIn      = () => document.getElementById('recipientPhone');
const recEmailIn      = () => document.getElementById('recipientEmail');

/* === Переменные карты === */
let mapInstance = null, cityClusterer = null, postamatClusterer = null, streetMarker = null;

/* === Инициализация === */
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  updateUI();
  initCartControls();
  initCitySuggest();
  initDeliveryToggle();
  initStreetInput();
  hideTariffs();
  cachedPreviews = {};
});

/* === localStorage === */
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

/* === Обновление UI === */
function updateUI() {
  if (badgeEl()) badgeEl().textContent = counts.camera + counts.memory;
  shipEl().textContent = shipping.toLocaleString('ru-RU');

  let sum = counts.camera * prices.camera + counts.memory * prices.memory;
  sum -= Math.round(sum * discount / 100);
  sum += shipping;
  totalEl().textContent = sum.toLocaleString('ru-RU');
}

/* === Контролы корзины + оплата === */
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

  document.getElementById('checkoutBtn').addEventListener('click', async () => {
    const itemsSum = counts.camera * prices.camera + counts.memory * prices.memory;
    const discounted = itemsSum - Math.round(itemsSum * discount / 100);
    const amount = discounted + shipping;
    if (amount <= 0) return alert('Корзина пуста или сумма должна быть больше нуля');
    if (!selectedTariff) return alert('Выберите тариф доставки');
    if (!recNameIn().value.trim() || !recPhoneIn().value.trim()) return alert('Заполните ФИО и телефон получателя');

    // 1. Создание платежа
    let payment;
    try {
      const resp = await fetch('/api/yookassa/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'RUB', description: `clip & go ${amount} ₽` })
      });
      payment = await resp.json();
      if (!resp.ok) throw 0;
    } catch {
      return alert('Ошибка при создании платежа');
    }

    // 2. Регистрация заказа в СДЕК
    try {
      const resp = await fetch('/api/cdek/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCdekOrderRequest(amount))
      });
      const text = await resp.text();
      let json;
      try { json = JSON.parse(text); }
      catch { json = null; }
      console.log('[CDEK order response]:', json || text);

      if (json && json.requests && json.requests[0].errors?.length) {
        const errs = json.requests[0].errors
            .map(e => `${e.code}: ${e.message}`)
            .join('\n');
        alert(`Ошибка при регистрации заказа СДЕК:\n${errs}`);
      }
    } catch (e) {
      console.error('[CDEK order error]', e);
      alert('Произошла ошибка при отправке заказа в СДЕК');
    }

    // 3. Редирект на оплату
    window.location.href = payment.confirmation_url;
  });
}

/* === Сбор тела запроса для CDEК === */
function buildCdekOrderRequest(amount) {
  const totalWeight = counts.camera * CAMERA_WEIGHT_KG + counts.memory * MEMORY_WEIGHT_KG;
  const dims = counts.camera > 0
      ? CAMERA_DIMENSIONS
      : MEMORY_DIMENSIONS;

  const packages = [{
    number: '1',
    weight: Number(totalWeight.toFixed(3)),
    ...dims,
    comment: 'Заказ clip & go',
    items: [{ name: 'clip & go order', ware_key: 'cg1', cost: amount }]
  }];

  const sender = {
    company: 'clip & go',    // добавлено для CDEK
    name: 'clip & go',
    phones: [{ number: '+70000000000' }],
    email: 'support@clipandgo.ru'
  };

  const recipient = {
    name: recNameIn().value.trim(),
    phones: [{ number: recPhoneIn().value.trim() }],
    email: recEmailIn().value.trim() || undefined
  };

  const request = {
    type: 2,
    tariff_code: selectedTariff.code,
    sender,
    recipient,
    packages,
    from_location: { code: FROM_LOCATION }
  };

  if (selectedTariff.type === 'PVZ' || selectedTariff.type === 'POSTAMAT') {
    request.delivery_point = selectedTariff.pvzCode;
  } else {
    request.to_location = {
      code: cityCode,
      address: streetIn().value.trim(),
      city: currentCity
    };
  }

  return request;
}

/* === Яндекс-подсказки городов === */
function initCitySuggest() {
  cityIn().addEventListener('input', debounce(async e => {
    if (justSelectedCity) { justSelectedCity = false; return; }
    const q = e.target.value.trim();
    currentCity = '';
    cityCode = null;
    resetDeliveryFlow();

    const ul = citySug();
    ul.innerHTML = '';
    ul.classList.remove('visible');
    if (q.length < 2) return;

    try {
      const resp = await fetch(`/api/yandex/suggest?text=${encodeURIComponent(q)}`);
      const j = await resp.json();
      renderCitySuggestions(j.results || []);
    } catch (e) { console.error(e); }
  }, 300));
}

function renderCitySuggestions(items) {
  const ul = citySug();
  ul.innerHTML = '';
  if (!items.length) { ul.classList.remove('visible'); return; }
  items.forEach(it => {
    const txt = it.title.text + (it.subtitle ? ', ' + it.subtitle.text : '');
    const li = document.createElement('li');
    li.textContent = txt;
    li.addEventListener('click', async () => {
      justSelectedCity = true;
      cityIn().value = txt;
      currentCity = txt;
      ul.innerHTML = '';
      ul.classList.remove('visible');
      await fetchCdekCityCode(txt);
      showElement(deliverySection());
    });
    ul.append(li);
  });
  ul.classList.add('visible');
}

async function fetchCdekCityCode(cityName) {
  try {
    const q = cityName.split(',')[0].trim();
    const resp = await fetch(`/api/cdek/cities?search=${encodeURIComponent(q)}`);
    const j = await resp.json();
    const f = Array.isArray(j) ? j[0] : (j.results ? j.results[0] : null);
    cityCode = f ? f.code : null;
  } catch (e) { console.error(e); }
}

/* === Работа с картой и ПВЗ === */
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
        preset: 'islands#circleIcon', iconColor: '#FF5733'
      });
      mapInstance.geoObjects.add(streetMarker);
    } catch (e) { console.error(e); }
  });
}

function initDeliveryToggle() {
  document.getElementById('deliveryCourier').addEventListener('change', () => {
    if (!cityCode) return;
    hideElement(streetWrapper());
    hideMapWrapper();
    hideTariffs();
    selectedTariff = null;
    shipping = 0;
    deliveryInfoEl().textContent = '';
    updateUI();
  });
  document.getElementById('deliveryPvz').addEventListener('change', () => {
    if (!cityCode) return;
    showElement(streetWrapper());
    hideTariffs();
    selectedTariff = null;
    shipping = 0;
    deliveryInfoEl().textContent = '';
    updateUI();
    showMapWrapper(currentCity, fetchAndPlotPvz);
  });
}

function showMapWrapper(city, cb) {
  mapWrapper().style.display = 'flex';
  mapContainer().style.display = 'block';
  if (mapInstance) {
    ymaps.ready(() => {
      ymaps.geocode(city).then(r => {
        const c = r.geoObjects.get(0).geometry.getCoordinates();
        mapInstance.setCenter(c, 10, { duration: 500 });
        cb && cb();
      });
    });
    return;
  }
  ymaps.ready(() => {
    ymaps.geocode(city).then(r => {
      const c = r.geoObjects.get(0).geometry.getCoordinates();
      mapInstance = new ymaps.Map('map', { center: c, zoom: 10, controls: ['zoomControl'] });
      cb && cb();
    });
  });
}

function hideMapWrapper() {
  mapWrapper().style.display = 'none';
  mapContainer().style.display = 'none';
}

async function fetchAndPlotPvz() {
  if (!cityCode || !mapInstance) return;
  if (!cityClusterer) {
    cityClusterer = new ymaps.Clusterer({
      preset: 'islands#invertedDarkBlueClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      clusterOpenBalloonOnClick: false
    });
    postamatClusterer = new ymaps.Clusterer({
      preset: 'islands#invertedLightBlueClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      clusterOpenBalloonOnClick: false
    });
  }
  cityClusterer.removeAll();
  postamatClusterer.removeAll();

  let page = 0, totalPages = 1, all = [];
  while (page < totalPages) {
    const url = `/api/cdek/pvz?cityId=${encodeURIComponent(cityCode)}&type=ALL&size=1000&page=${page}`;
    const resp = await fetch(url);
    const arr = await resp.json();
    all.push(...arr);
    totalPages = parseInt(resp.headers.get('x-total-pages') || '1', 10);
    page++;
  }

  all.forEach(pt => {
    const loc = pt.location || {};
    if (!loc.latitude || !loc.longitude) return;
    const coords = [loc.latitude, loc.longitude];
    const type = (pt.type || '').toUpperCase();
    const icon = type === 'PVZ' ? '/assets/icons/pvz.png' : '/assets/icons/postamat.png';
    const pm = new ymaps.Placemark(coords, {}, {
      iconLayout: 'default#image',
      iconImageHref: icon,
      iconImageSize: [32, 32],
      iconImageOffset: [-16, -32]
    });
    pm.events.add('click', () => {
      mapInstance.setCenter(coords, 14, { duration: 500 });
      renderPvzInfoPanel(pt, type, loc);
    });
    (type === 'PVZ' ? cityClusterer : postamatClusterer).add(pm);
  });

  mapInstance.geoObjects.add(cityClusterer).add(postamatClusterer);
}

function renderPvzInfoPanel(pt, type, loc) {
  let html = '';
  const imgs = (pt.office_image_list || []).slice(0, 3);
  if (imgs.length) {
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
    imgs.forEach(i => html += `<img src="${i.url}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;">`);
    html += '</div>';
  }
  html += `<h3 style="margin-bottom:8px;color:#007BFF;">${type==='PVZ'?'Пункт выдачи':'Постамат'}</h3>`;
  html += `<p><strong>Адрес:</strong> ${loc.address_full||'—'}</p>`;
  html += `<p><strong>Время работы:</strong> ${pt.work_time||'—'}</p>`;
  html += `<button id="selectPvzBtn" style="width:100%;margin-top:12px;padding:12px 0;background:#28a745;color:#fff;border:none;border-radius:6px;cursor:pointer;">Выбрать пункт</button>`;
  infoPanel().innerHTML = html;
  mapWrapper().classList.add('with-panel');
  showElement(infoPanel());

  preloadTariffPreviews(type==='PVZ'?[136,483]:[368,486]);
  document.getElementById('selectPvzBtn').addEventListener('click', () => {
    renderTariffButtons(type, loc.address_full || '—', pt.code);
  });
}

async function preloadTariffPreviews(codes) {
  if (!cityCode) return;
  codes.forEach(async code => {
    if (cachedPreviews[code]) return;
    const totalWeight = counts.camera * CAMERA_WEIGHT_KG + counts.memory * MEMORY_WEIGHT_KG;
    const dims = counts.camera > 0 ? CAMERA_DIMENSIONS : MEMORY_DIMENSIONS;
    const body = {
      date: new Date().toISOString().replace(/\.\d{3}Z$/, '+0300'),
      type: 1,
      currency: 0,
      lang: 'rus',
      tariff_code: code,
      from_location: { code: FROM_LOCATION },
      to_location: { code: cityCode },
      packages: [{ weight: Number(totalWeight.toFixed(3)), ...dims }],
      additional_order_types: []
    };
    try {
      const resp = await fetch('/api/cdek/calculator/tariff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const j = await resp.json();
      cachedPreviews[code] = j.errors
          ? { deliverySum: 0, periodMin: 0, periodMax: 0 }
          : { deliverySum: j.delivery_sum || j.total_sum || 0, periodMin: j.period_min || 0, periodMax: j.period_max || 0 };
    } catch {
      cachedPreviews[code] = { deliverySum: 0, periodMin: 0, periodMax: 0 };
    }
  });
}

function renderTariffButtons(markerType, address, pvzCode) {
  const arr = markerType==='PVZ'
      ? [{code:136,name:'Стандарт'},{code:483,name:'Экспресс'}]
      : [{code:368,name:'Стандарт'},{code:486,name:'Экспресс'}];
  let html = '<h3 style="margin-bottom:16px;font-size:1.3em;color:#007BFF;">Выберите тариф:</h3>';
  arr.forEach(t => {
    const p = cachedPreviews[t.code] || {deliverySum:0,periodMin:0,periodMax:0};
    const cost = Math.ceil((p.deliverySum||0)/10)*10;
    const costStr = cost.toLocaleString('ru-RU') + ' ₽';
    const period = p.periodMin===p.periodMax ? `${p.periodMin} дн.` : `${p.periodMin}–${p.periodMax} дн.`;
    html += `
      <button class="tariff-btn" data-code="${t.code}" data-sum="${cost}" data-pvz="${pvzCode||''}">
        <span>${t.name}</span>
        <span class="tariff-details"><strong>${costStr}</strong><br><em>${period}</em></span>
      </button>
    `;
  });
  tariffContainer.innerHTML = html;
  showTariffs();

  document.querySelectorAll('.tariff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedTariff = {
        code: Number(btn.dataset.code),
        type: markerType,
        pvzCode: btn.dataset.pvz || null,
        address
      };
      shipping = Number(btn.dataset.sum);
      updateUI();
      deliveryInfoEl().textContent =
          `Выбран ${markerType==='PVZ'?'ПВЗ':'Постамат'}: ${address}. Тариф ${selectedTariff.code}, стоимость ${shipping.toLocaleString('ru-RU')} ₽`;
    });
  });
}

function showElement(el)    { if (el) el.classList.add('visible'); }
function hideElement(el)    { if (el) el.classList.remove('visible'); }
function showTariffs()      { tariffContainer.classList.add('visible'); }
function hideTariffs()      { tariffContainer.classList.remove('visible'); tariffContainer.innerHTML = ''; }
function resetDeliveryFlow(){ hideElement(deliverySection()); hideElement(streetWrapper()); hideElement(infoPanel()); hideMapWrapper(); hideTariffs(); selectedTariff = null; shipping = 0; updateUI(); }
function debounce(fn, ms=300){ let t; return (...args)=>(clearTimeout(t), t=setTimeout(()=>fn(...args), ms)); }