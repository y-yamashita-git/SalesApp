// ------------------------------
// グローバル変数・DOM取得
// ------------------------------
const tabKaiko = document.getElementById("tabKaiko");
const tabUriko = document.getElementById("tabUriko"); // 今回使わないが設置のみ
const sectionKaiko = document.getElementById("sectionKaiko");
const sectionUriko = document.getElementById("sectionUriko");

const listBody = document.getElementById("listBody");
const addNewBtn = document.getElementById("addNewBtn");

const formOverlay = document.getElementById("formOverlay");
const formCancelBtn = document.getElementById("formCancelBtn");
const okFormBtn = document.getElementById("okFormBtn");

const circleInput = document.getElementById("circleName");
const spaceInput = document.getElementById("spaceNumber");
const memoInput = document.getElementById("memo");
const reserveCheck = document.getElementById("reserveCheck");
const timeInput = document.getElementById("timeInput");

const popupOverlay = document.getElementById("popupOverlay");
const popupCloseBtn = document.getElementById("popupCloseBtn");
const popupCircle = document.getElementById("popupCircle");
const popupSpace = document.getElementById("popupSpace");
const popupMemo = document.getElementById("popupMemo");
const popupStar = document.getElementById("popupStar");
const popupTime = document.getElementById("popupTime");

let items = []; // 買い物リスト全件

// ------------------------------
// 初期化処理
// ------------------------------
window.addEventListener("load", () => {
  // 初回タブであればデータをクリア
  if (!sessionStorage.getItem("tabInitialized")) {
    localStorage.removeItem("kaikoItems"); // ←ここで保存データ削除
    sessionStorage.setItem("tabInitialized", "true");
  }

  loadFromStorage();
  renderList();
  registerServiceWorker();
  requestNotificationPermission();
});

// ------------------------------
// タブ切替処理（買い子/売り子）
// ------------------------------
tabKaiko.addEventListener("click", () => {
  tabKaiko.classList.add("active");
  tabUriko.classList.remove("active");
  sectionKaiko.classList.remove("hidden");
  sectionUriko.classList.add("hidden");
});
tabUriko.addEventListener("click", () => {
  tabUriko.classList.add("active");
  tabKaiko.classList.remove("active");
  sectionUriko.classList.remove("hidden");
  sectionKaiko.classList.add("hidden");
});

// ------------------------------
// 買い物リスト描画
// ------------------------------
function renderList() {
  // ソート順を定義（空→悲しい→笑顔）
  const order = {
    "": 0,
    "sad": 1,
    "smile": 2,
  };

  items.sort((a, b) => order[a.status] - order[b.status]);

  listBody.innerHTML = "";

  items.forEach((item) => {
    const tr = document.createElement("tr");

    // 取置★マークがある場合は背景黄色
    if (item.isReserved) {
      tr.style.backgroundColor = "#fff59d";
    }
    // 悲しいか笑顔なら背景グレーアウト
    if ((item.status === "sad" || item.status === "smile") ) {
      tr.style.backgroundColor = "#ccc";
    }

    // 取置★マークのセル
    const reservedTd = document.createElement("td");
    reservedTd.textContent = item.isReserved ? "★" : "";
    reservedTd.style.textAlign = "center";

    // サークル名/スぺ番のセル
    const circleSpaceTd = document.createElement("td");
    circleSpaceTd.textContent = `${item.circle} / ${item.space}`;

    // 時間セル
    const timeTd = document.createElement("td");
    timeTd.textContent = item.time || "";

    // 状態セル（プルダウン）
    const statusTd = document.createElement("td");
    const select = document.createElement("select");
    const noneOption = document.createElement("option");
    noneOption.value = "";
    noneOption.text = "";
    const smileOption = document.createElement("option");
    smileOption.value = "smile";
    smileOption.text = "🙂";
    const sadOption = document.createElement("option");
    sadOption.value = "sad";
    sadOption.text = "😢";

    select.appendChild(noneOption);
    select.appendChild(smileOption);
    select.appendChild(sadOption);
    select.value = item.status;

    select.addEventListener("change", (e) => {
      item.status = e.target.value;
      saveToStorage();
      renderList();
    });
    statusTd.appendChild(select);

    tr.appendChild(reservedTd);
    tr.appendChild(circleSpaceTd);
    tr.appendChild(timeTd);
    tr.appendChild(statusTd);

    // 「状態」プルダウン押下時はポップアップ表示しない
    tr.addEventListener("click", (e) => {
      if (e.target.tagName.toLowerCase() === "select") return;
      showPopup(item);
    });

    listBody.appendChild(tr);
  });
}

