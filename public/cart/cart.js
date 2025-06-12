/* === PREMIUM CART.JS - ПРЕМИАЛЬНАЯ ЛОГИКА КОРЗИНЫ === */

/* === Цены и параметры === */
const prices = { camera: 8900, memory: 500 };
const CAMERA_WEIGHT_KG = 0.327;
const MEMORY_WEIGHT_KG = 0.008;
const CAMERA_DIMENSIONS = { length: 20, width: 12, height: 6 };
const MEMORY_DIMENSIONS = { length: 13, width: 8, height: 1 };
const FROM_LOCATION = 44; // код Москвы в CDEK

/* === Состояние === */
let counts = { camera: 0, memory: 0 };
let discount = 0;
let shipping = 0;

let cityCode = null;
let currentCity = '';
let cachedPreviews = {};
let selectedTariff = null; // { code, type, pvzCode, address }
let justSelectedCity = false;

/* === DOM-шорткаты === */
const totalEl = () => document.getElementById('cartTotalValue');
const shipEl = () => document.getElementById('shippingCostValue');
const deliveryInfoEl = () => document.getElementById('deliveryInfo');
const cityIn = () => document.getElementById('addressInput');
const citySug = () => document.getElementById('citySuggestions');
const deliverySection = () => document.getElementById('deliveryMethodSection');
const streetWrapper = () => document.getElementById('streetWrapper');
const streetIn = () => document.getElementById('streetInput');
const mapContainer = () => document.getElementById('map');
const infoPanel = () => document.getElementById('pvz-info-panel');
const mapWrapper = () => document.querySelector('.map-wrapper');
const tariffContainer = document.getElementById('tariffOptions');
const recNameIn = () => document.getElementById('recipientName');
const recPhoneIn = () => document.getElementById('recipientPhone');
const recEmailIn = () => document.getElementById('recipientEmail');
const cartItemsCount = () => document.getElementById('cartItemsCount');

/* === Переменные карты === */
let mapInstance = null, cityClusterer = null, postamatClusterer = null, streetMarker = null;
let yandexMapsLoaded = false;

/* === Инициализация === */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Премиальная корзина загружается...');

  // Добавляем touchable классы
  addTouchableClasses();

  // Инициализируем все компоненты
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

  // Запускаем премиальные анимации
  setTimeout(() => {
    initPremiumAnimations();
  }, 500);

  console.log('✅ Премиальная корзина инициализирована');
});

/* === Добавление touchable классов === */
function addTouchableClasses() {
  const touchableElements = [
    '.cart-hero',
    '.cart-item',
    '.promo-card',
    '.delivery-card',
    '.recipient-card',
    '.summary-card',
    '.delivery-option',
    '.premium-btn',
    '.quantity-control',
    '.tariff-btn'
  ];

  touchableElements.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (!el.classList.contains('touchable')) {
        el.classList.add('touchable');
      }
    });
  });
}

/* === Премиальные анимации === */
function initPremiumAnimations() {
  // Анимация появления элементов с задержками
  const animatedElements = [
    { selector: '.cart-hero', delay: 0 },
    { selector: '.cart-item', delay: 100 },
    { selector: '.promo-card', delay: 200 },
    { selector: '.delivery-card', delay: 300 },
    { selector: '.recipient-card', delay: 400 },
    { selector: '.summary-card', delay: 500 }
  ];

  animatedElements.forEach(({ selector, delay }) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.style.animation = 'premiumSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both';
      }, delay + (index * 50));
    });
  });

  // Анимация счетчика товаров
  setTimeout(() => {
    animateCartItemsCounter();
  }, 1000);
}

function animateCartItemsCounter() {
  const counter = cartItemsCount();
  if (!counter) return;

  const targetCount = counts.camera + counts.memory;
  animateCounterPremium(counter, targetCount);
}

function animateCounterPremium(element, target) {
  if (!element) return;

  const start = parseInt(element.textContent) || 0;
  const duration = 1000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const current = Math.floor(start + (target - start) * easeOutCubic(progress));
    element.textContent = current;

    // Премиальный эффект во время анимации
    if (progress < 1) {
      const scale = 1 + Math.sin(progress * Math.PI) * 0.1;
      element.style.transform = `scale(${scale})`;
      element.style.filter = `brightness(${1 + Math.sin(progress * Math.PI) * 0.2})`;
      requestAnimationFrame(update);
    } else {
      element.style.transform = '';
      element.style.filter = '';
    }
  }

  requestAnimationFrame(update);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* === Проверка статуса Яндекс.Карт === */
