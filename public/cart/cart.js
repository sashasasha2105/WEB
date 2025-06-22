/* === PREMIUM CART.JS - НОВАЯ АРХИТЕКТУРА С МАССИВОМ ОБЪЕКТОВ === */

/* === Цены и параметры === */
const prices = { camera: 7499, memory_upgrade_64gb: 500 };
const CAMERA_WEIGHT_KG = 0.327;
const MEMORY_WEIGHT_KG = 0.008;
const CAMERA_DIMENSIONS = { length: 20, width: 12, height: 6 };
const MEMORY_DIMENSIONS = { length: 13, width: 8, height: 1 };
const FROM_LOCATION = 44; // код Москвы в CDEK

/* === НОВОЕ СОСТОЯНИЕ - МАССИВ ОБЪЕКТОВ === */
let cartItems = []; // Массив камер с их конфигурациями
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

/* === ГЛАВНАЯ ФУНКЦИЯ РЕНДЕРА КОРЗИНЫ === */
function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  if (!container) return;

  // Очищаем контейнер
  container.innerHTML = '';

  // Если корзина пуста, показываем пустое состояние
  if (cartItems.length === 0) {
    showEmptyCartMessage();
    updateCartCounters();
    updateCartSections();
    return;
  }

  hideEmptyCartMessage();

  // Рендерим каждую позицию в корзине
  cartItems.forEach(item => {
    const itemHTML = createCartItemHTML(item);
    container.insertAdjacentHTML('beforeend', itemHTML);
  });

  // Инициализируем обработчики событий для новых элементов
  initCartItemControls();
  
  // Обновляем счетчики и секции
  updateCartCounters();
  updateCartSections();
}

/* === СОЗДАНИЕ HTML КАРТОЧКИ ТОВАРА === */
function createCartItemHTML(item) {
    // Определяем, какая опция активна
    const is8gbActive = item.memory === '8gb';
    const is64gbActive = item.memory === '64gb';

    return `
        <div class="cart-item glass" data-unique-id="${item.uniqueId}">
            <div class="item-image">
                <img src="/assets/images/cam3.jpg" alt="clip & go" />
            </div>

            <div class="item-main-content">
                <div class="item-info">
                    <h3>clip & go камера</h3>
                    <div class="item-details">
                        <span class="item-detail">🎨 Цвет: Чёрный</span>
                        <span class="item-detail">💰 Цена: ${item.price.toLocaleString('ru-RU')} ₽</span>
                    </div>
                </div>

                <div class="item-configurator">
                    <div class="config-header">
                        <span class="config-icon">💾</span>
                        <span>Комплектация</span>
                    </div>
                    <div class="config-choices">
                        <button class="memory-option ${is8gbActive ? 'active' : ''}" data-memory="8gb" data-item-id="${item.uniqueId}">
                            <img src="/assets/images/8gb.svg" alt="8 ГБ" class="memory-image">
                            <div class="memory-details">
                                <span class="memory-size">8 ГБ</span>
                                <span class="memory-price">В комплекте</span>
                            </div>
                            <div class="checkmark-icon">✓</div>
                        </button>
                        <button class="memory-option ${is64gbActive ? 'active' : ''}" data-memory="64gb" data-item-id="${item.uniqueId}">
                            <img src="/assets/images/64gb.svg" alt="64 ГБ" class="memory-image">
                            <div class="memory-details">
                                <span class="memory-size">64 ГБ</span>
                                <span class="memory-price">+ ${prices.memory_upgrade_64gb} ₽</span>
                            </div>
                            <div class="checkmark-icon">✓</div>
                        </button>
                    </div>
                </div>
            </div>

            <div class="item-controls">
                <button class="remove-item-btn premium-btn secondary" data-item-id="${item.uniqueId}">
                    Удалить
                </button>
            </div>
        </div>
    `;
}

/* === ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ ДЛЯ ЭЛЕМЕНТОВ КОРЗИНЫ === */
function initCartItemControls() {
  // Обработчики выбора опций памяти
  document.querySelectorAll('.memory-option').forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      handleMemoryOptionChange(option);
    });
  });

  // Обработчики удаления позиций
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleItemRemove(btn.dataset.itemId);
    });
  });
}

