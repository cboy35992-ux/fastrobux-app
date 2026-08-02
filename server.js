"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const Database = require("better-sqlite3");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_BASE_URL = String(process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, "");
const ADMIN_KEY = process.env.ADMIN_KEY || "CHANGE_ME";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";
const EMAIL_ENABLED = String(process.env.EMAIL_ENABLED || "false").toLowerCase() === "true";
const ALLOW_DEV_EMAIL_LINKS = String(process.env.ALLOW_DEV_EMAIL_LINKS || "false").toLowerCase() === "true";
const REQUIRE_EMAIL_VERIFICATION = String(process.env.REQUIRE_EMAIL_VERIFICATION || "false").toLowerCase() === "true";
const SESSION_DAYS = Math.max(1, Number(process.env.SESSION_DAYS) || 30);
const RESERVATION_MINUTES = Math.max(5, Number(process.env.RESERVATION_MINUTES) || 60);

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const PERSISTENT_ROOT = process.env.DATA_ROOT ? path.resolve(process.env.DATA_ROOT) : ROOT;
const DATA_DIR = process.env.DATA_ROOT ? path.join(PERSISTENT_ROOT, "data") : path.join(ROOT, "data");
const UPLOADS_DIR = process.env.DATA_ROOT ? path.join(PERSISTENT_ROOT, "uploads") : path.join(ROOT, "uploads");

