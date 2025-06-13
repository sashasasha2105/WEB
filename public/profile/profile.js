/* === PROFILE.JS - ИСПРАВЛЕННАЯ ВЕРСИЯ С ИМПОРТОМ ХЕДЕРА === */

// Состояние приложения
let currentTab = 'orders';
let orders = [];
let userInfo = {};
let isLoading = false;

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
    console.log('🚀 Премиальный профиль загружается...');

    // Показываем экран загрузки
    showInitialLoader();

    // Запускаем инициализацию поэтапно
    setTimeout(() => {
        initializePageSteps();
    }, 300);
});

// Показ красивого экрана загрузки
function showInitialLoader() {
    const loader = document.createElement('div');
    loader.id = 'profileInitLoader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0057c2 0%, #1ca6f8 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: white;
        font-family: 'Inter', sans-serif;
    `;

    loader.innerHTML = `
        <div class="loader-content" style="text-align: center;">
            <div class="loader-avatar" style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px; animation: loaderPulse 2s ease-in-out infinite;">
                <span style="font-size: 2.5em;">👤</span>
            </div>
            <h2 style="font-size: 1.8em; font-weight: 800; margin-bottom: 15px; animation: loaderSlideUp 0.6s ease-out 0.2s both;">Загружаем профиль</h2>
            <p style="font-size: 1.1em; opacity: 0.9; font-weight: 500; animation: loaderSlideUp 0.6s ease-out 0.4s both;">Подготавливаем ваши данные...</p>
            <div class="loader-dots" style="margin-top: 30px; animation: loaderSlideUp 0.6s ease-out 0.6s both;">
                <div class="dot" style="display: inline-block; width: 8px; height: 8px; background: rgba(255,255,255,0.6); border-radius: 50%; margin: 0 4px; animation: loaderDots 1.4s ease-in-out infinite;"></div>
                <div class="dot" style="display: inline-block; width: 8px; height: 8px; background: rgba(255,255,255,0.6); border-radius: 50%; margin: 0 4px; animation: loaderDots 1.4s ease-in-out infinite 0.2s;"></div>
                <div class="dot" style="display: inline-block; width: 8px; height: 8px; background: rgba(255,255,255,0.6); border-radius: 50%; margin: 0 4px; animation: loaderDots 1.4s ease-in-out infinite 0.4s;"></div>
            </div>
        </div>
        
        <style>
            @keyframes loaderPulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
                50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(255,255,255,0); }
            }
            
            @keyframes loaderSlideUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes loaderDots {
                0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                40% { transform: scale(1.2); opacity: 1; }
            }
        </style>
    `;

    document.body.appendChild(loader);
}

// Скрытие экрана загрузки
function hideInitialLoader() {
    const loader = document.getElementById('profileInitLoader');
    if (loader) {
        loader.style.animation = 'fadeOut 0.5s ease-out forwards';
        loader.style.setProperty('--fade-out', `
            @keyframes fadeOut {
                to { opacity: 0; transform: scale(0.95); }
            }
        `);

        setTimeout(() => {
            if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        }, 500);
    }
}

// Поэтапная инициализация
async function initializePageSteps() {
    const steps = [
        { name: 'DOM элементы', fn: cacheDOMElements, delay: 200 },
        { name: 'Хедер', fn: loadHeader, delay: 300 }, // Загружаем из header/header.html
        { name: 'Данные пользователя', fn: loadUserData, delay: 100 },
        { name: 'Система табов', fn: initTabs, delay: 200 },
        { name: 'Обработчики событий', fn: setupEventListeners, delay: 100 },
        { name: 'Стили и анимации', fn: initStyling, delay: 200 },
        { name: 'Заказы', fn: loadOrdersWithDelay, delay: 300 }
    ];

    for (const step of steps) {
        try {
            console.log(`📦 Инициализация: ${step.name}...`);
            await step.fn();
            await new Promise(resolve => setTimeout(resolve, step.delay));
        } catch (error) {
            console.error(`❌ Ошибка при инициализации ${step.name}:`, error);
        }
    }

    // Завершение инициализации
    setTimeout(() => {
        hideInitialLoader();
        showWelcomeAnimation();

        // ПРИНУДИТЕЛЬНАЯ ПРОВЕРКА ТАБОВ
        forceShowActiveTab();

        console.log('✅ Премиальный профиль полностью инициализирован');
    }, 500);
}

// Приветственная анимация
function showWelcomeAnimation() {
    // Убеждаемся что content-wrapper виден
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
        contentWrapper.style.opacity = '1';
        contentWrapper.style.transform = 'translateY(0)';
    }

    // Анимация элементов профиля (но не content-wrapper)
    const animationQueue = [
        { selector: '.hero-card', delay: 100 },
        { selector: '.tabs-navigation', delay: 200 }
    ];

    animationQueue.forEach(({ selector, delay }) => {
        setTimeout(() => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

                requestAnimationFrame(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                });
            });
        }, delay);
    });

    // Показ уведомления
    setTimeout(() => {
        showNotification('🎉 Добро пожаловать в личный кабинет!', 'success', 3000);
    }, 800);
}

// Кеширование DOM элементов
async function cacheDOMElements() {
    return new Promise((resolve) => {
        DOM.tabButtons = document.querySelectorAll('.tab-btn');
        DOM.tabContents = document.querySelectorAll('.tab-content');
        DOM.ordersContainer = document.getElementById('ordersContainer');
        DOM.ordersLoading = document.getElementById('ordersLoading');
        DOM.noOrdersMessage = document.getElementById('noOrdersMessage');
        DOM.userInfoForm = document.getElementById('userInfoForm');
        DOM.totalOrders = document.getElementById('totalOrders');
        DOM.memberSince = document.getElementById('memberSince');
        DOM.orderStatus = document.getElementById('orderStatus');

        console.log('📦 DOM элементы закешированы');
        resolve();
    });
}

// Загрузка хедера из header/header.html
async function loadHeader() {
    return new Promise((resolve) => {
        fetch('/header/header.html')
            .then(response => response.text())
            .then(html => {
                const headerContainer = document.getElementById('header-container');
                if (headerContainer) {
                    headerContainer.innerHTML = html;

                    setTimeout(() => {
                        if (window.CartManager) {
                            window.CartManager.updateCartCounter();
                        }
                        updateOrdersBadge();

                        // Ждем инициализации header.js и обновляем бейджи
                        if (window.headerManager) {
                            window.headerManager.forceUpdateBadges();
                        }
                    }, 100);
                }
                resolve();
            })
            .catch(error => {
                console.warn('⚠️ Не удалось загрузить хедер:', error);
                resolve();
            });
    });
}

// Загрузка данных пользователя
async function loadUserData() {
    return new Promise((resolve) => {
        try {
            const savedInfo = localStorage.getItem('userInfo');
            if (savedInfo) {
                userInfo = JSON.parse(savedInfo);
                setTimeout(() => fillUserForm(), 100);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки данных пользователя:', error);
        }
        resolve();
    });
}

// Инициализация табов с предзагрузкой
async function initTabs() {
    return new Promise((resolve) => {
        // Показываем content-wrapper сразу
        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
            contentWrapper.style.opacity = '1';
            contentWrapper.style.transform = 'translateY(0)';
        }

        // Предварительно скрываем все табы
        DOM.tabContents.forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
            // Убираем встроенные стили которые могут мешать
            content.style.opacity = '';
            content.style.transform = '';
            content.style.visibility = '';
        });

        // Показываем таб заказов сразу без анимации
        const ordersTab = document.getElementById('orders');
        if (ordersTab) {
            ordersTab.style.display = 'block';
            ordersTab.classList.add('active');
            ordersTab.style.opacity = '1';
            ordersTab.style.transform = 'translateY(0)';
            ordersTab.style.visibility = 'visible';

            console.log('✅ Таб заказов показан');
        }

        // Активируем кнопку заказов
        DOM.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === 'orders');
        });

        // Добавляем обработчики кликов
        DOM.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                switchTab(tabId);
            });
        });

        console.log('🎯 Система табов инициализирована');
        resolve();
    });
}

// Переключение табов с анимацией
function switchTab(tabId) {
    if (currentTab === tabId || isLoading) return;

    console.log('🔄 Переключение на таб:', tabId);
    isLoading = true;

    const currentTabElement = document.getElementById(currentTab);
    const newTabElement = document.getElementById(tabId);

    if (!newTabElement) {
        isLoading = false;
        return;
    }

    // Анимация исчезновения текущего таба
    if (currentTabElement) {
        currentTabElement.style.transition = 'all 0.3s ease-out';
        currentTabElement.style.opacity = '0';
        currentTabElement.style.transform = 'translateX(-20px)';

        setTimeout(() => {
            currentTabElement.style.display = 'none';
            currentTabElement.classList.remove('active');

            // Показ нового таба
            showNewTab(newTabElement, tabId);
        }, 300);
    } else {
        showNewTab(newTabElement, tabId);
    }
}

// Показ нового таба
function showNewTab(tabElement, tabId) {
    // Обновляем кнопки
    DOM.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Скрываем все табы
    DOM.tabContents.forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
        content.style.opacity = '';
        content.style.transform = '';
        content.style.animation = '';
    });

    // Показываем новый таб сразу
    tabElement.style.display = 'block';
    tabElement.classList.add('active');
    tabElement.style.opacity = '1';
    tabElement.style.transform = 'translateY(0)';
    tabElement.style.visibility = 'visible';

    currentTab = tabId;

    // Загружаем данные для таба при необходимости
    if (tabId === 'orders') {
        setTimeout(() => loadOrders(), 100);
    }

    // ПРИНУДИТЕЛЬНЫЙ ПЕРЕСЧЕТ ВЫСОТЫ
    forceResizeAfterTabSwitch();

    setTimeout(() => {
        isLoading = false;
    }, 200);

    console.log('✅ Таб переключен на:', tabId);
}

// Инициализация стилей и анимаций
async function initStyling() {
    return new Promise((resolve) => {
        addTouchableClasses();

        // Инициализируем систему автоматического изменения размера
        initializeAutoResize();

        resolve();
    });
}

// Добавление touchable классов
function addTouchableClasses() {
    const touchableElements = [
        '.hero-card',
        '.stat-item',
        '.order-card',
        '.setting-item',
        '.card',
        '.tab-btn'
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

// Загрузка заказов с задержкой
async function loadOrdersWithDelay() {
    return new Promise((resolve) => {
        setTimeout(() => {
            loadOrders().then(resolve);
        }, 200);
    });
}

// Принудительный показ активного таба
function forceShowActiveTab() {
    console.log('🔧 Принудительная проверка табов...');

    const activeTab = document.querySelector('.tab-content.active') || document.getElementById('orders');

    if (activeTab) {
        // Принудительно показываем активный таб
        activeTab.style.setProperty('display', 'block', 'important');
        activeTab.style.setProperty('opacity', '1', 'important');
        activeTab.style.setProperty('visibility', 'visible', 'important');
        activeTab.style.setProperty('transform', 'translateY(0)', 'important');
        activeTab.classList.add('active');

        console.log('✅ Активный таб принудительно показан:', activeTab.id);

        // ПЕРЕСЧЕТ ВЫСОТЫ ПОСЛЕ ПОКАЗА ТАБА
        setTimeout(() => {
            autoResizeElements();
        }, 200);

        // Загружаем заказы если это таб заказов
        if (activeTab.id === 'orders') {
            setTimeout(() => loadOrders(), 300);
        }
    } else {
        console.error('❌ Активный таб не найден!');
    }
}

// === ЗАГРУЗКА ЗАКАЗОВ ===

async function loadOrders() {
    if (isLoading) return;

    try {
        isLoading = true;
        showLoadingState();

        // Загружаем реальные заказы
        if (window.OrderManager) {
            orders = window.OrderManager.getOrders();

            // Синхронизируем с сервером
            const synced = await window.OrderManager.syncWithServer();
            if (synced) {
                orders = window.OrderManager.getOrders();
            }
        } else {
            console.warn('⚠️ OrderManager не найден, используем localStorage');
            const savedOrders = localStorage.getItem('userOrders');
            orders = savedOrders ? JSON.parse(savedOrders) : [];
        }

        // Небольшая задержка для плавности
        await new Promise(resolve => setTimeout(resolve, 800));

        hideLoadingState();

        if (orders.length === 0) {
            showNoOrdersState();
        } else {
            await renderOrdersWithAnimation();
        }

        updateStats();

    } catch (error) {
        console.error('❌ Ошибка загрузки заказов:', error);
        showErrorState();
    } finally {
        isLoading = false;
    }
}

function showLoadingState() {
    if (DOM.ordersLoading) {
        DOM.ordersLoading.style.display = 'flex';
        DOM.ordersLoading.style.animation = 'premiumSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    if (DOM.noOrdersMessage) DOM.noOrdersMessage.style.display = 'none';
    if (DOM.ordersContainer) DOM.ordersContainer.innerHTML = '';
}

function hideLoadingState() {
    if (DOM.ordersLoading) {
        DOM.ordersLoading.style.animation = 'premiumFadeOut 0.3s ease-out';
        setTimeout(() => {
            DOM.ordersLoading.style.display = 'none';
        }, 300);
    }
}

function showNoOrdersState() {
    if (DOM.noOrdersMessage) {
        DOM.noOrdersMessage.style.display = 'block';
        DOM.noOrdersMessage.style.animation = 'premiumEmptyStateSlide 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
}

function showErrorState() {
    if (DOM.ordersContainer) {
        DOM.ordersContainer.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 80px 20px; color: white; animation: premiumEmptyStateSlide 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                <div style="font-size: 3.5em; margin-bottom: 24px; animation: premiumFloat 3s ease-in-out infinite; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));">⚠️</div>
                <h3 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 16px; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">Ошибка загрузки</h3>
                <p style="font-size: 1.2rem; margin-bottom: 32px; opacity: 0.9;">Попробуйте обновить страницу</p>
                <button onclick="loadOrders()" class="refresh-btn premium-btn primary" style="margin-top: 20px;">
                    <span>🔄</span>
                    <span>Повторить</span>
                </button>
            </div>
        `;
    }
}

