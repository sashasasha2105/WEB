/* === PROFILE.JS - УПРОЩЕННАЯ ЛОГИКА === */

// Состояние приложения
let currentTab = 'orders';
let orders = [];
let userInfo = {};

// DOM элементы
const DOM = {
    tabButtons: null,
    tabContents: null,
    ordersContainer: null,
    ordersLoading: null,
    noOrdersMessage: null,
    userInfoForm: null,
    totalOrders: null,
    memberSince: null,
    orderStatus: null
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Профиль загружается...');

    initializePage();

    // Дополнительная защита - MutationObserver
    setupMutationObserver();

    // Еще одна проверка через 2 секунды
    setTimeout(() => {
        finalTabCheck();
    }, 2000);
});

// Наблюдатель за изменениями DOM
function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.classList.contains('tab-content') && target.classList.contains('active')) {
                    // Если активная вкладка была скрыта, принудительно показываем
                    if (target.style.display === 'none') {
                        console.log('🚨 Обнаружено скрытие активной вкладки, исправляем!');
                        target.style.setProperty('display', 'block', 'important');
                        target.style.setProperty('visibility', 'visible', 'important');
                        target.style.setProperty('opacity', '1', 'important');
                    }
                }
            }
        });
    });

    // Наблюдаем за изменениями стилей
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        observer.observe(tab, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    });
}

// Финальная проверка
function finalTabCheck() {
    console.log('🔧 Финальная проверка табов...');

    const ordersTab = document.getElementById('orders');
    const ordersBtn = document.querySelector('[data-tab="orders"]');

    if (!ordersTab) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Вкладка orders не найдена!');
        return;
    }

    const computedStyle = window.getComputedStyle(ordersTab);
    console.log('Orders tab computed display:', computedStyle.display);
    console.log('Orders tab computed visibility:', computedStyle.visibility);
    console.log('Orders tab computed opacity:', computedStyle.opacity);

    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
        console.log('🚨 ПРИНУДИТЕЛЬНОЕ ИСПРАВЛЕНИЕ!');

        // Ядерный вариант - полная перезагрузка табов
        nuclearTabFix();
    } else {
        console.log('✅ Табы работают корректно');
    }
}

// Ядерный способ исправления табов
function nuclearTabFix() {
    console.log('💥 ЯДЕРНОЕ ИСПРАВЛЕНИЕ ТАБОВ!');

    // Удаляем все стили с вкладок
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.removeAttribute('style');
        tab.classList.remove('active');
    });

    // Принудительно показываем orders
    const ordersTab = document.getElementById('orders');
    if (ordersTab) {
        ordersTab.classList.add('active');
        ordersTab.innerHTML = ordersTab.innerHTML; // Принудительный reflow

        // Устанавливаем стили через setAttribute для максимальной принудительности
        ordersTab.setAttribute('style', 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important;');

        // Добавляем дополнительные CSS классы
        ordersTab.classList.add('force-visible', 'nuclear-fix');
    }

    // Активируем кнопку
    const ordersBtn = document.querySelector('[data-tab="orders"]');
    if (ordersBtn) {
        ordersBtn.classList.add('active');
    }

    // Добавляем экстренные CSS правила
    addEmergencyCSS();

    console.log('💥 Ядерное исправление завершено!');
}

// Добавляем экстренные CSS правила
function addEmergencyCSS() {
    const emergencyStyle = document.createElement('style');
    emergencyStyle.id = 'emergency-tab-fix';
    emergencyStyle.innerHTML = `
        .force-visible,
        .nuclear-fix,
        #orders.active {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 1 !important;
        }
        
        .tab-content:not(.active) {
            display: none !important;
        }
        
        .tab-content.active {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        /* Принудительное правило для orders */
        #orders {
            display: block !important;
        }
        
        #profile:not(.active),
        #settings:not(.active) {
            display: none !important;
        }
    `;

    // Удаляем старый emergency style если есть
    const oldStyle = document.getElementById('emergency-tab-fix');
    if (oldStyle) {
        oldStyle.remove();
    }

    document.head.appendChild(emergencyStyle);
    console.log('🚨 Экстренные CSS правила добавлены!');
}

