/* File: public/profile/profile.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С ДИНАМИЧЕСКИМИ РАЗМЕРАМИ */

/* === Состояние приложения === */
let currentTab = 'orders';
let orders = [];
let userInfo = {};

/* === DOM элементы === */
const DOM = {
    // Кешируем элементы для производительности
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

/* === Инициализация === */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Загрузка новой страницы профиля...');

    cacheDOMElements();
    initTabs();
    loadUserInfo();
    initEventListeners();
    updateCartBadge();
    initAnimations();

    // ВАЖНО: Принудительно показываем контент первой вкладки
    setTimeout(() => {
        loadOrders(); // Загружаем заказы
        showActiveTabContent(); // Показываем активную вкладку
        adjustContainerHeight(); // Подстраиваем высоту
    }, 100);

    console.log('✅ Профиль полностью инициализирован');
});

/* === НОВАЯ ФУНКЦИЯ: Динамическая подстройка высоты контейнера === */
function adjustContainerHeight() {
    const contentWrapper = document.querySelector('.content-wrapper');
    const activeTab = document.querySelector('.tab-content.active');

    if (contentWrapper && activeTab) {
        // Убираем любые фиксированные высоты
        contentWrapper.style.minHeight = 'auto';
        activeTab.style.minHeight = 'auto';

        // Устанавливаем минимальную высоту на основе контента
        const contentHeight = activeTab.scrollHeight;
        console.log('📏 Высота контента:', contentHeight, 'px');

        // Добавляем немного отступа для комфорта
        const paddingBottom = 40;
        contentWrapper.style.minHeight = `${contentHeight + paddingBottom}px`;

        // Убеждаемся что контент полностью видим
        activeTab.style.height = 'auto';
        activeTab.style.overflow = 'visible';
    }
}

/* === Показать активную вкладку === */
function showActiveTabContent() {
    // Принудительно показываем контент активной вкладки
    const activeTab = document.querySelector('.tab-content.active') || document.querySelector('.tab-content');
    if (activeTab) {
        activeTab.style.display = 'block';
        activeTab.style.opacity = '1';
        activeTab.style.height = 'auto'; // ВАЖНО: разрешаем динамическую высоту
        activeTab.style.overflow = 'visible'; // ВАЖНО: показываем весь контент
        console.log('📋 Активная вкладка показана:', activeTab.id);
    }

    // Убеждаемся что неактивные вкладки скрыты
    document.querySelectorAll('.tab-content:not(.active)').forEach(tab => {
        if (!tab.classList.contains('active')) {
            tab.style.display = 'none';
        }
    });

    // Подстраиваем высоту после показа контента
    setTimeout(adjustContainerHeight, 100);
}

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

    console.log('📦 DOM элементы закешированы');
}

/* === Управление вкладками === */
function initTabs() {
    DOM.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    console.log('📋 Переключение на вкладку:', tabId);

    // Обновляем кнопки
    DOM.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Обновляем панели
    DOM.tabContents.forEach(content => {
        const isActive = content.id === tabId;

        if (isActive) {
            // Показываем новую вкладку
            content.classList.add('active');
            content.style.display = 'block';
            content.style.opacity = '1';
            content.style.height = 'auto'; // ВАЖНО: динамическая высота
            content.style.overflow = 'visible'; // ВАЖНО: показываем весь контент
            console.log('✅ Показана вкладка:', tabId);
        } else {
            // Скрываем неактивные вкладки
            content.classList.remove('active');
            content.style.display = 'none';
        }
    });

    currentTab = tabId;

    // Загружаем данные для вкладки если нужно
    if (tabId === 'orders' && orders.length === 0) {
        loadOrders();
    }

    // ВАЖНО: Подстраиваем высоту после смены вкладки
    setTimeout(adjustContainerHeight, 300);
}

