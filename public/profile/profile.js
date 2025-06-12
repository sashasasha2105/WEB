/* === PROFILE.JS - ОСНОВНАЯ ЛОГИКА СТРАНИЦЫ === */

// Состояние приложения
let currentTab = 'orders';
let orders = [];
let userInfo = {};
let isLoading = false;

// DOM элементы (кешированные)
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

// Утилиты
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Главная инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌊 Liquid Glass Profile загружается...');

    initializePage();
});

function initializePage() {
    try {
        // Критический путь
        cacheDOMElements();
        initTabs();
        showFirstTab();
        loadUserInfo();
        updateCartBadge();

        // Инициализация хедера
        initHeader();

        // Отложенная инициализация
        setTimeout(() => {
            initEventListeners();
            loadOrdersDeferred();
            initAdvancedFeatures();
        }, 100);

        console.log('✅ Страница инициализирована');
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showErrorState();
    }
}

// Кеширование DOM элементов
function cacheDOMElements() {
    DOM.tabButtons = document.querySelectorAll('.tab-button');
    DOM.tabContents = document.querySelectorAll('.tab-content');
    DOM.ordersContainer = document.getElementById('ordersContainer');
    DOM.ordersLoading = document.getElementById('ordersLoading');
    DOM.noOrdersMessage = document.getElementById('noOrdersMessage');
    DOM.userInfoForm = document.getElementById('userInfoForm');
    DOM.totalOrders = document.getElementById('totalOrders');
    DOM.memberSince = document.getElementById('memberSince');
    DOM.orderStatus = document.getElementById('orderStatus');

    console.log('📋 DOM элементы кешированы');
}

// Инициализация хедера
function initHeader() {
    fetch('/header.html')
        .then(response => {
            if (!response.ok) throw new Error('Header загрузка неудачна');
            return response.text();
        })
        .then(html => {
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = html;
                const header = document.getElementById('site-header');
                if (header) {
                    header.classList.add('scrolled');
                }

                // Инициализация CartManager
                setTimeout(() => {
                    if (window.CartManager) {
                        window.CartManager.updateCartCounter();
                        console.log('✅ CartManager инициализирован');
                    }
                }, 100);
            }
        })
        .catch(error => {
            console.warn('⚠️ Ошибка загрузки header:', error);
            // Создаем минимальный header
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = '<div style="height: 60px; background: rgba(255,255,255,0.1); backdrop-filter: blur(20px);"></div>';
            }
        });
}

// === УПРАВЛЕНИЕ ВКЛАДКАМИ ===

function initTabs() {
    if (!DOM.tabButtons) return;

    DOM.tabButtons.forEach((btn, index) => {
        btn.addEventListener('click', throttle(() => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        }, 200));
    });

    console.log('🔄 Вкладки инициализированы');
}

function switchTab(tabId) {
    if (currentTab === tabId || isLoading) return;

    console.log('🔄 Переключение на вкладку:', tabId);

    // Обновляем кнопки
    updateTabButtons(tabId);

    // Переключаем контент
    animateTabSwitch(tabId);

    currentTab = tabId;

    // Загружаем данные если нужно
    if (tabId === 'orders' && orders.length === 0) {
        loadOrders();
    }
}

function updateTabButtons(activeTabId) {
    DOM.tabButtons.forEach(btn => {
        const isActive = btn.dataset.tab === activeTabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });
}

function animateTabSwitch(tabId) {
    // Скрываем все вкладки
    DOM.tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    // Показываем нужную вкладку
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
    }
}

function showFirstTab() {
    const firstTab = document.getElementById('orders');
    if (firstTab) {
        firstTab.style.display = 'block';
        firstTab.classList.add('active');
        console.log('🎯 Первая вкладка показана');
    }
}

// === ЗАГРУЗКА ЗАКАЗОВ ===

async function loadOrders() {
    if (isLoading) return;

    isLoading = true;
    console.log('📦 Загрузка заказов...');

    try {
        showLoadingState();

        // Имитация загрузки
        await new Promise(resolve => setTimeout(resolve, 1200));

        orders = await createDemoOrders();
        console.log('📋 Загружены заказы:', orders.length);

        hideLoadingState();

        if (orders.length === 0) {
            showNoOrdersState();
        } else {
            await renderOrders();
        }

        updateStats();

    } catch (error) {
        console.error('❌ Ошибка загрузки заказов:', error);
        showErrorState();
    } finally {
        isLoading = false;
    }
}

