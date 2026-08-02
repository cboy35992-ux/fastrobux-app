
(() => {
  const $=id=>document.getElementById(id);if(!$("translationEditorPanel"))return;
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const api=async(url,opt={})=>{opt.headers={...(opt.headers||{}),"x-admin-key":$("key").value.trim()};if(opt.body)opt.headers["Content-Type"]="application/json";const r=await fetch(url,opt),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Request failed");return d};
  let rows=[];
  async function load(){try{const d=await api(`/api/admin/translations?language=${encodeURIComponent($("translationLanguage").value)}`);rows=d.translations||[];render()}catch{}}
  function render(){const q=$("translationSearch").value.toLowerCase();$("translationList").innerHTML=rows.filter(x=>!q||x.sourceText.toLowerCase().includes(q)||x.translatedText.toLowerCase().includes(q)).map(x=>`<button class="translation-row" data-source="${esc(x.sourceText)}"><span><b>${esc(x.sourceText)}</b><small>${esc(x.translatedText)}</small></span><em>Edit</em></button>`).join("")||'<p class="muted">No custom translations saved for this language.</p>';document.querySelectorAll(".translation-row").forEach(b=>b.onclick=()=>{const row=rows.find(x=>x.sourceText===b.dataset.source);$("translationSource").value=row.sourceText;$("translationValue").value=row.translatedText;window.scrollTo({top:$("translationEditorPanel").offsetTop-20,behavior:"smooth"})})}
  $("translationLanguage").onchange=load;$("translationSearch").oninput=render;
  $("clearTranslationForm").onclick=()=>{$("translationSource").value="";$("translationValue").value=""};
  $("saveTranslation").onclick=async()=>{try{await api("/api/admin/translations",{method:"PUT",body:JSON.stringify({language:$("translationLanguage").value,sourceText:$("translationSource").value,translatedText:$("translationValue").value})});alert("Translation saved. Buyers will receive it on their next page load.");$("translationSource").value="";$("translationValue").value="";load()}catch(e){alert(e.message)}};
  $("login").addEventListener("click",()=>setTimeout(load,700));
})();
