// ================================
// 📦 BlackTea POS v2.3 - app.js (đã chỉnh chọn bàn kiểu icon ghế)
// ================================

// 🔢 Biến đếm đơn "Mang đi"
let demMangDi = 0;

// ✅ Tải dữ liệu khi mở trang
window.addEventListener("load", () => {
  try {
    const saved = localStorage.getItem("BT_TABLES");
    if (saved) hoaDonChinh = JSON.parse(saved); // ✅ đổi TABLES → hoaDonChinh
    loadDemMangDi();

    // Gọi render khi khởi động
    if (typeof renderTables === "function") renderTables();
  } catch (err) {
    console.error("Lỗi khi load dữ liệu:", err);
  }
});

// ✅ Lưu dữ liệu ra localStorage
function saveAll() {
  localStorage.setItem("BT_TABLES", JSON.stringify(hoaDonChinh)); // ✅ đổi TABLES → hoaDonChinh
}

// ✅ Lưu và tải bộ đếm mang đi (reset mỗi ngày)
function loadDemMangDi() {
  const data = JSON.parse(localStorage.getItem("BT_DEM_MANGDI") || "{}");
  const today = new Date().toLocaleDateString("vi-VN");

  if (data.date === today) {
    demMangDi = data.count || 0;
  } else {
    demMangDi = 0;
    localStorage.setItem("BT_DEM_MANGDI", JSON.stringify({ date: today, count: 0 }));
  }
}

function saveDemMangDi() {
  const today = new Date().toLocaleDateString("vi-VN");
  localStorage.setItem("BT_DEM_MANGDI", JSON.stringify({ date: today, count: demMangDi }));
}

// ✅ Sinh tên khách theo loại
function taoTenKhach(loai, maBan = "") {
  if (loai === "Khách mang đi") {
    demMangDi++;
    saveDemMangDi();
    return `Mang đi ${demMangDi}`;
  }

  if (loai.startsWith("Khách tại bàn")) {
    if (maBan.startsWith("L")) return `Bàn lầu ${maBan.slice(1)}`;
    if (maBan.startsWith("NT")) return `Bàn ngoài trời ${maBan.slice(2)}`;
    if (maBan.startsWith("T")) return `Bàn tường ${maBan.slice(1)}`;
    if (maBan.startsWith("G")) return `Bàn giữa ${maBan.slice(1)}`;
    if (maBan.startsWith("N")) return `Bàn nệm ${maBan.slice(1)}`;
  }

  return loai;
}

// ================================
// 🚀 Khởi động ứng dụng
// ================================
document.addEventListener("DOMContentLoaded", () => {
  khoiTaoUngDung();
});

function khoiTaoUngDung() {
  console.log("🚀 Khởi động BlackTea POS v2.3...");
  hienThiManHinhChinh();
}

function loadIcon(name, selector) {
  fetch(`icons/${name}.svg`)
    .then(res => res.text())
    .then(svg => {
      const el = document.querySelector(selector);
      if (el) el.innerHTML = svg;
    })
    .catch(err => console.error("Không tải được icon:", name));
}
// ================================
// 🏠 Màn hình chính
// ================================
function hienThiManHinhChinh() {
  const main = document.querySelector(".main-container");
  main.innerHTML = `
    <div class="btn-group">
      <button id="btnMangDi" class="btn hieuung-noi">Khách mang đi</button>
      <button id="btnGheQuan" class="btn hieuung-noi">Khách ghé quán</button>
    </div>

    <div class="table-list"></div>
  `;

  // 👉 Gắn sự kiện
  document.getElementById("btnMangDi").addEventListener("click", () => {
    khoiTaoOrder("Khách mang đi");
  });

  document.getElementById("btnGheQuan").addEventListener("click", () => {
    themKhachTaiQuan();
  });

  renderTables();
}



// ================================
// 🧾 Hiển thị danh sách đơn ngoài màn hình chính
// ================================
function renderTables() {
  const div = document.querySelector(".table-list");
  const dsDon = hoaDonChinh || [];

  if (dsDon.length === 0) {
    div.innerHTML = `<p class="empty-state">Chưa có đơn hàng nào</p>`;
    return;
  }

  div.innerHTML = dsDon
    .map((t, i) => {
      const tongTien = t.cart
        .reduce((a, m) => a + m.price * m.soluong, 0)
        .toLocaleString();
      const soMon = t.cart.length;
      const coGhiChu = t.cart.some((m) => m.note && m.note.trim() !== "");

      // lấy trạng thái từ đơn (nếu có)
      const trangThai = t.status || "waiting";
      const iconTrangThai = `<img src="icons/caphe.svg" class="icon-app" alt="Cà phê">`;
      const iconNote = coGhiChu
        ? `<i class="fa-solid fa-note-sticky note"></i>`
        : "";

      return `
        <div class="order-card ${trangThai}" data-index="${i}">
          <div class="order-left">
            <div class="order-name">${t.name}</div>
            <div class="order-info">${soMon} món • ${tongTien}đ</div>
            <div class="order-time">
              ${new Date(t.createdAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div class="status-box ${trangThai}">
            ${iconTrangThai}
            ${iconNote}
          </div>
        </div>
      `;
    })
    .join("");

  // 🧩 Gắn sự kiện click để mở chi tiết (sau này có thể thêm moChiTietDon)
  div.querySelectorAll(".order-card").forEach((card) => {
    card.addEventListener("click", () => {
      const index = parseInt(card.dataset.index);
      const don = dsDon[index];
      if (!don) return;
      // 👉 Sau này bạn có thể thay dòng này bằng moChiTietDon(don)
      moChiTietDon(don.id);
    });
  });
}