/* === ОБРАБОТЧИК ИЗМЕНЕНИЯ ОПЦИИ ПАМЯТИ === */
function handleMemoryOptionChange(optionElement) {
  const itemId = optionElement.dataset.itemId;
  const selectedMemory = optionElement.dataset.memory;
  
  // Находим позицию в массиве
  const itemIndex = cartItems.findIndex(item => item.uniqueId == itemId);
  if (itemIndex === -1) return;

  // Обновляем конфигурацию
  cartItems[itemIndex].memory = selectedMemory;
  cartItems[itemIndex].price = calculateItemPrice(selectedMemory);

  // Добавляем анимацию
  addPremiumButtonAnimation(optionElement);
  
  // Показываем уведомление
  const memoryText = selectedMemory === '8gb' ? '8 ГБ (в комплекте)' : `64 ГБ (+${prices.memory_upgrade_64gb} ₽)`;
  showNotification(`Выбрана карта памяти ${memoryText}`, 'success');

  // Сохраняем и перерисовываем
  saveCart();
  renderCart();
}

/* === ОБРАБОТЧИК УДАЛЕНИЯ ПОЗИЦИИ === */
function handleItemRemove(itemId) {
  showConfirm(
    'Удалить камеру?',
    'Вы действительно хотите удалить эту камеру из корзины?',
    () => {
      // Удаляем позицию из массива
      cartItems = cartItems.filter(item => item.uniqueId != itemId);
      
      // Сохраняем и перерисовываем
      saveCart();
      renderCart();
      
      showNotification('Камера удалена из корзины', 'info');
    }
  );
}


/* === РАСЧЕТ ЦЕНЫ ПОЗИЦИИ === */
function calculateItemPrice(memoryOption) {
  const basePrice = prices.camera;
  const memoryUpgrade = memoryOption === '64gb' ? prices.memory_upgrade_64gb : 0;
  return basePrice + memoryUpgrade;
}

/* === ДОБАВЛЕНИЕ КАМЕРЫ В КОРЗИНУ === */
function addCameraToCart(memoryOption = '8gb') {
  const newItem = {
    uniqueId: Date.now() + Math.random(), // Уникальный ID
    memory: memoryOption,                  // Комплектация памяти
    price: calculateItemPrice(memoryOption) // Рассчитанная цена с учетом комплектации
  };

  cartItems.push(newItem);
  
  // Сохраняем и перерисовываем
  saveCart();
  renderCart();
  
  showNotification(`Камера с ${memoryOption === '64gb' ? '64 ГБ' : '8 ГБ'} добавлена в корзину!`, 'success');
}

// Делаем функцию глобальной для доступа из главного меню
window.addCameraToCart = addCameraToCart;

/* === ВЫБОР КОМПЛЕКТАЦИИ И ДОБАВЛЕНИЕ КАМЕРЫ === */
function showAddCameraDialog() {
  showConfirm(
    'Выберите комплектацию',
    'Какую камеру вы хотите добавить в корзину?',
    () => addCameraToCart('8gb'), // При подтверждении добавляем 8GB версию
    () => addCameraToCart('64gb'), // При отмене добавляем 64GB версию
    '8 ГБ (7 499 ₽)',
    '64 ГБ (7 999 ₽)'
  );
}

/* === РАСЧЕТ ОБЩЕЙ СУММЫ КОРЗИНЫ === */
function calculateCartTotal() {
  return cartItems.reduce((total, item) => total + item.price, 0);
}

/* === ОБНОВЛЕНИЕ СЧЕТЧИКОВ И СТАТИСТИКИ === */
function updateCartCounters() {
  // Считаем только камеры (не SD-карты)
  const cameraCount = cartItems.length;
  const totalSum = calculateCartTotal();

  // Обновляем счетчик товаров в hero
  const itemCountEl = cartItemsCount();
  if (itemCountEl) {
    animateCounterChange(itemCountEl, cameraCount);
  }

  // Обновляем сумму в hero
  const cartTotalDisplay = document.getElementById('cartTotalDisplay');
  if (cartTotalDisplay) {
    const finalSum = totalSum - Math.round(totalSum * discount / 100) + shipping;
    cartTotalDisplay.textContent = finalSum.toLocaleString('ru-RU') + ' ₽';
  }

  // Обновляем промежуточный итог
  const itemsSubtotal = document.getElementById('itemsSubtotal');
  if (itemsSubtotal) {
    itemsSubtotal.textContent = totalSum.toLocaleString('ru-RU');
  }

  // Обновляем итоговую сумму
  updateFinalTotal();
}