for (const dir of [PERSISTENT_ROOT, DATA_DIR, UPLOADS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "rsr-shop.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL,
  discount_value REAL NOT NULL,
  minimum_payment REAL NOT NULL DEFAULT 0,
  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  private_token_hash TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  method TEXT NOT NULL,
  tax_option TEXT NOT NULL,
  amount INTEGER NOT NULL,
  receive_amount INTEGER NOT NULL,
  required_pass_price INTEGER NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  total_payment REAL NOT NULL,
  promo_code TEXT,
  payment_method TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  roblox_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  game_name TEXT,
  item_name TEXT,
  receipt_filename TEXT NOT NULL,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  reservation_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(customer_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS order_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_id TEXT,
  text TEXT NOT NULL,
  customer_read INTEGER NOT NULL DEFAULT 0,
  admin_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(customer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_messages_order ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS admin_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, details TEXT, created_at TEXT NOT NULL);
`);

const defaultSettings = {
  instant_stock: "50000",
  support_online: "true",
  support_text: "Admin support is available",
  rate_ct: "428.7",
  rate_nct: "300",
  rate_instant: "450",
  rate_gifting: "300",
  paypal_email: "",
  wise_details: "",
  payoneer_details: "",
  payment_gcash_enabled: "true",
  payment_gotyme_enabled: "true",
  payment_paypal_enabled: "true",
  payment_wise_enabled: "true",
  payment_payoneer_enabled: "true",
  shop_banner_enabled: "false",
  shop_banner_text: "Welcome to Reck Shop",
  maintenance_mode: "false"
};
const setSettingStmt = db.prepare("INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)");
for (const [key, value] of Object.entries(defaultSettings)) setSettingStmt.run(key, value);

app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });
const orderLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename: (_, file, cb) => {
    const ext = file.mimetype === "image/png" ? ".png" : ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (["image/png", "image/jpeg"].includes(file.mimetype)) return cb(null, true);
    cb(new Error("Receipt must be PNG or JPG."));
  }
});

function nowIso() { return new Date().toISOString(); }
function hashToken(token) { return crypto.createHash("sha256").update(String(token)).digest("hex"); }
function publicUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    emailVerified: Boolean(row.email_verified),
    createdAt: row.created_at
  };
}
function setting(key) {
  return db.prepare("SELECT value FROM settings WHERE key = ?").get(key)?.value ?? "";
}
function settingsObject() {
  return {
    instantStock: Number(setting("instant_stock") || 0),
    supportOnline: setting("support_online") === "true",
    supportText: setting("support_text"),
    rates: {
      ct: Number(setting("rate_ct")),
      nct: Number(setting("rate_nct")),
      instant: Number(setting("rate_instant")),
      gifting: Number(setting("rate_gifting"))
    },
    paymentDetails: {
      paypalEmail: setting("paypal_email"),
      wiseDetails: setting("wise_details"),
      payoneerDetails: setting("payoneer_details")
    },
    paymentEnabled: {
      GCash: setting("payment_gcash_enabled") === "true",
      "GoTyme Bank": setting("payment_gotyme_enabled") === "true",
      PayPal: setting("payment_paypal_enabled") === "true",
      Wise: setting("payment_wise_enabled") === "true",
      Payoneer: setting("payment_payoneer_enabled") === "true"
    },
    banner: { enabled: setting("shop_banner_enabled") === "true", text: setting("shop_banner_text") },
    maintenanceMode: setting("maintenance_mode") === "true"
  };
}
function updateSetting(key, value) {
  db.prepare("INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, String(value));
}

function audit(action, details="") { try { db.prepare("INSERT INTO admin_audit(action,details,created_at) VALUES (?,?,?)").run(String(action).slice(0,120),String(details).slice(0,1500),nowIso()); } catch {} }
function createBackupNow() { const dir=path.join(DATA_DIR,"backups"); fs.mkdirSync(dir,{recursive:true}); const name=`rsr-${new Date().toISOString().replace(/[:.]/g,"-")}.db`; return db.backup(path.join(dir,name)).then(()=>name); }
setInterval(()=>createBackupNow().catch(()=>{}),24*60*60*1000).unref();

function makeOrderNumber() {
  const prefix = new Date().toISOString().slice(0,10).replaceAll("-","");
  for (let i = 0; i < 10; i++) {
    const value = `RSR-${prefix}-${crypto.randomInt(1000,9999)}`;
    if (!db.prepare("SELECT 1 FROM orders WHERE order_number=?").get(value)) return value;
  }
  return `RSR-${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}
function createSession(userId) {
  const raw = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)")
    .run(hashToken(raw), userId, new Date(Date.now()+SESSION_DAYS*86400000).toISOString(), nowIso());
  return raw;
}
function getSessionUser(req) {
  const auth = String(req.get("authorization") || "");
  const raw = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!raw) return null;
  const row = db.prepare(`
    SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>?
  `).get(hashToken(raw), nowIso());
  return row || null;
}
function requireCustomer(req,res,next) {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error:"Please log in again." });
  if (REQUIRE_EMAIL_VERIFICATION && !user.email_verified) return res.status(403).json({ error:"Verify your email first." });
  req.customer = user;
  next();
}
function requireAdmin(req,res,next) {
  if (req.get("x-admin-key") !== ADMIN_KEY) return res.status(401).json({ error:"Wrong admin key." });
  next();
}
function orderForCustomer(orderNumber, userId) {
  return db.prepare("SELECT * FROM orders WHERE order_number=? AND customer_id=?").get(orderNumber,userId);
}
function orderForPrivateToken(orderNumber, token) {
  const order = db.prepare("SELECT * FROM orders WHERE order_number=?").get(orderNumber);
  if (!order || order.private_token_hash !== hashToken(token)) return null;
  return order;
}
function serializeOrder(row, includePrivate=false) {
  const result = {
    orderNumber: row.order_number,
    status: row.status,
    method: row.method,
    taxOption: row.tax_option,
    amount: row.amount,
    receiveAmount: row.receive_amount,
    requiredPassPrice: row.required_pass_price,
    subtotal: row.subtotal,
    discount: row.discount,
    totalPayment: row.total_payment,
    promoCode: row.promo_code,
    paymentMethod: row.payment_method,
    robloxUserId: row.roblox_user_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    gameName: row.game_name,
    itemName: row.item_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reservedStock: row.reserved_stock,
    reservationExpiresAt: row.reservation_expires_at
  };
  if (includePrivate) {
    result.senderName = row.sender_name;
    result.referenceNumber = row.reference_number;
  }
  return result;
}
function releaseExpiredReservations() {
  const expired = db.prepare(`
    SELECT id,reserved_stock FROM orders
    WHERE reserved_stock>0 AND reservation_expires_at IS NOT NULL
      AND reservation_expires_at<=?
      AND status='Pending Payment Review'
  `).all(nowIso());
  if (!expired.length) return;
  const tx = db.transaction(() => {
    let stock = Number(setting("instant_stock"));
    for (const item of expired) {
      stock += item.reserved_stock;
      db.prepare("UPDATE orders SET reserved_stock=0,reservation_expires_at=NULL,status='Reservation Expired',updated_at=? WHERE id=?")
        .run(nowIso(), item.id);
      db.prepare("INSERT INTO order_history(order_id,status,created_at) VALUES (?,?,?)")
        .run(item.id,"Reservation Expired",nowIso());
      db.prepare("INSERT INTO messages(order_id,sender_type,text,customer_read,admin_read,created_at) VALUES (?,?,?,?,?,?)")
        .run(item.id,"system","Instant stock reservation expired. Contact support before paying.",0,0,nowIso());
    }
    updateSetting("instant_stock",stock);
  });
  tx();
}
setInterval(releaseExpiredReservations, 5*60*1000).unref();
releaseExpiredReservations();

