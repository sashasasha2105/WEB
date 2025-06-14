/* === CART-MANAGER.JS - МИНИМАЛЬНОЕ ИСПРАВЛЕНИЕ === */

(function() {
    'use strict';

    console.log('[CartManager] Инициализация...');

    // Синглтон для управления корзиной
    const CartManager = {
        // Получить данные корзины
        getCartData: function() {
            try {
                const data = localStorage.getItem('cartData');
                const parsed = data ? JSON.parse(data) : {};

                const result = {
                    cameraCount: parsed.cameraCount || 0,
                    memoryCount: parsed.memoryCount || 0,
                    cartColor: parsed.cartColor || 'Чёрный'
                };

                console.log('[CartManager] getCartData:', { raw: data, parsed, result });
                return result;
            } catch (error) {
                console.error('[CartManager] Ошибка чтения данных:', error);
                return { cameraCount: 0, memoryCount: 0, cartColor: 'Чёрный' };
            }
        },

        // Сохранить данные корзины
        saveCartData: function(cameraCount, memoryCount, cartColor) {
            try {
                const data = {
                    cameraCount: Math.max(0, parseInt(cameraCount) || 0),
                    memoryCount: Math.max(0, parseInt(memoryCount) || 0),
                    cartColor: cartColor || 'Чёрный'
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

        // Получить общее количество товаров
        getTotalCount: function() {
            const data = this.getCartData();
            const total = data.cameraCount + data.memoryCount;
            console.log('[CartManager] getTotalCount:', { cameraCount: data.cameraCount, memoryCount: data.memoryCount, total });
            return total;
        },

        // Добавить товар
        addItem: function(type, quantity = 1) {
            const data = this.getCartData();

            if (type === 'camera') {
                data.cameraCount += quantity;
            } else if (type === 'memory') {
                data.memoryCount += quantity;
            }

            return this.saveCartData(data.cameraCount, data.memoryCount, data.cartColor);
        },

        // Удалить товар
        removeItem: function(type, quantity = 1) {
            const data = this.getCartData();

            if (type === 'camera') {
                data.cameraCount = Math.max(0, data.cameraCount - quantity);
            } else if (type === 'memory') {
                data.memoryCount = Math.max(0, data.memoryCount - quantity);
            }

            return this.saveCartData(data.cameraCount, data.memoryCount, data.cartColor);
        },

        // Установить цвет камеры
        setColor: function(color) {
            const data = this.getCartData();
            data.cartColor = color;
            return this.saveCartData(data.cameraCount, data.memoryCount, data.cartColor);
        },

        // Очистить корзину
        clearCart: function() {
            try {
                localStorage.removeItem('cartData');
                this.updateCartCounter();

                window.dispatchEvent(new CustomEvent('cartUpdated', {
                    detail: { cameraCount: 0, memoryCount: 0, cartColor: 'Чёрный' }
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
        CartManager.addItem('camera', 1);
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