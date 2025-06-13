/* === ORDER-MANAGER.JS - УПРАВЛЕНИЕ ЗАКАЗАМИ === */

(function() {
    'use strict';

    // Синглтон для управления заказами
    const OrderManager = {
        // Получить все заказы
        getOrders: function() {
            try {
                const orders = localStorage.getItem('userOrders');
                return orders ? JSON.parse(orders) : [];
            } catch (error) {
                console.error('Ошибка чтения заказов:', error);
                return [];
            }
        },

        // Добавить новый заказ
        addOrder: function(orderData) {
            try {
                const orders = this.getOrders();

                // Создаем объект заказа
                const newOrder = {
                    id: orderData.id || `CG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    cdekNumber: orderData.cdekNumber || orderData.id,
                    status: orderData.status || 'created',
                    amount: orderData.amount || 0,
                    createdAt: orderData.createdAt || new Date().toISOString(),
                    items: orderData.items || [],
                    delivery: orderData.delivery || {},
                    recipient: orderData.recipient || {},
                    paymentId: orderData.paymentId || null
                };

                // Добавляем в начало массива
                orders.unshift(newOrder);

                // Ограничиваем количество сохраненных заказов
                if (orders.length > 50) {
                    orders.length = 50;
                }

                // Сохраняем
                localStorage.setItem('userOrders', JSON.stringify(orders));

                // Отправляем событие
                window.dispatchEvent(new CustomEvent('ordersUpdated', {
                    detail: { action: 'added', order: newOrder }
                }));

                console.log('✅ Заказ добавлен:', newOrder.id);
                return newOrder;

            } catch (error) {
                console.error('Ошибка добавления заказа:', error);
                return null;
            }
        },

        // Обновить статус заказа
        updateOrderStatus: function(orderId, status) {
            try {
                const orders = this.getOrders();
                const orderIndex = orders.findIndex(o => o.id === orderId);

                if (orderIndex !== -1) {
                    orders[orderIndex].status = status;
                    orders[orderIndex].updatedAt = new Date().toISOString();

                    localStorage.setItem('userOrders', JSON.stringify(orders));

                    window.dispatchEvent(new CustomEvent('ordersUpdated', {
                        detail: { action: 'updated', orderId, status }
                    }));

                    return true;
                }

                return false;

            } catch (error) {
                console.error('Ошибка обновления статуса:', error);
                return false;
            }
        },

        // Получить количество заказов
        getOrdersCount: function() {
            return this.getOrders().length;
        },

        // Получить заказ по ID
        getOrderById: function(orderId) {
            const orders = this.getOrders();
            return orders.find(o => o.id === orderId) || null;
        },

        // Очистить все заказы
        clearOrders: function() {
            try {
                localStorage.removeItem('userOrders');

                window.dispatchEvent(new CustomEvent('ordersUpdated', {
                    detail: { action: 'cleared' }
                }));

                console.log('✅ История заказов очищена');
                return true;

            } catch (error) {
                console.error('Ошибка очистки заказов:', error);
                return false;
            }
        },

        // Получить статистику
        getStats: function() {
            const orders = this.getOrders();
            const stats = {
                total: orders.length,
                created: 0,
                paid: 0,
                failed: 0,
                totalAmount: 0
            };

            orders.forEach(order => {
                if (order.status === 'created') stats.created++;
                else if (order.status === 'paid' || order.status === 'payment_success') stats.paid++;
                else if (order.status === 'failed' || order.status === 'payment_success_cdek_failed') stats.failed++;

                stats.totalAmount += order.amount || 0;
            });

            return stats;
        },

        // Синхронизация с сервером (если есть API)
        syncWithServer: async function() {
            try {
                const response = await fetch('/api/orders');
                if (response.ok) {
                    const serverOrders = await response.json();

                    // Объединяем с локальными заказами
                    const localOrders = this.getOrders();
                    const mergedOrders = this.mergeOrders(localOrders, serverOrders);

                    localStorage.setItem('userOrders', JSON.stringify(mergedOrders));

                    window.dispatchEvent(new CustomEvent('ordersUpdated', {
                        detail: { action: 'synced', count: mergedOrders.length }
                    }));

                    console.log('✅ Заказы синхронизированы с сервером');
                    return true;
                }
            } catch (error) {
                console.warn('⚠️ Не удалось синхронизировать с сервером:', error);
            }
            return false;
        },

        // Объединение заказов
        mergeOrders: function(localOrders, serverOrders) {
            const orderMap = new Map();

            // Добавляем локальные заказы
            localOrders.forEach(order => {
                orderMap.set(order.id, order);
            });

            // Добавляем/обновляем серверные заказы
            serverOrders.forEach(order => {
                orderMap.set(order.id, order);
            });

            // Сортируем по дате создания (новые первые)
            return Array.from(orderMap.values()).sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
        }
    };

    // Делаем доступным глобально
    window.OrderManager = OrderManager;

    // Автоматическая синхронизация при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => OrderManager.syncWithServer(), 1000);
        });
    } else {
        setTimeout(() => OrderManager.syncWithServer(), 1000);
    }

    console.log('✅ OrderManager инициализирован');
})();