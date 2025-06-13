/* === PROFILE.JS - ОБНОВЛЕННАЯ ВЕРСИЯ С РЕАЛЬНЫМИ ЗАКАЗАМИ === */

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
    console.log('🚀 Премиальный профиль загружается...');

    initializePage();
    setupMutationObserver();

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

    if (!ordersTab) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Вкладка orders не найдена!');
        return;
    }

    const computedStyle = window.getComputedStyle(ordersTab);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
        console.log('🚨 ПРИНУДИТЕЛЬНОЕ ИСПРАВЛЕНИЕ!');
        nuclearTabFix();
    } else {
        console.log('✅ Табы работают корректно');
    }
}

// Ядерный способ исправления табов
function nuclearTabFix() {
    console.log('💥 ЯДЕРНОЕ ИСПРАВЛЕНИЕ ТАБОВ!');

    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.removeAttribute('style');
        tab.classList.remove('active');
    });

    const ordersTab = document.getElementById('orders');
    if (ordersTab) {
        ordersTab.classList.add('active');
        ordersTab.setAttribute('style', 'display: block !important; visibility: visible !important; opacity: 1 !important;');
    }

    const ordersBtn = document.querySelector('[data-tab="orders"]');
    if (ordersBtn) {
        ordersBtn.classList.add('active');
    }

    addEmergencyCSS();
}

// Добавляем экстренные CSS правила
function addEmergencyCSS() {
    const emergencyStyle = document.createElement('style');
    emergencyStyle.id = 'emergency-tab-fix';
    emergencyStyle.innerHTML = `
        #orders.active {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .tab-content:not(.active) {
            display: none !important;
        }
        
        .tab-content.active {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    `;

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
        cacheDOMElements();
        loadHeader();
        initTabs();
        loadUserData();
        setupEventListeners();
        addTouchableClasses();

        if (currentTab === 'orders') {
            setTimeout(() => loadOrders(), 500);
        }

        initializeAutoResize();

        console.log('✅ Премиальный профиль инициализирован');
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

// Добавляем touchable классы
function addTouchableClasses() {
    const touchableElements = [
        '.hero-card',
        '.stat-item',
        '.order-card',
        '.setting-item',
        '.card'
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

// Загрузка хедера
function loadHeader() {
    fetch('/header.html')
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

    showFirstTab();
}

function switchTab(tabId) {
    if (currentTab === tabId) return;

    console.log('🔄 Премиальное переключение на:', tabId);
    switchTabWithAnimation(tabId);
}

function switchTabWithAnimation(tabId) {
    const currentTabElement = document.getElementById(currentTab);

    if (currentTabElement) {
        currentTabElement.style.animation = 'premiumFadeOut 0.2s ease-out';

        setTimeout(() => {
            DOM.tabButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabId);
            });

            DOM.tabContents.forEach(content => {
                if (content.id === tabId) {
                    content.classList.add('active');
                    content.style.display = 'block';
                    content.style.animation = 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                } else {
                    content.classList.remove('active');
                    content.style.display = 'none';
                    content.style.animation = '';
                }
            });

            currentTab = tabId;

            if (tabId === 'orders') {
                loadOrders();
            }
        }, 200);
    }
}

function showFirstTab() {
    DOM.tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    const ordersTab = document.getElementById('orders');
    if (ordersTab) {
        ordersTab.style.display = 'block';
        ordersTab.classList.add('active');
        ordersTab.style.animation = 'fadeInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        console.log('🎯 Первая вкладка показана с премиальной анимацией');
    }

    DOM.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === 'orders');
    });
}

// === ЗАГРУЗКА ЗАКАЗОВ ===

async function loadOrders() {
    try {
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
            // Fallback на localStorage
            const savedOrders = localStorage.getItem('userOrders');
            orders = savedOrders ? JSON.parse(savedOrders) : [];
        }

        hideLoadingState();

        if (orders.length === 0) {
            showNoOrdersState();
        } else {
            renderOrdersWithAnimation();
        }

        updateStats();

    } catch (error) {
        console.error('❌ Ошибка загрузки заказов:', error);
        showErrorState();
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
            <div style="text-align: center; padding: 80px 20px; color: white; animation: premiumEmptyStateSlide 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                <div style="font-size: 3.5em; margin-bottom: 24px; animation: premiumFloat 3s ease-in-out infinite; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));">⚠️</div>
                <h3 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 16px; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">Ошибка загрузки</h3>
                <p style="font-size: 1.2rem; margin-bottom: 32px; opacity: 0.9;">Попробуйте обновить страницу</p>
                <button onclick="loadOrders()" class="refresh-btn" style="margin-top: 20px;">
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
    orderCards.forEach((card, index) => {
        card.classList.add('touchable');
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.animation = 'premiumCardSlideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both';
    });

    console.log('✅ Заказы отрендерены с премиальной анимацией:', orders.length);

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
        <div class="order-card touchable">
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