/* === ОБНОВЛЕНИЕ ИТОГОВОЙ СУММЫ === */
function updateFinalTotal() {
  const totalSum = calculateCartTotal();
  const discountAmount = Math.round(totalSum * discount / 100);
  const finalSum = totalSum - discountAmount + shipping;

  // Обновляем отображение скидки
  const discountRow = document.getElementById('discountRow');
  if (discount > 0) {
    document.getElementById('discountAmount').textContent = discountAmount.toLocaleString('ru-RU');
    discountRow.style.display = 'flex';
  } else {
    discountRow.style.display = 'none';
  }

  // Обновляем итоговую сумму
  const totalElement = totalEl();
  if (totalElement) {
    animateCounterChange(totalElement, finalSum, true);
  }

  // Обновляем стоимость доставки
  if (shipEl()) {
    shipEl().textContent = shipping.toLocaleString('ru-RU');
  }
}

/* === УПРАВЛЕНИЕ ВИДИМОСТЬЮ СЕКЦИЙ === */
function updateCartSections() {
  const hasItems = cartItems.length > 0;
  
  const sections = [
    'deliverySectionContainer',
    'recipientSectionContainer', 
    'orderSummaryContainer',
    'promoSectionContainer'
  ];

  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      if (hasItems) {
        section.style.display = 'block';
        section.classList.add('premium-slide-up');
      } else {
        section.style.display = 'none';
      }
    }
  });
}

/* === СООБЩЕНИЯ О ПУСТОЙ КОРЗИНЕ === */
function showEmptyCartMessage() {
  const emptyMessage = document.getElementById('emptyCartMessage');
  if (emptyMessage) {
    emptyMessage.style.display = 'block';
  }
}

function hideEmptyCartMessage() {
  const emptyMessage = document.getElementById('emptyCartMessage');
  if (emptyMessage) {
    emptyMessage.style.display = 'none';
  }
}

/* === СОХРАНЕНИЕ И ЗАГРУЗКА КОРЗИНЫ === */
function saveCart() {
  if (window.CartManager) {
    const currentData = window.CartManager.getCartData();
    const extendedData = {
      ...currentData,
      cartItems: cartItems,
      // Сохраняем для совместимости
      cameraCount: cartItems.length,
      selectedMemoryOption: cartItems.length > 0 ? cartItems[0].memory : '8gb'
    };
    localStorage.setItem('cartData', JSON.stringify(extendedData));
  }
}

function loadCart() {
  if (window.CartManager) {
    const data = window.CartManager.getCartData();
    
    // Загружаем новую структуру данных
    if (data && Array.isArray(data)) {
      cartItems = data;
    } else {
      cartItems = [];
    }

    // ПРОВЕРЯЕМ ДОБАВЛЕНИЕ ТОВАРА ИЗ ГЛАВНОЙ СТРАНИЦЫ
    const itemToAddData = localStorage.getItem('itemToAdd');
    if (itemToAddData) {
      try {
        const itemToAdd = JSON.parse(itemToAddData);
        console.log('[Cart] Найден товар для добавления:', itemToAdd);
        
        // Добавляем камеру с выбранной конфигурацией
        const newItem = {
          uniqueId: Date.now() + Math.random(),
          memory: itemToAdd.memory || '8gb',
          price: calculateItemPrice(itemToAdd.memory || '8gb')
        };
        
        cartItems.push(newItem);
        
        // Сохраняем обновленную корзину
        saveCart();
        
        // Удаляем itemToAdd из localStorage
        localStorage.removeItem('itemToAdd');
        
        console.log('[Cart] Камера добавлена в корзину:', newItem);
      } catch (error) {
        console.error('[Cart] Ошибка добавления товара:', error);
        localStorage.removeItem('itemToAdd');
      }
    }
  }
}

