// === File: js/header.js ===
// === ЭЛЕГАНТНЫЙ ХЕДЕР СКРИПТ ===

class HeaderManager {
    constructor() {
        console.log('[Header] 🚀 Инициализация...');

        // Поиск элементов (новый и старый хедер)
        this.header = document.getElementById('premiumHeader') || document.getElementById('site-header');
        this.mobileToggle = document.querySelector('.mobile-menu-toggle') || document.querySelector('.burger-menu');
        this.mobileMenu = document.getElementById('mobileMenu');
        this.mobileClose = document.querySelector('.mobile-close');
        this.mobileBackdrop = document.querySelector('.mobile-menu-backdrop');

        // Бейджи корзины
        this.cartBadges = {
            header: document.getElementById('headerCartBadge'),
            mobile: document.getElementById('mobileCartBadge'),
            old: document.querySelector('.cart-count') // Старый бейдж
        };

        // Бейджи заказов
        this.ordersBadges = {
            header: document.getElementById('headerOrdersBadge'),
            mobile: document.getElementById('mobileOrdersBadge')
        };

        this.lastScroll = 0;
        this.isMenuOpen = false;
        this.scrollThreshold = 30; // Когда срабатывает эффект скролла
        this.isScrolling = false;

        // Проверяем что хедер найден
        if (!this.header) {
            console.error('[Header] ❌ Хедер не найден! Проверьте ID элемента.');
            return;
        }

        this.init();
    }

    init() {
        console.log('[Header] ✅ Найден хедер:', this.header.id);

        this.setupScrollHandler();
        this.setupMobileMenu();
        this.setupSmoothScroll();
        this.updateBadges();
        this.setupCartManager();

        // Инициальная проверка положения скролла
        this.handleScroll();

        console.log('[Header] ✅ Инициализирован успешно');
    }

    setupScrollHandler() {
        let ticking = false;

        this.handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScroll = window.pageYOffset;

                    // Эффект прозрачности при скролле (оптимизированный)
                    if (currentScroll > this.scrollThreshold) {
                        if (!this.header.classList.contains('scrolled')) {
                            this.header.classList.add('scrolled');
                        }
                    } else {
                        if (this.header.classList.contains('scrolled')) {
                            this.header.classList.remove('scrolled');
                        }
                    }

                    this.lastScroll = currentScroll;
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Используем пассивный слушатель для лучшей производительности
        window.addEventListener('scroll', this.handleScroll, { passive: true });

        console.log('[Header] 📜 Scroll handler настроен');
    }