function checkYandexMapsStatus() {
  if (typeof ymaps !== 'undefined') {
    console.log('[Maps] Яндекс.Карты уже загружены');
    yandexMapsLoaded = true;
    return;
  }

  let attempts = 0;
  const checkInterval = setInterval(() => {
    attempts++;
    if (typeof ymaps !== 'undefined') {
      console.log('[Maps] Яндекс.Карты загружены после', attempts, 'попыток');
      yandexMapsLoaded = true;
      clearInterval(checkInterval);

      if (mapWrapper().style.display === 'flex') {
        console.log('[Maps] Инициализируем карту после загрузки API');
        initializeMapForCurrentCity();
      }
    } else if (attempts > 50) {
      console.error('[Maps] Яндекс.Карты не загрузились за 10 секунд');
      clearInterval(checkInterval);
      showMapError();
    }
  }, 200);
}

/* === localStorage === */
function loadCart() {
  if (window.CartManager) {
    const data = window.CartManager.getCartData();
    counts.camera = data.cameraCount || 0;
    counts.memory = data.memoryCount || 0;

    const cameraColor = data.cartColor || 'Чёрный';
    const colorEl = document.getElementById('cameraColor');
    if (colorEl) colorEl.textContent = cameraColor;
  } else {
    const d = JSON.parse(localStorage.getItem('cartData') || '{}');
    counts.camera = d.cameraCount || 0;
    counts.memory = d.memoryCount || 0;

    const cameraColor = d.cartColor || 'Чёрный';
    const colorEl = document.getElementById('cameraColor');
    if (colorEl) colorEl.textContent = cameraColor;
  }
}

function saveCart() {
  if (window.CartManager) {
    const currentData = window.CartManager.getCartData();
    window.CartManager.saveCartData(counts.camera, counts.memory, currentData.cartColor);
  } else {
    const cartData = {
      cameraCount: counts.camera,
      memoryCount: counts.memory
    };
    localStorage.setItem('cartData', JSON.stringify(cartData));

    if (window.updateCartCounter) {
      window.updateCartCounter();
    }

    window.dispatchEvent(new CustomEvent('cartUpdated', {
      detail: cartData
    }));
  }
}

/* === Обновление подсказки доставки === */
function updateDeliveryTip(deliveryType) {
  const tipElement = document.getElementById('delivery-tip-text');
  if (!tipElement) return;

  let tipText = '';
  switch(deliveryType) {
    case 'COURIER':
      tipText = 'Курьер свяжется с получателем перед доставкой.';
      break;
    case 'PVZ':
      tipText = 'Вам придет SMS с кодом для получения посылки в пункте выдачи.';
      break;
    case 'POSTAMAT':
      tipText = 'Вам придет SMS с кодом для получения посылки из постамата.';
      break;
    default:
      tipText = 'Получатель будет уведомлен о доставке.';
  }

  tipElement.textContent = tipText;
  tipElement.style.animation = 'premiumSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
}

/* === Обновление UI === */
function updateUI() {
  shipEl().textContent = shipping.toLocaleString('ru-RU');

  // Обновляем количество в UI
  document.querySelectorAll('.quantity-value').forEach(el => {
    const id = el.dataset.id;
    if (id && counts[id] !== undefined) {
      el.textContent = counts[id];

      // Анимация изменения количества
      el.style.animation = 'premiumPopIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      setTimeout(() => {
        el.style.animation = '';
      }, 400);
    }
  });

  // Скрываем товары с нулевым количеством
  document.querySelectorAll('.cart-item').forEach(item => {
    const id = item.dataset.id;
    if (id && counts[id] !== undefined) {
      if (counts[id] > 0) {
        item.style.display = 'grid';
        item.style.animation = 'premiumSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      } else {
        item.style.display = 'none';
      }
    }
  });

  let sum = counts.camera * prices.camera + counts.memory * prices.memory;

  // Обновляем итоговые суммы
  document.getElementById('itemsSubtotal').textContent = sum.toLocaleString('ru-RU');

  // Показываем/скрываем блоки в зависимости от наличия товаров
  const hasItems = sum > 0;
  const deliveryContainer = document.getElementById('deliverySectionContainer');
  const recipientContainer = document.getElementById('recipientSectionContainer');
  const summaryContainer = document.getElementById('orderSummaryContainer');
  const promoContainer = document.getElementById('promoSectionContainer');

  if (deliveryContainer) deliveryContainer.style.display = hasItems ? 'block' : 'none';
  if (recipientContainer) recipientContainer.style.display = hasItems ? 'block' : 'none';
  if (summaryContainer) summaryContainer.style.display = hasItems ? 'block' : 'none';
  if (promoContainer) promoContainer.style.display = hasItems ? 'block' : 'none';

  // Обновляем счетчик товаров
  if (cartItemsCount()) {
    cartItemsCount().textContent = counts.camera + counts.memory;
  }

  if (!hasItems) {
    showEmptyCartMessage();
    return;
  } else {
    hideEmptyCartMessage();
  }

  // Показываем/скрываем скидку
  const discountRow = document.getElementById('discountRow');
  if (discount > 0) {
    const discountAmount = Math.round(sum * discount / 100);
    document.getElementById('discountAmount').textContent = discountAmount.toLocaleString('ru-RU');
    discountRow.style.display = 'flex';
    discountRow.style.animation = 'premiumSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  } else {
    discountRow.style.display = 'none';
  }

  sum -= Math.round(sum * discount / 100);
  sum += shipping;

  // Анимация обновления итоговой суммы
  const totalElement = totalEl();
  if (totalElement) {
    totalElement.style.animation = 'premiumPopIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    setTimeout(() => {
      totalElement.style.animation = '';
    }, 400);
    totalElement.textContent = sum.toLocaleString('ru-RU');
  }
}