let transporter = null;
if (EMAIL_ENABLED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE||"false").toLowerCase()==="true",
    auth: process.env.SMTP_USER ? { user:process.env.SMTP_USER, pass:process.env.SMTP_PASS } : undefined
  });
}
async function sendEmail(to,subject,html) {
  if (!EMAIL_ENABLED || !transporter) return false;
  await transporter.sendMail({ from:process.env.EMAIL_FROM || "Reck Shop <no-reply@example.com>",to,subject,html });
  return true;
}
function createEmailToken(userId,purpose,minutes=60) {
  const raw=crypto.randomBytes(32).toString("hex");
  db.prepare("DELETE FROM email_tokens WHERE user_id=? AND purpose=?").run(userId,purpose);
  db.prepare("INSERT INTO email_tokens(token_hash,user_id,purpose,expires_at,created_at) VALUES (?,?,?,?,?)")
    .run(hashToken(raw),userId,purpose,new Date(Date.now()+minutes*60000).toISOString(),nowIso());
  return raw;
}
async function discordOrder(order) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({embeds:[{
        title:"New RSR Shop Order",
        color:9442302,
        fields:[
          {name:"Order",value:order.order_number,inline:true},
          {name:"Roblox",value:`${order.display_name} (@${order.username})`,inline:true},
          {name:"Method",value:order.method,inline:true},
          {name:"Amount",value:`${order.amount.toLocaleString()} Robux`,inline:true},
          {name:"Payment",value:`₱${order.total_payment.toFixed(2)} via ${order.payment_method}`,inline:true}
        ],
        timestamp:nowIso()
      }]})
    });
  } catch(error) { console.error("Discord webhook:",error.message); }
}

app.get("/api/health",(_,res)=>{
  res.json({
    ok:true,
    version:"V6.1 Enhanced",
    database:"SQLite",
    databasePath:DB_PATH,
    storage:process.env.DATA_ROOT?"persistent disk":"local development",
    emailEnabled:EMAIL_ENABLED
  });
});

app.get("/api/settings",(_,res)=>res.json(settingsObject()));
app.get("/api/live",(req,res)=>res.json({now:nowIso(),settings:settingsObject()}));

app.post("/api/auth/register",authLimiter,async(req,res)=>{
  try {
    const fullName=String(req.body.fullName||"").trim().replace(/\s+/g," ").slice(0,80);
    const email=String(req.body.email||"").trim().toLowerCase();
    const password=String(req.body.password||"");
    if(fullName.length<2)return res.status(400).json({error:"Enter your full name."});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:"Enter a valid email."});
    if(password.length<8)return res.status(400).json({error:"Password must contain at least 8 characters."});
    if(db.prepare("SELECT 1 FROM users WHERE email=?").get(email))return res.status(409).json({error:"This email is already registered."});

    const user={id:crypto.randomUUID(),fullName,email,passwordHash:await bcrypt.hash(password,12),createdAt:nowIso()};
    db.prepare("INSERT INTO users(id,full_name,email,password_hash,email_verified,created_at) VALUES (?,?,?,?,?,?)")
      .run(user.id,user.fullName,user.email,user.passwordHash,EMAIL_ENABLED?0:1,user.createdAt);

    let verificationUrl=null;
    if(EMAIL_ENABLED){
      const raw=createEmailToken(user.id,"verify",24*60);
      verificationUrl=`${PUBLIC_BASE_URL}/verify.html?token=${encodeURIComponent(raw)}`;
      await sendEmail(email,"Verify your Reck Shop account",`<p>Hello ${user.fullName},</p><p><a href="${verificationUrl}">Verify your account</a></p>`);
    }
    const token=createSession(user.id);
    const row=db.prepare("SELECT * FROM users WHERE id=?").get(user.id);
    res.status(201).json({
      token,user:publicUser(row),
      verificationRequired:EMAIL_ENABLED,
      ...(ALLOW_DEV_EMAIL_LINKS&&verificationUrl?{verificationUrl}:{})
    });
  }catch(error){console.error(error);res.status(500).json({error:"Registration failed."});}
});

app.post("/api/auth/login",authLimiter,async(req,res)=>{
  const email=String(req.body.email||"").trim().toLowerCase();
  const password=String(req.body.password||"");
  const row=db.prepare("SELECT * FROM users WHERE email=?").get(email);
  if(!row||!(await bcrypt.compare(password,row.password_hash)))return res.status(401).json({error:"Incorrect email or password."});
  if(REQUIRE_EMAIL_VERIFICATION&&!row.email_verified)return res.status(403).json({error:"Verify your email before logging in."});
  res.json({token:createSession(row.id),user:publicUser(row)});
});

app.get("/api/auth/me",requireCustomer,(req,res)=>res.json({user:publicUser(req.customer)}));