// Премиальный рендеринг заказов с анимацией
async function renderOrdersWithAnimation() {
    if (!DOM.ordersContainer || orders.length === 0) return;

    const ordersHTML = orders.map(order => createOrderHTML(order)).join('');
    DOM.ordersContainer.innerHTML = ordersHTML;

    const orderCards = DOM.ordersContainer.querySelectorAll('.order-card');

    // Поочередная анимация карточек
    for (let i = 0; i < orderCards.length; i++) {
        const card = orderCards[i];
        card.classList.add('touchable');
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px) scale(0.95)';
        card.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

        await new Promise(resolve => setTimeout(resolve, 100));

        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
    }

    console.log('✅ Заказы отрендерены с премиальной анимацией:', orders.length);

    // ПЕРЕСЧЕТ ВЫСОТЫ ПОСЛЕ РЕНДЕРИНГА
    setTimeout(() => {
        autoResizeElements();
    }, 300);
}

function createOrderHTML(order) {
    const itemsHTML = order.items && order.items.length > 0 ? `
        <div class="order-items">
            <div class="order-items-title">📦 Товары в заказе:</div>
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
            🚚 ${escapeHtml(order.delivery.type || 'Доставка')} ${order.delivery.address ? '• ' + escapeHtml(order.delivery.address) : ''}
        </div>
    ` : '';

    const statusIcon = getStatusIcon(order.status);
    const statusClass = getStatusClass(order.status);
    const statusText = getStatusText(order.status);

    return `
        <div class="order-card touchable">
            <div class="order-header">
                <div>
                    <div class="order-number">Заказ ${escapeHtml(order.cdekNumber || order.id)}</div>
                    <div class="order-date">${formatDate(order.createdAt)}</div>
                </div>
                <div class="order-status ${statusClass}">
                    <span class="status-icon">${statusIcon}</span>
                    <span>${statusText}</span>
                </div>
            </div>
            
            ${itemsHTML}
            
            <div class="order-total">
                <div class="total-label">💰 Итого к оплате:</div>
                <div class="total-amount">${formatPrice(order.amount || 0)}</div>
            </div>
            
            ${deliveryHTML}
            
            ${order.recipient ? `
                <div class="recipient-info">
                    👤 ${escapeHtml(order.recipient.name)} • 📱 ${escapeHtml(order.recipient.phone)}
                </div>
            ` : ''}
        </div>
    `;
}

