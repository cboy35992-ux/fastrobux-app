"use strict";

require("dotenv").config();

const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "CHANGE_ME";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

for (const dir of [DATA_DIR, UPLOADS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]");
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, "[]");
if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
    instantStock: 50000,
    supportOnline: true,
    supportText: "Admin support is available"
  }, null, 2));
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOADS_DIR));
app.use(express.static(PUBLIC_DIR));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename: (_, file, cb) => {
    const ext = file.mimetype === "image/png" ? ".png" : ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
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

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2));
  fs.renameSync(temp, file);
}

function getOrders() {
  return readJson(ORDERS_FILE, []);
}

function saveOrders(orders) {
  writeJson(ORDERS_FILE, orders);
}

function getSettings() {
  return readJson(SETTINGS_FILE, {
    instantStock: 50000,
    supportOnline: true,
    supportText: "Admin support is available"
  });
}

function saveSettings(settings) {
  writeJson(SETTINGS_FILE, settings);
}

function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `RSR-${date}-${crypto.randomInt(1000, 9999)}`;
}

function requireAdmin(req, res, next) {
  if (req.get("x-admin-key") !== ADMIN_KEY) {
    return res.status(401).json({ error: "Wrong admin key." });
  }
  next();
}

async function sendDiscord(order) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "New RSR Shop Order",
          color: 9442302,
          fields: [
            { name: "Order", value: order.orderNumber, inline: true },
            { name: "Roblox", value: `${order.displayName} (@${order.username})`, inline: true },
            { name: "Method", value: order.method, inline: true },
            { name: "Amount", value: `${order.amount.toLocaleString()} Robux`, inline: true },
            { name: "Payment", value: `₱${order.payment.toFixed(2)} via ${order.paymentMethod}`, inline: true },
            { name: "Status Link", value: `${PUBLIC_BASE_URL}/status.html?order=${order.orderNumber}&token=${order.token}` }
          ],
          timestamp: new Date().toISOString()
        }]
      })
    });
  } catch (error) {
    console.error("Discord webhook failed:", error.message);
  }
}


function cleanExpiredSessions() {
  const now = Date.now();
  const sessions = readJson(SESSIONS_FILE, []).filter(item => new Date(item.expiresAt).getTime() > now);
  writeJson(SESSIONS_FILE, sessions);
  return sessions;
}

function createSession(userId) {
  const sessions = cleanExpiredSessions();
  const token = crypto.randomBytes(32).toString("hex");
  sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
  writeJson(SESSIONS_FILE, sessions);
  return token;
}

function sessionUser(req) {
  const auth = String(req.get("authorization") || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;

  const session = cleanExpiredSessions().find(item => item.token === token);
  if (!session) return null;

  const user = readJson(USERS_FILE, []).find(item => item.id === session.userId);
  if (!user) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt
  };
}

