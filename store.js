const fs = require("fs");
const path = require("path");

// مكان تخزين الطلبات. على الاستضافة اربطه بـ volume دايم عن طريق DATA_DIR
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const MENU_FILE = path.join(__dirname, "data", "menu.json"); // جزء من الكود (للقراءة بس)
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

const readJSON = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") {
      // الملف موجود بس بايظ: نحتفظ بنسخة منه بدل ما نكتب فوقه ونضيع الطلبات
      const backup = `${file}.corrupt-${Date.now()}`;
      try { fs.copyFileSync(file, backup); } catch {}
      console.error(`تحذير: ${file} غير صالح، اتحفظت نسخة في ${backup}`);
    }
    return fallback;
  }
};

// كتابة ذرّية: نكتب في ملف مؤقت وبعدين rename، فلو السيرفر وقع في النص الملف الأصلي مايتبوّظش
const writeJSON = (file, data) => {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
};

const getMenu = () => readJSON(MENU_FILE, []);
const getOrders = () => readJSON(ORDERS_FILE, []);

const addOrder = (order) => {
  const orders = getOrders();
  // رقم الطلب فريد حتى لو جه طلبين في نفس الميلي ثانية
  const last = orders.length ? orders[orders.length - 1].id : 0;
  order.id = Math.max(Date.now(), last + 1);
  orders.push(order);
  writeJSON(ORDERS_FILE, orders);
  return order;
};

const updateOrderStatus = (id, status) => {
  const orders = getOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  writeJSON(ORDERS_FILE, orders);
  return order;
};

module.exports = { getMenu, getOrders, addOrder, updateOrderStatus, DATA_DIR };