// === ОБРАБОТЧИКИ СОБЫТИЙ ===

async function setupEventListeners() {
    return new Promise((resolve) => {
        // Премиальное обновление заказов
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                addPremiumButtonAnimation(refreshBtn);

                const icon = refreshBtn.querySelector('.refresh-icon');
                if (icon) {
                    icon.style.animation = 'spin 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    setTimeout(() => {
                        icon.style.animation = '';
                    }, 600);
                }

                loadOrders();
            });
        }

        // Премиальное сохранение профиля
        if (DOM.userInfoForm) {
            DOM.userInfoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveUserInfoWithPremiumAnimation();
            });

            const inputs = DOM.userInfoForm.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('blur', debounce(saveUserInfo, 1000));

                input.addEventListener('focus', (e) => {
                    e.target.style.animation = 'premiumInputFocus 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    setTimeout(() => {
                        e.target.style.animation = '';
                    }, 300);
                });
            });
        }

        // Премиальные переключатели настроек
        const toggles = document.querySelectorAll('.toggle input');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const slider = e.target.nextElementSibling;
                if (slider) {
                    const animation = e.target.checked ?
                        'premiumSwitchOn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)' :
                        'premiumSwitchOff 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    slider.style.animation = animation;

                    setTimeout(() => {
                        slider.style.animation = '';
                    }, 300);
                }

                saveSettings();
                showNotification('⚙️ Настройки сохранены', 'success');
            });
        });

        // Кнопки действий
        setupActionButtons();

        // Загружаем сохраненные данные
        loadSettings();

        // Слушаем обновления заказов
        window.addEventListener('ordersUpdated', (e) => {
            console.log('📦 Получено событие обновления заказов:', e.detail);
            if (currentTab === 'orders' && !isLoading) {
                setTimeout(() => loadOrders(), 500);
            }
            updateOrdersBadge();
        });

        resolve();
    });
}