app.post("/api/auth/logout",requireCustomer,(req,res)=>{
  const raw=String(req.get("authorization")||"").replace(/^Bearer\s+/i,"");
  db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hashToken(raw));
  res.json({ok:true});
});

app.post("/api/auth/forgot",authLimiter,async(req,res)=>{
  const email=String(req.body.email||"").trim().toLowerCase();
  const user=db.prepare("SELECT * FROM users WHERE email=?").get(email);
  let resetUrl=null;
  if(user){
    const raw=createEmailToken(user.id,"reset",60);
    resetUrl=`${PUBLIC_BASE_URL}/reset-password.html?token=${encodeURIComponent(raw)}`;
    if(EMAIL_ENABLED)await sendEmail(email,"Reset your Reck Shop password",`<p><a href="${resetUrl}">Reset your password</a></p>`);
  }
  res.json({ok:true,message:"If the account exists, reset instructions were created.",...(ALLOW_DEV_EMAIL_LINKS&&resetUrl?{resetUrl}:{})});
});

app.post("/api/auth/reset",authLimiter,async(req,res)=>{
  const token=String(req.body.token||"");
  const password=String(req.body.password||"");
  if(password.length<8)return res.status(400).json({error:"Password must contain at least 8 characters."});
  const row=db.prepare("SELECT * FROM email_tokens WHERE token_hash=? AND purpose='reset' AND expires_at>?").get(hashToken(token),nowIso());
  if(!row)return res.status(400).json({error:"Reset link is invalid or expired."});
  db.transaction(()=>{
    db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(bcrypt.hashSync(password,12),row.user_id);
    db.prepare("DELETE FROM sessions WHERE user_id=?").run(row.user_id);
    db.prepare("DELETE FROM email_tokens WHERE user_id=? AND purpose='reset'").run(row.user_id);
  })();
  res.json({ok:true});
});

app.post("/api/auth/verify",authLimiter,(req,res)=>{
  const token=String(req.body.token||"");
  const row=db.prepare("SELECT * FROM email_tokens WHERE token_hash=? AND purpose='verify' AND expires_at>?").get(hashToken(token),nowIso());
  if(!row)return res.status(400).json({error:"Verification link is invalid or expired."});
  db.transaction(()=>{
    db.prepare("UPDATE users SET email_verified=1 WHERE id=?").run(row.user_id);
    db.prepare("DELETE FROM email_tokens WHERE user_id=? AND purpose='verify'").run(row.user_id);
  })();
  res.json({ok:true});
});

