// === File: cart/cart.js ===

// === Prices & state ===
const prices = { camera: 8900, memory: 500 };

// вес и габариты (целые числа для габаритов, вес дробный)
const CAMERA_WEIGHT_KG = 0.327;   // 327 грамм
const MEMORY_WEIGHT_KG = 0.008;   // 8 грамм
const CAMERA_DIMENSIONS = { length: 20, width: 12, height: 6 };
const MEMORY_DIMENSIONS = { length: 13, width: 8, height: 1 };

// код города отправки (Москва по умолчанию)
const FROM_LOCATION = 44;

let counts = { camera: 0, memory: 0 };
let discount = 0, shipping = 0;
let cityCode = null;       // числовой код города CDEK
let currentCity = '';      // выбранный город из подсказки

// Для того, чтобы «первый» input не срабатывал сразу после клика по подсказке
let justSelectedCity = false;

// Данные, в которые мы будем сохранять «превью тарифов»
// Структура: { кодТарифа: { deliverySum, periodMin, periodMax } }
let cachedPreviews = {};


// === DOM shortcuts ===
const badgeEl         = () => document.querySelector('.cart-count');
const totalEl         = () => document.getElementById('cartTotalValue');
const shipEl          = () => document.getElementById('shippingCostValue');
const cityIn          = () => document.getElementById('addressInput');
const citySug         = () => document.getElementById('citySuggestions');
const deliverySection = () => document.getElementById('deliveryMethodSection');
const streetWrapper   = () => document.getElementById('streetWrapper');
const streetIn        = () => document.getElementById('streetInput');
const mapContainer    = () => document.getElementById('map');
const infoPanel       = () => document.getElementById('pvz-info-panel');
const mapWrapper      = () => document.querySelector('.map-wrapper');
const tariffContainer = document.getElementById('tariffOptions');

let mapInstance = null;
let cityClusterer = null;
let postamatClusterer = null;
let streetMarker = null;


// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Log] [init] DOMContentLoaded');

  loadCart();
  updateUI();
  initCartControls();
  initCitySuggest();
  initDeliveryToggle();
  initStreetInput();

  // Сбрасываем контейнер тарифов
  hideTariffs();
  cachedPreviews = {};
});


// === Load/save cart ===
function loadCart() {
  const d = JSON.parse(localStorage.getItem('cartData') || '{}');
  counts.camera = d.cameraCount || 0;
  counts.memory = d.memoryCount || 0;
  console.log('[Log] [loadCart] загружены данные корзины:', d);
}
function saveCart() {
  localStorage.setItem('cartData', JSON.stringify({
    cameraCount: counts.camera,
    memoryCount: counts.memory
  }));
}


// === Update UI (итоговая сумма + бейджик) ===
function updateUI() {
  if (badgeEl()) badgeEl().textContent = counts.camera + counts.memory;
  shipEl().textContent = shipping.toLocaleString('ru-RU');

  let sum = counts.camera * prices.camera + counts.memory * prices.memory;
  sum -= Math.round(sum * discount / 100);
  sum += shipping;
  totalEl().textContent = sum.toLocaleString('ru-RU');

  console.log('[Log] [updateUI] Итоговая сумма обновлена:', sum);
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
        // Если только что кликнули по подсказке, пропускаем одно срабатывание
        if (justSelectedCity) {
          justSelectedCity = false;
          return;
        }

        const q = e.target.value.trim();
        currentCity = '';
        cityCode = null;
        resetDeliveryFlow();

        const ul = citySug();
        ul.innerHTML = '';
        ul.classList.remove('visible');

        if (q.length < 2) return;

        console.log('[Log] [CitySuggest] Запрашиваем подсказки Yandex для:', q);
        try {
          const resp = await fetch(`/api/yandex/suggest?text=${encodeURIComponent(q)}`);
          const json = await resp.json();
          console.log('[Log] [CitySuggest] Получены подсказки от Yandex:', json);
          renderSuggestions(json.results);
        } catch (err) {
          console.error('[Log] [CitySuggest] Ошибка при запросе подсказок:', err);
        }
      }),
      300
  );
}

