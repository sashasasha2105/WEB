// === File: cart/cart.js ===

// Цены и состояния
const prices = { camera: 8900, memory: 500 };
let counts = { camera: 0, memory: 0 };
let discountPercent = 0;
let shippingCost = 0;

// Селекторы
const badgeEl      = () => document.querySelector('.cart-count');
const totalEl      = () => document.getElementById('cartTotalValue');
const shippingEl   = () => document.getElementById('shippingCostValue');
const addressInput = () => document.getElementById('addressInput');
const addressSuggs = () => document.getElementById('addressSuggestions');
const pvzSelectEl  = () => document.getElementById('pvzSelect');

// Загрузка/сохранение
function loadCart() {
  const raw = localStorage.getItem('cartData');
  if (!raw) return;
  const d = JSON.parse(raw);
  counts.camera = d.cameraCount||0;
  counts.memory = d.memoryCount||0;
  document.getElementById('cameraColor').textContent = d.cartColor||'—';
}
function saveCart() {
  localStorage.setItem('cartData', JSON.stringify({
    cameraCount: counts.camera,
    memoryCount: counts.memory,
    cartColor:   document.getElementById('cameraColor').textContent
  }));
}

// Обновление UI
function updateUI() {
  // шапка
  const badge = badgeEl();
  if (badge) badge.textContent = counts.camera + counts.memory;

  // цены
  shippingEl().textContent = shippingCost.toLocaleString('ru-RU');
  let sum = counts.camera*prices.camera + counts.memory*prices.memory;
  sum -= Math.round(sum*discountPercent/100);
  sum += shippingCost;
  totalEl().textContent = sum.toLocaleString('ru-RU');

  // карточки
  ['camera','memory'].forEach(id => {
    const block = document.querySelector(`.cart-item[data-id="${id}"]`);
    const qty   = document.querySelector(`.quantity-value[data-id="${id}"]`);
    if (!block||!qty) return;
    qty.textContent = counts[id];
    block.style.display = counts[id]>0?'flex':'none';
  });
}

// debounce
function debounce(fn,ms=300){
  let t;
  return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); };
}

// API
async function fetchCities(q){
  try {
    const r = await fetch(`/api/cdek/cities?search=${encodeURIComponent(q)}`);
    return r.ok?await r.json():[];
  } catch { return []; }
}
async function fetchPVZ(cityCode){
  try {
    const r = await fetch(`/api/cdek/pvz?cityId=${encodeURIComponent(cityCode)}`);
    return r.ok?await r.json():[];
  } catch { return []; }
}

// Инициализация
document.addEventListener('DOMContentLoaded', ()=> {
  loadCart();
  updateUI();

  // + / – / удалить
  document.querySelectorAll('.plus-btn').forEach(btn=>
      btn.addEventListener('click', ()=>{
        counts[btn.dataset.id]++; saveCart(); updateUI();
      })
  );
  document.querySelectorAll('.minus-btn').forEach(btn=>
      btn.addEventListener('click', ()=>{
        counts[btn.dataset.id]=Math.max(0,counts[btn.dataset.id]-1);
        saveCart(); updateUI();
      })
  );
  document.querySelectorAll('.remove-item-btn').forEach(btn=>
      btn.addEventListener('click', ()=>{
        counts[btn.dataset.id]=0; saveCart(); updateUI();
      })
  );

  // промокод
  const promoInput = document.getElementById('promoInput');
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const removePromoBtn= document.getElementById('removePromoBtn');
  if(applyPromoBtn&&removePromoBtn&&promoInput){
    applyPromoBtn.addEventListener('click', ()=>{
      const c=promoInput.value.trim().toLowerCase();
      if(c==='clipgo25')      discountPercent=7;
      else if(c==='clipgo222') discountPercent=20;
      else return alert('Неверный промокод!');
      applyPromoBtn.disabled=true;
      removePromoBtn.style.display='inline-block';
      updateUI();
    });
    removePromoBtn.addEventListener('click', ()=>{
      discountPercent=0; promoInput.value=''; applyPromoBtn.disabled=false;
      removePromoBtn.style.display='none'; updateUI();
    });
  }

  // автодополнение городов
  addressInput().addEventListener('input', debounce(async e=>{
    const q=e.target.value.trim();
    addressSuggs().innerHTML='';
    pvzSelectEl().disabled=true;
    if(q.length<2)return;
    const cities=await fetchCities(q);
    cities.forEach(c=>{
      const li=document.createElement('li');
      li.textContent=c.full_name||c.name;
      li.dataset.code=c.city_uuid||c.code;
      li.addEventListener('click', async ()=>{
        addressInput().value=li.textContent;
        addressSuggs().innerHTML='';
        const list=await fetchPVZ(li.dataset.code);
        pvzSelectEl().innerHTML='<option value="">Выберите ПВЗ</option>';
        list.forEach(p=>{
          const opt=document.createElement('option');
          opt.value=JSON.stringify({city_code:li.dataset.code,pvz_code:p.code});
          opt.textContent=`${p.name}, ${p.address}`;
          pvzSelectEl().append(opt);
        });
        pvzSelectEl().disabled=false;
      });
      addressSuggs().append(li);
    });
  }),300);

  // выбор ПВЗ → расчет доставки
  pvzSelectEl().addEventListener('change', async e=>{
    const sel=JSON.parse(e.target.value);
    const req={
      senderCityPostCode:   "109028",
      receiverCityPostCode: sel.city_code,
      tariffTypeCode:       136,
      goods: [{ weight:0.1,length:10,width:7,height:3 }]
    };
    try {
      const r=await fetch('/api/cdek/tariff',{
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(req)
      });
      const data = r.ok?await r.json():null;
      shippingCost = data?.total_price||0;
    } catch {
      shippingCost=0;
    }
    updateUI();
  });

  // оформление
  document.getElementById('checkoutBtn').addEventListener('click', ()=>{
    if(pvzSelectEl().disabled||!pvzSelectEl().value){
      return alert('Выберите ПВЗ перед оформлением заказа');
    }
    alert('Заказ успешно оформлен!');
  });
});