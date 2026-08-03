(() => {
  function init(){
    const method=new URLSearchParams(location.search).get("method");
    const valid=["ct","nct","instant","gifting"].includes(method);
    document.body.classList.toggle("method-selected",valid);
    document.body.classList.toggle("method-chooser",!valid);
    const intro=document.querySelector(".shop-page-intro");
    if(valid){
      const names={ct:"Covered Tax",nct:"Not Covered Tax",instant:"Robux Instant",gifting:"In-Game Gifting"};
      if(intro) intro.innerHTML=`<a class="back-link" href="shop.html">← Change Order Method</a><span class="eyebrow">${names[method].toUpperCase()} ORDER</span><h1>Follow the steps to submit your ${names[method]} order.</h1><p>Complete one step at a time. Only the information required for this order method is shown.</p>`;
      const button=document.querySelector(`[data-method="${method}"]`); if(button&&!button.classList.contains("active")) button.click();
    }else if(intro){intro.innerHTML=`<a class="back-link" href="dashboard.html">← Back to Dashboard</a><span class="eyebrow">START A NEW ORDER</span><h1>What do you want to order?</h1><p>Choose one option. You will then open a separate, clear step-by-step order portal.</p>`;}
  }
  window.addEventListener("load",()=>setTimeout(init,120));
})();
document.addEventListener("click",e=>{const card=e.target.closest(".method-chooser [data-method]");if(!card)return;e.preventDefault();location.href=`shop.html?method=${encodeURIComponent(card.dataset.method)}`;},true);
