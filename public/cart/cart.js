/* File: public/cart/cart.js */

/* === Цены и параметры === */
const prices = { camera: 8900, memory: 500 };
const CAMERA_WEIGHT_KG   = 0.327;
const MEMORY_WEIGHT_KG   = 0.008;
const CAMERA_DIMENSIONS  = { length: 20, width: 12, height: 6 };
const MEMORY_DIMENSIONS  = { length: 13, width: 8, height: 1 };
const FROM_LOCATION      = 44;  // код Москвы в CDEK

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

  // Обновляем отображение цвета камеры
  const cameraColor = d.cartColor || 'Чёрный';
  const colorEl = document.getElementById('cameraColor');
  if (colorEl) colorEl.textContent = cameraColor;
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

  // Обновляем количество в UI
  document.querySelectorAll('.quantity-value').forEach(el => {
    const id = el.dataset.id;
    if (id && counts[id] !== undefined) {
      el.textContent = counts[id];
    }
  });

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
    if (!recNameIn().value.trim() || !recPhoneIn().value.trim()) {
      return alert('Заполните ФИО и телефон получателя');
    }

    // 1. Создание платежа
    let payment;
    try {
      const resp = await fetch('/api/yookassa/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'RUB',
          description: `Заказ clip & go на сумму ${amount} ₽`
        })
      });
      payment = await resp.json();
      if (!resp.ok) throw new Error(payment.error || 'Ошибка создания платежа');
    } catch(e) {
      console.error('Ошибка создания платежа:', e);
      return alert('Ошибка при создании платежа: ' + e.message);
    }

    // 2. Регистрация заказа в СДЕК
    try {
      const orderRequest = buildCdekOrderRequest(amount);
      console.log('Отправляем заказ в CDEK:', orderRequest);

      const resp = await fetch('/api/cdek/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderRequest)
      });

      const result = await resp.json();
      console.log('[CDEK order response]', result);

      if (!resp.ok || !result.success) {
        // Показываем пользователю детальную информацию об ошибке
        let errorMsg = 'Ошибка при создании заказа в CDEK:\n';
        if (result.details) {
          errorMsg += result.details;
        } else if (result.error) {
          errorMsg += result.error;
        }
        console.error('Ошибка CDEK:', result);
        alert(errorMsg);
        // Но всё равно переходим к оплате, т.к. платеж уже создан
      } else {
        console.log('Заказ успешно создан в CDEK! UUID:', result.order_uuid);
      }
    } catch (e) {
      console.error('[CDEK order error]', e);
      alert('Не удалось создать заказ в системе доставки, но вы можете продолжить оплату. Мы свяжемся с вами для уточнения деталей.');
    }

    // 3. Редирект на оплату
    window.location.href = payment.confirmation_url;
  });
}