app.get("/api/roblox/search",async(req,res)=>{
  const username=String(req.query.username||"").trim();
  if(username.length<3)return res.status(400).json({error:"Enter an exact Roblox username."});
  try{
    const userResponse=await fetch("https://users.roblox.com/v1/usernames/users",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({usernames:[username],excludeBannedUsers:true})
    });
    if(!userResponse.ok)throw new Error("Roblox username service is unavailable.");
    const user=(await userResponse.json()).data?.[0];
    if(!user)return res.status(404).json({error:"Roblox account not found."});
    const avatarResponse=await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`);
    const avatar=(await avatarResponse.json()).data?.[0]?.imageUrl||"";
    res.json({userId:user.id,username:user.name,displayName:user.displayName,avatarUrl:avatar});
  }catch(error){res.status(502).json({error:error.message||"Roblox lookup failed."});}
});

app.post("/api/promo/preview",requireCustomer,(req,res)=>{
  const code=String(req.body.code||"").trim().toUpperCase();
  const subtotal=Number(req.body.subtotal);
  if(!code)return res.json({valid:false,discount:0});
  const promo=db.prepare("SELECT * FROM promo_codes WHERE code=? AND active=1").get(code);
  if(!promo)return res.status(404).json({error:"Promo code not found."});
  if(promo.expires_at&&promo.expires_at<=nowIso())return res.status(400).json({error:"Promo code expired."});
  if(promo.max_uses!==null&&promo.uses>=promo.max_uses)return res.status(400).json({error:"Promo code usage limit reached."});
  if(subtotal<promo.minimum_payment)return res.status(400).json({error:`Minimum payment is ₱${promo.minimum_payment.toFixed(2)}.`});
  const discount=promo.discount_type==="percent"?subtotal*(promo.discount_value/100):promo.discount_value;
  res.json({valid:true,code:promo.code,discount:Math.min(subtotal,Math.max(0,discount))});
});

app.post("/api/orders",orderLimiter,requireCustomer,upload.single("receipt"),async(req,res)=>{
  try{
    releaseExpiredReservations();
    if(!req.file)return res.status(400).json({error:"Upload your payment receipt."});
    const body=req.body;
    const cfg=settingsObject();
    const methodKey=String(body.methodKey||"");
    if(!["ct","nct","instant","gifting"].includes(methodKey))throw new Error("Invalid order method.");
    const amount=Math.floor(Number(body.amount));
    if(!Number.isFinite(amount)||amount<=0)throw new Error("Enter a valid Robux amount.");
    if(methodKey==="instant"&&amount<10)throw new Error("Instant minimum is 10 Robux.");

    let receive=amount,pass=0;
    if(methodKey==="ct")pass=Math.ceil(amount/0.7);
    if(methodKey==="nct"){pass=amount;receive=Math.floor(amount*0.7);}
    const subtotal=(amount/1000)*cfg.rates[methodKey];

    let promo=null,discount=0;
    const promoCode=String(body.promoCode||"").trim().toUpperCase();
    if(promoCode){
      promo=db.prepare("SELECT * FROM promo_codes WHERE code=? AND active=1").get(promoCode);
      if(!promo||promo.expires_at&&promo.expires_at<=nowIso()||promo.max_uses!==null&&promo.uses>=promo.max_uses||subtotal<promo.minimum_payment){
        throw new Error("Promo code is invalid for this order.");
      }
      discount=promo.discount_type==="percent"?subtotal*(promo.discount_value/100):promo.discount_value;
      discount=Math.min(subtotal,Math.max(0,discount));
    }
    const total=Math.max(0,subtotal-discount);
    const paymentName=String(body.paymentMethod||"");
    if(cfg.paymentEnabled && cfg.paymentEnabled[paymentName]===false) throw new Error("This payment method is currently unavailable.");

    let reserved=0,reservationExpiresAt=null;
    if(methodKey==="instant"){
      const stock=Number(setting("instant_stock"));
      if(amount>stock)throw new Error(`Only ${stock.toLocaleString()} Instant Robux are available.`);
      reserved=amount;
      reservationExpiresAt=new Date(Date.now()+RESERVATION_MINUTES*60000).toISOString();
    }

    const id=crypto.randomUUID(),number=makeOrderNumber(),privateToken=crypto.randomBytes(24).toString("hex");
    const methodNames={ct:"Covered Tax",nct:"Not Covered Tax",instant:"Robux Instant",gifting:"In-Game Gifting"};
    const created=nowIso();

    const tx=db.transaction(()=>{
      if(reserved)updateSetting("instant_stock",Number(setting("instant_stock"))-reserved);
      db.prepare(`
        INSERT INTO orders(
          id,order_number,private_token_hash,customer_id,status,method,tax_option,amount,receive_amount,
          required_pass_price,subtotal,discount,total_payment,promo_code,payment_method,sender_name,
          reference_number,roblox_user_id,username,display_name,avatar_url,game_name,item_name,
          receipt_filename,reserved_stock,reservation_expires_at,created_at,updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        id,number,hashToken(privateToken),req.customer.id,"Pending Payment Review",methodNames[methodKey],
        methodKey==="ct"?"Covered Tax":methodKey==="nct"?"Not Covered Tax":"N/A",
        amount,receive,pass,subtotal,discount,total,promo?.code||null,String(body.paymentMethod||""),
        String(body.senderName||"").trim(),String(body.referenceNumber||"").trim(),
        String(body.robloxUserId||""),String(body.username||""),String(body.robloxDisplayName||body.username||""),
        String(body.robloxAvatarUrl||""),String(body.gameName||""),String(body.itemName||""),
        req.file.filename,reserved,reservationExpiresAt,created,created
      );
      db.prepare("INSERT INTO order_history(order_id,status,created_at) VALUES (?,?,?)").run(id,"Pending Payment Review",created);
      db.prepare("INSERT INTO messages(order_id,sender_type,text,customer_read,admin_read,created_at) VALUES (?,?,?,?,?,?)")
        .run(id,"system","Order submitted. Wait for admin payment review.",0,0,created);
      if(promo)db.prepare("UPDATE promo_codes SET uses=uses+1 WHERE id=?").run(promo.id);
    });
    tx();
    const order=db.prepare("SELECT * FROM orders WHERE id=?").get(id);
    await discordOrder(order);
    res.status(201).json({orderNumber:number,privateToken,statusUrl:`/status.html?order=${encodeURIComponent(number)}&token=${encodeURIComponent(privateToken)}`});
  }catch(error){
    if(req.file?.path&&fs.existsSync(req.file.path))fs.unlinkSync(req.file.path);
    console.error(error);
    res.status(400).json({error:error.message||"Order submission failed."});
  }
});

app.get("/api/customer/orders",requireCustomer,(req,res)=>{
  releaseExpiredReservations();
  const rows=db.prepare("SELECT * FROM orders WHERE customer_id=? ORDER BY created_at DESC").all(req.customer.id);
  res.json({orders:rows.map(row=>serializeOrder(row))});
});

