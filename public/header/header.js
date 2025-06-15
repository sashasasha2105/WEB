// === ИСПРАВЛЕННЫЙ HEADER JS - УБРАН ЛОГОТИП ИЗ МОБИЛЬНОГО МЕНЮ ===

class HeaderManager {
    constructor() {
        console.log('[Header] 🚀 Инициализация HeaderManager...');

        // ИЩЕМ ХЕДЕР РАЗНЫМИ СПОСОБАМИ
        this.header = document.getElementById('siteHeader') ||
            document.querySelector('.site-header') ||
            document.querySelector('header') ||
            document.querySelector('[id*="header"]');

        if (!this.header) {
            console.error('[Header] ❌ Хедер не найден! Доступные элементы:');
            console.log('- По ID siteHeader:', !!document.getElementById('siteHeader'));
            console.log('- По классу .site-header:', !!document.querySelector('.site-header'));
            console.log('- По тегу header:', !!document.querySelector('header'));
            console.log('- Все header элементы:', document.querySelectorAll('header').length);

            // Попытаемся найти через некоторое время
            setTimeout(() => {
                this.findHeader();
            }, 500);
            return;
        }

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
        this.scrollThreshold = 20; // Уменьшил порог для быстрого срабатывания
        this.isMobile = window.innerWidth <= 768;
        this.isInitialized = false;

        this.init();
    }

    findHeader() {
        console.log('[Header] 🔍 Повторный поиск хедера...');

        this.header = document.getElementById('siteHeader') ||
            document.querySelector('.site-header') ||
            document.querySelector('header');

        if (this.header) {
            console.log('[Header] ✅ Хедер найден при повторном поиске:', this.header.tagName, this.header.id, this.header.className);
            this.init();
        } else {
            console.error('[Header] ❌ Хедер все еще не найден!');

            // Показываем все возможные элементы для отладки
            const allHeaders = document.querySelectorAll('header');
            const allWithSiteHeader = document.querySelectorAll('[class*="header"]');

            console.log('Найденные header элементы:', allHeaders.length);
            allHeaders.forEach((h, i) => {
                console.log(`  ${i + 1}. Tag: ${h.tagName}, ID: "${h.id}", Class: "${h.className}"`);
            });

            console.log('Элементы с "header" в классе:', allWithSiteHeader.length);
            allWithSiteHeader.forEach((h, i) => {
                console.log(`  ${i + 1}. Tag: ${h.tagName}, ID: "${h.id}", Class: "${h.className}"`);
            });
        }
    }

    init() {
        console.log('[Header] ✅ Найден хедер:', this.header.id);

        // Основные настройки
        this.setupScrollHandler();
        this.setupMobileMenu();
        this.setupSmoothScroll();
        this.updateBadges();
        this.setupCartManager();

        // КРИТИЧЕСКИ ВАЖНО: Экспорт в глобальную область СРАЗУ
        window.headerManager = this;
        window.HeaderManager = HeaderManager;

        // Инициальная проверка скролла
        this.handleScroll();

        // Помечаем как инициализированный
        this.isInitialized = true;

        console.log('[Header] ✅ Инициализирован успешно');
        console.log('[Header] 🎨 Glassmorphism эффект будет появляться при скролле больше', this.scrollThreshold, 'px');
        console.log('[Header] 🔧 Для тестирования используйте: testGlassmorphism() или window.scrollTo(0, 50)');
        console.log('[Header] 🌟 window.headerManager доступен:', !!window.headerManager);
    }

