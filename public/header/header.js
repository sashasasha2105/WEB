// === ОПТИМИЗИРОВАННЫЙ HEADER JS ===

class HeaderManager {
    constructor() {
        // Основные элементы
        this.header = document.getElementById('siteHeader');
        this.mobileToggle = document.querySelector('.mobile-menu-toggle');
        this.mobileMenu = document.getElementById('mobileMenu');
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
        this.scrollThreshold = 1;
        this.isInitialized = false;

        if (!this.header) {
            console.error('[Header] Хедер не найден!');
            return;
        }

        this.init();
    }

    init() {
        this.setupScrollHandler();
        this.setupMobileMenu();
        this.setupSmoothScroll();
        this.updateBadges();
        this.setupCartManager();
        this.handleScroll();
        this.isInitialized = true;
    }

    setupScrollHandler() {
        let ticking = false;

        this.handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScroll = Math.max(
                        window.pageYOffset || 0,
                        document.documentElement.scrollTop || 0,
                        document.body.scrollTop || 0
                    );

                    // Плавное изменение прозрачности фона в зависимости от скролла
                    const maxScroll = 100; // Максимальное расстояние для полного появления фона
                    const scrollProgress = Math.min(currentScroll / maxScroll, 1);
                    
                    if (this.header) {
                        // Устанавливаем CSS-переменную для прозрачности
                        this.header.style.setProperty('--scroll-opacity', scrollProgress);
                        
                        if (scrollProgress > 0.05) {
                            this.header.classList.add('scrolled');
                        } else {
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
        window.addEventListener('wheel', this.handleScroll, { passive: true });
        window.addEventListener('touchmove', this.handleScroll, { passive: true });
        
        setTimeout(() => {
            this.handleScroll();
        }, 100);
    }

    setupMobileMenu() {
        if (!this.mobileToggle) return;

        // Открытие/закрытие меню
        this.mobileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMobileMenu();
        });

        this.mobileToggle.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMobileMenu();
        });

        // Закрытие по бэкдропу
        if (this.mobileBackdrop) {
            this.mobileBackdrop.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMobileMenu();
            });

            this.mobileBackdrop.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.closeMobileMenu();
            });
        }

        // Закрытие по клику на ссылку
        if (this.mobileMenu) {
            this.mobileMenu.addEventListener('click', (e) => {
                if (e.target.matches('a') || e.target.closest('a')) {
                    setTimeout(() => this.closeMobileMenu(), 200);
                }
            });

            // Предотвращение закрытия при клике внутри контента
            const mobileContent = this.mobileMenu.querySelector('.mobile-menu-content');
            if (mobileContent) {
                mobileContent.addEventListener('click', (e) => e.stopPropagation());
                mobileContent.addEventListener('touchend', (e) => e.stopPropagation());
            }
        }

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;

        // Управление body классами
        if (this.isMenuOpen) {
            document.body.classList.add('mobile-menu-open');
        } else {
            document.body.classList.remove('mobile-menu-open');
        }

        // Анимация кнопки бургер
        if (this.mobileToggle) {
            this.mobileToggle.classList.toggle('active', this.isMenuOpen);
        }

        // Показ/скрытие меню
        if (this.mobileMenu) {
            this.mobileMenu.classList.toggle('active', this.isMenuOpen);
        }

        // Блокировка скролла
        this.toggleBodyScroll(!this.isMenuOpen);

        // Haptic feedback для мобильных
        if ('vibrate' in navigator && this.isMenuOpen) {
            navigator.vibrate(30);
        }
    }

    closeMobileMenu() {
        if (!this.isMenuOpen) return;

        this.isMenuOpen = false;

        // Убираем классы с body
        document.body.classList.remove('mobile-menu-open');

        if (this.mobileToggle) {
            this.mobileToggle.classList.remove('active');
        }

        if (this.mobileMenu) {
            this.mobileMenu.classList.remove('active');
        }

        // Разблокировка скролла
        this.toggleBodyScroll(true);
    }

    toggleBodyScroll(enable) {
        if (enable) {
            // Включаем скролл
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        } else {
            // Блокируем скролл
            const scrollY = window.scrollY;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${scrollY}px`;
        }
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

                        // Расчет с учетом высоты хедера
                        const headerHeight = this.header.offsetHeight || 80;
                        const targetPosition = targetElement.offsetTop - headerHeight - 20;

                        window.scrollTo({
                            top: Math.max(0, targetPosition),
                            behavior: 'smooth'
                        });

                        // Закрываем мобильное меню
                        if (this.isMenuOpen) {
                            setTimeout(() => this.closeMobileMenu(), 100);
                        }
                    }
                }
            });
        });
    }

    updateBadges() {
        try {
            const cartCount = this.getCartCount();
            const ordersCount = this.getOrdersCount();

            this.setBadge(this.cartBadges, cartCount);
            this.setBadge(this.ordersBadges, ordersCount);
        } catch (error) {
            console.error('[Header] Ошибка обновления бейджей:', error);
        }
    }

    setBadge(badges, count) {
        Object.values(badges).forEach(badge => {
            if (badge) {
                badge.textContent = count;

                if (count > 0) {
                    badge.style.display = 'flex';
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
                debouncedUpdate();
            }
        });

        // Обновление при фокусе на страницу
        window.addEventListener('focus', debouncedUpdate, { passive: true });

        window.addEventListener('resize', () => {
            setTimeout(() => this.updateBadges(), 100);
        });

        // Периодическое обновление каждые 30 секунд
        setInterval(() => this.updateBadges(), 30000);
    }

    // === ПУБЛИЧНЫЕ МЕТОДЫ ===

    forceUpdateBadges() {
        this.updateBadges();
    }

    setCartCount(count) {
        this.setBadge(this.cartBadges, count);
    }

    setOrdersCount(count) {
        this.setBadge(this.ordersBadges, count);
    }

    // Геттеры для отладки
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
        return headerInstance;
    }

    // Проверяем наличие элемента хедера
    const headerElement = document.getElementById('siteHeader');
    if (!headerElement) {
        setTimeout(initHeader, 100);
        return null;
    }

    try {
        headerInstance = new HeaderManager();

        if (headerInstance.isInitialized) {
            // Экспорт в глобальную область
            window.headerManager = headerInstance;
            window.HeaderManager = HeaderManager;

            // Первичное обновление бейджей
            setTimeout(() => headerInstance.forceUpdateBadges(), 300);

            return headerInstance;
        } else {
            console.error('[Header] Не удалось инициализировать');
            return null;
        }

    } catch (error) {
        console.error('[Header] Критическая ошибка:', error);
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

// === ДОПОЛНИТЕЛЬНАЯ МОБИЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ===

// Для мобильных устройств - дополнительные попытки инициализации
if (window.innerWidth <= 768) {
    let mobileRetries = 0;
    const maxMobileRetries = 10;

    const mobileInit = setInterval(() => {
        if (!headerInstance || !headerInstance.isInitialized) {
            mobileRetries++;
            
            const result = initHeader();
            if (result) {
                clearInterval(mobileInit);
            }

            if (mobileRetries >= maxMobileRetries) {
                clearInterval(mobileInit);
            }
        } else {
            clearInterval(mobileInit);
        }
    }, 200);
}

// === ИНТЕГРАЦИЯ С CART-MANAGER ===

function waitForCartManager() {
    if (window.CartManager && headerInstance) {
        // Патчим метод updateCartCounter в CartManager
        if (typeof window.CartManager.updateCartCounter === 'function') {
            const originalUpdate = window.CartManager.updateCartCounter.bind(window.CartManager);

            window.CartManager.updateCartCounter = function() {
                originalUpdate();
                if (headerInstance) {
                    setTimeout(() => headerInstance.updateBadges(), 50);
                }
            };
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

window.HeaderManager = HeaderManager;
window.initHeader = initHeader;

window.updateHeaderBadges = function() {
    if (headerInstance && headerInstance.isInitialized) {
        headerInstance.forceUpdateBadges();
    }
};

// === ЭКСПОРТ ===

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeaderManager, initHeader };
}