// === ПРЕМИАЛЬНОЕ СОХРАНЕНИЕ ПРОФИЛЯ ===

function saveUserInfoWithPremiumAnimation() {
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.style.animation = 'premiumHaptic 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        saveBtn.style.transform = 'scale(0.98) translateY(1px)';

        setTimeout(() => {
            saveBtn.style.transform = '';
            saveBtn.style.animation = '';

            saveUserInfo();

            const originalContent = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span>✅</span><span>Сохранено!</span>';
            saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            saveBtn.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
            saveBtn.style.transform = 'scale(1.02)';

            setTimeout(() => {
                saveBtn.innerHTML = originalContent;
                saveBtn.style.background = '';
                saveBtn.style.boxShadow = '';
                saveBtn.style.transform = '';
            }, 2500);
        }, 150);
    } else {
        saveUserInfo();
    }
}

// === УПРАВЛЕНИЕ ДАННЫМИ ПОЛЬЗОВАТЕЛЯ ===

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
        showNotification('💾 Информация сохранена!', 'success');
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showNotification('❌ Ошибка сохранения', 'error');
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
            addPremiumButtonAnimation(clearCartBtn);

            showConfirm(
                'Очистить корзину?',
                'Все товары будут удалены из корзины',
                () => {
                    try {
                        if (window.CartManager) {
                            window.CartManager.clearCart();
                        } else {
                            localStorage.removeItem('cartData');
                        }

                        // Обновляем бейдж корзины
                        window.dispatchEvent(new CustomEvent('cartUpdated'));

                        showNotification('🛒 Корзина очищена', 'success');
                    } catch (error) {
                        console.error('❌ Ошибка очистки корзины:', error);
                        showNotification('❌ Ошибка очистки', 'error');
                    }
                }
            );
        });
    }

    // Экспорт данных
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            addPremiumButtonAnimation(exportDataBtn);
            exportUserData();
        });
    }

    // Очистка истории
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            addPremiumButtonAnimation(clearHistoryBtn);

            showConfirm(
                'Удалить всю историю?',
                'Это действие необратимо. Все данные о заказах будут удалены.',
                () => {
                    try {
                        if (window.OrderManager) {
                            window.OrderManager.clearOrders();
                        } else {
                            localStorage.removeItem('userOrders');
                        }

                        orders = [];
                        renderOrdersWithAnimation();
                        updateStats();
                        showNoOrdersState();
                        showNotification('🗑️ История очищена', 'success');
                    } catch (error) {
                        console.error('❌ Ошибка очистки истории:', error);
                        showNotification('❌ Ошибка очистки', 'error');
                    }
                }
            );
        });
    }
}