/* === Сообщение о пустой корзине === */
function showEmptyCartMessage() {
  let emptyMessage = document.getElementById('emptyCartMessage');
  if (!emptyMessage) {
    console.error('Empty cart message element not found');
    return;
  }

  emptyMessage.style.display = 'block';
  emptyMessage.style.animation = 'premiumEmptyStateSlide 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
}

function hideEmptyCartMessage() {
  const emptyMessage = document.getElementById('emptyCartMessage');
  if (emptyMessage) {
    emptyMessage.style.display = 'none';
  }
}

/* === Контролы корзины + оплата === */
function initCartControls() {
  // Кнопки изменения количества
  document.querySelectorAll('.plus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addPremiumButtonAnimation(btn);
      counts[btn.dataset.id]++;
      saveCart();
      updateUI();
      showNotification('Товар добавлен!', 'success');
    });
  });

  document.querySelectorAll('.minus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addPremiumButtonAnimation(btn);
      if (counts[btn.dataset.id] > 0) {
        counts[btn.dataset.id]--;
        saveCart();
        updateUI();
        showNotification('Количество уменьшено', 'info');
      }
    });
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addPremiumButtonAnimation(btn);
      const itemName = btn.dataset.id === 'camera' ? 'камера' : 'карта памяти';
      showConfirm(
          'Удалить товар?',
          `Вы действительно хотите удалить ${itemName} из корзины?`,
          () => {
            counts[btn.dataset.id] = 0;
            saveCart();
            updateUI();
            showNotification('Товар удален из корзины', 'info');
          }
      );
    });
  });

  // Промокоды
  document.getElementById('applyPromoBtn').addEventListener('click', () => {
    const btn = document.getElementById('applyPromoBtn');
    addPremiumButtonAnimation(btn);

    const code = document.getElementById('promoInput').value.trim().toLowerCase();
    if (code === 'clipgo25') {
      discount = 7;
      showNotification('🎉 Промокод применен! Скидка 7%', 'success');
    } else if (code === 'clipgo222') {
      discount = 20;
      showNotification('🎉 Промокод применен! Скидка 20%', 'success');
    } else {
      showNotification('❌ Неверный промокод!', 'error');
      return;
    }

    const removeBtn = document.getElementById('removePromoBtn');
    removeBtn.style.display = 'inline-flex';
    removeBtn.style.animation = 'premiumSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    updateUI();
  });

  document.getElementById('removePromoBtn').addEventListener('click', () => {
    const btn = document.getElementById('removePromoBtn');
    addPremiumButtonAnimation(btn);

    discount = 0;
    document.getElementById('promoInput').value = '';
    btn.style.display = 'none';
    showNotification('Промокод удален', 'info');
    updateUI();
  });

  // Оформление заказа
  document.getElementById('checkoutBtn').addEventListener('click', async () => {
    const btn = document.getElementById('checkoutBtn');
    addPremiumButtonAnimation(btn);

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

    if (!isValidPhone(phone)) {
      showNotification('Введите корректный номер телефона', 'error');
      recPhoneIn().focus();
      return;
    }

    if (selectedTariff.type === 'COURIER' && !streetIn().value.trim()) {
      showNotification('Укажите адрес для курьерской доставки', 'error');
      scrollToElement(streetIn());
      return;
    }

    // Показываем премиальный лоадер
    showPremiumPaymentLoader();

    // Сохраняем данные доставки
    localStorage.setItem('lastShippingCost', shipping.toString());
    localStorage.setItem('lastDeliveryMethod', getDeliveryMethodText(selectedTariff.type));
    localStorage.setItem('lastDeliveryAddress', selectedTariff.address);

    const orderData = buildCdekOrderRequest(amount);

    try {
      const resp = await fetch('/api/yookassa/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'RUB',
          description: `Заказ clip & go на сумму ${amount} ₽`,
          orderData: orderData
        })
      });

      const payment = await resp.json();
      if (!resp.ok) throw new Error(payment.error || 'Ошибка создания платежа');

      console.log('Платеж создан, переходим к оплате...');

      localStorage.setItem('currentPaymentId', payment.payment_id);

      updateLoaderText('Переходим к оплате...');

      setTimeout(() => {
        window.location.href = payment.confirmation_url;
      }, 1000);

    } catch (e) {
      console.error('Ошибка создания платежа:', e);
      hidePremiumPaymentLoader();
      showNotification('Ошибка при создании платежа: ' + e.message, 'error');
    }
  });
}

