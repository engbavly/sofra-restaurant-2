const menuEl = document.getElementById("menu");
const tabsEl = document.getElementById("tabs");
const cartEl = document.getElementById("cart-items");
const totalEl = document.getElementById("total");
const msgEl = document.getElementById("msg");

let menu = [];
let category = "الكل";
const cart = {}; // { رقم الطبق: الكمية }

async function loadMenu() {
  const res = await fetch("/api/menu");
  menu = await res.json();
  renderTabs();
  renderMenu();
}

function renderTabs() {
  const cats = ["الكل", ...new Set(menu.map((d) => d.category))];
  tabsEl.innerHTML = "";
  cats.forEach((c) => {
    const b = document.createElement("button");
    b.textContent = c;
    b.className = c === category ? "active" : "";
    b.onclick = () => {
      category = c;
      renderTabs();
      renderMenu();
    };
    tabsEl.appendChild(b);
  });
}

function renderMenu() {
  menuEl.innerHTML = "";
  menu
    .filter((d) => category === "الكل" || d.category === category)
    .forEach((d) => {
      const row = document.createElement("article");
      row.className = "dish";
      const thumb = d.image ? `<img src="${d.image}" alt="${d.name}">` : d.emoji;
      row.innerHTML = `
        <div class="thumb">${thumb}</div>
        <div class="info">
          <div class="line"><h3>${d.name}</h3><i></i><b>${d.price} ج.م</b></div>
          <p>${d.desc}</p>
          <button class="btn add">أضف للطلب</button>
        </div>`;
      row.querySelector(".add").onclick = () => change(d.id, 1);
      menuEl.appendChild(row);
    });
}

function change(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  renderCart();
}

function renderCart() {
  cartEl.innerHTML = "";
  let total = 0;
  for (const id in cart) {
    const d = menu.find((m) => m.id === Number(id));
    total += d.price * cart[id];
    const li = document.createElement("li");
    li.innerHTML = `<span>${d.name} × ${cart[id]}</span>
      <span><button data-d="1">+</button> <button data-d="-1">−</button></span>`;
    li.querySelectorAll("button").forEach((b) => {
      b.onclick = () => change(Number(id), Number(b.dataset.d));
    });
    cartEl.appendChild(li);
  }
  totalEl.textContent = total;
}

document.getElementById("order-form").onsubmit = async (e) => {
  e.preventDefault();
  const items = Object.entries(cart).map(([id, qty]) => ({ id: Number(id), qty }));
  if (items.length === 0) {
    msgEl.textContent = "أضف طبق واحد على الأقل";
    return;
  }
  const body = { ...Object.fromEntries(new FormData(e.target)), items };
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.ok) {
    msgEl.textContent = `تم استلام طلبك رقم ${data.id}. الإجمالي ${data.total} ج.م`;
    for (const id in cart) delete cart[id];
    e.target.reset();
    renderCart();
  } else {
    msgEl.textContent = data.error || "حصلت مشكلة، جرّب تاني";
  }
};

loadMenu();