function addPremiumButtonAnimation(button) {
    if (!button) return;

    button.style.animation = 'premiumHaptic 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    button.style.transform = 'scale(0.97) translateY(1px)';

    setTimeout(() => {
        button.style.animation = '';
        button.style.transform = '';
    }, 150);
}

// === ЭКСПОРТ ДАННЫХ ===

function exportUserData() {
    try {
        const data = {
            userInfo: userInfo,
            orders: orders,
            settings: JSON.parse(localStorage.getItem('userSettings') || '{}'),
            stats: window.OrderManager ? window.OrderManager.getStats() : {},
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
        showNotification('📥 Данные экспортированы', 'success');
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        showNotification('❌ Ошибка экспорта', 'error');
    }
}

// === АВТОМАТИЧЕСКИЙ РАСЧЕТ ВЫСОТЫ БЛОКОВ ===

let isResizing = false;
let resizeTimeout = null;

function autoResizeElements() {
    if (isResizing) return;

    isResizing = true;
    console.log('📏 Пересчет высоты блоков...');

    // Сбрасываем все принудительные высоты
    document.querySelectorAll('.tab-content, .card, .order-card').forEach(el => {
        el.style.minHeight = '';
        el.style.height = '';
    });

    // Даем время на рендеринг
    requestAnimationFrame(() => {
        // Пересчитываем высоты табов
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const contentHeight = calculateContentHeight(activeTab);
            const minHeight = Math.max(contentHeight, 400);

            activeTab.style.minHeight = `${minHeight}px`;
            console.log(`📐 Высота активного таба (${activeTab.id}) установлена: ${minHeight}px`);
        }

        // Пересчитываем высоты карточек
        let cardCount = 0;
        document.querySelectorAll('.card').forEach(card => {
            const contentHeight = calculateContentHeight(card);
            if (contentHeight > 0) {
                card.style.minHeight = `${contentHeight + 20}px`;
                cardCount++;
            }
        });

        if (cardCount > 0) {
            console.log(`📐 Высота карточек пересчитана: ${cardCount} шт.`);
        }

        // Пересчитываем высоты заказов
        let orderCount = 0;
        document.querySelectorAll('.order-card').forEach(orderCard => {
            const contentHeight = calculateContentHeight(orderCard);
            if (contentHeight > 0) {
                orderCard.style.minHeight = `${contentHeight + 10}px`;
                orderCount++;
            }
        });

        if (orderCount > 0) {
            console.log(`📐 Высота заказов пересчитана: ${orderCount} шт.`);
        }

        setTimeout(() => {
            isResizing = false;
            console.log('✅ Пересчет высоты завершен');
        }, 100);
    });
}