/* === ИНИЦИАЛИЗАЦИЯ === */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Премиальная корзина (новая архитектура) загружается...');

  try {
    addTouchableClasses();
    loadCart();
    renderCart(); // ГЛАВНЫЙ ВЫЗОВ РЕНДЕРА
    initMainControls();
    initCitySuggest();
    initDeliveryToggle();
    initStreetInput();
    initBackButton();
    hideTariffs();

    checkYandexMapsStatus();

    setTimeout(() => {
      initPremiumAnimations();
    }, 500);

    console.log('✅ Премиальная корзина инициализирована');
  } catch (error) {
    console.error('❌ Ошибка инициализации корзины:', error);
  }
});

/* === ИНИЦИАЛИЗАЦИЯ ОСНОВНЫХ КОНТРОЛОВ === */
function initMainControls() {
  // Промокоды
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener('click', () => {
      addPremiumButtonAnimation(applyPromoBtn);
      handlePromoCode();
    });
  }

  const removePromoBtn = document.getElementById('removePromoBtn');
  if (removePromoBtn) {
    removePromoBtn.addEventListener('click', () => {
      addPremiumButtonAnimation(removePromoBtn);
      removePromoCode();
    });
  }

  // Оформление заказа
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      addPremiumButtonAnimation(checkoutBtn);
      handleCheckout();
    });
  }
}

/* === ОБРАБОТКА ПРОМОКОДОВ === */
function handlePromoCode() {
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
  if (removeBtn) {
    removeBtn.style.display = 'inline-flex';
  }
  
  updateFinalTotal();
}

function removePromoCode() {
  discount = 0;
  document.getElementById('promoInput').value = '';
  
  const removeBtn = document.getElementById('removePromoBtn');
  if (removeBtn) {
    removeBtn.style.display = 'none';
  }
  
  showNotification('Промокод удален', 'info');
  updateFinalTotal();
}

