// ===============================
// ☕ ORDER.JS - BlackTea v2.3 (có logic sao động)
// ===============================

let hoaDonTam = [];
let loaiKhachHienTai = "";

// -------------------------------
// Khởi tạo màn hình Order
function khoiTaoOrder(loaiKhach) {
  loaiKhachHienTai = loaiKhach;

  const header = document.querySelector("header");
  header.innerHTML = `
    <h1>${loaiKhach}</h1>
    <div class="header-icons">
      <button class="btn-close-order" id="btnCloseHeader">×</button>
    </div>
  `;

  document.getElementById("btnCloseHeader").addEventListener("click", () => {
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

  const main = document.querySelector(".main-container");
main.innerHTML = `
  <div class="order-container">

    <div class="order-search">
      <input type="text" id="timMonInput" placeholder="Tìm món..." oninput="timMon()" />
    </div>

    <div class="order-categories" id="danhMucContainer"></div>

    <!-- 🔹 Danh sách món (cuộn được) -->
    <div class="order-content">
      <div class="order-list" id="dsMon"></div>
    </div>

    <!-- 🔹 Hóa đơn tạm (cố định, không cuộn, nội dung bên trong cuộn) -->
    <div class="hoa-don-tam empty" id="hoaDonTam">Chưa có món nào</div>

    <!-- 🔹 Thanh tổng / footer (cố định đáy) -->
    <div class="order-footer">
  <div class="order-total">
    <button class="btn-buy" data-icon="muahang" aria-label="Mua hàng">
  <span class="icon-app" aria-hidden="true"></span>
</button>

    <span id="tongTien">0đ</span>
</div>
  <div class="order-buttons">
    <button id="btnDatLai" class="hieuung-nhat">Đặt lại</button>
    <button id="btnLuuDon" class="btn-primary hieuung-noi">Lưu đơn</button>
  </div>
</div>

  </div>
`;

  taoDanhMuc();
  hienThiMonTheoDanhMuc("");

  document.getElementById("btnDatLai").addEventListener("click", datLai);
  document.getElementById("btnLuuDon").addEventListener("click", luuDon);
  setTimeout(updateOrderOffsets, 100); // đợi render xong rồi tính lại
}

// -------------------------------
function taoDanhMuc() {
  const dsDanhMuc = [...new Set(MENU.map((m) => m.cat))];
  const container = document.getElementById("danhMucContainer");
  container.innerHTML = "";

  dsDanhMuc.forEach((ten) => {
    const btn = document.createElement("button");
    btn.className = "danh-muc-btn";
    btn.textContent = ten;
    btn.onclick = () => {
      document.querySelectorAll(".danh-muc-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      hienThiMonTheoDanhMuc(ten);
    };
    container.appendChild(btn);
  });
}

// -------------------------------
// Hiển thị danh sách món
function hienThiMonTheoDanhMuc(danhMuc) {
  const dsMon = document.getElementById("dsMon");
  dsMon.innerHTML = "";

  const loc = danhMuc === "" ? MENU : MENU.filter((m) => m.cat === danhMuc);

  loc.forEach((mon) => {
    const sl = timSoLuong(mon.id);
    const div = document.createElement("div");
    div.className = "mon-item";
    div.innerHTML = `
      <div>
        <div class="mon-ten">${mon.name}</div>
        <div class="mon-gia">${mon.price.toLocaleString()}₫</div>
      </div>
      <div class="mon-qty" id="qty-${mon.id}">
  <button class="note-btn ${sl > 0 ? '' : 'faded'}"
          onclick="if(${sl} > 0) toggleNotePopup(MENU.find(m => m.id === ${mon.id}), this)">
    <i class="fa-regular fa-star"></i>
  </button>

  <button class="btn-minus ${sl > 0 ? '' : 'faded'}"
          onclick="if(${sl} > 0) giamMon(${mon.id})">
    <i class="fa-solid fa-minus"></i>
  </button>

  <span id="sl-${mon.id}">${sl}</span>

  <button class="btn-plus" onclick="themMon(${mon.id})">
    <button class="note-btn" data-icon="ngoisao">
  <span class="icon-app" aria-hidden="true"></span>
</button>

  </button>
</div>
    `;
    dsMon.appendChild(div);
  });
}

// -------------------------------
// Thêm / giảm món
function timSoLuong(id) {
  const mon = hoaDonTam.find((m) => m.id === id);
  return mon ? mon.soluong : 0;
}

// ================================
// THÊM MÓN
function themMon(id, note = "") {
  const mon = MENU.find((m) => m.id === id);
  if (!mon) return;

  // Kiểm tra món có cùng id + note
  const tonTai = hoaDonTam.find(
    (m) => m.id === id && (m.note || "") === (note || "")
  );

  if (tonTai) tonTai.soluong++;
  else hoaDonTam.push({ ...mon, soluong: 1, note });

  capNhatHoaDon();

  // Cập nhật phần hiển thị số lượng gộp (theo id)
  const slTong = hoaDonTam
    .filter((m) => m.id === id)
    .reduce((sum, m) => sum + m.soluong, 0);

  const qtyBox = document.querySelector(`#qty-${id}`);
  if (qtyBox) {
    const noteBtn = qtyBox.querySelector(".note-btn");
    const giamBtn = qtyBox.querySelector(".btn-minus");
    const slEl = document.getElementById(`sl-${id}`);

    if (slEl) slEl.textContent = slTong;
    if (noteBtn) noteBtn.classList.remove("faded");
    if (giamBtn) giamBtn.classList.remove("faded");

    noteBtn.setAttribute(
      "onclick",
      `toggleNotePopup(MENU.find(m => m.id === ${id}), this)`
    );
    giamBtn.setAttribute("onclick", `giamMon(${id})`);
  }
}

// ================================
// GIẢM MÓN
function giamMon(id, note = "") {
  const noteNorm = (note || "").trim();
  let idx = -1;

  // 1️⃣ Nếu có note: trừ đúng món ghi chú đó
  if (noteNorm) {
    idx = hoaDonTam.findIndex(
      (m) => m.id === id && (m.note || "").trim() === noteNorm && m.isNoteOnly
    );
  }

  // 2️⃣ Nếu không có note: trừ món thường (không ghi chú)
  if (idx === -1 && !noteNorm) {
    idx = hoaDonTam.findIndex((m) => m.id === id && !m.isNoteOnly);
  }

  // 3️⃣ Nếu món thường không còn, thử trừ món ghi chú đầu tiên (đảm bảo tổng luôn giảm)
  if (idx === -1) {
    idx = hoaDonTam.findIndex((m) => m.id === id && m.isNoteOnly);
  }

  if (idx > -1) {
    hoaDonTam[idx].soluong--;
    if (hoaDonTam[idx].soluong <= 0) hoaDonTam.splice(idx, 1);
  }

  // 🔄 Cập nhật lại tổng số lượng gộp cho ô menu
  const slTong = hoaDonTam
    .filter((m) => m.id === id)
    .reduce((sum, m) => sum + m.soluong, 0);

  const qtyBox = document.querySelector(`#qty-${id}`);
  if (qtyBox) {
    const slEl = document.getElementById(`sl-${id}`);
    const noteBtn = qtyBox.querySelector(".note-btn");
    const giamBtn = qtyBox.querySelector(".btn-minus");

    if (slEl) slEl.textContent = slTong;

    if (slTong === 0) {
      if (noteBtn) {
        noteBtn.classList.add("faded");
        noteBtn.removeAttribute("onclick");
      }
      if (giamBtn) {
        giamBtn.classList.add("faded");
        giamBtn.removeAttribute("onclick");
      }
    }
  }

  capNhatHoaDon();
}

// ================================
// CẬP NHẬT HÓA ĐƠN
function capNhatHoaDon() {
  const hdDiv = document.getElementById("hoaDonTam");
  hdDiv.innerHTML = "";
  hdDiv.classList.remove("empty");

  if (hoaDonTam.length === 0) {
    hdDiv.classList.add("empty");
    hdDiv.textContent = "Chưa có món nào";
  } else {
    hoaDonTam.forEach((m) => {
      const dong = document.createElement("div");
      dong.className = "hoa-don-item";

      // ✅ Nếu tên đã có ngoặc thì không chèn note nữa
      const hienTen = m.name.includes("(")
        ? m.name
        : m.note
        ? `${m.name} (${m.note})`
        : m.name;

      dong.innerHTML = `
        <span>
          ${hienTen} x${m.soluong}
        </span>
        <span>${(m.price * m.soluong).toLocaleString()}₫</span>
      `;

      hdDiv.appendChild(dong);
    });
  }

  // ✅ Tổng tiền
  const tong = hoaDonTam.reduce((t, m) => t + m.price * m.soluong, 0);
  document.getElementById("tongTien").textContent = `${tong.toLocaleString()}₫`;

  // ✅ Cập nhật lại số lượng tổng trong menu
  MENU.forEach((mon) => {
    const slTong = hoaDonTam
      .filter((m) => m.id === mon.id)
      .reduce((sum, m) => sum + m.soluong, 0);
    const slEl = document.getElementById(`sl-${mon.id}`);
    if (slEl) slEl.textContent = slTong;
  });
}

// -------------------------------
// Đặt lại đơn
function datLai() {
  hoaDonTam = [];
  capNhatHoaDon();
  hienThiMonTheoDanhMuc("");
}

// -------------------------------
// -------------------------------
// Lưu đơn
function luuDon() {
  if (hoaDonTam.length === 0) {
    hienThongBao("Chưa có món nào để lưu");
    return;
  }

  if (loaiKhachHienTai === "Khách mang đi") {
    loaiKhachHienTai = taoTenKhach("Khách mang đi");
  }

  const donMoi = {
    id: Date.now(),
    name: loaiKhachHienTai,
    cart: [...hoaDonTam],
    createdAt: Date.now()
  };

  // ✅ Đổi TABLES → hoaDonChinh để đồng bộ với tables.js mới
  hoaDonChinh.push(donMoi);
  saveAll();

  hoaDonTam = [];
  capNhatHoaDon();

  hienThongBao("Đã lưu đơn");

  const header = document.querySelector("header");
  header.innerHTML = `
    <h1>BlackTea</h1>
     <div class="header-icons">
      <span class="icon-btn"><i class="fas fa-clock-rotate-left" style="color:white;"></i></span>
      <span class="icon-btn"><i class="fas fa-gear" style="color:white;"></i></span>
     </div>
  `;

  hienThiManHinhChinh();
  renderTables();
}

// -------------------------------
// Tìm món theo từ khóa
function timMon() {
  const input = document.getElementById("timMonInput");
  if (!input) return;

  const keyword = input.value.toLowerCase().trim();
  const items = document.querySelectorAll("#dsMon .mon-item");

  // 👉 Hàm bỏ dấu + chuẩn hóa
  const normalize = (str) => str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

  const kw = normalize(keyword);

  // 🧩 Nếu chưa gõ gì → hiện tất cả
  if (kw === "") {
    items.forEach(item => item.style.display = "");
    return;
  }

  items.forEach(item => {
    const tenMon = item.querySelector(".mon-ten")?.textContent || "";
    const text = normalize(tenMon);
    const initials = text.split(" ").map(w => w[0]).join("");
    const compactText = text.replace(/\s+/g, "");

    const match =
      compactText.includes(kw) ||
      text.includes(kw) ||
      initials.includes(kw);

    item.style.display = match ? "" : "none";
  });
}


// =============================================
// 📏 Tự tính khoảng trống hiển thị cho danh sách món
// =============================================
function updateOrderOffsets() {
  const header = document.querySelector('header');
  const search = document.querySelector('.order-search');
  const categories = document.querySelector('.order-categories');
  const hoaDon = document.querySelector('.hoa-don-tam');
  const footer = document.querySelector('.order-footer');

  const gap = 10;
  const headerH = header ? header.offsetHeight : 0;
  const searchH = search ? search.offsetHeight : 0;
  const catH = categories ? categories.offsetHeight : 0;
  const hoaDonH = hoaDon ? hoaDon.offsetHeight : 0;
  const footerH = footer ? footer.offsetHeight : 0;

  // top = header + 10 + search + 10 + categories + 10
  const topPx = headerH + gap + searchH + gap + catH + gap;
  // bottom = hoa-don + 10 + footer + 10
  const bottomPx = hoaDonH + gap + footerH + gap;

  document.documentElement.style.setProperty('--order-top', `${topPx}px`);
  document.documentElement.style.setProperty('--order-bottom', `${bottomPx}px`);
}

// Sau khi render xong popup, gọi updateOffset:
window.addEventListener('resize', updateOrderOffsets);



// === Tự động bỏ lọc danh mục khi click vào ô tìm món ===
function kichHoatTimMon() {
  const input = document.getElementById("timMonInput");
  if (!input) return;

  // Xóa listener cũ nếu có (tránh gắn trùng khi gọi lại)
  input.removeEventListener("focus", onFocusSearch);

  function onFocusSearch() {
    // Bỏ trạng thái nút danh mục đang chọn
    document.querySelectorAll(".danh-muc-btn.active").forEach(btn => {
      btn.classList.remove("active");
    });

    // Gọi lại toàn bộ danh sách món (bỏ lọc danh mục)
    if (typeof hienThiMonTheoDanhMuc === "function") {
      hienThiMonTheoDanhMuc(""); // truyền "" để hiển tất cả
    }
  }

  input.addEventListener("focus", onFocusSearch);
}

// Gọi lặp lại để đảm bảo input tồn tại (vì đôi khi DOM tạo sau load)
document.addEventListener("DOMContentLoaded", () => {
  kichHoatTimMon();
  // kiểm tra lại sau một chút
  setTimeout(kichHoatTimMon, 500);
  setTimeout(kichHoatTimMon, 1500);
});