function calculateContentHeight(element) {
    if (!element) return 0;

    // Сохраняем текущие стили
    const originalHeight = element.style.height;
    const originalMinHeight = element.style.minHeight;
    const originalMaxHeight = element.style.maxHeight;

    // Временно убираем ограничения высоты
    element.style.height = 'auto';
    element.style.minHeight = 'auto';
    element.style.maxHeight = 'none';

    // Получаем реальную высоту контента
    const scrollHeight = element.scrollHeight;
    const offsetHeight = element.offsetHeight;
    const computedHeight = Math.max(scrollHeight, offsetHeight);

    // Восстанавливаем стили
    element.style.height = originalHeight;
    element.style.minHeight = originalMinHeight;
    element.style.maxHeight = originalMaxHeight;

    return computedHeight;
}

function setupAutoResize() {
    // ResizeObserver для отслеживания изменений размера
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(entries => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }

            resizeTimeout = setTimeout(() => {
                if (!isResizing) {
                    autoResizeElements();
                }
            }, 300);
        });

        // Наблюдаем за изменениями в ключевых элементах
        document.querySelectorAll('.tab-content, .card, .orders-grid').forEach(el => {
            resizeObserver.observe(el);
        });

        console.log('👁️ ResizeObserver установлен');
    }

    // Обработчик изменения размера окна
    window.addEventListener('resize', debounce(() => {
        if (!isResizing) {
            autoResizeElements();
        }
    }, 500));

    // Обработчик изменения ориентации на мобильных
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (!isResizing) {
                autoResizeElements();
            }
        }, 500);
    });
}

function initializeAutoResize() {
    // Первоначальный расчет
    setTimeout(() => {
        autoResizeElements();
    }, 500);

    // Повторный расчет через 2 секунды (когда все загрузится)
    setTimeout(() => {
        autoResizeElements();
    }, 2000);

    // Настройка наблюдателей
    setupAutoResize();

    console.log('📏 Система автоматического изменения размера инициализирована');
}

// Принудительный пересчет при переключении табов
function forceResizeAfterTabSwitch() {
    setTimeout(() => {
        autoResizeElements();
    }, 100);
}