/* === ОБРАБОТКА ОФОРМЛЕНИЯ ЗАКАЗА === */
async function handleCheckout() {
  // Проверяем наличие товаров
  const totalSum = calculateCartTotal();
  if (totalSum <= 0) {
    showNotification('Добавьте товары в корзину', 'error');
    return;
  }

  const discounted = totalSum - Math.round(totalSum * discount / 100);
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

  // Показываем лоадер
  showPremiumPaymentLoader();

  // Собираем данные заказа
  const orderData = {
    id: `CG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: 'created',
    amount: amount,
    items: cartItems.map(item => ({
      name: `clip & go камера с картой ${item.memory === '8gb' ? '8 ГБ' : '64 ГБ'}`,
      cost: item.price,
      quantity: 1,
      configuration: {
        memory: item.memory
      }
    })),
    delivery: {
      type: getDeliveryMethodText(selectedTariff.type),
      address: selectedTariff.address,
      tariff: selectedTariff.code,
      cost: shipping
    },
    recipient: {
      name: name,
      phone: phone,
      email: recEmailIn().value.trim() || null
    },
    discount: discount > 0 ? { percent: discount, amount: Math.round(totalSum * discount / 100) } : null,
    createdAt: new Date().toISOString()
  };

  // Сохраняем заказ
  if (window.OrderManager) {
    window.OrderManager.addOrder(orderData);
  }

  localStorage.setItem('pendingOrderData', JSON.stringify(orderData));

  try {
    const resp = await fetch('/api/yookassa/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'RUB',
        description: `Заказ clip & go на сумму ${amount} ₽`,
        internalOrderId: orderData.id
      })
    });

    const payment = await resp.json();
    if (!resp.ok) throw new Error(payment.error || 'Ошибка создания платежа');

    updateLoaderText('Переходим к оплате...');
    
    setTimeout(() => {
      window.location.href = payment.confirmation_url;
    }, 1000);

  } catch (e) {
    console.error('❌ Ошибка создания платежа:', e);
    hidePremiumPaymentLoader();
    showNotification('Ошибка при создании платежа: ' + e.message, 'error');
  }
}

/* === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ === */

// Добавление touchable классов
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
    '.memory-option',
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

// Анимация счетчиков
function animateCounterChange(element, newValue, isPrice = false) {
  if (!element) return;

  const currentValue = isPrice ? 
    parseFloat(element.textContent.replace(/[^\d]/g, '')) || 0 :
    parseInt(element.textContent) || 0;

  if (currentValue === newValue) return;

  const duration = 600;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const current = Math.floor(currentValue + (newValue - currentValue) * easeOutCubic(progress));
    
    if (isPrice) {
      element.textContent = current.toLocaleString('ru-RU');
    } else {
      element.textContent = current;
    }

    if (progress < 1) {
      const pulse = 1 + Math.sin(progress * Math.PI * 2) * 0.05;
      element.style.transform = `scale(${pulse})`;
      requestAnimationFrame(update);
    } else {
      element.style.transform = '';
    }
  }

  requestAnimationFrame(update);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Премиальная анимация кнопок
function addPremiumButtonAnimation(button) {
  if (!button) return;
  
  button.style.animation = 'premiumHaptic 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  button.style.transform = 'scale(0.97) translateY(1px)';

  setTimeout(() => {
    button.style.animation = '';
    button.style.transform = '';
  }, 150);
}

// Валидация телефона
function isValidPhone(phone) {
  const phoneRegex = /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// Текст способа доставки
function getDeliveryMethodText(type) {
  const methods = {
    'COURIER': 'Курьер СДЭК',
    'PVZ': 'ПВЗ СДЭК',
    'POSTAMAT': 'Постамат СДЭК'
  };
  return methods[type] || 'Доставка';
}

// Прокрутка к элементу
function scrollToElement(element) {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/* === ОРИГИНАЛЬНЫЕ ФУНКЦИИ === */

// Инициализация подсказок городов
function initCitySuggest() {
  const cityInput = cityIn();
  if (!cityInput) return;

  cityInput.addEventListener('input', debounce(async e => {
    if (justSelectedCity) {
      justSelectedCity = false;
      return;
    }

    const q = e.target.value.trim();
    currentCity = '';
    cityCode = null;
    resetDeliveryFlow();

    const ul = citySug();
    if (!ul) return;
    
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
  if (!ul) return;
  
  ul.innerHTML = '';
  if (!items.length) {
    ul.classList.remove('visible');
    return;
  }

  // Позиционируем относительно input
  const cityInput = cityIn();
  if (cityInput) {
    const rect = cityInput.getBoundingClientRect();
    ul.style.position = 'fixed';
    ul.style.top = `${rect.bottom + 8}px`;
    ul.style.left = `${rect.left}px`;
    ul.style.width = `${rect.width}px`;
    ul.style.zIndex = '9999';
  }

  items.forEach(it => {
    const txt = it.title.text + (it.subtitle ? ', ' + it.subtitle.text : '');
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="city-suggestion-content">
        <div class="city-name">${it.title.text}</div>
        ${it.subtitle ? `<div class="city-region">${it.subtitle.text}</div>` : ''}
      </div>
    `;
    
    li.addEventListener('click', async () => {
      justSelectedCity = true;
      cityInput.value = txt;
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

// Переключение способов доставки
function initDeliveryToggle() {
  const courierRadio = document.getElementById('deliveryCourier');
  const pvzRadio = document.getElementById('deliveryPvz');

  if (courierRadio) {
    courierRadio.addEventListener('change', () => {
      if (!cityCode) return;
      showElement(streetWrapper());
      hideMapWrapper();
      hideTariffs();
      selectedTariff = null;
      shipping = 0;
      if (deliveryInfoEl()) deliveryInfoEl().textContent = '';
      updateFinalTotal();

      showNotification('🚛 Курьерская доставка выбрана', 'info');
      showCourierTariffs();
    });
  }

  if (pvzRadio) {
    pvzRadio.addEventListener('change', () => {
      if (!cityCode) return;
      showElement(streetWrapper());
      hideTariffs();
      selectedTariff = null;
      shipping = 0;
      if (deliveryInfoEl()) deliveryInfoEl().textContent = '';
      updateFinalTotal();

      showNotification('📮 Загружаем пункты выдачи...', 'info');
      showMapWrapper(currentCity, fetchAndPlotPvz);
    });
  }
}

async function showCourierTariffs() {
  showNotification('⚡ Загружаем тарифы доставки...', 'info');
  await preloadTariffPreviews([137, 482]);
  renderTariffButtons('COURIER', 'Курьерская доставка', null);
}

// Ввод адреса улицы
function initStreetInput() {
  const streetInput = streetIn();
  if (!streetInput) return;

  streetInput.addEventListener('change', async () => {
    const addr = streetInput.value.trim();
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

// Кнопка возврата  
function initBackButton() {
  const backButton = document.getElementById('backButton');
  if (!backButton) return;

  backButton.addEventListener('click', () => {
    addPremiumButtonAnimation(backButton);
    
    const referrer = document.referrer;
    let redirectUrl = '/index.html';
    
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        const currentUrl = new URL(window.location.href);
        
        if (referrerUrl.origin === currentUrl.origin) {
          if (!referrerUrl.pathname.includes('/cart/')) {
            redirectUrl = referrerUrl.pathname + referrerUrl.search;
          }
        }
      } catch (e) {
        console.log('Ошибка парсинга referrer, используем главную страницу');
      }
    }
    
    showNotification('🔄 Возвращаемся на сайт...', 'info', 2000);
    
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 300);
  });
}

// Управление тарифами
function hideTariffs() {
  if (tariffContainer) {
    tariffContainer.classList.remove('visible');
    tariffContainer.innerHTML = '';
  }
}

function showTariffs() {
  if (tariffContainer) {
    tariffContainer.classList.add('visible');
  }
}

// Проверка статуса Яндекс.Карт
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

      if (mapWrapper() && mapWrapper().style.display === 'flex') {
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

// Премиальные анимации
function initPremiumAnimations() {
  console.log('🎨 Инициализация премиальных анимаций...');

  const animatedElements = [
    { selector: '.cart-hero', delay: 100 },
    { selector: '.cart-section', delay: 200, stagger: 100 }
  ];

  animatedElements.forEach(({ selector, delay, stagger = 0 }) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('premium-slide-up');
        
        if (el.classList.contains('cart-hero')) {
          el.style.transform = 'translateY(0)';
          el.style.opacity = '1';
        }
      }, delay + (index * stagger));
    });
  });

}