/* === Премиальная анимация кнопок === */
function addPremiumButtonAnimation(button) {
  if (!button) return;

  button.style.animation = 'premiumHaptic 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  button.style.transform = 'scale(0.97) translateY(1px)';

  setTimeout(() => {
    button.style.animation = '';
    button.style.transform = '';
  }, 150);
}

/* === Вспомогательные функции === */
function isValidPhone(phone) {
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
  switch (type) {
    case 'COURIER': return 'Курьер СДЭК';
    case 'PVZ': return 'ПВЗ СДЭК';
    case 'POSTAMAT': return 'Постамат СДЭК';
    default: return 'СДЭК';
  }
}

function scrollToElement(element) {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Премиальная подсветка
    element.style.transition = 'box-shadow 0.3s ease';
    element.style.boxShadow = '0 0 20px rgba(28, 166, 248, 0.4)';
    setTimeout(() => {
      element.style.boxShadow = '';
    }, 2000);
  }
}

/* === Сбор тела запроса для CDEK === */
function buildCdekOrderRequest(amount) {
  const totalWeight = counts.camera * CAMERA_WEIGHT_KG + counts.memory * MEMORY_WEIGHT_KG;

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

  const items = [];
  if (counts.camera > 0) {
    items.push({
      name: `clip & go камера (${counts.camera} шт.)`,
      ware_key: 'CLIPGO-CAM',
      payment: { value: counts.camera * prices.camera },
      cost: counts.camera * prices.camera,
      weight: counts.camera * CAMERA_WEIGHT_KG * 1000,
      amount: counts.camera
    });
  }
  if (counts.memory > 0) {
    items.push({
      name: `Карта памяти 8GB (${counts.memory} шт.)`,
      ware_key: 'CLIPGO-MEM8',
      payment: { value: counts.memory * prices.memory },
      cost: counts.memory * prices.memory,
      weight: counts.memory * MEMORY_WEIGHT_KG * 1000,
      amount: counts.memory
    });
  }

  const packages = [{
    number: '1',
    weight: Math.ceil(totalWeight * 1000),
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

  const email = recEmailIn().value.trim();
  if (email) {
    recipient.email = email;
  }

  const orderData = {
    type: 1,
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

  if (selectedTariff.type === 'PVZ' || selectedTariff.type === 'POSTAMAT') {
    orderData.delivery_point = selectedTariff.pvzCode;
  } else {
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
  if (!items.length) {
    ul.classList.remove('visible');
    return;
  }

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

      showNotification('🔍 Поиск кода города...', 'info');
      await fetchCdekCityCode(txt);

      if (cityCode) {
        showElement(deliverySection());
        showNotification('✅ Город найден! Выберите способ доставки', 'success');
      } else {
        showNotification('❌ Город не найден в системе СДЭК', 'error');
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
        showNotification('📍 Адрес найден на карте', 'success');
      } else {
        showNotification('❌ Адрес не найден', 'warning');
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

    showNotification('🚛 Курьерская доставка выбрана', 'info');
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

    showNotification('📮 Загружаем пункты выдачи...', 'info');
    showMapWrapper(currentCity, fetchAndPlotPvz);
  });
}

/* === Показ тарифов для курьерской доставки === */
async function showCourierTariffs() {
  showNotification('⚡ Загружаем тарифы доставки...', 'info');
  await preloadTariffPreviews([137, 482]);
  renderTariffButtons('COURIER', 'Курьерская доставка', null);
}

function showMapWrapper(city, cb) {
  if (!yandexMapsLoaded) {
    console.log('[Maps] Яндекс.Карты еще не загружены, ждем...');
    showNotification('🗺️ Загружаем карту...', 'info');

    mapWrapper().style.display = 'grid';
    mapWrapper().classList.add('with-panel');
    mapContainer().innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; flex-direction: column; background: rgba(255,255,255,0.9); border-radius: 20px;">
                <div style="font-size: 3em; margin-bottom: 20px; animation: premiumFloat 3s ease-in-out infinite;">🗺️</div>
                <div style="font-size: 1.2em; font-weight: 600;">Загрузка карты...</div>
                <div style="font-size: 0.9em; color: #999; margin-top: 8px;">Подождите немного</div>
            </div>
        `;

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

  mapWrapper().style.display = 'grid';
  mapWrapper().classList.add('with-panel');
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
      const pvzRadio = document.getElementById('deliveryPvz');
      if (pvzRadio && pvzRadio.checked) {
        fetchAndPlotPvz();
      }
    });
  }
}

function showMapError(message = 'Ошибка загрузки карты') {
  mapContainer().innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #dc3545; flex-direction: column; background: rgba(255,255,255,0.9); border-radius: 20px;">
            <div style="font-size: 3em; margin-bottom: 20px;">❌</div>
            <div style="font-size: 1.2em; font-weight: 600; margin-bottom: 15px;">${message}</div>
            <button onclick="retryMapLoad()" class="premium-btn primary">
                <span>🔄</span>
                <span>Попробовать снова</span>
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
  mapWrapper().classList.remove('with-panel');
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
    showNotification('📮 Загружаем пункты выдачи...', 'info');

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
      showNotification('❌ Пункты выдачи не найдены в этом городе', 'warning');
      return;
    }

    let addedCount = 0;
    all.forEach(pt => {
      const loc = pt.location || {};
      if (!loc.latitude || !loc.longitude) return;

      const coords = [parseFloat(loc.latitude), parseFloat(loc.longitude)];
      const type = (pt.type || '').toUpperCase();
      const icon = type === 'PVZ' ? '/assets/icons/pvz.png' : '/assets/icons/postamat.png';

      const pm = new ymaps.Placemark(coords, {
        // Убираем balloonContent для чистоты карты
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

    showNotification(`✅ Загружено ${addedCount} пунктов выдачи`, 'success');

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
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">';
    imgs.forEach(i => html += `<img src="${i.url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" onerror="this.style.display='none'">`);
    html += '</div>';
  }

  html += `<h3>${type === 'PVZ' ? '📮 Пункт выдачи' : '📦 Постамат'}</h3>`;
  html += `<p><strong>📍 Адрес:</strong> ${loc.address_full || '—'}</p>`;
  html += `<p><strong>🕒 Время работы:</strong> ${pt.work_time || '—'}</p>`;

  if (pt.note) {
    html += `<p><strong>📝 Примечание:</strong> ${pt.note}</p>`;
  }

  html += `<button id="selectPvzBtn" class="premium-btn primary" style="width:100%;margin-top:16px;">
        <span>✅</span>
        <span>Выбрать пункт</span>
    </button>`;

  infoPanel().innerHTML = html;
  infoPanel().style.animation = 'premiumPanelSlide 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  // Предзагружаем тарифы для выбранного типа ПВЗ
  preloadTariffPreviews(type === 'PVZ' ? [136, 483] : [368, 486]);

  const selectBtn = document.getElementById('selectPvzBtn');
  selectBtn.addEventListener('click', () => {
    addPremiumButtonAnimation(selectBtn);
    renderTariffButtons(type, loc.address_full || '—', pt.code);
    showNotification(`✅ ${type === 'PVZ' ? 'Пункт выдачи' : 'Постамат'} выбран`, 'success');
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

    const totalWeight = counts.camera * CAMERA_WEIGHT_KG + counts.memory * MEMORY_WEIGHT_KG;
    const dims = counts.camera > 0 ? CAMERA_DIMENSIONS : counts.memory > 0 ? MEMORY_DIMENSIONS : { length: 10, width: 10, height: 10 };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fixedDate = tomorrow.toISOString().replace(/\.\d{3}Z$/, '+0300');

    const body = {
      date: fixedDate,
      type: 1,
      currency: 0,
      lang: 'rus',
      tariff_code: code,
      from_location: { code: FROM_LOCATION },
      to_location: { code: cityCode },
      packages: [{
        weight: Math.max(100, Number((totalWeight * 1000).toFixed(0))),
        ...dims
      }],
      additional_order_types: []
    };

    try {
      console.log('[Tariffs] Запрос тарифа', code, 'с телом:', body);
      const resp = await fetch('/api/cdek/calculator/tariff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const j = await resp.json();
      console.log('[Tariffs] Ответ для тарифа', code, ':', j);

      if (j.errors && j.errors.length > 0) {
        console.error('[Tariffs] Ошибки тарифа', code, ':', j.errors);
        cachedPreviews[code] = { deliverySum: 0, periodMin: 0, periodMax: 0, error: j.errors[0].message };
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
      cachedPreviews[code] = { deliverySum: 0, periodMin: 0, periodMax: 0, error: 'Ошибка сети' };
    }
  });

  await Promise.all(tariffPromises);
  console.log('[Tariffs] Завершена предзагрузка тарифов, кеш:', cachedPreviews);
}

/* === Рендер кнопок тарифов === */
function renderTariffButtons(markerType, address, pvzCode) {
  let arr;
  if (markerType === 'COURIER') {
    arr = [{ code: 137, name: 'Стандарт' }, { code: 482, name: 'Экспресс' }];
  } else if (markerType === 'PVZ') {
    arr = [{ code: 136, name: 'Стандарт' }, { code: 483, name: 'Экспресс' }];
  } else {
    arr = [{ code: 368, name: 'Стандарт' }, { code: 486, name: 'Экспресс' }];
  }

  let html = '<h3 style="margin-bottom:24px;font-size:1.4em;color:#1ca6f8;font-weight:800;">⚡ Выберите тариф доставки</h3>';

  html += '<div style="margin-bottom:24px;padding:16px;background:rgba(28, 166, 248, 0.1);border-radius:12px;font-size:0.9em;color:#0057c2;border:1px solid rgba(28, 166, 248, 0.2);">';
  html += '💡 <strong>Стандарт</strong> — экономичная доставка | <strong>Экспресс</strong> — быстрая доставка';
  html += '</div>';

  arr.forEach((t, index) => {
    let p = cachedPreviews[t.code] || { deliverySum: 0, periodMin: 0, periodMax: 0 };
    let cost = Math.ceil((p.deliverySum || p.totalSum || 0) / 10) * 10;

    if (cost === 0) {
      cost = t.name === 'Экспресс' ? 250 : 150;
      p = { ...p, periodMin: t.name === 'Экспресс' ? 1 : 2, periodMax: t.name === 'Экспресс' ? 2 : 3 };
    }

    const costStr = cost.toLocaleString('ru-RU') + ' ₽';
    const period = p.periodMin === p.periodMax ? `${p.periodMin} дн.` : `${p.periodMin}–${p.periodMax} дн.`;

    const isExpress = t.name === 'Экспресс';
    const icon = isExpress ? '⚡' : '📦';
    const description = isExpress ? 'Быстрая доставка' : 'Стандартная доставка';
    const isRecommended = !isExpress;

    html += `
            <button class="tariff-btn premium-btn" 
                    data-code="${t.code}" 
                    data-sum="${cost}" 
                    data-pvz="${pvzCode || ''}"
                    data-name="${t.name}"
                    data-address="${address}"
                    style="position:relative;width:100%;margin-bottom:16px;padding:24px;background:linear-gradient(135deg, #0057c2 0%, #1ca6f8 100%);color:#fff;border:none;border-radius:16px;cursor:pointer;transition:all 0.3s ease;display:flex;justify-content:space-between;align-items:center;box-shadow:0 8px 24px rgba(0, 0, 0, 0.12);">
                ${isRecommended ? '<div style="position:absolute;top:8px;left:16px;background:linear-gradient(135deg, #10b981 0%, #0ca572 100%);color:#fff;font-size:0.7em;padding:4px 10px;border-radius:6px;font-weight:700;box-shadow:0 2px 8px rgba(16, 185, 129, 0.3);">РЕКОМЕНДУЕМ</div>' : ''}
                <div style="display:flex;align-items:center;gap:16px;${isRecommended ? 'margin-top:8px;' : ''}">
                    <span style="font-size:2em;">${icon}</span>
                    <div style="text-align:left;">
                        <div style="font-size:1.3em;font-weight:800;">${t.name}</div>
                        <div style="font-size:0.95em;opacity:0.9;">${description}</div>
                    </div>
                </div>
                <div style="text-align:right;${isRecommended ? 'margin-top:8px;' : ''}">
                    <div style="font-size:1.3em;font-weight:800;color:#fff;">${costStr}</div>
                    <div style="font-size:0.95em;opacity:0.95;">${period}</div>
                </div>
            </button>
        `;
  });

  tariffContainer.innerHTML = html;
  showTariffs();

  // Анимация появления тарифов
  tariffContainer.style.animation = 'premiumSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  // Обработчики кликов с премиальными анимациями
  document.querySelectorAll('.tariff-btn').forEach((btn, index) => {
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'linear-gradient(135deg, #002a5c 0%, #0057c2 100%)';
      btn.style.transform = 'translateY(-4px)';
      btn.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.2)';
    });

    btn.addEventListener('mouseleave', () => {
      if (!btn.classList.contains('selected')) {
        btn.style.background = 'linear-gradient(135deg, #0057c2 0%, #1ca6f8 100%)';
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
      }
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();

      if (btn.classList.contains('tariff-loading')) return;

      // Убираем выделение с других кнопок
      document.querySelectorAll('.tariff-btn').forEach(b => {
        b.classList.remove('selected');
        b.style.background = 'linear-gradient(135deg, #0057c2 0%, #1ca6f8 100%)';
        b.style.transform = 'translateY(0)';
        b.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
      });

      // Премиальная анимация загрузки
      btn.classList.add('tariff-loading');
      btn.style.opacity = '0.7';
      btn.style.animation = 'premiumHaptic 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

      setTimeout(() => {
        btn.classList.remove('tariff-loading');
        btn.classList.add('selected');
        btn.style.opacity = '1';
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #0ca572 100%)';
        btn.style.transform = 'translateY(-4px)';
        btn.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.3)';
        btn.style.animation = '';

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

        deliveryInfoEl().innerHTML = `
                    <div style="display:flex;align-items:center;gap:12px;justify-content:center;">
                        <span style="font-size:1.2em;">✅</span>
                        <span><strong>${typeText} (${tariffName})</strong>: ${address}</span>
                    </div>
                    <div style="margin-top:8px;font-size:0.9em;opacity:0.9;">
                        Стоимость: <strong>${shipping.toLocaleString('ru-RU')} ₽</strong>
                    </div>
                `;
        deliveryInfoEl().style.animation = 'premiumSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

        // Обновляем подсказку в зависимости от типа доставки
        updateDeliveryTip(markerType);

        showNotification(`✅ Тариф выбран! ${tariffName} • ${shipping.toLocaleString('ru-RU')} ₽`, 'success');

        // Убираем автоскролл при выборе тарифа
        // setTimeout(() => {
        //     const recipientSection = document.getElementById('recipientSectionContainer');
        //     if (recipientSection) {
        //         recipientSection.scrollIntoView({
        //             behavior: 'smooth',
        //             block: 'start'
        //         });
        //     }
        // }, 300);

      }, 400);
    });
  });
}

/* === Премиальный лоадер оплаты === */
function showPremiumPaymentLoader() {
  const overlay = document.createElement('div');
  overlay.id = 'paymentLoader';
  overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 42, 92, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Inter', sans-serif;
        animation: premiumOverlaySlide 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;

  overlay.innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 50px 70px; border-radius: 24px; text-align: center; max-width: 450px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
            <div style="width: 80px; height: 80px; border: 4px solid #f3f3f3; border-top: 4px solid #1ca6f8; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 30px; box-shadow: 0 0 20px rgba(28, 166, 248, 0.3);"></div>
            <div style="font-size: 1.8em; margin-bottom: 20px;">🔒</div>
            <h3 style="margin-bottom: 20px; color: #1e2832; font-size: 1.4em; font-weight: 800;">Создаем платеж...</h3>
            <p id="loaderText" style="color: #6c8396; font-size: 1.1em; line-height: 1.6; font-weight: 500;">Подготавливаем данные для безопасной оплаты.<br>Пожалуйста, подождите...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes premiumOverlaySlide {
                from {
                    opacity: 0;
                    backdrop-filter: blur(0px);
                    -webkit-backdrop-filter: blur(0px);
                }
                to {
                    opacity: 1;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
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
    loaderText.style.animation = 'premiumSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  }
}

function hidePremiumPaymentLoader() {
  const loader = document.getElementById('paymentLoader');
  if (loader) {
    loader.style.animation = 'premiumFadeOut 0.3s ease';
    setTimeout(() => {
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
      document.body.style.overflow = '';
    }, 300);
  }
}

/* === Премиальная система уведомлений === */
function showNotification(message, type = 'info', duration = 4000) {
  const container = getNotificationContainer();
  const notification = document.createElement('div');

  const icons = {
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  };

  const colors = {
    success: '#10b981',
    info: '#1ca6f8',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  notification.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-left: 4px solid ${colors[type] || colors.info};
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        margin-bottom: 12px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        max-width: 380px;
        word-wrap: break-word;
        animation: premiumNotificationSlide 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;

  notification.innerHTML = `
        <span style="font-size: 1.2em; flex-shrink: 0;">${icons[type] || icons.info}</span>
        <span style="flex: 1; color: #1e2832; font-size: 0.95em; font-weight: 500; line-height: 1.4;">${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 1.3em; color: #9fb3c8; cursor: pointer; padding: 0; width: 24px; height: 24px; border-radius: 50%; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center;" onmouseenter="this.style.background='rgba(159, 179, 200, 0.1)'" onmouseleave="this.style.background='none'">&times;</button>
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
      }, 400);
    }
  }, duration);
}

