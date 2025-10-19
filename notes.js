// ===============================
// 📝 notes.js - popup ghi chú (Đường / Đá) - BlackTea v2.3
// ===============================

function toggleNotePopup(item, btn) {
  // 🧠 Xác định nguồn dữ liệu (currentTable hoặc hoaDonTam)
  let cartRef = null;
  if (typeof currentTable !== "undefined" && currentTable && currentTable.cart) {
    cartRef = currentTable.cart;
  } else if (typeof hoaDonTam !== "undefined") {
    cartRef = hoaDonTam;
  } else {
    hienThongBao("⚠️ Chưa có đơn hoặc bàn nào được chọn!");
    return;
  }

  // Nếu đã có popup cũ thì remove
  const existing = document.querySelector(".popup-note");
  if (existing) existing.remove();

  // Mặc định: Bình thường
  item.sugarLevel = 2;
  item.iceLevel = 3;

  // Giao diện popup
  const popup = document.createElement("div");
  popup.className = "popup-note";
  popup.innerHTML = `
    <div class="popup-row">
      <div class="row-top">
        <label>Độ ngọt:</label>
        <span class="slider-label">${getSugarLabels()[item.sugarLevel]}</span>
      </div>
      <input type="range" min="0" max="4" step="1" value="${item.sugarLevel}" class="slider" data-type="sugar">
    </div>

    <div class="popup-row">
      <div class="row-top">
        <label>Mức đá:</label>
        <span class="slider-label">${getIceLabels()[item.iceLevel]}</span>
      </div>
      <input type="range" min="0" max="3" step="1" value="${item.iceLevel}" class="slider" data-type="ice">
    </div>

    <div class="popup-actions">
      <button class="cancel">✖</button>
      <button class="confirm">✔</button>
    </div>
  `;
  document.body.appendChild(popup);
  positionPopupNearButton(popup, btn);

  // 🎚 Cập nhật slider
  popup.querySelectorAll(".slider").forEach((slider) => {
    slider.addEventListener("input", (e) => {
      const lvl = parseInt(e.target.value);
      const type = e.target.dataset.type;
      const label = e.target
        .closest(".popup-row")
        .querySelector(".slider-label");

      if (type === "sugar") {
        item.sugarLevel = lvl;
        label.textContent = getSugarLabels()[lvl];
      } else if (type === "ice") {
        item.iceLevel = lvl;
        label.textContent = getIceLabels()[lvl];
      }
    });
  });

  // -----------------
  // Xử lý nút bấm
  popup.addEventListener("click", async (ev) => {
    ev.stopPropagation();

    // ❌ Hủy
    if (ev.target.classList.contains("cancel")) {
      popup.remove();
      return;
    }

    // ✅ Xác nhận
    if (ev.target.classList.contains("confirm")) {
      const sugarLabel = getSugarLabels()[item.sugarLevel];
      const iceLabel = getIceLabels()[item.iceLevel];
      const isNormalSugar = sugarLabel === "Bình thường";
      const isNormalIce = iceLabel === "Bình thường";

      // Nếu cả hai đều bình thường → bỏ sao, không ghi chú
      if (isNormalSugar && isNormalIce) {
        btn.classList.remove("active");
        const icon = btn.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-solid");
          icon.classList.add("fa-regular");
        }
        popup.remove();
        return;
      }

      // Clone món ghi chú (Đơn ảo)
      const baseQty = cartRef.find((it) => it.id === item.id)?.soluong || 0;
      const noteCount = cartRef.filter(
        (it) => it.id === item.id && it.isNoteOnly
      ).length;
      if (noteCount >= baseQty) {
        hienThongBao(`Đã ghi chú đủ ${baseQty} ly cho món "${item.name}"`);
        return;
      }

      // 🧩 Giảm 1 ly từ món gốc nếu còn
      const goc = cartRef.find((it) => it.id === item.id && !it.isNoteOnly);
      if (goc && goc.soluong > 0) {
        goc.soluong--;
        if (goc.soluong === 0) {
          const idx = cartRef.indexOf(goc);
          if (idx > -1) cartRef.splice(idx, 1);
        }
      }

      // 🆕 Tạo món có ghi chú gọn, tránh lặp tên
      const newItem = JSON.parse(JSON.stringify(item));
      newItem.isNoteOnly = true;

      // 🧹 Loại bỏ phần "(...)" nếu có trong tên cũ
      let baseName = item.name;
      if (baseName.includes("(")) baseName = baseName.split("(")[0].trim();

      // Chỉ thêm phần khác “Bình thường”
      const ghiChuParts = [];
      if (!isNormalSugar) ghiChuParts.push(sugarLabel);
      if (!isNormalIce) ghiChuParts.push(iceLabel);

      newItem.note = ghiChuParts.join(", ");
      newItem.name = ghiChuParts.length
        ? `${baseName} (${newItem.note})`
        : baseName;
      newItem.soluong = 1;
      newItem.price = item.price;

      cartRef.push(newItem);

      // ⭐ Cập nhật sao (tô đặc)
      btn.classList.add("active");
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");
      }

      try {
        if (typeof capNhatHoaDon === "function") capNhatHoaDon();
        if (typeof saveAll === "function") await saveAll();
        if (typeof renderTables === "function") renderTables();
      } catch (err) {
        console.error("❌ Lỗi khi cập nhật ghi chú:", err);
      }

      popup.remove();
    }
  });

  // Tự đóng khi click ra ngoài
  setTimeout(() => {
    document.addEventListener(
      "click",
      function onDocClick(ev) {
        if (!popup.contains(ev.target)) popup.remove();
      },
      { once: true }
    );
  }, 100);
}