app.get("/api/orders/:number",requireCustomer,(req,res)=>{
  const order=orderForCustomer(req.params.number,req.customer.id);
  if(!order)return res.status(404).json({error:"Order not found."});
  db.prepare("UPDATE messages SET customer_read=1 WHERE order_id=? AND sender_type='admin'").run(order.id);
  const history=db.prepare("SELECT status,created_at FROM order_history WHERE order_id=? ORDER BY id").all(order.id);
  const messages=db.prepare("SELECT id,sender_type AS sender,text,created_at FROM messages WHERE order_id=? ORDER BY id").all(order.id);
  res.json({...serializeOrder(order,true),history,messages});
});

app.get("/api/private/orders/:number",(req,res)=>{
  const order=orderForPrivateToken(req.params.number,String(req.query.token||""));
  if(!order)return res.status(404).json({error:"Wrong order number or private token."});
  const history=db.prepare("SELECT status,created_at FROM order_history WHERE order_id=? ORDER BY id").all(order.id);
  const messages=db.prepare("SELECT id,sender_type AS sender,text,created_at FROM messages WHERE order_id=? ORDER BY id").all(order.id);
  res.json({...serializeOrder(order,false),history,messages});
});

app.post("/api/orders/:number/messages",requireCustomer,(req,res)=>{
  const order=orderForCustomer(req.params.number,req.customer.id);
  if(!order)return res.status(404).json({error:"Order not found."});
  const text=String(req.body.text||"").trim().slice(0,1200);
  if(!text)return res.status(400).json({error:"Message is empty."});
  db.prepare("INSERT INTO messages(order_id,sender_type,sender_id,text,customer_read,admin_read,created_at) VALUES (?,?,?,?,?,?,?)")
    .run(order.id,"customer",req.customer.id,text,1,0,nowIso());
  res.json({ok:true});
});

app.get("/api/customer/unread",requireCustomer,(req,res)=>{
  const count=db.prepare(`
    SELECT COUNT(*) AS count FROM messages m JOIN orders o ON o.id=m.order_id
    WHERE o.customer_id=? AND m.sender_type='admin' AND m.customer_read=0
  `).get(req.customer.id).count;
  res.json({count});
});

app.get("/api/orders/:number/receipt",requireCustomer,(req,res)=>{
  const order=orderForCustomer(req.params.number,req.customer.id);
  if(!order)return res.status(404).json({error:"Order not found."});
  const file=path.join(UPLOADS_DIR,order.receipt_filename);
  if(!fs.existsSync(file))return res.status(404).json({error:"Receipt file is unavailable."});
  res.sendFile(file);
});

app.post("/api/orders/:number/review",requireCustomer,(req,res)=>{
  const order=orderForCustomer(req.params.number,req.customer.id);
  if(!order)return res.status(404).json({error:"Order not found."});
  if(order.status!=="Completed")return res.status(400).json({error:"Only completed orders can be reviewed."});
  const rating=Math.floor(Number(req.body.rating));
  const comment=String(req.body.comment||"").trim().slice(0,700);
  if(rating<1||rating>5||comment.length<3)return res.status(400).json({error:"Enter a rating and review."});
  db.prepare(`
    INSERT INTO reviews(id,order_id,customer_id,rating,comment,approved,created_at)
    VALUES (?,?,?,?,?,0,?)
    ON CONFLICT(order_id) DO UPDATE SET rating=excluded.rating,comment=excluded.comment,approved=0,created_at=excluded.created_at
  `).run(crypto.randomUUID(),order.id,req.customer.id,rating,comment,nowIso());
  res.json({ok:true});
});

app.get("/api/reviews",(_,res)=>{
  const rows=db.prepare(`
    SELECT r.rating,r.comment,r.created_at,u.full_name,o.method
    FROM reviews r JOIN users u ON u.id=r.customer_id JOIN orders o ON o.id=r.order_id
    WHERE r.approved=1 ORDER BY r.created_at DESC LIMIT 20
  `).all();
  res.json({reviews:rows});
});

app.get("/api/admin/orders",requireAdmin,(req,res)=>{
  releaseExpiredReservations();
  const status=String(req.query.status||"");
  const search=String(req.query.search||"").trim();
  let sql="SELECT * FROM orders WHERE 1=1",params=[];
  if(status){sql+=" AND status=?";params.push(status);}
  if(search){sql+=" AND (order_number LIKE ? OR username LIKE ? OR reference_number LIKE ?)";const q=`%${search}%`;params.push(q,q,q);}
  sql+=" ORDER BY created_at DESC LIMIT 500";
  res.json({orders:db.prepare(sql).all(...params).map(row=>serializeOrder(row,true)),settings:settingsObject()});
});

