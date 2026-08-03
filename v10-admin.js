(() => {
  function mount() {
    if(document.getElementById("mobileCommerceNav"))return;
    const token=localStorage.getItem("rsrSession")||sessionStorage.getItem("rsrSession");
    const current=location.pathname.split("/").pop()||"index.html";
    const nav=document.createElement("nav");
    nav.id="mobileCommerceNav";
    nav.className="mobile-commerce-nav";
    nav.setAttribute("aria-label","Mobile navigation");
    const items=[
      ["index.html","⌂","Home"],
      ["shop.html","🛍","Order"],
      [token?"dashboard.html":"auth.html","📦","Orders"],
      [token?"support.html":"auth.html","💬","Support"],
      [token?"profile.html":"auth.html","👤","Profile"]
    ];
    nav.innerHTML=items.map(([href,icon,label])=>{
      const target=href.split("#")[0],active=(current===target)||(current===""&&target==="index.html");
      return `<a href="${href}" class="${active?"active":""}"><span>${icon}</span><b>${label}</b></a>`;
    }).join("");
    document.body.appendChild(nav);
  }
  document.addEventListener("DOMContentLoaded",mount);
})();