// ------------------------------
// ポップアップ表示処理
// ------------------------------
function showPopup(item) {
  popupCircle.textContent = `サークル名 ：${item.circle}`;
  popupSpace.textContent = `スペース番号：${item.space}`;
  popupMemo.textContent = `メモ：${item.memo}`;
  popupStar.textContent = item.isReserved ? "★" : "";
  popupTime.textContent = item.isReserved && item.time ? `時間: ${item.time}` : "";

  popupOverlay.classList.remove("hidden");
}

popupCloseBtn.addEventListener("click", () => {
  popupOverlay.classList.add("hidden");
});

// ------------------------------
// 新規登録画面表示 & 登録処理
// ------------------------------
addNewBtn.addEventListener("click", () => {
  resetForm();
  formOverlay.classList.remove("hidden");
});

formCancelBtn.addEventListener("click", () => {
  formOverlay.classList.add("hidden");
  resetForm();
});

okFormBtn.addEventListener("click", () => {
  const circle = circleInput.value.trim();
  const space = spaceInput.value.trim();
  const memo = memoInput.value.trim();
  const isReserved = reserveCheck.checked;
  const time = timeInput.value;

  if (!circle || !space) {
    alert("サークル名とスぺ番を入力してください。");
    return;
  }

  const newItem = {
    id: Date.now(),
    circle,
    space,
    memo,
    isReserved,
    time,
    status: "", // 状態は初期は空
    notified5min: false,
    notified10after: false,
  };

  items.push(newItem);
  saveToStorage();
  renderList();

  formOverlay.classList.add("hidden");
  resetForm();
});

reserveCheck.addEventListener("change", () => {
  timeInput.disabled = !reserveCheck.checked;
});

function resetForm() {
  circleInput.value = "";
  spaceInput.value = "";
  memoInput.value = "";
  reserveCheck.checked = false;
  timeInput.value = "";
  timeInput.disabled = true;
}

// ------------------------------
// ローカルストレージ読み書き
// ------------------------------
function saveToStorage() {
  localStorage.setItem("kaikoItems", JSON.stringify(items));
}

function loadFromStorage() {
  const saved = localStorage.getItem("kaikoItems");
  if (saved) {
    items = JSON.parse(saved);
  }
}

// ------------------------------
// 通知処理（5分前・10分後）
// ------------------------------
function checkNotifications() {
  const now = new Date();
  items.forEach((item) => {
    if (!item.time || !item.isReserved) return;

    // 時間をDateオブジェクトに変換（今日の日付＋item.time）
    const [hour, minute] = item.time.split(":").map(Number);
    const notifTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

    const diffMs = notifTime - now;
    const diffMin = diffMs / 60000;

    // 5分前通知
    if (diffMin <= 5 && diffMin > 4 && !item.notified5min) {
      showNotification(`【買い子】${item.circle}の取置時間が5分前です。`);
      item.notified5min = true;
      saveToStorage();
    }
    // 10分後通知
    if (diffMin <= -10 && diffMin > -11 && !item.notified10after) {
      showNotification(`【買い子】${item.circle}の取置時間から10分経過しました。`);
      item.notified10after = true;
      saveToStorage();
    }
  });
}

// ------------------------------
// 通知表示
// ------------------------------
function showNotification(message) {
  if (Notification.permission === "granted") {
    new Notification(message);
  }
}

// ------------------------------
// Service Worker登録
// ------------------------------
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("Service Worker registered"))
      .catch((e) => console.error("Service Worker registration failed", e));
  }
}

// ------------------------------
// 通知権限要求
// ------------------------------
function requestNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("通知許可されました");
        setInterval(checkNotifications, 60000); // 1分ごとにチェック
      }
    });
  }
}