function requireCustomer(req, res, next) {
  const user = sessionUser(req);
  if (!user) return res.status(401).json({ error: "Please log in again." });
  req.customer = user;
  next();
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const fullName = String(req.body.fullName || "").trim().replace(/\s+/g, " ").slice(0, 80);
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (fullName.length < 2) return res.status(400).json({ error: "Enter your full name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 8) return res.status(400).json({ error: "Password must contain at least 8 characters." });

    const users = readJson(USERS_FILE, []);
    if (users.some(item => item.email === email)) {
      return res.status(409).json({ error: "An account already uses this email." });
    }

    const user = {
      id: crypto.randomUUID(),
      fullName,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      createdAt: new Date().toISOString()
    };

    users.push(user);
    writeJson(USERS_FILE, users);

    const token = createSession(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, createdAt: user.createdAt }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Account registration failed." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = readJson(USERS_FILE, []).find(item => item.email === email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const token = createSession(user.id);
    res.json({
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, createdAt: user.createdAt }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed." });
  }
});

app.get("/api/auth/me", requireCustomer, (req, res) => {
  res.json({ user: req.customer });
});

app.post("/api/auth/logout", requireCustomer, (req, res) => {
  const token = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const sessions = cleanExpiredSessions().filter(item => item.token !== token);
  writeJson(SESSIONS_FILE, sessions);
  res.json({ ok: true });
});

app.get("/api/customer/orders", requireCustomer, (req, res) => {
  const orders = getOrders()
    .filter(item => item.customerId === req.customer.id)
    .map(item => ({
      orderNumber: item.orderNumber,
      token: item.token,
      status: item.status,
      method: item.method,
      amount: item.amount,
      payment: item.payment,
      username: item.username,
      displayName: item.displayName,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
  res.json({ orders });
});

app.get("/api/health", (_, res) => {
  res.json({
    ok: true,
    version: "Fresh V3",
    storage: "local JSON",
    message: "Server is working."
  });
});

app.get("/api/settings", (_, res) => {
  res.json(getSettings());
});

app.get("/api/roblox/search", async (req, res) => {
  const username = String(req.query.username || "").trim();
  if (username.length < 3) {
    return res.status(400).json({ error: "Enter an exact Roblox username." });
  }

  try {
    const userResponse = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
    });

    if (!userResponse.ok) throw new Error("Roblox user service unavailable.");

    const userData = await userResponse.json();
    const user = userData.data?.[0];
    if (!user) return res.status(404).json({ error: "Roblox account not found." });

    const avatarResponse = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`
    );
    const avatarData = await avatarResponse.json();

    res.json({
      userId: user.id,
      username: user.name,
      displayName: user.displayName,
      avatarUrl: avatarData.data?.[0]?.imageUrl || ""
    });
  } catch (error) {
    res.status(502).json({ error: error.message || "Roblox lookup failed." });
  }
});

app.post("/api/orders", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload your receipt." });

    const body = req.body;
    const customer = sessionUser(req);
    const amount = Math.floor(Number(body.amount));
    const payment = Number(body.payment);

    if (!body.username || !body.robloxUserId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Search and select a valid Roblox account." });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Enter a valid Robux amount." });
    }

    if (!Number.isFinite(payment) || payment < 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Invalid payment calculation." });
    }

    const settings = getSettings();

    if (body.method === "Robux Instant") {
      if (amount < 10) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Instant minimum is 10 Robux." });
      }
      if (amount > settings.instantStock) {
        fs.unlinkSync(req.file.path);
        return res.status(409).json({ error: `Only ${settings.instantStock.toLocaleString()} Instant Robux are available.` });
      }
    }

    const order = {
      id: crypto.randomUUID(),
      customerId: customer?.id || null,
      customerEmail: customer?.email || "",
      orderNumber: orderNumber(),
      token: crypto.randomBytes(24).toString("hex"),
      status: "Pending Payment Review",
      method: String(body.method),
      taxOption: String(body.taxOption || "N/A"),
      amount,
      receiveAmount: Math.floor(Number(body.receiveAmount) || 0),
      requiredPassPrice: Math.floor(Number(body.requiredPassPrice) || 0),
      payment,
      paymentMethod: String(body.paymentMethod),
      senderName: String(body.senderName || "").trim(),
      referenceNumber: String(body.referenceNumber || "").trim(),
      robloxUserId: String(body.robloxUserId),
      username: String(body.username),
      displayName: String(body.robloxDisplayName || body.username),
      avatarUrl: String(body.robloxAvatarUrl || ""),
      gameName: String(body.gameName || ""),
      itemName: String(body.itemName || ""),
      giftDetails: String(body.giftDetails || ""),
      receiptPath: `/uploads/${req.file.filename}`,
      messages: [{
        sender: "system",
        text: "Order submitted. Wait for admin payment review.",
        createdAt: new Date().toISOString()
      }],
      history: [{
        status: "Pending Payment Review",
        createdAt: new Date().toISOString()
      }],
      stockDeducted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
    await sendDiscord(order);

    res.status(201).json({
      orderNumber: order.orderNumber,
      token: order.token,
      statusUrl: `/status.html?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.token)}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Order submission failed." });
  }
});