/* === Загрузка и отображение заказов === */
async function loadOrders() {
    if (!DOM.ordersLoading || !DOM.ordersContainer) return;

    console.log('📦 Загрузка заказов...');

    // Показываем загрузку
    DOM.ordersLoading.style.display = 'flex';
    if (DOM.noOrdersMessage) DOM.noOrdersMessage.style.display = 'none';

    try {
        // Имитируем задержку загрузки для демонстрации
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await fetch('/api/orders').catch(() => null);

        if (response && response.ok) {
            orders = await response.json();
            console.log('📋 Получено заказов с сервера:', orders.length);
        } else {
            // Если сервер недоступен, создаем демо-данные
            console.log('📋 Сервер недоступен, создаем демо-заказы');
            orders = createDemoOrders();
        }

        // Скрываем загрузку
        DOM.ordersLoading.style.display = 'none';

        if (orders.length === 0) {
            // Показываем сообщение об отсутствии заказов
            if (DOM.noOrdersMessage) DOM.noOrdersMessage.style.display = 'block';
            DOM.ordersContainer.innerHTML = '';
            console.log('📋 Заказов нет, показываем пустое сообщение');
        } else {
            // Отображаем заказы
            if (DOM.noOrdersMessage) DOM.noOrdersMessage.style.display = 'none';
            renderOrders();
            console.log('📋 Заказы отображены:', orders.length);
        }

        // Обновляем статистику
        updateStats();

        // ВАЖНО: Подстраиваем высоту после загрузки заказов
        setTimeout(adjustContainerHeight, 100);

    } catch (error) {
        console.error('❌ Ошибка загрузки заказов:', error);

        // Скрываем загрузку и показываем демо-данные
        DOM.ordersLoading.style.display = 'none';
        orders = createDemoOrders();
        renderOrders();
        updateStats();

        showNotification('Показаны демо-данные (сервер недоступен)', 'info');

        // ВАЖНО: Подстраиваем высоту после ошибки
        setTimeout(adjustContainerHeight, 100);
    }
}

function renderOrders() {
    if (!DOM.ordersContainer) return;

    // Если заказов нет, создаем тестовые данные для демонстрации
    if (orders.length === 0) {
        console.log('📦 Создаем демо-заказы для отображения');
        orders = createDemoOrders();
    }

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
                <div class="delivery-info-compact" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px; color: #666; font-size: 0.9em;">
                    📦 ${order.delivery.type || 'Доставка'} ${order.delivery.address ? '• ' + order.delivery.address : ''}
                </div>
            ` : ''}
            
            ${order.error ? `
                <div class="order-error-modern" style="margin-top: 15px; padding: 10px; background: #fff5f5; border-left: 4px solid #e53e3e; border-radius: 4px; color: #721c24; font-size: 0.9em;">
                    <strong>⚠️ Ошибка:</strong> ${order.error}
                </div>
            ` : ''}
        </div>
    `).join('');

    // ВАЖНО: Подстраиваем высоту после рендера заказов
    setTimeout(adjustContainerHeight, 100);
}

// Создаем демо-заказы для показа интерфейса
function createDemoOrders() {
    return [
        {
            id: 'CG-Demo-001',
            cdekNumber: 'CG-240115-42',
            status: 'created',
            amount: 9400,
            createdAt: new Date(Date.now() - 86400000).toISOString(), // вчера
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
            id: 'CG-Demo-002',
            cdekNumber: 'CG-240110-38',
            status: 'paid',
            amount: 8900,
            createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 дней назад
            items: [
                { name: 'clip & go камера', cost: 8900 }
            ],
            delivery: {
                type: 'ПВЗ СДЭК'
            }
        },
        // Добавляем еще несколько демо-заказов для тестирования прокрутки
        {
            id: 'CG-Demo-003',
            cdekNumber: 'CG-240105-29',
            status: 'paid',
            amount: 1500,
            createdAt: new Date(Date.now() - 864000000).toISOString(), // 10 дней назад
            items: [
                { name: 'Карта памяти 8 ГБ', cost: 500 },
                { name: 'Карта памяти 8 ГБ', cost: 500 },
                { name: 'Карта памяти 8 ГБ', cost: 500 }
            ],
            delivery: {
                type: 'Постамат СДЭК'
            }
        }
    ];
}

/* === Вспомогательные функции для заказов === */
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
        case 'payment_success_cdek_failed': return 'Ошибка доставки';
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