    setupScrollHandler() {
        let ticking = false;

        this.handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScroll = window.pageYOffset;

                    // Плавное появление glassmorphism эффекта
                    if (currentScroll > this.scrollThreshold) {
                        if (!this.header.classList.contains('scrolled')) {
                            this.header.classList.add('scrolled');
                            console.log('[Header] 🎨 Glassmorphism активирован при скролле:', currentScroll + 'px');
                        }
                    } else {
                        if (this.header.classList.contains('scrolled')) {
                            this.header.classList.remove('scrolled');
                            console.log('[Header] 🎨 Glassmorphism деактивирован при скролле:', currentScroll + 'px');
                        }
                    }

                    this.lastScroll = currentScroll;
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Привязываем scroll handler НЕМЕДЛЕННО
        window.addEventListener('scroll', this.handleScroll, { passive: true });

        // Дополнительная привязка через setTimeout для гарантии
        setTimeout(() => {
            window.addEventListener('scroll', this.handleScroll, { passive: true });
            console.log('[Header] 🔄 Дополнительная привязка scroll handler');
        }, 100);

        console.log('[Header] 📜 Scroll handler настроен с порогом', this.scrollThreshold, 'px');

        // ТЕСТИРУЕМ СРАЗУ
        setTimeout(() => {
            console.log('[Header] 🧪 Тестовый скролл для проверки...');
            const testScroll = this.scrollThreshold + 10;
            window.scrollTo(0, testScroll);

            setTimeout(() => {
                window.scrollTo(0, 0);
                console.log('[Header] ✅ Тестовый скролл завершен');
            }, 1000);
        }, 2000);
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

        // Управление body классами
        if (this.isMenuOpen) {
            document.body.classList.add('mobile-menu-open');
        } else {
            document.body.classList.remove('mobile-menu-open');
        }

        // Анимация кнопки бургер (поворот на 90 градусов)
        if (this.mobileToggle) {
            this.mobileToggle.classList.toggle('active', this.isMenuOpen);
            console.log(`[Header] 🍔 Бургер кнопка: ${this.isMenuOpen ? 'повернута на 90°' : 'в исходном положении'}`);

            // ПРОВЕРЯЕМ НА ДУБЛИРОВАНИЕ
            const allMenuToggles = document.querySelectorAll('.mobile-menu-toggle');
            if (allMenuToggles.length > 1) {
                console.warn(`[Header] ⚠️ ВНИМАНИЕ: Найдено ${allMenuToggles.length} кнопок меню! Может быть дублирование.`);
            }
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

        // АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ СКРОЛЛА ПРИ ОТКРЫТИИ МЕНЮ
        if (this.isMenuOpen && window.innerWidth <= 768) {
            setTimeout(() => {
                if (typeof window.forceEnableScroll === 'function') {
                    window.forceEnableScroll();
                }
            }, 100);
        }

        console.log(`[Header] 📱 Мобильное меню ${this.isMenuOpen ? 'открыто' : 'закрыто'}`);
    }

    closeMobileMenu() {
        if (!this.isMenuOpen) return;

        console.log('[Header] 📱 Закрытие мобильного меню');

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

    setBadge(badges, count) {
        Object.values(badges).forEach(badge => {
            if (badge) {
                badge.textContent = count;

                if (count > 0) {
                    badge.style.display = 'flex';

                    // ТОЛЬКО анимация появления - БЕЗ изменения размеров и позиций
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

        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            // ТОЛЬКО обновляем бейджи без любых стилей
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

    // НОВЫЕ МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ GLASSMORPHISM
    forceGlassmorphism(enable = true) {
        if (enable) {
            this.header.classList.add('scrolled');
            console.log('[Header] 🎨 Glassmorphism принудительно включен');
        } else {
            this.header.classList.remove('scrolled');
            console.log('[Header] 🎨 Glassmorphism принудительно выключен');
        }
    }

    isGlassmorphismActive() {
        return this.header.classList.contains('scrolled');
    }

    setScrollThreshold(threshold) {
        this.scrollThreshold = threshold;
        console.log('[Header] 🎨 Новый порог для glassmorphism:', threshold, 'px');
        // Немедленно проверяем текущее состояние
        this.handleScroll();
    }

    // ИСПРАВЛЕНО: Мобильная диагностика БЕЗ ЛОГОТИПА В МЕНЮ
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
        console.log('- Glassmorphism активен:', this.isGlassmorphismActive());
        console.log('- Scroll threshold:', this.scrollThreshold, 'px');
        console.log('- Текущий scroll:', window.pageYOffset, 'px');

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
                opacity: styles.opacity,
                background: styles.background,
                backdropFilter: styles.backdropFilter || styles.webkitBackdropFilter
            });
        }

        console.log('- Мобильная кнопка:', !!this.mobileToggle);
        console.log('- Мобильное меню:', !!this.mobileMenu);
        console.log('- Инициализирован:', this.isInitialized);

        // ПРОВЕРКА НА ДУБЛИРОВАНИЕ
        const allMenuToggles = document.querySelectorAll('.mobile-menu-toggle');
        console.log('- Найдено кнопок меню:', allMenuToggles.length);
        if (allMenuToggles.length > 1) {
            console.warn('⚠️ ДУБЛИРОВАНИЕ КНОПОК МЕНЮ!');
            allMenuToggles.forEach((toggle, index) => {
                const rect = toggle.getBoundingClientRect();
                const styles = window.getComputedStyle(toggle);
                console.log(`  Кнопка ${index + 1}:`, {
                    display: styles.display,
                    position: styles.position,
                    zIndex: styles.zIndex,
                    visible: rect.width > 0 && rect.height > 0
                });
            });
        }

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

        // Диагностика корзины
        const cartActions = document.querySelector('.site-header .header-actions');
        const cartBtn = document.querySelector('.site-header .header-actions .cart-btn');
        const cartBadge = document.querySelector('.site-header .header-actions .cart-badge');

        if (cartActions) {
            const actionsRect = cartActions.getBoundingClientRect();
            const actionsStyles = window.getComputedStyle(cartActions);

            console.log('- Корзина контейнер:', {
                width: actionsRect.width,
                height: actionsRect.height,
                left: actionsRect.left,
                right: actionsRect.right,
                top: actionsRect.top,
                position: actionsStyles.position,
                rightStyle: actionsStyles.right,
                visible: actionsRect.width > 0 && actionsRect.height > 0,
                outsideScreen: actionsRect.right > window.innerWidth || actionsRect.left < 0
            });
        }

        if (cartBtn) {
            const btnRect = cartBtn.getBoundingClientRect();

            console.log('- Корзина кнопка:', {
                width: btnRect.width,
                height: btnRect.height,
                left: btnRect.left,
                right: btnRect.right,
                visible: btnRect.width > 0 && btnRect.height > 0,
                outsideScreen: btnRect.right > window.innerWidth || btnRect.left < 0
            });
        }

        if (cartBadge) {
            const badgeRect = cartBadge.getBoundingClientRect();
            const badgeStyles = window.getComputedStyle(cartBadge);

            console.log('- Счетчик корзины:', {
                width: badgeRect.width,
                height: badgeRect.height,
                left: badgeRect.left,
                right: badgeRect.right,
                top: badgeRect.top,
                bottom: badgeRect.bottom,
                position: badgeStyles.position,
                topStyle: badgeStyles.top,
                rightStyle: badgeStyles.right,
                borderRadius: badgeStyles.borderRadius,
                display: badgeStyles.display,
                visible: badgeRect.width > 0 && badgeRect.height > 0,
                outsideScreen: badgeRect.right > window.innerWidth || badgeRect.left < 0 || badgeRect.top < 0
            });
        }

        // Диагностика линий бургера
        const burgerLines = document.querySelectorAll('.burger-line');
        console.log('- Количество линий бургера:', burgerLines.length);

        // ПРОВЕРЯЕМ ЧТО РОВНО ТРИ ПОЛОСКИ
        if (burgerLines.length !== 3) {
            console.error(`❌ НЕПРАВИЛЬНОЕ КОЛИЧЕСТВО ПОЛОСОК! Ожидается 3, найдено ${burgerLines.length}`);
        }

        burgerLines.forEach((line, index) => {
            const lineRect = line.getBoundingClientRect();
            const lineStyles = window.getComputedStyle(line);

            console.log(`- Линия ${index + 1}:`, {
                width: lineRect.width,
                height: lineRect.height,
                background: lineStyles.background,
                display: lineStyles.display,
                opacity: lineStyles.opacity,
                visibility: lineStyles.visibility,
                visible: lineRect.width > 0 && lineRect.height > 0 && lineStyles.opacity !== '0' && lineStyles.visibility !== 'hidden'
            });
        });

        // ИСПРАВЛЕНО: Диагностика мобильного меню
        if (this.mobileMenu) {
            const menuRect = this.mobileMenu.getBoundingClientRect();
            const menuStyles = window.getComputedStyle(this.mobileMenu);

            console.log('- Мобильное меню:', {
                width: menuRect.width,
                height: menuRect.height,
                display: menuStyles.display,
                zIndex: menuStyles.zIndex,
                opacity: menuStyles.opacity,
                visibility: menuStyles.visibility
            });

            console.log('- Кнопка и логотип накладываются поверх меню');
        }
    }
}

// === РАСШИРЕННАЯ ОТЛАДКА МОБИЛЬНОГО МЕНЮ ===

// Функция для диагностики скролла
window.debugMobileScroll = function() {
    console.log('[Mobile] 📜 === ДИАГНОСТИКА СКРОЛЛА ===');

    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileContent = document.querySelector('.mobile-menu-content');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileActions = document.querySelector('.mobile-actions');

    if (!mobileMenu) {
        console.error('❌ Мобильное меню не найдено');
        return;
    }

    // Информация об экране
    console.log('📱 Экран:', {
        width: window.innerWidth,
        height: window.innerHeight,
        availHeight: window.screen.availHeight,
        devicePixelRatio: window.devicePixelRatio,
        orientation: window.orientation || 'unknown'
    });

    // Информация о viewport
    console.log('🖼️ Viewport:', {
        vh: window.innerHeight,
        dvh: document.documentElement.clientHeight,
        visualViewport: window.visualViewport ? {
            height: window.visualViewport.height,
            width: window.visualViewport.width
        } : 'не поддерживается'
    });

    // Диагностика контейнера меню
    if (mobileContent) {
        const contentRect = mobileContent.getBoundingClientRect();
        const contentStyles = window.getComputedStyle(mobileContent);

        console.log('📋 Контейнер меню:', {
            height: contentRect.height,
            maxHeight: contentStyles.maxHeight,
            scrollHeight: mobileContent.scrollHeight,
            clientHeight: mobileContent.clientHeight,
            canScroll: mobileContent.scrollHeight > mobileContent.clientHeight
        });
    }

    // Диагностика навигации
    if (mobileNav) {
        const navRect = mobileNav.getBoundingClientRect();
        const navStyles = window.getComputedStyle(mobileNav);

        console.log('🧭 Навигация:', {
            height: navRect.height,
            scrollHeight: mobileNav.scrollHeight,
            clientHeight: mobileNav.clientHeight,
            overflowY: navStyles.overflowY,
            canScroll: mobileNav.scrollHeight > mobileNav.clientHeight,
            padding: navStyles.padding
        });

        // Считаем количество элементов
        const navLinks = mobileNav.querySelectorAll('.mobile-nav-link');
        console.log(`📍 Элементов навигации: ${navLinks.length}`);

        if (navLinks.length > 0) {
            const firstLink = navLinks[0];
            const lastLink = navLinks[navLinks.length - 1];
            const linkHeight = firstLink.getBoundingClientRect().height;

            console.log('🔗 Элементы навигации:', {
                linkHeight: linkHeight,
                totalLinksHeight: linkHeight * navLinks.length,
                firstLinkTop: firstLink.getBoundingClientRect().top,
                lastLinkBottom: lastLink.getBoundingClientRect().bottom,
                lastLinkVisible: lastLink.getBoundingClientRect().bottom <= navRect.bottom
            });
        }
    }

    // Диагностика секции действий
    if (mobileActions) {
        const actionsRect = mobileActions.getBoundingClientRect();
        const actionsStyles = window.getComputedStyle(mobileActions);

        console.log('⚡ Действия:', {
            height: actionsRect.height,
            maxHeight: actionsStyles.maxHeight,
            scrollHeight: mobileActions.scrollHeight,
            clientHeight: mobileActions.clientHeight,
            overflowY: actionsStyles.overflowY,
            canScroll: mobileActions.scrollHeight > mobileActions.clientHeight
        });

        const actionBtns = mobileActions.querySelectorAll('.mobile-action-btn');
        console.log(`🔘 Кнопок действий: ${actionBtns.length}`);
    }

    // Проверка адресной строки
    const addressBarHeight = window.outerHeight - window.innerHeight;
    console.log('🌐 Адресная строка:', {
        estimated_height: addressBarHeight,
        outerHeight: window.outerHeight,
        innerHeight: window.innerHeight,
        visible: addressBarHeight > 0
    });
};

// Функция для автоматического тестирования скролла
window.testMobileScroll = function() {
    console.log('[Mobile] 🧪 === ТЕСТ СКРОЛЛА ===');

    const mobileNav = document.querySelector('.mobile-nav');
    const mobileActions = document.querySelector('.mobile-actions');

    if (mobileNav) {
        console.log('🧭 Тестируем скролл навигации...');

        // Прокручиваем вниз
        mobileNav.scrollTop = mobileNav.scrollHeight;
        console.log(`📜 Прокрутили навигацию вниз: ${mobileNav.scrollTop}px`);

        setTimeout(() => {
            // Прокручиваем обратно
            mobileNav.scrollTop = 0;
            console.log('📜 Вернули навигацию в начало');
        }, 1000);
    }

    if (mobileActions) {
        console.log('⚡ Тестируем скролл действий...');

        setTimeout(() => {
            mobileActions.scrollTop = mobileActions.scrollHeight;
            console.log(`📜 Прокрутили действия вниз: ${mobileActions.scrollTop}px`);

            setTimeout(() => {
                mobileActions.scrollTop = 0;
                console.log('📜 Вернули действия в начало');
            }, 1000);
        }, 500);
    }
};

// Функция для добавления тестовых элементов (для проверки скролла)
window.addTestMenuItems = function() {
    console.log('[Mobile] ➕ === ДОБАВЛЕНИЕ ТЕСТОВЫХ ЭЛЕМЕНТОВ ===');

    const mobileNav = document.querySelector('.mobile-nav');
    const mobileActions = document.querySelector('.mobile-actions');

    if (mobileNav) {
        // Добавляем тестовые ссылки
        for (let i = 1; i <= 10; i++) {
            const testLink = document.createElement('a');
            testLink.href = '#';
            testLink.className = 'mobile-nav-link';
            testLink.innerHTML = `
                <span>Тестовый пункт ${i}</span>
                <div class="mobile-nav-arrow">→</div>
            `;
            mobileNav.appendChild(testLink);
        }
        console.log('✅ Добавлено 10 тестовых пунктов навигации');
    }

    if (mobileActions) {
        // Добавляем тестовые кнопки
        for (let i = 1; i <= 5; i++) {
            const testBtn = document.createElement('a');
            testBtn.href = '#';
            testBtn.className = 'mobile-action-btn';
            testBtn.innerHTML = `
                <div class="action-icon">🔧</div>
                <div class="action-content">
                    <span class="action-title">Тестовая кнопка ${i}</span>
                    <span class="action-subtitle">Описание кнопки</span>
                </div>
            `;
            mobileActions.appendChild(testBtn);
        }
        console.log('✅ Добавлено 5 тестовых кнопок действий');
    }

    // Проверяем скролл после добавления
    setTimeout(() => {
        window.debugMobileScroll();
        window.testMobileScroll();
    }, 200);
};

// Функция для удаления тестовых элементов
window.removeTestMenuItems = function() {
    console.log('[Mobile] ➖ === УДАЛЕНИЕ ТЕСТОВЫХ ЭЛЕМЕНТОВ ===');

    // Удаляем тестовые ссылки
    const testLinks = document.querySelectorAll('.mobile-nav-link');
    testLinks.forEach((link, index) => {
        if (link.textContent.includes('Тестовый пункт')) {
            link.remove();
        }
    });

    // Удаляем тестовые кнопки
    const testBtns = document.querySelectorAll('.mobile-action-btn');
    testBtns.forEach((btn, index) => {
        if (btn.textContent.includes('Тестовая кнопка')) {
            btn.remove();
        }
    });

    console.log('✅ Тестовые элементы удалены');
};

// Функция для полного тестирования мобильного меню
window.fullMobileTest = function() {
    console.log('[Mobile] 🎯 === ПОЛНОЕ ТЕСТИРОВАНИЕ МОБИЛЬНОГО МЕНЮ ===');

    // 1. Базовая диагностика
    window.debugMobileScroll();

    // 2. Открываем меню если закрыто
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');

    if (mobileMenu && !mobileMenu.classList.contains('active')) {
        console.log('📱 Открываем мобильное меню...');
        if (mobileToggle) {
            mobileToggle.click();
        }
    }

    setTimeout(() => {
        // 3. Добавляем тестовые элементы
        window.addTestMenuItems();

        setTimeout(() => {
            // 4. Тестируем скролл
            window.testMobileScroll();

            setTimeout(() => {
                // 5. Убираем тестовые элементы
                window.removeTestMenuItems();
                console.log('🎉 Полное тестирование завершено!');
            }, 4000);
        }, 1000);
    }, 500);
};

// === ПРИНУДИТЕЛЬНОЕ ВКЛЮЧЕНИЕ СКРОЛЛА ===

window.forceEnableScroll = function() {
    console.log('[Mobile] 🔧 === ПРИНУДИТЕЛЬНОЕ ВКЛЮЧЕНИЕ СКРОЛЛА ===');

    const mobileNav = document.querySelector('.mobile-nav');
    const mobileActions = document.querySelector('.mobile-actions');
    const mobileMenuContent = document.querySelector('.mobile-menu-content');

    if (!mobileNav || !mobileActions) {
        console.error('❌ Мобильные элементы не найдены');
        return;
    }

    // === ПРИНУДИТЕЛЬНЫЕ СТИЛИ ДЛЯ НАВИГАЦИИ ===
    if (mobileNav) {
        mobileNav.style.setProperty('overflow-y', 'scroll', 'important');
        mobileNav.style.setProperty('overflow-x', 'hidden', 'important');
        mobileNav.style.setProperty('max-height', '400px', 'important');
        mobileNav.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
        mobileNav.style.setProperty('scrollbar-width', 'thin', 'important');
        mobileNav.style.setProperty('scrollbar-color', 'rgba(255, 255, 255, 0.6) transparent', 'important');

        // Добавляем класс для CSS
        mobileNav.classList.add('force-scroll');

        console.log('✅ Навигация: принудительный скролл включен');

        // Проверяем результат
        const navRect = mobileNav.getBoundingClientRect();
        const canScroll = mobileNav.scrollHeight > mobileNav.clientHeight;
        console.log('📊 Навигация после исправления:', {
            height: navRect.height,
            scrollHeight: mobileNav.scrollHeight,
            clientHeight: mobileNav.clientHeight,
            canScroll: canScroll,
            overflowY: window.getComputedStyle(mobileNav).overflowY
        });
    }

    // === ПРИНУДИТЕЛЬНЫЕ СТИЛИ ДЛЯ ДЕЙСТВИЙ ===
    if (mobileActions) {
        mobileActions.style.setProperty('overflow-y', 'auto', 'important');
        mobileActions.style.setProperty('overflow-x', 'hidden', 'important');
        mobileActions.style.setProperty('max-height', '180px', 'important');
        mobileActions.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
        mobileActions.style.setProperty('scrollbar-width', 'thin', 'important');
        mobileActions.style.setProperty('scrollbar-color', 'rgba(255, 255, 255, 0.5) transparent', 'important');

        // Добавляем класс для CSS
        mobileActions.classList.add('force-scroll');

        console.log('✅ Действия: принудительный скролл включен');

        // Проверяем результат
        const actionsRect = mobileActions.getBoundingClientRect();
        const canScroll = mobileActions.scrollHeight > mobileActions.clientHeight;
        console.log('📊 Действия после исправления:', {
            height: actionsRect.height,
            scrollHeight: mobileActions.scrollHeight,
            clientHeight: mobileActions.clientHeight,
            canScroll: canScroll,
            overflowY: window.getComputedStyle(mobileActions).overflowY
        });
    }

    // === ИСПРАВЛЕНИЕ КОНТЕЙНЕРА МЕНЮ ===
    if (mobileMenuContent) {
        mobileMenuContent.style.setProperty('height', '100vh', 'important');
        mobileMenuContent.style.setProperty('height', '100dvh', 'important');
        mobileMenuContent.style.setProperty('max-height', '100vh', 'important');
        mobileMenuContent.style.setProperty('display', 'flex', 'important');
        mobileMenuContent.style.setProperty('flex-direction', 'column', 'important');

        console.log('✅ Контейнер меню: исправлен');
    }

    // === ТЕСТИРОВАНИЕ СКРОЛЛА ===
    setTimeout(() => {
        console.log('🧪 Тестируем скролл после исправления...');

        if (mobileNav) {
            const oldScrollTop = mobileNav.scrollTop;
            mobileNav.scrollTop = 50;

            setTimeout(() => {
                const newScrollTop = mobileNav.scrollTop;
                if (newScrollTop > oldScrollTop) {
                    console.log('✅ Скролл навигации РАБОТАЕТ!');
                } else {
                    console.log('❌ Скролл навигации НЕ работает');
                }

                // Возвращаем обратно
                mobileNav.scrollTop = oldScrollTop;
            }, 100);
        }

        if (mobileActions) {
            const oldScrollTop = mobileActions.scrollTop;
            mobileActions.scrollTop = 20;

            setTimeout(() => {
                const newScrollTop = mobileActions.scrollTop;
                if (newScrollTop > oldScrollTop) {
                    console.log('✅ Скролл действий РАБОТАЕТ!');
                } else {
                    console.log('❌ Скролл действий НЕ работает');
                }

                // Возвращаем обратно
                mobileActions.scrollTop = oldScrollTop;
            }, 200);
        }
    }, 300);

    console.log('🎉 Принудительное включение скролла завершено!');
};

// === ПРИНУДИТЕЛЬНОЕ ИСПРАВЛЕНИЕ SCROLL HANDLER ===
window.fixScrollHandler = function() {
    console.log('[Header] 🔧 === ПРИНУДИТЕЛЬНОЕ ИСПРАВЛЕНИЕ SCROLL HANDLER ===');

    if (!window.headerManager) {
        console.error('[Header] ❌ HeaderManager не найден! Попытка создания...');
        waitForHeaderElement().then(() => {
            initHeader();
            setTimeout(() => {
                if (window.headerManager) {
                    console.log('[Header] ✅ HeaderManager создан, повторяем исправление...');
                    window.fixScrollHandler();
                }
            }, 500);
        });
        return;
    }

    const header = document.getElementById('siteHeader') ||
        document.querySelector('.site-header') ||
        document.querySelector('header');

    if (!header) {
        console.error('[Header] ❌ Header элемент не найден!');
        console.log('Поиск всех возможных элементов...');
        window.diagnoseGlassmorphism();
        return;
    }

    console.log('[Header] ✅ Header найден:', header.tagName, header.id);

    // Удаляем старые обработчики
    if (window.headerManager.handleScroll) {
        window.removeEventListener('scroll', window.headerManager.handleScroll);
    }

    // Создаем новый обработчик
    const scrollHandler = function() {
        const currentScroll = window.pageYOffset;
        const threshold = window.headerManager.scrollThreshold || 20;

        console.log(`[Header] 📜 Scroll: ${currentScroll}px (порог: ${threshold}px)`);

        if (currentScroll > threshold) {
            if (!header.classList.contains('scrolled')) {
                header.classList.add('scrolled');
                console.log('[Header] 🎨 ✅ Glassmorphism ВКЛЮЧЕН');
            }
        } else {
            if (header.classList.contains('scrolled')) {
                header.classList.remove('scrolled');
                console.log('[Header] 🎨 ❌ Glassmorphism ВЫКЛЮЧЕН');
            }
        }
    };

    // Привязываем новый обработчик
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.headerManager.handleScroll = scrollHandler;

    console.log('[Header] ✅ Новый scroll handler установлен');

    // Тестируем
    setTimeout(() => {
        console.log('[Header] 🧪 Тестируем scroll handler...');
        window.scrollTo(0, 50);

        setTimeout(() => {
            console.log('[Header] 🔄 Возвращаем скролл в начало');
            window.scrollTo(0, 0);
        }, 1500);
    }, 1000);
};

// === БЫСТРАЯ ДИАГНОСТИКА GLASSMORPHISM ===
window.diagnoseGlassmorphism = function() {
    console.log('[Header] 🔍 === ДИАГНОСТИКА GLASSMORPHISM ===');

    const header = document.getElementById('siteHeader') ||
        document.querySelector('.site-header') ||
        document.querySelector('header');

    if (!header) {
        console.error('❌ Header не найден!');
        console.log('Доступные элементы:');
        console.log('- Headers:', document.querySelectorAll('header').length);
        console.log('- .site-header:', document.querySelectorAll('.site-header').length);
        console.log('- #siteHeader:', !!document.getElementById('siteHeader'));
        return;
    }

    const currentScroll = window.pageYOffset;
    const hasScrolledClass = header.classList.contains('scrolled');
    const computedStyles = window.getComputedStyle(header);

    console.log('📊 Текущее состояние:');
    console.log('- Header найден:', header.tagName, `#${header.id}`, `.${header.className}`);
    console.log('- Scroll position:', currentScroll + 'px');
    console.log('- Класс .scrolled:', hasScrolledClass);
    console.log('- Background:', computedStyles.background);
    console.log('- Backdrop-filter:', computedStyles.backdropFilter || computedStyles.webkitBackdropFilter || 'не поддерживается');
    console.log('- Box-shadow:', computedStyles.boxShadow);
    console.log('- Border-bottom:', computedStyles.borderBottom);

    // Проверяем поддержку backdrop-filter
    const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
    console.log('- Поддержка backdrop-filter:', supportsBackdropFilter);

    if (window.headerManager) {
        console.log('- Scroll threshold:', window.headerManager.scrollThreshold + 'px');
        console.log('- Should be active:', currentScroll > window.headerManager.scrollThreshold);
    }

    // Попробуем принудительно активировать
    console.log('\n🧪 Принудительная активация...');
    header.classList.add('scrolled');

    setTimeout(() => {
        const newStyles = window.getComputedStyle(header);
        console.log('✅ После активации:');
        console.log('- Background:', newStyles.background);
        console.log('- Backdrop-filter:', newStyles.backdropFilter || newStyles.webkitBackdropFilter || 'не поддерживается');
        console.log('- Box-shadow:', newStyles.boxShadow !== 'none' ? '✅ Есть' : '❌ Нет');
        console.log('- Border-bottom:', newStyles.borderBottom);

        // Возвращаем к нормальному состоянию
        if (currentScroll <= (window.headerManager?.scrollThreshold || 20)) {
            header.classList.remove('scrolled');
            console.log('🔄 Вернули к нормальному состоянию');
        }
    }, 1000);
};

// === БЫСТРОЕ ИСПРАВЛЕНИЕ ===
window.quickFixScroll = function() {
    console.log('[Mobile] ⚡ === БЫСТРОЕ ИСПРАВЛЕНИЕ СКРОЛЛА ===');

    // Открываем меню если закрыто
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');

    if (mobileMenu && !mobileMenu.classList.contains('active') && mobileToggle) {
        console.log('📱 Открываем меню...');
        mobileToggle.click();
    }

    setTimeout(() => {
        window.forceEnableScroll();
        setTimeout(() => {
            window.testMobileScroll();
        }, 500);
    }, 200);
};

// === ФУНКЦИИ ДЛЯ ТЕСТИРОВАНИЯ GLASSMORPHISM ===
window.testGlassmorphism = function() {
    console.log('[Header] 🎨 === ТЕСТ GLASSMORPHISM ЭФФЕКТА ===');

    if (!window.headerManager) {
        console.error('[Header] ❌ HeaderManager не найден');
        return;
    }

    console.log('🔍 Текущее состояние:');
    console.log('- Scroll position:', window.pageYOffset);
    console.log('- Scroll threshold:', window.headerManager.scrollThreshold);
    console.log('- Glassmorphism активен:', window.headerManager.isGlassmorphismActive());

    console.log('\n🎭 Принудительно включаем glassmorphism на 3 секунды...');
    window.headerManager.forceGlassmorphism(true);

    setTimeout(() => {
        console.log('🎭 Принудительно выключаем glassmorphism на 2 секунды...');
        window.headerManager.forceGlassmorphism(false);

        setTimeout(() => {
            console.log('🔄 Возвращаем автоматический режим');
            window.headerManager.handleScroll(); // Проверяем текущий скролл
            console.log('✅ Тест завершен. Glassmorphism работает по скроллу');
        }, 2000);
    }, 3000);
};

window.setGlassmorphismThreshold = function(pixels = 50) {
    console.log(`[Header] 🎨 Устанавливаем новый порог: ${pixels}px`);

    if (!window.headerManager) {
        console.error('[Header] ❌ HeaderManager не найден');
        return;
    }

    window.headerManager.setScrollThreshold(pixels);
    console.log('✅ Новый порог установлен. Попробуйте прокрутить страницу');
};

// === АВТОМАТИЧЕСКОЕ ВКЛЮЧЕНИЕ НА МОБИЛЬНЫХ ===
if (window.innerWidth <= 768) {
    // Ждем когда меню откроется и применяем исправления
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const mobileMenu = document.querySelector('.mobile-menu');
            if (mobileMenu) {
                // Слушаем открытие меню
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.target.classList.contains('active')) {
                            console.log('📱 Мобильное меню открыто - применяем исправления...');
                            setTimeout(() => {
                                window.forceEnableScroll();
                            }, 100);
                        }
                    });
                });

                observer.observe(mobileMenu, {
                    attributes: true,
                    attributeFilter: ['class']
                });

                console.log('👀 Наблюдатель за мобильным меню установлен');
            }
        }, 500);
    });
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

        if (headerInstance && headerInstance.isInitialized) {
            // КРИТИЧЕСКИ ВАЖНО: Экспорт в глобальную область
            window.headerManager = headerInstance;
            window.HeaderManager = HeaderManager;

            console.log('[Header] ✅ Успешно инициализирован');
            console.log('[Header] 🎨 Доступные команды для glassmorphism:');
            console.log('  - diagnoseGlassmorphism() - быстрая диагностика');
            console.log('  - testGlassmorphism() - тест эффекта');
            console.log('  - setGlassmorphismThreshold(pixels) - изменить порог');
            console.log('  - headerManager.forceGlassmorphism(true/false) - принудительно вкл/выкл');
            console.log('  - window.scrollTo(0, 50) - прокрутить для тестирования');

            // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА
            setTimeout(() => {
                if (window.headerManager) {
                    console.log('[Header] ✅ window.headerManager подтвержден');
                } else {
                    console.error('[Header] ❌ window.headerManager НЕ СОЗДАН!');
                    window.headerManager = headerInstance;
                }
            }, 100);

            // Первичное обновление бейджей
            setTimeout(() => headerInstance.forceUpdateBadges(), 300);

            // Мобильная диагностика для отладки
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    headerInstance.diagnoseMobile();
                    // Автоматически исправляем дублирование
                    window.fixMenuDuplication();
                }, 500);
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

