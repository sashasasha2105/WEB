/* === LIQUID GLASS PROFILE.JS - ФИНАЛЬНАЯ ВЕРСИЯ === */
/* Полностью исправленная логика с улучшенными анимациями */

/* === Состояние приложения === */
let currentTab = 'orders';
let orders = [];
let userInfo = {};

/* === DOM элементы === */
const DOM = {
    tabButtons: null,
    tabContents: null,
    ordersContainer: null,
    ordersLoading: null,
    noOrdersMessage: null,
    userInfoForm: null,
    totalOrders: null,
    memberSince: null,
    orderStatus: null,
    tabNav: null
};

/* === Инициализация === */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌊 Liquid Glass Profile загружается...');

    cacheDOMElements();
    initLiquidTabs();
    loadUserInfo();
    initEventListeners();
    updateCartBadge();
    initLiquidAnimations();

    // Загружаем первую вкладку
    setTimeout(() => {
        loadOrders();
        updateTabIndicator();
    }, 100);

    console.log('✨ Liquid Glass Profile готов!');
});

/* === Кеширование DOM элементов === */
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
    DOM.tabNav = document.querySelector('.tab-nav');
}

/* === Liquid Glass управление вкладками === */
function initLiquidTabs() {
    DOM.tabButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchLiquidTab(tabId, index);
        });
    });
}

function switchLiquidTab(tabId, index) {
    console.log('🔄 Переключение на вкладку:', tabId);

    // Обновляем кнопки
    DOM.tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        }
    });

    // Скрываем все вкладки
    DOM.tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    // Показываем нужную вкладку с анимацией
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.style.display = 'block';
        // Форсируем reflow для анимации
        void targetTab.offsetWidth;
        targetTab.classList.add('active');
    }

    currentTab = tabId;

    // Обновляем индикатор
    updateTabIndicator(index);

    // Загружаем данные если нужно
    if (tabId === 'orders' && orders.length === 0) {
        loadOrders();
    }
}

/* === Liquid Glass индикатор активной вкладки === */
function updateTabIndicator(index = 0) {
    if (!DOM.tabNav) return;

    const activeButton = DOM.tabButtons[index];
    if (!activeButton) return;

    const navRect = DOM.tabNav.getBoundingClientRect();
    const btnRect = activeButton.getBoundingClientRect();

    const left = btnRect.left - navRect.left;
    const width = btnRect.width;

    // Обновляем позицию псевдоэлемента через CSS переменные
    DOM.tabNav.style.setProperty('--indicator-left', `${left}px`);
    DOM.tabNav.style.setProperty('--indicator-width', `${width}px`);
}

/* === Загрузка заказов с Liquid Glass анимацией === */
async function loadOrders() {
    if (!DOM.ordersLoading || !DOM.ordersContainer) return;

    console.log('📦 Загрузка заказов...');

    // Показываем загрузку
    DOM.ordersLoading.style.display = 'flex';
    if (DOM.noOrdersMessage) DOM.noOrdersMessage.style.display = 'none';
    DOM.ordersContainer.innerHTML = '';

    try {
        // Эмулируем загрузку
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await fetch('/api/orders').catch(() => null);

        if (response && response.ok) {
            orders = await response.json();
            console.log('📋 Получено заказов:', orders.length);
        } else {
            // Демо данные
            orders = createDemoOrders();
        }

        DOM.ordersLoading.style.display = 'none';

        if (orders.length === 0) {
            if (DOM.noOrdersMessage) DOM.noOrdersMessage.style.display = 'block';
        } else {
            renderLiquidOrders();
        }

        updateStats();

    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        DOM.ordersLoading.style.display = 'none';
        orders = createDemoOrders();
        renderLiquidOrders();
        updateStats();
    }
}