/* === Обновление статистики === */
function updateStats() {
    if (DOM.totalOrders) {
        DOM.totalOrders.textContent = orders.length;
    }

    if (DOM.memberSince) {
        const currentYear = new Date().getFullYear();
        DOM.memberSince.textContent = currentYear;
    }

    if (DOM.orderStatus) {
        if (orders.length === 0) {
            DOM.orderStatus.textContent = 'Новичок';
        } else if (orders.length < 3) {
            DOM.orderStatus.textContent = 'Клиент';
        } else if (orders.length < 10) {
            DOM.orderStatus.textContent = 'Постоянный';
        } else {
            DOM.orderStatus.textContent = 'VIP';
        }
    }

    console.log('📊 Статистика обновлена');
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
        console.error('❌ Ошибка загрузки пользовательской информации:', error);
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

    // ВАЖНО: Подстраиваем высоту после заполнения формы
    setTimeout(adjustContainerHeight, 100);
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
        showNotification('Информация успешно сохранена!', 'success');
        console.log('💾 Информация пользователя сохранена');
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showNotification('Ошибка сохранения данных', 'error');
    }
}

/* === Настройки === */
function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');

        // Применяем настройки к переключателям
        Object.keys(settings).forEach(settingId => {
            const element = document.getElementById(settingId);
            if (element && typeof settings[settingId] === 'boolean') {
                element.checked = settings[settingId];
            }
        });

        // ВАЖНО: Подстраиваем высоту после загрузки настроек
        setTimeout(adjustContainerHeight, 100);
    } catch (error) {
        console.error('❌ Ошибка загрузки настроек:', error);
    }
}

function saveSettings() {
    const settingIds = [
        'emailNotifications', 'smsNotifications', 'marketingEmails',
        'publicProfile', 'analytics'
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
        console.log('⚙️ Настройки сохранены:', settings);
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
            loadOrders();
        });
    }

    // Сохранение пользовательской информации
    if (DOM.userInfoForm) {
        DOM.userInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveUserInfo();
        });

        // Подстраиваем высоту при изменении в форме
        DOM.userInfoForm.addEventListener('input', debounce(() => {
            adjustContainerHeight();
        }, 300));
    }

    // Сохранение настроек при изменении переключателей
    const settingToggles = [
        'emailNotifications', 'smsNotifications', 'marketingEmails',
        'publicProfile', 'analytics'
    ];
    settingToggles.forEach(toggleId => {
        const element = document.getElementById(toggleId);
        if (element) {
            element.addEventListener('change', () => {
                saveSettings();
                // Подстраиваем высоту при изменении настроек
                setTimeout(adjustContainerHeight, 100);
            });
        }
    });

    // Действия
    setupActionButtons();

    // Загружаем настройки
    loadSettings();

    // Слушаем изменения размера окна для подстройки высоты
    window.addEventListener('resize', debounce(adjustContainerHeight, 300));

    console.log('🔗 Обработчики событий настроены');
}

function setupActionButtons() {
    // Очистка корзины
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            showConfirmDialog(
                'Очистить корзину?',
                'Все товары будут удалены из корзины',
                () => {
                    localStorage.removeItem('cartData');
                    updateCartBadge();
                    showNotification('Корзина очищена', 'success');
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

    // Очистка истории заказов
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            showConfirmDialog(
                'Удалить всю историю?',
                'Это действие необратимо. Все данные о заказах будут удалены.',
                () => {
                    orders = [];
                    renderOrders();
                    updateStats();
                    DOM.noOrdersMessage.style.display = 'block';
                    showNotification('История заказов очищена', 'success');

                    // ВАЖНО: Подстраиваем высоту после очистки
                    setTimeout(adjustContainerHeight, 100);
                }
            );
        });
    }
}

