/* === PREMIUM CART.JS - ОБНОВЛЕННАЯ ВЕРСИЯ С ЗАКАЗАМИ === */

/* === Цены и параметры === */
const prices = { camera: 7490, memory8gb: 0, memory64gb: 500 };
const CAMERA_WEIGHT_KG = 0.327;
const MEMORY_WEIGHT_KG = 0.008;
const CAMERA_DIMENSIONS = { length: 20, width: 12, height: 6 };
const MEMORY_DIMENSIONS = { length: 13, width: 8, height: 1 };
const FROM_LOCATION = 44; // код Москвы в CDEK

/* === Состояние === */
let counts = { camera: 0, memory8gb: 0, memory64gb: 0 };
let discount = 0;
let shipping = 0;

let cityCode = null;
let currentCity = '';
let cachedPreviews = {};
let selectedTariff = null;
let justSelectedCity = false;

/* === DOM-шорткаты === */
const totalEl = () => document.getElementById('cartTotalValue');
const shipEl = () => document.getElementById('shippingCostValue');
const deliveryInfoEl = () => document.getElementById('deliveryInfo');
const cityIn = () => document.getElementById('addressInput');
const citySug = () => {
  let portal = document.getElementById('citySuggestions');
  if (!portal) {
    portal = document.createElement('ul');
    portal.id = 'citySuggestions';
    portal.className = 'suggestions-portal';
    document.body.appendChild(portal);
  }
  return portal;
};
const deliverySection = () => document.getElementById('deliveryMethodSection');
const streetWrapper = () => document.getElementById('streetWrapper');
const streetIn = () => document.getElementById('streetInput');
const mapContainer = () => document.getElementById('map');
const infoPanel = () => document.getElementById('pvz-info-panel');
const mapWrapper = () => document.querySelector('.map-wrapper');
const tariffContainer = () => document.getElementById('tariffOptions');
const recNameIn = () => document.getElementById('recipientName');
const recPhoneIn = () => document.getElementById('recipientPhone');
const recEmailIn = () => document.getElementById('recipientEmail');
const cartItemsCount = () => document.getElementById('cartItemsCount');

/* === Переменные карты === */
let mapInstance = null, cityClusterer = null, postamatClusterer = null, streetMarker = null;

/* === Безопасная функция для установки центра карты === */

/* === Утилиты для производительности === */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/* === Обработка ошибок карты === */
function handleMapError(error, context = 'general') {
  console.error(`[Maps:${context}] Ошибка:`, error);
  
  const errorMessages = {
    'api': 'Ошибка загрузки API Яндекс.Карт',
    'geocoding': 'Ошибка поиска адреса',
    'pvz': 'Ошибка загрузки пунктов выдачи',
    'general': 'Ошибка работы с картой'
  };
  
  const message = errorMessages[context] || errorMessages.general;
  showNotification(`❌ ${message}`, 'error');
}




/* === Инициализация === */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Премиальная корзина загружается со стандартным поведением карты...');

  loadCart();
  updateUI();
  initCartControls();
  initCitySuggest();
  initDeliveryToggle();
  initStreetInput();
  hideTariffs();
  cachedPreviews = {};

  checkYandexMapsStatus();
  
  // Принудительно скрываем карту при загрузке
  const mapWrapper = document.querySelector('.map-wrapper');
  if (mapWrapper) {
    mapWrapper.style.display = 'none';
  }
  
  // Скрываем автоподсказки при изменении размера окна и скролле
  window.addEventListener('resize', () => {
    const portal = document.getElementById('citySuggestions');
    if (portal) portal.classList.remove('visible');
  });
  
  window.addEventListener('scroll', () => {
    const portal = document.getElementById('citySuggestions');
    if (portal) portal.classList.remove('visible');
  });
  
  // Скрываем автоподсказки при клике вне input поля
  document.addEventListener('click', (e) => {
    const portal = document.getElementById('citySuggestions');
    const input = cityIn();
    if (portal && input && !input.contains(e.target) && !portal.contains(e.target)) {
      portal.classList.remove('visible');
    }
  });

  console.log('✅ Премиальная корзина инициализирована');
});



/* === Проверка статуса Яндекс.Карт === */
function checkYandexMapsStatus() {
  if (typeof ymaps !== 'undefined') {
    console.log('[Maps] Яндекс.Карты уже загружены');
    return;
  }

  // Слушаем события загрузки
  window.addEventListener('yandexMapsLoaded', () => {
    console.log('[Maps] Получено событие загрузки Яндекс.Карт');
    
    const wrapper = mapWrapper();
    if (wrapper && wrapper.style.display === 'grid') {
      console.log('[Maps] Инициализируем карту после загрузки API');
      initializeMapForCurrentCity();
    }
  });
  
  window.addEventListener('yandexMapsError', () => {
    console.error('[Maps] Ошибка загрузки Яндекс.Карт');
    showMapError('Не удалось загрузить Карты');
  });

  // Fallback на случай если события не сработают
  let attempts = 0;
  const checkInterval = setInterval(() => {
    attempts++;
    if (typeof ymaps !== 'undefined') {
      console.log('[Maps] Яндекс.Карты загружены после', attempts, 'попыток (fallback)');
        clearInterval(checkInterval);

      const wrapper = mapWrapper();
      if (wrapper && wrapper.style.display === 'grid') {
        console.log('[Maps] Инициализируем карту после загрузки API (fallback)');
        initializeMapForCurrentCity();
      }
    } else if (attempts > 75) { // Увеличили время ожидания
      console.error('[Maps] Тайм-аут загрузки Яндекс.Карт (15 секунд)');
      clearInterval(checkInterval);
      showMapError('Тайм-аут загрузки карты');
    }
  }, 200);
}

