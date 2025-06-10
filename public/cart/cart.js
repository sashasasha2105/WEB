/* File: public/cart/cart.js - ИСПРАВЛЕННАЯ ВЕРСИЯ */

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
let yandexMapsLoaded = false;

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

  // Проверяем загрузку Яндекс.Карт
  checkYandexMapsStatus();
});

/* === Проверка статуса Яндекс.Карт === */
function checkYandexMapsStatus() {
  if (typeof ymaps !== 'undefined') {
    console.log('[Maps] Яндекс.Карты уже загружены');
    yandexMapsLoaded = true;
    return;
  }

  // Ждем загрузки
  let attempts = 0;
  const checkInterval = setInterval(() => {
    attempts++;
    if (typeof ymaps !== 'undefined') {
      console.log('[Maps] Яндекс.Карты загружены после', attempts, 'попыток');
      yandexMapsLoaded = true;
      clearInterval(checkInterval);

      // Если карта уже должна быть показана, инициализируем её
      if (mapWrapper().style.display === 'flex') {
        console.log('[Maps] Инициализируем карту после загрузки API');
        initializeMapForCurrentCity();
      }
    } else if (attempts > 50) { // 10 секунд ожидания
      console.error('[Maps] Яндекс.Карты не загрузились за 10 секунд');
      clearInterval(checkInterval);
      showMapError();
    }
  }, 200);
}

/* === localStorage === */
function loadCart() {
  // Используем CartManager для получения данных
  if (window.CartManager) {
    const data = window.CartManager.getCartData();
    counts.camera = data.cameraCount || 0;
    counts.memory = data.memoryCount || 0;

    // Обновляем отображение цвета камеры
    const cameraColor = data.cartColor || 'Чёрный';
    const colorEl = document.getElementById('cameraColor');
    if (colorEl) colorEl.textContent = cameraColor;
  } else {
    // Fallback на старый способ
    const d = JSON.parse(localStorage.getItem('cartData') || '{}');
    counts.camera = d.cameraCount || 0;
    counts.memory = d.memoryCount || 0;

    const cameraColor = d.cartColor || 'Чёрный';
    const colorEl = document.getElementById('cameraColor');
    if (colorEl) colorEl.textContent = cameraColor;
  }
}

function saveCart() {
  // Используем CartManager для сохранения
  if (window.CartManager) {
    const currentData = window.CartManager.getCartData();
    window.CartManager.saveCartData(counts.camera, counts.memory, currentData.cartColor);
  } else {
    // Fallback на старый способ
    const cartData = {
      cameraCount: counts.camera,
      memoryCount: counts.memory
    };
    localStorage.setItem('cartData', JSON.stringify(cartData));

    // Принудительно обновляем счетчик на всех страницах
    if (window.updateCartCounter) {
      window.updateCartCounter();
    }

    // Диспатчим событие для обновления на других вкладках
    window.dispatchEvent(new CustomEvent('cartUpdated', {
      detail: cartData
    }));
  }
}

/* === Обновление UI === */
function updateUI() {
  shipEl().textContent = shipping.toLocaleString('ru-RU');

  // Обновляем количество в UI
  document.querySelectorAll('.quantity-value').forEach(el => {
    const id = el.dataset.id;
    if (id && counts[id] !== undefined) {
      el.textContent = counts[id];
    }
  });

  // Скрываем товары с нулевым количеством
  document.querySelectorAll('.cart-item').forEach(item => {
    const id = item.dataset.id;
    if (id && counts[id] !== undefined) {
      item.style.display = counts[id] > 0 ? 'flex' : 'none';
    }
  });

  let sum = counts.camera * prices.camera + counts.memory * prices.memory;

  // Показываем/скрываем блоки в зависимости от наличия товаров
  const hasItems = sum > 0;
  const deliverySection = document.querySelector('.delivery-section');
  const recipientSection = document.getElementById('recipientSection');
  const cartSummary = document.querySelector('.cart-summary');

  if (deliverySection) deliverySection.style.display = hasItems ? 'block' : 'none';
  if (recipientSection) recipientSection.style.display = hasItems ? 'block' : 'none';
  if (cartSummary) cartSummary.style.display = hasItems ? 'block' : 'none';

  if (!hasItems) {
    // Показываем сообщение о пустой корзине
    showEmptyCartMessage();
    return;
  } else {
    hideEmptyCartMessage();
  }

  sum -= Math.round(sum * discount / 100);
  sum += shipping;
  totalEl().textContent = sum.toLocaleString('ru-RU');
}