function renderSuggestions(items) {
  const ul = citySug();
  ul.innerHTML = '';

  if (!items || !items.length) {
    ul.classList.remove('visible');
    return;
  }

  items.forEach(item => {
    const text = item.title.text + (item.subtitle ? ', ' + item.subtitle.text : '');
    const li = document.createElement('li');
    li.textContent = text;
    li.style.padding = '10px';
    li.style.cursor = 'pointer';
    li.addEventListener('mouseover', () => li.style.background = '#f0f0f0');
    li.addEventListener('mouseout', () => li.style.background = '#fff');
    li.addEventListener('click', async () => {
      justSelectedCity = true;
      cityIn().value = text;
      currentCity = text;
      ul.innerHTML = '';
      ul.classList.remove('visible');
      console.log('[Log] [CitySuggest] Пользователь выбрал город:', text);
      await fetchCdekCityCode(text);
      showElement(deliverySection());
    });
    ul.append(li);
  });

  ul.classList.add('visible');
}

async function fetchCdekCityCode(cityName) {
  try {
    console.log('[Log] [fetchCdekCityCode] Изначальный город:', cityName);
    let queryName = cityName.split(',')[0].trim();
    console.log('[Log] [fetchCdekCityCode] Используем для поиска CDEK:', queryName);

    const resp = await fetch(`/api/cdek/cities?search=${encodeURIComponent(queryName)}`);
    const json = await resp.json();
    console.log('[Log] [fetchCdekCityCode] Ответ API CDEК (cities):', json);

    const first = Array.isArray(json)
        ? json[0]
        : json.results
            ? json.results[0]
            : null;

    cityCode = first ? first.code : null;
    console.log('[Log] [fetchCdekCityCode] Установлен cityCode:', cityCode);
  } catch (err) {
    console.error('[Log] [fetchCdekCityCode] CDEК Cities error', err);
  }
}