/* === Сбор тела запроса для CDEK === */
function buildCdekOrderRequest(amount) {
  const totalWeight = counts.camera * CAMERA_WEIGHT_KG + counts.memory * MEMORY_WEIGHT_KG;

  // Определяем габариты посылки
  let packageDimensions;
  if (counts.camera > 0 && counts.memory > 0) {
    // Если есть и камера и карта памяти, берем большие габариты (камеры)
    packageDimensions = CAMERA_DIMENSIONS;
  } else if (counts.camera > 0) {
    packageDimensions = CAMERA_DIMENSIONS;
  } else if (counts.memory > 0) {
    packageDimensions = MEMORY_DIMENSIONS;
  } else {
    packageDimensions = { length: 10, width: 10, height: 10 };
  }

  // Формируем список товаров для посылки
  const items = [];
  if (counts.camera > 0) {
    items.push({
      name: `clip & go камера (${counts.camera} шт.)`,
      ware_key: 'CLIPGO-CAM',
      payment: {
        value: counts.camera * prices.camera
      },
      cost: counts.camera * prices.camera,
      weight: counts.camera * CAMERA_WEIGHT_KG * 1000, // в граммах
      amount: counts.camera
    });
  }
  if (counts.memory > 0) {
    items.push({
      name: `Карта памяти 8GB (${counts.memory} шт.)`,
      ware_key: 'CLIPGO-MEM8',
      payment: {
        value: counts.memory * prices.memory
      },
      cost: counts.memory * prices.memory,
      weight: counts.memory * MEMORY_WEIGHT_KG * 1000, // в граммах
      amount: counts.memory
    });
  }

  const packages = [{
    number: '1',
    weight: Math.ceil(totalWeight * 1000), // вес в граммах
    length: packageDimensions.length,
    width: packageDimensions.width,
    height: packageDimensions.height,
    comment: 'Хрупкое! Электроника!',
    items: items
  }];

  const recipient = {
    name: recNameIn().value.trim(),
    phones: [{ number: recPhoneIn().value.trim() }]
  };

  // Добавляем email если указан
  const email = recEmailIn().value.trim();
  if (email) {
    recipient.email = email;
  }

  // Базовая структура заказа
  const orderData = {
    type: 1, // 1 = интернет-магазин
    number: `CG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tariff_code: selectedTariff.code,
    comment: 'Заказ с сайта clip & go',
    sender: {
      company: 'ИП clip & go',
      name: 'Менеджер магазина',
      email: 'clip_and_go@outlook.com',
      phones: [{ number: '+79999999999' }]
    },
    recipient: recipient,
    from_location: {
      code: FROM_LOCATION,
      city: 'Москва',
      address: 'Склад интернет-магазина clip & go'
    },
    packages: packages
  };

  // Добавляем адрес доставки в зависимости от типа
  if (selectedTariff.type === 'PVZ' || selectedTariff.type === 'POSTAMAT') {
    // Доставка в ПВЗ/постамат
    orderData.delivery_point = selectedTariff.pvzCode;
  } else {
    // Курьерская доставка
    orderData.to_location = {
      code: cityCode,
      city: currentCity,
      address: streetIn().value.trim()
    };
  }

  return orderData;
}

/* === Яндекс-подсказки городов === */
function initCitySuggest() {
  cityIn().addEventListener('input', debounce(async e => {
    if (justSelectedCity) { justSelectedCity = false; return; }
    const q = e.target.value.trim();
    currentCity = ''; cityCode = null;
    resetDeliveryFlow();

    const ul = citySug();
    ul.innerHTML = ''; ul.classList.remove('visible');
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
      cityIn().value = txt; currentCity = txt;
      ul.innerHTML = ''; ul.classList.remove('visible');
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

/* === Ввод улицы и карта === */
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

/* === Delivery toggle и показ карты === */
function initDeliveryToggle() {
  document.getElementById('deliveryCourier').addEventListener('change', () => {
    if (!cityCode) return;
    showElement(streetWrapper());
    hideMapWrapper();
    hideTariffs();
    selectedTariff = null;
    shipping = 0;
    deliveryInfoEl().textContent = '';
    updateUI();

    // Для курьера можем сразу показать тарифы
    showCourierTariffs();
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

/* === Показ тарифов для курьерской доставки === */
async function showCourierTariffs() {
  // Предзагружаем тарифы для курьера
  await preloadTariffPreviews([137, 482]); // Коды тарифов для курьера

  // Показываем кнопки выбора тарифов
  renderTariffButtons('COURIER', 'Курьерская доставка', null);
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

/* === Fetch & plot PVZ + кэш тарифов === */
async function fetchAndPlotPvz() {
  if (!cityCode || !mapInstance) return;
  if (!cityClusterer) {
    cityClusterer = new ymaps.Clusterer({ preset: 'islands#invertedDarkBlueClusterIcons', groupByCoordinates: false, clusterDisableClickZoom: false, clusterOpenBalloonOnClick: false });
    postamatClusterer = new ymaps.Clusterer({ preset: 'islands#invertedLightBlueClusterIcons', groupByCoordinates: false, clusterDisableClickZoom: false, clusterOpenBalloonOnClick: false });
  }
  clearClusters();

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
    const type = (pt.type || '').toUpperCase();  // PVZ | POSTAMAT
    const icon = type === 'PVZ' ? '/assets/icons/pvz.png' : '/assets/icons/postamat.png';
    const pm = new ymaps.Placemark(coords, {}, { iconLayout: 'default#image', iconImageHref: icon, iconImageSize: [32, 32], iconImageOffset: [-16, -32] });

    pm.events.add('click', () => {
      mapInstance.setCenter(coords, 14, { duration: 500 });
      renderPvzInfoPanel(pt, type, loc);
    });

    (type === 'PVZ' ? cityClusterer : postamatClusterer).add(pm);
  });

  [cityClusterer, postamatClusterer].forEach(cl => cl.events.add('click', e => {
    const clus = e.get('target');
    mapInstance.setCenter(clus.geometry.getCoordinates(), mapInstance.getZoom() + 1, { duration: 500 });
  }));

  mapInstance.geoObjects.add(cityClusterer).add(postamatClusterer);
}
function clearClusters() {
  if (cityClusterer) cityClusterer.removeAll();
  if (postamatClusterer) postamatClusterer.removeAll();
}

/* === Инфо-панель PVZ/Postamat === */
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

/* === Кэш тарифов === */
async function preloadTariffPreviews(codes) {
  if (!cityCode) return;
  codes.forEach(async code => {
    if (cachedPreviews[code]) return;
    const totalWeight = counts.camera*CAMERA_WEIGHT_KG + counts.memory*MEMORY_WEIGHT_KG;
    const dims = counts.camera>0?CAMERA_DIMENSIONS:counts.memory>0?MEMORY_DIMENSIONS:{length:1,width:1,height:1};
    const body = {
      date: new Date().toISOString().replace(/\.\d{3}Z$/, '+0300'),
      type: 1, currency:0, lang:'rus',
      tariff_code: code,
      from_location:{code:FROM_LOCATION},
      to_location:{code:cityCode},
      packages:[{weight:Number(totalWeight.toFixed(3)),...dims}],
      additional_order_types:[]
    };
    try {
      const resp = await fetch('/api/cdek/calculator/tariff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const j = await resp.json();
      cachedPreviews[code] = j.errors?{deliverySum:0,periodMin:0,periodMax:0}:{deliverySum:j.delivery_sum||j.total_sum||0,periodMin:j.period_min||0,periodMax:j.period_max||0};
    } catch {
      cachedPreviews[code] = {deliverySum:0,periodMin:0,periodMax:0};
    }
  });
}

/* === Рендер кнопок тарифов === */
function renderTariffButtons(markerType, address, pvzCode) {
  let arr;
  if (markerType === 'COURIER') {
    arr = [{code:137,name:'Стандарт'},{code:482,name:'Экспресс'}];
  } else if (markerType === 'PVZ') {
    arr = [{code:136,name:'Стандарт'},{code:483,name:'Экспресс'}];
  } else { // POSTAMAT
    arr = [{code:368,name:'Стандарт'},{code:486,name:'Экспресс'}];
  }

  let html = '<h3 style="margin-bottom:16px;font-size:1.3em;color:#007BFF;">Выберите тариф:</h3>';
  arr.forEach(t => {
    const p = cachedPreviews[t.code]||{deliverySum:0,periodMin:0,periodMax:0};
    const cost = Math.ceil((p.deliverySum||0)/10)*10;
    const costStr = cost.toLocaleString('ru-RU')+' ₽';
    const period = p.periodMin===p.periodMax?`${p.periodMin} дн.`:`${p.periodMin}–${p.periodMax} дн.`;
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

      const typeText = markerType === 'COURIER' ? 'Курьер' :
          markerType === 'PVZ' ? 'ПВЗ' : 'Постамат';
      deliveryInfoEl().textContent =
          `Выбран ${typeText}: ${address}. Тариф ${selectedTariff.code}, стоимость ${shipping.toLocaleString('ru-RU')} ₽`;
    });
  });
}

/* === Помощники === */
function showElement(el)  { if(el) el.classList.add('visible'); }
function hideElement(el)  { if(el) el.classList.remove('visible'); }
function showTariffs()    { tariffContainer.classList.add('visible'); }
function hideTariffs()    { tariffContainer.classList.remove('visible'); tariffContainer.innerHTML = ''; }
function resetDeliveryFlow() {
  hideElement(deliverySection());
  hideElement(streetWrapper());
  hideElement(infoPanel());
  hideMapWrapper();
  hideTariffs();
  selectedTariff = null;
  shipping = 0;
  updateUI();
}
function debounce(fn, ms = 300) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}