function getNotificationContainer() {
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 9999;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;
    container.addEventListener('click', (e) => {
      e.target.style.pointerEvents = 'auto';
    });
    document.body.appendChild(container);
  }
  return container;
}

/* === Премиальный диалог подтверждения === */
function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-header">
                <h3>${escapeHtml(title)}</h3>
            </div>
            <div class="confirm-body">
                <p>${escapeHtml(message)}</p>
            </div>
            <div class="confirm-actions">
                <button class="confirm-btn cancel premium-btn secondary">Отмена</button>
                <button class="confirm-btn confirm premium-btn primary">Подтвердить</button>
            </div>
        </div>
    `;

  // Добавляем премиальные стили если их нет
  if (!document.getElementById('confirm-styles')) {
    const style = document.createElement('style');
    style.id = 'confirm-styles';
    style.textContent = `
            .confirm-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 42, 92, 0.8);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: premiumOverlaySlide 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            
            .confirm-dialog {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 24px;
                overflow: hidden;
                max-width: 450px;
                width: 90%;
                animation: premiumDialogBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .confirm-header {
                padding: 32px 32px 0;
            }
            
            .confirm-header h3 {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 800;
                color: #1e2832;
                letter-spacing: -0.01em;
            }
            
            .confirm-body {
                padding: 16px 32px 32px;
            }
            
            .confirm-body p {
                margin: 0;
                color: #6c8396;
                line-height: 1.6;
                font-size: 1.1rem;
                font-weight: 500;
            }
            
            .confirm-actions {
                display: flex;
                gap: 16px;
                padding: 0 32px 32px;
            }
            
            .confirm-btn {
                flex: 1;
                padding: 16px 24px;
                border: none;
                border-radius: 12px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                font-size: 0.95rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            @keyframes premiumDialogBounce {
                0% {
                    opacity: 0;
                    transform: scale(0.85) translateY(40px);
                    filter: blur(3px);
                }
                60% {
                    opacity: 1;
                    transform: scale(1.02) translateY(-8px);
                    filter: blur(0);
                }
                100% {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                    filter: blur(0);
                }
            }
            
            @keyframes premiumFadeOut {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-10px);
                }
            }
            
            @keyframes premiumHaptic {
                0% {
                    transform: scale(1);
                    filter: brightness(1);
                }
                50% {
                    transform: scale(1.02);
                    filter: brightness(1.1);
                }
                100% {
                    transform: scale(1);
                    filter: brightness(1);
                }
            }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);

  // Обработчики
  const cancelBtn = overlay.querySelector('.confirm-btn.cancel');
  const confirmBtn = overlay.querySelector('.confirm-btn.confirm');

  function closeDialog() {
    overlay.style.animation = 'premiumFadeOut 0.3s ease';
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }

  cancelBtn.addEventListener('click', () => {
    addPremiumButtonAnimation(cancelBtn);
    setTimeout(closeDialog, 150);
  });

  confirmBtn.addEventListener('click', () => {
    addPremiumButtonAnimation(confirmBtn);
    setTimeout(() => {
      onConfirm();
      closeDialog();
    }, 150);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeDialog();
    }
  });

  // Фокус на кнопке отмены
  cancelBtn.focus();
}

/* === Помощники === */
function showElement(el) {
  if (el) {
    el.classList.add('visible');
    el.style.animation = 'premiumSectionReveal 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  }
}

function hideElement(el) {
  if (el) el.classList.remove('visible');
}

function showTariffs() {
  tariffContainer.classList.add('visible');
}

function hideTariffs() {
  tariffContainer.classList.remove('visible');
  tariffContainer.innerHTML = '';
}

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
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* === Глобальные функции для доступа из HTML === */
window.retryMapLoad = retryMapLoad;
window.updateUI = updateUI;
window.showNotification = showNotification;

console.log('🎉 Премиальная корзина готова к использованию!');