// Основная инициализация
function initializePage() {
    try {
        // Кешируем DOM элементы
        cacheDOMElements();

        // Загружаем хедер
        loadHeader();

        // Инициализируем табы
        initTabs();

        // Загружаем данные пользователя
        loadUserData();

        // Настраиваем обработчики
        setupEventListeners();

        // Загружаем заказы для первой вкладки
        if (currentTab === 'orders') {
            setTimeout(() => loadOrders(), 500);
        }

        // Инициализируем автоматический расчет высоты
        initializeAutoResize();

        console.log('✅ Профиль инициализирован');
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showNotification('Ошибка загрузки страницы', 'error');
    }
}

// Кеширование DOM элементов
function cacheDOMElements() {
    DOM.tabButtons = document.querySelectorAll('.tab-btn');
    DOM.tabContents = document.querySelectorAll('.tab-content');
    DOM.ordersContainer = document.getElementById('ordersContainer');
    DOM.ordersLoading = document.getElementById('ordersLoading');
    DOM.noOrdersMessage = document.getElementById('noOrdersMessage');
    DOM.userInfoForm = document.getElementById('userInfoForm');
    DOM.totalOrders = document.getElementById('totalOrders');
    DOM.memberSince = document.getElementById('memberSince');
    DOM.orderStatus = document.getElementById('orderStatus');
}

// Загрузка хедера
function loadHeader() {
    fetch('/header.html')
        .then(response => response.text())
        .then(html => {
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = html;

                // Обновляем счетчик корзины
                setTimeout(() => {
                    if (window.CartManager) {
                        window.CartManager.updateCartCounter();
                    }
                    updateCartBadge();
                }, 100);
            }
        })
        .catch(error => {
            console.warn('⚠️ Не удалось загрузить хедер:', error);
        });
}

// === УПРАВЛЕНИЕ ВКЛАДКАМИ ===

function initTabs() {
    DOM.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    if (currentTab === tabId) return;

    console.log('🔄 Переключение на:', tabId);

    // Обновляем кнопки
    DOM.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Переключаем контент - ИСПРАВЛЕНО
    DOM.tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
            content.style.display = 'block';
        } else {
            content.classList.remove('active');
            content.style.display = 'none';
        }
    });

    currentTab = tabId;

    // Загружаем данные для вкладки
    if (tabId === 'orders' && orders.length === 0) {
        loadOrders();
    }
}

// Инициализация табов - УЛУЧШЕНО
function initTabs() {
    DOM.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });

    // Убеждаемся что первая вкладка показана
    showFirstTab();
}

// Показ первой вкладки - ИСПРАВЛЕНО
function showFirstTab() {
    // Сначала скрываем все вкладки
    DOM.tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    // Показываем вкладку заказов
    const ordersTab = document.getElementById('orders');
    if (ordersTab) {
        ordersTab.style.display = 'block';
        ordersTab.classList.add('active');
        console.log('🎯 Первая вкладка показана');
    }

    // Активируем первую кнопку
    DOM.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === 'orders');
    });
}

// === ЗАГРУЗКА ЗАКАЗОВ ===

async function loadOrders() {
    try {
        showLoadingState();

        // Имитация загрузки
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Создаем демо заказы
        orders = await createDemoOrders();

        hideLoadingState();

        if (orders.length === 0) {
            showNoOrdersState();
        } else {
            renderOrders();
        }

        updateStats();

    } catch (error) {
        console.error('❌ Ошибка загрузки заказов:', error);
        showErrorState();
    }
}

function showLoadingState() {
    if (DOM.ordersLoading) DOM.ordersLoading.style.display = 'flex';
    if (DOM.noOrdersMessage) DOM.noOrdersMessage.style.display = 'none';
    if (DOM.ordersContainer) DOM.ordersContainer.innerHTML = '';
}

function hideLoadingState() {
    if (DOM.ordersLoading) DOM.ordersLoading.style.display = 'none';
}

function showNoOrdersState() {
    if (DOM.noOrdersMessage) DOM.noOrdersMessage.style.display = 'block';
}

