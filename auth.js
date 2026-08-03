(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  if(!$('submitOrder')) return;
  const sessionKey=localStorage.getItem('rsr-session-key')||(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`);
  localStorage.setItem('rsr-session-key',sessionKey);
  const track=eventType=>fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventType,sessionKey,path:location.pathname,language:document.documentElement.lang})}).catch(()=>{});
  track('page_view');

  const panel=document.createElement('section');
  panel.className='panel v10-checkout';
  panel.innerHTML=`<div class="section-title"><span>✓</span><div><h2>Order Readiness</h2><p>Only the requirements for your selected method and proof type are required.</p></div></div><div id="v10Checklist" class="v10-checklist"></div><p id="v10BlockingReason" class="message hidden"></p><div class="v10-security-note">🛡️ Choose only one payment proof: a receipt photo OR a transaction reference. Never submit your Roblox password, cookie, or verification code.</div>`;
  $('submitOrder').closest('section').before(panel);

  function currentEvidence(){return document.querySelector('input[name="paymentEvidenceType"]:checked')?.value||'photo'}
  function checks(){
    const method=typeof selectedMethod!=='undefined'?selectedMethod:'ct';
    const amount=Number($('amount')?.value||0);
    const receipt=$('receipt')?.files?.[0];
    const reference=$('referenceNumber')?.value.trim()||'';
    const evidence=currentEvidence();
    const payment=document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const gp=['ct','nct'].includes(method);
    const items=[
      ['Roblox account selected',Boolean(typeof selectedRoblox!=='undefined'&&selectedRoblox)],
      ['Valid Robux amount entered',amount>0],
      ['Game Pass verified at exact price',!gp||Boolean(typeof verifiedGamePassData!=='undefined'&&verifiedGamePassData)],
      ['Payment platform selected',Boolean(payment)],
      ['Sender name entered',Boolean($('senderName')?.value.trim())],
      [evidence==='photo'?'Receipt photo selected':'Payment reference entered',evidence==='photo'?Boolean(receipt):reference.length>=5],
      ['Order information confirmed',Boolean($('confirm')?.checked)]
    ];
    $('v10Checklist').innerHTML=items.map(([label,ok])=>`<div class="${ok?'done':'pending'}"><span>${ok?'✓':'○'}</span><b>${label}</b></div>`).join('');
    const missing=items.find(x=>!x[1]);
    const reason=$('v10BlockingReason');
    if(missing){reason.textContent=`To continue: ${missing[0]}.`;reason.className='message warning'}else{reason.textContent='Everything is ready. Review and submit your order.';reason.className='message success'}
    return{ready:!missing,method,amount,payment,receipt,reference,evidence};
  }
  ['input','change','click'].forEach(name=>document.addEventListener(name,()=>setTimeout(checks,0),{passive:true}));
  checks();

  const modal=document.createElement('div');
  modal.className='v10-confirm-modal hidden';
  modal.innerHTML=`<div class="v10-confirm-card"><button class="v10-close" type="button" aria-label="Close">×</button><span class="eyebrow">FINAL REVIEW</span><h2>Confirm Order Details</h2><p class="muted">Check everything carefully. Incorrect Roblox or payment details may delay the order.</p><div id="v10Summary" class="details-grid"></div><label class="confirm"><input id="v10FinalConfirm" type="checkbox"> I reviewed the details and confirm they are correct.</label><button id="v10FinalSubmit" class="button primary full">Confirm & Submit Order</button></div>`;
  document.body.appendChild(modal);
  modal.querySelector('.v10-close').onclick=()=>modal.classList.add('hidden');
  modal.onclick=e=>{if(e.target===modal)modal.classList.add('hidden')};

  $('submitOrder').addEventListener('click',e=>{
    if(e.__rsrApproved)return;
    e.preventDefault();e.stopImmediatePropagation();
    const s=checks();
    if(!s.ready){
      const reason=$('v10BlockingReason');
      if(typeof showToast==='function')showToast(reason.textContent,'error');
      panel.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    track('order_submit_attempt');
    $('v10Summary').innerHTML=`
      <div><span>Method</span><b>${$('methodDisplay')?.textContent||s.method}</b></div>
      <div><span>Roblox Account</span><b>${typeof selectedRoblox!=='undefined'&&selectedRoblox?'@'+selectedRoblox.username:'—'}</b></div>
      <div><span>Desired Robux</span><b>${s.amount.toLocaleString()}</b></div>
      <div><span>Payment Platform</span><b>${s.payment}</b></div>
      <div><span>Total Payment</span><b>${$('totalDisplay')?.textContent||''}</b></div>
      <div><span>Proof Type</span><b>${s.evidence==='photo'?'Receipt Photo':'Reference Number'}</b></div>
      <div><span>Proof</span><b>${s.evidence==='photo'?(s.receipt?.name||'—'):s.reference}</b></div>`;
    $('v10FinalConfirm').checked=false;
    modal.classList.remove('hidden');
  },true);
  $('v10FinalSubmit').onclick=()=>{
    if(!$('v10FinalConfirm').checked){if(typeof showToast==='function')showToast('Confirm the final review first.','error');return;}
    modal.classList.add('hidden');
    const ev=new MouseEvent('click',{bubbles:true,cancelable:true});
    Object.defineProperty(ev,'__rsrApproved',{value:true});
    $('submitOrder').dispatchEvent(ev);
  };

  fetch('/api/settings').then(r=>r.json()).then(s=>{
    document.querySelectorAll('[data-method]').forEach(b=>{if(s.operations?.methods?.[b.dataset.method]===false){b.disabled=true;b.classList.add('method-disabled');b.insertAdjacentHTML('beforeend','<small>Temporarily unavailable</small>')}});
    if(s.operations?.ordersEnabled===false){$('submitOrder').disabled=true;$('submitMessage').className='message error';$('submitMessage').textContent='New orders are temporarily disabled. Existing orders can still be tracked.'}
  }).catch(()=>{});
})();