/* === Экспорт данных пользователя === */
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
        a.download = `clip-and-go-profile-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        showNotification('Данные экспортированы', 'success');

        console.log('📥 Данные пользователя экспортированы');
    } catch (error) {
        console.error('❌ Ошибка экспорта данных:', error);
        showNotification('Ошибка экспорта данных', 'error');
    }
}

/* === Диалог подтверждения === */
function showConfirmDialog(title, message, onConfirm) {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog-overlay';
    dialog.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-header">
                <h3>${title}</h3>
            </div>
            <div class="confirm-body">
                <p>${message}</p>
            </div>
            <div class="confirm-actions">
                <button class="confirm-btn cancel">Отмена</button>
                <button class="confirm-btn confirm">Подтвердить</button>
            </div>
        </div>
    `;

    // Стили для диалога
    const style = document.createElement('style');
    style.textContent = `
        .confirm-dialog-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
        
        .confirm-dialog {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            max-width: 400px;
            width: 90%;
            animation: slideUp 0.3s ease;
        }
        
        .confirm-header {
            padding: 20px 20px 0;
        }
        
        .confirm-header h3 {
            margin: 0;
            color: #333;
            font-size: 1.2em;
        }
        
        .confirm-body {
            padding: 10px 20px 20px;
        }
        
        .confirm-body p {
            margin: 0;
            color: #666;
            line-height: 1.5;
        }
        
        .confirm-actions {
            display: flex;
            border-top: 1px solid #f0f0f0;
        }
        
        .confirm-btn {
            flex: 1;
            padding: 15px;
            border: none;
            background: none;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.3s ease;
        }
        
        .confirm-btn.cancel {
            color: #666;
        }
        
        .confirm-btn.cancel:hover {
            background: #f8f9fa;
        }
        
        .confirm-btn.confirm {
            color: #e53e3e;
            border-left: 1px solid #f0f0f0;
        }
        
        .confirm-btn.confirm:hover {
            background: #fff5f5;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(dialog);

    // Обработчики
    const cancelBtn = dialog.querySelector('.confirm-btn.cancel');
    const confirmBtn = dialog.querySelector('.confirm-btn.confirm');

    function closeDialog() {
        dialog.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            document.body.removeChild(dialog);
            document.head.removeChild(style);
        }, 300);
    }

    cancelBtn.addEventListener('click', closeDialog);
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        closeDialog();
    });

    // Закрытие по клику вне диалога
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            closeDialog();
        }
    });
}

/* === Анимации === */
function initAnimations() {
    // Анимация появления элементов при скролле
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Наблюдаем за элементами
    document.querySelectorAll('.fade-in-on-scroll').forEach(el => {
        observer.observe(el);
    });

    console.log('🎨 Анимации инициализированы');
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

        console.log('🛒 Счетчик корзины обновлен:', count);
    } catch (error) {
        console.error('❌ Ошибка обновления счетчика корзины:', error);
    }
}

/* === Современная система уведомлений === */
function showNotification(message, type = 'info', duration = 4000) {
    // Создаем контейнер если его нет
    let container = document.getElementById('modern-notifications');
    if (!container) {
        container = document.createElement('div');
        container.id = 'modern-notifications';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    // Создаем уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        border-left: 4px solid ${getNotificationColor(type)};
        display: flex;
        align-items: center;
        gap: 12px;
        transform: translateX(100%);
        transition: transform 0.3s ease, opacity 0.3s ease;
        pointer-events: auto;
        font-size: 0.9em;
        line-height: 1.4;
    `;

    const icons = {
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌'
    };

    notification.innerHTML = `
        <span style="font-size: 1.2em; flex-shrink: 0;">${icons[type] || icons.info}</span>
        <span style="flex: 1; color: #333;">${message}</span>
        <button style="background: none; border: none; font-size: 1.2em; color: #999; cursor: pointer; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">&times;</button>
    `;

    container.appendChild(notification);

    // Анимация появления
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });

    // Обработчик закрытия
    const closeBtn = notification.querySelector('button');
    closeBtn.onclick = () => removeNotification(notification);

    // Автоматическое закрытие
    setTimeout(() => removeNotification(notification), duration);
}

function getNotificationColor(type) {
    const colors = {
        success: '#4CAF50',
        info: '#2196F3',
        warning: '#FF9800',
        error: '#F44336'
    };
    return colors[type] || colors.info;
}

function removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/* === Утилита debounce === */
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
window.switchTab = switchTab;
window.adjustContainerHeight = adjustContainerHeight; // Экспортируем для возможности вызова извне

console.log('🎉 Профиль полностью готов к работе!');