app.get("/api/admin/orders/:number",requireAdmin,(req,res)=>{
  const order=db.prepare("SELECT * FROM orders WHERE order_number=?").get(req.params.number);
  if(!order)return res.status(404).json({error:"Order not found."});
  db.prepare("UPDATE messages SET admin_read=1 WHERE order_id=? AND sender_type='customer'").run(order.id);
  const history=db.prepare("SELECT status,created_at FROM order_history WHERE order_id=? ORDER BY id").all(order.id);
  const messages=db.prepare("SELECT id,sender_type AS sender,text,created_at FROM messages WHERE order_id=? ORDER BY id").all(order.id);
  res.json({...serializeOrder(order,true),history,messages});
});

app.get("/api/admin/orders/:number/receipt",requireAdmin,(req,res)=>{
  const order=db.prepare("SELECT * FROM orders WHERE order_number=?").get(req.params.number);
  if(!order)return res.status(404).json({error:"Order not found."});
  const file=path.join(UPLOADS_DIR,order.receipt_filename);
  if(!fs.existsSync(file))return res.status(404).json({error:"Receipt file is unavailable."});
  res.sendFile(file);
});

app.post("/api/admin/orders/:number/messages",requireAdmin,(req,res)=>{
  const order=db.prepare("SELECT * FROM orders WHERE order_number=?").get(req.params.number);
  if(!order)return res.status(404).json({error:"Order not found."});
  const text=String(req.body.text||"").trim().slice(0,1200);
  if(!text)return res.status(400).json({error:"Message is empty."});
  db.prepare("INSERT INTO messages(order_id,sender_type,text,customer_read,admin_read,created_at) VALUES (?,?,?,?,?,?)")
    .run(order.id,"admin",text,0,1,nowIso());
  res.json({ok:true});
});

app.patch("/api/admin/orders/:number/status",requireAdmin,(req,res)=>{
  const allowed=["Pending Payment Review","Approved","Processing","Ready for Delivery","Completed","Declined"];
  const status=String(req.body.status||"");
  if(!allowed.includes(status))return res.status(400).json({error:"Invalid status."});
  const order=db.prepare("SELECT * FROM orders WHERE order_number=?").get(req.params.number);
  if(!order)return res.status(404).json({error:"Order not found."});
  db.transaction(()=>{
    if(status==="Declined"&&order.reserved_stock>0){
      updateSetting("instant_stock",Number(setting("instant_stock"))+order.reserved_stock);
      db.prepare("UPDATE orders SET reserved_stock=0,reservation_expires_at=NULL WHERE id=?").run(order.id);
    }
    if(["Approved","Processing","Ready for Delivery","Completed"].includes(status)&&order.reserved_stock>0){
      db.prepare("UPDATE orders SET reserved_stock=0,reservation_expires_at=NULL WHERE id=?").run(order.id);
    }
    db.prepare("UPDATE orders SET status=?,updated_at=? WHERE id=?").run(status,nowIso(),order.id);
    db.prepare("INSERT INTO order_history(order_id,status,created_at) VALUES (?,?,?)").run(order.id,status,nowIso());
    db.prepare("INSERT INTO messages(order_id,sender_type,text,customer_read,admin_read,created_at) VALUES (?,?,?,?,?,?)")
      .run(order.id,"system",`Order status changed to ${status}.`,0,0,nowIso());
  })();
  res.json({ok:true});
});

app.patch("/api/admin/settings",requireAdmin,(req,res)=>{
  const allowed=["instantStock","supportOnline","supportText","rateCt","rateNct","rateInstant","rateGifting","paypalEmail","wiseDetails","payoneerDetails","paymentGCashEnabled","paymentGoTymeEnabled","paymentPayPalEnabled","paymentWiseEnabled","paymentPayoneerEnabled","shopBannerEnabled","shopBannerText","maintenanceMode"];
  for(const key of allowed){
    if(req.body[key]===undefined)continue;
    const map={
      instantStock:"instant_stock",supportOnline:"support_online",supportText:"support_text",
      rateCt:"rate_ct",rateNct:"rate_nct",rateInstant:"rate_instant",rateGifting:"rate_gifting",
      paypalEmail:"paypal_email",wiseDetails:"wise_details",payoneerDetails:"payoneer_details",paymentGCashEnabled:"payment_gcash_enabled",paymentGoTymeEnabled:"payment_gotyme_enabled",paymentPayPalEnabled:"payment_paypal_enabled",paymentWiseEnabled:"payment_wise_enabled",paymentPayoneerEnabled:"payment_payoneer_enabled",shopBannerEnabled:"shop_banner_enabled",shopBannerText:"shop_banner_text",maintenanceMode:"maintenance_mode"
    };
    let value=req.body[key];
    if(["supportOnline","paymentGCashEnabled","paymentGoTymeEnabled","paymentPayPalEnabled","paymentWiseEnabled","paymentPayoneerEnabled","shopBannerEnabled","maintenanceMode"].includes(key))value=Boolean(value)?"true":"false";
    updateSetting(map[key],value);
  }
  res.json(settingsObject());
});

