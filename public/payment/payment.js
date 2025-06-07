// === File: public/payment/payment.js ===

document.addEventListener('DOMContentLoaded', () => {
    // -------------- Подсказки Яндекс для поля #addressInput ----------------
    const cityInput = document.getElementById('addressInput');
    const citySug   = document.getElementById('citySuggestions');
    let justSel = false;

    cityInput.addEventListener(
        'input',
        debounce(async e => {
            if (justSel) {
                justSel = false;
                return;
            }

            const q = e.target.value.trim();
            citySug.innerHTML = '';
            citySug.classList.remove('visible');

            if (q.length < 2) return;

            try {
                const resp = await fetch(`/api/yandex/suggest?text=${encodeURIComponent(q)}`);
                const json = await resp.json();
                renderCitySuggestions(json.results || []);
            } catch (err) {
                console.error('[Payment] Ошибка подсказок Яндекс:', err);
            }
        }),
        300
    );

    function renderCitySuggestions(items) {
        citySug.innerHTML = '';
        if (!items || !items.length) {
            citySug.classList.remove('visible');
            return;
        }
        items.forEach(item => {
            const text = item.title.text + (item.subtitle ? ', ' + item.subtitle.text : '');
            const li = document.createElement('li');
            li.textContent = text;
            li.addEventListener('mouseover', () => (li.style.background = '#f0f0f0'));
            li.addEventListener('mouseout', () => (li.style.background = '#fff'));
            li.addEventListener('click', () => {
                justSel = true;
                cityInput.value = text;
                citySug.innerHTML = '';
                citySug.classList.remove('visible');
            });
            citySug.append(li);
        });
        citySug.classList.add('visible');
    }

    // -------------- Обработка нажатия «Перейти к оплате» ----------------
    const proceedBtn = document.getElementById('proceedPaymentBtn');
    proceedBtn.addEventListener('click', async () => {
        // Считываем данные формы
        const buyerName  = document.getElementById('buyerName').value.trim();
        const buyerPhone = document.getElementById('buyerPhone').value.trim();
        const buyerEmail = document.getElementById('buyerEmail').value.trim();
        const city       = document.getElementById('addressInput').value.trim();
        const street     = document.getElementById('streetInput').value.trim();

        if (!buyerName || !buyerPhone || !city) {
            return alert('Пожалуйста, заполните ФИО, телефон и город доставки.');
        }

        // Считаем сумму корзины
        const cartData = JSON.parse(localStorage.getItem('cartData') || '{}');
        const cameraCount = cartData.cameraCount || 0;
        const memoryCount = cartData.memoryCount || 0;
        const CAMERA_PRICE = 8900;
        const MEMORY_PRICE = 500;
        let totalSum = cameraCount * CAMERA_PRICE + memoryCount * MEMORY_PRICE;

        if (totalSum <= 0) {
            return alert('Ваша корзина пуста.');
        }

        // Формируем запрос на сервер для создания платежа
        try {
            const resp = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totalSum.toFixed(2),
                    items: { cameraCount, memoryCount },
                    delivery: {
                        city: city,
                        address: street,
                    },
                    buyer: {
                        name: buyerName,
                        phone: buyerPhone,
                        email: buyerEmail
                    }
                })
            });

            if (!resp.ok) {
                const err = await resp.json();
                console.error('[Payment.js] Ошибка от сервера:', err);
                return alert('Ошибка при создании платежа. Попробуйте позже.');
            }

            const data = await resp.json();
            const confirmationUrl = data.confirmationUrl;
            if (confirmationUrl) {
                window.location.href = confirmationUrl;
            } else {
                alert('Не удалось получить ссылку на оплату.');
            }
        } catch (e) {
            console.error('[Payment.js] Runtime-ошибка при оплате:', e);
            alert('Произошла ошибка при попытке оплаты.');
        }
    });

    // ==== Простейший debounce ====
    function debounce(fn, ms = 300) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), ms);
        };
    }
});