(() => {
  let banner;
  function ensure(){
    if(banner)return banner;
    banner=document.createElement("div");banner.id="globalConnectionBanner";banner.className="global-connection-banner hidden";
    banner.innerHTML='<span class="connection-dot"></span><b id="globalConnectionText">Connecting…</b><button id="globalConnectionRetry" type="button">Retry</button>';
    document.body.prepend(banner);banner.querySelector("button").onclick=()=>RSRNetwork?.waitForServer({show:true,maxAttempts:8});return banner;
  }
  function set(kind,text,show=true){const b=ensure();b.className=`global-connection-banner ${kind}${show?"":" hidden"}`;b.querySelector("#globalConnectionText").textContent=text}
  window.addEventListener("offline",()=>set("offline","Your device is offline. Some saved pages remain available."));
  window.addEventListener("online",()=>set("checking","Internet restored. Reconnecting to Reck Shop…"));
  window.addEventListener("rsr-server-online",()=>{set("online","Connected to Reck Shop.");setTimeout(()=>set("online","",false),2200)});
  document.addEventListener("DOMContentLoaded",async()=>{ensure();try{await RSRNetwork.api("/api/health",{}, {retries:0,showReconnect:false,timeoutMs:8000});set("online","",false)}catch{if(navigator.onLine)set("waking","The shop server is waking up. Actions will reconnect automatically.")}});
})();