/* === localStorage === */
function loadCart() {
  if (window.CartManager) {
    const data = window.CartManager.getCartData();
    counts.camera = data.cameraCount || 0;
    
    // Миграция старых данных: если есть старая память, переносим в 64GB
    if (data.memoryCount) {
      counts.memory64gb = data.memoryCount || 0;
      counts.memory8gb = 0; // 8GB всегда в комплекте с камерой
    } else {
      counts.memory8gb = 0;
      counts.memory64gb = 0;
    }

    // 8GB карта автоматически добавляется с камерой
    if (counts.camera > 0) {
      counts.memory8gb = counts.camera;
    }

    const cameraColor = data.cartColor || 'Чёрный';
    const colorEl = document.getElementById('cameraColor');
    if (colorEl) colorEl.textContent = cameraColor;
  }
}

function saveCart() {
  if (window.CartManager) {
    const currentData = window.CartManager.getCartData();
    // Сохраняем только 64GB память для совместимости со старой системой
    window.CartManager.saveCartData(counts.camera, counts.memory64gb, currentData.cartColor);
    window.CartManager.updateCartCounter();
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
  // Убрана анимация для оптимизации
}

/* === Обновление UI === */
function updateUI() {
  shipEl().textContent = shipping.toLocaleString('ru-RU');

  // Обновляем цены товаров
  const cameraUnitPrice = document.getElementById('cameraUnitPrice');
  const memory64gbUnitPrice = document.getElementById('memory64gbUnitPrice');
  if (cameraUnitPrice) cameraUnitPrice.textContent = prices.camera.toLocaleString('ru-RU');
  if (memory64gbUnitPrice) memory64gbUnitPrice.textContent = prices.memory64gb.toLocaleString('ru-RU');

  document.querySelectorAll('.quantity-value').forEach(el => {
    const id = el.dataset.id;
    if (id && counts[id] !== undefined) {
      el.textContent = counts[id];

      // Простое обновление без анимации
    }
  });

  document.querySelectorAll('.premium-cart-item').forEach(item => {
    const id = item.dataset.id;
    if (id && counts[id] !== undefined) {
      if (counts[id] > 0) {
        item.style.display = 'grid';
        // Убрана анимация для оптимизации
      } else {
        item.style.display = 'none';
      }
    }
  });

  let sum = counts.camera * prices.camera + counts.memory64gb * prices.memory64gb;

  document.getElementById('itemsSubtotal').textContent = sum.toLocaleString('ru-RU');

  const hasItems = sum > 0;
  const deliveryContainer = document.getElementById('deliverySectionContainer');
  const recipientContainer = document.getElementById('recipientSectionContainer');
  const summaryContainer = document.getElementById('orderSummaryContainer');
  const promoContainer = document.getElementById('promoSectionContainer');

  if (deliveryContainer) deliveryContainer.style.display = hasItems ? 'block' : 'none';
  if (recipientContainer) recipientContainer.style.display = hasItems ? 'block' : 'none';
  if (summaryContainer) summaryContainer.style.display = hasItems ? 'block' : 'none';
  if (promoContainer) promoContainer.style.display = hasItems ? 'block' : 'none';

  if (cartItemsCount()) {
    cartItemsCount().textContent = counts.camera + counts.memory64gb;
  }

  if (!hasItems) {
    showEmptyCartMessage();
    return;
  } else {
    hideEmptyCartMessage();
  }

  const discountRow = document.getElementById('discountRow');
  if (discount > 0) {
    const discountAmount = Math.round(sum * discount / 100);
    document.getElementById('discountAmount').textContent = discountAmount.toLocaleString('ru-RU');
    discountRow.style.display = 'flex';
    // Убрана анимация для оптимизации
  } else {
    discountRow.style.display = 'none';
  }

  sum -= Math.round(sum * discount / 100);
  sum += shipping;

  const totalElement = totalEl();
  if (totalElement) {
    // Убрана анимация для оптимизации
    totalElement.textContent = sum.toLocaleString('ru-RU');
  }

  // Обновляем сумму в hero секции
  const cartTotalShort = document.getElementById('cartTotalShort');
  if (cartTotalShort) {
    cartTotalShort.textContent = sum.toLocaleString('ru-RU');
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
      
      // Если добавляем камеру, автоматически добавляем 8GB карту
      if (btn.dataset.id === 'camera') {
        counts.memory8gb = counts.camera;
      }
      
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
        
        // Если убираем камеру, автоматически убираем 8GB карту
        if (btn.dataset.id === 'camera') {
          counts.memory8gb = counts.camera;
        }
        
        // Нельзя убрать 8GB карту отдельно
        if (btn.dataset.id === 'memory8gb') {
          counts.memory8gb = counts.camera; // Восстанавливаем количество
          showNotification('8ГБ карта входит в комплект камеры', 'info');
          return;
        }
        
        saveCart();
        updateUI();
        showNotification('Количество уменьшено', 'info');
      }
    });
  });

  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addPremiumButtonAnimation(btn);
      
      // Нельзя удалить 8GB карту отдельно
      if (btn.dataset.id === 'memory8gb') {
        showNotification('8ГБ карта входит в комплект камеры', 'info');
        return;
      }
      
      const itemName = btn.dataset.id === 'camera' ? 'камера' : 'карта памяти 64ГБ';
      showConfirm(
          'Удалить товар?',
          `Вы действительно хотите удалить ${itemName} из корзины?`,
          () => {
            counts[btn.dataset.id] = 0;
            
            // Если удаляем камеру, также удаляем 8GB карту
            if (btn.dataset.id === 'camera') {
              counts.memory8gb = 0;
            }
            
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
    // Убрана анимация для оптимизации
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
    const itemsSum = counts.camera * prices.camera + counts.memory64gb * prices.memory64gb;
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

    // Собираем данные доставки
    const deliveryData = {
      type: getDeliveryMethodText(selectedTariff.type),
      address: selectedTariff.address,
      tariff: selectedTariff.code,
      cost: shipping
    };

    // Собираем товары
    const items = [];
    if (counts.camera > 0) {
      items.push({
        name: `clip & go камера (${counts.camera} шт.)`,
        cost: counts.camera * prices.camera,
        quantity: counts.camera
      });
    }
    if (counts.memory8gb > 0) {
      items.push({
        name: `Карта памяти 8 ГБ (${counts.memory8gb} шт.) - В комплекте`,
        cost: 0, // Бесплатно, включено в стоимость камеры
        quantity: counts.memory8gb
      });
    }
    if (counts.memory64gb > 0) {
      items.push({
        name: `Карта памяти 64 ГБ (${counts.memory64gb} шт.)`,
        cost: counts.memory64gb * prices.memory64gb,
        quantity: counts.memory64gb
      });
    }

    // Создаем заказ ДО отправки на оплату
    const orderData = {
      id: `CG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cdekNumber: null, // будет установлен после создания в CDEK
      status: 'created',
      amount: amount,
      items: items,
      delivery: deliveryData,
      recipient: {
        name: name,
        phone: phone,
        email: recEmailIn().value.trim() || null
      },
      discount: discount > 0 ? { percent: discount, amount: Math.round(itemsSum * discount / 100) } : null,
      createdAt: new Date().toISOString()
    };

    // Сохраняем заказ в OrderManager
    if (window.OrderManager) {
      const savedOrder = window.OrderManager.addOrder(orderData);
      console.log('✅ Заказ сохранен в OrderManager:', savedOrder);
    } else {
      console.warn('⚠️ OrderManager не найден, сохраняем в localStorage');
      const orders = JSON.parse(localStorage.getItem('userOrders') || '[]');
      orders.unshift(orderData);
      localStorage.setItem('userOrders', JSON.stringify(orders));
    }

    // Сохраняем данные заказа для страницы результата
    localStorage.setItem('pendingOrderData', JSON.stringify(orderData));

    const cdekOrderData = buildCdekOrderRequest(amount);

    try {
      const resp = await fetch('/api/yookassa/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'RUB',
          description: `Заказ clip & go на сумму ${amount} ₽`,
          orderData: cdekOrderData,
          internalOrderId: orderData.id // передаем ID нашего заказа
        })
      });

      const payment = await resp.json();
      if (!resp.ok) throw new Error(payment.error || 'Ошибка создания платежа');

      console.log('✅ Платеж создан, переходим к оплате...');

      // Обновляем заказ с ID платежа
      if (window.OrderManager) {
        const orders = window.OrderManager.getOrders();
        const orderIndex = orders.findIndex(o => o.id === orderData.id);
        if (orderIndex !== -1) {
          orders[orderIndex].paymentId = payment.payment_id;
          localStorage.setItem('userOrders', JSON.stringify(orders));
        }
      }

      localStorage.setItem('currentPaymentId', payment.payment_id);
      localStorage.setItem('currentOrderId', orderData.id);

      updateLoaderText('Переходим к оплате...');

      setTimeout(() => {
        window.location.href = payment.confirmation_url;
      }, 1000);

    } catch (e) {
      console.error('❌ Ошибка создания платежа:', e);

      // Обновляем статус заказа на ошибку
      if (window.OrderManager) {
        window.OrderManager.updateOrderStatus(orderData.id, 'failed');
      }

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

/* === Управление отображением элементов === */
function showDeliveryOptions() {
  const deliveryCard = document.querySelector('.premium-delivery-card');
  if (deliveryCard) {
    deliveryCard.classList.add('city-selected');
    console.log('[UI] Показаны опции доставки');
  }
}

function hideDeliveryOptions() {
  const deliveryCard = document.querySelector('.premium-delivery-card');
  if (deliveryCard) {
    deliveryCard.classList.remove('city-selected', 'pvz-selected', 'courier-selected');
    console.log('[UI] Скрыты опции доставки');
  }
}

function showPvzElements() {
  const deliveryCard = document.querySelector('.premium-delivery-card');
  if (deliveryCard) {
    deliveryCard.classList.remove('courier-selected');
    deliveryCard.classList.add('pvz-selected');
    console.log('[UI] Показаны элементы ПВЗ');
  }
}

function showCourierElements() {
  const deliveryCard = document.querySelector('.premium-delivery-card');
  if (deliveryCard) {
    deliveryCard.classList.remove('pvz-selected');
    deliveryCard.classList.add('courier-selected');
    console.log('[UI] Показаны элементы курьерской доставки');
  }
}

function hidePvzElements() {
  const deliveryCard = document.querySelector('.premium-delivery-card');
  if (deliveryCard) {
    deliveryCard.classList.remove('pvz-selected');
    console.log('[UI] Скрыты элементы ПВЗ');
  }
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
    element.style.transition = 'box-shadow 0.3s ease';
    element.style.boxShadow = '0 0 20px rgba(28, 166, 248, 0.4)';
    setTimeout(() => {
      element.style.boxShadow = '';
    }, 2000);
  }
}

/* === Сбор тела запроса для CDEK === */
function buildCdekOrderRequest(amount) {
  const totalWeight = counts.camera * CAMERA_WEIGHT_KG + counts.memory8gb * MEMORY_WEIGHT_KG + counts.memory64gb * MEMORY_WEIGHT_KG;

  let packageDimensions;
  if (counts.camera > 0) {
    // Камера - основной габарит
    packageDimensions = CAMERA_DIMENSIONS;
  } else if (counts.memory64gb > 0 || counts.memory8gb > 0) {
    // Только карты памяти
    packageDimensions = MEMORY_DIMENSIONS;
  } else {
    // По умолчанию
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
  if (counts.memory8gb > 0) {
    items.push({
      name: `Карта памяти 8GB (${counts.memory8gb} шт.) - В комплекте`,
      ware_key: 'CLIPGO-MEM8',
      payment: { value: 0 }, // Включено в стоимость камеры
      cost: 0,
      weight: counts.memory8gb * MEMORY_WEIGHT_KG * 1000,
      amount: counts.memory8gb
    });
  }
  if (counts.memory64gb > 0) {
    items.push({
      name: `Карта памяти 64GB (${counts.memory64gb} шт.)`,
      ware_key: 'CLIPGO-MEM64',
      payment: { value: counts.memory64gb * prices.memory64gb },
      cost: counts.memory64gb * prices.memory64gb,
      weight: counts.memory64gb * MEMORY_WEIGHT_KG * 1000,
      amount: counts.memory64gb
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

/* === Утилиты для портала автоподсказок === */
let globalAnimationFrame = null;

function updatePortalPosition(portal, input) {
  if (!portal || !input) return;
  
  const rect = input.getBoundingClientRect();
  
  // Проверяем, что элемент видим на экране
  if (rect.width === 0 || rect.height === 0) return;
  
  // Рассчитываем позицию относительно viewport (для position: fixed)
  let left = rect.left;
  let top = rect.bottom + 2;
  let width = rect.width;
  
  // Проверяем границы экрана
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Корректируем горизонтальную позицию
  if (left + width > viewportWidth - 20) {
    left = viewportWidth - width - 20;
  }
  if (left < 10) {
    left = 10;
    width = Math.min(width, viewportWidth - 20);
  }
  
  // Корректируем вертикальную позицию (если не помещается снизу)
  const maxHeight = 200; // max-height из CSS
  if (top + maxHeight > viewportHeight - 20) {
    // Показываем сверху от input
    top = rect.top - maxHeight - 2;
    if (top < 10) {
      // Если и сверху не помещается, показываем сбоку
      top = rect.top;
    }
  }
  
  portal.style.setProperty('left', left + 'px', 'important');
  portal.style.setProperty('top', Math.max(10, top) + 'px', 'important');
  portal.style.setProperty('width', width + 'px', 'important');
}

function startTracking(portal, input) {
  if (globalAnimationFrame) {
    cancelAnimationFrame(globalAnimationFrame);
    globalAnimationFrame = null;
  }
  
  // РАДИКАЛЬНО ПЕРЕЗАПИСЫВАЕМ ВСЕ СТИЛИ
  portal.removeAttribute('class');
  portal.removeAttribute('style');
  
  // Устанавливаем каждый стиль отдельно для максимальной силы
  portal.style.setProperty('position', 'fixed', 'important');
  portal.style.setProperty('background', 'white', 'important');
  portal.style.setProperty('border', '1px solid rgba(0, 0, 0, 0.15)', 'important');
  portal.style.setProperty('border-radius', '12px', 'important');
  portal.style.setProperty('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.2)', 'important');
  portal.style.setProperty('z-index', '99999999', 'important');
  portal.style.setProperty('display', 'block', 'important');
  portal.style.setProperty('opacity', '1', 'important');
  portal.style.setProperty('visibility', 'visible', 'important');
  portal.style.setProperty('pointer-events', 'auto', 'important');
  portal.style.setProperty('list-style', 'none', 'important');
  portal.style.setProperty('margin', '0', 'important');
  portal.style.setProperty('padding', '0', 'important');
  portal.style.setProperty('max-height', '200px', 'important');
  portal.style.setProperty('overflow-y', 'auto', 'important');
  portal.style.setProperty('overflow-x', 'hidden', 'important');
  
  function trackPosition() {
    if (portal && 
        document.body.contains(portal) &&
        document.body.contains(input)) {
      
      // Обновляем позицию при каждом кадре
      updatePortalPosition(portal, input);
      globalAnimationFrame = requestAnimationFrame(trackPosition);
    } else {
      // Отладка - почему прекратилось отслеживание
      console.log('[DEBUG] Tracking stopped:', {
        portalExists: !!portal,
        portalInBody: portal ? document.body.contains(portal) : false,
        inputInBody: document.body.contains(input),
        hasVisibleClass: portal ? portal.classList.contains('visible') : false
      });
      globalAnimationFrame = null;
    }
  }
  
  // Восстанавливаем правильное позиционирование
  updatePortalPosition(portal, input);
  
  
  // Оставляем портал пустым - контент добавится в renderCitySuggestions
  
  // Запускаем отслеживание
  globalAnimationFrame = requestAnimationFrame(trackPosition);
}

function stopTracking() {
  if (globalAnimationFrame) {
    cancelAnimationFrame(globalAnimationFrame);
    globalAnimationFrame = null;
  }
}


/* === Яндекс-подсказки городов === */
function initCitySuggest() {
  console.log('[CitySuggest] Инициализация автоподсказок...');
  const cityInput = cityIn();
  
  if (!cityInput) {
    console.error('[CitySuggest] Элементы не найдены:', { cityInput });
    return;
  }
  
  console.log('[CitySuggest] Элементы найдены, добавляем обработчики');
  
  // Скрытие подсказок при клике вне
  document.addEventListener('click', (e) => {
    const portal = document.getElementById('citySuggestions');
    if (portal && !cityInput.contains(e.target) && !portal.contains(e.target)) {
      portal.style.display = 'none';
      portal.classList.remove('visible');
      stopTracking();
    }
  });
  
  cityInput.addEventListener('input', debounce(async e => {
    if (justSelectedCity) {
      justSelectedCity = false;
      return;
    }

    const q = e.target.value.trim();
    console.log('[CitySuggest] Ввод:', q);
    
    currentCity = '';
    cityCode = null;
    resetDeliveryFlow();

    const portal = citySug();
    portal.innerHTML = '';
    portal.classList.remove('visible');
    stopTracking();
    if (q.length < 2) {
      console.log('[CitySuggest] Запрос слишком короткий');
      return;
    }
    
    console.log('[CitySuggest] Запрос подсказок для:', q);

    try {
      const resp = await fetch(`/api/yandex/suggest?text=${encodeURIComponent(q)}`);
      if (!resp.ok) {
        throw new Error('API недоступен');
      }
      const j = await resp.json();
      renderCitySuggestions(j.results || []);
    } catch (e) {
      console.error('Ошибка получения подсказок городов:', e);
      // Показываем популярные города как fallback
      const mockCities = getMockCities(q);
      if (mockCities.length > 0) {
        renderCitySuggestions(mockCities);
      } else {
        showNotification('Введите название города', 'info');
      }
    }
  }, 300));
}

function getMockCities(query) {
  const cities = [
    { title: { text: 'Москва' }, subtitle: { text: 'Московская область' } },
    { title: { text: 'Санкт-Петербург' }, subtitle: { text: 'Ленинградская область' } },
    { title: { text: 'Новосибирск' }, subtitle: { text: 'Новосибирская область' } },
    { title: { text: 'Екатеринбург' }, subtitle: { text: 'Свердловская область' } },
    { title: { text: 'Казань' }, subtitle: { text: 'Татарстан' } },
    { title: { text: 'Нижний Новгород' }, subtitle: { text: 'Нижегородская область' } },
    { title: { text: 'Челябинск' }, subtitle: { text: 'Челябинская область' } },
    { title: { text: 'Самара' }, subtitle: { text: 'Самарская область' } },
    { title: { text: 'Омск' }, subtitle: { text: 'Омская область' } },
    { title: { text: 'Ростов-на-Дону' }, subtitle: { text: 'Ростовская область' } },
    { title: { text: 'Уфа' }, subtitle: { text: 'Башкортостан' } },
    { title: { text: 'Красноярск' }, subtitle: { text: 'Красноярский край' } },
    { title: { text: 'Воронеж' }, subtitle: { text: 'Воронежская область' } },
    { title: { text: 'Пермь' }, subtitle: { text: 'Пермский край' } },
    { title: { text: 'Волгоград' }, subtitle: { text: 'Волгоградская область' } }
  ];
  
  const lowerQuery = query.toLowerCase();
  return cities.filter(city => 
    city.title.text.toLowerCase().includes(lowerQuery)
  ).slice(0, 8);
}

function renderCitySuggestions(items) {
  // Получаем портал через унифицированную функцию
  const portal = citySug();
  

  portal.innerHTML = '';
  if (!items.length) {
    portal.classList.remove('visible');
    stopTracking();
    return;
  }

  // Позиционируем портал относительно input поля
  const input = cityIn();


  portal.innerHTML = '';
  
  items.forEach(it => {
    const txt = it.title.text + (it.subtitle ? ', ' + it.subtitle.text : '');
    const li = document.createElement('li');
    li.textContent = txt;
    li.style.cssText = 'padding: 12px 20px; color: #1f2937; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s ease; word-wrap: break-word; line-height: 1.4;';
    
    // Добавляем hover эффект
    li.addEventListener('mouseenter', () => {
      li.style.backgroundColor = '#f3f4f6';
    });
    li.addEventListener('mouseleave', () => {
      li.style.backgroundColor = 'transparent';
    });
    
    li.addEventListener('click', async () => {
      justSelectedCity = true;
      cityIn().value = txt;
      currentCity = txt;
      portal.innerHTML = '';
      portal.style.display = 'none';

      showNotification('🔍 Поиск кода города...', 'info');
      await fetchCdekCityCode(txt);

      if (cityCode) {
        showDeliveryOptions();
        showNotification('✅ Город найден! Выберите способ доставки', 'success');
      } else {
        hideDeliveryOptions();
        showNotification('❌ Город не найден в системе СДЭК', 'error');
      }
    });
    
    portal.append(li);
  });
  
  // Показываем портал и запускаем отслеживание
  portal.classList.add('visible');
  
  // Применяем такие же радикальные стили как в startTracking
  portal.style.setProperty('position', 'fixed', 'important');
  portal.style.setProperty('background', 'white', 'important');
  portal.style.setProperty('border', '1px solid rgba(0, 0, 0, 0.15)', 'important');
  portal.style.setProperty('border-radius', '12px', 'important');
  portal.style.setProperty('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.2)', 'important');
  portal.style.setProperty('z-index', '99999999', 'important');
  portal.style.setProperty('display', 'block', 'important');
  portal.style.setProperty('opacity', '1', 'important');
  portal.style.setProperty('visibility', 'visible', 'important');
  portal.style.setProperty('pointer-events', 'auto', 'important');
  portal.style.setProperty('list-style', 'none', 'important');
  portal.style.setProperty('margin', '0', 'important');
  portal.style.setProperty('padding', '0', 'important');
  portal.style.setProperty('max-height', '200px', 'important');
  portal.style.setProperty('overflow-y', 'auto', 'important');
  portal.style.setProperty('overflow-x', 'hidden', 'important');
  
  startTracking(portal, input);
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
  const debouncedGeocoding = debounce(async (addr) => {
    if (!addr || !mapInstance) return;

    try {
      const full = `${currentCity}, ${addr}`;
      showNotification('🔍 Поиск адреса...', 'info');
      
      const res = await ymaps.geocode(full, { results: 5 });
      const geoObjects = res.geoObjects;
      
      if (geoObjects.getLength() > 0) {
        const firstResult = geoObjects.get(0);
        const coords = firstResult.geometry.getCoordinates();
        const precision = firstResult.properties.get('metaDataProperty.GeocoderMetaData.precision');
        
        console.log('[Geocoding] Найден адрес:', {
          address: firstResult.getAddressLine(),
          precision: precision,
          coords: coords
        });
        
        // Плавно перемещаемся к найденному адресу
        mapInstance.panTo(coords, {
          flying: true,
          speed: 200,
          duration: 800
        }).then(() => {
          mapInstance.setZoom(15, {
            smooth: true,
            duration: 500
          });
        });

        // Удаляем старую метку и создаем новую
        if (streetMarker) {
          mapInstance.geoObjects.remove(streetMarker);
        }
        
        streetMarker = new ymaps.Placemark(coords, {
          balloonContent: `<div style="padding: 10px;"><strong>🏠 Адрес доставки</strong><br/>${firstResult.getAddressLine()}</div>`,
          hintContent: addr
        }, {
          preset: 'islands#redCircleIcon',
          iconColor: '#FF5733',
          iconCaptionMaxWidth: '200'
        });
        
        mapInstance.geoObjects.add(streetMarker);
        
        const precisionText = precision === 'exact' ? 'точно' : 'приблизительно';
        showNotification(`📍 Адрес найден ${precisionText}`, 'success');
      } else {
        showNotification('❌ Адрес не найден, попробуйте уточнить', 'warning');
      }
    } catch (e) {
      console.error('Ошибка геокодирования:', e);
      handleMapError(e, 'geocoding');
    }
  }, 500); // Debounce 500ms
  
  streetIn().addEventListener('input', (e) => {
    const addr = e.target.value.trim();
    debouncedGeocoding(addr);
  });
}

/* === Delivery toggle и показ карты === */
function initDeliveryToggle() {
  document.getElementById('deliveryCourier').addEventListener('change', () => {
    if (!cityCode) return;
    
    // Показываем элементы для курьерской доставки
    showCourierElements();
    
    // Очищаем предыдущие данные
    hideTariffs();
    selectedTariff = null;
    shipping = 0;
    deliveryInfoEl().textContent = '';
    updateUI();

    showNotification('🚛 Курьерская доставка выбрана', 'info');
    showCourierTariffs();
  });

  document.getElementById('deliveryPvz').addEventListener('change', () => {
    console.log('[UI] 📮 Выбрана доставка ПВЗ:', { 
      cityCode, 
      currentCity, 
      hasCityCode: !!cityCode,
      hasCurrentCity: !!currentCity 
    });
    
    if (!cityCode) {
      console.warn('[UI] ❌ Нет cityCode для загрузки ПВЗ');
      return;
    }
    
    // Показываем элементы для ПВЗ (карта, адрес)
    showPvzElements();
    
    // Очищаем предыдущие данные
    hideTariffs();
    selectedTariff = null;
    shipping = 0;
    deliveryInfoEl().textContent = '';
    updateUI();

    showNotification('📮 Загружаем пункты выдачи...', 'info');
    console.log('[UI] 🗺️ Вызываем showMapWrapper для ПВЗ...', {
      currentCity: currentCity,
      cityCode: cityCode,
      callbackName: 'fetchAndPlotPvz'
    });
    showMapWrapper(currentCity, () => {
      console.log('[Maps] 🎯 Callback анонимной функции вызван!');
      console.log('[Maps] 🔍 Состояние перед вызовом fetchAndPlotPvz:', {
        cityCode: cityCode,
        currentCity: currentCity,
        mapInstance: !!mapInstance
      });
      fetchAndPlotPvz();
    });
  });
}

/* === Показ тарифов для курьерской доставки === */
async function showCourierTariffs() {
  showNotification('⚡ Загружаем тарифы доставки...', 'info');
  await preloadTariffPreviews([137, 482]);
  renderTariffButtons('COURIER', 'Курьерская доставка', null);
}

/* === REFACTORED SHOWMAPWRAPPER FUNCTION === */
// ЗАМЕНА ДЛЯ функции showMapWrapper
function showMapWrapper(city, cb) {
  console.log('[Maps] 🗺️ showMapWrapper вызван (НОВАЯ ВЕРСИЯ):', { city, hasCallback: !!cb });
  
  const wrapper = mapWrapper();
  wrapper.style.display = 'flex';
  wrapper.classList.add('with-panel');
  mapContainer().style.display = 'block';

  // Если карта уже есть, просто центрируем и выполняем колбэк
  if (mapInstance) {
    ymaps.ready(() => {
        mapInstance.panTo([55.75, 37.62], 10, { flying: false }).then(() => {
            ymaps.geocode(city).then(res => {
                if (res.geoObjects.getLength() > 0) {
                    const coords = res.geoObjects.get(0).geometry.getCoordinates();
                    mapInstance.panTo(coords, 10, { flying: true, duration: 800 });
                }
                cb && cb();
            });
        });
    });
    return;
  }

  // Если карты нет, создаем ее
  ymaps.ready(() => {
    ymaps.geocode(city, { results: 1 }).then(res => {
      if (res.geoObjects.getLength() === 0) {
          console.error('[Maps] ❌ Не удалось найти координаты для города:', city);
          showMapError('Не удалось найти город на карте');
          return;
      }
      
      const coords = res.geoObjects.get(0).geometry.getCoordinates();
      
      mapInstance = new ymaps.Map('map', {
          center: coords,
          zoom: 10,
          controls: ['zoomControl', 'geolocationControl', 'fullscreenControl'],
          behaviors: ['default', 'scrollZoom'] // Стандартное поведение
      }, {
          minZoom: 5,
          maxZoom: 18,
          suppressMapOpenBlock: true
      });

      console.log('[Maps] ✅ Карта создана со стандартным поведением.');

      // Выполняем колбэк, если он есть
      cb && cb();

    }).catch(err => {
        console.error('[Maps] ❌ Ошибка геокодирования при создании карты:', err);
        showMapError('Ошибка поиска города');
    });
  });
}


function initializeMapForCurrentCity() {
  if (currentCity) {
    showMapWrapper(currentCity, () => {
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
  console.log('[Maps] Повторная попытка загрузки карты');
  
  // Clear mapInstance and reset map state
  mapInstance = null;
  cityClusterer = null;
  postamatClusterer = null;
  streetMarker = null;
  
  if (currentCity) {
    showMapWrapper(currentCity, fetchAndPlotPvz);
  }
}

function hideMapWrapper() {
  const wrapper = mapWrapper();
  wrapper.style.display = 'none';
  wrapper.classList.remove('with-panel');
  mapContainer().style.display = 'none';
}

/* === Fetch & plot PVZ + кэш тарифов === */
// ЗАМЕНА ДЛЯ функции fetchAndPlotPvz
async function fetchAndPlotPvz() {
    console.log('[PVZ] 🏗️ Загрузка ПВЗ (НОВАЯ ВЕРСИЯ)...');

    if (!cityCode || !mapInstance) {
        console.warn('[PVZ] ❌ Недостаточно данных для загрузки ПВЗ:', { cityCode, mapInstance: !!mapInstance });
        return;
    }

    // Очищаем старые метки и кластеры
    clearClusters();
    
    // Создаем кластеризаторы заново
    cityClusterer = new ymaps.Clusterer({
        preset: 'islands#invertedDarkBlueClusterIcons',
        gridSize: 80,
    });
    postamatClusterer = new ymaps.Clusterer({
        preset: 'islands#invertedLightBlueClusterIcons',
        gridSize: 80,
    });

    mapInstance.geoObjects.add(cityClusterer).add(postamatClusterer);
    console.log('[PVZ] ✅ Кластеризаторы созданы и добавлены на карту.');

    // --- НАЧАЛО: ЕДИНЫЙ ОБРАБОТЧИК КЛИКОВ (ДЕЛЕГИРОВАНИЕ) ---
    [cityClusterer, postamatClusterer].forEach(clusterer => {
        clusterer.events.add('click', (e) => {
            const target = e.get('target');
            // Проверяем, что клик был по метке, а не по иконке кластера
            if (target && target.options.get('preset')) {
                const placemark = target;
                const coords = placemark.geometry.getCoordinates();
                const data = placemark.properties.get('cdekData'); // <-- Получаем наши данные
                const type = (data.type || '').toUpperCase();
                
                console.log('[Maps] 🎯 Клик по метке:', data);

                mapInstance.panTo(coords, { flying: true, duration: 800 }).then(() => {
                    const currentZoom = mapInstance.getZoom();
                    if (currentZoom < 14) mapInstance.setZoom(14, { duration: 300 });
                });

                renderPvzInfoPanel(data, type, data.location);
                showNotification(`Выбран ${type === 'PVZ' ? 'пункт выдачи' : 'постамат'}`, 'success');
            }
        });
    });
    // --- КОНЕЦ: ЕДИНЫЙ ОБРАБОТЧИК КЛИКОВ ---

    try {
        showNotification('📮 Загружаем пункты выдачи...', 'info');
        const url = `/api/cdek/pvz?cityId=${encodeURIComponent(cityCode)}&type=ALL&size=1000`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        
        const all = await resp.json();
        if (all.length === 0) {
            showNotification('❌ Пункты выдачи не найдены', 'warning');
            return;
        }

        const placemarks = [];
        all.forEach(pt => {
            if (!pt.location?.latitude || !pt.location?.longitude) return;

            const type = (pt.type || '').toUpperCase();
            const coords = [parseFloat(pt.location.latitude), parseFloat(pt.location.longitude)];
            
            const pm = new ymaps.Placemark(coords, {
                // Сохраняем все данные о точке в свойствах метки
                cdekData: pt, 
                hintContent: `${type}: ${pt.location.address_full}`,
            }, {
                // Используем стандартные иконки, они надежнее
                preset: type === 'PVZ' ? 'islands#blueDotIconWithCaption' : 'islands#greenDotIconWithCaption'
            });
            placemarks.push(pm);
        });

        // Добавляем все метки в кластеры ОДНИМ действием для лучшей производительности
        const pvzPlacemarks = placemarks.filter(pm => pm.properties.get('cdekData').type === 'PVZ');
        const postamatPlacemarks = placemarks.filter(pm => pm.properties.get('cdekData').type !== 'PVZ');

        cityClusterer.add(pvzPlacemarks);
        postamatClusterer.add(postamatPlacemarks);
        
        console.log(`[PVZ] ✅ Загружено и добавлено ${placemarks.length} меток.`);
        showNotification(`✅ Загружено ${placemarks.length} пунктов выдачи`, 'success');

    } catch (error) {
        console.error('[PVZ] ❌ Ошибка загрузки ПВЗ:', error);
        handleMapError(error, 'pvz');
    }
}

function clearClusters() {
  if (cityClusterer) {
    mapInstance.geoObjects.remove(cityClusterer);
    cityClusterer.removeAll();
  }
  if (postamatClusterer) {
    mapInstance.geoObjects.remove(postamatClusterer);
    postamatClusterer.removeAll();
  }
  if (streetMarker) {
    mapInstance.geoObjects.remove(streetMarker);
    streetMarker = null;
  }
}

/* === Инфо-панель PVZ/Postamat === */
function renderPvzInfoPanel(pt, type, loc) {
  console.log('[PVZ] Отображение информации:', { type, address: loc.address_full, pt });
  
  // Попробуем несколько способов найти панель
  let panel = infoPanel();
  
  if (!panel) {
    panel = document.getElementById('pvz-info-panel');
  }
  
  if (!panel) {
    panel = document.querySelector('.premium-pvz-panel');
  }
  
  if (!panel) {
    console.error('[PVZ] Не удалось найти панель информации ПВЗ');
    showNotification('Ошибка: панель информации не найдена', 'error');
    return;
  }

  renderPvzInfoToElement(panel, pt, type, loc);
}

function renderPvzInfoToElement(panel, pt, type, loc) {
  console.log('[PVZ] Рендеринг в элемент:', { panel, type, address: loc.address_full });

  let html = `
    <div class="pvz-info-content">
      <div class="pvz-header">
        <h3 style="color: var(--premium-text-primary); margin: 0 0 15px 0; font-size: 1.2em;">
          <span style="margin-right: 8px;">${type === 'PVZ' ? '📮' : '📦'}</span>
          ${type === 'PVZ' ? 'Пункт выдачи' : 'Постамат'}
        </h3>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <span style="font-size: 1.1em; flex-shrink: 0;">📍</span>
          <div>
            <div style="font-weight: 600; color: var(--premium-text-primary); margin-bottom: 2px;">Адрес:</div>
            <div style="color: var(--premium-text-light); line-height: 1.4;">${loc.address_full || '—'}</div>
          </div>
        </div>
        
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <span style="font-size: 1.1em; flex-shrink: 0;">🕒</span>
          <div>
            <div style="font-weight: 600; color: var(--premium-text-primary); margin-bottom: 2px;">Время работы:</div>
            <div style="color: var(--premium-text-light);">${pt.work_time || 'Не указано'}</div>
          </div>
        </div>`;

  if (pt.note) {
    html += `
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <span style="font-size: 1.1em; flex-shrink: 0;">📝</span>
          <div>
            <div style="font-weight: 600; color: var(--premium-text-primary); margin-bottom: 2px;">Примечание:</div>
            <div style="color: var(--premium-text-light); line-height: 1.4;">${pt.note}</div>
          </div>
        </div>`;
  }

  // Добавляем фотографии если есть
  const imgs = (pt.office_image_list || []).slice(0, 3);
  if (imgs.length) {
    html += `
        <div style="margin-top: 15px;">
          <div style="font-weight: 600; color: var(--premium-text-primary); margin-bottom: 8px;">Фотографии:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">`;
    imgs.forEach(i => {
      html += `<img src="${i.url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" onerror="this.style.display='none'">`;
    });
    html += `
          </div>
        </div>`;
  }

  html += `
      </div>
      
      <button id="selectPvzBtn" class="premium-cta-button" style="width:100%; margin-top:20px;">
        <span class="btn-icon">✅</span>
        <span class="btn-text">Выбрать ${type === 'PVZ' ? 'пункт выдачи' : 'постамат'}</span>
      </button>
    </div>`;

  panel.innerHTML = html;
  panel.style.display = 'block';

  // Предзагружаем тарифы для выбранного типа ПВЗ
  preloadTariffPreviews(type === 'PVZ' ? [136, 483] : [368, 486]);

  const selectBtn = document.getElementById('selectPvzBtn');
  if (selectBtn) {
    // Удаляем старые обработчики чтобы избежать дублирования
    const newBtn = selectBtn.cloneNode(true);
    selectBtn.parentNode.replaceChild(newBtn, selectBtn);
    
    newBtn.addEventListener('click', () => {
      addPremiumButtonAnimation(newBtn);
      
      // Показываем тарифы с задержкой для лучшего UX
      setTimeout(() => {
        renderTariffButtons(type, loc.address_full || '—', pt.code);
        showNotification(`✅ ${type === 'PVZ' ? 'Пункт выдачи' : 'Постамат'} выбран`, 'success');
        
        // Плавно прокручиваем к тарифам
        const tariffContainer = document.getElementById('tariffOptions');
        if (tariffContainer) {
          tariffContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 200);
    });
  }
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

    const totalWeight = counts.camera * CAMERA_WEIGHT_KG + counts.memory8gb * MEMORY_WEIGHT_KG + counts.memory64gb * MEMORY_WEIGHT_KG;
    const dims = counts.camera > 0 ? CAMERA_DIMENSIONS : (counts.memory64gb > 0 || counts.memory8gb > 0) ? MEMORY_DIMENSIONS : { length: 10, width: 10, height: 10 };

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

  tariffContainer().innerHTML = html;
  showTariffs();

  // Анимация появления тарифов
  // Убрана анимация для оптимизации

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
        // Убрана анимация для оптимизации

        // Обновляем подсказку в зависимости от типа доставки
        updateDeliveryTip(markerType);

        showNotification(`✅ Тариф выбран! ${tariffName} • ${shipping.toLocaleString('ru-RU')} ₽`, 'success');

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
    // Убрана анимация для оптимизации
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
  // Удаляем предыдущее уведомление
  const existing = document.querySelector('.premium-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'premium-notification';

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

  notification.innerHTML = `
    <div class="notification-content" style="display: flex; align-items: center; gap: 15px;">
      <span class="notification-icon" style="font-size: 1.5em;">${icons[type] || icons.info}</span>
      <div>
        <div class="notification-title" style="font-weight: 800; margin-bottom: 4px; color: ${colors[type] || colors.info};">${message}</div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Анимация появления
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Автоматическое скрытие
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 600);
  }, duration);
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
  tariffContainer().classList.add('visible');
}

function hideTariffs() {
  tariffContainer().classList.remove('visible');
  tariffContainer().innerHTML = '';
}

function resetDeliveryFlow() {
  // Убираем все классы показа блоков доставки
  const deliveryContainer = document.querySelector('.premium-delivery-card');
  if (deliveryContainer) {
    deliveryContainer.classList.remove('city-selected');
    deliveryContainer.classList.remove('pvz-selected');
  }
  
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
// Экспортируем функции для отладки
window.fetchAndPlotPvz = fetchAndPlotPvz;
window.testPvzLoad = function() {
  console.log('[DEBUG] 🧪 Ручное тестирование загрузки ПВЗ');
  console.log('[DEBUG] Текущее состояние:', {
    cityCode: cityCode,
    currentCity: currentCity,
    mapInstance: !!mapInstance,
    clusterers: {
      cityClusterer: !!cityClusterer,
      postamatClusterer: !!postamatClusterer
    }
  });
  fetchAndPlotPvz();
};
window.debugMapState = function() {
  console.log('[DEBUG] 🗺️ Состояние карты:', {
    mapInstance: !!mapInstance,
    mapZoom: mapInstance ? mapInstance.getZoom() : 'N/A',
    mapCenter: mapInstance ? mapInstance.getCenter() : 'N/A',
    cityCode: cityCode,
    currentCity: currentCity,
    ymapsReady: typeof ymaps !== 'undefined'
  });
};

/* === Мониторинг состояния карты === */
function initMapStateMonitoring() {
  // Мониторим состояние карты каждые 5 секунд
  setInterval(() => {
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom();
      const currentCenter = mapInstance.getCenter();
      
      console.log('[Maps] Статус карты:', {
        zoom: currentZoom,
        center: currentCenter,
        clustersLoaded: !!(cityClusterer && postamatClusterer)
      });
    }
  }, 5000);
}

/* === Улучшенная система ошибок === */
function handleMapError(error, context = '') {
  console.error(`[Maps] Ошибка ${context}:`, error);
  
  const errorMessages = {
    'network': 'Проблемы с сетью. Проверьте интернет-соединение',
    'api': 'Ошибка API карт. Попробуйте перезагрузить страницу',
    'init': 'Ошибка инициализации карты',
    'geocoding': 'Ошибка поиска адреса',
    'pvz': 'Ошибка загрузки пунктов выдачи'
  };
  
  const message = errorMessages[context] || 'Неожиданная ошибка карты';
  showNotification(`❌ ${message}`, 'error');
}

// Запускаем мониторинг после инициализации
setTimeout(initMapStateMonitoring, 3000);

console.log('🎉 Премиальная корзина готова к использованию!');