/* === Сообщение о пустой корзине === */
function showEmptyCartMessage() {
  let emptyMessage = document.getElementById('emptyCartMessage');
  if (!emptyMessage) {
    emptyMessage = document.createElement('div');
    emptyMessage.id = 'emptyCartMessage';
    emptyMessage.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #666;">
        <div style="font-size: 4em; margin-bottom: 20px;">🛒</div>
        <h2 style="margin-bottom: 15px; color: #333;">Ваша корзина пуста</h2>
        <p style="margin-bottom: 30px; font-size: 1.1em;">Добавьте товары, чтобы оформить заказ</p>
        <a href="/index.html" style="display: inline-block; padding: 12px 30px; background: #007BFF; color: white; text-decoration: none; border-radius: 25px; font-weight: 500; transition: all 0.3s ease;">
          Перейти к покупкам
        </a>
      </div>
    `;

    const main = document.querySelector('main');
    const firstChild = main.firstElementChild.nextElementSibling; // После h1
    main.insertBefore(emptyMessage, firstChild);
  }
  emptyMessage.style.display = 'block';
}

function hideEmptyCartMessage() {
  const emptyMessage = document.getElementById('emptyCartMessage');
  if (emptyMessage) {
    emptyMessage.style.display = 'none';
  }
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
    if (code === 'clipgo25') {
      discount = 7;
      showNotification('Промокод применен! Скидка 7%', 'success');
    } else if (code === 'clipgo222') {
      discount = 20;
      showNotification('Промокод применен! Скидка 20%', 'success');
    } else {
      showNotification('Неверный промокод!', 'error');
      return;
    }
    document.getElementById('removePromoBtn').style.display = 'inline-block';
    updateUI();
  });

  document.getElementById('removePromoBtn').addEventListener('click', () => {
    discount = 0;
    document.getElementById('promoInput').value = '';
    document.getElementById('removePromoBtn').style.display = 'none';
    showNotification('Промокод удален', 'info');
    updateUI();
  });

  document.getElementById('checkoutBtn').addEventListener('click', async () => {
    // Проверяем наличие товаров
    const itemsSum = counts.camera * prices.camera + counts.memory * prices.memory;
    if (itemsSum <= 0) {
      showNotification('Добавьте товары в корзину', 'error');
      return;
    }

    const discounted = itemsSum - Math.round(itemsSum * discount / 100);
    const amount = discounted + shipping;

    if (!selectedTariff) {
      showNotification('Выберите способ доставки', 'error');
      scrollToElement(deliverySection());
      return;
    }

    const name = recNameIn().value.trim();
    const phone = recPhoneIn().value.trim();

    if (!name || !phone) {
      showNotification('Заполните ФИО и телефон получателя', 'error');
      scrollToElement(recNameIn());
      return;
    }

    // Валидация телефона
    if (!isValidPhone(phone)) {
      showNotification('Введите корректный номер телефона', 'error');
      recPhoneIn().focus();
      return;
    }

    // Проверяем адрес для курьерской доставки
    if (selectedTariff.type === 'COURIER' && !streetIn().value.trim()) {
      showNotification('Укажите адрес для курьерской доставки', 'error');
      scrollToElement(streetIn());
      return;
    }

    // Показываем заглушку загрузки
    showPaymentLoader();

    // Сохраняем данные доставки для страницы результата
    localStorage.setItem('lastShippingCost', shipping.toString());
    localStorage.setItem('lastDeliveryMethod', getDeliveryMethodText(selectedTariff.type));
    localStorage.setItem('lastDeliveryAddress', selectedTariff.address);

    // Подготавливаем данные заказа для СДЭК
    const orderData = buildCdekOrderRequest(amount);

    try {
      // Создаем платеж и передаем данные заказа для обработки ПОСЛЕ оплаты
      const resp = await fetch('/api/yookassa/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'RUB',
          description: `Заказ clip & go на сумму ${amount} ₽`,
          orderData: orderData  // Передаем данные заказа для создания ПОСЛЕ оплаты
        })
      });

      const payment = await resp.json();
      if (!resp.ok) throw new Error(payment.error || 'Ошибка создания платежа');

      console.log('Платеж создан, переходим к оплате...');

      // Сохраняем ID платежа для отслеживания
      localStorage.setItem('currentPaymentId', payment.payment_id);

      // Показываем уведомление о переходе
      updateLoaderText('Переходим к оплате...');

      // Небольшая задержка для лучшего UX
      setTimeout(() => {
        window.location.href = payment.confirmation_url;
      }, 1000);

    } catch(e) {
      console.error('Ошибка создания платежа:', e);
      hidePaymentLoader();
      showNotification('Ошибка при создании платежа: ' + e.message, 'error');
    }
  });
}

/* === Вспомогательные функции === */
function isValidPhone(phone) {
  // Простая валидация российского номера
  const phoneRegex = /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

function getTariffName(code) {
  const tariffs = {
    137: 'Стандарт',
    482: 'Экспресс',
    136: 'Стандарт',
    483: 'Экспресс',
    368: 'Стандарт',
    486: 'Экспресс'
  };
  return tariffs[code] || 'Неизвестно';
}

function getDeliveryMethodText(type) {
  switch(type) {
    case 'COURIER': return 'Курьер СДЭК';
    case 'PVZ': return 'ПВЗ СДЭК';
    case 'POSTAMAT': return 'Постамат СДЭК';
    default: return 'СДЭК';
  }
}

function scrollToElement(element) {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Подсвечиваем элемент
    element.style.transition = 'box-shadow 0.3s ease';
    element.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.3)';
    setTimeout(() => {
      element.style.boxShadow = '';
    }, 2000);
  }
}

/* === Сбор тела запроса для CDEK === */
function buildCdekOrderRequest(amount) {
  const totalWeight = counts.camera * CAMERA_WEIGHT_KG + counts.memory * MEMORY_WEIGHT_KG;

  // Определяем габариты посылки
  let packageDimensions;
  if (counts.camera > 0 && counts.memory > 0) {
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
    } catch (e) {
      console.error('Ошибка получения подсказок городов:', e);
      showNotification('Ошибка поиска городов', 'error');
    }
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

      showNotification('Поиск кода города...', 'info');
      await fetchCdekCityCode(txt);

      if (cityCode) {
        showElement(deliverySection());
        showNotification('Город найден! Выберите способ доставки', 'success');
      } else {
        showNotification('Город не найден в системе СДЭК', 'error');
      }
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
    console.log('[CDEK] Код города:', cityCode, 'для', q);
  } catch (e) {
    console.error('Ошибка получения кода города:', e);
    cityCode = null;
  }
}

/* === Ввод улицы и карта === */
function initStreetInput() {
  streetIn().addEventListener('change', async () => {
    const addr = streetIn().value.trim();
    if (!addr || !yandexMapsLoaded || !mapInstance) return;

    try {
      const full = `${currentCity}, ${addr}`;
      const res = await ymaps.geocode(full);
      const firstResult = res.geoObjects.get(0);

      if (firstResult) {
        const coords = firstResult.geometry.getCoordinates();
        mapInstance.setCenter(coords, 14, { duration: 500 });

        if (streetMarker) mapInstance.geoObjects.remove(streetMarker);
        streetMarker = new ymaps.Placemark(coords,
            { balloonContent: `${full}` },
            { preset: 'islands#circleIcon', iconColor: '#FF5733' }
        );
        mapInstance.geoObjects.add(streetMarker);
        showNotification('Адрес найден на карте', 'success');
      } else {
        showNotification('Адрес не найден', 'warning');
      }
    } catch (e) {
      console.error('Ошибка геокодирования:', e);
      showNotification('Ошибка поиска адреса', 'error');
    }
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

    showNotification('Курьерская доставка выбрана', 'info');
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

    showNotification('Загружаем пункты выдачи...', 'info');
    showMapWrapper(currentCity, fetchAndPlotPvz);
  });
}

/* === Показ тарифов для курьерской доставки === */
async function showCourierTariffs() {
  showNotification('Загружаем тарифы доставки...', 'info');
  await preloadTariffPreviews([137, 482]); // Коды тарифов для курьера
  renderTariffButtons('COURIER', 'Курьерская доставка', null);
}

function showMapWrapper(city, cb) {
  if (!yandexMapsLoaded) {
    console.log('[Maps] Яндекс.Карты еще не загружены, ждем...');
    showNotification('Загружаем карту...', 'info');

    // Показываем карту, но без инициализации
    mapWrapper().style.display = 'flex';
    mapContainer().style.display = 'block';
    mapContainer().innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;"><div><div style="font-size: 2em; margin-bottom: 10px;">⏳</div>Загрузка карты...</div></div>';

    // Ждем загрузки API
    const waitForMaps = () => {
      if (yandexMapsLoaded) {
        initializeMapForCity(city, cb);
      } else {
        setTimeout(waitForMaps, 500);
      }
    };
    waitForMaps();
    return;
  }

  mapWrapper().style.display = 'flex';
  mapContainer().style.display = 'block';
  initializeMapForCity(city, cb);
}

function initializeMapForCity(city, callback) {
  if (!yandexMapsLoaded) {
    console.error('[Maps] Попытка инициализации карты без загруженного API');
    return;
  }

  ymaps.ready(() => {
    ymaps.geocode(city).then(r => {
      const firstResult = r.geoObjects.get(0);
      if (!firstResult) {
        showMapError('Город не найден на карте');
        return;
      }

      const coords = firstResult.geometry.getCoordinates();

      if (mapInstance) {
        mapInstance.setCenter(coords, 10, { duration: 500 });
      } else {
        mapInstance = new ymaps.Map('map', {
          center: coords,
          zoom: 10,
          controls: ['zoomControl', 'fullscreenControl']
        });
      }

      if (callback) callback();
    }).catch(err => {
      console.error('[Maps] Ошибка геокодирования:', err);
      showMapError('Ошибка загрузки карты');
    });
  });
}

function initializeMapForCurrentCity() {
  if (currentCity && yandexMapsLoaded) {
    initializeMapForCity(currentCity, () => {
      // Если была выбрана доставка в ПВЗ, загружаем точки
      const pvzRadio = document.getElementById('deliveryPvz');
      if (pvzRadio && pvzRadio.checked) {
        fetchAndPlotPvz();
      }
    });
  }
}

function showMapError(message = 'Ошибка загрузки карты') {
  mapContainer().innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #dc3545; flex-direction: column;">
      <div style="font-size: 2em; margin-bottom: 10px;">❌</div>
      <div>${message}</div>
      <button onclick="retryMapLoad()" style="margin-top: 15px; padding: 8px 16px; background: #007BFF; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Попробовать снова
      </button>
    </div>
  `;
}

function retryMapLoad() {
  checkYandexMapsStatus();
  if (currentCity) {
    showMapWrapper(currentCity, fetchAndPlotPvz);
  }
}

function hideMapWrapper() {
  mapWrapper().style.display = 'none';
  mapContainer().style.display = 'none';
}

/* === Fetch & plot PVZ + кэш тарифов === */
async function fetchAndPlotPvz() {
  if (!cityCode || !mapInstance || !yandexMapsLoaded) {
    console.log('[PVZ] Не все условия выполнены для загрузки ПВЗ:', { cityCode, mapInstance: !!mapInstance, yandexMapsLoaded });
    return;
  }

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
  clearClusters();

  try {
    showNotification('Загружаем пункты выдачи...', 'info');

    let page = 0, totalPages = 1, all = [];
    while (page < totalPages) {
      const url = `/api/cdek/pvz?cityId=${encodeURIComponent(cityCode)}&type=ALL&size=1000&page=${page}`;
      const resp = await fetch(url);

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const arr = await resp.json();
      all.push(...arr);
      totalPages = parseInt(resp.headers.get('x-total-pages') || '1', 10);
      page++;
    }

    if (all.length === 0) {
      showNotification('Пункты выдачи не найдены в этом городе', 'warning');
      return;
    }

    let addedCount = 0;
    all.forEach(pt => {
      const loc = pt.location || {};
      if (!loc.latitude || !loc.longitude) return;

      const coords = [parseFloat(loc.latitude), parseFloat(loc.longitude)];
      const type = (pt.type || '').toUpperCase();  // PVZ | POSTAMAT
      const icon = type === 'PVZ' ? '/assets/icons/pvz.png' : '/assets/icons/postamat.png';

      const pm = new ymaps.Placemark(coords, {
        balloonContent: `
          <div>
            <strong>${type === 'PVZ' ? 'Пункт выдачи' : 'Постамат'}</strong><br>
            <strong>Адрес:</strong> ${loc.address_full || 'Не указан'}<br>
            <strong>Время работы:</strong> ${pt.work_time || 'Не указано'}
          </div>
        `
      }, {
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
      addedCount++;
    });

    [cityClusterer, postamatClusterer].forEach(cl => cl.events.add('click', e => {
      const clus = e.get('target');
      mapInstance.setCenter(clus.geometry.getCoordinates(), mapInstance.getZoom() + 1, { duration: 500 });
    }));

    mapInstance.geoObjects.add(cityClusterer).add(postamatClusterer);

    showNotification(`Загружено ${addedCount} пунктов выдачи`, 'success');

  } catch (error) {
    console.error('[PVZ] Ошибка загрузки ПВЗ:', error);
    showNotification('Ошибка загрузки пунктов выдачи', 'error');
  }
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
    imgs.forEach(i => html += `<img src="${i.url}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;" onerror="this.style.display='none'">`);
    html += '</div>';
  }
  html += `<h3 style="margin-bottom:8px;color:#007BFF;">${type==='PVZ'?'Пункт выдачи':'Постамат'}</h3>`;
  html += `<p><strong>Адрес:</strong> ${loc.address_full||'—'}</p>`;
  html += `<p><strong>Время работы:</strong> ${pt.work_time||'—'}</p>`;

  if (pt.note) {
    html += `<p><strong>Примечание:</strong> ${pt.note}</p>`;
  }

  html += `<button id="selectPvzBtn" style="width:100%;margin-top:12px;padding:12px 0;background:#28a745;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:500;transition:background 0.3s ease;">Выбрать пункт</button>`;

  infoPanel().innerHTML = html;
  mapWrapper().classList.add('with-panel');
  showElement(infoPanel());

  // Предзагружаем тарифы для выбранного типа ПВЗ
  preloadTariffPreviews(type==='PVZ'?[136,483]:[368,486]);

  const selectBtn = document.getElementById('selectPvzBtn');
  selectBtn.addEventListener('click', () => {
    renderTariffButtons(type, loc.address_full || '—', pt.code);
    showNotification(`${type === 'PVZ' ? 'Пункт выдачи' : 'Постамат'} выбран`, 'success');
  });

  selectBtn.addEventListener('mouseenter', () => {
    selectBtn.style.background = '#218838';
  });

  selectBtn.addEventListener('mouseleave', () => {
    selectBtn.style.background = '#28a745';
  });
}

/* === Кэш тарифов === */
async function preloadTariffPreviews(codes) {
  if (!cityCode) return;

  console.log('[Tariffs] Предзагрузка тарифов для кодов:', codes, 'город:', cityCode);

  const tariffPromises = codes.map(async code => {
    if (cachedPreviews[code]) {
      console.log('[Tariffs] Тариф', code, 'уже в кеше:', cachedPreviews[code]);
      return;
    }

    const totalWeight = counts.camera*CAMERA_WEIGHT_KG + counts.memory*MEMORY_WEIGHT_KG;
    const dims = counts.camera>0?CAMERA_DIMENSIONS:counts.memory>0?MEMORY_DIMENSIONS:{length:10,width:10,height:10};

    // Фиксируем дату на завтра для стабильности расчетов
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fixedDate = tomorrow.toISOString().replace(/\.\d{3}Z$/, '+0300');

    const body = {
      date: fixedDate,
      type: 1,
      currency: 0,
      lang: 'rus',
      tariff_code: code,
      from_location: {code: FROM_LOCATION},
      to_location: {code: cityCode},
      packages: [{
        weight: Math.max(100, Number((totalWeight * 1000).toFixed(0))), // минимум 100г
        ...dims
      }],
      additional_order_types: []
    };

    try {
      console.log('[Tariffs] Запрос тарифа', code, 'с телом:', body);
      const resp = await fetch('/api/cdek/calculator/tariff', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      });

      const j = await resp.json();
      console.log('[Tariffs] Ответ для тарифа', code, ':', j);

      if (j.errors && j.errors.length > 0) {
        console.error('[Tariffs] Ошибки тарифа', code, ':', j.errors);
        cachedPreviews[code] = {deliverySum: 0, periodMin: 0, periodMax: 0, error: j.errors[0].message};
      } else {
        cachedPreviews[code] = {
          deliverySum: j.delivery_sum || j.total_sum || 0,
          periodMin: j.period_min || 0,
          periodMax: j.period_max || 0,
          totalSum: j.total_sum || 0,
          cached: true
        };
      }
    } catch (err) {
      console.error('[Tariffs] Ошибка запроса тарифа', code, ':', err);
      cachedPreviews[code] = {deliverySum: 0, periodMin: 0, periodMax: 0, error: 'Ошибка сети'};
    }
  });

  await Promise.all(tariffPromises);
  console.log('[Tariffs] Завершена предзагрузка тарифов, кеш:', cachedPreviews);
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

  let html = '<h3 style="margin-bottom:20px;font-size:1.3em;color:#007BFF;">Выберите тариф доставки:</h3>';

  // Добавляем пояснительный текст
  html += '<div style="margin-bottom:20px;padding:12px;background:#e6f7ff;border-radius:6px;font-size:0.9em;color:#005bb5;">';
  html += '💡 <strong>Стандарт</strong> — экономичная доставка | <strong>Экспресс</strong> — быстрая доставка';
  html += '</div>';

  arr.forEach((t, index) => {
    const cacheKey = `${t.code}_${cityCode}`;
    let p = cachedPreviews[t.code] || {deliverySum:0,periodMin:0,periodMax:0};

    // Стабилизируем цену - округляем до 10 рублей
    let cost = Math.ceil((p.deliverySum || p.totalSum || 0) / 10) * 10;

    // Если цена нулевая, устанавливаем минимальные значения
    if (cost === 0) {
      cost = t.name === 'Экспресс' ? 250 : 150;
      p = { ...p, periodMin: t.name === 'Экспресс' ? 1 : 2, periodMax: t.name === 'Экспресс' ? 2 : 3 };
    }

    const costStr = cost.toLocaleString('ru-RU') + ' ₽';
    const period = p.periodMin === p.periodMax ? `${p.periodMin} дн.` : `${p.periodMin}–${p.periodMax} дн.`;

    // Определяем иконку и описание
    const isExpress = t.name === 'Экспресс';
    const icon = isExpress ? '⚡' : '📦';
    const description = isExpress ? 'Быстрая доставка' : 'Стандартная доставка';
    const additionalClass = isExpress ? 'tariff-express' : 'tariff-standard';

    // Определяем рекомендацию
    const isRecommended = !isExpress; // стандарт рекомендуем по умолчанию

    html += `
      <button class="tariff-btn ${additionalClass}" 
              data-code="${t.code}" 
              data-sum="${cost}" 
              data-pvz="${pvzCode||''}"
              data-name="${t.name}"
              data-address="${address}"
              id="tariff-${t.code}"
              style="position:relative;width:100%;margin-bottom:16px;padding:20px;background:#007BFF;color:#fff;border:none;border-radius:8px;cursor:pointer;transition:all 0.3s ease;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:1.8em;">${icon}</span>
          <div style="text-align:left;">
            <div style="font-size:1.2em;font-weight:700;">${t.name}</div>
            <div style="font-size:0.9em;opacity:0.9;">${description}</div>
          </div>
        </div>
        <div class="tariff-details" style="text-align:right;">
          <div style="font-size:1.2em;font-weight:700;color:#fff;">${costStr}</div>
          <div style="font-size:0.9em;opacity:0.95;">${period}</div>
        </div>
        ${isRecommended ? '<div style="position:absolute;top:8px;right:12px;background:#28a745;color:#fff;font-size:0.7em;padding:3px 8px;border-radius:4px;font-weight:600;">РЕКОМЕНДУЕМ</div>' : ''}
      </button>
    `;
  });

  tariffContainer.innerHTML = html;
  showTariffs();

  // Обработчики кликов с анимацией
  document.querySelectorAll('.tariff-btn').forEach((btn, index) => {
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#005bb5';
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 5px 15px rgba(0,91,181,0.3)';
    });

    btn.addEventListener('mouseleave', () => {
      if (!btn.classList.contains('selected')) {
        btn.style.background = '#007BFF';
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'none';
      }
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();

      // Предотвращаем повторные клики
      if (btn.classList.contains('tariff-loading')) return;

      // Убираем выделение с других кнопок
      document.querySelectorAll('.tariff-btn').forEach(b => {
        b.classList.remove('selected');
        b.style.background = '#007BFF';
        b.style.transform = 'translateY(0)';
        b.style.boxShadow = 'none';
      });

      // Добавляем анимацию загрузки
      btn.classList.add('tariff-loading');
      btn.style.opacity = '0.7';

      // Через небольшую задержку добавляем выделение
      setTimeout(() => {
        btn.classList.remove('tariff-loading');
        btn.classList.add('selected');
        btn.style.opacity = '1';
        btn.style.background = '#28a745';
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 5px 15px rgba(40,167,69,0.3)';

        // Обновляем выбранный тариф
        selectedTariff = {
          code: Number(btn.dataset.code),
          type: markerType,
          pvzCode: btn.dataset.pvz || null,
          address: btn.dataset.address
        };

        shipping = Number(btn.dataset.sum);
        updateUI();

        const typeText = markerType === 'COURIER' ? 'Курьер' :
            markerType === 'PVZ' ? 'ПВЗ' : 'Постамат';
        const tariffName = btn.dataset.name;

        deliveryInfoEl().textContent =
            `✅ Выбран ${typeText} (${tariffName}): ${address}. Стоимость ${shipping.toLocaleString('ru-RU')} ₽`;

        // Показываем уведомление
        showTariffNotification(tariffName, shipping);

        // Прокручиваем к итоговой сумме
        setTimeout(() => {
          document.querySelector('.cart-summary').scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);

      }, 400);
    });
  });
}

