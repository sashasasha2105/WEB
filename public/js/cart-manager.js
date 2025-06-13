/* === CART-MANAGER.JS - ОБНОВЛЕННАЯ ВЕРСИЯ === */

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

                return {
                    cameraCount: parsed.cameraCount || 0,
                    memoryCount: parsed.memoryCount || 0,
                    cartColor: parsed.cartColor || 'Чёрный'
                };
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
            return data.cameraCount + data.memoryCount;
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

        // Обновить счетчик в UI
        updateCartCounter: function() {
            const count = this.getTotalCount();
            const counters = document.querySelectorAll('.cart-count, #cart-count, .cart-badge');

            counters.forEach(counter => {
                if (counter) {
                    counter.textContent = count;
                    counter.style.display = count > 0 ? 'flex' : 'flex';

                    // Анимация при изменении
                    if (parseInt(counter.textContent) !== count) {
                        counter.style.animation = 'cartBounce 0.3s ease';
                        setTimeout(() => {
                            counter.style.animation = '';
                        }, 300);
                    }
                }
            });

            console.log('[CartManager] Счетчик обновлен:', count);
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

    // Автоматическое обновление счетчика при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            CartManager.updateCartCounter();
        });
    } else {
        CartManager.updateCartCounter();
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