// ================================
// 🪑 Popup chọn bàn kiểu icon ghế
// ================================
function themKhachTaiQuan() {
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const popup = document.createElement("div");
  popup.className = "popup-table";

  popup.innerHTML = `
    <fieldset>
      <legend>Bàn trên lầu</legend>
      <div class="group">
        ${["L1","L2","L3","L4"].map(b => `
          <div class="icon-box" onclick="chonBanIcon(this,'${b}')">
            <i class="fas fa-couch"></i>
            <span>${b}</span>
          </div>
        `).join("")}
      </div>
    </fieldset>

    <fieldset>
      <legend>Bàn ngoài trời</legend>
      <div class="group">
        ${["NT1","NT2"].map(b => `
          <div class="icon-box" onclick="chonBanIcon(this,'${b}')">
            <i class="fas fa-couch"></i>
            <span>${b}</span>
          </div>
        `).join("")}
      </div>
    </fieldset>

    <div class="table-row">
      <fieldset class="table-col">
        <legend>Bàn tường</legend>
        <div class="group-vertical">
          ${["T1","T2","T3","T4"].map(b => `
            <div class="icon-box" onclick="chonBanIcon(this,'${b}')">
              <i class="fas fa-couch"></i>
              <span>${b}</span>
            </div>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="table-col">
        <legend>Bàn giữa</legend>
        <div class="group-vertical">
          ${["G1","G2","G3","G4"].map(b => `
            <div class="icon-box" onclick="chonBanIcon(this,'${b}')">
              <i class="fas fa-couch"></i>
              <span>${b}</span>
            </div>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="table-col">
        <legend>Bàn nệm</legend>
        <div class="group-vertical">
          ${["N1","N2","N3","N4"].map(b => `
            <div class="icon-box" onclick="chonBanIcon(this,'${b}')">
              <i class="fas fa-couch"></i>
              <span>${b}</span>
            </div>
          `).join("")}
        </div>
      </fieldset>
    </div>

    <div class="popup-actions">
      <button class="btn-cancel hieuung-nhat">Huỷ</button>
      <button class="btn-primary hieuung-noi">Chọn bàn</button>
    </div>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  let banDuocChon = null;

  // Sự kiện cho các nút
  popup.querySelector(".btn-cancel").addEventListener("click", () => overlay.remove());

  popup.querySelector(".btn-primary").addEventListener("click", () => {
    if (!banDuocChon) {
      hienThongBao("Vui lòng chọn bàn");
      return;
    }
    overlay.remove();

    const tenDon = taoTenKhach("Khách tại bàn", banDuocChon);
    khoiTaoOrder(tenDon);
  });

  // Hàm chọn bàn icon
  window.chonBanIcon = function (el, maBan) {
    popup.querySelectorAll(".icon-box").forEach(e => e.classList.remove("active"));
    el.classList.add("active");
    banDuocChon = maBan;
  };
}

// ================================
// 🧾 Mở chi tiết đơn full màn hình
// ================================
// ================================
// 🧾 MỞ CHI TIẾT ĐƠN
// ================================
function moChiTietDon(id) {
  const don = hoaDonChinh.find(d => d.id === id);
  if (!don) {
    console.warn("Không tìm thấy đơn:", id);
    return;
  }

  const main = document.querySelector(".main-container");
  const header = document.querySelector("header");

  // 💡 Thay thanh head cũ = thanh gọn: tên bàn + nút X
  header.innerHTML = `
    <div class="header-left">
      <h1>${don.name}</h1>
    </div>
    <div class="header-right">
      <button id="btnCloseChiTiet" class="btn-close">×</button>
    </div>
  `;

  // 💡 Nội dung chính của đơn
  main.innerHTML = `
    <div class="order-detail">
      <div class="order-content">
        ${don.cart.map(m => `
          <div class="mon-item">
            <div class="mon-left">
              <div class="mon-name">${m.name}</div>
              ${m.note ? `<div class="mon-note">${m.note}</div>` : ""}
            </div>
            <div class="mon-right">
              <span class="mon-qty">x${m.soluong}</span>
              <span class="mon-price">${(m.price * m.soluong).toLocaleString()}đ</span>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="order-total">
        Tổng cộng: <strong>${don.cart.reduce((a, m) => a + m.price * m.soluong, 0).toLocaleString()}đ</strong>
      </div>

      <div class="order-confirm">
        <div class="slider-container" id="sliderConfirm">
          <div class="slider-bg">Kéo để xác nhận đơn</div>
          <div class="slider-thumb"><i class="fas fa-mug-hot"></i></div>
        </div>
      </div>
    </div>
  `;

  // 🔙 Nút thoát
  document.getElementById("btnCloseChiTiet").addEventListener("click", () => {
    header.innerHTML = `
      <h1>BlackTea</h1>
      <div class="header-icons">
        <span class="icon-btn"><i class="fas fa-clock-rotate-left" style="color:white;"></i></span>
        <span class="icon-btn"><i class="fas fa-gear" style="color:white;"></i></span>
      </div>
    `;
    hienThiManHinhChinh();
    renderTables();
  });

  // 🎚️ Gọi hiệu ứng kéo xác nhận
  khoiTaoSliderConfirm(don);
}


function khoiTaoSliderConfirm(don) {
  const container = document.getElementById("sliderConfirm");
  const thumb = container.querySelector(".slider-thumb");
  const bg = container.querySelector(".slider-bg");

  let isDragging = false;
  let startX = 0;

  thumb.addEventListener("mousedown", start);
  thumb.addEventListener("touchstart", start);

  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move);

  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);

  function start(e) {
    isDragging = true;
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    container.classList.add("active");
  }

  function move(e) {
    if (!isDragging) return;
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    let offset = currentX - startX;
    if (offset < 0) offset = 0;
    if (offset > container.offsetWidth - thumb.offsetWidth) offset = container.offsetWidth - thumb.offsetWidth;
    thumb.style.transform = `translateX(${offset}px)`;
  }

  function end() {
    if (!isDragging) return;
    isDragging = false;

    const successThreshold = container.offsetWidth - thumb.offsetWidth - 10;
    const currentOffset = parseFloat(thumb.style.transform.replace("translateX(", "").replace("px)", "")) || 0;

    if (currentOffset >= successThreshold) {
      bg.innerText = "✅ Đã xác nhận!";
      container.classList.add("confirmed");
      thumb.style.transform = `translateX(${successThreshold}px)`;

      // ✅ Đổi trạng thái đơn → đang phục vụ
      don.status = "serving";
      saveAll();
      setTimeout(() => {
        hienThongBao("Đơn đã chuyển sang 'Đang phục vụ'");
      }, 300);
    } else {
      thumb.style.transform = "translateX(0)";
      container.classList.remove("active");
    }
  }
}

// icons-inject.js - inject SVG từ /icons/*.svg
(function () {
  const ICON_PATH = 'icons/';
  const cache = new Map();

  async function fetchSvg(name) {
    if (cache.has(name)) return cache.get(name);
    try {
      const res = await fetch(`${ICON_PATH}${name}.svg`, { cache: 'no-cache' });
      if (!res.ok) throw new Error('Fetch failed ' + res.status);
      const text = await res.text();
      cache.set(name, text);
      return text;
    } catch (err) {
      console.error('injectIcons fetch error', name, err);
      cache.set(name, null);
      return null;
    }
  }

  function injectInto(targetEl, svgText) {
    if (!targetEl) return;
    if (!svgText) {
      targetEl.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect width="100%" height="100%" fill="currentColor" opacity="0.06"/></svg>`;
      return;
    }
    targetEl.innerHTML = svgText.replace(/<\?xml.*?\?>\s*/,'').trim();
  }

  async function injectAll(root = document) {
    const nodes = Array.from(root.querySelectorAll('[data-icon]'));
    const byName = new Map();

    for (const node of nodes) {
      const name = node.getAttribute('data-icon');
      if (!name) continue;
      const target = node.querySelector('.icon-app') || node;
      if (!target) continue;
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(target);
    }

    for (const [name, targets] of byName.entries()) {
      let svgText = cache.has(name) ? cache.get(name) : undefined;
      if (typeof svgText === 'undefined') svgText = await fetchSvg(name);
      targets.forEach(t => injectInto(t, svgText));
    }
  }

  document.addEventListener('DOMContentLoaded', () => injectAll().catch(e => console.error(e)));

  const observer = new MutationObserver((mutations) => {
    let added = false;
    for (const m of mutations) {
      for (const n of m.addedNodes || []) {
        if (n.nodeType === 1 && (n.matches && n.matches('[data-icon]') || n.querySelector && n.querySelector('[data-icon]'))) {
          added = true; break;
        }
      }
      if (added) break;
    }
    if (added) {
      clearTimeout(window.__ICON_INJECT_TIMEOUT);
      window.__ICON_INJECT_TIMEOUT = setTimeout(() => injectAll().catch(()=>{}), 80);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.__IconInjector = { injectAll, fetchSvg };
})();
