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

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const PRIVATE_DIR = path.join(ROOT, "private");
const ADMIN_PORTAL_FILE = path.join(PRIVATE_DIR, "admin-portal.html");
const normalizeAdminPath = value => {
  const cleaned=String(value||"reck-admin-portal").trim().replace(/^\/+|\/+$/g,"").replace(/[^a-zA-Z0-9_-]/g,"");
  return `/${cleaned || "reck-admin-portal"}`;
};
const ADMIN_PORTAL_PATH = normalizeAdminPath(process.env.ADMIN_PORTAL_PATH);
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");

function sendPublicFile(res, filename, cacheControl="no-cache") {
  const file = path.join(PUBLIC_DIR, filename);
  if (!fs.existsSync(file)) return res.status(404).type("text/plain").send("File not found.");
  res.set({
    "Cache-Control": cacheControl,
    "X-RSR-Version": "16.0.0",
    "X-Content-Type-Options": "nosniff"
  });
  res.type(path.extname(file)===".html" ? "html" : path.extname(file).slice(1));
  return res.sendFile(file);
}

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_BASE_URL = String(process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, "");
const ADMIN_KEY = process.env.ADMIN_KEY || "CHANGE_ME";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";
const EMAIL_ENABLED = String(process.env.EMAIL_ENABLED || "false").toLowerCase() === "true";
const ALLOW_DEV_EMAIL_LINKS = String(process.env.ALLOW_DEV_EMAIL_LINKS || "false").toLowerCase() === "true";
const REQUIRE_EMAIL_VERIFICATION = String(process.env.REQUIRE_EMAIL_VERIFICATION || "false").toLowerCase() === "true";
const SESSION_DAYS = Math.max(1, Number(process.env.SESSION_DAYS) || 30);
const RESERVATION_MINUTES = Math.max(5, Number(process.env.RESERVATION_MINUTES) || 60);
const SHORT_SESSION_HOURS = Math.max(1, Number(process.env.SHORT_SESSION_HOURS) || 12);
const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || "");
const GOOGLE_CLIENT_SECRET = String(process.env.GOOGLE_CLIENT_SECRET || "");
const FACEBOOK_APP_ID = String(process.env.FACEBOOK_APP_ID || "");
const FACEBOOK_APP_SECRET = String(process.env.FACEBOOK_APP_SECRET || "");
const OAUTH_ENABLED_GOOGLE = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
const OAUTH_ENABLED_FACEBOOK = Boolean(FACEBOOK_APP_ID && FACEBOOK_APP_SECRET);

const CONFIGURED_DATA_ROOT = String(process.env.DATA_ROOT || "").trim();
let PERSISTENT_ROOT = CONFIGURED_DATA_ROOT ? path.resolve(CONFIGURED_DATA_ROOT) : ROOT;
let STORAGE_MODE = CONFIGURED_DATA_ROOT ? "configured" : "local";

function ensureWritableRoot(candidate) {
  fs.mkdirSync(candidate, { recursive: true });
  const probe = path.join(candidate, `.rsr-write-test-${process.pid}`);
  fs.writeFileSync(probe, "ok");
  fs.unlinkSync(probe);
  return candidate;
}

try {
  ensureWritableRoot(PERSISTENT_ROOT);
} catch (error) {
  const fallback = path.join(ROOT, "runtime-data");
  console.warn(`[storage] DATA_ROOT ${PERSISTENT_ROOT} is not writable (${error.code || error.message}). Falling back to ${fallback}.`);
  PERSISTENT_ROOT = ensureWritableRoot(fallback);
  STORAGE_MODE = "ephemeral-fallback";
}

const DATA_DIR = path.join(PERSISTENT_ROOT, "data");
const UPLOADS_DIR = path.join(PERSISTENT_ROOT, "uploads");
for (const dir of [DATA_DIR, UPLOADS_DIR]) fs.mkdirSync(dir, { recursive: true });

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

CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  return_to TEXT NOT NULL,
  remember_me INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
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

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  order_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  category TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  admin_reply TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(customer_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS message_templates (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  updated_at TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS customer_preferences (
  user_id TEXT PRIMARY KEY,
  preferred_language TEXT,
  preferred_payment TEXT,
  preferred_method TEXT,
  saved_roblox_username TEXT,
  saved_roblox_user_id TEXT,
  timezone TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  starts_at TEXT,
  ends_at TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  order_id TEXT,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  priority TEXT NOT NULL DEFAULT 'Normal',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS support_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tickets_customer ON support_tickets(customer_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages ON support_messages(ticket_id, id);
CREATE INDEX IF NOT EXISTS idx_announcements_window ON announcements(enabled, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS translation_overrides (
  language TEXT NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(language, source_text)
);

CREATE TABLE IF NOT EXISTS site_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_key TEXT,
  event_type TEXT NOT NULL,
  path TEXT,
  language TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notes_order ON admin_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_site_events_type ON site_events(event_type, created_at);

`);




// V13.6: optional proof-image attachments in private order messages.
const v136MessageColumns = new Set(db.prepare("PRAGMA table_info(messages)").all().map(c=>c.name));
for (const [column,type] of [
  ["image_filename","TEXT"],
  ["image_mime","TEXT"],
  ["image_caption","TEXT"]
]) {
  if (!v136MessageColumns.has(column)) db.exec(`ALTER TABLE messages ADD COLUMN ${column} ${type}`);
}

// V11: optional social-login identity columns.
const v11UserColumns = new Set(db.prepare("PRAGMA table_info(users)").all().map(c=>c.name));
for (const [column,type] of [
  ["google_id","TEXT"],
  ["facebook_id","TEXT"],
  ["auth_provider","TEXT NOT NULL DEFAULT 'password'"],
  ["last_login_at","TEXT"]
]) {
  if (!v11UserColumns.has(column)) db.exec(`ALTER TABLE users ADD COLUMN ${column} ${type}`);
}
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL");
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_facebook_id ON users(facebook_id) WHERE facebook_id IS NOT NULL");
db.exec("CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry ON oauth_states(expires_at)");

// V10: operational review and fraud-protection fields.
const v10OrderColumns = new Set(db.prepare("PRAGMA table_info(orders)").all().map(c=>c.name));
for (const [column,type] of [
  ["receipt_hash","TEXT"],["risk_flags","TEXT"],["admin_verified_amount","REAL"],
  ["admin_verified_reference","TEXT"],["receipt_review_status","TEXT"],
  ["delivery_started_at","TEXT"],["completed_at","TEXT"]
]) {
  if (!v10OrderColumns.has(column)) db.exec(`ALTER TABLE orders ADD COLUMN ${column} ${type}`);
}
const defaultTemplates = {
  payment_approved: ["Payment approved", "Your payment has been verified. Your order is now being processed."],
  processing: ["Order processing", "Delivery processing has started. We will update you again when it is ready."],
  ready: ["Ready for delivery", "Your order is ready for the final delivery step. Please check your private order chat."],
  completed: ["Order completed", "Your order has been completed. Please check your Roblox account or Pending Robux."],
  declined: ["Order needs correction", "Your order was declined. Open the private order page to view the reason or contact support."],
  receipt_needed: ["Better receipt required", "Please upload or send a clearer payment receipt showing the amount and reference number."],
  gamepass_needed: ["Correct Game Pass required", "Your Game Pass link or price needs correction. Update it to the exact required price before delivery."]
};
for (const [key,[title,message]] of Object.entries(defaultTemplates)) {
  db.prepare("INSERT OR IGNORE INTO message_templates(key,title,message,updated_at) VALUES (?,?,?,?)")
    .run(key,title,message,nowIso());
}

// V7.3: keep buyer Game Pass details on every CT/NCT order.
const existingOrderColumns = new Set(db.prepare("PRAGMA table_info(orders)").all().map(c=>c.name));
for (const [column,type] of [["gamepass_id","TEXT"],["gamepass_url","TEXT"],["gamepass_name","TEXT"],["gamepass_price","INTEGER"],["gamepass_verified_at","TEXT"]]) {
  if (!existingOrderColumns.has(column)) db.exec(`ALTER TABLE orders ADD COLUMN ${column} ${type}`);
}

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
  maintenance_mode: "false",
  business_name: "Reck Shop",
  business_owner_display: "",
  business_email: "reckshopemergencycontact@gmail.com",
  business_phone: "09121656529",
  business_address: "Philippines",
  support_hours: "Daily, 9:00 AM–10:00 PM Philippine Time",
  facebook_url: "https://www.facebook.com/profile.php?id=61592736479803",
  discord_url: "",
  trust_notice: "Reck Shop never asks for your Roblox password, verification code, or cookie.",
  public_stats_enabled: "true",
  public_completed_count: "true",
  public_review_count: "true",
  public_average_rating: "true",
  tutorial_title: "How to Create a Roblox Game Pass",
  tutorial_video_url: "https://www.youtube.com/shorts/1i6fGhZ5GL0",
  tutorial_video_enabled: "true",
  language_default: "en",
  language_auto_detect: "true",
  eta_ct: "10–30 minutes",
  eta_nct: "10–30 minutes",
  eta_instant: "5–15 minutes",
  eta_gifting: "15–60 minutes",
  pending_notice: "Roblox may hold Game Pass proceeds in Pending Robux before release.",
  low_stock_threshold: "5000",
  orders_enabled: "true",
  method_ct_enabled: "true",
  method_nct_enabled: "true",
  method_instant_enabled: "true",
  method_gifting_enabled: "true",
  overdue_review_minutes: "30",
  overdue_processing_minutes: "120",
  security_notice: "All orders are manually reviewed. Suspicious or duplicate receipts are flagged for review."
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

// V11.2.1: browser-safe homepage and diagnostics.
app.get("/browser-test", (_,res) => {
  res.set({
    "Cache-Control":"no-store",
    "Content-Type":"text/html; charset=utf-8",
    "Cross-Origin-Resource-Policy":"same-origin"
  });
  res.status(200).send("<!doctype html><html><body style='font-family:system-ui;background:#111827;color:white;padding:30px'><h1>Reck Shop browser test works</h1><p>If you can see this, Chrome can reach the Render service.</p><a style='color:#c4b5fd' href='/index.html?v=16.0.0'>Open shop</a></body></html>");
});

// V11.2: serve the homepage explicitly and bypass stale PWA navigation caches.
app.get("/", (req,res) => sendPublicFile(res, "index.html", "no-store, no-cache, must-revalidate"));
app.get("/index.html", (req,res) => sendPublicFile(res, "index.html", "no-store, no-cache, must-revalidate"));
app.get("/reset-cache", (req,res) => sendPublicFile(res, "reset-cache.html", "no-store"));
app.get("/reset-cache.html", (req,res) => sendPublicFile(res, "reset-cache.html", "no-store"));
app.get("/api/ping", (_,res) => res.status(200).type("text/plain").send("pong"));
app.use((req,res,next)=>{
  const started=Date.now();
  res.on("finish",()=>{
    if(req.path==="/" || req.path==="/index.html" || req.path.startsWith("/api/health")){
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now()-started}ms)`);
    }
  });
  next();
});


