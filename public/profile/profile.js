/* File: public/profile/profile.js */

/* === Состояние приложения === */
let currentTab = 'orders';
let orders = [];
let userInfo = {};

/* === DOM элементы === */
const getElement = (id) => document.getElementById(id);
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

/* === Инициализация === */
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadUserInfo();
    loadOrders();
    initEventListeners();
    updateCartBadge();
});

/* === Управление вкладками === */
function initTabs() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    // Обновляем кнопки
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Обновляем панели
    tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === tabId);
    });

    currentTab = tabId;

    // Загружаем данные для вкладки если нужно
    if (tabId === 'orders' && orders.length === 0) {
        loadOrders();
    }
}

/* === Загрузка и отображение заказов === */
async function loadOrders() {
    const loadingEl = getElement('ordersLoading');
    const containerEl = getElement('ordersContainer');
    const noOrdersEl = getElement('noOrdersMessage');

    // Показываем загрузку
    if (loadingEl) loadingEl.style.display = 'block';
    if (noOrdersEl) noOrdersEl.style.display = 'none';

    try {
        console.log('[Profile] Загружаем заказы...');
        const response = await fetch('/api/orders');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        orders = await response.json();
        console.log('[Profile] Получено заказов:', orders.length);

        // Скрываем загрузку
        if (loadingEl) loadingEl.style.display = 'none';

        if (orders.length === 0) {
            // Показываем сообщение об отсутствии заказов
            if (noOrdersEl) noOrdersEl.style.display = 'block';
            containerEl.innerHTML = '';
        } else {
            // Отображаем заказы
            if (noOrdersEl) noOrdersEl.style.display = 'none';
            renderOrders();
        }

        // Обновляем статистику
        updateStats();

    } catch (error) {
        console.error('[Profile] Ошибка загрузки заказов:', error);

        // Скрываем загрузку и показываем ошибку
        if (loadingEl) loadingEl.style.display = 'none';

        containerEl.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 40px; color: #dc3545;">
        <h3>Ошибка загрузки заказов</h3>
        <p>Не удалось загрузить историю заказов. Попробуйте обновить страницу.</p>
        <button onclick="loadOrders()" class="btn-primary" style="margin-top: 15px;">
          Попробовать снова
        </button>
      </div>
    `;
    }
}

function renderOrders() {
    const container = getElement('ordersContainer');
    if (!container) return;

    container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-header">
        <div class="order-number">Заказ ${order.cdekNumber || order.id}</div>
        <div class="order-status ${getStatusClass(order.status)}">${getStatusText(order.status)}</div>
      </div>
      
      <div class="order-info">
        <div class="order-detail">
          <div class="order-detail-label">Дата создания</div>
          <div class="order-detail-value">${formatDate(order.createdAt)}</div>
        </div>
        
        <div class="order-detail">
          <div class="order-detail-label">Сумма заказа</div>
          <div class="order-detail-value">${order.amount?.toLocaleString('ru-RU') || '0'} ₽</div>
        </div>
        
        <div class="order-detail">
          <div class="order-detail-label">Доставка</div>
          <div class="order-detail-value">${order.delivery?.type || 'Не указано'}</div>
        </div>
        
        <div class="order-detail">
          <div class="order-detail-label">Получатель</div>
          <div class="order-detail-value">${order.recipient?.name || 'Не указано'}</div>
        </div>
      </div>
      
      ${order.items && order.items.length > 0 ? `
        <div class="order-items">
          <h4>Товары в заказе:</h4>
          <div class="item-list">
            ${order.items.map(item => `
              <div class="item">
                <span class="item-name">${item.name}</span>
                <span class="item-price">${(item.cost || 0).toLocaleString('ru-RU')} ₽</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${order.cdekUuid ? `
        <div class="order-detail" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
          <div class="order-detail-label">Трек-номер СДЭК</div>
          <div class="order-detail-value" style="font-family: monospace;">${order.cdekUuid}</div>
        </div>
      ` : ''}
      
      ${order.error ? `
        <div class="order-error" style="margin-top: 15px; padding: 10px; background: #ffe6e6; border-radius: 4px; border-left: 4px solid #dc3545;">
          <strong>Ошибка:</strong> ${order.error}
        </div>
      ` : ''}
    </div>
  `).join('');
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
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Не указано';
    }
}

/* === Обновление статистики === */
function updateStats() {
    const totalOrdersEl = getElement('totalOrders');
    const totalSpentEl = getElement('totalSpent');
    const lastOrderDateEl = getElement('lastOrderDate');

    if (totalOrdersEl) {
        totalOrdersEl.textContent = orders.length;
    }

    if (totalSpentEl) {
        const totalSpent = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
        totalSpentEl.textContent = totalSpent.toLocaleString('ru-RU') + ' ₽';
    }

    if (lastOrderDateEl) {
        if (orders.length > 0) {
            const lastOrder = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            lastOrderDateEl.textContent = formatDate(lastOrder.createdAt).split(' ')[0]; // только дата без времени
        } else {
            lastOrderDateEl.textContent = '—';
        }
    }
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
        console.error('[Profile] Ошибка загрузки пользовательской информации:', error);
    }
}