function loadOrdersDeferred() {
    setTimeout(() => {
        if (currentTab === 'orders') {
            loadOrders();
        }
    }, 500);
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
            <div class="error-state" style="text-align: center; padding: 60px 20px; color: var(--liquid-text-secondary);">
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

// === РЕНДЕРИНГ ЗАКАЗОВ ===

async function renderOrders() {
    if (!DOM.ordersContainer) return;

    DOM.ordersContainer.innerHTML = '';

    if (orders.length === 0) {
        showNoOrdersState();
        return;
    }

    // Рендерим заказы батчами
    const batchSize = 3;

    for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        const batchHTML = batch.map((order, index) => createOrderCardHTML(order, i + index)).join('');

        DOM.ordersContainer.insertAdjacentHTML('beforeend', batchHTML);

        // Даем браузеру время на рендеринг
        if (i + batchSize < orders.length) {
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
    }

    // Добавляем интерактивность
    addOrderCardsInteractivity();

    console.log('✅ Заказы отрендерены:', orders.length);
}

function createOrderCardHTML(order, index) {
    const itemsHTML = order.items && order.items.length > 0 ? `
        <div class="order-items-modern">
            <div class="order-items-title">Товары в заказе:</div>
            ${order.items.map(item => `
                <div class="order-item-modern">
                    <span class="item-name-modern">${escapeHtml(item.name)}</span>
                    <span class="item-price-modern">${formatPrice(item.cost || 0)}</span>
                </div>
            `).join('')}
        </div>
    ` : '';

    const deliveryHTML = order.delivery ? `
        <div class="delivery-info-compact">
            📦 ${escapeHtml(order.delivery.type || 'Доставка')} ${order.delivery.address ? '• ' + escapeHtml(order.delivery.address) : ''}
        </div>
    ` : '';

    return `
        <div class="order-card-modern" style="animation-delay: ${index * 0.1}s" data-order-id="${order.id}">
            <div class="order-header-modern">
                <div>
                    <div class="order-number-modern">Заказ ${escapeHtml(order.cdekNumber || order.id)}</div>
                    <div class="order-date-modern">${formatDate(order.createdAt)}</div>
                </div>
                <div class="order-status-modern ${getStatusClass(order.status)}">
                    ${getStatusText(order.status)}
                </div>
            </div>
            
            ${itemsHTML}
            
            <div class="order-total-modern">
                <div class="total-label">Итого к оплате:</div>
                <div class="total-amount">${formatPrice(order.amount || 0)}</div>
            </div>
            
            ${deliveryHTML}
        </div>
    `;
}

function addOrderCardsInteractivity() {
    const cards = document.querySelectorAll('.order-card-modern');
    cards.forEach(card => {
        card.addEventListener('click', function(event) {
            createRippleEffect(this, event);
        });
    });
}

// === СОЗДАНИЕ ДЕМО ДАННЫХ ===

async function createDemoOrders() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                {
                    id: 'LG-2025-001',
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
                    id: 'LG-2025-002',
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
                    id: 'LG-2025-003',
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
            ]);
        }, 100);
    });
}

// === ОБРАБОТЧИКИ СОБЫТИЙ ===

function initEventListeners() {
    // Обновление заказов
    const refreshBtn = document.getElementById('refreshOrdersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', throttle(() => {
            const icon = refreshBtn.querySelector('.refresh-icon');
            if (icon) {
                icon.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    icon.style.transform = '';
                }, 500);
            }
            loadOrders();
        }, 1000));
    }

    // Сохранение информации пользователя
    if (DOM.userInfoForm) {
        DOM.userInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveUserInfo();
        });

        // Автосохранение
        const inputs = DOM.userInfoForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', debounce(() => {
                saveUserInfo();
            }, 1000));
        });
    }

    // Переключатели настроек
    const settingToggles = document.querySelectorAll('.modern-toggle input');
    settingToggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            saveSettings();

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }

            // Визуальная анимация
            const slider = toggle.nextElementSibling;
            if (slider) {
                slider.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    slider.style.transform = '';
                }, 150);
            }
        });
    });

    // Кнопки действий
    setupActionButtons();

    // Загружаем настройки
    loadSettings();

    console.log('🎯 Обработчики событий инициализированы');
}

// === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЬСКОЙ ИНФОРМАЦИЕЙ ===

