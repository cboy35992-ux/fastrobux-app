
(() => {
  const LANGUAGES = {
    en: { name: "English", flag: "🇬🇧" },
    fil: { name: "Filipino", flag: "🇵🇭" },
    ceb: { name: "Cebuano", flag: "🇵🇭" },
    es: { name: "Español", flag: "🇪🇸" },
    pt: { name: "Português", flag: "🇧🇷" },
    vi: { name: "Tiếng Việt", flag: "🇻🇳" }
  };

  const T = {
    fil: {
      "Shop":"Tindahan","Trust Center":"Sentro ng Tiwala","How to Buy":"Paano Bumili","FAQ":"Mga Tanong",
      "Login / Register":"Mag-login / Gumawa ng Account","Admin":"Admin","Support Online":"Online ang Suporta",
      "Create Account":"Gumawa ng Account","View Methods":"Tingnan ang Paraan","Buyer Tutorial":"Gabay sa Mamimili",
      "Install App":"I-install ang App","First time buying?":"Unang beses bumili?","Open Full Tutorial":"Buksan ang Kumpletong Gabay",
      "Watch Tutorial Video":"Panoorin ang Tutorial","Choose Your Purchase Method":"Piliin ang Paraan ng Pagbili",
      "Covered Tax":"Sagot ang Tax","Not Covered Tax":"Hindi Sagot ang Tax","Robux Instant":"Mabilisang Robux",
      "In-Game Gifting":"Regalo sa Loob ng Laro","Continue":"Magpatuloy","Submit Order":"Isumite ang Order",
      "Roblox Username":"Roblox Username","Desired Robux":"Gustong Robux","Game Pass Link":"Link ng Game Pass",
      "Verify Username & Game Pass":"I-verify ang Username at Game Pass","Payment Method":"Paraan ng Pagbayad",
      "Upload Receipt":"I-upload ang Resibo","Order Status":"Status ng Order","Completed":"Tapos","Processing":"Pinoproseso",
      "Declined":"Tinanggihan","Approved":"Aprubado","Pending Payment Review":"Naghihintay ng Pagsuri sa Bayad",
      "Need help before paying?":"Kailangan ng tulong bago magbayad?","Start an Order":"Magsimula ng Order",
      "Open FAQ":"Buksan ang FAQ","Language":"Wika","Save":"I-save","Email":"Email","Phone":"Telepono",
      "Business Location":"Lokasyon ng Negosyo","Contact Support":"Makipag-ugnayan sa Suporta",
      "How to Create a Roblox Game Pass":"Paano Gumawa ng Roblox Game Pass","Basic order flow":"Karaniwang proseso ng order",
      "How to create a Roblox Game Pass":"Paano gumawa ng Roblox Game Pass","Receipt and order-status guide":"Gabay sa resibo at status ng order",
      "Covered Tax (CT)":"Sagot ang Tax (CT)","Not Covered Tax (NCT)":"Hindi Sagot ang Tax (NCT)"
    },
    ceb: {
      "Shop":"Tindahan","Trust Center":"Sentro sa Pagsalig","How to Buy":"Unsaon Pagpalit","FAQ":"Kasagarang Pangutana",
      "Login / Register":"Sulod / Rehistro","Admin":"Admin","Support Online":"Online ang Suporta",
      "Create Account":"Paghimo og Account","View Methods":"Tan-awa ang mga Paagi","Buyer Tutorial":"Giya sa Buyer",
      "Install App":"I-install ang App","First time buying?":"Unang higayon nimo mopalit?","Open Full Tutorial":"Ablihi ang Kumpletong Giya",
      "Watch Tutorial Video":"Tan-awa ang Tutorial","Choose Your Purchase Method":"Pilia ang Paagi sa Pagpalit",
      "Covered Tax":"Apil ang Tax","Not Covered Tax":"Dili Apil ang Tax","Robux Instant":"Paspas nga Robux",
      "In-Game Gifting":"Pagregalo Sulod sa Dula","Continue":"Padayon","Submit Order":"Isumite ang Order",
      "Roblox Username":"Roblox Username","Desired Robux":"Gitinguhang Robux","Game Pass Link":"Link sa Game Pass",
      "Verify Username & Game Pass":"I-verify ang Username ug Game Pass","Payment Method":"Paagi sa Pagbayad",
      "Upload Receipt":"I-upload ang Resibo","Order Status":"Status sa Order","Completed":"Nahuman","Processing":"Giproseso",
      "Declined":"Gibalibaran","Approved":"Gi-aprubahan","Pending Payment Review":"Naghulat sa Pagsusi sa Bayad",
      "Need help before paying?":"Kinahanglan og tabang sa dili pa mobayad?","Start an Order":"Pagsugod og Order",
      "Open FAQ":"Ablihi ang FAQ","Language":"Pinulongan","Save":"I-save","Email":"Email","Phone":"Numero sa Telepono",
      "Business Location":"Lokasyon sa Negosyo","Contact Support":"Kontaka ang Suporta",
      "How to Create a Roblox Game Pass":"Unsaon Paghimo og Roblox Game Pass","Basic order flow":"Kasagarang proseso sa order",
      "How to create a Roblox Game Pass":"Unsaon paghimo og Roblox Game Pass","Receipt and order-status guide":"Giya sa resibo ug status sa order",
      "Covered Tax (CT)":"Apil ang Tax (CT)","Not Covered Tax (NCT)":"Dili Apil ang Tax (NCT)"
    },
    es: {
      "Shop":"Tienda","Trust Center":"Centro de Confianza","How to Buy":"Cómo Comprar","FAQ":"Preguntas",
      "Login / Register":"Iniciar sesión / Registrarse","Admin":"Admin","Support Online":"Soporte en línea",
      "Create Account":"Crear Cuenta","View Methods":"Ver Métodos","Buyer Tutorial":"Tutorial del Comprador",
      "Install App":"Instalar App","First time buying?":"¿Primera vez comprando?","Open Full Tutorial":"Abrir Tutorial Completo",
      "Watch Tutorial Video":"Ver Tutorial","Choose Your Purchase Method":"Elige tu Método de Compra",
      "Covered Tax":"Impuesto Cubierto","Not Covered Tax":"Impuesto No Cubierto","Robux Instant":"Robux Rápido",
      "In-Game Gifting":"Regalo en el Juego","Continue":"Continuar","Submit Order":"Enviar Pedido",
      "Roblox Username":"Usuario de Roblox","Desired Robux":"Robux Deseados","Game Pass Link":"Enlace del Game Pass",
      "Verify Username & Game Pass":"Verificar Usuario y Game Pass","Payment Method":"Método de Pago",
      "Upload Receipt":"Subir Recibo","Order Status":"Estado del Pedido","Completed":"Completado","Processing":"Procesando",
      "Declined":"Rechazado","Approved":"Aprobado","Pending Payment Review":"Pago Pendiente de Revisión",
      "Need help before paying?":"¿Necesitas ayuda antes de pagar?","Start an Order":"Iniciar Pedido",
      "Open FAQ":"Abrir Preguntas","Language":"Idioma","Save":"Guardar","Email":"Correo","Phone":"Teléfono",
      "Business Location":"Ubicación del Negocio","Contact Support":"Contactar Soporte",
      "How to Create a Roblox Game Pass":"Cómo Crear un Game Pass de Roblox","Basic order flow":"Flujo básico del pedido",
      "How to create a Roblox Game Pass":"Cómo crear un Game Pass de Roblox","Receipt and order-status guide":"Guía de recibo y estado del pedido",
      "Covered Tax (CT)":"Impuesto Cubierto (CT)","Not Covered Tax (NCT)":"Impuesto No Cubierto (NCT)"
    },
    pt: {
      "Shop":"Loja","Trust Center":"Central de Confiança","How to Buy":"Como Comprar","FAQ":"Perguntas",
      "Login / Register":"Entrar / Registrar","Admin":"Admin","Support Online":"Suporte Online",
      "Create Account":"Criar Conta","View Methods":"Ver Métodos","Buyer Tutorial":"Tutorial do Comprador",
      "Install App":"Instalar App","First time buying?":"Primeira compra?","Open Full Tutorial":"Abrir Tutorial Completo",
      "Watch Tutorial Video":"Assistir Tutorial","Choose Your Purchase Method":"Escolha o Método de Compra",
      "Covered Tax":"Taxa Coberta","Not Covered Tax":"Taxa Não Coberta","Robux Instant":"Robux Rápido",
      "In-Game Gifting":"Presente no Jogo","Continue":"Continuar","Submit Order":"Enviar Pedido",
      "Roblox Username":"Usuário do Roblox","Desired Robux":"Robux Desejados","Game Pass Link":"Link do Game Pass",
      "Verify Username & Game Pass":"Verificar Usuário e Game Pass","Payment Method":"Método de Pagamento",
      "Upload Receipt":"Enviar Comprovante","Order Status":"Status do Pedido","Completed":"Concluído","Processing":"Processando",
      "Declined":"Recusado","Approved":"Aprovado","Pending Payment Review":"Pagamento em Análise",
      "Need help before paying?":"Precisa de ajuda antes de pagar?","Start an Order":"Iniciar Pedido",
      "Open FAQ":"Abrir FAQ","Language":"Idioma","Save":"Salvar","Email":"Email","Phone":"Telefone",
      "Business Location":"Localização da Empresa","Contact Support":"Contatar Suporte",
      "How to Create a Roblox Game Pass":"Como Criar um Game Pass do Roblox","Basic order flow":"Fluxo básico do pedido",
      "How to create a Roblox Game Pass":"Como criar um Game Pass do Roblox","Receipt and order-status guide":"Guia de comprovante e status",
      "Covered Tax (CT)":"Taxa Coberta (CT)","Not Covered Tax (NCT)":"Taxa Não Coberta (NCT)"
    },
    vi: {
      "Shop":"Cửa hàng","Trust Center":"Trung tâm Tin cậy","How to Buy":"Cách Mua","FAQ":"Câu hỏi",
      "Login / Register":"Đăng nhập / Đăng ký","Admin":"Quản trị","Support Online":"Hỗ trợ Trực tuyến",
      "Create Account":"Tạo Tài khoản","View Methods":"Xem Phương thức","Buyer Tutorial":"Hướng dẫn Người mua",
      "Install App":"Cài đặt Ứng dụng","First time buying?":"Lần đầu mua?","Open Full Tutorial":"Mở Hướng dẫn Đầy đủ",
      "Watch Tutorial Video":"Xem Hướng dẫn","Choose Your Purchase Method":"Chọn Phương thức Mua",
      "Covered Tax":"Đã Bao gồm Thuế","Not Covered Tax":"Chưa Bao gồm Thuế","Robux Instant":"Robux Nhanh",
      "In-Game Gifting":"Tặng quà Trong Game","Continue":"Tiếp tục","Submit Order":"Gửi Đơn hàng",
      "Roblox Username":"Tên Roblox","Desired Robux":"Robux Mong muốn","Game Pass Link":"Liên kết Game Pass",
      "Verify Username & Game Pass":"Xác minh Tên và Game Pass","Payment Method":"Phương thức Thanh toán",
      "Upload Receipt":"Tải Biên lai","Order Status":"Trạng thái Đơn hàng","Completed":"Hoàn tất","Processing":"Đang xử lý",
      "Declined":"Bị từ chối","Approved":"Đã duyệt","Pending Payment Review":"Chờ Kiểm tra Thanh toán",
      "Need help before paying?":"Cần trợ giúp trước khi thanh toán?","Start an Order":"Bắt đầu Đơn hàng",
      "Open FAQ":"Mở FAQ","Language":"Ngôn ngữ","Save":"Lưu","Email":"Email","Phone":"Điện thoại",
      "Business Location":"Địa điểm Kinh doanh","Contact Support":"Liên hệ Hỗ trợ",
      "How to Create a Roblox Game Pass":"Cách Tạo Game Pass Roblox","Basic order flow":"Quy trình đặt hàng cơ bản",
      "How to create a Roblox Game Pass":"Cách tạo Game Pass Roblox","Receipt and order-status guide":"Hướng dẫn biên lai và trạng thái",
      "Covered Tax (CT)":"Đã Bao gồm Thuế (CT)","Not Covered Tax (NCT)":"Chưa Bao gồm Thuế (NCT)"
    }
  };

  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();
  let activeLanguage = "en";
  let translating = false;

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function translateValue(value, lang) {
    if (lang === "en") return value;
    const key = normalize(value);
    return T[lang]?.[key] || value;
  }

  function translateNode(node, lang) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentElement || node.parentElement.closest("script,style,code,pre,[data-no-translate]")) return;
      const raw = node.nodeValue;
      const trimmed = normalize(raw);
      if (!trimmed) return;
      if (!originalText.has(node)) originalText.set(node, raw);
      const original = originalText.get(node);
      const translated = translateValue(normalize(original), lang);
      if (translated !== normalize(original)) {
        const left = original.match(/^\s*/)?.[0] || "";
        const right = original.match(/\s*$/)?.[0] || "";
        node.nodeValue = left + translated + right;
      } else if (lang === "en") {
        node.nodeValue = original;
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    for (const attr of ["placeholder", "title", "aria-label"]) {
      if (!node.hasAttribute(attr)) continue;
      if (!originalAttrs.has(node)) originalAttrs.set(node, {});
      const store = originalAttrs.get(node);
      if (!(attr in store)) store[attr] = node.getAttribute(attr);
      const original = store[attr];
      node.setAttribute(attr, lang === "en" ? original : translateValue(original, lang));
    }
  }

  function applyLanguage(lang, persist = true) {
    if (!LANGUAGES[lang]) lang = "en";
    activeLanguage = lang;
    translating = true;
    document.documentElement.lang = lang === "fil" ? "tl" : lang;
    document.querySelectorAll("body *").forEach(el => {
      translateNode(el, lang);
      el.childNodes.forEach(child => translateNode(child, lang));
    });
    translating = false;

    const select = document.getElementById("rsrLanguageSelect");
    if (select) select.value = lang;
    if (persist) localStorage.setItem("rsr-language", lang);
    window.dispatchEvent(new CustomEvent("rsr-language-changed", { detail: { language: lang } }));
  }

  function detectLanguage(defaultLang, autoDetect) {
    const saved = localStorage.getItem("rsr-language");
    if (saved && LANGUAGES[saved]) return saved;
    if (!autoDetect) return LANGUAGES[defaultLang] ? defaultLang : "en";
    const browser = String(navigator.language || "").toLowerCase();
    if (browser.startsWith("ceb")) return "ceb";
    if (browser.startsWith("tl") || browser.startsWith("fil")) return "fil";
    if (browser.startsWith("es")) return "es";
    if (browser.startsWith("pt")) return "pt";
    if (browser.startsWith("vi")) return "vi";
    return LANGUAGES[defaultLang] ? defaultLang : "en";
  }

  function mountSelector() {
    if (document.getElementById("rsrLanguageControl")) return;
    const wrap = document.createElement("div");
    wrap.id = "rsrLanguageControl";
    wrap.className = "language-control";
    wrap.setAttribute("data-no-translate", "");
    wrap.innerHTML = `
      <span aria-hidden="true">🌐</span>
      <select id="rsrLanguageSelect" aria-label="Language">
        ${Object.entries(LANGUAGES).map(([code, item]) =>
          `<option value="${code}">${item.flag} ${item.name}</option>`).join("")}
      </select>`;
    const nav = document.querySelector(".navbar nav");
    if (nav) nav.prepend(wrap);
    else document.body.prepend(wrap);
    wrap.querySelector("select").addEventListener("change", e => applyLanguage(e.target.value));
  }

  async function start() {
    mountSelector();
    let settings = {};
    try {
      const response = await fetch("/api/settings");
      if (response.ok) settings = await response.json();
    } catch {}
    const lang = detectLanguage(settings?.language?.default || "en", settings?.language?.autoDetect !== false);
    applyLanguage(lang, false);

    const observer = new MutationObserver(mutations => {
      if (translating || activeLanguage === "en") return;
      translating = true;
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          translateNode(node, activeLanguage);
          if (node.querySelectorAll) {
            node.querySelectorAll("*").forEach(el => {
              translateNode(el, activeLanguage);
              el.childNodes.forEach(child => translateNode(child, activeLanguage));
            });
          }
        });
      }
      translating = false;
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.RSRI18N = { applyLanguage, languages: LANGUAGES, get language() { return activeLanguage; } };
  document.addEventListener("DOMContentLoaded", start);
})();