// V14.1 hidden admin portal. The page is not inside /public and has no customer-facing link.
app.get("/admin.html",(_,res)=>res.status(404).type("text/plain").send("Page not found."));
app.get("/admin",(_,res)=>res.status(404).type("text/plain").send("Page not found."));
app.get(ADMIN_PORTAL_PATH,(req,res)=>{
  if(!fs.existsSync(ADMIN_PORTAL_FILE))return res.status(500).type("text/plain").send("Admin portal file is missing.");
  res.set({
    "Cache-Control":"no-store, no-cache, must-revalidate",
    "X-Robots-Tag":"noindex, nofollow, noarchive",
    "X-Content-Type-Options":"nosniff"
  });
  res.sendFile(ADMIN_PORTAL_FILE);
});

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
const proofUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (["image/png", "image/jpeg"].includes(file.mimetype)) return cb(null, true);
    cb(new Error("Proof image must be PNG or JPG."));
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
    maintenanceMode: setting("maintenance_mode") === "true",
    business: {
      name: setting("business_name"),
      ownerDisplay: setting("business_owner_display"),
      email: setting("business_email"),
      phone: setting("business_phone"),
      address: setting("business_address"),
      supportHours: setting("support_hours"),
      facebookUrl: setting("facebook_url"),
      discordUrl: setting("discord_url"),
      trustNotice: setting("trust_notice")
    },
    publicStats: {
      enabled: setting("public_stats_enabled") === "true",
      showCompleted: setting("public_completed_count") === "true",
      showReviewCount: setting("public_review_count") === "true",
      showAverageRating: setting("public_average_rating") === "true"
    },
    tutorial: {
      title: setting("tutorial_title"),
      videoUrl: setting("tutorial_video_url"),
      enabled: setting("tutorial_video_enabled") === "true"
    },
    language: {
      default: setting("language_default") || "en",
      autoDetect: setting("language_auto_detect") !== "false"
    },
    delivery: {
      ct: setting("eta_ct") || "10–30 minutes",
      nct: setting("eta_nct") || "10–30 minutes",
      instant: setting("eta_instant") || "5–15 minutes",
      gifting: setting("eta_gifting") || "15–60 minutes",
      pendingNotice: setting("pending_notice") || "Roblox may hold Game Pass proceeds in Pending Robux before release."
    },
    stock: {
      lowThreshold: Number(setting("low_stock_threshold") || 5000)
    },
    announcement: (() => {
      try {
        const row=db.prepare(`SELECT id,title,message,level FROM announcements
          WHERE enabled=1
          AND (starts_at IS NULL OR datetime(starts_at)<=datetime('now'))
          AND (ends_at IS NULL OR datetime(ends_at)>=datetime('now'))
          ORDER BY created_at DESC LIMIT 1`).get();
        return row || null;
      } catch { return null; }
    })(),
    operations: {
      ordersEnabled: setting("orders_enabled") !== "false",
      methods: {
        ct: setting("method_ct_enabled") !== "false",
        nct: setting("method_nct_enabled") !== "false",
        instant: setting("method_instant_enabled") !== "false",
        gifting: setting("method_gifting_enabled") !== "false"
      },
      overdueReviewMinutes: Number(setting("overdue_review_minutes") || 30),
      overdueProcessingMinutes: Number(setting("overdue_processing_minutes") || 120),
      securityNotice: setting("security_notice")
    }
  };
}
function updateSetting(key, value) {
  db.prepare("INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, String(value));
}

function audit(action, details="") { try { db.prepare("INSERT INTO admin_audit(action,details,created_at) VALUES (?,?,?)").run(String(action).slice(0,120),String(details).slice(0,1500),nowIso()); } catch {} }

function notifyUser(userId, orderId, type, title, message) {
  try { db.prepare("INSERT INTO notifications(user_id,order_id,type,title,message,created_at) VALUES (?,?,?,?,?,?)")
    .run(userId || null, orderId || null, String(type).slice(0,40), String(title).slice(0,120), String(message).slice(0,1200), nowIso()); } catch {}
}
function templateFor(key) { return db.prepare("SELECT * FROM message_templates WHERE key=?").get(key) || null; }
function receiptHash(filePath) { return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"); }


function orderMessages(orderId){
  return db.prepare(`SELECT id,sender_type AS sender,text,image_filename,image_mime,image_caption,created_at
    FROM messages WHERE order_id=? ORDER BY id`).all(orderId).map(row=>({
      id:row.id,
      sender:row.sender,
      text:row.text,
      imageUrl:row.image_filename?`/api/order-message-images/${row.id}`:null,
      imageCaption:row.image_caption||"",
      created_at:row.created_at
    }));
}
function ticketForCustomer(id,customerId){
  return db.prepare("SELECT * FROM support_tickets WHERE id=? AND customer_id=?").get(id,customerId);
}
function ticketPublic(row){
  if(!row)return null;
  return {
    id:row.id,orderId:row.order_id,category:row.category,subject:row.subject,
    status:row.status,priority:row.priority,createdAt:row.created_at,updatedAt:row.updated_at
  };
}
function appendRiskFlag(existing, flag) {
  const flags = new Set(String(existing || "").split(",").map(x=>x.trim()).filter(Boolean));
  flags.add(flag); return [...flags].join(",");
}

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
function createSession(userId, rememberMe=true) {
  const raw = crypto.randomBytes(32).toString("hex");
  const durationMs = rememberMe ? SESSION_DAYS*86400000 : SHORT_SESSION_HOURS*3600000;
  db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)")
    .run(hashToken(raw), userId, new Date(Date.now()+durationMs).toISOString(), nowIso());
  db.prepare("UPDATE users SET last_login_at=? WHERE id=?").run(nowIso(), userId);
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
    gamePassId: row.gamepass_id,
    gamePassUrl: row.gamepass_url,
    gamePassName: row.gamepass_name,
    gamePassPrice: row.gamepass_price,
    gamePassVerifiedAt: row.gamepass_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reservedStock: row.reserved_stock,
    reservationExpiresAt: row.reservation_expires_at,
    riskFlags: String(row.risk_flags || "").split(",").filter(Boolean),
    receiptReviewStatus: row.receipt_review_status || "Not reviewed",
    adminVerifiedAmount: row.admin_verified_amount,
    adminVerifiedReference: row.admin_verified_reference,
    deliveryStartedAt: row.delivery_started_at,
    completedAt: row.completed_at
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

function safeReturnTo(value) {
  const raw=String(value||"/dashboard.html");
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard.html";
  return raw.slice(0,300);
}
function createOauthState(provider, returnTo, rememberMe) {
  const raw=crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO oauth_states(state_hash,provider,return_to,remember_me,expires_at,created_at) VALUES (?,?,?,?,?,?)")
    .run(hashToken(raw),provider,safeReturnTo(returnTo),rememberMe?1:0,new Date(Date.now()+10*60000).toISOString(),nowIso());
  return raw;
}
function consumeOauthState(raw, provider) {
  const row=db.prepare("SELECT * FROM oauth_states WHERE state_hash=? AND provider=? AND expires_at>?").get(hashToken(String(raw||"")),provider,nowIso());
  if (!row) return null;
  db.prepare("DELETE FROM oauth_states WHERE state_hash=?").run(hashToken(String(raw||"")));
  return row;
}
function oauthResultPage({ok,token="",returnTo="/dashboard.html",error=""}) {
  const payload=JSON.stringify({type:"rsr-oauth-result",ok,token,returnTo,error}).replace(/</g,"\\u003c");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reck Shop Login</title><style>body{font-family:system-ui;background:#080f1e;color:white;display:grid;place-items:center;min-height:100vh;margin:0}.card{max-width:430px;padding:28px;border:1px solid #334155;border-radius:20px;background:#0f172a;text-align:center}a{color:#c4b5fd}</style></head><body><div class="card"><h1>${ok?"Login successful":"Login failed"}</h1><p>${ok?"Returning to Reck Shop…":String(error||"Authentication failed.")}</p><a href="/auth.html">Return to login</a></div><script>const result=${payload};try{if(window.opener&&!window.opener.closed){window.opener.postMessage(result,location.origin);setTimeout(()=>window.close(),500)}else if(result.ok){localStorage.setItem("rsrSession",result.token);location.replace(result.returnTo)}else{location.replace("/auth.html?oauthError="+encodeURIComponent(result.error))}}catch{location.replace("/auth.html")}</script></body></html>`;
}
async function findOrCreateOauthUser(provider, profile) {
  const providerColumn=provider==="google"?"google_id":"facebook_id";
  let user=db.prepare(`SELECT * FROM users WHERE ${providerColumn}=?`).get(profile.id);
  if (user) return user;
  user=db.prepare("SELECT * FROM users WHERE email=?").get(profile.email);
  if (user) {
    db.prepare(`UPDATE users SET ${providerColumn}=?,email_verified=1,auth_provider=? WHERE id=?`).run(profile.id,provider,user.id);
    return db.prepare("SELECT * FROM users WHERE id=?").get(user.id);
  }
  const id=crypto.randomUUID();
  const randomPassword=await bcrypt.hash(crypto.randomBytes(32).toString("hex"),12);
  db.prepare(`INSERT INTO users(id,full_name,email,password_hash,email_verified,created_at,${providerColumn},auth_provider,last_login_at)
    VALUES (?,?,?,?,1,?,?,?,?)`).run(id,profile.name||"Reck Shop Customer",profile.email,randomPassword,nowIso(),profile.id,provider,nowIso());
  return db.prepare("SELECT * FROM users WHERE id=?").get(id);
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


function normalizeGamePassId(input) {
  const value = String(input || "").trim();
  if (/^\d+$/.test(value)) return value;
  const patterns = [
    /\/game-pass\/(\d+)/i,
    /\/game-pass(?:es)?\/(\d+)/i,
    /[?&]id=(\d+)/i
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function requiredGamePassPrice(methodKey, customerAmount) {
  const amount = Math.floor(Number(customerAmount));
  if (!Number.isFinite(amount) || amount < 1) return null;

  // CT: buyer pays enough so the receiver gets the full desired amount after Roblox's 30% fee.
  if (methodKey === "ct") return Math.ceil(amount / 0.7);

  // NCT: buyer purchases a pass equal to the selected Robux amount; receiver gets the post-fee amount.
  if (methodKey === "nct") return amount;

  return null;
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}
    return { response, data };
  } finally {
    clearTimeout(timer);
  }
}

async function verifyRobloxGamePass(gamePassInput, expectedPrice) {
  const gamePassId = normalizeGamePassId(gamePassInput);
  if (!gamePassId) {
    return { ok: false, error: "Enter a valid Roblox Game Pass link or numeric Game Pass ID." };
  }

  let productInfo = null;
  let lastError = "";

  const urls = [
    `https://apis.roblox.com/game-passes/v1/game-passes/${gamePassId}/product-info`,
    `https://apis.roblox.com/game-passes/v1/game-passes/${gamePassId}/details`,
    `https://api.roblox.com/marketplace/game-pass-product-info?gamePassId=${gamePassId}`
  ];

  for (const url of urls) {
    try {
      const { response, data } = await fetchJsonWithTimeout(url);
      if (response.ok && data && Object.keys(data).length) {
        productInfo = data;
        break;
      }
      lastError = data?.message || data?.errors?.[0]?.message || `Roblox returned ${response.status}.`;
    } catch (error) {
      lastError = error.name === "AbortError" ? "Roblox verification timed out." : error.message;
    }
  }

  if (!productInfo) {
    return { ok: false, error: lastError || "Unable to verify this Game Pass with Roblox right now." };
  }

  const actualPrice = Number(
    productInfo.priceInformation?.defaultPriceInRobux ??
    productInfo.priceInformation?.priceInRobux ??
    productInfo.price ??
    productInfo.PriceInRobux ??
    productInfo.priceInRobux ??
    productInfo.product?.priceInRobux
  );

  const isForSale = productInfo.priceInformation !== null &&
    (productInfo.isForSale ?? productInfo.IsForSale ?? productInfo.product?.isForSale ?? true);
  const name = productInfo.name ?? productInfo.Name ?? productInfo.product?.name ?? `Game Pass ${gamePassId}`;
  const creatorName =
    productInfo.creator?.name ??
    productInfo.Creator?.Name ??
    productInfo.creatorName ??
    "";

  if (!Number.isFinite(actualPrice)) {
    return { ok: false, error: "Roblox did not return a valid price for this Game Pass." };
  }
  if (!isForSale) {
    return { ok: false, error: "This Game Pass is not currently for sale." };
  }
  if (Number(actualPrice) !== Number(expectedPrice)) {
    return {
      ok: false,
      error: `Game Pass price mismatch. Required: ${Number(expectedPrice).toLocaleString()} Robux. Current Game Pass price: ${actualPrice.toLocaleString()} Robux.`,
      gamePass: { id: gamePassId, name, creatorName, actualPrice, expectedPrice }
    };
  }

  return {
    ok: true,
    gamePass: {
      id: gamePassId,
      url: `https://www.roblox.com/game-pass/${gamePassId}`,
      name,
      creatorName,
      actualPrice,
      expectedPrice
    }
  };
}

app.get("/api/health",async(_,res)=>{
  let databaseOk=true,emailOk=!EMAIL_ENABLED,emailMessage=EMAIL_ENABLED?"Checking SMTP configuration.":"Email is not configured.";
  try { db.prepare("SELECT 1 AS ok").get(); } catch { databaseOk=false; }
  if (EMAIL_ENABLED && transporter) {
    try { await transporter.verify(); emailOk=true; emailMessage="Email service is connected."; }
    catch(error) { emailOk=false; emailMessage="Email service is configured but unavailable."; }
  }
  const ok=databaseOk;
  res.status(ok?200:503).json({
    ok,
    version:"V13.7 Realtime Proof & Chat Edition",
    server:"online",
    database:databaseOk?"online":"unavailable",
    email:{enabled:EMAIL_ENABLED,online:emailOk,message:emailMessage},
    oauth:{google:OAUTH_ENABLED_GOOGLE,facebook:OAUTH_ENABLED_FACEBOOK},
    adminPortal:{configured:Boolean(process.env.ADMIN_PORTAL_PATH)},
    storage:STORAGE_MODE,
    now:nowIso()
  });
});

app.get("/api/settings",(_,res)=>res.json(settingsObject()));

app.get("/api/auth/config",(_,res)=>res.json({
  emailEnabled:EMAIL_ENABLED,
  requireEmailVerification:REQUIRE_EMAIL_VERIFICATION,
  allowDevEmailLinks:ALLOW_DEV_EMAIL_LINKS,
  oauth:{google:OAUTH_ENABLED_GOOGLE,facebook:OAUTH_ENABLED_FACEBOOK},
    adminPortal:{configured:Boolean(process.env.ADMIN_PORTAL_PATH)},
  sessionDays:SESSION_DAYS,
  shortSessionHours:SHORT_SESSION_HOURS
}));


app.post("/api/gamepass/verify", express.json(), async (req, res) => {
  try {
    const methodKey = String(req.body?.methodKey || "").toLowerCase();
    const amount = Math.floor(Number(req.body?.amount));
    const username = String(req.body?.username || "").trim();
    const gamePassLink = String(req.body?.gamePassLink || "").trim();

    if (!["ct", "nct"].includes(methodKey)) {
      return res.status(400).json({ error: "Game Pass verification is only required for Covered Tax and Not Covered Tax." });
    }
    if (!username || username.length < 3 || username.length > 20 || !/^[A-Za-z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: "Enter a valid Roblox username." });
    }

    const expectedPrice = requiredGamePassPrice(methodKey, amount);
    if (!expectedPrice) {
      return res.status(400).json({ error: "Enter a valid desired Robux amount." });
    }

    const result = await verifyRobloxGamePass(gamePassLink, expectedPrice);
    if (!result.ok) return res.status(400).json(result);

    res.json({
      ok: true,
      username,
      methodKey,
      customerAmount: amount,
      expectedPrice,
      gamePass: result.gamePass,
      note: "The verified price must remain unchanged until the order is submitted."
    });
  } catch (error) {
    console.error("Game Pass verification error:", error);
    res.status(500).json({ error: "Unable to verify the Game Pass right now." });
  }
});


app.get("/api/trust", (_, res) => {
  const cfg = settingsObject();
  const completed = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status='Completed'").get().count;
  const customers = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  const reviewStats = db.prepare("SELECT COUNT(*) AS count, COALESCE(AVG(rating),0) AS average FROM reviews WHERE approved=1").get();
  const latestCompleted = db.prepare(`
    SELECT order_number, method, amount, updated_at
    FROM orders
    WHERE status='Completed'
    ORDER BY updated_at DESC
    LIMIT 8
  `).all().map(row => ({
    orderNumber: row.order_number.replace(/(.{4}).+(.{3})$/, "$1••••$2"),
    method: row.method,
    amount: row.amount,
    completedAt: row.updated_at
  }));

  res.json({
    business: cfg.business,
    publicStats: cfg.publicStats,
    metrics: cfg.publicStats.enabled ? {
      completedOrders: cfg.publicStats.showCompleted ? completed : null,
      registeredCustomers: customers,
      publishedReviews: cfg.publicStats.showReviewCount ? reviewStats.count : null,
      averageRating: cfg.publicStats.showAverageRating ? Number(reviewStats.average.toFixed(2)) : null
    } : null,
    latestCompleted,
    safeguards: [
      "Passwords are hashed and never stored as plain text.",
      "Receipts are private to the customer and administrator.",
      "Every order has a timeline and support chat.",
      "Verified-purchase reviews require a completed order.",
      "Reck Shop never asks for a Roblox password, verification code, or authentication cookie."
    ],
    affiliationNotice: "Reck Shop is an independent shop and is not affiliated with Roblox Corporation."
  });
});

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
    const row=db.prepare("SELECT * FROM users WHERE id=?").get(user.id);
    const verificationRequired=Boolean(EMAIL_ENABLED && REQUIRE_EMAIL_VERIFICATION);
    const token=verificationRequired?null:createSession(user.id,true);
    res.status(201).json({
      token,user:publicUser(row),verificationRequired,
      message:verificationRequired?"Check your email and verify your account before logging in.":"Account created successfully.",
      ...(ALLOW_DEV_EMAIL_LINKS&&verificationUrl?{verificationUrl}:{})
    });
  }catch(error){console.error(error);res.status(500).json({error:"Registration failed."});}
});

