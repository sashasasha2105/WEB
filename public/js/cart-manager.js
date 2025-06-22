/* === CART-MANAGER.JS - МИНИМАЛЬНОЕ ИСПРАВЛЕНИЕ === */

(function() {
    'use strict';

    console.log('[CartManager] Инициализация...');

    // Синглтон для управления корзиной
    const CartManager = {
        // Получить данные корзины (новая архитектура)
        getCartData: function() {
            try {
                const data = localStorage.getItem('cartData');
                const parsed = data ? JSON.parse(data) : {};
                return parsed.cartItems || []; // Возвращаем массив товаров
            } catch (error) {
                console.error('[CartManager] Ошибка чтения данных:', error);
                return [];
            }
        },

        // Сохранить данные корзины (новая архитектура)
        saveCartData: function(cartItems) {
            try {
                const data = {
                    cartItems: cartItems || []
                };

                localStorage.setItem('cartData', JSON.stringify(data));

                // Обновляем счетчик
                this.updateCartCounter();

                // Отправляем событие
                window.dispatchEvent(new CustomEvent('cartUpdated', { detail: data }));

                console.log('[CartManager] Данные сохранены:', data);
                return true;
            } catch (error) {
                console.error('[CartManager] Ошибка сохранения:', error);
                return false;
            }
        },

        // Получить общее количество товаров (новая архитектура)
        getTotalCount: function() {
            const items = this.getCartData();
            return items.length; // Считаем только камеры
        },

        // Добавить камеру в корзину (новый метод для главной страницы)
        addCameraToCart: function(memoryOption = '8gb') {
            const itemToAdd = { memory: memoryOption, timestamp: Date.now() };
            localStorage.setItem('itemToAdd', JSON.stringify(itemToAdd));
            console.log('[CartManager] Запланировано добавление камеры с картой:', memoryOption);
        },



        // Очистить корзину
        clearCart: function() {
            try {
                localStorage.removeItem('cartData');
                localStorage.removeItem('itemToAdd');
                this.updateCartCounter();

                window.dispatchEvent(new CustomEvent('cartUpdated', {
                    detail: { cartItems: [] }
                }));

                console.log('[CartManager] Корзина очищена');
                return true;
            } catch (error) {
                console.error('[CartManager] Ошибка очистки корзины:', error);
                return false;
            }
        },

        // ВОЗВРАЩАЕМ ОРИГИНАЛЬНУЮ РАБОЧУЮ ЛОГИКУ
        updateCartCounter: function() {
            const count = this.getTotalCount();
            const counters = document.querySelectorAll('.cart-count, #cart-count, .cart-badge');

            console.log(`[CartManager] Обновление счетчика: count=${count}, найдено элементов=${counters.length}`);

            counters.forEach((counter, index) => {
                if (counter) {
                    const oldText = counter.textContent;
                    counter.textContent = count;

                    // ИСПРАВЛЕНО: правильная логика показа/скрытия
                    counter.style.display = count > 0 ? 'flex' : 'none';

                    console.log(`[CartManager] Элемент ${index}: ${counter.className || counter.id} - было "${oldText}", стало "${count}", display="${counter.style.display}"`);

                    // Анимация при изменении
                    if (parseInt(oldText) !== count && count > 0) {
                        counter.style.animation = 'cartBounce 0.3s ease';
                        setTimeout(() => {
                            counter.style.animation = '';
                        }, 300);
                    }
                } else {
                    console.warn(`[CartManager] Элемент ${index} не найден`);
                }
            });

            console.log(`[CartManager] Счетчик обновлен: ${count}`);
        },

        // Принудительное обновление счетчика
        forceUpdateCounter: function() {
            setTimeout(() => {
                this.updateCartCounter();
            }, 100);
        },

        // Проверить наличие товаров
        hasItems: function() {
            return this.getTotalCount() > 0;
        }
    };

    // Добавляем глобальную анимацию для счетчика
    if (!document.getElementById('cart-counter-animation')) {
        const style = document.createElement('style');
        style.id = 'cart-counter-animation';
        style.textContent = `
            @keyframes cartBounce {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    // Делаем доступным глобально
    window.CartManager = CartManager;

    // ОТЛАДОЧНЫЕ ФУНКЦИИ
    window.debugCart = function() {
        console.log('=== DEBUG CART ===');
        console.log('CartData:', CartManager.getCartData());
        console.log('TotalCount:', CartManager.getTotalCount());
        console.log('Counters:', document.querySelectorAll('.cart-count, #cart-count, .cart-badge'));
        CartManager.updateCartCounter();
    };

    window.testAddToCart = function() {
        console.log('=== TEST ADD TO CART ===');
        CartManager.addCameraToCart('64gb');
        console.log('Added camera, new count:', CartManager.getTotalCount());
    };

    // Автоматическое обновление счетчика при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // ПРИНУДИТЕЛЬНО обновляем счетчик при загрузке
            setTimeout(() => {
                CartManager.updateCartCounter();
                console.log('[CartManager] Принудительное обновление при загрузке');
            }, 100);
        });
    } else {
        // ПРИНУДИТЕЛЬНО обновляем счетчик сразу
        setTimeout(() => {
            CartManager.updateCartCounter();
            console.log('[CartManager] Принудительное обновление сразу');
        }, 100);
    }

    // Слушаем storage события для синхронизации между вкладками
    window.addEventListener('storage', (e) => {
        if (e.key === 'cartData') {
            console.log('[CartManager] Обнаружено изменение в другой вкладке');
            CartManager.updateCartCounter();
        }
    });

    console.log('[CartManager] ✅ Инициализация завершена');
})();