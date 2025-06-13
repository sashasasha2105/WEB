// === HEADER JS - Объединенная оптимизированная версия ===

class HeaderManager {
    constructor() {
        console.log('[Header] 🚀 Инициализация...');

        // Основные элементы
        this.header = document.getElementById('siteHeader');
        this.mobileToggle = document.querySelector('.mobile-menu-toggle');
        this.mobileMenu = document.getElementById('mobileMenu');
        this.mobileClose = document.querySelector('.mobile-close');
        this.mobileBackdrop = document.querySelector('.mobile-menu-backdrop');

        // Бейджи
        this.cartBadges = {
            desktop: document.getElementById('cartBadge'),
            mobile: document.getElementById('mobileCartBadge')
        };

        this.ordersBadges = {
            desktop: document.getElementById('ordersBadge'),
            mobile: document.getElementById('mobileOrdersBadge')
        };

        // Состояние
        this.lastScroll = 0;
        this.isMenuOpen = false;
        this.scrollThreshold = 30; // Обновлен порог для нового размера хедера

        if (!this.header) {
            console.error('[Header] ❌ Хедер не найден!');
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

        // Инициальная проверка скролла
        this.handleScroll();

        console.log('[Header] ✅ Инициализирован успешно');
    }

    setupScrollHandler() {
        let ticking = false;

        this.handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScroll = window.pageYOffset;

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

        window.addEventListener('scroll', this.handleScroll, { passive: true });
        console.log('[Header] 📜 Scroll handler настроен');
    }

    setupMobileMenu() {
        if (!this.mobileToggle) {
            console.warn('[Header] ⚠️ Мобильная кнопка не найдена');
            return;
        }

        // Открытие/закрытие меню
        this.mobileToggle.addEventListener('click', this.toggleMobileMenu.bind(this));

        // Закрытие меню кнопкой X
        if (this.mobileClose) {
            this.mobileClose.addEventListener('click', this.closeMobileMenu.bind(this));
        }

        // Закрытие по бэкдропу
        if (this.mobileBackdrop) {
            this.mobileBackdrop.addEventListener('click', this.closeMobileMenu.bind(this));
        }

        // Закрытие по клику на ссылку
        if (this.mobileMenu) {
            this.mobileMenu.addEventListener('click', (e) => {
                if (e.target.matches('a')) {
                    setTimeout(() => this.closeMobileMenu(), 200);
                }
            });

            // Предотвращение закрытия при клике внутри контента
            const mobileContent = this.mobileMenu.querySelector('.mobile-menu-content');
            if (mobileContent) {
                mobileContent.addEventListener('click', (e) => e.stopPropagation());
            }
        }

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });

        console.log('[Header] 📱 Мобильное меню настроено');
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;

        // Анимация кнопки бургер
        this.mobileToggle?.classList.toggle('active', this.isMenuOpen);

        // Показ/скрытие меню
        this.mobileMenu?.classList.toggle('active', this.isMenuOpen);

        // Блокировка скролла
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

        // Haptic feedback
        if ('vibrate' in navigator && this.isMenuOpen) {
            navigator.vibrate(30);
        }

        console.log(`[Header] 📱 Мобильное меню ${this.isMenuOpen ? 'открыто' : 'закрыто'}`);
    }

    closeMobileMenu() {
        if (!this.isMenuOpen) return;

        this.isMenuOpen = false;
        this.mobileToggle?.classList.remove('active');
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
        const anchorLinks = document.querySelectorAll('a[data-section], a[href*="#"]');

        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                let sectionId = link.getAttribute('data-section');

                if (!sectionId && href && href.includes('#')) {
                    sectionId = href.split('#')[1];
                }

                if (sectionId) {
                    const targetElement = document.getElementById(sectionId);

                    if (targetElement) {
                        e.preventDefault();

                        // Обновленный расчет с учетом новой высоты хедера
                        const headerHeight = this.header.offsetHeight || 100;
                        const targetPosition = targetElement.offsetTop - headerHeight - 20;

                        window.scrollTo({
                            top: Math.max(0, targetPosition),
                            behavior: 'smooth'
                        });

                        // Закрываем мобильное меню
                        if (this.isMenuOpen) {
                            setTimeout(() => this.closeMobileMenu(), 100);
                        }

                        console.log(`[Header] 🎯 Прокрутка к секции: ${sectionId}`);
                    }
                }
            });
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
                    // Анимация появления
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
            const orders = JSON.parse(localStorage.getItem('userOrders') || '[]');
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

        // Слушаем события
        window.addEventListener('cartUpdated', debouncedUpdate);
        window.addEventListener('ordersUpdated', debouncedUpdate);

        // События localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'cartData' || e.key === 'userOrders') {
                console.log(`[Header] 💾 LocalStorage изменен: ${e.key}`);
                debouncedUpdate();
            }
        });

        // Обновление при фокусе на страницу
        window.addEventListener('focus', debouncedUpdate, { passive: true });

        // Периодическое обновление каждые 20 секунд
        setInterval(() => this.updateBadges(), 20000);

        console.log('[Header] 🔄 CartManager интеграция настроена');
    }

    // === ПУБЛИЧНЫЕ МЕТОДЫ ===

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

// === ИНИЦИАЛИЗАЦИЯ ===

let headerInstance = null;

function initHeader() {
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

            console.log('[Header] ✅ Успешно инициализирован');

            // Первичное обновление бейджей
            setTimeout(() => headerInstance.forceUpdateBadges(), 300);

            return headerInstance;
        } else {
            console.error('[Header] ❌ Не удалось инициализировать');
            return null;
        }

    } catch (error) {
        console.error('[Header] ❌ Критическая ошибка:', error);
        return null;
    }
}

// === АВТОИНИЦИАЛИЗАЦИЯ ===

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initHeader, 50);
    });
} else {
    setTimeout(initHeader, 100);
}

// === ИНТЕГРАЦИЯ С CART-MANAGER ===

function waitForCartManager() {
    if (window.CartManager && headerInstance) {
        console.log('[Header] 🔗 Интеграция с CartManager');

        // Патчим метод updateCartCounter в CartManager
        if (typeof window.CartManager.updateCartCounter === 'function') {
            const originalUpdate = window.CartManager.updateCartCounter.bind(window.CartManager);

            window.CartManager.updateCartCounter = function() {
                originalUpdate();
                if (headerInstance) {
                    setTimeout(() => headerInstance.updateBadges(), 50);
                }
            };

            console.log('[Header] ✅ CartManager интегрирован');
        }

        // Первичное обновление
        setTimeout(() => {
            if (headerInstance) {
                headerInstance.forceUpdateBadges();
            }
        }, 100);

    } else if (!window.CartManager) {
        setTimeout(waitForCartManager, 100);
    }
}

setTimeout(waitForCartManager, 200);

// === ГЛОБАЛЬНЫЕ ФУНКЦИИ ===

window.initHeader = initHeader;

window.updateHeaderBadges = function() {
    if (headerInstance) {
        headerInstance.forceUpdateBadges();
        console.log('[Header] 🔄 Принудительное обновление выполнено');
    } else {
        console.warn('[Header] ⚠️ Header не инициализирован');
    }
};

// === ЭКСПОРТ ===

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeaderManager, initHeader };
}

console.log('[Header] 🎉 Скрипт загружен и готов к работе!');