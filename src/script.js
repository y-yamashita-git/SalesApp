let items = [];
const STORAGE_KEY = "kaiko_list";

document.addEventListener("DOMContentLoaded", () => {
  requestNotificationPermission();
  registerServiceWorker();
  loadFromStorage();
  renderList();
  setNotificationChecker();

  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const reserveCheck = document.getElementById("reserveCheck");
  const timeInput = document.getElementById("timeInput");
  const addNewBtn = document.getElementById("addNew");
  const formOverlay = document.getElementById("formOverlay");
  const popupOverlay = document.getElementById("popupOverlay");
  const okFormBtn = document.getElementById("okForm");
  const cancelFormBtn = document.getElementById("cancelForm");
  const closePopupBtn = document.getElementById("closePopup");
  const buyListBody = document.getElementById("buyListBody");

  // タブ切り替え
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });

  // ★チェックで時間入力有効/無効
  reserveCheck.addEventListener("change", () => {
    timeInput.disabled = !reserveCheck.checked;
  });

  // 新規登録表示
  addNewBtn.addEventListener("click", () => {
    formOverlay.classList.remove("hidden");
  });

  // 登録キャンセル
  cancelFormBtn.addEventListener("click", () => {
    formOverlay.classList.add("hidden");
    resetForm();
  });

  // 登録処理
  okFormBtn.addEventListener("click", () => {
  const circle = document.getElementById("circleName").value.trim();
  const space = document.getElementById("spaceNumber").value.trim();
  const memo = document.getElementById("memo").value;
  const isReserved = reserveCheck.checked;
  const time = timeInput.value;
  const id = Date.now();

  // 🛑 バリデーション追加
  if (!circle || !space) {
    alert("サークル名とスぺ番を入力してください。");
    return;
  }

  const item = {
    id,
    circle,
    space,
    memo,
    isReserved,
    time,
    status: "🙂",
    notified5min: false,
    notified10after: false
  };

  items.push(item);
  saveToStorage();
  renderList();
  formOverlay.classList.add("hidden");
  resetForm();
});


  // ポップアップ閉じる
  closePopupBtn.addEventListener("click", () => {
    popupOverlay.classList.add("hidden");
  });
});

// 初期化関数
function resetForm() {
  document.getElementById("circleName").value = "";
  document.getElementById("spaceNumber").value = "";
  document.getElementById("memo").value = "";
  document.getElementById("reserveCheck").checked = false;
  document.getElementById("timeInput").value = "";
  document.getElementById("timeInput").disabled = true;
}

// 表示更新
function renderList() {
  const tbody = document.getElementById("buyListBody");
  tbody.innerHTML = "";

  items.sort((a, b) => {
    if (a.status === "😢" && b.status !== "😢") return 1;
    if (a.status !== "😢" && b.status === "😢") return -1;
    return 0;
  });

  items.forEach(item => {
    const tr = document.createElement("tr");

    if (item.isReserved) tr.classList.add("highlight");
    if (item.status === "😢") tr.classList.add("gray-out");

    tr.innerHTML = `
      <td>${item.isReserved ? "★" : ""}</td>
      <td>${item.circle} / ${item.space}</td>
      <td>${item.time || "-"}</td>
      <td>
        <select data-id="${item.id}">
          <option value="🙂" ${item.status === "🙂" ? "selected" : ""}>🙂</option>
          <option value="😢" ${item.status === "😢" ? "selected" : ""}>😢</option>
        </select>
      </td>
    `;

    // 詳細表示
    tr.addEventListener("click", () => {
      // 状態 select を押した場合はポップアップを表示しない
      if (e.target.tagName.toLowerCase() === "select") return;
      showPopup(item);
    });

    // 状態変更
    tr.querySelector("select").addEventListener("change", e => {
      const id = parseInt(e.target.dataset.id);
      const selectedItem = items.find(i => i.id === id);
      if (selectedItem) {
        selectedItem.status = e.target.value;
        saveToStorage();
        renderList();
      }
    });

    tbody.appendChild(tr);
  });
}

// 詳細ポップアップ
function showPopup(item) {
  let html = `
    <p><strong>サークル名:</strong> ${item.circle}</p>
    <p><strong>スぺ番:</strong> ${item.space}</p>
    <p><strong>メモ:</strong> ${item.memo}</p>
  `;

  if (item.isReserved) {
    html += `<p><strong>取置:</strong> ★</p>`;
    html += `<p><strong>時間:</strong> ${item.time || "-"}</p>`;
  }

  document.getElementById("popupContent").innerHTML = html;
  document.getElementById("popupOverlay").classList.remove("hidden");
}

// localStorage
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    items = JSON.parse(data);
  }
}

// 通知
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission().then(permission => {
      if (permission !== "granted") {
        alert("通知が許可されていません");
      }
    });
  }
}

function showNotification(title, body) {
  if (Notification.permission === "granted") {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.showNotification(title, { body });
      }
    });
  }
}

// 通知の監視
function setNotificationChecker() {
  setInterval(() => {
    const now = new Date();

    items.forEach(item => {
      if (!item.time || item.notified10after) return;

      const [hour, minute] = item.time.split(":");
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);

      const diffMinutes = (scheduledTime - now) / 1000 / 60;

      if (diffMinutes <= 5 && !item.notified5min) {
        showNotification(`まもなく ${item.circle}`, `あと5分で時間です (${item.time})`);
        item.notified5min = true;
      }

      if (diffMinutes <= -10 && !item.notified10after) {
        showNotification(`時間経過: ${item.circle}`, `${item.time} から10分経過しました`);
        item.notified10after = true;
      }
    });

    saveToStorage(); // 通知済みフラグ保存
  }, 60 * 1000);
}

// PWA対応
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
      .then(() => console.log("Service Worker registered"))
      .catch(e => console.error("Service Worker error:", e));
  }
}
