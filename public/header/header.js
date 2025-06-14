// === ИСПРАВЛЕННЫЙ HEADER JS БЕЗ ПРИНУДИТЕЛЬНОЙ СТИЛИЗАЦИИ ===

class HeaderManager {
    constructor() {
        console.log('[Header] 🚀 Инициализация HeaderManager...');

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
        this.scrollThreshold = 30;
        this.isMobile = window.innerWidth <= 768;
        this.isInitialized = false;

        if (!this.header) {
            console.error('[Header] ❌ Хедер не найден!');
            return;
        }

        this.init();
    }

    init() {
        console.log('[Header] ✅ Найден хедер:', this.header.id);

        // Основные настройки
        this.setupScrollHandler();
        this.setupMobileMenu();
        this.setupSmoothScroll();
        this.updateBadges();
        this.setupCartManager();

        // Инициальная проверка скролла
        this.handleScroll();

        // Помечаем как инициализированный
        this.isInitialized = true;

        console.log('[Header] ✅ Инициализирован успешно');
    }

    setupScrollHandler() {
        let ticking = false;

        this.handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScroll = window.pageYOffset;

                    if (currentScroll > this.scrollThreshold) {
                        this.header.classList.add('scrolled');
                    } else {
                        this.header.classList.remove('scrolled');
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

        // Закрытие меню кнопкой X
        if (this.mobileClose) {
            this.mobileClose.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMobileMenu();
            });

            this.mobileClose.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.closeMobileMenu();
            });
        }

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

        console.log('[Header] 📱 Мобильное меню настроено');
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;

        console.log(`[Header] 📱 Переключение меню: ${this.isMenuOpen ? 'открыть' : 'закрыть'}`);

        // Анимация кнопки бургер
        if (this.mobileToggle) {
            this.mobileToggle.classList.toggle('active', this.isMenuOpen);
            console.log(`[Header] 🍔 Бургер кнопка: ${this.isMenuOpen ? 'активна' : 'неактивна'}`);
        }

        // Показ/скрытие меню
        if (this.mobileMenu) {
            this.mobileMenu.classList.toggle('active', this.isMenuOpen);
            console.log(`[Header] 📋 Мобильное меню: ${this.isMenuOpen ? 'показано' : 'скрыто'}`);
        }

        // Блокировка скролла
        this.toggleBodyScroll(!this.isMenuOpen);

        // Haptic feedback для мобильных
        if ('vibrate' in navigator && this.isMenuOpen) {
            navigator.vibrate(30);
        }

        console.log(`[Header] 📱 Мобильное меню ${this.isMenuOpen ? 'открыто' : 'закрыто'}`);
    }

    closeMobileMenu() {
        if (!this.isMenuOpen) return;

        console.log('[Header] 📱 Закрытие мобильного меню');

        this.isMenuOpen = false;

        if (this.mobileToggle) {
            this.mobileToggle.classList.remove('active');
        }

        if (this.mobileMenu) {
            this.mobileMenu.classList.remove('active');
        }

        // Разблокировка скролла
        this.toggleBodyScroll(true);

        console.log('[Header] 📱 Мобильное меню закрыто');
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

    // ИСПРАВЛЕННАЯ ФУНКЦИЯ setBadge - УБРАНА ПРИНУДИТЕЛЬНАЯ СТИЛИЗАЦИЯ
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

        // УБРАНА ПРИНУДИТЕЛЬНАЯ СТИЛИЗАЦИЯ ПРИ RESIZE
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            // Просто обновляем бейджи без принудительной стилизации
            setTimeout(() => this.updateBadges(), 100);
        });

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
    get currentCartCount() {
        return this.getCartCount();
    }

    get currentOrdersCount() {
        return this.getOrdersCount();
    }

    // Мобильная диагностика
    diagnoseMobile() {
        if (!this.isMobile) {
            console.log('[Header] 💻 Это десктопное устройство');
            return;
        }

        console.log('[Header] 📱 МОБИЛЬНАЯ ДИАГНОСТИКА:');
        console.log('- Ширина экрана:', window.innerWidth);
        console.log('- Высота экрана:', window.innerHeight);
        console.log('- User Agent:', navigator.userAgent);
        console.log('- Хедер найден:', !!this.header);

        if (this.header) {
            const rect = this.header.getBoundingClientRect();
            const styles = window.getComputedStyle(this.header);

            console.log('- Размеры хедера:', {
                width: rect.width,
                height: rect.height,
                top: rect.top,
                visible: rect.width > 0 && rect.height > 0
            });

            console.log('- CSS стили:', {
                display: styles.display,
                position: styles.position,
                zIndex: styles.zIndex,
                visibility: styles.visibility,
                opacity: styles.opacity
            });
        }

        console.log('- Мобильная кнопка:', !!this.mobileToggle);
        console.log('- Мобильное меню:', !!this.mobileMenu);
        console.log('- Инициализирован:', this.isInitialized);

        // Дополнительная диагностика кнопки меню
        if (this.mobileToggle) {
            const toggleRect = this.mobileToggle.getBoundingClientRect();
            const toggleStyles = window.getComputedStyle(this.mobileToggle);

            console.log('- Мобильная кнопка размеры:', {
                width: toggleRect.width,
                height: toggleRect.height,
                left: toggleRect.left,
                top: toggleRect.top,
                visible: toggleRect.width > 0 && toggleRect.height > 0
            });

            console.log('- Мобильная кнопка стили:', {
                display: toggleStyles.display,
                background: toggleStyles.background,
                border: toggleStyles.border,
                zIndex: toggleStyles.zIndex
            });
        }

        // Диагностика линий бургера
        const burgerLines = document.querySelectorAll('.burger-line');
        console.log('- Количество линий бургера:', burgerLines.length);

        burgerLines.forEach((line, index) => {
            const lineRect = line.getBoundingClientRect();
            const lineStyles = window.getComputedStyle(line);

            console.log(`- Линия ${index + 1}:`, {
                width: lineRect.width,
                height: lineRect.height,
                background: lineStyles.background,
                visible: lineRect.width > 0 && lineRect.height > 0
            });
        });
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

            // Мобильная диагностика для отладки
            if (window.innerWidth <= 768) {
                setTimeout(() => headerInstance.diagnoseMobile(), 500);
            }

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

// === ДОПОЛНИТЕЛЬНАЯ МОБИЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ===

// Для мобильных устройств - дополнительные попытки инициализации
if (window.innerWidth <= 768) {
    console.log('[Header] 📱 Мобильное устройство - дополнительные проверки...');

    let mobileRetries = 0;
    const maxMobileRetries = 3;

    const mobileInit = setInterval(() => {
        if (!headerInstance || !headerInstance.isInitialized) {
            mobileRetries++;
            console.log(`[Header] 📱 Мобильная попытка ${mobileRetries}/${maxMobileRetries}`);
            initHeader();

            if (mobileRetries >= maxMobileRetries) {
                clearInterval(mobileInit);
                console.error('[Header] 📱 Не удалось инициализировать на мобильном после', maxMobileRetries, 'попыток');
            }
        } else {
            clearInterval(mobileInit);
            console.log('[Header] 📱 Мобильная инициализация успешна');
        }
    }, 300);
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
    if (headerInstance && headerInstance.isInitialized) {
        headerInstance.forceUpdateBadges();
        console.log('[Header] 🔄 Принудительное обновление выполнено');
    } else {
        console.warn('[Header] ⚠️ Header не инициализирован');
    }
};

// Мобильная диагностика
window.debugMobileHeader = function() {
    console.log('[Header] 🔍 === МОБИЛЬНАЯ ДИАГНОСТИКА ===');
    console.log('Размер экрана:', window.innerWidth + 'x' + window.innerHeight);
    console.log('User Agent:', navigator.userAgent);

    if (headerInstance && headerInstance.isInitialized) {
        headerInstance.diagnoseMobile();
    } else {
        console.error('[Header] ❌ HeaderInstance не найден или не инициализирован');
        console.log('Попытка принудительной инициализации...');
        initHeader();
    }
};

// === ЭКСПОРТ ===

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeaderManager, initHeader };
}

console.log('[Header] 🎉 Скрипт загружен и готов к работе!');