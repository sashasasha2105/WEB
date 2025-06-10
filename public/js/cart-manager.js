// === File: public/js/cart-manager.js ===
// ВАЖНО: Подключать ПЕРВЫМ перед другими скриптами!
// Глобальный менеджер корзины для синхронизации между страницами

(function() {
    'use strict';

    // Флаг для предотвращения бесконечной рекурсии
    let isUpdating = false;
    let initializationComplete = false;

    // Глобальный объект для управления корзиной
    window.CartManager = {

        // Получение данных корзины из localStorage
        getCartData: function() {
            try {
                return JSON.parse(localStorage.getItem('cartData') || '{}');
            } catch (e) {
                console.error('[CartManager] Ошибка чтения cartData:', e);
                return {};
            }
        },

        // Получение общего количества товаров
        getTotalCount: function() {
            const data = this.getCartData();
            return (data.cameraCount || 0) + (data.memoryCount || 0);
        },

        // Обновление счетчика во всех местах на странице
        updateCartCounter: function() {
            // Предотвращаем бесконечную рекурсию
            if (isUpdating) return;
            isUpdating = true;

            const count = this.getTotalCount();

            // Обновляем все элементы с классом cart-count
            const cartElements = document.querySelectorAll('.cart-count');
            cartElements.forEach(element => {
                element.textContent = count;
                console.log('[CartManager] Обновлен элемент:', element, 'новое значение:', count);
            });

            console.log('[CartManager] Счетчик обновлен:', count, 'элементов найдено:', cartElements.length);

            isUpdating = false;
            return count;
        },

        // Принудительное обновление счетчика (для случаев когда элементы загружаются асинхронно)
        forceUpdateCounter: function() {
            console.log('[CartManager] Принудительное обновление счетчика');
            isUpdating = false; // Сбрасываем флаг
            return this.updateCartCounter();
        },

        // Сохранение данных корзины
        saveCartData: function(cameraCount, memoryCount, cartColor = null) {
            const data = {
                cameraCount: cameraCount || 0,
                memoryCount: memoryCount || 0
            };

            // Сохраняем цвет если передан
            if (cartColor) {
                data.cartColor = cartColor;
            } else {
                // Пытаемся определить цвет из текущих данных
                const currentData = this.getCartData();
                if (currentData.cartColor) {
                    data.cartColor = currentData.cartColor;
                }
            }

            try {
                localStorage.setItem('cartData', JSON.stringify(data));

                // Обновляем счетчик
                this.updateCartCounter();

                // Отправляем событие для синхронизации между вкладками
                this.dispatchCartUpdateEvent(data);

                console.log('[CartManager] Данные корзины сохранены:', data);
            } catch (e) {
                console.error('[CartManager] Ошибка сохранения cartData:', e);
            }
        },

        // Отправка события обновления корзины
        dispatchCartUpdateEvent: function(data) {
            // Событие для текущей страницы
            window.dispatchEvent(new CustomEvent('cartUpdated', {
                detail: data
            }));

            // Событие для синхронизации между вкладками
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'cartData',
                newValue: JSON.stringify(data),
                url: window.location.href
            }));
        },

        // Инициализация менеджера корзины
        init: function() {
            if (initializationComplete) return;

            console.log('[CartManager] Начало инициализации');

            // Обновляем счетчик при загрузке страницы
            this.updateCartCounter();

            // Слушаем изменения localStorage для синхронизации между вкладками
            window.addEventListener('storage', (e) => {
                if (e.key === 'cartData') {
                    console.log('[CartManager] Синхронизация с другой вкладкой');
                    this.updateCartCounter();
                }
            });

            // Слушаем кастомные события обновления корзины
            window.addEventListener('cartUpdated', (e) => {
                console.log('[CartManager] Получено событие cartUpdated:', e.detail);
                this.updateCartCounter();
            });

            // Обновляем счетчик каждые 3 секунды для надежности
            setInterval(() => {
                this.updateCartCounter();
            }, 3000);

            // Дополнительная проверка элементов через 1 секунду после загрузки
            setTimeout(() => {
                console.log('[CartManager] Дополнительная проверка элементов через 1 сек');
                this.forceUpdateCounter();
            }, 1000);

            initializationComplete = true;
            console.log('[CartManager] Инициализация завершена');
        },

        // Добавление товара в корзину
        addToCart: function(itemType, quantity = 1) {
            const data = this.getCartData();

            if (itemType === 'camera') {
                data.cameraCount = (data.cameraCount || 0) + quantity;
            } else if (itemType === 'memory') {
                data.memoryCount = (data.memoryCount || 0) + quantity;
            }

            this.saveCartData(data.cameraCount, data.memoryCount, data.cartColor);
            return this.getTotalCount();
        },

        // Удаление товара из корзины
        removeFromCart: function(itemType, quantity = 1) {
            const data = this.getCartData();

            if (itemType === 'camera') {
                data.cameraCount = Math.max(0, (data.cameraCount || 0) - quantity);
            } else if (itemType === 'memory') {
                data.memoryCount = Math.max(0, (data.memoryCount || 0) - quantity);
            }

            this.saveCartData(data.cameraCount, data.memoryCount, data.cartColor);
            return this.getTotalCount();
        },

        // Очистка корзины
        clearCart: function() {
            this.saveCartData(0, 0);
            return 0;
        },

        // Установка количества товара
        setItemCount: function(itemType, count) {
            const data = this.getCartData();

            if (itemType === 'camera') {
                data.cameraCount = Math.max(0, count);
            } else if (itemType === 'memory') {
                data.memoryCount = Math.max(0, count);
            }

            this.saveCartData(data.cameraCount, data.memoryCount, data.cartColor);
            return this.getTotalCount();
        }
    };

    // Автоинициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.CartManager.init();
        });
    } else {
        window.CartManager.init();
    }

    // Экспорт для совместимости со старым кодом
    window.updateCartCounter = function() {
        return window.CartManager.updateCartCounter();
    };

    // Глобальная функция для принудительного обновления
    window.forceUpdateCartCounter = function() {
        return window.CartManager.forceUpdateCounter();
    };

})();