function showErrorState() {
    if (DOM.ordersContainer) {
        DOM.ordersContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: white;">
                <div style="font-size: 3em; margin-bottom: 16px;">⚠️</div>
                <h3>Ошибка загрузки</h3>
                <p>Попробуйте обновить страницу</p>
                <button onclick="loadOrders()" class="refresh-btn" style="margin-top: 20px;">
                    <span>🔄</span>
                    <span>Повторить</span>
                </button>
            </div>
        `;
    }
}

// Рендеринг заказов
async function renderOrders() {
    if (!DOM.ordersContainer || orders.length === 0) return;

    const ordersHTML = orders.map(order => createOrderHTML(order)).join('');
    DOM.ordersContainer.innerHTML = ordersHTML;

    console.log('✅ Заказы отрендерены:', orders.length);

    // ДОБАВИЛИ: автоматический пересчет высоты после рендеринга
    setTimeout(() => {
        autoResizeElements();
    }, 100);
}

function createOrderHTML(order) {
    const itemsHTML = order.items && order.items.length > 0 ? `
        <div class="order-items">
            <div class="order-items-title">Товары в заказе:</div>
            ${order.items.map(item => `
                <div class="order-item">
                    <span class="item-name">${escapeHtml(item.name)}</span>
                    <span class="item-price">${formatPrice(item.cost || 0)}</span>
                </div>
            `).join('')}
        </div>
    ` : '';

    const deliveryHTML = order.delivery ? `
        <div class="delivery-info">
            📦 ${escapeHtml(order.delivery.type || 'Доставка')} ${order.delivery.address ? '• ' + escapeHtml(order.delivery.address) : ''}
        </div>
    ` : '';

    return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-number">Заказ ${escapeHtml(order.cdekNumber || order.id)}</div>
                    <div class="order-date">${formatDate(order.createdAt)}</div>
                </div>
                <div class="order-status ${getStatusClass(order.status)}">
                    ${getStatusText(order.status)}
                </div>
            </div>
            
            ${itemsHTML}
            
            <div class="order-total">
                <div class="total-label">Итого к оплате:</div>
                <div class="total-amount">${formatPrice(order.amount || 0)}</div>
            </div>
            
            ${deliveryHTML}
        </div>
    `;
}

// Создание демо данных
async function createDemoOrders() {
    return [
        {
            id: 'CG-2025-001',
            cdekNumber: 'CG-250115-001',
            status: 'created',
            amount: 9400,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            items: [
                { name: 'clip & go камера', cost: 8900 },
                { name: 'Карта памяти 8 ГБ', cost: 500 }
            ],
            delivery: {
                type: 'Курьер СДЭК',
                address: 'ул. Примерная, 123'
            }
        },
        {
            id: 'CG-2025-002',
            cdekNumber: 'CG-250110-002',
            status: 'paid',
            amount: 8900,
            createdAt: new Date(Date.now() - 432000000).toISOString(),
            items: [
                { name: 'clip & go камера', cost: 8900 }
            ],
            delivery: {
                type: 'ПВЗ СДЭК',
                address: 'Пункт выдачи на Ленина'
            }
        },
        {
            id: 'CG-2025-003',
            cdekNumber: 'CG-250105-003',
            status: 'failed',
            amount: 1200,
            createdAt: new Date(Date.now() - 864000000).toISOString(),
            items: [
                { name: 'Аксессуары для камеры', cost: 1200 }
            ],
            delivery: {
                type: 'Самовывоз',
                address: 'Офис на Тверской'
            }
        }
    ];
}

// === ОБРАБОТЧИКИ СОБЫТИЙ ===

function setupEventListeners() {
    // Обновление заказов
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const icon = refreshBtn.querySelector('.refresh-icon');
            if (icon) {
                icon.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    icon.style.transform = '';
                }, 500);
            }
            loadOrders();
        });
    }

    // Сохранение профиля
    if (DOM.userInfoForm) {
        DOM.userInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveUserInfo();
        });

        // Автосохранение при потере фокуса
        const inputs = DOM.userInfoForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', debounce(saveUserInfo, 1000));
        });
    }

    // Переключатели настроек
    const toggles = document.querySelectorAll('.toggle input');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            saveSettings();
            showNotification('Настройки сохранены', 'success');
        });
    });

    // Кнопки действий
    setupActionButtons();

    // Загружаем сохраненные данные
    loadSettings();
}

// === УПРАВЛЕНИЕ ДАННЫМИ ПОЛЬЗОВАТЕЛЯ ===

