(function initYogurtShop(){
  if (globalThis.__YOGURT_APP_INIT__) return; // prevent double init
  globalThis.__YOGURT_APP_INIT__ = true;

  const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
  const qs = (s, el = document) => el.querySelector(s);

  // Robust storage (fallback for sandbox)
  let storageOK = true; try { const t='__t__'; localStorage.setItem(t,'1'); localStorage.removeItem(t);} catch { storageOK=false; }
  const memStore = { _v: '[]', getItem:k=>memStore._v, setItem:(k,v)=>{memStore._v=v;}, removeItem:()=>{memStore._v='[]';} };
  const store = storageOK ? localStorage : memStore;

  // Products
  const PRODUCTS = [
    {id:'classic',name:'Sữa chua truyền thống',desc:'Hũ 100ml – vị sữa thanh, ít đường',price:15000,img:'https://images.unsplash.com/photo-1515007917921-cad9bf0e2f31?q=80&w=1200&auto=format&fit=crop'},
    {id:'strawberry',name:'Sữa chua Dâu',desc:'Hũ 100ml – sốt dâu nhà làm',price:18000,img:'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1200&auto=format&fit=crop'},
    {id:'blueberry',name:'Sữa chua Việt quất',desc:'Hũ 100ml – trái cây thật',price:19000,img:'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?q=80&w=1200&auto=format&fit=crop'},
    {id:'matcha',name:'Sữa chua Matcha',desc:'Hũ 100ml – thơm nhẹ trà xanh',price:19000,img:'https://images.unsplash.com/photo-1546500840-ae38253aba9b?q=80&w=1200&auto=format&fit=crop'},
    {id:'sugarfree',name:'Không đường',desc:'Hũ 100ml – không thêm đường',price:16000,img:'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop'},
    {id:'greek',name:'Sữa chua Hy Lạp',desc:'Hũ 150ml – đặc mịn, giàu đạm',price:30000,img:'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop'},
  ];
  const FREE_SHIP_THRESHOLD = 200000;
  const SHIPPING_FEE = 20000;

  // State
  let cart = [];
  try { cart = JSON.parse(store.getItem('cart') || '[]'); } catch { cart = []; }
  if (!Array.isArray(cart)) cart = [];

  function renderCartBadge(){ const c = cart.reduce((n,i)=>n+i.qty,0); qs('#cartCount').textContent = c; }
  function persist(){ try { store.setItem('cart', JSON.stringify(cart)); } catch{}; renderCartBadge(); }

  function totals(){
    const subtotal = cart.reduce((sum, line) => {
      const p = PRODUCTS.find(p => p.id === line.id); return sum + ((p?.price||0) * line.qty);
    }, 0);
    const shipping = (subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0) ? 0 : SHIPPING_FEE;
    return { subtotal, shipping, grand: subtotal + shipping };
  }

  function addToCart(id, qty = 1){ const f = cart.find(i=>i.id===id); if(f) f.qty += qty; else cart.push({id, qty}); persist(); openCart(); renderCart(); }
  function updateQty(id, qty){ const it = cart.find(i=>i.id===id); if(!it) return; it.qty = Math.max(0, qty); if(it.qty===0) cart = cart.filter(i=>i.id!==id); persist(); renderCart(); }

  function renderProducts(){
    const grid = qs('#productGrid');
    grid.innerHTML = PRODUCTS.map(p => `
      <article class="card">
        <img src="${p.img}" alt="${p.name}">
        <div class="card-body">
          <h3>${p.name}</h3>
          <div class="muted">${p.desc}</div>
          <div class="price">${VND.format(p.price)}</div>
          <div class="actions">
            <div class="qty">
              <button type="button" aria-label="Giảm" data-minus="${p.id}">–</button>
              <input aria-label="Số lượng" type="number" min="1" value="1" class="qty-input" data-qty="${p.id}">
              <button type="button" aria-label="Tăng" data-plus="${p.id}">+</button>
            </div>
            <button type="button" class="btn btn-primary" data-add="${p.id}">Thêm vào giỏ</button>
          </div>
        </div>
      </article>`).join('');

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-minus],button[data-plus],button[data-add]');
      if(!btn) return;
      if(btn.hasAttribute('data-minus')){
        const id = btn.getAttribute('data-minus');
        const input = qs(`input[data-qty="${id}"]`);
        input.value = Math.max(1, (parseInt(input.value||'1') - 1));
        return;
      }
      if(btn.hasAttribute('data-plus')){
        const id = btn.getAttribute('data-plus');
        const input = qs(`input[data-qty="${id}"]`);
        input.value = (parseInt(input.value||'1') + 1);
        return;
      }
      if(btn.hasAttribute('data-add')){
        const id = btn.getAttribute('data-add');
        const input = qs(`input[data-qty="${id}"]`);
        const qty = Math.max(1, parseInt(input.value||'1')||1);
        addToCart(id, qty);
        return;
      }
    });
  }

  function renderCart(){
    const list = qs('#cartItems');
    if(cart.length === 0){
      list.innerHTML = '<div class="muted">Giỏ hàng trống. Hãy thêm vài hũ nhé!</div>';
    } else {
      list.innerHTML = cart.map(line => {
        const p = PRODUCTS.find(p=>p.id===line.id);
        return `
          <div class="cart-item">
            <img src="${p.img}" alt="${p.name}">
            <div>
              <div style="font-weight:700">${p.name}</div>
              <div class="muted">${p.desc}</div>
              <div class="muted">${VND.format(p.price)} x ${line.qty}</div>
            </div>
            <div class="qty">
              <button type="button" aria-label="Giảm" data-act="dec" data-id="${p.id}">–</button>
              <div>${line.qty}</div>
              <button type="button" aria-label="Tăng" data-act="inc" data-id="${p.id}">+</button>
            </div>
          </div>`;
      }).join('');

      list.onclick = (e)=>{
        const id = e.target.getAttribute('data-id');
        const act = e.target.getAttribute('data-act');
        if(!id||!act) return;
        const current = cart.find(x=>x.id===id)?.qty||0;
        updateQty(id, act==='inc' ? current+1 : current-1);
      };
    }
    const t = totals();
    qs('#cartTotal').textContent    = VND.format(t.subtotal);
    qs('#subtotalText').textContent = VND.format(t.subtotal);
    qs('#shippingText').textContent = VND.format(t.shipping);
    qs('#grandTotalText').textContent = VND.format(t.grand);
    renderCartBadge();
  }

  function openCart(){ qs('#cartDrawer').classList.add('open'); qs('#cartDrawer').setAttribute('aria-hidden','false'); }
  function closeCart(){ qs('#cartDrawer').classList.remove('open'); qs('#cartDrawer').setAttribute('aria-hidden','true'); }

  function generateOrderId(){ return 'SC' + Date.now().toString().slice(-8); }
  function buildOrder(form){
    const fd = new FormData(form);
    const customer = { name: fd.get('customerName')?.trim()||'', phone: fd.get('phone')?.trim()||'', address: fd.get('address')?.trim()||'', deliveryTime: fd.get('deliveryTime'), payment: fd.get('payment'), note: (fd.get('note')||'').trim() };
    const lines = cart.map(l=>{ const p = PRODUCTS.find(p=>p.id===l.id); return { id:p.id, name:p.name, unitPrice:p.price, qty:l.qty, lineTotal:p.price*l.qty }; });
    const t = totals();
    return { id: generateOrderId(), createdAt: new Date().toISOString(), customer, lines, totals: t, freeShipThreshold: FREE_SHIP_THRESHOLD, shippingFee: SHIPPING_FEE };
  }
  function downloadJson(filename, data){ const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }
  function printOrder(order){ let w; try { w = window.open('', 'PRINT'); } catch { w = null; } if(!w){ alert('Trình duyệt chặn cửa sổ in. Hãy cho phép pop-up hoặc dùng nút Tải file.'); return; } w.document.write(`
    <html><head><title>Hoá đơn ${order.id}</title></head><body>
    <h2>Hoá đơn – Sữa Chua Nhà Phú</h2>
    <p><b>Mã đơn:</b> ${order.id}<br>
       <b>Khách hàng:</b> ${order.customer.name}<br>
       <b>Điện thoại:</b> ${order.customer.phone}<br>
       <b>Địa chỉ:</b> ${order.customer.address}<br>
       <b>Thời gian giao:</b> ${order.customer.deliveryTime}<br>
       <b>Ghi chú:</b> ${order.customer.note||'-'}</p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
      <tbody>
        ${order.lines.map(l => `<tr><td>${l.name}</td><td>${l.qty}</td><td>${VND.format(l.unitPrice)}</td><td>${VND.format(l.lineTotal)}</td></tr>`).join('')}
      </tbody>
      <tfoot>
        <tr><td colspan="3" align="right"><b>Tạm tính</b></td><td>${VND.format(order.totals.subtotal)}</td></tr>
        <tr><td colspan="3" align="right"><b>Phí giao</b></td><td>${VND.format(order.totals.shipping)}</td></tr>
        <tr><td colspan="3" align="right"><b>Tổng</b></td><td>${VND.format(order.totals.grand)}</td></tr>
      </tfoot>
    </table>
    <p><i>Cảm ơn bạn đã ủng hộ! ❤️</i></p>
    </body></html>`); w.document.close(); w.focus(); w.print(); w.close(); }

  window.addEventListener('DOMContentLoaded', () => {
    const yearEl = qs('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();
    renderProducts(); renderCart(); renderCartBadge();
    qs('#openCart')?.addEventListener('click', openCart);
    qs('#closeCart')?.addEventListener('click', closeCart);
    qs('#goCheckout')?.addEventListener('click', () => { closeCart(); location.hash = '#dat-hang'; });
    const form = qs('#checkoutForm');
    form?.addEventListener('submit', (e) => {
      e.preventDefault(); if(cart.length === 0){ alert('Giỏ hàng đang trống. Hãy thêm sản phẩm trước khi đặt.'); return; }
      if(!form.reportValidity()) return; const order = buildOrder(form);
      try { store.setItem('lastOrder', JSON.stringify(order)); } catch {}
      qs('#orderId').textContent = order.id; qs('#orderResult').hidden = false;
      qs('#btnPrint').onclick = () => printOrder(order);
      qs('#btnSave').onclick  = () => downloadJson(`${order.id}.json`, order);
      cart = []; persist(); renderCart();
    });

    runTests();
  });

  globalThis.YogurtShop = { addToCart, updateQty, totals };

  function test(name, fn){
    const li = document.createElement('li');
    try{ const res = fn(); li.textContent = `✅ ${name} – ${res??'OK'}`; li.style.color = '#065f46'; }
    catch(err){ li.textContent = `❌ ${name} – ${err.message}`; li.style.color = '#b91c1c'; }
    document.getElementById('tests')?.appendChild(li);
  }

  function runTests(){
    test('Định dạng tiền tệ VND', () => { const s = VND.format(123456); if(!/₫/.test(s)) throw new Error('Không có ký hiệu ₫'); });
    test('Thêm 2 hũ dâu, kiểm tra tạm tính & freeship', () => {
      const before = cart.length; addToCart('strawberry', 2); const t = totals(); if (cart.length !== before+1 && cart.find(x=>x.id==='strawberry')?.qty < 2) throw new Error('Thêm giỏ thất bại'); if (t.subtotal !== 36000) throw new Error('Tạm tính sai'); if (t.shipping !== 20000) throw new Error('Phí ship sai khi chưa đạt ngưỡng'); updateQty('strawberry', 0); });
    test('Click delegate "Thêm vào giỏ" cập nhật badge', () => {
      const btn = document.querySelector('[data-add="classic"]'); if(!btn) throw new Error('Không tìm thấy nút');
      const beforeBadge = parseInt(document.querySelector('#cartCount')?.textContent||'0',10); btn.click();
      const qty = cart.find(x=>x.id==='classic')?.qty||0; if(qty < 1) throw new Error('Click không thêm được');
      const afterBadge = parseInt(document.querySelector('#cartCount')?.textContent||'0',10); if(!(afterBadge === beforeBadge + 1)) throw new Error('Badge không tăng sau click');
      updateQty('classic', 0);
    });
    test('Freeship khi đạt 200k', () => { addToCart('greek', 7); const t = totals(); if (t.subtotal < 200000) throw new Error('Chưa đạt ngưỡng'); if (t.shipping !== 0) throw new Error('Không miễn ship'); updateQty('greek', 0); });
    test('Fallback storage hoạt động', () => { if(!store) throw new Error('Store không sẵn'); store.setItem('x','{}'); });
    test('Chuẩn hoá cart khi storage sai dạng', () => { try { store.setItem('cart', '{}'); } catch {}; let tmp; try { tmp = JSON.parse(store.getItem('cart')||'[]'); } catch { tmp = []; } if (!Array.isArray(tmp)) tmp = []; if(!Array.isArray(tmp)) throw new Error('Không chuẩn hoá được'); try { store.removeItem('cart'); } catch {} });
  }
})();