function loadUserInfo() {
    try {
        const savedInfo = localStorage.getItem('userInfo');
        if (savedInfo) {
            userInfo = JSON.parse(savedInfo);
            fillUserInfoForm();
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки информации:', error);
    }
}

function fillUserInfoForm() {
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

        // Анимация кнопки
        const saveBtn = document.querySelector('.save-button');
        if (saveBtn) {
            const originalContent = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span>✅</span><span>Сохранено!</span>';
            saveBtn.style.background = '#34C759';

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
        'emailNotifications', 'smsNotifications', 'marketingEmails',
        'publicProfile', 'analytics', 'darkMode', 'twoFactorAuth'
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
        exportDataBtn.addEventListener('click', throttle(() => {
            exportUserData();
        }, 2000));
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

// === ОБНОВЛЕНИЕ СТАТИСТИКИ ===

function updateStats() {
    animateNumber(DOM.totalOrders, orders.length);

    if (DOM.memberSince) {
        DOM.memberSince.textContent = new Date().getFullYear();
    }

    if (DOM.orderStatus) {
        let status = 'Новичок';
        if (orders.length >= 10) status = 'VIP';
        else if (orders.length >= 3) status = 'Постоянный';
        else if (orders.length > 0) status = 'Клиент';

        const currentStatus = DOM.orderStatus.textContent;
        if (currentStatus !== status) {
            DOM.orderStatus.style.opacity = '0';
            setTimeout(() => {
                DOM.orderStatus.textContent = status;
                DOM.orderStatus.style.opacity = '1';
            }, 300);
        }
    }
}

function animateNumber(element, target) {
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
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
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
                badge.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    badge.style.transform = '';
                }, 200);
            }
        });
    } catch (error) {
        console.warn('⚠️ Ошибка обновления корзины:', error);
    }
}

// === ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ===

function initAdvancedFeatures() {
    // Lazy loading для изображений
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Анимации при скролле
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    const animatedElements = document.querySelectorAll(
        '.profile-hero, .stat-modern, .order-card-modern, .modern-card, .setting-item-modern'
    );

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    console.log('🚀 Дополнительные функции инициализированы');
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

// === ЭФФЕКТЫ ===

function createRippleEffect(element, event) {
    if (!element || !event) return;

    try {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.className = 'liquid-ripple';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%);
            transform: translate(${x}px, ${y}px) scale(0);
            animation: liquidRipple 0.6s ease-out;
            pointer-events: none;
            z-index: 100;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        // Очистка после анимации
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    } catch (error) {
        console.warn('⚠️ Ошибка создания ripple:', error);
    }
}

// === УВЕДОМЛЕНИЯ ===

function showNotification(message, type = 'info', duration = 4000) {
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

    notification.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.6);
        border-radius: 16px;
        padding: 16px 20px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        transform: translateX(400px);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        max-width: 350px;
    `;

    const icons = {
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌'
    };

    const colors = {
        success: '#32D74B',
        info: '#0A84FF',
        warning: '#FFD60A',
        error: '#FF453A'
    };

    notification.innerHTML = `
        <span style="font-size: 1.2em; color: ${colors[type]};">${icons[type]}</span>
        <span style="flex: 1; color: #1c1c1e; font-weight: 500;">${escapeHtml(message)}</span>
        <button style="background: none; border: none; font-size: 1.2em; color: #8e8e93; cursor: pointer; padding: 0;">&times;</button>
    `;

    container.appendChild(notification);

    // Анимация появления
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });

    // Закрытие
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
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .confirm-dialog {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(32px);
                -webkit-backdrop-filter: blur(32px);
                border: 1px solid rgba(255, 255, 255, 0.8);
                border-radius: 24px;
                overflow: hidden;
                max-width: 400px;
                width: 90%;
                animation: slideUp 0.3s ease;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            }
            
            .confirm-header {
                padding: 24px 24px 0;
            }
            
            .confirm-header h3 {
                margin: 0;
                font-size: 1.3em;
                font-weight: 700;
                color: #1c1c1e;
            }
            
            .confirm-body {
                padding: 12px 24px 24px;
            }
            
            .confirm-body p {
                margin: 0;
                color: #3a3a3c;
                line-height: 1.5;
            }
            
            .confirm-actions {
                display: flex;
                gap: 12px;
                padding: 0 24px 24px;
            }
            
            .confirm-btn {
                flex: 1;
                padding: 14px 24px;
                border: none;
                border-radius: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 1em;
            }
            
            .confirm-btn.cancel {
                background: rgba(0, 0, 0, 0.05);
                color: #3a3a3c;
            }
            
            .confirm-btn.cancel:hover {
                background: rgba(0, 0, 0, 0.1);
                transform: translateY(-1px);
            }
            
            .confirm-btn.confirm {
                background: #FF453A;
                color: white;
            }
            
            .confirm-btn.confirm:hover {
                background: #FF6B5F;
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(255, 69, 58, 0.3);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(40px) scale(0.95);
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

    // Фокус на первой кнопке
    cancelBtn.focus();
}

// Добавляем CSS для ripple эффекта
if (!document.getElementById('ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
        @keyframes liquidRipple {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            100% {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// === ГЛОБАЛЬНЫЕ ФУНКЦИИ ===
window.loadOrders = loadOrders;
window.switchTab = switchTab;
window.showNotification = showNotification;

console.log('🌊 Liquid Glass Profile JavaScript загружен!');