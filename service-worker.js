(() => {
  async function loadStatus() {
    const notice=document.getElementById("storageTrustNotice");
    if(!notice)return;
    try{
      const response=await fetch("/api/storage/status",{cache:"no-store"});
      const status=await response.json();
      if(status.mode==="temporary"){
        notice.classList.remove("hidden");
        document.getElementById("storageTrustText").textContent =
          "The current free deployment uses temporary storage. Complete orders may not remain after a server restart.";
      }else{
        notice.classList.add("hidden");
      }
    }catch{}
  }
  document.addEventListener("DOMContentLoaded",loadStatus);
})();