function fillUserInfoForm() {
    const fields = ['userFullName', 'userPhone', 'userEmail', 'userCity'];
    fields.forEach(fieldId => {
        const element = getElement(fieldId);
        if (element && userInfo[fieldId]) {
            element.value = userInfo[fieldId];
        }
    });
}

function saveUserInfo() {
    const fields = ['userFullName', 'userPhone', 'userEmail', 'userCity'];

    fields.forEach(fieldId => {
        const element = getElement(fieldId);
        if (element) {
            userInfo[fieldId] = element.value.trim();
        }
    });

    try {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));

        // Показываем уведомление об успешном сохранении
        showNotification('Информация успешно сохранена!', 'success');
    } catch (error) {
        console.error('[Profile] Ошибка сохранения:', error);
        showNotification('Ошибка сохранения данных', 'error');
    }
}

/* === Настройки === */
function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');

        // Применяем настройки к переключателям
        Object.keys(settings).forEach(settingId => {
            const element = getElement(settingId);
            if (element && typeof settings[settingId] === 'boolean') {
                element.checked = settings[settingId];
            }
        });
    } catch (error) {
        console.error('[Profile] Ошибка загрузки настроек:', error);
    }
}

function saveSettings() {
    const settingIds = ['emailNotifications', 'smsNotifications', 'marketingEmails'];
    const settings = {};

    settingIds.forEach(settingId => {
        const element = getElement(settingId);
        if (element) {
            settings[settingId] = element.checked;
        }
    });

    try {
        localStorage.setItem('userSettings', JSON.stringify(settings));
        console.log('[Profile] Настройки сохранены:', settings);
    } catch (error) {
        console.error('[Profile] Ошибка сохранения настроек:', error);
    }
}

/* === Обработчики событий === */
function initEventListeners() {
    // Обновление заказов
    const refreshBtn = getElement('refreshOrdersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadOrders();
        });
    }

    // Сохранение пользовательской информации
    const userInfoForm = getElement('userInfoForm');
    if (userInfoForm) {
        userInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveUserInfo();
        });
    }

    // Сохранение настроек при изменении переключателей
    const settingToggles = ['emailNotifications', 'smsNotifications', 'marketingEmails'];
    settingToggles.forEach(toggleId => {
        const element = getElement(toggleId);
        if (element) {
            element.addEventListener('change', saveSettings);
        }
    });

    // Очистка корзины
    const clearCartBtn = getElement('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите очистить корзину?')) {
                localStorage.removeItem('cartData');
                updateCartBadge();
                showNotification('Корзина очищена', 'success');
            }
        });
    }

    // Очистка истории заказов
    const clearHistoryBtn = getElement('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите удалить всю историю заказов? Это действие необратимо.')) {
                // В реальном приложении здесь был бы API-запрос
                orders = [];
                renderOrders();
                updateStats();
                getElement('noOrdersMessage').style.display = 'block';
                showNotification('История заказов очищена', 'success');
            }
        });
    }

    // Загружаем настройки
    loadSettings();
}

/* === Обновление счетчика корзины === */
function updateCartBadge() {
    try {
        const cartData = JSON.parse(localStorage.getItem('cartData') || '{}');
        const count = (cartData.cameraCount || 0) + (cartData.memoryCount || 0);

        const badge = document.querySelector('.cart-count');
        if (badge) {
            badge.textContent = count;
        }
    } catch (error) {
        console.error('[Profile] Ошибка обновления счетчика корзины:', error);
    }
}

/* === Уведомления === */
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
  `;

    // Цвета в зависимости от типа
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        default:
            notification.style.backgroundColor = '#007BFF';
    }

    notification.textContent = message;

    // Добавляем CSS для анимации
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}