app.get("/api/admin/unread",requireAdmin,(req,res)=>{
  const count=db.prepare("SELECT COUNT(*) AS count FROM messages WHERE sender_type='customer' AND admin_read=0").get().count;
  res.json({count});
});

app.post("/api/admin/promos",requireAdmin,(req,res)=>{
  const code=String(req.body.code||"").trim().toUpperCase();
  const type=String(req.body.discountType||"");
  const value=Number(req.body.discountValue);
  if(!/^[A-Z0-9_-]{3,24}$/.test(code))return res.status(400).json({error:"Invalid promo code."});
  if(!["percent","fixed"].includes(type)||!Number.isFinite(value)||value<=0)return res.status(400).json({error:"Invalid discount."});
  try{
    db.prepare(`INSERT INTO promo_codes(id,code,discount_type,discount_value,minimum_payment,max_uses,uses,expires_at,active,created_at)
      VALUES (?,?,?,?,?,?,0,?,1,?)`)
      .run(crypto.randomUUID(),code,type,value,Number(req.body.minimumPayment)||0,req.body.maxUses?Number(req.body.maxUses):null,req.body.expiresAt||null,nowIso());
    res.json({ok:true});
  }catch{res.status(409).json({error:"Promo code already exists."});}
});

app.get("/api/admin/promos",requireAdmin,(_,res)=>res.json({promos:db.prepare("SELECT * FROM promo_codes ORDER BY created_at DESC").all()}));

app.patch("/api/admin/promos/:id",requireAdmin,(req,res)=>{
  db.prepare("UPDATE promo_codes SET active=? WHERE id=?").run(req.body.active?1:0,req.params.id);
  res.json({ok:true});
});

app.get("/api/admin/reviews",requireAdmin,(_,res)=>res.json({reviews:db.prepare(`
  SELECT r.*,u.full_name,o.order_number FROM reviews r JOIN users u ON u.id=r.customer_id JOIN orders o ON o.id=r.order_id ORDER BY r.created_at DESC
`).all()}));

app.patch("/api/admin/reviews/:id",requireAdmin,(req,res)=>{
  db.prepare("UPDATE reviews SET approved=? WHERE id=?").run(req.body.approved?1:0,req.params.id);
  res.json({ok:true});
});

app.get("/api/admin/analytics",requireAdmin,(req,res)=>{
  const totals=db.prepare(`
    SELECT COUNT(*) AS orders,
      COALESCE(SUM(CASE WHEN status='Completed' THEN total_payment ELSE 0 END),0) AS revenue,
      SUM(CASE WHEN status='Pending Payment Review' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) AS completed
    FROM orders
  `).get();
  const daily=db.prepare(`
    SELECT substr(created_at,1,10) AS day,COUNT(*) AS orders,
      COALESCE(SUM(CASE WHEN status='Completed' THEN total_payment ELSE 0 END),0) AS revenue
    FROM orders GROUP BY substr(created_at,1,10) ORDER BY day DESC LIMIT 30
  `).all();
  const methods=db.prepare("SELECT method,COUNT(*) AS orders FROM orders GROUP BY method ORDER BY orders DESC").all();
  res.json({totals,daily,methods});
});


app.get("/api/admin/audit",requireAdmin,(req,res)=>res.json({entries:db.prepare("SELECT * FROM admin_audit ORDER BY id DESC LIMIT 200").all()}));
app.post("/api/admin/backup",requireAdmin,async(req,res)=>{try{const filename=await createBackupNow();audit("manual_backup",filename);res.json({ok:true,filename});}catch{res.status(500).json({error:"Backup failed."});}});

app.get("*",(_,res)=>res.sendFile(path.join(PUBLIC_DIR,"index.html")));

app.use((error,_,res,__)=>{
  console.error(error);
  if(error instanceof multer.MulterError)return res.status(400).json({error:error.code==="LIMIT_FILE_SIZE"?"Receipt must be smaller than 5 MB.":error.message});
  res.status(500).json({error:error.message||"Server error."});
});

app.listen(PORT,()=>{
  console.log(`RSR Shop V6.1 Enhanced running on port ${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Uploads: ${UPLOADS_DIR}`);
});
