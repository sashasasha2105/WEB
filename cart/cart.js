// === File: cart/cart.js ===

// === Prices & state ===
const prices = { camera: 8900, memory: 500 };

// вес и габариты (целые числа для габаритов, вес дробный)
const CAMERA_WEIGHT_KG = 0.327;   // 327 грамм
const MEMORY_WEIGHT_KG = 0.008;   // 8 грамм
const CAMERA_DIMENSIONS = { length: 20, width: 12, height: 6 };
const MEMORY_DIMENSIONS = { length: 13, width: 8, height: 1 };

// код города отправки (Москва)
const FROM_LOCATION = 44;

let counts = { camera: 0, memory: 0 };
let discount = 0, shipping = 0;
let cityCode = null;       // числовой код города СДЭК
let currentCity = '';      // выбранный город в текстовом виде

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
const infoPanel        = () => document.getElementById('pvz-info-panel');
const mapWrapper       = () => document.querySelector('.map-wrapper');
const tariffContainer  = document.getElementById('tariffOptions');

let mapInstance, cityClusterer, postamatClusterer, streetMarker;

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Log] [init] DOMContentLoaded');

  loadCart();
  updateUI();
  initCartControls();
  initCitySuggest();
  initDeliveryToggle();
  initStreetInput();

  // Конфигурация контейнера тарифов уже осуществляется в CSS
  // Здесь он уже есть в HTML – просто очищаем:
  if (tariffContainer) tariffContainer.innerHTML = '';
});

// === Load/save cart ===
function loadCart() {
  const d = JSON.parse(localStorage.getItem('cartData') || '{}');
  counts.camera = d.cameraCount || 0;
  counts.memory = d.memoryCount || 0;
  console.log('[Log] [loadCart] загружены данные корзины: –', d);
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

  console.log('[Log] [updateUI] Итоговая сумма обновлена: –', sum);
}