function loadUserData() {
    try {
        const savedInfo = localStorage.getItem('userInfo');
        if (savedInfo) {
            userInfo = JSON.parse(savedInfo);
            fillUserForm();
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
    }
}

function fillUserForm() {
    const fields = ['userFullName', 'userPhone', 'userEmail', 'userCity', 'userBirthday'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element && userInfo[fieldId]) {
            element.value = userInfo[fieldId];
        }
    });
}

function saveUserInfo() {
    const fields = ['userFullName', 'userPhone', 'userEmail', 'userCity', 'userBirthday'];

    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            userInfo[fieldId] = element.value.trim();
        }
    });

    try {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        showNotification('Информация сохранена!', 'success');

        // Анимация кнопки сохранения
        const saveBtn = document.querySelector('.save-btn');
        if (saveBtn) {
            const originalContent = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span>✅</span><span>Сохранено!</span>';
            saveBtn.style.background = 'var(--success)';

            setTimeout(() => {
                saveBtn.innerHTML = originalContent;
                saveBtn.style.background = '';
            }, 2000);
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showNotification('Ошибка сохранения', 'error');
    }
}

// === НАСТРОЙКИ ===

function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');

        Object.keys(settings).forEach(settingId => {
            const element = document.getElementById(settingId);
            if (element && typeof settings[settingId] === 'boolean') {
                element.checked = settings[settingId];
            }
        });
    } catch (error) {
        console.error('❌ Ошибка загрузки настроек:', error);
    }
}

function saveSettings() {
    const settingIds = [
        'emailNotifications', 'smsNotifications', 'marketingEmails'
    ];
    const settings = {};

    settingIds.forEach(settingId => {
        const element = document.getElementById(settingId);
        if (element) {
            settings[settingId] = element.checked;
        }
    });

    try {
        localStorage.setItem('userSettings', JSON.stringify(settings));
        console.log('⚙️ Настройки сохранены');
    } catch (error) {
        console.error('❌ Ошибка сохранения настроек:', error);
    }
}

// === КНОПКИ ДЕЙСТВИЙ ===

function setupActionButtons() {
    // Очистка корзины
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            showConfirm(
                'Очистить корзину?',
                'Все товары будут удалены из корзины',
                () => {
                    try {
                        localStorage.removeItem('cartData');
                        updateCartBadge();
                        showNotification('Корзина очищена', 'success');
                    } catch (error) {
                        console.error('❌ Ошибка очистки корзины:', error);
                        showNotification('Ошибка очистки', 'error');
                    }
                }
            );
        });
    }

    // Экспорт данных
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            exportUserData();
        });
    }

    // Очистка истории
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            showConfirm(
                'Удалить всю историю?',
                'Это действие необратимо. Все данные о заказах будут удалены.',
                () => {
                    try {
                        orders = [];
                        renderOrders();
                        updateStats();
                        showNoOrdersState();
                        showNotification('История очищена', 'success');
                    } catch (error) {
                        console.error('❌ Ошибка очистки истории:', error);
                        showNotification('Ошибка очистки', 'error');
                    }
                }
            );
        });
    }
}

// === ЭКСПОРТ ДАННЫХ ===