/* === Рендер заказов с Liquid Glass эффектом === */
function renderLiquidOrders() {
    if (!DOM.ordersContainer) return;

    DOM.ordersContainer.innerHTML = orders.map((order, index) => `
        <div class="order-card-modern" style="animation-delay: ${index * 0.1}s">
            <div class="order-header-modern">
                <div>
                    <div class="order-number-modern">Заказ ${order.cdekNumber || order.id}</div>
                    <div class="order-date-modern">${formatDate(order.createdAt)}</div>
                </div>
                <div class="order-status-modern ${getStatusClass(order.status)}">
                    ${getStatusText(order.status)}
                </div>
            </div>
            
            ${order.items && order.items.length > 0 ? `
                <div class="order-items-modern">
                    <div class="order-items-title">Товары в заказе:</div>
                    ${order.items.map(item => `
                        <div class="order-item-modern">
                            <span class="item-name-modern">${item.name}</span>
                            <span class="item-price-modern">${formatPrice(item.cost || 0)}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="order-total-modern">
                <div class="total-label">Итого к оплате:</div>
                <div class="total-amount">${formatPrice(order.amount || 0)}</div>
            </div>
            
            ${order.delivery ? `
                <div class="delivery-info-compact">
                    📦 ${order.delivery.type || 'Доставка'} ${order.delivery.address ? '• ' + order.delivery.address : ''}
                </div>
            ` : ''}
        </div>
    `).join('');

    // Добавляем интерактивность
    document.querySelectorAll('.order-card-modern').forEach(card => {
        card.addEventListener('click', function() {
            createLiquidRipple(this, event);
        });
    });
}

/* === Liquid Glass ripple эффект === */
function createLiquidRipple(element, event) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

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

    ripple.addEventListener('animationend', () => ripple.remove());
}

/* === Создание демо заказов === */
function createDemoOrders() {
    return [
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
        }
    ];
}

/* === Вспомогательные функции === */
function getStatusClass(status) {
    switch (status) {
        case 'created': return 'created';
        case 'payment_success_cdek_failed': return 'failed';
        default: return 'paid';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'created': return 'Создан';
        case 'payment_success_cdek_failed': return 'Ошибка';
        default: return 'Оплачен';
    }
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

/* === Обновление статистики с анимацией === */
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

        DOM.orderStatus.textContent = status;
    }
}

/* === Анимация чисел === */
function animateNumber(element, target) {
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

/* === Управление пользовательской информацией === */
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
        showLiquidNotification('Информация сохранена!', 'success');
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showLiquidNotification('Ошибка сохранения', 'error');
    }
}

/* === Настройки === */
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

/* === Обработчики событий === */
function initEventListeners() {
    // Обновление заказов
    const refreshBtn = document.getElementById('refreshOrdersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // Добавляем вращение иконки
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

    // Сохранение информации пользователя
    if (DOM.userInfoForm) {
        DOM.userInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveUserInfo();
        });
    }

    // Переключатели настроек
    const settingToggles = document.querySelectorAll('.modern-toggle input');
    settingToggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            saveSettings();
            // Добавляем haptic feedback эффект
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        });
    });

    // Кнопки действий
    setupActionButtons();

    // Загружаем настройки
    loadSettings();

    // Liquid Glass эффекты при наведении
    addLiquidHoverEffects();

    // Обработка изменения размера окна
    window.addEventListener('resize', debounce(() => {
        updateTabIndicator();
    }, 300));
}

/* === Настройка кнопок действий === */
function setupActionButtons() {
    // Очистка корзины
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            showLiquidConfirm(
                'Очистить корзину?',
                'Все товары будут удалены из корзины',
                () => {
                    localStorage.removeItem('cartData');
                    updateCartBadge();
                    showLiquidNotification('Корзина очищена', 'success');
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
            showLiquidConfirm(
                'Удалить всю историю?',
                'Это действие необратимо. Все данные о заказах будут удалены.',
                () => {
                    orders = [];
                    renderLiquidOrders();
                    updateStats();
                    DOM.noOrdersMessage.style.display = 'block';
                    showLiquidNotification('История очищена', 'success');
                }
            );
        });
    }
}

/* === Liquid Glass hover эффекты === */
function addLiquidHoverEffects() {
    // Добавляем эффект всем интерактивным элементам
    const interactiveElements = document.querySelectorAll(
        '.stat-modern, .order-card-modern, .modern-card, .setting-item-modern, button, .tab-button'
    );

    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            createLiquidGlow(this, e);
        });
    });
}

/* === Liquid Glass свечение === */
function createLiquidGlow(element, event) {
    const glow = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    glow.style.cssText = `
        position: absolute;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        animation: liquidGlow 1s ease-out forwards;
        z-index: 100;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(glow);

    glow.addEventListener('animationend', () => glow.remove());
}

/* === Экспорт данных === */
function exportUserData() {
    try {
        const data = {
            userInfo: userInfo,
            orders: orders,
            settings: JSON.parse(localStorage.getItem('userSettings') || '{}'),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `liquid-glass-profile-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        showLiquidNotification('Данные экспортированы', 'success');
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        showLiquidNotification('Ошибка экспорта', 'error');
    }
}