// === Cart controls (плюс/минус/удалить/промокод) ===
function initCartControls() {
  console.log('[Log] [initCartControls] Навешиваем кнопки +/–/удалить/промокод');
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

// === City suggest (Яндекс.Советник) ===
function initCitySuggest() {
  console.log('[Log] [initCitySuggest] Навешиваем автоподсказку городов');
  cityIn().addEventListener(
      'input',
      debounce(async e => {
        const q = e.target.value.trim();
        currentCity = '';
        cityCode = null;
        clearClusters();
        hideMap();
        deliverySection().style.display = 'none';
        streetWrapper().style.display = 'none';
        mapWrapper().classList.remove('with-panel');
        tariffContainer.innerHTML = '';
        citySug().innerHTML = '';
        if (q.length < 2) return;

        console.log('[Log] [CitySuggest] Запрашиваем подсказки Yandex для: –', q);
        const resp = await fetch(`/api/yandex/suggest?text=${encodeURIComponent(q)}`);
        const json = await resp.json();
        console.log('[Log] [CitySuggest] Получены подсказки от Yandex: –', json);
        renderSuggestions(json.results);
      }),
      300
  );
}

function renderSuggestions(items) {
  const ul = citySug();
  ul.innerHTML = '';
  items.forEach(item => {
    const text =
        item.title.text + (item.subtitle ? ', ' + item.subtitle.text : '');
    const li = document.createElement('li');
    li.textContent = text;
    li.addEventListener('click', async () => {
      cityIn().value = text;
      currentCity = text;
      ul.innerHTML = '';
      console.log('[Log] [CitySuggest] Пользователь выбрал город из списка: –', text);
      await fetchCdekCityCode(text);
      deliverySection().style.display = 'block';
    });
    ul.append(li);
  });
}

async function fetchCdekCityCode(cityName) {
  try {
    console.log('[Log] [fetchCdekCityCode] Запрос кода города для: –', cityName);
    const resp = await fetch(`/api/cdek/cities?search=${encodeURIComponent(cityName)}`);
    const json = await resp.json();
    console.log('[Log] [fetchCdekCityCode] Ответ API CDEK (cities): –', json);
    const first = Array.isArray(json)
        ? json[0]
        : json.results
            ? json.results[0]
            : null;
    cityCode = first ? first.code : null;
    console.log('[Log] [fetchCdekCityCode] Выбран код: –', cityCode);
    console.log('[Log] [CitySuggest] Установлен cityCode: –', cityCode);
  } catch (err) {
    console.error('[Log] [fetchCdekCityCode] CDEK Cities error', err);
  }
}

// === Street input & geocode (для курьера) ===
function initStreetInput() {
  console.log('[Log] [initStreetInput] Навешиваем geocode на ввод улицы');
  streetIn().addEventListener('change', async () => {
    const addr = streetIn().value.trim();
    if (!addr || !mapInstance) return;
    const full = `${currentCity}, ${addr}`;
    try {
      const res = await ymaps.geocode(full);
      const coords = res.geoObjects.get(0).geometry.getCoordinates();
      console.log('[Log] [StreetInput] Координаты после геокодера: –', coords);
      mapInstance.setCenter(coords, 14, { duration: 500 });
      if (streetMarker) mapInstance.geoObjects.remove(streetMarker);
      streetMarker = new ymaps.Placemark(coords, {}, {
        preset: 'islands#circleIcon',
        iconColor: '#FF5733'
      });
      mapInstance.geoObjects.add(streetMarker);
    } catch (e) {
      console.error('[Log] [StreetInput] Geocode street error', e);
    }
  });
}

// === Delivery toggle (курьер / ПВЗ) ===
function initDeliveryToggle() {
  console.log('[Log] [initDeliveryToggle] Навешиваем переключатели “Курьер/PVZ”');
  document.getElementById('deliveryPvz').addEventListener('change', () => {
    if (!cityCode) return;
    console.log('[Log] [DeliveryToggle] Выбран PVZ. cityCode = –', cityCode);
    showMap(currentCity, async () => {
      await fetchAndPlotPvz();
      streetWrapper().style.display = 'block';
      console.log('[Log] [DeliveryToggle] Карта и PVZ загружены');
    });
  });

  document.getElementById('deliveryCourier').addEventListener('change', () => {
    console.log('[Log] [DeliveryToggle] Выбран Courier');
    hideMap();
    clearClusters();
    streetWrapper().style.display = 'none';
    mapWrapper().classList.remove('with-panel');
    tariffContainer.innerHTML = '';
  });
}

// === Fetch & plot PVZ/POSTAMAT и превью тарифов ===
async function fetchAndPlotPvz() {
  if (!cityCode || !mapInstance) return;

  console.log('[Log] [fetchAndPlotPvz] Начало загрузки PVZ для cityCode = –', cityCode);
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
    console.log('[Log] [fetchAndPlotPvz] Кластеризаторы созданы');
  }
  clearClusters();

  let page = 0, totalPages = 1, allItems = [];
  while (page < totalPages) {
    const url = `/api/cdek/pvz?cityId=${encodeURIComponent(cityCode)}&type=ALL&size=1000&page=${page}`;
    console.log(`[Log] [fetchAndPlotPvz] Fetch PVZ, page=${page}, URL= – "${url}"`);
    const resp = await fetch(url);
    const items = await resp.json();
    allItems.push(...items);
    totalPages = parseInt(resp.headers.get('x-total-pages') || '1', 10);
    page++;
  }
  console.log('[Log] [fetchAndPlotPvz] Собрано всех пунктов: –', allItems.length);

  allItems.forEach(pt => {
    const loc = pt.location || {};
    if (!loc.latitude || !loc.longitude) return;
    const coords = [loc.latitude, loc.longitude];
    const type = (pt.type || '').toUpperCase(); // "PVZ" или "POSTAMAT"
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
      console.log('[Log] [PVZ] Клик по маркеру: –', pt.code, '–', loc.address_full);
      // Панорамируем к выбранному ПВЗ/постамату
      mapInstance.panTo(coords, { duration: 500 });

      // Собираем базовую HTML-информацию
      let html = '';
      const imgs = (pt.office_image_list || []).slice(0, 3);
      if (imgs.length) {
        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
        imgs.forEach(i =>
            html += `<img src="${i.url}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;">`
        );
        html += '</div>';
      }
      html += `<h3 style="margin:4px 0;">${type === 'PVZ' ? 'Пункт выдачи' : 'Постамат'}</h3>`;
      html += `<p><strong>Адрес:</strong> ${loc.address_full || '—'}</p>`;
      html += `<p><strong>Время работы:</strong> ${pt.work_time || '—'}</p>`;
      html += `<p><strong>Телефон:</strong> ${(pt.phones || []).map(p => p.number).join(', ') || '—'}</p>`;
      html += `<p><strong>Оплата:</strong> наличные ${pt.have_cash ? 'есть' : 'нет'}, безнал ${pt.have_cashless ? 'есть' : 'нет'}</p>`;
      html += `<button id="selectPvzBtn" style="
                 margin-top:12px;
                 padding:14px 18px;
                 background:#28a745;
                 color:#fff;
                 border:none;
                 border-radius:6px;
                 font-size:1em;
                 cursor:pointer;
                 width:100%;
                 text-align:center;
                 transition:background 0.3s;">
               Выбрать пункт
             </button>`;

      infoPanel().innerHTML = html;
      mapWrapper().classList.add('with-panel');

      // Очищаем контейнер тарифов
      tariffContainer.innerHTML = '';

      // Навешиваем обработчик на кнопку «Выбрать пункт»
      document.getElementById('selectPvzBtn').addEventListener('click', async () => {
        const markerType = type;         // "PVZ" или "POSTAMAT"
        const addressFull = loc.address_full || '—';

        // Доступные тарифы в зависимости от типа точки:
        let availableTariffs;
        if (markerType === 'PVZ') {
          availableTariffs = [
            { code: 136, name: 'Стандарт' },
            { code: 483, name: 'Экспресс' }
          ];
        } else {
          availableTariffs = [
            { code: 368, name: 'Стандарт' },
            { code: 486, name: 'Экспресс' }
          ];
        }
        console.log('[Log] [PVZ] Доступные тарифы для типа –', `"${markerType}" –`, availableTariffs);

        // Предварительный расчёт (превью) для каждого тарифа
        const previews = await Promise.all(
            availableTariffs.map(t => getTariffPreview(t.code))
        );

        // Рендерим варианты тарифов и сразу показываем стоимость + срок
        let tariffsHtml = '<h3>Выберите тариф:</h3>';
        availableTariffs.forEach((t, idx) => {
          const prev = previews[idx];
          const cost = prev.deliverySum.toLocaleString('ru-RU');
          const period = prev.periodMin === prev.periodMax
              ? `${prev.periodMin} дн.`
              : `${prev.periodMin}–${prev.periodMax} дн.`;
          tariffsHtml += `
            <button class="tariff-btn" data-code="${t.code}">
              ${t.name} — <strong>${cost} ₽</strong>, срок: <em>${period}</em>
            </button>
          `;
        });
        tariffContainer.innerHTML = tariffsHtml;

        // Навешиваем обработчики на кнопки выбора тарифа
        document.querySelectorAll('.tariff-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const tariffCode = Number(btn.dataset.code);
            console.log('[Log] [TariffFetch] Пользователь выбрал тариф: –',
                tariffCode, '– для пункта:', `"${markerType}" – "${addressFull}"`);
            calculateForTariff(tariffCode, markerType, addressFull);
          });
        });
      });
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
    console.log('[Log] [fetchAndPlotPvz] Карта установлена на границы всех ПВЗ');
  }
}