// === ПРЕМИАЛЬНАЯ СТАТИСТИКА ===

function updateStats() {
    // Премиальное анимированное обновление счетчика заказов
    if (DOM.totalOrders) {
        animateCounterPremium(DOM.totalOrders, orders.length);
    }

    if (DOM.memberSince) {
        const oldestOrder = orders.length > 0 ?
            orders.reduce((oldest, order) => {
                const orderDate = new Date(order.createdAt);
                return orderDate < oldest ? orderDate : oldest;
            }, new Date()) : new Date();

        const year = oldestOrder.getFullYear();
        animateCounterPremium(DOM.memberSince, year);
    }

    if (DOM.orderStatus) {
        let status = 'Новый';
        if (orders.length >= 10) status = 'VIP';
        else if (orders.length >= 3) status = 'Активный';
        else if (orders.length > 0) status = 'Клиент';

        DOM.orderStatus.textContent = status;

        DOM.orderStatus.style.animation = 'premiumPopIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        setTimeout(() => {
            DOM.orderStatus.style.animation = '';
        }, 600);
    }
}

function animateCounterPremium(element, target) {
    if (!element) return;

    const start = parseInt(element.textContent) || 0;
    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = Math.floor(start + (target - start) * easeOutCubic(progress));
        element.textContent = current;

        if (progress < 1) {
            const scale = 1 + Math.sin(progress * Math.PI) * 0.05;
            element.style.transform = `scale(${scale})`;
            element.style.filter = `brightness(${1 + Math.sin(progress * Math.PI) * 0.1})`;
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

// === ОБНОВЛЕНИЕ БЕЙДЖА ЗАКАЗОВ ===

function updateOrdersBadge() {
    try {
        let count = 0;

        if (window.OrderManager) {
            count = window.OrderManager.getOrdersCount();
        } else {
            const savedOrders = localStorage.getItem('userOrders');
            const orders = savedOrders ? JSON.parse(savedOrders) : [];
            count = orders.length;
        }

        // Обновляем все бейджи заказов через headerManager
        if (window.headerManager) {
            window.headerManager.setOrdersCount(count);
        }

        // Fallback обновление
        const badges = document.querySelectorAll('.orders-badge');
        badges.forEach(badge => {
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';

                if (count > 0) {
                    badge.style.animation = 'badgePop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    setTimeout(() => {
                        badge.style.animation = '';
                    }, 300);
                }
            }
        });

    } catch (error) {
        console.warn('⚠️ Ошибка обновления бейджа заказов:', error);
    }
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getStatusIcon(status) {
    const iconMap = {
        'created': '🔄',
        'payment_success': '✅',
        'paid': '✅',
        'processing': '📦',
        'shipped': '🚚',
        'delivered': '🎉',
        'failed': '❌',
        'payment_failed': '❌',
        'payment_success_cdek_failed': '⚠️'
    };
    return iconMap[status] || '❓';
}

function getStatusClass(status) {
    const statusMap = {
        'created': 'created',
        'payment_success': 'paid',
        'paid': 'paid',
        'processing': 'processing',
        'shipped': 'shipped',
        'delivered': 'delivered',
        'failed': 'failed',
        'payment_failed': 'failed',
        'payment_success_cdek_failed': 'failed'
    };
    return statusMap[status] || 'created';
}

function getStatusText(status) {
    const statusMap = {
        'created': 'Создан',
        'payment_success': 'Оплачен',
        'paid': 'Оплачен',
        'processing': 'В обработке',
        'shipped': 'Отправлен',
        'delivered': 'Доставлен',
        'failed': 'Ошибка',
        'payment_failed': 'Ошибка оплаты',
        'payment_success_cdek_failed': 'Проблема с доставкой'
    };
    return statusMap[status] || 'В обработке';
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

// === ПРЕМИАЛЬНЫЕ УВЕДОМЛЕНИЯ ===

function showNotification(message, type = 'info', duration = 3500) {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 16px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    const notificationId = 'notification-' + Date.now();
    notification.id = notificationId;

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
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-left: 4px solid ${colors[type]};
        border-radius: 16px;
        padding: 20px 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 14px;
        transform: translateX(400px);
        transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        pointer-events: auto;
        max-width: 380px;
        min-width: 320px;
        animation: premiumNotificationSlide 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;

    notification.innerHTML = `
        <span style="font-size: 1.3em; color: ${colors[type]};">${icons[type]}</span>
        <span style="flex: 1; color: #1f2937; font-weight: 600; font-size: 0.95rem;">${escapeHtml(message)}</span>
        <button style="background: none; border: none; font-size: 1.3em; color: #9ca3af; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s ease;">&times;</button>
    `;

    container.appendChild(notification);

    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });

    const closeBtn = notification.querySelector('button');
    closeBtn.onclick = () => removeNotification(notification);
    closeBtn.onmouseenter = () => {
        closeBtn.style.background = 'rgba(156, 163, 175, 0.1)';
        closeBtn.style.color = '#6b7280';
    };
    closeBtn.onmouseleave = () => {
        closeBtn.style.background = 'none';
        closeBtn.style.color = '#9ca3af';
    };

    setTimeout(() => removeNotification(notification), duration);
}

