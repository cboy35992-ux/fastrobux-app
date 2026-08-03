(() => {
  async function load(){
    try{
      const response=await fetch("/api/settings",{cache:"no-store"});
      const settings=await response.json();
      const bar=document.getElementById("premiumAnnouncement");
      if(bar&&settings.announcement){
        bar.className=`premium-announcement ${settings.announcement.level||"info"}`;
        bar.innerHTML=`<div><b>${settings.announcement.title}</b><span>${settings.announcement.message}</span></div><button type="button" aria-label="Close">×</button>`;
        bar.querySelector("button").onclick=()=>bar.classList.add("hidden");
      }
    }catch{}
  }
  document.addEventListener("DOMContentLoaded",load);
})();