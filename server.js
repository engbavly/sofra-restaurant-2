const express = require("express");
const crypto = require("crypto");
const path = require("path");
const store = require("./store");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (IS_PROD ? "" : "admin123");

if (!ADMIN_PASSWORD) {
  console.error("لازم تحدد ADMIN_PASSWORD في بيئة الإنتاج");
  process.exit(1);
}

app.disable("x-powered-by");
app.set("trust proxy", 1); // الاستضافات بتحط reverse proxy قدام السيرفر
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/healthz", (req, res) => res.send("ok"));

// 1) المنيو
app.get("/api/menu", (req, res) => res.json(store.getMenu()));

// 2) تسجيل طلب جديد (السعر بيتحسب في السيرفر، مش بنثق في الأسعار اللي جاية من المتصفح)
app.post("/api/orders", (req, res) => {
  const { name, phone, address, notes, items } = req.body || {};
  if (!name || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "بيانات الطلب ناقصة" });
  }
  if (items.length > 30) {
    return res.status(400).json({ error: "عدد الأصناف كبير" });
  }
  const menu = store.getMenu();
  let total = 0;
  const lines = [];
  for (const it of items) {
    const dish = menu.find((m) => m.id === it.id);
    const qty = Number(it.qty);
    if (!dish || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      return res.status(400).json({ error: "الطلب فيه طبق غير صالح" });
    }
    total += dish.price * qty;
    lines.push({ id: dish.id, name: dish.name, price: dish.price, qty });
  }
  const order = store.addOrder({
    name: String(name).slice(0, 80),
    phone: String(phone).slice(0, 20),
    address: String(address).slice(0, 200),
    notes: String(notes || "").slice(0, 200),
    items: lines,
    total,
    status: "جديد",
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ id: order.id, total });
});

// 3) لوحة الإدارة: كلمة سر + حد لمحاولات الدخول الغلط
const fails = new Map(); // ip -> { count, resetAt }
const MAX_FAILS = 10;
const WINDOW_MS = 15 * 60 * 1000;

const safeEqual = (a, b) => {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

const admin = (req, res, next) => {
  const now = Date.now();
  const rec = fails.get(req.ip);
  if (rec && rec.resetAt > now && rec.count >= MAX_FAILS) {
    return res.status(429).json({ error: "محاولات كتير، جرّب بعد شوية" });
  }
  if (safeEqual(req.get("x-admin-password") || "", ADMIN_PASSWORD)) {
    fails.delete(req.ip);
    return next();
  }
  const cur = rec && rec.resetAt > now ? rec : { count: 0, resetAt: now + WINDOW_MS };
  cur.count++;
  fails.set(req.ip, cur);
  res.status(401).json({ error: "غير مصرح" });
};

app.get("/api/orders", admin, (req, res) =>
  res.json(store.getOrders().reverse())
);

app.patch("/api/orders/:id", admin, (req, res) => {
  const status = req.body && req.body.status === "تم" ? "تم" : "جديد";
  const order = store.updateOrderStatus(Number(req.params.id), status);
  if (!order) return res.status(404).json({ error: "الطلب مش موجود" });
  res.json(order);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Orders stored in: ${store.DATA_DIR}`);
});