app.get("/api/orders/:orderNumber", (req, res) => {
  const order = getOrders().find(
    item => item.orderNumber === req.params.orderNumber && item.token === String(req.query.token || "")
  );
  if (!order) return res.status(404).json({ error: "Wrong order number or private token." });
  res.json(order);
});

app.post("/api/orders/:orderNumber/messages", (req, res) => {
  const orders = getOrders();
  const order = orders.find(
    item => item.orderNumber === req.params.orderNumber && item.token === String(req.body.token || "")
  );
  if (!order) return res.status(404).json({ error: "Wrong order number or private token." });

  const text = String(req.body.text || "").trim().slice(0, 1200);
  if (!text) return res.status(400).json({ error: "Message is empty." });

  order.messages.push({
    sender: "customer",
    text,
    createdAt: new Date().toISOString()
  });
  order.updatedAt = new Date().toISOString();
  saveOrders(orders);
  res.json({ ok: true });
});

app.get("/api/admin/orders", requireAdmin, (_, res) => {
  res.json({ orders: getOrders(), settings: getSettings() });
});

app.get("/api/admin/orders/:orderNumber", requireAdmin, (req, res) => {
  const order = getOrders().find(item => item.orderNumber === req.params.orderNumber);
  if (!order) return res.status(404).json({ error: "Order not found." });
  res.json(order);
});

app.post("/api/admin/orders/:orderNumber/messages", requireAdmin, (req, res) => {
  const orders = getOrders();
  const order = orders.find(item => item.orderNumber === req.params.orderNumber);
  if (!order) return res.status(404).json({ error: "Order not found." });

  const text = String(req.body.text || "").trim().slice(0, 1200);
  if (!text) return res.status(400).json({ error: "Message is empty." });

  order.messages.push({
    sender: "admin",
    text,
    createdAt: new Date().toISOString()
  });
  order.updatedAt = new Date().toISOString();
  saveOrders(orders);
  res.json({ ok: true });
});

app.patch("/api/admin/orders/:orderNumber/status", requireAdmin, (req, res) => {
  const allowed = [
    "Pending Payment Review",
    "Approved",
    "Processing",
    "Ready for Delivery",
    "Completed",
    "Declined"
  ];

  const status = String(req.body.status || "");
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status." });

  const orders = getOrders();
  const order = orders.find(item => item.orderNumber === req.params.orderNumber);
  if (!order) return res.status(404).json({ error: "Order not found." });

  const settings = getSettings();

  if (
    order.method === "Robux Instant" &&
    ["Approved", "Processing", "Ready for Delivery", "Completed"].includes(status) &&
    !order.stockDeducted
  ) {
    if (order.amount > settings.instantStock) {
      return res.status(409).json({ error: "Not enough Instant stock." });
    }
    settings.instantStock -= order.amount;
    order.stockDeducted = true;
    saveSettings(settings);
  }

  if (order.method === "Robux Instant" && status === "Declined" && order.stockDeducted) {
    settings.instantStock += order.amount;
    order.stockDeducted = false;
    saveSettings(settings);
  }

  order.status = status;
  order.history.push({ status, createdAt: new Date().toISOString() });
  order.messages.push({
    sender: "system",
    text: `Order status changed to ${status}.`,
    createdAt: new Date().toISOString()
  });
  order.updatedAt = new Date().toISOString();
  saveOrders(orders);

  res.json({ ok: true, order, settings });
});

app.patch("/api/admin/settings", requireAdmin, (req, res) => {
  const settings = getSettings();

  if (req.body.instantStock !== undefined) {
    const stock = Math.floor(Number(req.body.instantStock));
    if (!Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({ error: "Invalid stock." });
    }
    settings.instantStock = stock;
  }

  if (req.body.supportOnline !== undefined) {
    settings.supportOnline = Boolean(req.body.supportOnline);
  }

  if (req.body.supportText !== undefined) {
    settings.supportText = String(req.body.supportText).trim().slice(0, 120);
  }

  saveSettings(settings);
  res.json(settings);
});

app.get("*", (_, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.use((error, _, res, __) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Server error." });
});

app.listen(PORT, () => {
  console.log(`RSR Shop Fresh V3 running on port ${PORT}`);
});