app.post("/api/auth/login",authLimiter,async(req,res)=>{
  const email=String(req.body.email||"").trim().toLowerCase();
  const password=String(req.body.password||"");
  const rememberMe=req.body.rememberMe!==false;
  const row=db.prepare("SELECT * FROM users WHERE email=?").get(email);
  if(!row||!(await bcrypt.compare(password,row.password_hash)))return res.status(401).json({error:"Incorrect email or password."});
  if(REQUIRE_EMAIL_VERIFICATION&&!row.email_verified)return res.status(403).json({error:"Verify your email before logging in.","code":"EMAIL_NOT_VERIFIED"});
  res.json({token:createSession(row.id,rememberMe),user:publicUser(row),rememberMe});
});

app.get("/api/auth/me",requireCustomer,(req,res)=>res.json({user:publicUser(req.customer)}));

app.post("/api/auth/logout",requireCustomer,(req,res)=>{
  const raw=String(req.get("authorization")||"").replace(/^Bearer\s+/i,"");
  db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hashToken(raw));
  res.json({ok:true});
});


app.post("/api/auth/resend-verification",authLimiter,async(req,res)=>{
  const email=String(req.body.email||"").trim().toLowerCase();
  const user=db.prepare("SELECT * FROM users WHERE email=?").get(email);
  let verificationUrl=null;
  if(user && !user.email_verified && EMAIL_ENABLED){
    const raw=createEmailToken(user.id,"verify",24*60);
    verificationUrl=`${PUBLIC_BASE_URL}/verify.html?token=${encodeURIComponent(raw)}`;
    try {
      await sendEmail(email,"Verify your Reck Shop account",`<h2>Verify your Reck Shop account</h2><p>Hello ${user.full_name},</p><p><a href="${verificationUrl}">Verify my email</a></p><p>This link expires in 24 hours.</p>`);
    } catch(error) {
      console.error("Verification email:",error.message);
      return res.status(503).json({error:"The email service is temporarily unavailable. Please try again shortly."});
    }
  }
  res.json({ok:true,message:"If the account needs verification, a new email has been sent.",...(ALLOW_DEV_EMAIL_LINKS&&verificationUrl?{verificationUrl}:{})});
});