/* === Liquid Glass диалог подтверждения === */
function showLiquidConfirm(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'liquid-dialog-overlay';
    overlay.innerHTML = `
        <div class="liquid-dialog">
            <div class="liquid-dialog-header">
                <h3>${title}</h3>
            </div>
            <div class="liquid-dialog-body">
                <p>${message}</p>
            </div>
            <div class="liquid-dialog-actions">
                <button class="liquid-btn cancel">Отмена</button>
                <button class="liquid-btn confirm">Подтвердить</button>
            </div>
        </div>
    `;

    // Стили для Liquid Glass диалога
    const style = document.createElement('style');
    style.textContent = `
        .liquid-dialog-overlay {
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
            animation: liquidFadeIn 0.3s ease;
        }
        
        .liquid-dialog {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(32px);
            -webkit-backdrop-filter: blur(32px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            border-radius: 24px;
            overflow: hidden;
            max-width: 400px;
            width: 90%;
            animation: liquidSlideUp 0.3s ease;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }
        
        .liquid-dialog-header {
            padding: 24px 24px 0;
        }
        
        .liquid-dialog-header h3 {
            margin: 0;
            font-size: 1.3em;
            font-weight: 700;
            color: #1c1c1e;
        }
        
        .liquid-dialog-body {
            padding: 12px 24px 24px;
        }
        
        .liquid-dialog-body p {
            margin: 0;
            color: #3a3a3c;
            line-height: 1.5;
        }
        
        .liquid-dialog-actions {
            display: flex;
            gap: 12px;
            padding: 0 24px 24px;
        }
        
        .liquid-btn {
            flex: 1;
            padding: 14px 24px;
            border: none;
            border-radius: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 1em;
        }
        
        .liquid-btn.cancel {
            background: rgba(0, 0, 0, 0.05);
            color: #3a3a3c;
        }
        
        .liquid-btn.cancel:hover {
            background: rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
        }
        
        .liquid-btn.confirm {
            background: #FF453A;
            color: white;
        }
        
        .liquid-btn.confirm:hover {
            background: #FF6B5F;
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(255, 69, 58, 0.3);
        }
        
        @keyframes liquidFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes liquidSlideUp {
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
    document.body.appendChild(overlay);

    // Обработчики
    const cancelBtn = overlay.querySelector('.liquid-btn.cancel');
    const confirmBtn = overlay.querySelector('.liquid-btn.confirm');

    function closeDialog() {
        overlay.style.animation = 'liquidFadeOut 0.3s ease forwards';
        overlay.querySelector('.liquid-dialog').style.animation = 'liquidSlideDown 0.3s ease forwards';
        setTimeout(() => {
            document.body.removeChild(overlay);
            document.head.removeChild(style);
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
}

/* === Liquid Glass анимации === */
function initLiquidAnimations() {
    // Intersection Observer для плавного появления
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Наблюдаем за элементами
    const animatedElements = document.querySelectorAll(
        '.profile-hero, .stat-modern, .order-card-modern, .modern-card'
    );

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Добавляем CSS для ripple эффекта
    if (!document.getElementById('liquid-animations')) {
        const style = document.createElement('style');
        style.id = 'liquid-animations';
        style.textContent = `
            @keyframes liquidRipple {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(4);
                    opacity: 0;
                }
            }
            
            @keyframes liquidGlow {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                50% {
                    opacity: 1;
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(2);
                }
            }
            
            @keyframes liquidFadeOut {
                to { opacity: 0; }
            }
            
            @keyframes liquidSlideDown {
                to {
                    transform: translateY(40px) scale(0.95);
                    opacity: 0;
                }
            }
            
            /* Индикатор вкладки */
            .tab-nav::before {
                left: var(--indicator-left, 6px);
                width: var(--indicator-width, 0);
            }
        `;
        document.head.appendChild(style);
    }
}

/* === Обновление счетчика корзины === */
function updateCartBadge() {
    try {
        let count = 0;

        if (window.CartManager) {
            count = window.CartManager.getTotalCount();
        } else {
            const cartData = JSON.parse(localStorage.getItem('cartData') || '{}');
            count = (cartData.cameraCount || 0) + (cartData.memoryCount || 0);
        }

        const badge = document.querySelector('.cart-count');
        if (badge) {
            badge.textContent = count;
        }
    } catch (error) {
        console.error('❌ Ошибка обновления корзины:', error);
    }
}

/* === Liquid Glass уведомления === */
function showLiquidNotification(message, type = 'info', duration = 4000) {
    let container = document.getElementById('liquid-notifications');
    if (!container) {
        container = document.createElement('div');
        container.id = 'liquid-notifications';
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
        <span style="flex: 1; color: #1c1c1e; font-weight: 500;">${message}</span>
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
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/* === Утилиты === */
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

/* === Глобальные функции === */
window.loadOrders = loadOrders;
window.switchLiquidTab = switchLiquidTab;

console.log('🌊 Liquid Glass Profile JavaScript загружен!');