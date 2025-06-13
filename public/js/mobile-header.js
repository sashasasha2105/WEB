// === File: js/mobile-header.js ===
// === СОВМЕСТИМОСТЬ СО СТАРЫМ КОДОМ ===

document.addEventListener('DOMContentLoaded', () => {
  console.log('[MobileHeader] 🔍 Проверяем наличие премиального хедера');

  // Даем время premium-header.js инициализироваться
  setTimeout(() => {
    const premiumHeader = document.getElementById('premiumHeader');
    const oldHeader = document.getElementById('site-header');

    if (premiumHeader || window.headerManager) {
      console.log('[MobileHeader] ✅ Новый хедер найден, используем его');

      // Если новый хедер есть, старую логику не выполняем
      // Но можем добавить дополнительную совместимость
      if (window.headerManager) {
        // Создаем алиасы для совместимости
        window.oldHeaderCompat = {
          updateCartCounter: () => window.headerManager.forceUpdateBadges(),
          getTotalCount: () => window.headerManager.currentCartCount
        };

        console.log('[MobileHeader] 🔗 Совместимость с новым хедером настроена');
      }

      return;
    }

    console.log('[MobileHeader] ⚠️ Премиальный хедер не найден, используем старую логику');

    // === СТАРАЯ ЛОГИКА ДЛЯ СОВМЕСТИМОСТИ ===

    if (!window.matchMedia('(max-width: 767px)').matches) {
      console.log('[MobileHeader] 💻 Не мобильное устройство, выходим');
      return;
    }

    const header = oldHeader;
    if (!header) {
      console.log('[MobileHeader] ❌ Старый хедер не найден');
      return;
    }

    console.log('[MobileHeader] 📱 Настраиваем старый мобильный хедер');

    const burger = header.querySelector('.burger-menu');
    const heroGif = document.querySelector('.hero-gif');
    const threshold = heroGif ? heroGif.offsetHeight : 200;
    let hasAppeared = false;

    // Настройка старого хедера с новыми стилями
    header.style.transform = 'translateY(-100%)';
    header.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    header.style.background = 'rgba(255, 255, 255, 0.05)';
    header.style.backdropFilter = 'blur(15px)';

    // Обработчик скролла с улучшенными эффектами
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;

          if (!hasAppeared && scrollY > threshold) {
            header.classList.add('mobile-visible');
            header.style.background = 'rgba(255, 255, 255, 0.15)';
            header.style.backdropFilter = 'blur(25px)';
            hasAppeared = true;
            console.log('[MobileHeader] 📲 Хедер появился при скролле');
          } else if (hasAppeared && scrollY <= threshold) {
            header.classList.remove('mobile-visible', 'mobile-menu-open');
            header.style.background = 'rgba(255, 255, 255, 0.05)';
            header.style.backdropFilter = 'blur(15px)';
            hasAppeared = false;
            console.log('[MobileHeader] 📲 Хедер скрылся при возврате наверх');
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Бургер меню
    if (burger) {
      burger.addEventListener('click', () => {
        const isOpen = header.classList.contains('mobile-menu-open');
        header.classList.toggle('mobile-menu-open');

        // Блокировка скролла при открытом меню
        if (!isOpen) {
          document.body.style.overflow = 'hidden';
          console.log('[MobileHeader] 🍔 Меню открыто');
        } else {
          document.body.style.overflow = '';
          console.log('[MobileHeader] 🍔 Меню закрыто');
        }

        // Haptic feedback
        if ('vibrate' in navigator && !isOpen) {
          navigator.vibrate(50);
        }
      });
    }

    // Обновление счётчика корзины (улучшенная версия)
    updateOldCartCounter();

    function updateOldCartCounter() {
      let count = 0;
      try {
        const data = JSON.parse(localStorage.getItem('cartData') || '{}');
        count = (data.cameraCount || 0) + (data.memoryCount || 0);
      } catch (e) {
        console.error('[MobileHeader] ❌ Ошибка чтения cartData:', e);
      }

      const badge = header.querySelector('.cart-count');
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';

        if (count > 0) {
          // Анимация появления бейджа
          badge.style.animation = 'none';
          requestAnimationFrame(() => {
            badge.style.animation = 'badgeEntry 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
          });
        }

        console.log(`[MobileHeader] 🛒 Обновлен счетчик корзины: ${count}`);
      }
    }

    // Слушаем обновления корзины
    window.addEventListener('cartUpdated', () => {
      console.log('[MobileHeader] 📦 Получено событие cartUpdated');
      updateOldCartCounter();
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'cartData') {
        console.log('[MobileHeader] 💾 LocalStorage изменен: cartData');
        updateOldCartCounter();
      }
    });

    // Периодическое обновление
    setInterval(updateOldCartCounter, 10000);

    // Экспорт методов для совместимости
    window.oldHeaderCompat = {
      updateCartCounter: updateOldCartCounter,
      getTotalCount: () => {
        try {
          const data = JSON.parse(localStorage.getItem('cartData') || '{}');
          return (data.cameraCount || 0) + (data.memoryCount || 0);
        } catch {
          return 0;
        }
      },
      openMobileMenu: () => {
        if (burger && !header.classList.contains('mobile-menu-open')) {
          burger.click();
        }
      },
      closeMobileMenu: () => {
        if (header.classList.contains('mobile-menu-open')) {
          header.classList.remove('mobile-menu-open');
          document.body.style.overflow = '';
        }
      }
    };

    console.log('[MobileHeader] ✅ Старая логика настроена с улучшениями');

  }, 300); // Даем время premium-header.js инициализироваться
});

// Глобальная функция для принудительного обновления (совместимость)
window.updateMobileHeaderBadges = function() {
  if (window.headerManager) {
    window.headerManager.forceUpdateBadges();
  } else if (window.oldHeaderCompat) {
    window.oldHeaderCompat.updateCartCounter();
  } else {
    console.warn('[MobileHeader] ⚠️ Ни один хедер не найден');
  }
};