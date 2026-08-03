
(function(){
 if(!document.body.classList.contains('dedicated-shop-page')) return;
 document.body.classList.add('v17-ui','v17-wizard');
 const method=document.querySelector('#shop'), account=document.querySelector('#usernameSearch')?.closest('.panel'), gamepass=document.querySelector('#gamepassRequirements'), payment=document.querySelector('#submitOrder')?.closest('.panel');
 if(!method||!account||!payment) return;
 const reviews=document.querySelector('#reviews')?.closest('.panel'); if(reviews) reviews.style.display='none';
 const header=document.createElement('section');header.className='v17-checkout-header';header.innerHTML='<span class="eyebrow">SECURE STEP-BY-STEP CHECKOUT</span><h1>Place Your Order</h1><p class="muted">Complete one step at a time. Your Back and Next buttons stay visible on iPhone, Android, tablet and desktop.</p><div class="v17-order-summary"><div><span>Method</span><b id="v17SumMethod">Covered Tax</b></div><div><span>Robux</span><b id="v17SumAmount">0</b></div><div><span>Total</span><b id="v17SumTotal">₱0.00</b></div><div><span>Status</span><b id="v17SumStatus">Not submitted</b></div></div>';
 method.before(header);
 const progress=document.createElement('div'); progress.className='v17-progress'; header.after(progress);
 [method,account,gamepass,payment].forEach(x=>x&&x.classList.add('v17-step'));
 let chosen=(new URLSearchParams(location.search).get('method')||'').toLowerCase();
 const valid=['ct','nct','instant','gifting']; if(!valid.includes(chosen)) chosen='';
 let idx=0, steps=[];
 const labels={method:'Choose Order',account:'Verify Account',gamepass:'Game Pass',payment:'Payment & Submit'};
 function build(){steps=[{k:'method',el:method},{k:'account',el:account}]; if(chosen==='ct'||chosen==='nct')steps.push({k:'gamepass',el:gamepass});steps.push({k:'payment',el:payment});progress.style.setProperty('--steps',steps.length);progress.innerHTML=steps.map((s,i)=>`<div class="v17-progress-item" data-i="${i}"><i>${i+1}</i><span>${labels[s.k]}</span></div>`).join(''); if(idx>=steps.length)idx=steps.length-1;show();}
 const actions=document.createElement('div');actions.className='v17-mobile-actions';actions.innerHTML='<button type="button" id="v17Back" class="button secondary">← Back</button><button type="button" id="v17Next" class="button primary">Next Step →</button>';document.body.append(actions);
 const error=document.createElement('div');error.className='v17-error';actions.before(error);
 function setError(t){error.textContent=t||'';error.classList.toggle('show',!!t); if(t)error.scrollIntoView({behavior:'smooth',block:'center'});} 
 function show(){steps.forEach((s,i)=>s.el.classList.toggle('v17-active',i===idx));progress.querySelectorAll('.v17-progress-item').forEach((e,i)=>{e.classList.toggle('active',i===idx);e.classList.toggle('done',i<idx)});document.querySelector('#v17Back').style.visibility=idx===0?'hidden':'visible';const n=document.querySelector('#v17Next');n.textContent=idx===steps.length-1?'Review & Submit Below':'Proceed to '+labels[steps[idx+1]?.k]+' →';setError('');window.scrollTo({top:0,behavior:'smooth'});updateSummary();}
 function selectedRoblox(){const r=document.querySelector('#robloxResult');return r&&!r.classList.contains('hidden')&&document.querySelector('#robloxUserId')?.textContent?.trim();}
 function validate(){const k=steps[idx].k;if(k==='method'&&!chosen)return 'Please choose one order method first.';if(k==='account'){if(!selectedRoblox())return 'Search and select the correct Roblox account before proceeding.';const amt=Number(document.querySelector('#amount')?.value||0);if(!(amt>0))return 'Enter a valid Robux amount.';if(chosen==='gifting'&&(!document.querySelector('#gameName')?.value.trim()||!document.querySelector('#itemName')?.value.trim()))return 'Enter both the game name and exact item name.';}if(k==='gamepass'){const status=(document.querySelector('#gamepassStatus')?.textContent||'').toLowerCase();if(!status.includes('verified'))return 'Verify the exact Roblox username and Game Pass link before payment.';}return ''}
 document.querySelector('#v17Back').onclick=()=>{if(idx>0){idx--;show()}};document.querySelector('#v17Next').onclick=()=>{const e=validate();if(e){setError(e);return}if(idx<steps.length-1){idx++;show()}else{payment.scrollIntoView({behavior:'smooth',block:'start'})}};
 document.querySelectorAll('.method-card').forEach(card=>card.addEventListener('click',()=>{chosen=card.dataset.method||chosen;idx=0;setTimeout(()=>{build();idx=1;show()},0)}));
 function updateSummary(){const names={ct:'Covered Tax',nct:'Not Covered Tax',instant:'Robux Instant',gifting:'In-Game Gifting'};document.querySelector('#v17SumMethod').textContent=names[chosen]||'Choose method';document.querySelector('#v17SumAmount').textContent=(document.querySelector('#amount')?.value||0)+' Robux';document.querySelector('#v17SumTotal').textContent=document.querySelector('#totalDisplay')?.textContent||'₱0.00'}
 ['input','change'].forEach(ev=>document.addEventListener(ev,updateSummary));
 if(chosen){const card=document.querySelector(`.method-card[data-method="${chosen}"]`); if(card)card.click(); else build()} else build();
})();