function initHeroEffects() {
  const heroIcon = document.querySelector('.cart-icon-container');
  if (heroIcon) {
    heroIcon.style.animation = 'cartIconPulse 3s ease-in-out infinite';
  }

  const hero = document.querySelector('.cart-hero');
  if (hero) {
    hero.addEventListener('mouseenter', () => {
      hero.style.animation = 'none';
      setTimeout(() => {
        hero.style.animation = '';
      }, 50);
    });
  }
}

// Лоадеры оплаты
function showPremiumPaymentLoader() {
  let loader = document.getElementById('premiumPaymentLoader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'premiumPaymentLoader';
    loader.innerHTML = `
      <div class="premium-loader-backdrop">
        <div class="premium-loader-content">
          <div class="premium-loader-spinner"></div>
          <div class="premium-loader-text">Создаем заказ...</div>
          <div class="premium-loader-subtext">Не закрывайте страницу</div>
        </div>
      </div>
    `;
    
    // Добавляем стили лоадера
    loader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const content = loader.querySelector('.premium-loader-content');
    content.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      padding: 40px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    const spinner = loader.querySelector('.premium-loader-spinner');
    spinner.style.cssText = `
      width: 50px;
      height: 50px;
      border: 4px solid #e3f2fd;
      border-top: 4px solid #1ca6f8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    `;
    
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function hidePremiumPaymentLoader() {
  const loader = document.getElementById('premiumPaymentLoader');
  if (loader) {
    loader.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function updateLoaderText(text) {
  const loaderText = document.querySelector('.premium-loader-text');
  if (loaderText) {
    loaderText.textContent = text;
  }
}

// Система уведомлений
function showNotification(message, type = 'info', duration = 3000) {
  const container = getNotificationContainer();
  
  const notification = document.createElement('div');
  notification.className = `premium-notification ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️'
  };

  notification.innerHTML = `
    <div class="notification-icon">${icons[type] || icons.info}</div>
    <div class="notification-message">${message}</div>
  `;

  // Стили уведомления
  notification.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#1ca6f8'};
    transform: translateX(400px);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    font-weight: 500;
    color: #1f2937;
    max-width: 300px;
  `;

  container.appendChild(notification);

  // Анимация появления
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  }, 10);

  // Автоматическое скрытие
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 400);
  }, duration);
}