// === Street input & геокодинг (курьер) ===
function initStreetInput() {
  console.log('[Log] [initStreetInput] Навешиваем геокодинг на ввод улицы');

  streetIn().addEventListener('change', async () => {
    const addr = streetIn().value.trim();
    if (!addr || !mapInstance) return;
    const full = `${currentCity}, ${addr}`;
    try {
      const res = await ymaps.geocode(full);
      const coords = res.geoObjects.get(0).geometry.getCoordinates();
      console.log('[Log] [StreetInput] Координаты после геокодера:', coords);
      mapInstance.setCenter(coords, 14, { duration: 500 });
      if (streetMarker) {
        mapInstance.geoObjects.remove(streetMarker);
      }
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


// === Delivery toggle (Курьер / ПВЗ) ===
function initDeliveryToggle() {
  console.log('[Log] [initDeliveryToggle] Навешиваем переключатели «Курьер/PVZ»');

  document.getElementById('deliveryCourier').addEventListener('change', () => {
    if (!cityCode) return;
    console.log('[Log] [DeliveryToggle] Выбран Courier');
    hideElement(streetWrapper());
    hideMapWrapper();
    hideTariffs();
  });

  document.getElementById('deliveryPvz').addEventListener('change', () => {
    if (!cityCode) {
      console.warn('[Log] [DeliveryToggle] Нет cityCode, PVZ не будет загружаться');
      return;
    }
    console.log('[Log] [DeliveryToggle] Выбран PVZ. cityCode =', cityCode);
    showElement(streetWrapper());
    hideTariffs();
    showMapWrapper(currentCity, async () => {
      await fetchAndPlotPvz();
      console.log('[Log] [DeliveryToggle] Карта и PVZ загружены');
    });
  });
}


// === Fetch & plot PVZ/POSTAMAT + заранее запрашиваем «превью» тарифов ===
async function fetchAndPlotPvz() {
  if (!cityCode || !mapInstance) return;

  console.log('[Log] [fetchAndPlotPvz] Начало загрузки PVZ для cityCode =', cityCode);

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
    console.log('[Log] [fetchAndPlotPvz] Кластеризаторы созданы');
  }

  clearClusters();

  let page = 0, totalPages = 1, allItems = [];
  while (page < totalPages) {
    const url = `/api/cdek/pvz?cityId=${encodeURIComponent(cityCode)}&type=ALL&size=1000&page=${page}`;
    console.log(`[Log] [fetchAndPlotPvz] Fetch PVZ, page=${page}, URL="${url}"`);
    const resp = await fetch(url);
    const items = await resp.json();
    allItems.push(...items);
    totalPages = parseInt(resp.headers.get('x-total-pages') || '1', 10);
    page++;
  }
  console.log('[Log] [fetchAndPlotPvz] Собрано всех пунктов:', allItems.length);

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
      console.log('[Log] [PVZ] Клик по метке:', pt.code, loc.address_full);

      // Сразу устанавливаем центр карты с анимацией
      mapInstance.setCenter(coords, 14, { duration: 500 });

      // Заполняем информационную панель
      let html = '';
      const imgs = (pt.office_image_list || []).slice(0, 3);
      if (imgs.length) {
        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
        imgs.forEach(i =>
            html += `<img src="${i.url}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;margin-right:4px;">`
        );
        html += '</div>';
      }
      html += `<h3 style="margin:4px 0;color:#007BFF;font-size:1.2em;">${
          type === 'PVZ' ? 'Пункт выдачи' : 'Постамат'
      }</h3>`;
      html += `<p style="margin-bottom:8px;font-size:0.95em;color:#555;"><strong>Адрес:</strong> ${
          loc.address_full || '—'
      }</p>`;
      html += `<p style="margin-bottom:8px;font-size:0.95em;color:#555;"><strong>Время работы:</strong> ${
          pt.work_time || '—'
      }</p>`;
      html += `<p style="margin-bottom:8px;font-size:0.95em;color:#555;"><strong>Телефон:</strong> ${
          (pt.phones || []).map(p => p.number).join(', ') || '—'
      }</p>`;
      html += `<p style="margin-bottom:8px;font-size:0.95em;color:#555;"><strong>Оплата:</strong> наличные ${
          pt.have_cash ? 'есть' : 'нет'
      }, безнал ${pt.have_cashless ? 'есть' : 'нет'}</p>`;
      html += `<button id="selectPvzBtn" style="
                  width:100%;
                  margin-top:14px;
                  padding:14px 0;
                  background:#28a745;
                  color:#fff;
                  border:none;
                  border-radius:6px;
                  font-size:1em;
                  cursor:pointer;
                  transition:background 0.3s ease,transform 0.2s ease;
                ">
                Выбрать пункт
              </button>`;

      infoPanel().innerHTML = html;
      mapWrapper().classList.add('with-panel');
      showElement(infoPanel());

      // Сразу запрашиваем превью тарифов (150 и 250 руб., например)
      preloadTariffPreviews([136, 483, 368, 486]);

      // Навешиваем на кнопку «Выбрать пункт»
      document.getElementById('selectPvzBtn').addEventListener('click', () => {
        const markerType = type; // "PVZ" или "POSTAMAT"
        const addressFull = loc.address_full || '—';
        renderTariffButtons(markerType, addressFull);
      });
    });

    if (type === 'PVZ') cityClusterer.add(pm);
    else postamatClusterer.add(pm);
  });

  // Обработчики клика по кластеру: плавно «зумим» и панорама к центру кластера
  [cityClusterer, postamatClusterer].forEach(clusterer => {
    clusterer.events.add('click', function(e) {
      const cluster = e.get('target');
      const center = cluster.geometry.getCoordinates();
      const newZoom = mapInstance.getZoom() + 1;
      mapInstance.setCenter(center, newZoom, { duration: 500 });
    });
  });

  mapInstance.geoObjects
      .add(cityClusterer)
      .add(postamatClusterer);
}