function exportUserData() {
    try {
        const data = {
            userInfo: userInfo,
            orders: orders,
            settings: JSON.parse(localStorage.getItem('userSettings') || '{}'),
            exportDate: new Date().toISOString(),
            version: '2.5'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `clip-go-profile-${new Date().toISOString().split('T')[0]}.json`;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        showNotification('Данные экспортированы', 'success');
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        showNotification('Ошибка экспорта', 'error');
    }
}

// === АВТОМАТИЧЕСКИЙ РАСЧЕТ ВЫСОТЫ БЛОКОВ ===

let isResizing = false; // Флаг для предотвращения циклов

function autoResizeElements() {
    if (isResizing) {
        console.log('🔄 Пропускаем пересчет - уже выполняется');
        return;
    }

    isResizing = true;
    console.log('🔧 Автоматический расчет высоты блоков...');

    // Функция для расчета нужной высоты элемента
    function calculateRequiredHeight(element) {
        if (!element) return 0;

        // Временно убираем ограничения высоты
        const originalHeight = element.style.height;
        const originalMinHeight = element.style.minHeight;
        const originalMaxHeight = element.style.maxHeight;

        element.style.height = 'auto';
        element.style.minHeight = 'auto';
        element.style.maxHeight = 'none';

        // Получаем реальную высоту контента
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        const requiredHeight = Math.max(scrollHeight, clientHeight);

        // Возвращаем исходные стили
        element.style.height = originalHeight;
        element.style.minHeight = originalMinHeight;
        element.style.maxHeight = originalMaxHeight;

        return requiredHeight;
    }

    // Обработка вкладок (работала нормально)
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach((tab, index) => {
        const requiredHeight = calculateRequiredHeight(tab);
        if (requiredHeight > 0) {
            tab.style.minHeight = `${requiredHeight + 20}px`; // +20px запас
            console.log(`Вкладка ${tab.id}: установлена высота ${requiredHeight + 20}px`);
        }
    });

    // ИСКЛЮЧИЛИ карточки заказов - они вызывали проблемы!
    // Пусть они используют CSS sizing

    // Обработка обычных карточек (работали нормально)
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        const requiredHeight = calculateRequiredHeight(card);
        if (requiredHeight > 0) {
            card.style.minHeight = `${requiredHeight + 10}px`; // +10px запас
            console.log(`Карточка ${index}: установлена высота ${requiredHeight + 10}px`);
        }
    });

    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => {
        isResizing = false;
    }, 500);
}

// Функция для наблюдения за изменениями контента
function setupAutoResize() {
    // Создаем ResizeObserver ТОЛЬКО для вкладок и карточек (НЕ order-card!)
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                const element = entry.target;
                // УБРАЛИ order-card из наблюдения!
                if (element.classList.contains('tab-content') ||
                    element.classList.contains('card')) {

                    // Пересчитываем высоту при изменении контента
                    setTimeout(() => {
                        if (!isResizing) {
                            autoResizeElements();
                        }
                    }, 200);
                }
            });
        });

        // Наблюдаем ТОЛЬКО за вкладками и карточками (НЕ order-card!)
        document.querySelectorAll('.tab-content, .card').forEach(el => {
            resizeObserver.observe(el);
        });
    }

    // Также пересчитываем при изменении окна
    window.addEventListener('resize', debounce(() => {
        if (!isResizing) {
            autoResizeElements();
        }
    }, 500));
}

// Вызываем после загрузки контента
function initializeAutoResize() {
    // Начальный расчет
    setTimeout(() => {
        if (!isResizing) {
            autoResizeElements();
        }
    }, 500);

    // Повторный расчет после загрузки заказов
    setTimeout(() => {
        if (!isResizing) {
            autoResizeElements();
        }
    }, 2000);

    // Настраиваем автоматический пересчет
    setupAutoResize();

    console.log('✅ Автоматический расчет высоты инициализирован');
}

function updateStats() {
    // Анимированное обновление счетчика заказов
    if (DOM.totalOrders) {
        animateCounter(DOM.totalOrders, orders.length);
    }

    if (DOM.memberSince) {
        DOM.memberSince.textContent = new Date().getFullYear();
    }

    if (DOM.orderStatus) {
        let status = 'Новичок';
        if (orders.length >= 10) status = 'VIP';
        else if (orders.length >= 3) status = 'Постоянный';
        else if (orders.length > 0) status = 'Клиент';

        DOM.orderStatus.textContent = status;
    }
}