function getNotificationContainer() {
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10001;
      pointer-events: none;
    `;
    
    container.addEventListener('click', (e) => {
      e.target.style.pointerEvents = 'auto';
    });
    document.body.appendChild(container);
  }
  return container;
}

// Диалог подтверждения
function showConfirm(title, message, onConfirm, onCancel = null, confirmText = 'Да, удалить', cancelText = 'Отмена') {
  // Создаем фон и само модальное окно
  const backdrop = document.createElement('div');
  backdrop.className = 'premium-confirm-backdrop';

  const modal = document.createElement('div');
  modal.className = 'premium-confirm-modal';
  modal.innerHTML = `
    <div class="premium-confirm-content">
      <div class="premium-confirm-header"><h3>${title}</h3></div>
      <div class="premium-confirm-body"><p>${message}</p></div>
      <div class="premium-confirm-actions">
        <button class="premium-btn secondary" id="confirmCancel">${cancelText}</button>
        <button class="premium-btn primary" id="confirmOk">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Анимация появления
  setTimeout(() => {
    backdrop.classList.add('visible');
    modal.classList.add('visible');
  }, 10);

  const okBtn = modal.querySelector('#confirmOk');
  const cancelBtn = modal.querySelector('#confirmCancel');

  const closeModal = () => {
    backdrop.classList.remove('visible');
    modal.classList.remove('visible');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    }, 300); // Время на анимацию исчезновения
  };

  okBtn.addEventListener('click', () => {
    if (onConfirm) onConfirm();
    closeModal();
  });

  cancelBtn.addEventListener('click', () => {
    if (onCancel) onCancel();
    closeModal();
  });

  backdrop.addEventListener('click', () => {
    if (onCancel) onCancel();
    closeModal();
  });
}

/* === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ === */

// Показать/скрыть элемент
function showElement(el) {
  if (el) {
    el.style.display = 'block';
    el.classList.add('visible');
  }
}

function hideElement(el) {
  if (el) {
    el.style.display = 'none';
    el.classList.remove('visible');
  }
}

// Сброс flow доставки
function resetDeliveryFlow() {
  hideElement(deliverySection());
  hideElement(streetWrapper());
  if (infoPanel()) hideElement(infoPanel());
  hideMapWrapper();
  hideTariffs();
  selectedTariff = null;
  shipping = 0;
  updateFinalTotal();
}