/* === Уведомление о выборе тарифа === */
function showTariffNotification(tariffName, cost) {
  showNotification(`Тариф выбран! ${tariffName} • ${cost.toLocaleString('ru-RU')} ₽`, 'success');
}

/* === Заглушка загрузки при оплате === */
function showPaymentLoader() {
  const overlay = document.createElement('div');
  overlay.id = 'paymentLoader';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-family: 'Montserrat', sans-serif;
  `;

  overlay.innerHTML = `
    <div style="background: #fff; padding: 40px 60px; border-radius: 12px; text-align: center; max-width: 400px;">
      <div style="width: 60px; height: 60px; border: 4px solid #f3f3f3; border-top: 4px solid #007BFF; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
      <h3 style="margin-bottom: 15px; color: #333; font-size: 1.3em;">Создаем платеж...</h3>
      <p id="loaderText" style="color: #666; font-size: 1em; line-height: 1.4;">Подготавливаем данные для оплаты.<br>Пожалуйста, подождите...</p>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

function updateLoaderText(text) {
  const loaderText = document.getElementById('loaderText');
  if (loaderText) {
    loaderText.innerHTML = text;
  }
}

function hidePaymentLoader() {
  const loader = document.getElementById('paymentLoader');
  if (loader) {
    loader.remove();
    document.body.style.overflow = '';
  }
}

/* === Система уведомлений === */
function showNotification(message, type = 'info', duration = 4000) {
  const container = document.getElementById('notificationContainer') || createNotificationContainer();
  const notification = document.createElement('div');

  const icons = {
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  };

  const colors = {
    success: '#28a745',
    info: '#007BFF',
    warning: '#ffc107',
    error: '#dc3545'
  };

  notification.style.cssText = `
    background: white;
    border-left: 4px solid ${colors[type] || colors.info};
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    margin-bottom: 10px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    max-width: 350px;
    word-wrap: break-word;
  `;

  notification.innerHTML = `
    <span style="font-size: 1.1em;">${icons[type] || icons.info}</span>
    <span style="flex: 1; color: #333; font-size: 0.9em;">${message}</span>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 1.2em; color: #999; cursor: pointer; padding: 0; width: 20px; height: 20px;">&times;</button>
  `;

  container.appendChild(notification);

  // Анимация появления
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Автоматическое удаление
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, duration);
}

function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notificationContainer';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    pointer-events: none;
  `;
  container.style.pointerEvents = 'none';
  container.addEventListener('click', (e) => {
    e.target.style.pointerEvents = 'auto';
  });
  document.body.appendChild(container);
  return container;
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
  deliveryInfoEl().textContent = '';
  updateUI();
}

function debounce(fn, ms = 300) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* === Глобальные функции для доступа из HTML === */
window.retryMapLoad = retryMapLoad;
window.updateUI = updateUI;