function removeNotification(notification) {
    if (!notification || !notification.parentNode) return;

    notification.style.transform = 'translateX(400px) scale(0.95)';
    notification.style.opacity = '0';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 400);
}

// === ПРЕМИАЛЬНЫЙ ДИАЛОГ ПОДТВЕРЖДЕНИЯ ===

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
                <button class="confirm-btn cancel">Отмена</button>
                <button class="confirm-btn confirm">Подтвердить</button>
            </div>
        </div>
    `;

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
                background: rgba(0, 0, 0, 0.6);
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
                max-width: 420px;
                width: 90%;
                animation: premiumDialogBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .confirm-header {
                padding: 32px 32px 0;
            }
            
            .confirm-header h3 {
                margin: 0;
                font-size: 1.4rem;
                font-weight: 800;
                color: #1f2937;
                letter-spacing: -0.01em;
            }
            
            .confirm-body {
                padding: 16px 32px 32px;
            }
            
            .confirm-body p {
                margin: 0;
                color: #6b7280;
                line-height: 1.6;
                font-size: 1rem;
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
            
            .confirm-btn.cancel {
                background: rgba(243, 244, 246, 0.8);
                color: #6b7280;
                border: 2px solid rgba(229, 231, 235, 0.5);
            }
            
            .confirm-btn.cancel:hover {
                background: rgba(229, 231, 235, 0.9);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }
            
            .confirm-btn.confirm {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
            }
            
            .confirm-btn.confirm:hover {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
            }
            
            @keyframes premiumOverlaySlide {
                from { opacity: 0; backdrop-filter: blur(0px); }
                to { opacity: 1; backdrop-filter: blur(20px); }
            }
            
            @keyframes premiumDialogBounce {
                0% { opacity: 0; transform: scale(0.85) translateY(40px); }
                60% { opacity: 1; transform: scale(1.02) translateY(-8px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            
            @keyframes premiumFadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

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

    cancelBtn.focus();
}

// === ГЛОБАЛЬНЫЕ ФУНКЦИИ ===
window.loadOrders = loadOrders;
window.switchTab = switchTab;
window.showNotification = showNotification;
window.autoResizeElements = autoResizeElements; // Для отладки
window.forceShowActiveTab = forceShowActiveTab; // Для отладки

// Функция для отладки - добавляет визуальные индикаторы
window.debugTabs = function() {
    console.log('🔧 Режим отладки табов включен');
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('debug-visible');
        console.log(`📊 Таб ${tab.id}:`, {
            display: getComputedStyle(tab).display,
            opacity: getComputedStyle(tab).opacity,
            visibility: getComputedStyle(tab).visibility,
            height: tab.offsetHeight,
            scrollHeight: tab.scrollHeight
        });
    });
};

// Добавляем недостающие CSS анимации
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes premiumFadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
    
    @keyframes premiumEmptyStateSlide {
        from { opacity: 0; transform: translateY(40px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    
    @keyframes premiumFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    }
    
    @keyframes premiumPopIn {
        0% { transform: scale(0.8); opacity: 0; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes premiumInputFocus {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    @keyframes premiumSwitchOn {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes premiumSwitchOff {
        0% { transform: scale(1); }
        50% { transform: scale(0.9); }
        100% { transform: scale(1); }
    }
    
    @keyframes premiumHaptic {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes badgePop {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    @keyframes premiumNotificationSlide {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(additionalStyles);

console.log('🎉 Премиальный профиль готов к использованию!');