// Debounce функция
function debounce(fn, ms = 300) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// Функции для работы с картой
function showMapWrapper(city, cb) {
  const wrapper = mapWrapper();
  if (!wrapper) return;

  if (!yandexMapsLoaded) {
    console.log('[Maps] Яндекс.Карты еще не загружены, ждем...');
    showNotification('🗺️ Загружаем карту...', 'info');

    wrapper.style.display = 'grid';
    wrapper.classList.add('with-panel');
    const container = mapContainer();
    if (container) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; flex-direction: column; background: rgba(255,255,255,0.9); border-radius: 20px;">
          <div style="font-size: 3em; margin-bottom: 20px; animation: premiumFloat 3s ease-in-out infinite;">🗺️</div>
          <div style="font-size: 1.2em; font-weight: 600;">Загрузка карты...</div>
          <div style="font-size: 0.9em; color: #999; margin-top: 8px;">Подождите немного</div>
        </div>
      `;
    }

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

  wrapper.style.display = 'grid';
  wrapper.classList.add('with-panel');
  initializeMapForCity(city, cb);
}

function hideMapWrapper() {
  const wrapper = mapWrapper();
  if (wrapper) {
    wrapper.style.display = 'none';
    wrapper.classList.remove('with-panel');
  }
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

function showMapError(message = 'Ошибка загрузки карты') {
  const container = mapContainer();
  if (container) {
    container.innerHTML = `
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
}

function retryMapLoad() {
  checkYandexMapsStatus();
  if (currentCity) {
    showMapWrapper(currentCity, fetchAndPlotPvz);
  }
}

/* === ЛОГИКА РАБОТЫ С КАРТОЙ И ПВЗ (ВОССТАНОВЛЕННАЯ ВЕРСИЯ) === */

function clearClusters() {
    if (cityClusterer) cityClusterer.removeAll();
    if (postamatClusterer) postamatClusterer.removeAll();
}

async function fetchAndPlotPvz() {
    if (!cityCode || !mapInstance || !yandexMapsLoaded) {
        console.warn('[PVZ] Не все условия выполнены для загрузки ПВЗ.');
        showNotification('Сначала выберите город', 'warning');
        return;
    }

    if (!cityClusterer) {
        const clustererOptions = {
            preset: 'islands#invertedDarkBlueClusterIcons',
            groupByCoordinates: false,
            clusterDisableClickZoom: false,
            clusterOpenBalloonOnClick: false
        };
        cityClusterer = new ymaps.Clusterer(clustererOptions);
        postamatClusterer = new ymaps.Clusterer({ ...clustererOptions, preset: 'islands#invertedLightBlueClusterIcons' });
        mapInstance.geoObjects.add(cityClusterer).add(postamatClusterer);
    }
    clearClusters();

    try {
        showNotification('📮 Загружаем пункты выдачи...', 'info');
        const url = `/api/cdek/pvz?cityId=${encodeURIComponent(cityCode)}&type=ALL&size=1000`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const all = await resp.json();
        if (all.length === 0) {
            showNotification('❌ Пункты выдачи не найдены в этом городе', 'warning');
            return;
        }

        all.forEach(pt => {
            if (!pt.location?.latitude || !pt.location?.longitude) return;
            const coords = [parseFloat(pt.location.latitude), parseFloat(pt.location.longitude)];
            const placemark = new ymaps.Placemark(coords, {}, {
                iconLayout: 'default#image',
                iconImageHref: pt.type === 'PVZ' ? '/assets/icons/pvz.png' : '/assets/icons/postamat.png',
                iconImageSize: [32, 32],
                iconImageOffset: [-16, -32]
            });
            placemark.events.add('click', () => {
                mapInstance.setCenter(coords, 14, { duration: 500 });
                renderPvzInfoPanel(pt);
            });
            (pt.type === 'PVZ' ? cityClusterer : postamatClusterer).add(placemark);
        });
        showNotification(`✅ Загружено ${all.length} пунктов выдачи`, 'success');
    } catch (error) {
        console.error('[PVZ] Ошибка загрузки ПВЗ:', error);
        showNotification('Ошибка загрузки пунктов выдачи', 'error');
    }
}

function renderPvzInfoPanel(point) {
    const { location, type, work_time, note } = point;
    const panel = infoPanel();
    if (!panel) return;

    panel.innerHTML = `
        <h3>${type === 'PVZ' ? '📮 Пункт выдачи' : '📦 Постамат'}</h3>
        <p><strong>📍 Адрес:</strong> ${location.address_full || '—'}</p>
        <p><strong>🕒 Время работы:</strong> ${work_time || '—'}</p>
        ${note ? `<p><strong>📝 Примечание:</strong> ${note}</p>` : ''}
        <button id="selectPvzBtn" class="premium-btn primary" style="width:100%;margin-top:16px;">
          <span>✅</span>
          <span>Выбрать пункт</span>
        </button>
    `;
    showElement(panel);

    document.getElementById('selectPvzBtn').addEventListener('click', (e) => {
        e.preventDefault();
        const tariffCodes = type === 'PVZ' ? [136, 483] : [368, 486];
        preloadTariffPreviews(tariffCodes);
        renderTariffButtons(type, location.address_full, point.code);
        showNotification(`✅ ${type === 'PVZ' ? 'Пункт' : 'Постамат'} выбран`, 'success');
    });
}

async function preloadTariffPreviews(codes) {
    console.log('Preloading tariffs:', codes);
    // Здесь должна быть реальная логика расчета тарифов через API
    showNotification('Функционал расчета тарифов в разработке', 'info');
}

function renderTariffButtons(type, address, pvzCode) {
    console.log('Rendering tariffs for:', type, address, pvzCode);
    const container = tariffContainer;
    if(container) {
        container.innerHTML = '<p style="text-align:center; padding: 20px;">Выбор тарифа будет доступен на следующем шаге.</p>';
        showTariffs();
    }
}