// ----------------------
// Helpers
function getSugarLabels() {
  return ["Không ngọt", "Ít ngọt", "Bình thường", "Ngọt vừa", "Ngọt nhiều"];
}
function getIceLabels() {
  return ["Không đá", "Ít đá", "Đá vừa", "Bình thường"];
}

// ----------------------
// Helpers
// ----------------------
function getSugarLabels() {
  return ['Không ngọt', 'Ít ngọt', 'Bình thường', 'Ngọt vừa', 'Ngọt nhiều'];
}

function getIceLabels() {
  return ['Không đá', 'Ít đá', 'Đá vừa', 'Bình thường'];
}

function positionPopupNearButton(popup, btn) {
  // 📌 Lấy vị trí nút sao
  const rect = btn.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

  // 📦 Ẩn popup tạm để đo đúng kích thước mà không gây reflow
  popup.style.visibility = "hidden";
  popup.style.display = "block";
  const popupWidth = popup.offsetWidth;
  const popupHeight = popup.offsetHeight;
  popup.style.visibility = "";
  popup.style.display = "";

  // 🧭 Tính toán vị trí
  let top = rect.bottom + scrollTop + 6;
  const screenHeight = window.innerHeight;
  if (rect.bottom + popupHeight > screenHeight - 10)
    top = rect.top + scrollTop - popupHeight - 6;

  // Căn giữa popup ngay dưới nút sao
  let left = rect.left + scrollLeft + rect.width / 2 - popupWidth / 2;
  const screenWidth = window.innerWidth;
  if (left < 6) left = 6;
  if (left + popupWidth > screenWidth - 6)
    left = screenWidth - popupWidth - 6;

  // 🧩 Áp dụng vị trí cuối cùng
  popup.style.position = "absolute";
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
  popup.style.transform = "none"; // bỏ translateX(-50%) gây rung
  popup.style.transition = "opacity 0.12s ease, transform 0.12s ease";
  popup.style.zIndex = 1000;
}


// ===============================
// 🔔 Thông báo ngắn (hiện rồi tự tắt)
// ===============================
function hienThongBao(noiDung, loai = "thanhcong", thoigian = 2000) {
  const tb = document.createElement("div");
  tb.className = `thong-bao ${loai}`;
  tb.textContent = noiDung;
  document.body.appendChild(tb);

  setTimeout(() => tb.classList.add("hien"), 10);
  setTimeout(() => tb.classList.remove("hien"), thoigian);
  setTimeout(() => tb.remove(), thoigian + 300);
}

// ===============================
// ⚙️ Hộp xác nhận (có nút Đồng ý / Hủy)
// ===============================
function hopXacNhan(noiDung, khiDongY, khiHuy) {
  const hop = document.createElement("div");
  hop.className = "xac-nhan";
  hop.innerHTML = `
    <h3>${noiDung}</h3>
    <div class="nut">
      <button class="dongy">Đồng ý</button>
      <button class="huy">Hủy</button>
    </div>
  `;
  document.body.appendChild(hop);

  hop.querySelector(".dongy").addEventListener("click", () => {
    hop.remove();
    if (khiDongY) khiDongY();
  });

  hop.querySelector(".huy").addEventListener("click", () => {
    hop.remove();
    if (khiHuy) khiHuy();
  });
}