app.post("/api/auth/forgot",authLimiter,async(req,res)=>{
  const email=String(req.body.email||"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:"Enter a valid email address."});
  const user=db.prepare("SELECT * FROM users WHERE email=?").get(email);
  let resetUrl=null;
  if(user){
    const raw=createEmailToken(user.id,"reset",60);
    resetUrl=`${PUBLIC_BASE_URL}/reset-password.html?token=${encodeURIComponent(raw)}`;
    if(EMAIL_ENABLED){
      try {
        await sendEmail(email,"Reset your Reck Shop password",`<h2>Reset your password</h2><p>Hello ${user.full_name},</p><p><a href="${resetUrl}">Reset my password</a></p><p>This link expires in 60 minutes. Ignore this email if you did not request it.</p>`);
      } catch(error) {
        console.error("Password reset email:",error.message);
        return res.status(503).json({error:"The password-reset email service is temporarily unavailable. Please try again shortly."});
      }
    }
  }
  const deliveryMessage=EMAIL_ENABLED
    ?"If an account exists for that email, reset instructions have been sent."
    :"Email delivery is not configured yet. Contact shop support for account recovery.";
  res.json({ok:true,message:deliveryMessage,emailEnabled:EMAIL_ENABLED,...(ALLOW_DEV_EMAIL_LINKS&&resetUrl?{resetUrl}:{})});
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


app.get("/api/auth/google/start",(req,res)=>{
  if(!OAUTH_ENABLED_GOOGLE)return res.redirect("/auth.html?oauthError="+encodeURIComponent("Google login is not configured yet."));
  const rememberMe=String(req.query.rememberMe||"true")!=="false";
  const state=createOauthState("google",req.query.returnTo||"/dashboard.html",rememberMe);
  const params=new URLSearchParams({
    client_id:GOOGLE_CLIENT_ID,
    redirect_uri:`${PUBLIC_BASE_URL}/api/auth/google/callback`,
    response_type:"code",scope:"openid email profile",state,
    access_type:"online",prompt:"select_account"
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});
app.get("/api/auth/google/callback",async(req,res)=>{
  try{
    const state=consumeOauthState(req.query.state,"google");
    if(!state)throw new Error("Google login session expired. Please try again.");
    if(req.query.error)throw new Error("Google login was cancelled.");
    const tokenResponse=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({
      code:String(req.query.code||""),client_id:GOOGLE_CLIENT_ID,client_secret:GOOGLE_CLIENT_SECRET,
      redirect_uri:`${PUBLIC_BASE_URL}/api/auth/google/callback`,grant_type:"authorization_code"
    })});
    const tokens=await tokenResponse.json();
    if(!tokenResponse.ok||!tokens.access_token)throw new Error("Google could not complete the login.");
    const profileResponse=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{headers:{Authorization:`Bearer ${tokens.access_token}`}});
    const profile=await profileResponse.json();
    if(!profileResponse.ok||!profile.email||!profile.sub)throw new Error("Google did not provide a verified email address.");
    const user=await findOrCreateOauthUser("google",{id:String(profile.sub),email:String(profile.email).toLowerCase(),name:profile.name||profile.email});
    const token=createSession(user.id,Boolean(state.remember_me));
    res.type("html").send(oauthResultPage({ok:true,token,returnTo:state.return_to}));
  }catch(error){res.type("html").status(400).send(oauthResultPage({ok:false,error:error.message}));}
});
app.get("/api/auth/facebook/start",(req,res)=>{
  if(!OAUTH_ENABLED_FACEBOOK)return res.redirect("/auth.html?oauthError="+encodeURIComponent("Facebook login is not configured yet."));
  const rememberMe=String(req.query.rememberMe||"true")!=="false";
  const state=createOauthState("facebook",req.query.returnTo||"/dashboard.html",rememberMe);
  const params=new URLSearchParams({
    client_id:FACEBOOK_APP_ID,
    redirect_uri:`${PUBLIC_BASE_URL}/api/auth/facebook/callback`,
    response_type:"code",scope:"email,public_profile",state
  });
  res.redirect(`https://www.facebook.com/v22.0/dialog/oauth?${params}`);
});
app.get("/api/auth/facebook/callback",async(req,res)=>{
  try{
    const state=consumeOauthState(req.query.state,"facebook");
    if(!state)throw new Error("Facebook login session expired. Please try again.");
    if(req.query.error)throw new Error("Facebook login was cancelled.");
    const tokenUrl=new URL("https://graph.facebook.com/v22.0/oauth/access_token");
    tokenUrl.search=new URLSearchParams({
      client_id:FACEBOOK_APP_ID,client_secret:FACEBOOK_APP_SECRET,
      redirect_uri:`${PUBLIC_BASE_URL}/api/auth/facebook/callback`,code:String(req.query.code||"")
    });
    const tokenResponse=await fetch(tokenUrl);const tokens=await tokenResponse.json();
    if(!tokenResponse.ok||!tokens.access_token)throw new Error("Facebook could not complete the login.");
    const profileUrl=new URL("https://graph.facebook.com/me");
    profileUrl.search=new URLSearchParams({fields:"id,name,email",access_token:tokens.access_token});
    const profileResponse=await fetch(profileUrl);const profile=await profileResponse.json();
    if(!profileResponse.ok||!profile.email||!profile.id)throw new Error("Facebook did not provide an email address. Make sure your Facebook account has a confirmed email.");
    const user=await findOrCreateOauthUser("facebook",{id:String(profile.id),email:String(profile.email).toLowerCase(),name:profile.name||profile.email});
    const token=createSession(user.id,Boolean(state.remember_me));
    res.type("html").send(oauthResultPage({ok:true,token,returnTo:state.return_to}));
  }catch(error){res.type("html").status(400).send(oauthResultPage({ok:false,error:error.message}));}
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
    if(cfg.operations && !cfg.operations.ordersEnabled) throw new Error("New orders are temporarily disabled. Existing customers can still track their orders.");
    if(cfg.operations?.methods && cfg.operations.methods[methodKey] === false) throw new Error("This purchase method is temporarily unavailable.");
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


    let verifiedGamePass = null;
    if (["ct", "nct"].includes(methodKey)) {
      const robloxUsername = String(body.robloxUsername || body.username || "").trim();
      const gamePassLink = String(body.gamePassLink || "").trim();

      if (!robloxUsername || !/^[A-Za-z0-9_]{3,20}$/.test(robloxUsername)) {
        throw new Error("A valid Roblox username is required for Covered Tax and Not Covered Tax orders.");
      }
      if (!gamePassLink) {
        throw new Error("A Roblox Game Pass link is required for Covered Tax and Not Covered Tax orders.");
      }

      const expectedGamePassPrice = requiredGamePassPrice(methodKey, amount);
      const verification = await verifyRobloxGamePass(gamePassLink, expectedGamePassPrice);
      if (!verification.ok) throw new Error(verification.error);

      verifiedGamePass = verification.gamePass;
      body.robloxUsername = robloxUsername;
    }

    let reserved=0,reservationExpiresAt=null;
    if(methodKey==="instant"){
      const stock=Number(setting("instant_stock"));
      if(amount>stock)throw new Error(`Only ${stock.toLocaleString()} Instant Robux are available.`);
      reserved=amount;
      reservationExpiresAt=new Date(Date.now()+RESERVATION_MINUTES*60000).toISOString();
    }


    const currentReceiptHash = receiptHash(req.file.path);
    let riskFlags = "";
    const duplicateReceipt = db.prepare("SELECT order_number FROM orders WHERE receipt_hash=? LIMIT 1").get(currentReceiptHash);
    if (duplicateReceipt) riskFlags = appendRiskFlag(riskFlags, `duplicate-receipt:${duplicateReceipt.order_number}`);
    const duplicateReference = db.prepare("SELECT order_number FROM orders WHERE reference_number=? LIMIT 1").get(String(body.referenceNumber||"").trim());
    if (duplicateReference) riskFlags = appendRiskFlag(riskFlags, `duplicate-reference:${duplicateReference.order_number}`);

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
          gamepass_id,gamepass_url,gamepass_name,gamepass_price,gamepass_verified_at,
          receipt_filename,receipt_hash,risk_flags,receipt_review_status,reserved_stock,reservation_expires_at,created_at,updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        id,number,hashToken(privateToken),req.customer.id,"Pending Payment Review",methodNames[methodKey],
        methodKey==="ct"?"Covered Tax":methodKey==="nct"?"Not Covered Tax":"N/A",
        amount,receive,pass,subtotal,discount,total,promo?.code||null,String(body.paymentMethod||""),
        String(body.senderName||"").trim(),String(body.referenceNumber||"").trim(),
        String(body.robloxUserId||""),String(body.username||""),String(body.robloxDisplayName||body.username||""),
        String(body.robloxAvatarUrl||""),String(body.gameName||""),String(body.itemName||""),
        verifiedGamePass?.id||null,verifiedGamePass?.url||null,verifiedGamePass?.name||null,verifiedGamePass?.actualPrice||null,verifiedGamePass?created:null,
        req.file.filename,currentReceiptHash,riskFlags,"Not reviewed",reserved,reservationExpiresAt,created,created
      );
      db.prepare("INSERT INTO order_history(order_id,status,created_at) VALUES (?,?,?)").run(id,"Pending Payment Review",created);
      db.prepare("INSERT INTO messages(order_id,sender_type,text,customer_read,admin_read,created_at) VALUES (?,?,?,?,?,?)")
        .run(id,"system","Order submitted. Wait for admin payment review.",0,0,created);
      notifyUser(req.customer.id,id,"order_submitted","Order submitted",`${number} was submitted and is waiting for payment review.`);
      if(riskFlags) audit("order_risk_flag",`${number}: ${riskFlags}`);
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
  const messages=orderMessages(order.id);
  res.json({...serializeOrder(order,true),history,messages});
});

app.get("/api/private/orders/:number",(req,res)=>{
  const order=orderForPrivateToken(req.params.number,String(req.query.token||""));
  if(!order)return res.status(404).json({error:"Wrong order number or private token."});
  const history=db.prepare("SELECT status,created_at FROM order_history WHERE order_id=? ORDER BY id").all(order.id);
  const messages=orderMessages(order.id);
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



app.post("/api/orders/:number/confirm-delivery",requireCustomer,(req,res)=>{
  const order=orderForCustomer(req.params.number,req.customer.id);
  if(!order)return res.status(404).json({error:"Order not found."});
  if(!["Ready for Delivery","Completed"].includes(order.status))
    return res.status(400).json({error:"This order is not ready for delivery confirmation yet."});
  if(order.status!=="Completed"){
    const changed=nowIso();
    db.prepare("UPDATE orders SET status='Completed',completed_at=?,updated_at=? WHERE id=?").run(changed,changed,order.id);
    db.prepare("INSERT INTO messages(order_id,sender_type,text,customer_read,admin_read,created_at) VALUES (?,?,?,?,?,?)")
      .run(order.id,"system","Customer confirmed that the Robux delivery was received.",1,0,changed);
    notifyUser(order.customer_id,order.id,"status","Delivery confirmed","Your order is now completed.");
    audit("customer_confirmed_delivery",order.order_number);
  }
  res.json({ok:true,status:"Completed"});
});

app.get("/api/order-message-images/:messageId",requireCustomer,(req,res)=>{
  const message=db.prepare(`SELECT m.*,o.customer_id FROM messages m JOIN orders o ON o.id=m.order_id WHERE m.id=?`).get(Number(req.params.messageId));
  if(!message||message.customer_id!==req.customer.id||!message.image_filename)return res.status(404).json({error:"Proof image not found."});
  const file=path.join(UPLOADS_DIR,message.image_filename);
  if(!fs.existsSync(file))return res.status(404).json({error:"Proof image file is unavailable."});
  res.set("Cache-Control","private, max-age=300");
  res.type(message.image_mime||"image/jpeg");
  res.sendFile(file);
});
app.get("/api/admin/order-message-images/:messageId",requireAdmin,(req,res)=>{
  const message=db.prepare("SELECT * FROM messages WHERE id=?").get(Number(req.params.messageId));
  if(!message||!message.image_filename)return res.status(404).json({error:"Proof image not found."});
  const file=path.join(UPLOADS_DIR,message.image_filename);
  if(!fs.existsSync(file))return res.status(404).json({error:"Proof image file is unavailable."});
  res.type(message.image_mime||"image/jpeg");
  res.sendFile(file);
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
  const messages=orderMessages(order.id);
  const notes=db.prepare("SELECT id,note,created_at FROM admin_notes WHERE order_id=? ORDER BY id DESC").all(order.id);
  const disputes=db.prepare("SELECT * FROM disputes WHERE order_id=? ORDER BY created_at DESC").all(order.id);
  res.json({...serializeOrder(order,true),history,messages,notes,disputes});
});

app.get("/api/admin/orders/:number/receipt",requireAdmin,(req,res)=>{
  const order=db.prepare("SELECT * FROM orders WHERE order_number=?").get(req.params.number);
  if(!order)return res.status(404).json({error:"Order not found."});
  const file=path.join(UPLOADS_DIR,order.receipt_filename);
  if(!fs.existsSync(file))return res.status(404).json({error:"Receipt file is unavailable."});
  res.sendFile(file);
});

app.post("/api/admin/orders/:number/messages",requireAdmin,proofUpload.single("image"),(req,res)=>{
  const order=db.prepare("SELECT * FROM orders WHERE order_number=?").get(req.params.number);
  if(!order){
    if(req.file?.path&&fs.existsSync(req.file.path))fs.unlinkSync(req.file.path);
    return res.status(404).json({error:"Order not found."});
  }
  const text=String(req.body.text||"").trim().slice(0,1200);
  const caption=String(req.body.caption||"").trim().slice(0,300);
  if(!text&&!req.file)return res.status(400).json({error:"Enter a message or attach a proof image."});
  const defaultText=req.file&&!text?"Robux delivery proof attached. Please review the image below.":text;
  const result=db.prepare(`INSERT INTO messages(order_id,sender_type,text,image_filename,image_mime,image_caption,customer_read,admin_read,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
      order.id,"admin",defaultText,req.file?.filename||null,req.file?.mimetype||null,caption||null,0,1,nowIso()
    );
  notifyUser(order.customer_id,order.id,"support",req.file?"Delivery proof received":"New admin message",
    req.file?"Reck Shop sent an image proof for your order.":defaultText);
  audit(req.file?"order_proof_sent":"admin_order_message_sent",`${order.order_number}: message ${result.lastInsertRowid}`);
  res.json({ok:true,messageId:result.lastInsertRowid});
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
    const changedAt=nowIso();
    const deliveryStarted = ["Processing","Ready for Delivery","Completed"].includes(status) ? (order.delivery_started_at || changedAt) : order.delivery_started_at;
    const completedAt = status==="Completed" ? changedAt : order.completed_at;
    db.prepare("UPDATE orders SET status=?,updated_at=?,delivery_started_at=?,completed_at=? WHERE id=?")
      .run(status,changedAt,deliveryStarted,completedAt,order.id);
    db.prepare("INSERT INTO order_history(order_id,status,created_at) VALUES (?,?,?)").run(order.id,status,nowIso());
    const templateKey={Approved:"payment_approved",Processing:"processing","Ready for Delivery":"ready",Completed:"completed",Declined:"declined"}[status];
    const tpl=templateKey?templateFor(templateKey):null;
    const text=tpl?.message || `Order status changed to ${status}.`;
    db.prepare("INSERT INTO messages(order_id,sender_type,text,customer_read,admin_read,created_at) VALUES (?,?,?,?,?,?)")
      .run(order.id,"system",text,0,0,nowIso());
    notifyUser(order.customer_id,order.id,"status",tpl?.title || `Order ${status}`,text);
    audit("order_status_changed",`${order.order_number} → ${status}`);
  })();
  res.json({ok:true});
});

app.patch("/api/admin/settings",requireAdmin,(req,res)=>{
  const allowed=["instantStock","supportOnline","supportText","rateCt","rateNct","rateInstant","rateGifting","paypalEmail","wiseDetails","payoneerDetails","paymentGCashEnabled","paymentGoTymeEnabled","paymentPayPalEnabled","paymentWiseEnabled","paymentPayoneerEnabled","shopBannerEnabled","shopBannerText","maintenanceMode","businessName","businessOwnerDisplay","businessEmail","businessPhone","businessAddress","supportHours","facebookUrl","discordUrl","trustNotice","publicStatsEnabled","publicCompletedCount","publicReviewCount","publicAverageRating","tutorialTitle","tutorialVideoUrl","tutorialVideoEnabled","languageDefault","languageAutoDetect","etaCt","etaNct","etaInstant","etaGifting","pendingNotice","lowStockThreshold","ordersEnabled","methodCtEnabled","methodNctEnabled","methodInstantEnabled","methodGiftingEnabled","overdueReviewMinutes","overdueProcessingMinutes","securityNotice"];
  for(const key of allowed){
    if(req.body[key]===undefined)continue;
    const map={
      instantStock:"instant_stock",supportOnline:"support_online",supportText:"support_text",
      rateCt:"rate_ct",rateNct:"rate_nct",rateInstant:"rate_instant",rateGifting:"rate_gifting",
      paypalEmail:"paypal_email",wiseDetails:"wise_details",payoneerDetails:"payoneer_details",paymentGCashEnabled:"payment_gcash_enabled",paymentGoTymeEnabled:"payment_gotyme_enabled",paymentPayPalEnabled:"payment_paypal_enabled",paymentWiseEnabled:"payment_wise_enabled",paymentPayoneerEnabled:"payment_payoneer_enabled",shopBannerEnabled:"shop_banner_enabled",shopBannerText:"shop_banner_text",maintenanceMode:"maintenance_mode",
      businessName:"business_name",businessOwnerDisplay:"business_owner_display",businessEmail:"business_email",
      businessPhone:"business_phone",businessAddress:"business_address",supportHours:"support_hours",
      facebookUrl:"facebook_url",discordUrl:"discord_url",trustNotice:"trust_notice",
      publicStatsEnabled:"public_stats_enabled",publicCompletedCount:"public_completed_count",
      publicReviewCount:"public_review_count",publicAverageRating:"public_average_rating",
      tutorialTitle:"tutorial_title",tutorialVideoUrl:"tutorial_video_url",
      tutorialVideoEnabled:"tutorial_video_enabled",languageDefault:"language_default",
      languageAutoDetect:"language_auto_detect",etaCt:"eta_ct",etaNct:"eta_nct",etaInstant:"eta_instant",etaGifting:"eta_gifting",pendingNotice:"pending_notice",lowStockThreshold:"low_stock_threshold",ordersEnabled:"orders_enabled",methodCtEnabled:"method_ct_enabled",methodNctEnabled:"method_nct_enabled",methodInstantEnabled:"method_instant_enabled",methodGiftingEnabled:"method_gifting_enabled",overdueReviewMinutes:"overdue_review_minutes",overdueProcessingMinutes:"overdue_processing_minutes",securityNotice:"security_notice"
    };
    let value=req.body[key];
    if(["supportOnline","paymentGCashEnabled","paymentGoTymeEnabled","paymentPayPalEnabled","paymentWiseEnabled","paymentPayoneerEnabled","shopBannerEnabled","maintenanceMode","publicStatsEnabled","publicCompletedCount","publicReviewCount","publicAverageRating","tutorialVideoEnabled","languageAutoDetect","ordersEnabled","methodCtEnabled","methodNctEnabled","methodInstantEnabled","methodGiftingEnabled"].includes(key))value=Boolean(value)?"true":"false";
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


app.get("/api/customer/profile-summary",requireCustomer,(req,res)=>{
  const stats=db.prepare(`SELECT COUNT(*) AS totalOrders,
    SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) AS completedOrders,
    COALESCE(SUM(CASE WHEN status='Completed' THEN total_payment ELSE 0 END),0) AS totalSpent,
    COALESCE(SUM(CASE WHEN status='Completed' THEN receive_amount ELSE 0 END),0) AS totalRobux
    FROM orders WHERE customer_id=?`).get(req.user.id);
  const completed=Number(stats.completedOrders||0);
  const tier=completed>=100?"Diamond":completed>=31?"Gold":completed>=11?"Silver":"Bronze";
  const nextTarget=completed>=100?null:completed>=31?100:completed>=11?31:11;
  res.json({...stats,tier,nextTarget,ordersToNext:nextTarget?Math.max(0,nextTarget-completed):0});
});

app.get("/api/admin/orders/export.csv",requireAdmin,(req,res)=>{
  const rows=db.prepare(`SELECT order_number,status,method,amount,receive_amount,total_payment,payment_method,
    username,display_name,sender_name,reference_number,created_at,updated_at FROM orders ORDER BY created_at DESC`).all();
  const escCsv=value=>`"${String(value??"").replace(/"/g,'""')}"`;
  const headers=["Order Number","Status","Method","Amount","Receive Amount","Total Payment","Payment Method","Username","Display Name","Sender","Reference","Created","Updated"];
  const lines=[headers.map(escCsv).join(","),...rows.map(r=>[
    r.order_number,r.status,r.method,r.amount,r.receive_amount,r.total_payment,r.payment_method,r.username,r.display_name,r.sender_name,r.reference_number,r.created_at,r.updated_at
  ].map(escCsv).join(","))];
  audit("orders_exported",`${rows.length} orders exported`);
  res.setHeader("Content-Type","text/csv; charset=utf-8");
  res.setHeader("Content-Disposition",`attachment; filename="rsr-orders-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send("\uFEFF"+lines.join("\n"));
});

app.get("/api/admin/analytics",requireAdmin,(req,res)=>{
  const totals=db.prepare(`
    SELECT COUNT(*) AS orders,
      COALESCE(SUM(CASE WHEN status='Completed' THEN total_payment ELSE 0 END),0) AS revenue,
      SUM(CASE WHEN status='Pending Payment Review' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status='Declined' THEN 1 ELSE 0 END) AS declined,
      COALESCE(AVG(CASE WHEN status='Completed' THEN total_payment END),0) AS averageOrder
    FROM orders
  `).get();

  const daily=db.prepare(`
    SELECT substr(created_at,1,10) AS day,COUNT(*) AS orders,
      COALESCE(SUM(CASE WHEN status='Completed' THEN total_payment ELSE 0 END),0) AS revenue
    FROM orders GROUP BY substr(created_at,1,10) ORDER BY day DESC LIMIT 30
  `).all();

  const methods=db.prepare(`
    SELECT method,COUNT(*) AS orders,
      COALESCE(SUM(CASE WHEN status='Completed' THEN total_payment ELSE 0 END),0) AS revenue
    FROM orders GROUP BY method ORDER BY orders DESC
  `).all();

  const payments=db.prepare(`
    SELECT payment_method AS paymentMethod,COUNT(*) AS orders,
      COALESCE(SUM(CASE WHEN status='Completed' THEN total_payment ELSE 0 END),0) AS revenue
    FROM orders GROUP BY payment_method ORDER BY orders DESC
  `).all();

  const statuses=db.prepare(`
    SELECT status,COUNT(*) AS orders
    FROM orders GROUP BY status ORDER BY orders DESC
  `).all();

  const last7=db.prepare(`
    SELECT COUNT(*) AS orders,
      COALESCE(SUM(CASE WHEN status='Completed' THEN total_payment ELSE 0 END),0) AS revenue
    FROM orders
    WHERE datetime(created_at) >= datetime('now','-7 days')
  `).get();

  const completionRate=Number(totals.orders||0)>0
    ? (Number(totals.completed||0)/Number(totals.orders))*100
    : 0;

  const visitors=db.prepare("SELECT COUNT(DISTINCT session_key) count FROM site_events WHERE event_type='page_view' AND created_at>=datetime('now','-30 days')").get().count;
  const checkoutStarts=db.prepare("SELECT COUNT(*) count FROM site_events WHERE event_type='checkout_start' AND created_at>=datetime('now','-30 days')").get().count;
  const submitAttempts=db.prepare("SELECT COUNT(*) count FROM site_events WHERE event_type='order_submit_attempt' AND created_at>=datetime('now','-30 days')").get().count;
  const repeatCustomers=db.prepare("SELECT COUNT(*) count FROM (SELECT customer_id FROM orders WHERE status='Completed' GROUP BY customer_id HAVING COUNT(*)>1)").get().count;
  const avgDelivery=db.prepare("SELECT COALESCE(AVG((julianday(completed_at)-julianday(created_at))*1440),0) minutes FROM orders WHERE completed_at IS NOT NULL").get().minutes;
  const supportOpen=db.prepare("SELECT COUNT(*) count FROM support_tickets WHERE status NOT IN ('Resolved','Closed')").get().count;
  const announcementsActive=db.prepare(`SELECT COUNT(*) count FROM announcements WHERE enabled=1 AND (starts_at IS NULL OR datetime(starts_at)<=datetime('now')) AND (ends_at IS NULL OR datetime(ends_at)>=datetime('now'))`).get().count;
  res.json({totals:{...totals,completionRate},daily,methods,payments,statuses,last7,
    funnel:{visitors,checkoutStarts,submitAttempts,conversionRate:visitors?Number(totals.orders||0)/visitors*100:0},
    repeatCustomers,averageDeliveryMinutes:avgDelivery,supportOpen,announcementsActive});
});




// V10.1 translation overrides.
app.get("/api/translations/:language",(req,res)=>{
  const language=String(req.params.language||"").toLowerCase().slice(0,10);
  const rows=db.prepare("SELECT source_text,translated_text FROM translation_overrides WHERE language=?").all(language);
  res.json({language,translations:Object.fromEntries(rows.map(row=>[row.source_text,row.translated_text]))});
});
app.get("/api/admin/translations",requireAdmin,(req,res)=>{
  const language=String(req.query.language||"fil").toLowerCase().slice(0,10);
  res.json({language,translations:db.prepare("SELECT source_text AS sourceText,translated_text AS translatedText,updated_at AS updatedAt FROM translation_overrides WHERE language=? ORDER BY source_text").all(language)});
});
app.put("/api/admin/translations",requireAdmin,(req,res)=>{
  const language=String(req.body.language||"").toLowerCase().slice(0,10);
  const sourceText=String(req.body.sourceText||"").trim().slice(0,500);
  const translatedText=String(req.body.translatedText||"").trim().slice(0,1000);
  const allowed=["fil","ceb","es","pt","vi","fr","de","id","ja","ko","zh","th","ar"];
  if(!allowed.includes(language))return res.status(400).json({error:"Unsupported language."});
  if(!sourceText||!translatedText)return res.status(400).json({error:"English source and translated text are required."});
  db.prepare(`INSERT INTO translation_overrides(language,source_text,translated_text,updated_at)
    VALUES (?,?,?,?) ON CONFLICT(language,source_text)
    DO UPDATE SET translated_text=excluded.translated_text,updated_at=excluded.updated_at`)
    .run(language,sourceText,translatedText,nowIso());
  audit("translation_saved",`${language}: ${sourceText}`);
  res.json({ok:true});
});
app.delete("/api/admin/translations",(req,res,next)=>requireAdmin(req,res,()=>{
  const language=String(req.body.language||"").toLowerCase().slice(0,10);
  const sourceText=String(req.body.sourceText||"").trim().slice(0,500);
  db.prepare("DELETE FROM translation_overrides WHERE language=? AND source_text=?").run(language,sourceText);
  audit("translation_deleted",`${language}: ${sourceText}`);
  res.json({ok:true});
}));

app.post("/api/events",(req,res)=>{
  const allowed=["page_view","checkout_start","order_submit_attempt","install_help","language_change"];
  const eventType=String(req.body.eventType||"");
  if(!allowed.includes(eventType))return res.status(400).json({error:"Invalid event."});
  db.prepare("INSERT INTO site_events(session_key,event_type,path,language,created_at) VALUES (?,?,?,?,?)")
    .run(String(req.body.sessionKey||"").slice(0,100),eventType,String(req.body.path||"").slice(0,200),String(req.body.language||"").slice(0,20),nowIso());
  res.json({ok:true});
});

app.get("/api/orders/:number/realtime",requireCustomer,(req,res)=>{
  const order=orderForCustomer(req.params.number,req.customer.id);
  if(!order)return res.status(404).json({error:"Order not found."});
  const lastMessageId=Math.max(0,Number(req.query.after||0));
  const messages=db.prepare(`SELECT id,sender_type AS sender,text,image_filename,image_caption,created_at
    FROM messages WHERE order_id=? AND id>? ORDER BY id`).all(order.id,lastMessageId).map(row=>({
      id:row.id,sender:row.sender,text:row.text,
      imageUrl:row.image_filename?`/api/order-message-images/${row.id}`:null,
      imageCaption:row.image_caption||"",created_at:row.created_at
    }));
  res.json({status:order.status,updatedAt:order.updated_at,messages});
});
app.get("/api/admin/orders/:number/realtime",requireAdmin,(req,res)=>{
  const order=db.prepare("SELECT * FROM orders WHERE order_number=?").get(req.params.number);
  if(!order)return res.status(404).json({error:"Order not found."});
  const lastMessageId=Math.max(0,Number(req.query.after||0));
  const messages=db.prepare(`SELECT id,sender_type AS sender,text,image_filename,image_caption,created_at
    FROM messages WHERE order_id=? AND id>? ORDER BY id`).all(order.id,lastMessageId).map(row=>({
      id:row.id,sender:row.sender,text:row.text,
      imageUrl:row.image_filename?`/api/admin/order-message-images/${row.id}`:null,
      imageCaption:row.image_caption||"",created_at:row.created_at
    }));
  res.json({status:order.status,updatedAt:order.updated_at,messages});
});

app.get("/api/customer/notifications",requireCustomer,(req,res)=>{
  const rows=db.prepare("SELECT id,type,title,message,read_at,created_at,order_id FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 100").all(req.customer.id);
  res.json({notifications:rows,unread:rows.filter(x=>!x.read_at).length});
});
app.patch("/api/customer/notifications/read",requireCustomer,(req,res)=>{
  db.prepare("UPDATE notifications SET read_at=COALESCE(read_at,?) WHERE user_id=?").run(nowIso(),req.customer.id);res.json({ok:true});
});
app.post("/api/orders/:number/disputes",requireCustomer,(req,res)=>{
  const order=orderForCustomer(req.params.number,req.customer.id);if(!order)return res.status(404).json({error:"Order not found."});
  const category=String(req.body.category||"").trim(),details=String(req.body.details||"").trim().slice(0,2000);
  const allowed=["Missing Delivery","Wrong Roblox Username","Wrong Game Pass","Duplicate Payment","Refund Request","Other"];
  if(!allowed.includes(category)||details.length<5)return res.status(400).json({error:"Choose a category and explain the problem."});
  const id=crypto.randomUUID(),created=nowIso();
  db.prepare("INSERT INTO disputes(id,order_id,customer_id,category,details,status,created_at,updated_at) VALUES (?,?,?,?,?,'Open',?,?)").run(id,order.id,req.customer.id,category,details,created,created);
  notifyUser(req.customer.id,order.id,"dispute","Support case opened",`Your ${category} case was opened for ${order.order_number}.`);
  audit("dispute_opened",`${order.order_number}: ${category}`);res.json({ok:true,id});
});
app.get("/api/customer/disputes",requireCustomer,(req,res)=>res.json({disputes:db.prepare(`SELECT d.*,o.order_number FROM disputes d JOIN orders o ON o.id=d.order_id WHERE d.customer_id=? ORDER BY d.created_at DESC`).all(req.customer.id)}));
app.post("/api/admin/orders/:number/notes",requireAdmin,(req,res)=>{
  const order=db.prepare("SELECT * FROM orders WHERE order_number=?").get(req.params.number);if(!order)return res.status(404).json({error:"Order not found."});
  const note=String(req.body.note||"").trim().slice(0,1500);if(!note)return res.status(400).json({error:"Note is empty."});
  db.prepare("INSERT INTO admin_notes(order_id,note,created_at) VALUES (?,?,?)").run(order.id,note,nowIso());audit("admin_note_added",order.order_number);res.json({ok:true});
});
app.patch("/api/admin/orders/:number/receipt-review",requireAdmin,(req,res)=>{
  const order=db.prepare("SELECT * FROM orders WHERE order_number=?").get(req.params.number);if(!order)return res.status(404).json({error:"Order not found."});
  const status=String(req.body.status||"");if(!["Verified","Unreadable","Mismatch","Duplicate suspected"].includes(status))return res.status(400).json({error:"Invalid review status."});
  const amount=req.body.amount===""||req.body.amount==null?null:Number(req.body.amount),reference=String(req.body.reference||"").trim().slice(0,120);
  let risk=order.risk_flags||"";if(status==="Mismatch")risk=appendRiskFlag(risk,"payment-mismatch");if(status==="Duplicate suspected")risk=appendRiskFlag(risk,"duplicate-suspected");
  db.prepare("UPDATE orders SET receipt_review_status=?,admin_verified_amount=?,admin_verified_reference=?,risk_flags=?,updated_at=? WHERE id=?").run(status,Number.isFinite(amount)?amount:null,reference||null,risk,nowIso(),order.id);
  audit("receipt_reviewed",`${order.order_number}: ${status}`);res.json({ok:true});
});
app.post("/api/admin/orders/:number/quick-action",requireAdmin,(req,res)=>{
  const order=db.prepare("SELECT * FROM orders WHERE order_number=?").get(req.params.number);if(!order)return res.status(404).json({error:"Order not found."});
  const key=String(req.body.templateKey||""),tpl=templateFor(key);if(!tpl)return res.status(404).json({error:"Message template not found."});
  db.prepare("INSERT INTO messages(order_id,sender_type,text,customer_read,admin_read,created_at) VALUES (?,?,?,?,?,?)").run(order.id,"admin",tpl.message,0,1,nowIso());
  notifyUser(order.customer_id,order.id,"support",tpl.title,tpl.message);audit("quick_message_sent",`${order.order_number}: ${key}`);res.json({ok:true});
});
app.get("/api/admin/templates",requireAdmin,(_,res)=>res.json({templates:db.prepare("SELECT * FROM message_templates ORDER BY key").all()}));
app.patch("/api/admin/templates/:key",requireAdmin,(req,res)=>{
  const title=String(req.body.title||"").trim().slice(0,120),message=String(req.body.message||"").trim().slice(0,1200);
  if(!title||!message)return res.status(400).json({error:"Title and message are required."});
  db.prepare("INSERT INTO message_templates(key,title,message,updated_at) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET title=excluded.title,message=excluded.message,updated_at=excluded.updated_at").run(req.params.key,title,message,nowIso());
  audit("template_updated",req.params.key);res.json({ok:true});
});
app.get("/api/admin/disputes",requireAdmin,(_,res)=>res.json({disputes:db.prepare(`SELECT d.*,o.order_number,u.email,u.full_name FROM disputes d JOIN orders o ON o.id=d.order_id JOIN users u ON u.id=d.customer_id ORDER BY d.created_at DESC`).all()}));
app.patch("/api/admin/disputes/:id",requireAdmin,(req,res)=>{
  const row=db.prepare("SELECT * FROM disputes WHERE id=?").get(req.params.id);if(!row)return res.status(404).json({error:"Case not found."});
  const status=String(req.body.status||"Open");if(!["Open","Waiting for Customer","Resolved","Rejected"].includes(status))return res.status(400).json({error:"Invalid case status."});
  const reply=String(req.body.adminReply||"").trim().slice(0,2000);
  db.prepare("UPDATE disputes SET status=?,admin_reply=?,updated_at=? WHERE id=?").run(status,reply||null,nowIso(),row.id);
  notifyUser(row.customer_id,row.order_id,"dispute","Support case updated",reply||`Your support case is now ${status}.`);audit("dispute_updated",`${row.id}: ${status}`);res.json({ok:true});
});

// V12 storage readiness and backup recovery.
app.get("/api/storage/status",(_,res)=>{
  const configuredRoot=String(process.env.DATA_ROOT||"");
  const isTemporary=/^\/tmp(?:\/|$)/.test(DATA_ROOT) || !process.env.DATA_ROOT;
  const databaseExists=fs.existsSync(DB_PATH);
  const uploadsWritable=(()=>{try{
    const test=path.join(UPLOADS_DIR,`.write-test-${process.pid}`);
    fs.writeFileSync(test,"ok");fs.unlinkSync(test);return true;
  }catch{return false}})();
  res.json({
    ok:databaseExists&&uploadsWritable,
    mode:isTemporary?"temporary":"persistent",
    configuredRoot,
    activeRoot:DATA_ROOT,
    databaseExists,
    uploadsWritable,
    warning:isTemporary
      ?"This service is using temporary local storage. Accounts, orders, settings and receipts can be lost after a restart or redeploy."
      :"Persistent storage is configured. Continue making external backups."
  });
});
app.get("/api/admin/backups",requireAdmin,(_,res)=>{
  try{
    const dir=path.join(DATA_DIR,"backups");
    const backups=fs.existsSync(dir)
      ? fs.readdirSync(dir).filter(name=>name.endsWith(".db")).sort().reverse().map(name=>{
          const full=path.join(dir,name),stat=fs.statSync(full);
          return {name,size:stat.size,createdAt:stat.mtime.toISOString()};
        })
      : [];
    res.json({backups});
  }catch(error){res.status(500).json({error:"Unable to list backups."});}
});
app.get("/api/admin/backups/:name/download",requireAdmin,(req,res)=>{
  const safe=path.basename(String(req.params.name||""));
  if(!/^rsr-[A-Za-z0-9T_.-]+\.db$/.test(safe))return res.status(400).json({error:"Invalid backup name."});
  const file=path.join(DATA_DIR,"backups",safe);
  if(!fs.existsSync(file))return res.status(404).json({error:"Backup not found."});
  audit("backup_downloaded",safe);
  res.download(file,safe);
});
app.get("/api/admin/customers/export.csv",requireAdmin,(_,res)=>{
  const rows=db.prepare(`SELECT u.id,u.full_name,u.email,u.email_verified,u.created_at,
    COUNT(o.id) AS orders,
    COALESCE(SUM(CASE WHEN o.status='Completed' THEN o.total_payment ELSE 0 END),0) AS completed_value
    FROM users u LEFT JOIN orders o ON o.customer_id=u.id
    GROUP BY u.id ORDER BY u.created_at DESC`).all();
  const quote=value=>`"${String(value??"").replace(/"/g,'""')}"`;
  const csv=[
    ["Customer ID","Full Name","Email","Verified","Created","Orders","Completed Value"],
    ...rows.map(row=>[row.id,row.full_name,row.email,row.email_verified?"Yes":"No",row.created_at,row.orders,row.completed_value])
  ].map(row=>row.map(quote).join(",")).join("\n");
  audit("customers_exported",`${rows.length} customers`);
  res.set({"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="rsr-customers.csv"'});
  res.send("\ufeff"+csv);
});

app.get("/api/admin/security",requireAdmin,(req,res)=>{
  const activeSessions=db.prepare("SELECT COUNT(*) count FROM sessions WHERE expires_at>?").get(nowIso()).count;
  const riskyOrders=db.prepare("SELECT COUNT(*) count FROM orders WHERE COALESCE(risk_flags,'')<>'' AND status NOT IN ('Completed','Declined')").get().count;
  const duplicateReceipts=db.prepare("SELECT COUNT(*) count FROM (SELECT receipt_hash FROM orders WHERE receipt_hash IS NOT NULL GROUP BY receipt_hash HAVING COUNT(*)>1)").get().count;
  const latestBackup=(()=>{try{const dir=path.join(DATA_DIR,'backups');const files=fs.existsSync(dir)?fs.readdirSync(dir).sort().reverse():[];return files[0]||null}catch{return null}})();
  res.json({activeSessions,riskyOrders,duplicateReceipts,latestBackup});
});
app.post("/api/admin/security/logout-customers",requireAdmin,(req,res)=>{
  const result=db.prepare("DELETE FROM sessions").run();audit("all_customer_sessions_revoked",`${result.changes} sessions`);res.json({ok:true,count:result.changes});
});
app.get("/api/admin/operations",requireAdmin,(req,res)=>{
  const reviewMinutes=Number(setting("overdue_review_minutes")||30),processingMinutes=Number(setting("overdue_processing_minutes")||120);
  const overdue=db.prepare(`SELECT order_number,status,username,created_at,updated_at,
    CAST((julianday('now')-julianday(CASE WHEN status='Pending Payment Review' THEN created_at ELSE updated_at END))*1440 AS INTEGER) AS waiting_minutes
    FROM orders WHERE (status='Pending Payment Review' AND datetime(created_at)<=datetime('now',?))
    OR (status IN ('Approved','Processing','Ready for Delivery') AND datetime(updated_at)<=datetime('now',?))
    ORDER BY waiting_minutes DESC LIMIT 100`).all(`-${reviewMinutes} minutes`,`-${processingMinutes} minutes`);
  res.json({overdue,lowStock:Number(setting("instant_stock")||0)<=Number(setting("low_stock_threshold")||5000),instantStock:Number(setting("instant_stock")||0)});
});


// V13.5 customer preferences.
app.get("/api/customer/preferences",requireCustomer,(req,res)=>{
  const row=db.prepare("SELECT * FROM customer_preferences WHERE user_id=?").get(req.customer.id) || {};
  res.json({preferences:{
    preferredLanguage:row.preferred_language||"",
    preferredPayment:row.preferred_payment||"",
    preferredMethod:row.preferred_method||"",
    savedRobloxUsername:row.saved_roblox_username||"",
    savedRobloxUserId:row.saved_roblox_user_id||"",
    timezone:row.timezone||""
  }});
});
app.patch("/api/customer/preferences",requireCustomer,(req,res)=>{
  const allowedPayment=["","GCash","GoTyme","PayPal","Wise","Payoneer"];
  const allowedMethod=["","ct","nct","instant","gifting"];
  const language=String(req.body.preferredLanguage||"").slice(0,10);
  const payment=String(req.body.preferredPayment||"");
  const method=String(req.body.preferredMethod||"");
  const username=String(req.body.savedRobloxUsername||"").trim().slice(0,50);
  const userId=String(req.body.savedRobloxUserId||"").trim().slice(0,30);
  const timezone=String(req.body.timezone||"").trim().slice(0,80);
  if(!allowedPayment.includes(payment)||!allowedMethod.includes(method))return res.status(400).json({error:"Invalid preference."});
  db.prepare(`INSERT INTO customer_preferences(user_id,preferred_language,preferred_payment,preferred_method,saved_roblox_username,saved_roblox_user_id,timezone,updated_at)
    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET
    preferred_language=excluded.preferred_language,preferred_payment=excluded.preferred_payment,
    preferred_method=excluded.preferred_method,saved_roblox_username=excluded.saved_roblox_username,
    saved_roblox_user_id=excluded.saved_roblox_user_id,timezone=excluded.timezone,updated_at=excluded.updated_at`)
    .run(req.customer.id,language,payment,method,username,userId,timezone,nowIso());
  audit("customer_preferences_updated",req.customer.id);
  res.json({ok:true});
});

// V13.5 integrated support center.
app.get("/api/customer/tickets",requireCustomer,(req,res)=>{
  const tickets=db.prepare("SELECT * FROM support_tickets WHERE customer_id=? ORDER BY updated_at DESC").all(req.customer.id).map(ticketPublic);
  res.json({tickets});
});
app.post("/api/customer/tickets",requireCustomer,(req,res)=>{
  const category=String(req.body.category||"General Question");
  const subject=String(req.body.subject||"").trim().slice(0,120);
  const message=String(req.body.message||"").trim().slice(0,3000);
  const orderNumber=String(req.body.orderNumber||"").trim();
  const allowed=["Payment","Order","Refund","Technical","General Question"];
  if(!allowed.includes(category)||subject.length<3||message.length<5)return res.status(400).json({error:"Complete the ticket subject and message."});
  let orderId=null;
  if(orderNumber){
    const order=orderForCustomer(orderNumber,req.customer.id);
    if(!order)return res.status(404).json({error:"Order number not found."});
    orderId=order.id;
  }
  const id=crypto.randomUUID(),created=nowIso();
  db.prepare("INSERT INTO support_tickets(id,customer_id,order_id,category,subject,status,priority,created_at,updated_at) VALUES (?,?,?,?,?,'Open','Normal',?,?)")
    .run(id,req.customer.id,orderId,category,subject,created,created);
  db.prepare("INSERT INTO support_messages(ticket_id,sender_type,message,created_at) VALUES (?,?,?,?)").run(id,"customer",message,created);
  audit("support_ticket_created",`${id}: ${category}`);
  res.status(201).json({ticket:ticketPublic(db.prepare("SELECT * FROM support_tickets WHERE id=?").get(id))});
});
app.get("/api/customer/tickets/:id",requireCustomer,(req,res)=>{
  const ticket=ticketForCustomer(req.params.id,req.customer.id);
  if(!ticket)return res.status(404).json({error:"Ticket not found."});
  const messages=db.prepare("SELECT id,sender_type AS senderType,message,created_at AS createdAt FROM support_messages WHERE ticket_id=? ORDER BY id").all(ticket.id);
  res.json({ticket:ticketPublic(ticket),messages});
});
app.post("/api/customer/tickets/:id/messages",requireCustomer,(req,res)=>{
  const ticket=ticketForCustomer(req.params.id,req.customer.id);
  if(!ticket)return res.status(404).json({error:"Ticket not found."});
  if(["Resolved","Closed"].includes(ticket.status))return res.status(400).json({error:"This ticket is closed."});
  const message=String(req.body.message||"").trim().slice(0,3000);
  if(message.length<1)return res.status(400).json({error:"Message is empty."});
  db.prepare("INSERT INTO support_messages(ticket_id,sender_type,message,created_at) VALUES (?,?,?,?)").run(ticket.id,"customer",message,nowIso());
  db.prepare("UPDATE support_tickets SET status='Open',updated_at=? WHERE id=?").run(nowIso(),ticket.id);
  res.json({ok:true});
});

// V13.5 announcement admin.
app.get("/api/admin/announcements",requireAdmin,(_,res)=>res.json({announcements:db.prepare("SELECT * FROM announcements ORDER BY created_at DESC").all()}));
app.post("/api/admin/announcements",requireAdmin,(req,res)=>{
  const title=String(req.body.title||"").trim().slice(0,120);
  const message=String(req.body.message||"").trim().slice(0,800);
  const level=String(req.body.level||"info");
  if(!title||!message||!["info","success","warning","danger"].includes(level))return res.status(400).json({error:"Complete the announcement."});
  const id=crypto.randomUUID(),created=nowIso();
  db.prepare("INSERT INTO announcements(id,title,message,level,starts_at,ends_at,enabled,created_at,updated_at) VALUES (?,?,?,?,?,?,1,?,?)")
    .run(id,title,message,level,req.body.startsAt||null,req.body.endsAt||null,created,created);
  audit("announcement_created",title);res.status(201).json({ok:true,id});
});
app.patch("/api/admin/announcements/:id",requireAdmin,(req,res)=>{
  const row=db.prepare("SELECT * FROM announcements WHERE id=?").get(req.params.id);
  if(!row)return res.status(404).json({error:"Announcement not found."});
  const enabled=req.body.enabled===undefined?row.enabled:(req.body.enabled?1:0);
  db.prepare("UPDATE announcements SET title=?,message=?,level=?,starts_at=?,ends_at=?,enabled=?,updated_at=? WHERE id=?")
    .run(String(req.body.title??row.title).slice(0,120),String(req.body.message??row.message).slice(0,800),
      String(req.body.level??row.level),req.body.startsAt??row.starts_at,req.body.endsAt??row.ends_at,enabled,nowIso(),row.id);
  audit("announcement_updated",row.id);res.json({ok:true});
});
app.delete("/api/admin/announcements/:id",requireAdmin,(req,res)=>{
  db.prepare("DELETE FROM announcements WHERE id=?").run(req.params.id);
  audit("announcement_deleted",req.params.id);res.json({ok:true});
});

// V13.5 support admin.
app.get("/api/admin/tickets",requireAdmin,(req,res)=>{
  const tickets=db.prepare(`SELECT t.*,u.full_name,u.email,o.order_number FROM support_tickets t
    JOIN users u ON u.id=t.customer_id LEFT JOIN orders o ON o.id=t.order_id
    ORDER BY CASE t.priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 ELSE 3 END,t.updated_at DESC`).all();
  res.json({tickets});
});
app.get("/api/admin/tickets/:id",requireAdmin,(req,res)=>{
  const ticket=db.prepare(`SELECT t.*,u.full_name,u.email,o.order_number FROM support_tickets t
    JOIN users u ON u.id=t.customer_id LEFT JOIN orders o ON o.id=t.order_id WHERE t.id=?`).get(req.params.id);
  if(!ticket)return res.status(404).json({error:"Ticket not found."});
  const messages=db.prepare("SELECT id,sender_type AS senderType,message,created_at AS createdAt FROM support_messages WHERE ticket_id=? ORDER BY id").all(ticket.id);
  res.json({ticket,messages});
});
app.post("/api/admin/tickets/:id/messages",requireAdmin,(req,res)=>{
  const ticket=db.prepare("SELECT * FROM support_tickets WHERE id=?").get(req.params.id);
  if(!ticket)return res.status(404).json({error:"Ticket not found."});
  const message=String(req.body.message||"").trim().slice(0,3000);
  if(!message)return res.status(400).json({error:"Message is empty."});
  db.prepare("INSERT INTO support_messages(ticket_id,sender_type,message,created_at) VALUES (?,?,?,?)").run(ticket.id,"admin",message,nowIso());
  db.prepare("UPDATE support_tickets SET status='Waiting for Customer',updated_at=? WHERE id=?").run(nowIso(),ticket.id);
  notifyUser(ticket.customer_id,ticket.order_id,"support","Support replied",message);
  audit("support_reply_sent",ticket.id);res.json({ok:true});
});
app.patch("/api/admin/tickets/:id",requireAdmin,(req,res)=>{
  const ticket=db.prepare("SELECT * FROM support_tickets WHERE id=?").get(req.params.id);
  if(!ticket)return res.status(404).json({error:"Ticket not found."});
  const status=String(req.body.status||ticket.status),priority=String(req.body.priority||ticket.priority);
  if(!["Open","Waiting for Customer","Resolved","Closed"].includes(status)||!["Normal","High","Urgent"].includes(priority))return res.status(400).json({error:"Invalid ticket update."});
  db.prepare("UPDATE support_tickets SET status=?,priority=?,updated_at=? WHERE id=?").run(status,priority,nowIso(),ticket.id);
  notifyUser(ticket.customer_id,ticket.order_id,"support","Support ticket updated",`Your ticket is now ${status}.`);
  audit("support_ticket_updated",`${ticket.id}: ${status}/${priority}`);res.json({ok:true});
});

app.get("/api/admin/audit",requireAdmin,(req,res)=>res.json({entries:db.prepare("SELECT * FROM admin_audit ORDER BY id DESC LIMIT 200").all()}));
app.post("/api/admin/backup",requireAdmin,async(req,res)=>{try{const filename=await createBackupNow();audit("manual_backup",filename);res.json({ok:true,filename});}catch{res.status(500).json({error:"Backup failed."});}});

app.get("*",(req,res)=>{
  if (req.path.startsWith("/api/")) return res.status(404).json({error:"API route not found."});
  if (path.extname(req.path)) return res.status(404).type("text/plain").send("File not found.");
  return sendPublicFile(res, "index.html", "no-store, no-cache, must-revalidate");
});

app.use((error,_,res,__)=>{
  console.error(error);
  if(error instanceof multer.MulterError)return res.status(400).json({error:error.code==="LIMIT_FILE_SIZE"?"Uploaded image is too large. Receipt limit is 5 MB; proof-image limit is 8 MB.":error.message});
  res.status(500).json({error:error.message||"Server error."});
});

const HOST = process.env.HOST || "0.0.0.0";
const server = app.listen(PORT, HOST, ()=>{
  console.log(`RSR Shop V13.7 Realtime Proof & Chat Edition listening on http://${HOST}:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Uploads: ${UPLOADS_DIR}`);
  console.log(`Homepage file: ${INDEX_FILE} (${fs.existsSync(INDEX_FILE) ? "found" : "MISSING"})`);
  console.log(`Public URL: ${PUBLIC_BASE_URL}`);
  console.log(`Private admin portal: ${ADMIN_PORTAL_PATH}`);
});
server.on("error", error => {
  console.error("HTTP server failed:", error);
  process.exit(1);
});
process.on("unhandledRejection", error => console.error("Unhandled rejection:", error));
process.on("uncaughtException", error => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});