// === АВТОИНИЦИАЛИЗАЦИЯ С ПРОВЕРКОЙ DOM ===

function waitForHeaderElement() {
    return new Promise((resolve) => {
        // Проверяем, есть ли элемент сейчас
        const header = document.getElementById('siteHeader') ||
            document.querySelector('.site-header') ||
            document.querySelector('header');

        if (header) {
            console.log('[Header] ✅ Элемент найден сразу:', header.tagName, header.id);
            resolve(header);
            return;
        }

        // Если нет - ждем через MutationObserver
        console.log('[Header] ⏳ Ждем появления элемента в DOM...');

        const observer = new MutationObserver((mutations) => {
            const header = document.getElementById('siteHeader') ||
                document.querySelector('.site-header') ||
                document.querySelector('header');

            if (header) {
                console.log('[Header] ✅ Элемент появился в DOM:', header.tagName, header.id);
                observer.disconnect();
                resolve(header);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Таймаут на случай если элемент так и не появится
        setTimeout(() => {
            observer.disconnect();
            console.error('[Header] ❌ Элемент не найден за 10 секунд!');
            resolve(null);
        }, 10000);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('[Header] 📄 DOM загружен, ищем header...');
        await waitForHeaderElement();
        setTimeout(initHeader, 50);
    });
} else {
    console.log('[Header] 📄 DOM уже загружен, ищем header...');
    waitForHeaderElement().then(() => {
        setTimeout(initHeader, 100);
    });
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
            // Проверяем дублирование после успешной инициализации
            setTimeout(() => {
                window.fixMenuDuplication();
            }, 100);
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

// Новая функция для быстрого исправления проблем
window.fixAllMobileIssues = function() {
    console.log('[Header] 🔧 === ИСПРАВЛЕНИЕ ВСЕХ МОБИЛЬНЫХ ПРОБЛЕМ ===');
    window.fixMenuDuplication();
    window.fixMobileCart();
    window.fixScrollHandler();
    window.quickFixScroll();
    window.debugMobileHeader();
};

// ФУНКЦИЯ ДЛЯ ИСПРАВЛЕНИЯ ДУБЛИРОВАНИЯ
window.fixMenuDuplication = function() {
    console.log('[Header] 🔧 === ИСПРАВЛЕНИЕ ДУБЛИРОВАНИЯ КНОПОК МЕНЮ ===');

    // Проверяем кнопки
    const allMenuToggles = document.querySelectorAll('.mobile-menu-toggle');
    console.log('Найдено кнопок меню:', allMenuToggles.length);

    if (allMenuToggles.length > 1) {
        console.log('Удаляем лишние кнопки...');
        // Оставляем только первую кнопку, остальные скрываем
        allMenuToggles.forEach((toggle, index) => {
            if (index > 0) {
                toggle.style.display = 'none';
                toggle.style.visibility = 'hidden';
                toggle.style.opacity = '0';
                console.log(`Скрыта кнопка ${index + 1}`);
            }
        });
        console.log('✅ Кнопки исправлены');
    } else {
        console.log('✅ Дублирования кнопок не найдено');
    }

    // Проверяем полоски
    const allBurgerLines = document.querySelectorAll('.burger-line');
    console.log('Найдено полосок бургера:', allBurgerLines.length);

    if (allBurgerLines.length !== 3) {
        console.warn(`⚠️ НЕПРАВИЛЬНОЕ КОЛИЧЕСТВО ПОЛОСОК! Ожидается 3, найдено ${allBurgerLines.length}`);
    } else {
        console.log('✅ Количество полосок правильное');

        // Убеждаемся что все полоски видимы
        allBurgerLines.forEach((line, index) => {
            line.style.display = 'block';
            line.style.opacity = '1';
            line.style.visibility = 'visible';
        });
    }
};

// Функция исправления мобильной корзины - ТОЛЬКО диагностика
window.fixMobileCart = function() {
    console.log('[Header] 🔧 === ДИАГНОСТИКА МОБИЛЬНОЙ КОРЗИНЫ ===');

    const cartActions = document.querySelector('.site-header .header-actions');
    const cartBadge = document.querySelector('.site-header .header-actions .cart-badge');

    if (cartActions) {
        const rect = cartActions.getBoundingClientRect();
        console.log('Корзина:', {
            left: rect.left,
            right: rect.right,
            width: rect.width,
            outsideScreen: rect.right > window.innerWidth
        });

        if (rect.right > window.innerWidth) {
            console.error('❌ Корзина выходит за границы экрана!');
            console.log('💡 Проверьте CSS правила для @media (max-width: 768px)');
        } else {
            console.log('✅ Корзина в пределах экрана');
        }
    }

    if (cartBadge) {
        const badgeRect = cartBadge.getBoundingClientRect();
        const badgeStyles = window.getComputedStyle(cartBadge);
        console.log('Счетчик:', {
            top: badgeRect.top,
            width: badgeRect.width,
            height: badgeRect.height,
            borderRadius: badgeStyles.borderRadius,
            isRound: badgeStyles.borderRadius === '50%' || parseFloat(badgeStyles.borderRadius) >= Math.min(badgeRect.width, badgeRect.height) / 2
        });
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

// Автоматический запуск проверки при загрузке (только на мобильных)
if (window.innerWidth <= 768) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('[Header] 🚀 Автоматическая диагностика через 3 секунды...');
            console.log('[Header] 💡 Доступные команды:');
            console.log('  - diagnoseGlassmorphism() - полная диагностика эффекта');
            console.log('  - fixScrollHandler() - исправление scroll handler');
            console.log('  - testGlassmorphism() - тест glassmorphism эффекта');
            console.log('  - setGlassmorphismThreshold(50) - изменить порог скролла');
            console.log('  - window.scrollTo(0, 50) - прокрутить для тестирования');
            console.log('  - fullMobileTest() - полное тестирование');
            console.log('  - debugMobileScroll() - диагностика скролла');
            console.log('  - forceEnableScroll() - принудительное включение скролла');
            console.log('  - quickFixScroll() - быстрое исправление с тестом');
            console.log('  - fixAllMobileIssues() - исправление всех проблем');
            console.log('[Header] 🌟 Для быстрой проверки: diagnoseGlassmorphism()');
        }, 1000);
    });
}

// === ЭКСПОРТ ===

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeaderManager, initHeader };
}