// === Preload: запрашиваем превью тарифов сразу, как пользователь кликнул по метке PVZ ===
async function preloadTariffPreviews(codes) {
  if (!cityCode) return;

  codes.forEach(async tariffCode => {
    // Если уже в кеше — пропускаем
    if (cachedPreviews[tariffCode]) return;

    // Рассчитываем вес и габариты
    const totalCameraWeight = counts.camera * CAMERA_WEIGHT_KG;
    const totalMemoryWeight = counts.memory * MEMORY_WEIGHT_KG;
    const totalWeight = totalCameraWeight + totalMemoryWeight;

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

    try {
      const resp = await fetch('/api/cdek/calculator/tariff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await resp.json();
      if (result.errors) {
        console.warn('[Log] [TariffPreview] Ошибка превью:', result.errors);
        cachedPreviews[tariffCode] = { deliverySum: 0, periodMin: 0, periodMax: 0 };
      } else {
        cachedPreviews[tariffCode] = {
          deliverySum: result.delivery_sum || result.total_sum || 0,
          periodMin: result.period_min || 0,
          periodMax: result.period_max || 0
        };
      }
      console.log('[Log] [TariffPreview] Кешировано превью для тарифа', tariffCode, cachedPreviews[tariffCode]);
    } catch (e) {
      console.error('[Log] [TariffPreview] Ошибка загрузки превью:', e);
      cachedPreviews[tariffCode] = { deliverySum: 0, periodMin: 0, periodMax: 0 };
    }
  });
}


// === Рендерим кнопки тарифов (плавно) ===
function renderTariffButtons(markerType, addressFull) {
  // Доступные тарифы
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

  // Строим HTML-кнопок на основе уже закешированных превью
  let tariffsHtml = '<h3 style="margin-bottom:16px;font-size:1.3em;color:#007BFF;">Выберите тариф:</h3>';
  availableTariffs.forEach(t => {
    const prev = cachedPreviews[t.code] || { deliverySum: 0, periodMin: 0, periodMax: 0 };
    const rawSum = prev.deliverySum;
    // Округляем вверх до ближайших 10 рублей
    const roundedSum = Math.ceil(rawSum / 10) * 10;
    const costStr = roundedSum.toLocaleString('ru-RU');
    const period = prev.periodMin === prev.periodMax
        ? `${prev.periodMin} дн.`
        : `${prev.periodMin}–${prev.periodMax} дн.`;
    tariffsHtml += `
      <button class="tariff-btn" data-code="${t.code}" data-sum="${roundedSum}">
        ${t.name} — <strong>${costStr} ₽</strong>, срок: <em>${period}</em>
      </button>
    `;
  });

  tariffContainer.innerHTML = tariffsHtml;
  showTariffs();

  // Навешиваем клики по новым кнопкам
  document.querySelectorAll('.tariff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tariffCode = Number(btn.dataset.code);
      const roundedCost = Number(btn.dataset.sum);
      console.log('[Log] [TariffFetch] Пользователь выбрал тариф:', tariffCode, 'для', markerType, addressFull);
      calculateForTariff(tariffCode, markerType, addressFull, roundedCost);
    });
  });
}


// === Calculate shipping (с округлённым значением) ===
async function calculateForTariff(tariffCode, markerType, addressFull, roundedCost) {
  shipping = roundedCost;
  updateUI();

  alert(
      `Выбран ${markerType === 'PVZ' ? 'ПВЗ' : 'Постамат'}: ${addressFull}\n` +
      `Тариф: ${tariffCode}\nСтоимость: ${shipping.toLocaleString('ru-RU')} ₽`
  );
  console.log('[Log] [TariffFetch] Установлен shipping (округлённый) =', shipping);
}


// === Helpers ===
function clearClusters() {
  if (cityClusterer) cityClusterer.removeAll();
  if (postamatClusterer) postamatClusterer.removeAll();
  console.log('[Log] [clearClusters] Кластеры очищены');
}

// Показать map-wrapper + инициализировать или установить центр
function showMapWrapper(city, cb) {
  mapWrapper().style.display = 'flex';
  mapContainer().style.display = 'block';

  if (mapInstance) {
    // Плавно изменяем центр (zoom=10)
    ymaps.ready(() => {
      ymaps.geocode(city).then(r => {
        const c = r.geoObjects.get(0).geometry.getCoordinates();
        console.log('[Log] [showMap] Панорамируем к:', c);
        mapInstance.setCenter(c, 10, { duration: 500 });
        cb && cb();
      });
    });
    return;
  }

  // Если ещё нет mapInstance — создаём новую карту
  ymaps.ready(() => {
    ymaps.geocode(city).then(r => {
      const c = r.geoObjects.get(0).geometry.getCoordinates();
      console.log('[Log] [showMap] Создаём карту с центром:', c);
      mapInstance = new ymaps.Map('map', {
        center: c,
        zoom: 10,
        controls: ['zoomControl']
      });
      console.log('[Log] [showMap] Инстанция карты создана');
      cb && cb();
    });
  });
}

function hideMapWrapper() {
  mapWrapper().style.display = 'none';
  if (mapContainer()) mapContainer().style.display = 'none';
  console.log('[Log] [hideMap] Блок карты скрыт');
}

function showElement(el) {
  if (!el) return;
  el.classList.add('visible');
}
function hideElement(el) {
  if (!el) return;
  el.classList.remove('visible');
}

function showTariffs() {
  tariffContainer.classList.add('visible');
}
function hideTariffs() {
  tariffContainer.classList.remove('visible');
  tariffContainer.innerHTML = '';
}

// Сброс «flow» выбора доставки (радиокнопки, карта, тарифы)
function resetDeliveryFlow() {
  hideElement(deliverySection());
  hideElement(streetWrapper());
  hideElement(infoPanel());
  hideMapWrapper();
  hideTariffs();
  clearClusters();
}

// Простейший debounce
function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}