    setupMobileMenu() {
        if (!this.mobileToggle) {
            console.warn('[Header] ⚠️ Мобильная кнопка не найдена');
            return;
        }

        // Открытие/закрытие меню (оптимизированный обработчик)
        this.mobileToggle.addEventListener('click', this.toggleMobileMenu.bind(this), { passive: true });

        // Закрытие меню кнопкой X
        if (this.mobileClose) {
            this.mobileClose.addEventListener('click', this.closeMobileMenu.bind(this));
        }

        // Закрытие по бэкдропу
        if (this.mobileBackdrop) {
            this.mobileBackdrop.addEventListener('click', this.closeMobileMenu.bind(this));
        }

        // Закрытие по клику на ссылку в меню
        if (this.mobileMenu) {
            this.mobileMenu.addEventListener('click', (e) => {
                if (e.target.matches('a')) {
                    setTimeout(() => this.closeMobileMenu(), 200);
                }
            });

            // Предотвращение закрытия при клике внутри контента меню
            const mobileContent = this.mobileMenu.querySelector('.mobile-menu-content');
            if (mobileContent) {
                mobileContent.addEventListener('click', (e) => e.stopPropagation());
            }
        }

        // Закрытие по ESC (оптимизированный)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        }, { passive: true });

        console.log('[Header] 📱 Мобильное меню настроено');
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;

        // Анимация кнопки бургер
        this.mobileToggle?.classList.toggle('active', this.isMenuOpen);

        // Показ/скрытие меню
        this.mobileMenu?.classList.toggle('active', this.isMenuOpen);

        // Блокировка скролла страницы (улучшенная)
        if (this.isMenuOpen) {
            const scrollY = window.scrollY;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${scrollY}px`;
        } else {
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY) * -1);
            }
        }

        // Haptic feedback для мобильных устройств
        if ('vibrate' in navigator && this.isMenuOpen) {
            navigator.vibrate(30);
        }

        console.log(`[Header] 📱 Мобильное меню ${this.isMenuOpen ? 'открыто' : 'закрыто'}`);
    }

    closeMobileMenu() {
        if (!this.isMenuOpen) return;

        this.isMenuOpen = false;

        // Сброс анимации кнопки
        this.mobileToggle?.classList.remove('active');

        // Скрытие меню
        this.mobileMenu?.classList.remove('active');

        // Разблокировка скролла
        const scrollY = document.body.style.top;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        if (scrollY) {
            window.scrollTo(0, parseInt(scrollY) * -1);
        }

        console.log('[Header] 📱 Мобильное меню закрыто');
    }

    setupSmoothScroll() {
        // Плавная прокрутка для всех якорных ссылок (оптимизированная)
        const anchorLinks = document.querySelectorAll('a[data-section], a[href*="#"]');

        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                let sectionId = link.getAttribute('data-section');

                // Извлекаем ID секции из href если data-section не задан
                if (!sectionId && href && href.includes('#')) {
                    sectionId = href.split('#')[1];
                }

                if (sectionId) {
                    const targetElement = document.getElementById(sectionId);

                    if (targetElement) {
                        e.preventDefault();

                        const headerHeight = this.header.offsetHeight || 75;
                        const targetPosition = targetElement.offsetTop - headerHeight - 20;

                        window.scrollTo({
                            top: Math.max(0, targetPosition),
                            behavior: 'smooth'
                        });

                        // Закрываем мобильное меню если открыто
                        if (this.isMenuOpen) {
                            setTimeout(() => this.closeMobileMenu(), 100);
                        }

                        console.log(`[Header] 🎯 Прокрутка к секции: ${sectionId}`);
                    }
                }
            }, { passive: false });
        });

        console.log(`[Header] 🎯 Настроена плавная прокрутка для ${anchorLinks.length} ссылок`);
    }

    updateBadges() {
        try {
            const cartCount = this.getCartCount();
            const ordersCount = this.getOrdersCount();

            this.setBadge(this.cartBadges, cartCount);
            this.setBadge(this.ordersBadges, ordersCount);

            console.log(`[Header] 🔄 Бейджи обновлены: Корзина ${cartCount}, Заказы ${ordersCount}`);
        } catch (error) {
            console.error('[Header] ❌ Ошибка обновления бейджей:', error);
        }
    }

    setBadge(badges, count) {
        Object.values(badges).forEach(badge => {
            if (badge) {
                badge.textContent = count;

                if (count > 0) {
                    badge.style.display = 'flex';
                    // Оптимизированная анимация появления
                    badge.style.animation = 'none';
                    badge.offsetHeight; // Принудительный reflow
                    badge.style.animation = 'badgeEntry 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    }

    getCartCount() {
        // Приоритет: CartManager > localStorage > 0
        if (window.CartManager && typeof window.CartManager.getTotalCount === 'function') {
            return window.CartManager.getTotalCount();
        }

        // Fallback к localStorage
        try {
            const cartData = JSON.parse(localStorage.getItem('cartData') || '{}');
            return (cartData.cameraCount || 0) + (cartData.memoryCount || 0);
        } catch (e) {
            console.warn('[Header] ⚠️ Ошибка чтения cartData:', e);
            return 0;
        }
    }

    getOrdersCount() {
        // Приоритет: OrderManager > localStorage > 0
        if (window.OrderManager && typeof window.OrderManager.getOrdersCount === 'function') {
            return window.OrderManager.getOrdersCount();
        }

        // Fallback к localStorage
        try {
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            return orders.filter(order => order && order.id).length;
        } catch (e) {
            console.warn('[Header] ⚠️ Ошибка чтения orders:', e);
            return 0;
        }
    }

    setupCartManager() {
        // Дебаунс для обновления бейджей
        let updateTimeout = null;
        const debouncedUpdate = () => {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => this.updateBadges(), 50);
        };

        // Слушаем стандартные события
        window.addEventListener('cartUpdated', debouncedUpdate);
        window.addEventListener('ordersUpdated', debouncedUpdate);

        // События изменения localStorage (оптимизированные)
        window.addEventListener('storage', (e) => {
            if (e.key === 'cartData' || e.key === 'orders') {
                console.log(`[Header] 💾 LocalStorage изменен: ${e.key}`);
                debouncedUpdate();
            }
        });

        // Обновляем при фокусе на страницу (возвращение из другой вкладки)
        window.addEventListener('focus', debouncedUpdate, { passive: true });

        // Периодическое обновление каждые 20 секунд (оптимизировано)
        setInterval(() => this.updateBadges(), 20000);

        console.log('[Header] 🔄 CartManager интеграция настроена');
    }

    // === ПУБЛИЧНЫЕ МЕТОДЫ ДЛЯ ИНТЕГРАЦИИ ===

    forceUpdateBadges() {
        console.log('[Header] 🔄 Принудительное обновление бейджей');
        this.updateBadges();
    }

    setCartCount(count) {
        console.log(`[Header] 🛒 Установка счетчика корзины: ${count}`);
        this.setBadge(this.cartBadges, count);
    }

    setOrdersCount(count) {
        console.log(`[Header] 📋 Установка счетчика заказов: ${count}`);
        this.setBadge(this.ordersBadges, count);
    }

    // Методы для совместимости с существующим кодом
    updateCartCounter() {
        console.log('[Header] 🔄 Вызван updateCartCounter() (совместимость)');
        this.updateBadges();
    }

    getTotalCount() {
        return this.getCartCount();
    }

    // Геттеры для отладки
    get isInitialized() {
        return !!this.header;
    }

    get currentCartCount() {
        return this.getCartCount();
    }

    get currentOrdersCount() {
        return this.getOrdersCount();
    }
}

// === ОПТИМИЗИРОВАННАЯ ИНИЦИАЛИЗАЦИЯ ===

let headerInstance = null;

function initHeader() {
    // Предотвращаем множественную инициализацию
    if (headerInstance && headerInstance.isInitialized) {
        console.log('[Header] ⚠️ Уже инициализирован');
        return headerInstance;
    }

    try {
        console.log('[Header] 🚀 Начинаем инициализацию...');
        headerInstance = new HeaderManager();

        if (headerInstance.isInitialized) {
            // Экспорт в глобальную область
            window.headerManager = headerInstance;
            window.HeaderManager = HeaderManager;

            // Совместимость с различными именами
            window.premiumHeader = headerInstance; // Обратная совместимость

            // Совместимость с cart-manager.js
            if (!window.HeaderCompat) {
                window.HeaderCompat = {
                    updateCartCounter: () => headerInstance.updateCartCounter(),
                    updateBadges: () => headerInstance.forceUpdateBadges(),
                    forceUpdate: () => headerInstance.forceUpdateBadges()
                };
            }

            console.log('[Header] ✅ Успешно инициализирован и экспортирован глобально');

            // Первичное обновление бейджей через 300ms
            setTimeout(() => headerInstance.forceUpdateBadges(), 300);

            return headerInstance;
        } else {
            console.error('[Header] ❌ Не удалось инициализировать - хедер не найден');
            return null;
        }

    } catch (error) {
        console.error('[Header] ❌ Критическая ошибка инициализации:', error);
        return null;
    }
}

// === АВТОИНИЦИАЛИЗАЦИЯ ===

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Небольшая задержка для гарантии загрузки всех элементов
        setTimeout(initHeader, 50);
    });
} else {
    // DOM уже загружен - инициализируем
    setTimeout(initHeader, 100);
}

// === ИНТЕГРАЦИЯ С CART-MANAGER ===

// Ждем загрузки CartManager и интегрируемся
function waitForCartManager() {
    if (window.CartManager && headerInstance) {
        console.log('[Header] 🔗 Интеграция с CartManager');

        // Патчим метод updateCartCounter в CartManager если он есть
        if (typeof window.CartManager.updateCartCounter === 'function') {
            const originalUpdate = window.CartManager.updateCartCounter.bind(window.CartManager);

            window.CartManager.updateCartCounter = function() {
                // Вызываем оригинальный метод
                originalUpdate();

                // Обновляем наши бейджи с небольшой задержкой
                if (headerInstance) {
                    setTimeout(() => headerInstance.updateBadges(), 50);
                }
            };

            console.log('[Header] ✅ CartManager.updateCartCounter пропатчен');
        }

        // Первичное обновление
        setTimeout(() => {
            if (headerInstance) {
                headerInstance.forceUpdateBadges();
            }
        }, 100);

    } else if (!window.CartManager) {
        // CartManager еще не загружен, ждем
        setTimeout(waitForCartManager, 100);
    }
}

// Запускаем интеграцию через 200ms после инициализации
setTimeout(waitForCartManager, 200);

// === ЭКСПОРТ ДЛЯ СОВМЕСТИМОСТИ ===

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeaderManager, initHeader };
}

// Глобальные функции для отладки и ручного управления
window.initHeader = initHeader;
window.updateHeaderBadges = function() {
    if (headerInstance) {
        headerInstance.forceUpdateBadges();
        console.log('[Header] 🔄 Принудительное обновление выполнено');
    } else {
        console.warn('[Header] ⚠️ Header не инициализирован');
    }
};