// === Получение превью (цена + срок) без изменения глобального shipping ===
async function getTariffPreview(tariffCode) {
  // 1) Считаем общий вес
  const totalCameraWeight = counts.camera * CAMERA_WEIGHT_KG;
  const totalMemoryWeight = counts.memory * MEMORY_WEIGHT_KG;
  const totalWeight = totalCameraWeight + totalMemoryWeight;

  // 2) Габариты (целые). Если товара нет — минимальные 1×1×1
  let length, width, height;
  if (counts.camera > 0) {
    length = CAMERA_DIMENSIONS.length;
    width  = CAMERA_DIMENSIONS.width;
    height = CAMERA_DIMENSIONS.height;
  } else if (counts.memory > 0) {
    length = MEMORY_DIMENSIONS.length;
    width  = MEMORY_DIMENSIONS.width;
    height = MEMORY_DIMENSIONS.height;
  } else {
    length = 1; width = 1; height = 1;
  }

  // 3) Формируем тело запроса к СДЭК (to_location.code = cityCode)
  const body = {
    date: new Date().toISOString().replace(/\.\d{3}Z$/, '+0300'),
    type: 1,
    currency: 0,
    lang: 'rus',
    tariff_code: tariffCode,
    from_location: { code: FROM_LOCATION },
    to_location:   { code: cityCode },
    packages: [
      {
        weight: Number(totalWeight.toFixed(3)),
        length: length,
        width: width,
        height: height
      }
    ],
    additional_order_types: []
  };

  console.log('[Log] [TariffPreview] Запрос превью для тарифa', tariffCode, body);
  try {
    const resp = await fetch('/api/cdek/calculator/tariff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await resp.json();
    if (result.errors) {
      console.warn('[Log] [TariffPreview] Ошибка превью:', result.errors);
      return { deliverySum: 0, periodMin: 0, periodMax: 0 };
    }
    return {
      deliverySum: result.delivery_sum || result.total_sum || 0,
      periodMin: result.period_min || 0,
      periodMax: result.period_max || 0
    };
  } catch (e) {
    console.error('[Log] [TariffPreview] CDEK tariff preview error', e);
    return { deliverySum: 0, periodMin: 0, periodMax: 0 };
  }
}

// === Calculate shipping для выбранного тарифа ===
async function calculateForTariff(tariffCode, markerType, addressFull) {
  // 1) Считаем общий вес
  const totalCameraWeight = counts.camera * CAMERA_WEIGHT_KG;
  const totalMemoryWeight = counts.memory * MEMORY_WEIGHT_KG;
  const totalWeight = totalCameraWeight + totalMemoryWeight;
  console.log('[Log] [calculateForTariff] Расчёт веса для доставки: –',
      totalWeight.toFixed(3), 'кг');

  // 2) Габариты
  let length, width, height;
  if (counts.camera > 0) {
    length = CAMERA_DIMENSIONS.length;
    width  = CAMERA_DIMENSIONS.width;
    height = CAMERA_DIMENSIONS.height;
    console.log('[Log] [calculateForTariff] Используем габариты камеры: –', { length, width, height });
  } else if (counts.memory > 0) {
    length = MEMORY_DIMENSIONS.length;
    width  = MEMORY_DIMENSIONS.width;
    height = MEMORY_DIMENSIONS.height;
    console.log('[Log] [calculateForTariff] Используем габариты карты памяти: –', { length, width, height });
  } else {
    length = 1; width = 1; height = 1;
    console.log('[Log] [calculateForTariff] Нет товаров, минимальные габариты: –', { length, width, height });
  }

  // 3) Формируем тело запроса
  const body = {
    date: new Date().toISOString().replace(/\.\d{3}Z$/, '+0300'),
    type: 1,
    currency: 0,
    lang: 'rus',
    tariff_code: tariffCode,
    from_location: { code: FROM_LOCATION },
    to_location:   { code: cityCode },
    packages: [
      {
        weight: Number(totalWeight.toFixed(3)),
        length: length,
        width: width,
        height: height
      }
    ],
    additional_order_types: []
  };

  console.log('[Log] [TariffFetch] Отправляем запрос тарифов CDEK: –', body);
  try {
    const resp = await fetch('/api/cdek/calculator/tariff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await resp.json();
    if (result.errors) {
      console.warn('[Log] [TariffFetch] Ошибка от /api/cdek/calculator/tariff: –', result.errors);
      return;
    }
    const deliverySum = result.delivery_sum || result.total_sum || 0;
    const periodMin = result.period_min;
    const periodMax = result.period_max;
    shipping = deliverySum;
    updateUI();

    alert(
        `Выбран ${markerType === 'PVZ' ? 'ПВЗ' : 'Постамат'}: ${addressFull}\n` +
        `Тариф: ${tariffCode}\nСтоимость: ${deliverySum.toLocaleString('ru-RU')} ₽\n` +
        `Срок: ${periodMin === periodMax ? periodMin + ' дн.' : periodMin + '–' + periodMax + ' дн.'}`
    );
    console.log('[Log] [TariffFetch] Установлен shipping = –', shipping);
  } catch (e) {
    console.error('[Log] [TariffFetch] CDEK tariff error', e);
    shipping = 0;
    updateUI();
  }
}

// === Helpers ===
function clearClusters() {
  if (cityClusterer) cityClusterer.removeAll();
  if (postamatClusterer) postamatClusterer.removeAll();
  console.log('[Log] [clearClusters] Кластеры очищены');
}
function showMap(city, cb) {
  mapContainer().style.display = 'block';
  ymaps.ready(() => {
    ymaps.geocode(city).then(r => {
      const c = r.geoObjects.get(0).geometry.getCoordinates();
      console.log('[Log] [showMap] Координаты города после geocode: –', c);
      if (!mapInstance) {
        mapInstance = new ymaps.Map('map', {
          center: c,
          zoom: 10,
          controls: ['zoomControl']
        });
        console.log('[Log] [showMap] Новая инстанция карты создана');
      } else {
        mapInstance.setCenter(c);
      }
      cb && cb();
    });
  });
}
function hideMap() {
  mapContainer().style.display = 'none';
  console.log('[Log] [hideMap] Карта скрыта');
}
function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}