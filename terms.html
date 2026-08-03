(() => {
  const $=id=>document.getElementById(id);
  const area=$("area");if(!area)return;

  const panel=document.createElement("section");
  panel.className="panel";
  panel.innerHTML=`
    <div class="order-header">
      <div><h2>Permanent Storage & Recovery</h2><p class="muted">Check storage, create backups, download recovery files, and export customers.</p></div>
      <button id="v12RefreshStorage">Refresh</button>
    </div>
    <div id="v12StorageStatus" class="storage-admin-status">Checking storage…</div>
    <div class="button-row">
      <button id="v12CreateBackup" class="button primary">Create Database Backup</button>
      <button id="v12ExportCustomers" class="button secondary">Export Customers CSV</button>
      <button id="v12ExportOrders" class="button secondary">Export Orders CSV</button>
    </div>
    <div id="v12BackupList" class="orders-list"></div>`;
  area.prepend(panel);

  const api=async(url,opt={})=>{
    opt.headers={...(opt.headers||{}),"x-admin-key":$("key").value.trim()};
    if(opt.body)opt.headers["Content-Type"]="application/json";
    const r=await fetch(url,opt),d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||"Request failed");
    return d;
  };

  async function download(url,filename){
    const r=await fetch(url,{headers:{"x-admin-key":$("key").value.trim()}});
    if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||"Download failed")}
    const blob=await r.blob(),a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(a.href);
  }

  async function load(){
    try{
      const [status,backups]=await Promise.all([fetch("/api/storage/status",{cache:"no-store"}).then(r=>r.json()),api("/api/admin/backups")]);
      $("v12StorageStatus").className=`storage-admin-status ${status.mode}`;
      $("v12StorageStatus").innerHTML=`<b>${status.mode==="persistent"?"Persistent storage active":"Temporary storage active"}</b><span>${status.warning}</span><small>Active root: ${status.activeRoot}</small>`;
      $("v12BackupList").innerHTML=backups.backups.map(item=>`<div class="order-row"><div><b>${item.name}</b><span>${(item.size/1024).toFixed(1)} KB · ${new Date(item.createdAt).toLocaleString()}</span></div><button data-v12-backup="${item.name}">Download</button></div>`).join("")||'<p class="muted">No backups created yet.</p>';
      document.querySelectorAll("[data-v12-backup]").forEach(button=>button.onclick=()=>download(`/api/admin/backups/${encodeURIComponent(button.dataset.v12Backup)}/download`,button.dataset.v12Backup).catch(e=>alert(e.message)));
    }catch(error){$("v12StorageStatus").textContent=error.message}
  }

  $("v12RefreshStorage").onclick=load;
  $("v12CreateBackup").onclick=async()=>{try{await api("/api/admin/backup",{method:"POST"});alert("Backup created.");load()}catch(e){alert(e.message)}};
  $("v12ExportCustomers").onclick=()=>download("/api/admin/customers/export.csv","rsr-customers.csv").catch(e=>alert(e.message));
  $("v12ExportOrders").onclick=()=>download("/api/admin/orders/export.csv","rsr-orders.csv").catch(e=>alert(e.message));
  $("login")?.addEventListener("click",()=>setTimeout(load,700));
})();