console.log('[Header] 🎉 Улучшенный скрипт с настоящим glassmorphism эффектом загружен!');
console.log('[Header] 🔍 Система автоматического поиска header элемента активна');
console.log('[Header] 🎨 При скролле >20px появится стеклянный эффект с размытием фона');

// === АВТОМАТИЧЕСКАЯ ПРОВЕРКА ЧЕРЕЗ 3 СЕКУНДЫ ===
setTimeout(() => {
    if (!window.headerManager) {
        console.warn('[Header] ⚠️ Критическая ошибка: HeaderManager не создан! Принудительное исправление...');
        waitForHeaderElement().then(() => {
            initHeader();
            setTimeout(() => {
                if (window.headerManager) {
                    window.fixScrollHandler();
                }
            }, 500);
        });
    } else {
        console.log('[Header] ✅ HeaderManager работает нормально');

        // Проверяем работает ли scroll handler
        setTimeout(() => {
            const originalScroll = window.pageYOffset;
            window.scrollTo(0, 30);

            setTimeout(() => {
                const header = document.getElementById('siteHeader') ||
                    document.querySelector('.site-header') ||
                    document.querySelector('header');

                if (header && !header.classList.contains('scrolled')) {
                    console.warn('[Header] ⚠️ Scroll handler не сработал! Исправляем...');
                    window.fixScrollHandler();
                } else {
                    console.log('[Header] ✅ Scroll handler работает корректно');
                    console.log('[Header] 🎨 Glassmorphism эффект активен');
                }

                // Возвращаем исходную позицию
                window.scrollTo(0, originalScroll);
            }, 200);
        }, 1000);
    }
}, 3000);