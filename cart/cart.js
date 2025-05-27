// ==== Prices и стейт ====
const prices = { camera: 8900, memory: 500 };
let counts = { camera: 0, memory: 0 };
let discountPercent = 0;
let shippingCost = 0;

// ==== Селекторы ====
const badgeEl      = () => document.querySelector('.cart-count');
const totalEl      = () => document.getElementById('cartTotalValue');
const shippingEl   = () => document.getElementById('shippingCostValue');
const addressInput = () => document.getElementById('addressInput');
const addressSuggs = () => document.getElementById('addressSuggestions');
const pvzSelectEl  = () => document.getElementById('pvzSelect');

// ==== Debounce ====
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ==== localStorage ====
function loadCart() {
  const raw = localStorage.getItem('cartData');
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    counts.camera = d.cameraCount || 0;
    counts.memory = d.memoryCount || 0;
    document.getElementById('cameraColor').textContent = d.cartColor || '—';
  } catch {}
}
function saveCart() {
  localStorage.setItem('cartData', JSON.stringify({
    cameraCount: counts.camera,
    memoryCount: counts.memory,
    cartColor: document.getElementById('cameraColor').textContent
  }));
}

// ==== UI обновление ====
function updateUI() {
  // update header badge
  const badge = badgeEl();
  if (badge) {
    badge.textContent = counts.camera + counts.memory;
  }

  // shipping & total
  shippingEl().textContent = shippingCost.toLocaleString('ru-RU');
  let sum = counts.camera * prices.camera + counts.memory * prices.memory;
  sum -= Math.round(sum * discountPercent / 100);
  sum += shippingCost;
  totalEl().textContent = sum.toLocaleString('ru-RU');

  // show/hide each cart item
  ['camera','memory'].forEach(id => {
    const block = document.querySelector(`.cart-item[data-id="${id}"]`);
    const qty   = document.querySelector(`.quantity-value[data-id="${id}"]`);
    if (!block || !qty) return;
    qty.textContent = counts[id];
    block.style.display = counts[id] > 0 ? 'flex' : 'none';
  });
}

// ==== API CDEK ====
async function fetchCities(search) {
  const r = await fetch(`/api/cdek/cities?search=${encodeURIComponent(search)}`);
  return r.ok ? r.json() : [];
}
async function fetchPVZ(cityId) {
  const r = await fetch(`/api/cdek/pvz?cityId=${encodeURIComponent(cityId)}`);
  return r.ok ? r.json() : [];
}
async function calcTariff(body) {
  const r = await fetch('/api/cdek/tariff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.ok ? r.json() : null;
}

// ==== Init ====
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  updateUI();

  // обработчики +/–/удалить
  document.querySelectorAll('.plus-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        counts[btn.dataset.id]++;
        saveCart();
        updateUI();
      })
  );
  document.querySelectorAll('.minus-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        counts[btn.dataset.id] = Math.max(0, counts[btn.dataset.id] - 1);
        saveCart();
        updateUI();
      })
  );
  document.querySelectorAll('.remove-item-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        counts[btn.dataset.id] = 0;
        saveCart();
        updateUI();
      })
  );

  // промокод
  const promoInput    = document.getElementById('promoInput');
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const removePromoBtn= document.getElementById('removePromoBtn');
  if (applyPromoBtn && removePromoBtn && promoInput) {
    applyPromoBtn.addEventListener('click', () => {
      const c = promoInput.value.trim().toLowerCase();
      if      (c === 'clipgo25')  discountPercent = 7;
      else if (c === 'clipgo222') discountPercent = 20;
      else return alert('Неверный промокод!');
      applyPromoBtn.disabled = true;
      removePromoBtn.style.display = 'inline-block';
      updateUI();
    });
    removePromoBtn.addEventListener('click', () => {
      discountPercent = 0;
      promoInput.value = '';
      applyPromoBtn.disabled = false;
      removePromoBtn.style.display = 'none';
      updateUI();
    });
  }

  // автодополнение городов (Nominatim → CDEK)
  addressInput().addEventListener('input', debounce(async e => {
    const q = e.target.value.trim();
    addressSuggs().innerHTML = '';
    if (q.length < 2) return;

    const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=7&q=${encodeURIComponent(q)}`
    );
    const arr = await resp.json();
    arr.filter(r => ['city','town','village'].includes(r.type))
        .forEach(r => {
          const li = document.createElement('li');
          li.textContent = r.display_name;
          li.dataset.city = r.display_name.split(',')[0];
          li.addEventListener('click', async () => {
            addressInput().value = r.display_name;
            addressSuggs().innerHTML = '';

            const cityName = li.dataset.city;
            const cities   = await fetchCities(cityName);
            if (!cities.length) {
              return alert(`Город «${cityName}» не найден в CDEK`);
            }
            const cityCode = cities[0].code;

            // загрузка ПВЗ
            const pvzList = await fetchPVZ(cityCode);
            pvzSelectEl().innerHTML = '<option value="">Выберите ПВЗ</option>';
            pvzList.forEach(p => {
              const opt = document.createElement('option');
              opt.value = JSON.stringify({ city_code: cityCode, pvz_code: p.code });
              opt.textContent = `${p.name}, ${p.address}`;
              pvzSelectEl().append(opt);
            });
            pvzSelectEl().disabled = false;
          });
          addressSuggs().append(li);
        });
  }), 300);

  // выбор ПВЗ → расчёт доставки
  pvzSelectEl().addEventListener('change', async e => {
    const sel = JSON.parse(e.target.value);
    const req = {
      senderCityPostCode: "109028",
      receiverCityPostCode: sel.city_code,
      tariffTypeCode: 136,
      goods: [{ weight:0.1, length:10, width:7, height:3 }]
    };
    const r = await calcTariff(req);
    shippingCost = (r && r.total_price != null) ? r.total_price : 0;
    updateUI();
  });

  // оформление заказа
  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (pvzSelectEl().disabled || !pvzSelectEl().value) {
      return alert('Выберите ПВЗ перед оформлением заказа');
    }
    alert('Заказ успешно оформлен!');
  });
});