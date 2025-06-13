/* === ORDER-MANAGER.JS - УЛУЧШЕННАЯ ВЕРСИЯ === */

(function() {
    'use strict';

    // Синглтон для управления заказами
    const OrderManager = {
        // Получить все заказы с сортировкой
        getOrders: function() {
            try {
                const orders = localStorage.getItem('userOrders');
                const parsed = orders ? JSON.parse(orders) : [];
                // Сортируем по дате создания (новые первые)
                return parsed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } catch (error) {
                console.error('[OrderManager] Ошибка чтения заказов:', error);
                return [];
            }
        },

        // Добавить новый заказ
        addOrder: function(orderData) {
            try {
                const orders = this.getOrders();

                // Создаем объект заказа с полными данными
                const newOrder = {
                    id: orderData.id || `CG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    cdekNumber: orderData.cdekNumber || null,
                    status: orderData.status || 'created',
                    amount: orderData.amount || 0,
                    createdAt: orderData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    items: orderData.items || [],
                    delivery: orderData.delivery || {},
                    recipient: orderData.recipient || {},
                    paymentId: orderData.paymentId || null,
                    discount: orderData.discount || null,
                    // Добавляем метаданные для отслеживания
                    metadata: {
                        source: 'web',
                        userAgent: navigator.userAgent,
                        timestamp: Date.now(),
                        version: '2.5'
                    }
                };

                // Добавляем в начало массива
                orders.unshift(newOrder);

                // Ограничиваем количество сохраненных заказов
                if (orders.length > 100) {
                    orders.length = 100;
                }

                // Сохраняем
                localStorage.setItem('userOrders', JSON.stringify(orders));

                // Отправляем событие
                window.dispatchEvent(new CustomEvent('ordersUpdated', {
                    detail: { action: 'added', order: newOrder, totalCount: orders.length }
                }));

                console.log('✅ [OrderManager] Заказ добавлен:', newOrder.id);
                return newOrder;

            } catch (error) {
                console.error('[OrderManager] Ошибка добавления заказа:', error);
                return null;
            }
        },

        // Обновить заказ полностью
        updateOrder: function(orderId, updateData) {
            try {
                const orders = this.getOrders();
                const orderIndex = orders.findIndex(o => o.id === orderId);

                if (orderIndex !== -1) {
                    // Обновляем заказ, сохраняя существующие данные
                    orders[orderIndex] = {
                        ...orders[orderIndex],
                        ...updateData,
                        updatedAt: new Date().toISOString()
                    };

                    localStorage.setItem('userOrders', JSON.stringify(orders));

                    window.dispatchEvent(new CustomEvent('ordersUpdated', {
                        detail: {
                            action: 'updated',
                            orderId,
                            order: orders[orderIndex],
                            changes: updateData
                        }
                    }));

                    console.log('✅ [OrderManager] Заказ обновлен:', orderId);
                    return orders[orderIndex];
                }

                console.warn('⚠️ [OrderManager] Заказ не найден для обновления:', orderId);
                return null;

            } catch (error) {
                console.error('[OrderManager] Ошибка обновления заказа:', error);
                return null;
            }
        },

        // Обновить статус заказа
        updateOrderStatus: function(orderId, status, additionalData = {}) {
            try {
                const orders = this.getOrders();
                const orderIndex = orders.findIndex(o => o.id === orderId);

                if (orderIndex !== -1) {
                    const oldStatus = orders[orderIndex].status;
                    orders[orderIndex].status = status;
                    orders[orderIndex].updatedAt = new Date().toISOString();

                    // Добавляем дополнительные данные если есть
                    if (additionalData.cdekNumber) {
                        orders[orderIndex].cdekNumber = additionalData.cdekNumber;
                    }
                    if (additionalData.trackingNumber) {
                        orders[orderIndex].trackingNumber = additionalData.trackingNumber;
                    }

                    // Добавляем историю статусов
                    if (!orders[orderIndex].statusHistory) {
                        orders[orderIndex].statusHistory = [];
                    }
                    orders[orderIndex].statusHistory.push({
                        status: status,
                        timestamp: new Date().toISOString(),
                        previousStatus: oldStatus,
                        ...additionalData
                    });

                    localStorage.setItem('userOrders', JSON.stringify(orders));

                    window.dispatchEvent(new CustomEvent('ordersUpdated', {
                        detail: {
                            action: 'statusChanged',
                            orderId,
                            oldStatus,
                            newStatus: status,
                            order: orders[orderIndex]
                        }
                    }));

                    console.log('✅ [OrderManager] Статус заказа обновлен:', orderId, oldStatus, '->', status);
                    return true;
                }

                console.warn('⚠️ [OrderManager] Заказ не найден для обновления статуса:', orderId);
                return false;

            } catch (error) {
                console.error('[OrderManager] Ошибка обновления статуса:', error);
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

        // Получить заказ по paymentId
        getOrderByPaymentId: function(paymentId) {
            const orders = this.getOrders();
            return orders.find(o => o.paymentId === paymentId) || null;
        },

        // Получить заказы по статусу
        getOrdersByStatus: function(status) {
            const orders = this.getOrders();
            return orders.filter(o => o.status === status);
        },

        // Получить недавние заказы (последние N дней)
        getRecentOrders: function(days = 30) {
            const orders = this.getOrders();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            return orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= cutoffDate;
            });
        },

        // Очистить все заказы
        clearOrders: function() {
            try {
                const oldCount = this.getOrdersCount();
                localStorage.removeItem('userOrders');

                window.dispatchEvent(new CustomEvent('ordersUpdated', {
                    detail: { action: 'cleared', clearedCount: oldCount }
                }));

                console.log('✅ [OrderManager] История заказов очищена, удалено:', oldCount);
                return true;

            } catch (error) {
                console.error('[OrderManager] Ошибка очистки заказов:', error);
                return false;
            }
        },

        // Удалить конкретный заказ
        deleteOrder: function(orderId) {
            try {
                const orders = this.getOrders();
                const orderIndex = orders.findIndex(o => o.id === orderId);

                if (orderIndex !== -1) {
                    const deletedOrder = orders.splice(orderIndex, 1)[0];
                    localStorage.setItem('userOrders', JSON.stringify(orders));

                    window.dispatchEvent(new CustomEvent('ordersUpdated', {
                        detail: {
                            action: 'deleted',
                            orderId,
                            deletedOrder,
                            remainingCount: orders.length
                        }
                    }));

                    console.log('✅ [OrderManager] Заказ удален:', orderId);
                    return true;
                }

                return false;

            } catch (error) {
                console.error('[OrderManager] Ошибка удаления заказа:', error);
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
                processing: 0,
                shipped: 0,
                delivered: 0,
                failed: 0,
                totalAmount: 0,
                averageAmount: 0,
                thisMonth: 0,
                thisYear: 0
            };

            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();

            orders.forEach(order => {
                // Подсчет по статусам
                switch(order.status) {
                    case 'created':
                        stats.created++;
                        break;
                    case 'paid':
                    case 'payment_success':
                        stats.paid++;
                        break;
                    case 'processing':
                        stats.processing++;
                        break;
                    case 'shipped':
                        stats.shipped++;
                        break;
                    case 'delivered':
                        stats.delivered++;
                        break;
                    case 'failed':
                    case 'payment_failed':
                    case 'payment_success_cdek_failed':
                        stats.failed++;
                        break;
                }

                // Подсчет сумм
                const amount = order.amount || 0;
                stats.totalAmount += amount;

                // Подсчет по периодам
                const orderDate = new Date(order.createdAt);
                if (orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear) {
                    stats.thisMonth++;
                }
                if (orderDate.getFullYear() === thisYear) {
                    stats.thisYear++;
                }
            });

            // Средняя сумма заказа
            stats.averageAmount = stats.total > 0 ? Math.round(stats.totalAmount / stats.total) : 0;

            return stats;
        },

        // Экспорт заказов
        exportOrders: function(format = 'json') {
            try {
                const orders = this.getOrders();

                if (format === 'json') {
                    return {
                        orders: orders,
                        exportDate: new Date().toISOString(),
                        totalCount: orders.length,
                        stats: this.getStats()
                    };
                } else if (format === 'csv') {
                    // Простой CSV формат
                    const headers = ['ID', 'Дата', 'Статус', 'Сумма', 'Получатель', 'Телефон'];
                    const csvContent = [
                        headers.join(','),
                        ...orders.map(order => [
                            order.id,
                            new Date(order.createdAt).toLocaleDateString('ru-RU'),
                            order.status,
                            order.amount,
                            order.recipient?.name || '',
                            order.recipient?.phone || ''
                        ].join(','))
                    ].join('\n');
                    return csvContent;
                }

                return orders;

            } catch (error) {
                console.error('[OrderManager] Ошибка экспорта:', error);
                return null;
            }
        },

        // Импорт заказов
        importOrders: function(ordersData, mergeStrategy = 'replace') {
            try {
                const existingOrders = this.getOrders();
                let newOrders = [];

                if (Array.isArray(ordersData)) {
                    newOrders = ordersData;
                } else if (ordersData.orders && Array.isArray(ordersData.orders)) {
                    newOrders = ordersData.orders;
                } else {
                    throw new Error('Неверный формат данных для импорта');
                }

                let finalOrders = [];

                if (mergeStrategy === 'replace') {
                    finalOrders = newOrders;
                } else if (mergeStrategy === 'merge') {
                    // Объединяем, избегая дублей по ID
                    const orderMap = new Map();

                    // Сначала добавляем существующие
                    existingOrders.forEach(order => {
                        orderMap.set(order.id, order);
                    });

                    // Затем добавляем/обновляем новыми
                    newOrders.forEach(order => {
                        orderMap.set(order.id, order);
                    });

                    finalOrders = Array.from(orderMap.values());
                } else if (mergeStrategy === 'append') {
                    finalOrders = [...existingOrders, ...newOrders];
                }

                // Сортируем по дате
                finalOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                localStorage.setItem('userOrders', JSON.stringify(finalOrders));

                window.dispatchEvent(new CustomEvent('ordersUpdated', {
                    detail: {
                        action: 'imported',
                        importedCount: newOrders.length,
                        totalCount: finalOrders.length,
                        strategy: mergeStrategy
                    }
                }));

                console.log('✅ [OrderManager] Заказы импортированы:', newOrders.length, 'стратегия:', mergeStrategy);
                return finalOrders.length;

            } catch (error) {
                console.error('[OrderManager] Ошибка импорта:', error);
                return -1;
            }
        },

        // Синхронизация с сервером
        syncWithServer: async function() {
            try {
                console.log('🔄 [OrderManager] Запуск синхронизации с сервером...');

                const response = await fetch('/api/orders', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const serverData = await response.json();
                    let serverOrders = [];

                    if (Array.isArray(serverData)) {
                        serverOrders = serverData;
                    } else if (serverData.orders && Array.isArray(serverData.orders)) {
                        serverOrders = serverData.orders;
                    }

                    if (serverOrders.length > 0) {
                        // Объединяем с локальными заказами
                        const localOrders = this.getOrders();
                        const mergedOrders = this.mergeOrders(localOrders, serverOrders);

                        localStorage.setItem('userOrders', JSON.stringify(mergedOrders));

                        window.dispatchEvent(new CustomEvent('ordersUpdated', {
                            detail: {
                                action: 'synced',
                                serverCount: serverOrders.length,
                                totalCount: mergedOrders.length
                            }
                        }));

                        console.log('✅ [OrderManager] Синхронизация завершена:', mergedOrders.length, 'заказов');
                        return true;
                    } else {
                        console.log('ℹ️ [OrderManager] Сервер не вернул заказы');
                        return true;
                    }
                } else {
                    console.warn('⚠️ [OrderManager] Сервер вернул ошибку:', response.status);
                    return false;
                }
            } catch (error) {
                console.warn('⚠️ [OrderManager] Не удалось синхронизировать с сервером:', error.message);
                return false;
            }
        },

        // Объединение заказов (убирает дубли)
        mergeOrders: function(localOrders, serverOrders) {
            const orderMap = new Map();

            // Добавляем локальные заказы
            localOrders.forEach(order => {
                orderMap.set(order.id, order);
            });

            // Добавляем/обновляем серверные заказы
            serverOrders.forEach(order => {
                const existing = orderMap.get(order.id);
                if (!existing || new Date(order.updatedAt || order.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
                    orderMap.set(order.id, order);
                }
            });

            // Сортируем по дате создания (новые первые)
            return Array.from(orderMap.values()).sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
        },

        // Поиск заказов
        searchOrders: function(query) {
            const orders = this.getOrders();
            const searchTerm = query.toLowerCase();

            return orders.filter(order => {
                return (
                    order.id.toLowerCase().includes(searchTerm) ||
                    (order.cdekNumber && order.cdekNumber.toLowerCase().includes(searchTerm)) ||
                    (order.recipient?.name && order.recipient.name.toLowerCase().includes(searchTerm)) ||
                    (order.recipient?.phone && order.recipient.phone.includes(searchTerm)) ||
                    order.status.toLowerCase().includes(searchTerm)
                );
            });
        },

        // Получить заказы с пагинацией
        getOrdersPaginated: function(page = 1, limit = 10) {
            const orders = this.getOrders();
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;

            return {
                orders: orders.slice(startIndex, endIndex),
                totalCount: orders.length,
                totalPages: Math.ceil(orders.length / limit),
                currentPage: page,
                hasNext: endIndex < orders.length,
                hasPrev: page > 1
            };
        },

        // Валидация данных заказа
        validateOrder: function(orderData) {
            const errors = [];

            if (!orderData.id) {
                errors.push('Отсутствует ID заказа');
            }

            if (!orderData.amount || orderData.amount <= 0) {
                errors.push('Некорректная сумма заказа');
            }

            if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
                errors.push('Отсутствуют товары в заказе');
            }

            if (!orderData.recipient || !orderData.recipient.name || !orderData.recipient.phone) {
                errors.push('Неполные данные получателя');
            }

            return {
                isValid: errors.length === 0,
                errors: errors
            };
        }
    };

    // Делаем доступным глобально
    window.OrderManager = OrderManager;

    // Автоматическая синхронизация при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Даем время на инициализацию страницы
            setTimeout(() => {
                OrderManager.syncWithServer();
            }, 2000);
        });
    } else {
        setTimeout(() => {
            OrderManager.syncWithServer();
        }, 2000);
    }

    // Периодическая синхронизация (каждые 5 минут)
    setInterval(() => {
        OrderManager.syncWithServer();
    }, 5 * 60 * 1000);

    console.log('✅ [OrderManager] Расширенный менеджер заказов инициализирован');
})();