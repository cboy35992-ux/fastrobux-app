
(function(){
 document.body.classList.add('v17-ui');
 const isAdmin=!!document.querySelector('#area');
 const isDash=location.pathname.endsWith('/dashboard.html')||location.pathname.endsWith('dashboard.html');
 if(!(isAdmin||isDash)) return;
 document.body.classList.add('v17-shell-ready'); if(isAdmin) document.body.classList.add('v17-admin');
 const side=document.createElement('aside'); side.className='v17-sidebar';
 side.innerHTML=`<div class="v17-side-brand"><span class="v17-side-logo">R</span><span>RSR SHOP<small style="display:block;color:#9997b8;font-size:9px;letter-spacing:1px">PREMIUM DIGITAL MARKETPLACE</small></span></div><nav class="v17-side-nav">${isAdmin?`<a class="active" href="#area">▦ Dashboard</a><a href="#orders">▣ Orders</a><a href="#selectedPanel">◎ Processing</a><a href="#translationEditorPanel">⚙ Settings</a><a href="/">↗ Open Shop</a>`:`<a class="active" href="dashboard.html">▦ Dashboard</a><a href="shop.html">🛒 Place Order</a><a href="#orders">▣ My Orders</a><a href="support.html">◉ Support</a><a href="tutorial.html">▷ Tutorial</a><a href="trust.html">♢ Trust Center</a>`}</nav><div class="v17-side-bottom"><b>${isAdmin?'Private Admin':'Secure Account'}</b><small style="display:block;color:#aaa8c0;margin-top:5px">Protected RSR workspace</small></div>`;
 document.body.prepend(side);
 const top=document.createElement('div');top.className='v17-topbar';top.innerHTML=`<h1>${isAdmin?'Operations Dashboard':'Dashboard'}</h1><div class="v17-search"><input aria-label="Search" placeholder="Search orders, transactions..."></div><div class="v17-secure">🛡 Secure Account<br><small>Your access is protected</small></div>`;
 const main=document.querySelector('main.container'); if(main) main.before(top);
})();