function animateCounter(element, target) {
    if (!element) return;

    const start = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = Math.floor(start + (target - start) * easeOutCubic(progress));
        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// === ОБНОВЛЕНИЕ КОРЗИНЫ ===

function updateCartBadge() {
    try {
        let count = 0;

        if (window.CartManager) {
            count = window.CartManager.getTotalCount();
        } else {
            const cartData = JSON.parse(localStorage.getItem('cartData') || '{}');
            count = (cartData.cameraCount || 0) + (cartData.memoryCount || 0);
        }

        const badges = document.querySelectorAll('.cart-count');
        badges.forEach(badge => {
            if (badge) {
                badge.textContent = count;
            }
        });
    } catch (error) {
        console.warn('⚠️ Ошибка обновления корзины:', error);
    }
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getStatusClass(status) {
    const statusMap = {
        'created': 'created',
        'payment_success_cdek_failed': 'failed',
        'failed': 'failed'
    };
    return statusMap[status] || 'paid';
}

function getStatusText(status) {
    const statusMap = {
        'created': 'Создан',
        'payment_success_cdek_failed': 'Ошибка',
        'failed': 'Ошибка'
    };
    return statusMap[status] || 'Оплачен';
}

function formatDate(dateString) {
    if (!dateString) return 'Не указано';

    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Сегодня';
        if (diffDays === 1) return 'Вчера';
        if (diffDays < 7) return `${diffDays} дн. назад`;

        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return 'Не указано';
    }
}

function formatPrice(price) {
    return (price || 0).toLocaleString('ru-RU') + ' ₽';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

// === УВЕДОМЛЕНИЯ ===

function showNotification(message, type = 'info', duration = 3000) {
    // Создаем контейнер если его нет
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    const notificationId = 'notification-' + Date.now();
    notification.id = notificationId;

    // Цвета для разных типов
    const colors = {
        success: '#10b981',
        info: '#1ca6f8',
        warning: '#f59e0b',
        error: '#ef4444'
    };

    const icons = {
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌'
    };

    notification.style.cssText = `
        background: white;
        border: 1px solid #e5e7eb;
        border-left: 4px solid ${colors[type]};
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        transform: translateX(400px);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        max-width: 350px;
        min-width: 300px;
    `;

    notification.innerHTML = `
        <span style="font-size: 1.2em; color: ${colors[type]};">${icons[type]}</span>
        <span style="flex: 1; color: #374151; font-weight: 500;">${escapeHtml(message)}</span>
        <button style="background: none; border: none; font-size: 1.2em; color: #9ca3af; cursor: pointer; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">&times;</button>
    `;

    container.appendChild(notification);

    // Анимация появления
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });

    // Закрытие по клику
    const closeBtn = notification.querySelector('button');
    closeBtn.onclick = () => removeNotification(notification);

    // Автоудаление
    setTimeout(() => removeNotification(notification), duration);
}

function removeNotification(notification) {
    if (!notification || !notification.parentNode) return;

    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// === ДИАЛОГ ПОДТВЕРЖДЕНИЯ ===

function showConfirm(title, message, onConfirm) {
    // Создаем overlay
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
                <button class="confirm-btn cancel">Отмена</button>
                <button class="confirm-btn confirm">Подтвердить</button>
            </div>
        </div>
    `;

    // Добавляем стили если их нет
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
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .confirm-dialog {
                background: white;
                border-radius: 20px;
                overflow: hidden;
                max-width: 400px;
                width: 90%;
                animation: slideUp 0.3s ease;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .confirm-header {
                padding: 24px 24px 0;
            }
            
            .confirm-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 700;
                color: #111827;
            }
            
            .confirm-body {
                padding: 12px 24px 24px;
            }
            
            .confirm-body p {
                margin: 0;
                color: #6b7280;
                line-height: 1.5;
            }
            
            .confirm-actions {
                display: flex;
                gap: 12px;
                padding: 0 24px 24px;
            }
            
            .confirm-btn {
                flex: 1;
                padding: 12px 20px;
                border: none;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.95rem;
            }
            
            .confirm-btn.cancel {
                background: #f3f4f6;
                color: #6b7280;
            }
            
            .confirm-btn.cancel:hover {
                background: #e5e7eb;
            }
            
            .confirm-btn.confirm {
                background: #ef4444;
                color: white;
            }
            
            .confirm-btn.confirm:hover {
                background: #dc2626;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(30px) scale(0.95);
                    opacity: 0;
                }
                to {
                    transform: translateY(0) scale(1);
                    opacity: 1;
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
        overlay.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 300);
    }

    cancelBtn.addEventListener('click', closeDialog);
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        closeDialog();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDialog();
        }
    });

    // Фокус на кнопке отмены
    cancelBtn.focus();
}

// === ГЛОБАЛЬНЫЕ ФУНКЦИИ ===
window.loadOrders = loadOrders;
window.switchTab = switchTab;
window.showNotification = showNotification;

console.log('🎉 Профиль готов к использованию!');