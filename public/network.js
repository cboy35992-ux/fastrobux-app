(() => {
  let overlay=null,checking=false;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function ensureOverlay(){
    if(overlay)return overlay;
    overlay=document.createElement("div");overlay.id="connectionOverlay";overlay.className="connection-overlay hidden";
    overlay.innerHTML=`<div class="connection-card"><div class="connection-spinner"></div><h2 id="connectionTitle">Connecting to Reck Shop…</h2><p id="connectionMessage">Please wait while the secure server starts.</p><div class="connection-progress"><span></span></div><button id="connectionRetry" class="button secondary hidden" type="button">Try Again</button></div>`;
    document.body.appendChild(overlay);overlay.querySelector("#connectionRetry").onclick=()=>waitForServer({show:true});
    return overlay;
  }
  function setOverlay(show,title,message,retry=false){
    const o=ensureOverlay();o.classList.toggle("hidden",!show);
    o.querySelector("#connectionTitle").textContent=title;
    o.querySelector("#connectionMessage").textContent=message;
    o.querySelector("#connectionRetry").classList.toggle("hidden",!retry);
  }
  function classify(error,response){
    if(!navigator.onLine)return{kind:"offline",message:"Your device is offline. Check Wi-Fi or mobile data, then try again."};
    if(error?.name==="AbortError")return{kind:"timeout",message:"The server is taking longer than expected to respond."};
    if(response?.status>=500)return{kind:"server",message:"The Reck Shop server is temporarily unavailable or restarting."};
    return{kind:"network",message:"Unable to connect to the Reck Shop server."};
  }
  async function rawFetch(url,options={},timeoutMs=15000){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{return await fetch(url,{...options,signal:controller.signal,headers:{Accept:"application/json",...(options.headers||{})}})}
    finally{clearTimeout(timer)}
  }
  async function waitForServer({show=true,maxAttempts=8}={}){
    if(checking)return false;checking=true;
    if(show)setOverlay(true,"Connecting to Reck Shop…","The server may be waking up. This usually takes less than a minute.");
    for(let attempt=1;attempt<=maxAttempts;attempt++){
      try{const response=await rawFetch("/api/health",{cache:"no-store"},10000);if(response.ok){setOverlay(false,"Connected","");checking=false;window.dispatchEvent(new Event("rsr-server-online"));return true}}
      catch{}
      if(show)setOverlay(true,"Server is starting…",`Connection attempt ${attempt} of ${maxAttempts}. Please keep this page open.`);
      await sleep(Math.min(2500+attempt*1000,7000));
    }
    if(show)setOverlay(true,"Unable to connect","Your internet is available, but the shop server did not respond. Try again in a moment.",true);
    checking=false;return false;
  }
  async function api(url,options={},config={}){
    const attempts=config.retries??2;let lastError=null,lastResponse=null;
    for(let attempt=0;attempt<=attempts;attempt++){
      try{
        const response=await rawFetch(url,options,config.timeoutMs||20000);lastResponse=response;
        const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={error:"The server returned an invalid response."}}
        if(response.ok)return data;
        if(response.status>=500&&attempt<attempts){await waitForServer({show:config.showReconnect!==false,maxAttempts:3});continue}
        const error=new Error(data.error||`Request failed (${response.status}).`);error.status=response.status;error.data=data;throw error;
      }catch(error){
        lastError=error;
        if(error.status&&error.status<500)throw error;
        if(attempt<attempts){await waitForServer({show:config.showReconnect!==false,maxAttempts:3});continue}
      }
    }
    const info=classify(lastError,lastResponse);const error=new Error(info.message);error.kind=info.kind;throw error;
  }
  window.RSRNetwork={api,waitForServer,setOverlay,rawFetch};
  window.addEventListener("offline",()=>setOverlay(true,"You are offline","Check Wi-Fi or mobile data. Your saved pages may still be available.",true));
  window.addEventListener("online",()=>waitForServer({show:true,maxAttempts:6}));
  document.addEventListener("DOMContentLoaded",()=>{ensureOverlay();waitForServer({show:false,maxAttempts:2})});
})();