// === ОБРАБОТЧИКИ СОБЫТИЙ ===

function setupEventListeners() {
    // Премиальное обновление заказов
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // Премиальная анимация кнопки
            refreshBtn.style.transform = 'scale(0.95)';
            refreshBtn.style.filter = 'brightness(1.1)';

            const icon = refreshBtn.querySelector('.refresh-icon');
            if (icon) {
                icon.style.animation = 'spin 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                setTimeout(() => {
                    icon.style.animation = '';
                }, 600);
            }

            setTimeout(() => {
                refreshBtn.style.transform = '';
                refreshBtn.style.filter = '';
            }, 150);

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
            showNotification('Настройки сохранены', 'success');
        });
    });

    // Кнопки действий
    setupActionButtons();

    // Загружаем сохраненные данные
    loadSettings();

    // Слушаем обновления заказов
    window.addEventListener('ordersUpdated', (e) => {
        console.log('📦 Получено событие обновления заказов:', e.detail);
        if (currentTab === 'orders') {
            loadOrders();
        }
        updateOrdersBadge();
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

function addPremiumButtonAnimation(button) {
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

let isResizing = false;

function autoResizeElements() {
    if (isResizing) return;

    isResizing = true;

    function calculateRequiredHeight(element) {
        if (!element) return 0;

        const originalHeight = element.style.height;
        const originalMinHeight = element.style.minHeight;
        const originalMaxHeight = element.style.maxHeight;

        element.style.height = 'auto';
        element.style.minHeight = 'auto';
        element.style.maxHeight = 'none';

        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        const requiredHeight = Math.max(scrollHeight, clientHeight);

        element.style.height = originalHeight;
        element.style.minHeight = originalMinHeight;
        element.style.maxHeight = originalMaxHeight;

        return requiredHeight;
    }

    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        const requiredHeight = calculateRequiredHeight(tab);
        if (requiredHeight > 0) {
            tab.style.minHeight = `${requiredHeight + 20}px`;
        }
    });

    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const requiredHeight = calculateRequiredHeight(card);
        if (requiredHeight > 0) {
            card.style.minHeight = `${requiredHeight + 10}px`;
        }
    });

    setTimeout(() => {
        isResizing = false;
    }, 500);
}

function setupAutoResize() {
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            setTimeout(() => {
                if (!isResizing) {
                    autoResizeElements();
                }
            }, 200);
        });

        document.querySelectorAll('.tab-content, .card').forEach(el => {
            resizeObserver.observe(el);
        });
    }

    window.addEventListener('resize', debounce(() => {
        if (!isResizing) {
            autoResizeElements();
        }
    }, 500));
}

function initializeAutoResize() {
    setTimeout(() => {
        if (!isResizing) {
            autoResizeElements();
        }
    }, 500);

    setTimeout(() => {
        if (!isResizing) {
            autoResizeElements();
        }
    }, 2000);

    setupAutoResize();
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

        // Обновляем все бейджи заказов
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

function getStatusClass(status) {
    const statusMap = {
        'created': 'created',
        'payment_success': 'paid',
        'payment_success_cdek_failed': 'failed',
        'failed': 'failed'
    };
    return statusMap[status] || 'created';
}

function getStatusText(status) {
    const statusMap = {
        'created': 'Создан',
        'payment_success': 'Оплачен',
        'payment_success_cdek_failed': 'Ошибка доставки',
        'failed': 'Ошибка'
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

// Добавляем недостающую анимацию
const premiumFadeOutKeyframes = `
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
`;

if (!document.getElementById('premium-fadeout-keyframes')) {
    const style = document.createElement('style');
    style.id = 'premium-fadeout-keyframes';
    style.textContent = premiumFadeOutKeyframes;
    document.head.appendChild(style);
}

// === ГЛОБАЛЬНЫЕ ФУНКЦИИ ===
window.loadOrders = loadOrders;
window.switchTab = switchTab;
window.showNotification = showNotification;

console.log('🎉 Премиальный профиль готов к использованию!');