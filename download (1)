(() => {
  const LANGUAGES = {
    en:{name:"English",flag:"🇬🇧"},fil:{name:"Filipino",flag:"🇵🇭"},ceb:{name:"Cebuano",flag:"🇵🇭"},
    es:{name:"Español",flag:"🇪🇸"},pt:{name:"Português",flag:"🇧🇷"},vi:{name:"Tiếng Việt",flag:"🇻🇳"},
    fr:{name:"Français",flag:"🇫🇷"},de:{name:"Deutsch",flag:"🇩🇪"},id:{name:"Bahasa Indonesia",flag:"🇮🇩"},
    ja:{name:"日本語",flag:"🇯🇵"},ko:{name:"한국어",flag:"🇰🇷"},zh:{name:"中文",flag:"🇨🇳"},
    th:{name:"ไทย",flag:"🇹🇭"},ar:{name:"العربية",flag:"🇸🇦"}
  };

  const BASE = {
    fil:{"ORDER CHECKOUT":"PAG-ORDER","Choose Method":"Piliin ang Paraan","Roblox Account & Amount":"Roblox Account at Halaga","Verify Game Pass":"I-verify ang Game Pass","Payment & Receipt":"Bayad at Resibo","Method":"Paraan","Account":"Account","Game Pass":"Game Pass","Payment":"Bayad","Back":"Bumalik","Next":"Susunod","Continue to Payment":"Magpatuloy sa Pagbayad","Game Pass Verified — Continue to Payment":"Na-verify ang Game Pass — Magpatuloy sa Pagbayad",
      "Shop":"Tindahan","Trust Center":"Sentro ng Tiwala","How to Buy":"Paano Bumili","FAQ":"Mga Madalas Itanong",
      "Login / Register":"Mag-login / Magrehistro","Admin":"Admin","Support Online":"Online ang Suporta",
      "Create Account":"Gumawa ng Account","View Methods":"Tingnan ang mga Paraan","Buyer Tutorial":"Gabay sa Mamimili",
      "Install App":"I-install ang App","Install on iPhone":"I-install sa iPhone","First time buying?":"Unang beses bumili?",
      "Open Full Tutorial":"Buksan ang Kumpletong Gabay","Watch Tutorial Video":"Panoorin ang Tutorial",
      "Choose Your Purchase Method":"Piliin ang Paraan ng Pagbili","Covered Tax":"Sagot ang Tax",
      "Not Covered Tax":"Hindi Sagot ang Tax","Robux Instant":"Mabilisang Robux","In-Game Gifting":"Regalo sa Loob ng Laro",
      "Continue":"Magpatuloy","Submit Order":"Isumite ang Order","Confirm & Submit Order":"Kumpirmahin at Isumite",
      "Roblox Username":"Roblox Username","Desired Robux":"Gustong Robux","Game Pass Link":"Link ng Game Pass",
      "Verify Username & Game Pass":"I-verify ang Username at Game Pass","Payment Method":"Paraan ng Pagbayad",
      "Upload Receipt":"I-upload ang Resibo","Sender Name":"Pangalan ng Nagpadala","Reference Number":"Reference Number",
      "Order Status":"Status ng Order","Completed":"Tapos","Processing":"Pinoproseso","Declined":"Tinanggihan",
      "Approved":"Aprubado","Pending Payment Review":"Naghihintay ng Pagsuri sa Bayad","Ready for Delivery":"Handa nang Ihatid",
      "Need help before paying?":"Kailangan ng tulong bago magbayad?","Start an Order":"Magsimula ng Order",
      "Open FAQ":"Buksan ang FAQ","Language":"Wika","Save":"I-save","Email":"Email","Phone":"Telepono",
      "Business Location":"Lokasyon ng Negosyo","Contact Support":"Makipag-ugnayan sa Suporta",
      "How to Create a Roblox Game Pass":"Paano Gumawa ng Roblox Game Pass","Basic order flow":"Karaniwang proseso ng order",
      "Receipt and order-status guide":"Gabay sa resibo at status ng order","Smart Checkout Check":"Matalinong Pagsuri ng Checkout",
      "Complete every requirement before submitting.":"Kumpletuhin ang lahat ng kailangan bago magsumite.",
      "Roblox account selected":"Napili ang Roblox account","Valid Robux amount entered":"Tamang halaga ng Robux ang nailagay",
      "Game Pass verified at exact price":"Na-verify ang Game Pass sa eksaktong presyo","Payment method selected":"Napili ang paraan ng bayad",
      "Sender name entered":"Nailagay ang pangalan ng nagpadala","Reference number entered":"Nailagay ang reference number",
      "Clear receipt uploaded":"Na-upload ang malinaw na resibo","Information confirmation checked":"Nakumpirma ang impormasyon",
      "FINAL CHECK":"HULING PAGSUSURI","Confirm Order Details":"Kumpirmahin ang Detalye ng Order",
      "I reviewed this summary and confirm it is correct.":"Sinuri ko ang buod at kinukumpirma kong tama ito.",
      "Notifications":"Mga Abiso","Mark read":"Markahan bilang nabasa","No notifications yet.":"Wala pang abiso.",
      "Report an Order Problem":"I-report ang Problema sa Order","Order Number":"Numero ng Order","Problem":"Problema",
      "Details":"Detalye","Open Support Case":"Magbukas ng Support Case","No support cases.":"Walang support case.",
      "Missing Delivery":"Hindi Dumating ang Delivery","Wrong Roblox Username":"Maling Roblox Username",
      "Wrong Game Pass":"Maling Game Pass","Duplicate Payment":"Dobleng Bayad","Refund Request":"Kahilingan sa Refund","Other":"Iba pa",
      "My Orders":"Aking mga Order","Order History":"Kasaysayan ng Order","Customer Dashboard":"Dashboard ng Customer",
      "Logout":"Mag-logout","Track Order":"Subaybayan ang Order","View Order":"Tingnan ang Order",
      "Loading…":"Naglo-load…","No orders yet.":"Wala pang order.","Search":"Maghanap","Close":"Isara",
      "Payment approved":"Aprubado ang bayad","Order processing":"Pinoproseso ang order","Order completed":"Tapos na ang order",
      "Better receipt required":"Kailangan ng mas malinaw na resibo","Correct Game Pass required":"Kailangan ang tamang Game Pass",
      "Your payment has been verified. Your order is now being processed.":"Na-verify na ang bayad mo. Pinoproseso na ang order mo.",
      "Your order has been completed. Please check your Roblox account or Pending Robux.":"Tapos na ang order mo. Tingnan ang Roblox account o Pending Robux mo.",
      "New orders are temporarily disabled. Existing orders can still be tracked.":"Pansamantalang hindi tumatanggap ng bagong order. Maaari pa ring subaybayan ang kasalukuyang order.",
      "Temporarily unavailable":"Pansamantalang hindi available","Required Game Pass Price":"Kinakailangang Presyo ng Game Pass",
      "Not verified":"Hindi pa verified","Verified":"Na-verify","Verification failed":"Nabigo ang verification",
      "Terms of Service":"Mga Tuntunin ng Serbisyo","Privacy Policy":"Patakaran sa Privacy","Refund Policy":"Patakaran sa Refund",
      "Forgot Password":"Nakalimutan ang Password","Reset Password":"I-reset ang Password","Password":"Password",
      "Full Name":"Buong Pangalan","Register":"Magrehistro","Login":"Mag-login","Send Reset Link":"Ipadala ang Reset Link",
      "Never provide your Roblox password, cookie or verification code.":"Huwag kailanman ibigay ang Roblox password, cookie, o verification code mo."
    },
    ceb:{"ORDER CHECKOUT":"PAG-ORDER","Choose Method":"Pilia ang Paagi","Roblox Account & Amount":"Roblox Account ug Amount","Verify Game Pass":"I-verify ang Game Pass","Payment & Receipt":"Bayad ug Resibo","Method":"Paagi","Account":"Account","Game Pass":"Game Pass","Payment":"Bayad","Back":"Balik","Next":"Sunod","Continue to Payment":"Padayon sa Pagbayad","Game Pass Verified — Continue to Payment":"Na-verify ang Game Pass — Padayon sa Pagbayad",
      "Shop":"Tindahan","Trust Center":"Sentro sa Pagsalig","How to Buy":"Unsaon Pagpalit","FAQ":"Kasagarang Pangutana",
      "Login / Register":"Sulod / Rehistro","Support Online":"Online ang Suporta","Create Account":"Paghimo og Account",
      "View Methods":"Tan-awa ang mga Paagi","Buyer Tutorial":"Giya sa Buyer","Install App":"I-install ang App",
      "Install on iPhone":"I-install sa iPhone","First time buying?":"Unang higayon nimo mopalit?",
      "Open Full Tutorial":"Ablihi ang Kumpletong Giya","Watch Tutorial Video":"Tan-awa ang Tutorial",
      "Choose Your Purchase Method":"Pilia ang Paagi sa Pagpalit","Covered Tax":"Apil ang Tax","Not Covered Tax":"Dili Apil ang Tax",
      "Robux Instant":"Paspas nga Robux","In-Game Gifting":"Pagregalo Sulod sa Dula","Continue":"Padayon",
      "Submit Order":"Isumite ang Order","Confirm & Submit Order":"Kumpirmahi ug Isumite ang Order",
      "Roblox Username":"Roblox Username","Desired Robux":"Gitinguhang Robux","Game Pass Link":"Link sa Game Pass",
      "Verify Username & Game Pass":"I-verify ang Username ug Game Pass","Payment Method":"Paagi sa Pagbayad",
      "Upload Receipt":"I-upload ang Resibo","Sender Name":"Ngalan sa Nagpadala","Reference Number":"Reference Number",
      "Order Status":"Status sa Order","Completed":"Nahuman","Processing":"Giproseso","Declined":"Gibalibaran",
      "Approved":"Gi-aprubahan","Pending Payment Review":"Naghulat sa Pagsusi sa Bayad","Ready for Delivery":"Andam na para Delivery",
      "Need help before paying?":"Kinahanglan og tabang sa dili pa mobayad?","Start an Order":"Pagsugod og Order",
      "Open FAQ":"Ablihi ang FAQ","Language":"Pinulongan","Save":"I-save","Phone":"Numero sa Telepono",
      "Business Location":"Lokasyon sa Negosyo","Contact Support":"Kontaka ang Suporta",
      "How to Create a Roblox Game Pass":"Unsaon Paghimo og Roblox Game Pass","Basic order flow":"Kasagarang proseso sa order",
      "Receipt and order-status guide":"Giya sa resibo ug status sa order","Smart Checkout Check":"Maalamong Pagsusi sa Checkout",
      "Complete every requirement before submitting.":"Kompletoha ang tanang kinahanglanon sa dili pa isumite.",
      "Roblox account selected":"Napili ang Roblox account","Valid Robux amount entered":"Sakto nga Robux amount ang gisulod",
      "Game Pass verified at exact price":"Na-verify ang Game Pass sa eksaktong presyo","Payment method selected":"Napili ang paagi sa pagbayad",
      "Sender name entered":"Nasulod ang ngalan sa nagpadala","Reference number entered":"Nasulod ang reference number",
      "Clear receipt uploaded":"Na-upload ang klaro nga resibo","Information confirmation checked":"Nakumpirma ang impormasyon",
      "FINAL CHECK":"KATAPUSANG PAGSUSI","Confirm Order Details":"Kumpirmahi ang Detalye sa Order",
      "I reviewed this summary and confirm it is correct.":"Gisusi nako kini nga summary ug gikumpirma nga sakto.",
      "Notifications":"Mga Pahibalo","Mark read":"Markahi nga nabasa","No notifications yet.":"Wala pay pahibalo.",
      "Report an Order Problem":"I-report ang Problema sa Order","Order Number":"Numero sa Order","Problem":"Problema",
      "Details":"Detalye","Open Support Case":"Ablihi ang Support Case","No support cases.":"Walay support case.",
      "Missing Delivery":"Wala Naabot ang Delivery","Wrong Roblox Username":"Sayop nga Roblox Username",
      "Wrong Game Pass":"Sayop nga Game Pass","Duplicate Payment":"Doble nga Bayad","Refund Request":"Hangyo sa Refund","Other":"Uban pa",
      "My Orders":"Akong mga Order","Order History":"Kasaysayan sa Order","Customer Dashboard":"Dashboard sa Customer",
      "Logout":"Gawas","Track Order":"Subaya ang Order","View Order":"Tan-awa ang Order","Loading…":"Nag-load…",
      "No orders yet.":"Wala pay order.","Search":"Pangitaa","Close":"Isira","Payment approved":"Gi-aprubahan ang bayad",
      "Order processing":"Giproseso ang order","Order completed":"Nahuman ang order","Better receipt required":"Kinahanglan og mas klaro nga resibo",
      "Correct Game Pass required":"Kinahanglan ang sakto nga Game Pass",
      "New orders are temporarily disabled. Existing orders can still be tracked.":"Temporaryong dili modawat og bag-ong order. Masubay gihapon ang kasamtangang order.",
      "Temporarily unavailable":"Temporaryong dili available","Required Game Pass Price":"Kinahanglan nga Presyo sa Game Pass",
      "Not verified":"Wala pa na-verify","Verified":"Na-verify","Verification failed":"Napakyas ang verification",
      "Terms of Service":"Mga Termino sa Serbisyo","Privacy Policy":"Patakaran sa Privacy","Refund Policy":"Patakaran sa Refund",
      "Forgot Password":"Nakalimot sa Password","Reset Password":"I-reset ang Password","Password":"Password",
      "Full Name":"Tibuok Ngalan","Register":"Pagrehistro","Login":"Pagsulod","Send Reset Link":"Ipadala ang Reset Link",
      "Never provide your Roblox password, cookie or verification code.":"Ayaw gyud ihatag ang imong Roblox password, cookie, o verification code."
    },
    es:{
      "Shop":"Tienda","Trust Center":"Centro de Confianza","How to Buy":"Cómo Comprar","FAQ":"Preguntas Frecuentes",
      "Login / Register":"Entrar / Registrarse","Support Online":"Soporte en línea","Create Account":"Crear Cuenta",
      "View Methods":"Ver Métodos","Buyer Tutorial":"Tutorial del Comprador","Install App":"Instalar Aplicación",
      "Install on iPhone":"Instalar en iPhone","First time buying?":"¿Primera vez comprando?",
      "Open Full Tutorial":"Abrir Tutorial Completo","Watch Tutorial Video":"Ver Tutorial",
      "Choose Your Purchase Method":"Elige tu Método de Compra","Covered Tax":"Impuesto Cubierto",
      "Not Covered Tax":"Impuesto No Cubierto","Robux Instant":"Robux Rápido","In-Game Gifting":"Regalo en el Juego",
      "Continue":"Continuar","Submit Order":"Enviar Pedido","Confirm & Submit Order":"Confirmar y Enviar Pedido",
      "Roblox Username":"Usuario de Roblox","Desired Robux":"Robux Deseados","Game Pass Link":"Enlace del Game Pass",
      "Verify Username & Game Pass":"Verificar Usuario y Game Pass","Payment Method":"Método de Pago",
      "Upload Receipt":"Subir Recibo","Sender Name":"Nombre del Remitente","Reference Number":"Número de Referencia",
      "Order Status":"Estado del Pedido","Completed":"Completado","Processing":"Procesando","Declined":"Rechazado",
      "Approved":"Aprobado","Pending Payment Review":"Pago Pendiente de Revisión","Ready for Delivery":"Listo para Entrega",
      "Need help before paying?":"¿Necesitas ayuda antes de pagar?","Start an Order":"Iniciar Pedido",
      "Open FAQ":"Abrir Preguntas","Language":"Idioma","Save":"Guardar","Phone":"Teléfono",
      "Business Location":"Ubicación del Negocio","Contact Support":"Contactar Soporte",
      "How to Create a Roblox Game Pass":"Cómo Crear un Game Pass de Roblox","Basic order flow":"Flujo básico del pedido",
      "Receipt and order-status guide":"Guía de recibo y estado del pedido","Smart Checkout Check":"Verificación Inteligente",
      "Complete every requirement before submitting.":"Completa todos los requisitos antes de enviar.",
      "Roblox account selected":"Cuenta de Roblox seleccionada","Valid Robux amount entered":"Cantidad válida de Robux ingresada",
      "Game Pass verified at exact price":"Game Pass verificado al precio exacto","Payment method selected":"Método de pago seleccionado",
      "Sender name entered":"Nombre del remitente ingresado","Reference number entered":"Número de referencia ingresado",
      "Clear receipt uploaded":"Recibo claro subido","Information confirmation checked":"Información confirmada",
      "FINAL CHECK":"REVISIÓN FINAL","Confirm Order Details":"Confirmar Detalles del Pedido",
      "I reviewed this summary and confirm it is correct.":"Revisé este resumen y confirmo que es correcto.",
      "Notifications":"Notificaciones","Mark read":"Marcar como leído","No notifications yet.":"Aún no hay notificaciones.",
      "Report an Order Problem":"Reportar un Problema del Pedido","Order Number":"Número de Pedido","Problem":"Problema",
      "Details":"Detalles","Open Support Case":"Abrir Caso de Soporte","No support cases.":"No hay casos de soporte.",
      "Missing Delivery":"Entrega Faltante","Wrong Roblox Username":"Usuario de Roblox Incorrecto",
      "Wrong Game Pass":"Game Pass Incorrecto","Duplicate Payment":"Pago Duplicado","Refund Request":"Solicitud de Reembolso","Other":"Otro",
      "My Orders":"Mis Pedidos","Order History":"Historial de Pedidos","Customer Dashboard":"Panel del Cliente",
      "Logout":"Cerrar Sesión","Track Order":"Rastrear Pedido","View Order":"Ver Pedido","Loading…":"Cargando…",
      "No orders yet.":"Aún no hay pedidos.","Search":"Buscar","Close":"Cerrar","Payment approved":"Pago aprobado",
      "Order processing":"Pedido en proceso","Order completed":"Pedido completado","Better receipt required":"Se requiere un recibo más claro",
      "Correct Game Pass required":"Se requiere el Game Pass correcto","Temporarily unavailable":"Temporalmente no disponible",
      "Required Game Pass Price":"Precio Requerido del Game Pass","Not verified":"No verificado","Verified":"Verificado",
      "Verification failed":"La verificación falló","Terms of Service":"Términos de Servicio",
      "Privacy Policy":"Política de Privacidad","Refund Policy":"Política de Reembolso","Forgot Password":"Olvidé mi Contraseña",
      "Reset Password":"Restablecer Contraseña","Password":"Contraseña","Full Name":"Nombre Completo",
      "Register":"Registrarse","Login":"Entrar","Send Reset Link":"Enviar Enlace de Restablecimiento"
    }
  };

  const GENERIC = {
    pt:{"Shop":"Loja","How to Buy":"Como Comprar","FAQ":"Perguntas Frequentes","Login":"Entrar","Register":"Registrar","Continue":"Continuar","Submit Order":"Enviar Pedido","Notifications":"Notificações","Completed":"Concluído","Processing":"Processando","Declined":"Recusado","Approved":"Aprovado","Language":"Idioma","Save":"Salvar","Close":"Fechar","Search":"Pesquisar","Payment Method":"Método de Pagamento","Upload Receipt":"Enviar Comprovante","Order Status":"Status do Pedido"},
    vi:{"Shop":"Cửa hàng","How to Buy":"Cách Mua","FAQ":"Câu hỏi Thường gặp","Login":"Đăng nhập","Register":"Đăng ký","Continue":"Tiếp tục","Submit Order":"Gửi Đơn hàng","Notifications":"Thông báo","Completed":"Hoàn tất","Processing":"Đang xử lý","Declined":"Bị từ chối","Approved":"Đã duyệt","Language":"Ngôn ngữ","Save":"Lưu","Close":"Đóng","Search":"Tìm kiếm","Payment Method":"Phương thức Thanh toán","Upload Receipt":"Tải Biên lai","Order Status":"Trạng thái Đơn hàng"},
    fr:{"Shop":"Boutique","How to Buy":"Comment Acheter","FAQ":"FAQ","Login":"Connexion","Register":"S'inscrire","Continue":"Continuer","Submit Order":"Envoyer la Commande","Notifications":"Notifications","Completed":"Terminé","Processing":"Traitement","Declined":"Refusé","Approved":"Approuvé","Language":"Langue","Save":"Enregistrer","Close":"Fermer","Search":"Rechercher","Payment Method":"Mode de Paiement","Upload Receipt":"Téléverser le Reçu","Order Status":"Statut de la Commande"},
    de:{"Shop":"Shop","How to Buy":"So kaufen Sie","FAQ":"Häufige Fragen","Login":"Anmelden","Register":"Registrieren","Continue":"Weiter","Submit Order":"Bestellung Absenden","Notifications":"Benachrichtigungen","Completed":"Abgeschlossen","Processing":"In Bearbeitung","Declined":"Abgelehnt","Approved":"Genehmigt","Language":"Sprache","Save":"Speichern","Close":"Schließen","Search":"Suchen","Payment Method":"Zahlungsmethode","Upload Receipt":"Beleg Hochladen","Order Status":"Bestellstatus"},
    id:{"Shop":"Toko","How to Buy":"Cara Membeli","FAQ":"Pertanyaan Umum","Login":"Masuk","Register":"Daftar","Continue":"Lanjutkan","Submit Order":"Kirim Pesanan","Notifications":"Notifikasi","Completed":"Selesai","Processing":"Diproses","Declined":"Ditolak","Approved":"Disetujui","Language":"Bahasa","Save":"Simpan","Close":"Tutup","Search":"Cari","Payment Method":"Metode Pembayaran","Upload Receipt":"Unggah Bukti","Order Status":"Status Pesanan"},
    ja:{"Shop":"ショップ","How to Buy":"購入方法","FAQ":"よくある質問","Login":"ログイン","Register":"登録","Continue":"続ける","Submit Order":"注文を送信","Notifications":"通知","Completed":"完了","Processing":"処理中","Declined":"却下","Approved":"承認済み","Language":"言語","Save":"保存","Close":"閉じる","Search":"検索","Payment Method":"支払い方法","Upload Receipt":"領収書をアップロード","Order Status":"注文状況"},
    ko:{"Shop":"상점","How to Buy":"구매 방법","FAQ":"자주 묻는 질문","Login":"로그인","Register":"가입","Continue":"계속","Submit Order":"주문 제출","Notifications":"알림","Completed":"완료","Processing":"처리 중","Declined":"거절됨","Approved":"승인됨","Language":"언어","Save":"저장","Close":"닫기","Search":"검색","Payment Method":"결제 방법","Upload Receipt":"영수증 업로드","Order Status":"주문 상태"},
    zh:{"Shop":"商店","How to Buy":"购买方法","FAQ":"常见问题","Login":"登录","Register":"注册","Continue":"继续","Submit Order":"提交订单","Notifications":"通知","Completed":"已完成","Processing":"处理中","Declined":"已拒绝","Approved":"已批准","Language":"语言","Save":"保存","Close":"关闭","Search":"搜索","Payment Method":"付款方式","Upload Receipt":"上传收据","Order Status":"订单状态"},
    th:{"Shop":"ร้านค้า","How to Buy":"วิธีซื้อ","FAQ":"คำถามที่พบบ่อย","Login":"เข้าสู่ระบบ","Register":"สมัครสมาชิก","Continue":"ดำเนินการต่อ","Submit Order":"ส่งคำสั่งซื้อ","Notifications":"การแจ้งเตือน","Completed":"เสร็จสิ้น","Processing":"กำลังดำเนินการ","Declined":"ถูกปฏิเสธ","Approved":"อนุมัติแล้ว","Language":"ภาษา","Save":"บันทึก","Close":"ปิด","Search":"ค้นหา","Payment Method":"วิธีชำระเงิน","Upload Receipt":"อัปโหลดใบเสร็จ","Order Status":"สถานะคำสั่งซื้อ"},
    ar:{"Shop":"المتجر","How to Buy":"كيفية الشراء","FAQ":"الأسئلة الشائعة","Login":"تسجيل الدخول","Register":"إنشاء حساب","Continue":"متابعة","Submit Order":"إرسال الطلب","Notifications":"الإشعارات","Completed":"مكتمل","Processing":"قيد المعالجة","Declined":"مرفوض","Approved":"مقبول","Language":"اللغة","Save":"حفظ","Close":"إغلاق","Search":"بحث","Payment Method":"طريقة الدفع","Upload Receipt":"رفع الإيصال","Order Status":"حالة الطلب"}
  };

  for (const [lang,map] of Object.entries(GENERIC)) BASE[lang]={...(BASE[lang]||{}),...map};

  const originalText=new WeakMap(),originalAttrs=new WeakMap();
  let activeLanguage="en",overrides={},busy=false;

  const normalize=v=>String(v??"").replace(/\s+/g," ").trim();
  function phrase(value){
    const key=normalize(value);
    if(activeLanguage==="en")return key;
    return overrides[key] || BASE[activeLanguage]?.[key] || key;
  }
  function dynamic(value){
    let text=phrase(value);
    const patterns=[
      [/^Order status changed to (.+)\.$/,m=>`${phrase("Order Status")}: ${phrase(m[1])}.`],
      [/^(\d+) orders?$/,m=>`${m[1]} ${activeLanguage==="fil"?"order":activeLanguage==="ceb"?"order":activeLanguage==="es"?"pedidos":"orders"}`],
      [/^Game Pass price mismatch\.$/,()=>activeLanguage==="fil"?"Hindi tugma ang presyo ng Game Pass.":activeLanguage==="ceb"?"Dili tugma ang presyo sa Game Pass.":activeLanguage==="es"?"El precio del Game Pass no coincide.":"Game Pass price mismatch."],
      [/^Required:\s*(.+)$/,m=>`${activeLanguage==="fil"?"Kailangan":activeLanguage==="ceb"?"Kinahanglan":activeLanguage==="es"?"Requerido":"Required"}: ${m[1]}`],
      [/^Current Game Pass price:\s*(.+)$/,m=>`${activeLanguage==="fil"?"Kasalukuyang presyo":activeLanguage==="ceb"?"Kasamtangang presyo":activeLanguage==="es"?"Precio actual":"Current Game Pass price"}: ${m[1]}`]
    ];
    for(const [rx,fn] of patterns){const m=normalize(value).match(rx);if(m)return fn(m)}
    return text;
  }
  function translateTextNode(node){
    if(!node.parentElement||node.parentElement.closest("script,style,code,pre,[data-no-translate]"))return;
    if(!originalText.has(node))originalText.set(node,node.nodeValue);
    const original=originalText.get(node),clean=normalize(original);if(!clean)return;
    const translated=activeLanguage==="en"?clean:dynamic(clean);
    const left=original.match(/^\s*/)?.[0]||"",right=original.match(/\s*$/)?.[0]||"";
    node.nodeValue=left+translated+right;
  }
  function translateElement(el){
    if(el.matches("[data-no-translate],script,style,code,pre")||el.closest("[data-no-translate]"))return;
    for(const attr of ["placeholder","title","aria-label","value"]){
      if(attr==="value"&&!["BUTTON","INPUT"].includes(el.tagName))continue;
      if(!el.hasAttribute(attr))continue;
      if(!originalAttrs.has(el))originalAttrs.set(el,{});
      const store=originalAttrs.get(el);if(!(attr in store))store[attr]=el.getAttribute(attr);
      el.setAttribute(attr,activeLanguage==="en"?store[attr]:dynamic(store[attr]));
    }
    el.childNodes.forEach(n=>{if(n.nodeType===Node.TEXT_NODE)translateTextNode(n)});
  }
  function apply(lang,persist=true){
    if(!LANGUAGES[lang])lang="en";activeLanguage=lang;busy=true;
    document.documentElement.lang=lang==="fil"?"tl":lang;
    document.documentElement.dir=lang==="ar"?"rtl":"ltr";
    document.body.classList.toggle("rtl-language",lang==="ar");
    document.querySelectorAll("body *").forEach(translateElement);
    busy=false;
    const select=document.getElementById("rsrLanguageSelect");if(select)select.value=lang;
    const label=document.getElementById("rsrLanguageState");if(label)label.textContent=`${LANGUAGES[lang].flag} ${LANGUAGES[lang].name}`;
    if(persist)localStorage.setItem("rsr-language",lang);
    window.dispatchEvent(new CustomEvent("rsr-language-changed",{detail:{language:lang}}));
  }
  async function loadOverrides(lang){
    if(lang==="en"){overrides={};return}
    try{const r=await fetch(`/api/translations/${encodeURIComponent(lang)}`);const d=await r.json();overrides=d.translations||{}}catch{overrides={}}
  }
  async function change(lang,persist=true){await loadOverrides(lang);apply(lang,persist)}
  function detect(settings){
    const saved=localStorage.getItem("rsr-language");if(saved&&LANGUAGES[saved])return saved;
    if(settings?.language?.autoDetect===false)return settings?.language?.default||"en";
    const code=String(navigator.language||"en").toLowerCase();
    if(code.startsWith("tl")||code.startsWith("fil"))return"fil";
    if(code.startsWith("ceb"))return"ceb";
    return Object.keys(LANGUAGES).find(x=>code.startsWith(x))||settings?.language?.default||"en";
  }
  function mount(){
    if(document.getElementById("rsrLanguageControl"))return;
    const box=document.createElement("div");box.id="rsrLanguageControl";box.className="language-control";box.dataset.noTranslate="";
    box.innerHTML=`<span aria-hidden="true">🌐</span><select id="rsrLanguageSelect" aria-label="Language">${Object.entries(LANGUAGES).map(([k,v])=>`<option value="${k}">${v.flag} ${v.name}</option>`).join("")}</select><small id="rsrLanguageState"></small>`;
    (document.querySelector(".navbar nav")||document.body).prepend(box);
    box.querySelector("select").addEventListener("change",e=>change(e.target.value));
  }
  async function start(){
    mount();let settings={};try{const r=await fetch("/api/settings");if(r.ok)settings=await r.json()}catch{}
    await change(detect(settings),false);
    const observer=new MutationObserver(list=>{if(busy)return;busy=true;for(const mutation of list){mutation.addedNodes.forEach(n=>{if(n.nodeType===Node.TEXT_NODE)translateTextNode(n);else if(n.querySelectorAll){translateElement(n);n.querySelectorAll("*").forEach(translateElement)}})}busy=false});
    observer.observe(document.body,{childList:true,subtree:true,characterData:false});
  }
  const oldAlert=window.alert;window.alert=message=>oldAlert(activeLanguage==="en"?message:dynamic(message));
  window.RSRI18N={change,apply,t:dynamic,languages:LANGUAGES,get language(){return activeLanguage}};
  document.addEventListener("DOMContentLoaded",start);
})();