// ------------------------------
// グローバル変数・DOM取得
// ------------------------------
const tabKaiko = document.getElementById("tabKaiko");
const tabUriko = document.getElementById("tabUriko");
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

const urikoButtons = document.getElementById("urikoButtons");

let products = []; // 商品リスト

// 商品関連のDOM取得
const btnProduct = document.getElementById("btnProduct");
const productListView = document.getElementById("productListView");
const productFormView = document.getElementById("productFormView");
const btnAddProduct = document.getElementById("btnAddProduct");
const productList = document.getElementById("productList");
const btnProductCancel = document.getElementById("btnProductCancel");
const btnProductRegister = document.getElementById("btnProductRegister");

const productTitle = document.getElementById("productTitle");
const productType = document.getElementById("productType");
const productR18 = document.getElementById("productR18");
const productImage = document.getElementById("productImage");
const productPrice = document.getElementById("productPrice");
const productMemo = document.getElementById("productMemo");
const btnProductBack = document.getElementById("btnProductBack");

// 会計画面の表示・非表示制御
const checkoutPanel = document.querySelector('.checkout-panel');
const btnKaikei = document.getElementById('btnKaikei');
const checkoutBackBtn = document.querySelector('.checkout-bottom-bar .back-btn');

const checkoutBtn = document.querySelector('.checkout-btn');


// 取り置きリスト
const reservePanel = document.querySelector('.reserve-list-panel');
const checkoutTabs = document.querySelectorAll('.checkout-panel .tab');
const reserveTab = checkoutTabs[1];
const kaikeiTab = checkoutTabs[0];

const checkoutProductsScroll = document.querySelector('.checkout-products-scroll');
const checkoutBottomBar = document.querySelector('.checkout-bottom-bar');

// 取り置きリスト新規登録ポップアップ表示
// 取り置きリストデータ
let reserves = [];

const reserveProductPopup = document.getElementById("reserveProductPopup");
const reserveProductGrid = document.getElementById("reserveProductGrid");
const btnReserveProductCancel = document.getElementById("btnReserveProductCancel");
const btnReserveProductOk = document.getElementById("btnReserveProductOk");



let items = []; // 買い物リスト全件

// ------------------------------
// 初期化処理
// ------------------------------
window.addEventListener("load", () => {
  // 初回タブであればデータをクリア
  if (!sessionStorage.getItem("tabInitialized")) {
    localStorage.removeItem("kaikoItems"); 
    localStorage.removeItem("urikoProducts");
    localStorage.removeItem("reserveItems");
    sessionStorage.setItem("tabInitialized", "true");
  }

  loadFromStorage();
  loadReservesFromStorage();
  renderList();
  registerServiceWorker();
  requestNotificationPermission();
});

// ------------------------------
// タブ切替処理（買い子/売り子）
// ------------------------------
tabKaiko.addEventListener("click", (e) => {
  // 取り置きタブがアクティブな場合は確認メッセージを出さずに切り替え
  if (reserveTab.classList.contains('active')) {
    // 取り置きリストも非表示
    reservePanel.style.display = 'none';
    // 会計タブを初期状態に
    kaikeiTab.classList.add('active');
    reserveTab.classList.remove('active');
    if (checkoutProductsScroll) checkoutProductsScroll.style.display = '';
    if (checkoutBottomBar) checkoutBottomBar.style.display = '';
    reservePanel.style.display = 'none';
    checkoutPanel.style.display = 'none';

    // ここで「かい子」タブの表示切り替えも行う
    tabKaiko.classList.add("active");
    tabUriko.classList.remove("active");
    sectionKaiko.classList.remove("hidden");
    sectionUriko.classList.add("hidden");
    urikoButtons.classList.add("hidden");

    // デフォルトの動作を止める（これがないと2重で動く場合がある）
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // 通常の会計画面からの移動時のみ確認メッセージ
  if (checkoutPanel.style.display !== "none") {
    const proceed = tryHideCheckoutPanel(e);
    if (!proceed) return;
    // 会計画面を閉じる
    checkoutPanel.style.display = "none";
    window.checkoutCounts = {};
    const grid = document.querySelector('.checkout-products-grid');
    if (grid) grid.innerHTML = "";
    const payInput = document.getElementById("payInput");
    if (payInput) payInput.value = "";
  }
  // タブ切り替え
  kaikeiTab.classList.add('active');
  reserveTab.classList.remove('active');
  tabKaiko.classList.add("active");
  tabUriko.classList.remove("active");
  sectionKaiko.classList.remove("hidden");
  sectionUriko.classList.add("hidden");
  urikoButtons.classList.add("hidden");
  reservePanel.style.display = 'none';
  hideSalesInfoView();
  if (checkoutProductsScroll) checkoutProductsScroll.style.display = '';
  if (checkoutBottomBar) checkoutBottomBar.style.display = '';
});

// 売り子タブは会計画面が開いている間は押せなくする
tabUriko.addEventListener("click", (e) => {
  if (checkoutPanel.style.display !== "none") {
    // 押せないようにreturn（tryHideCheckoutPanelも呼ばない）
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  tabUriko.classList.add("active");
  tabKaiko.classList.remove("active");
  sectionUriko.classList.remove("hidden");
  sectionKaiko.classList.add("hidden");
  productListView.classList.add("hidden");
  productFormView.classList.add("hidden");
  urikoButtons.classList.remove("hidden");
  hideSalesInfoView();
  reservePanel.style.display = 'none';
});

// 会計画面から他タブへ移動時の確認メッセージ
function tryHideCheckoutPanel(e) {
  // ここで確認ダイアログを出す
  const proceed = confirm("会計画面を閉じて移動しますか？\n（入力中の内容はクリアされます）");
  if (!proceed) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    return false;
  }
  // ここで会計画面を閉じる処理もしておくと安全
  checkoutPanel.style.display = "none";
  return true;
}

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

// ------------------------------
// 商品登録
// ------------------------------
// 商品登録ボタン押下で商品一覧画面へ
btnProduct.addEventListener("click", () => {
  urikoButtons.classList.add("hidden");
  productListView.classList.remove("hidden");
  productFormView.classList.add("hidden");
  renderProductList();
});

// 商品登録キャンセル
btnProductCancel.addEventListener("click", () => {
  productFormView.classList.add("hidden");
  productListView.classList.remove("hidden");
});

// 商品登録
btnProductRegister.addEventListener("click", () => {
  const title = productTitle.value.trim();
  const type = productType.value;
  const r18 = productR18.checked;
  const price = productPrice.value;
  const memo = productMemo.value;
  let imageUrl = "";

  if (productImage.files && productImage.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      imageUrl = e.target.result;
      saveProduct({ title, type, r18, price, memo, imageUrl });
    };
    reader.readAsDataURL(productImage.files[0]);
  } else {
    // ダミー画像
    imageUrl = "https://placehold.co/120x120?text=No+Image";
    saveProduct({ title, type, r18, price, memo, imageUrl });
  }
});

function saveProduct(product) {
  products.push(product);
  localStorage.setItem("urikoProducts", JSON.stringify(products));
  renderProductList();
  productFormView.classList.add("hidden");
  productListView.classList.remove("hidden");
}

// 商品一覧描画// 
let productPopupOverlay = document.getElementById("productPopupOverlay");
if (!productPopupOverlay) {
  productPopupOverlay = document.createElement("div");
  productPopupOverlay.id = "productPopupOverlay";
  productPopupOverlay.className = "overlay hidden";
  productPopupOverlay.innerHTML = `
    <div class="form-container" id="productPopupContainer" style="position:relative;">
      <button id="productPopupClose" class="btn" style="position:absolute;right:8px;top:8px;width:32px;height:32px;">×</button>
      <div id="productPopupContent"></div>
    </div>
  `;
  document.body.appendChild(productPopupOverlay);
}
const productPopupContent = document.getElementById("productPopupContent") || productPopupOverlay.querySelector("#productPopupContent");
const productPopupClose = document.getElementById("productPopupClose") || productPopupOverlay.querySelector("#productPopupClose");

// ポップアップを閉じる
productPopupClose.onclick = () => {
  productPopupOverlay.classList.add("hidden");
  productPopupContent.innerHTML = "";
};

// 商品登録フォームをポップアップで表示（新規 or 編集）
function showProductPopup(product = null, idx = null) {
  productPopupContent.innerHTML = `
    <!-- 1行目: タイトル -->
    <div style="margin-bottom:10px;">
      <input type="text" id="popupProductTitle" placeholder="タイトル" style="width:100%;font-size:1.1em;padding:8px 10px;border-radius:8px;border:1px solid #bbb;" value="${product ? escapeHtml(product.title) : ""}">
    </div>
    <!-- 2行目: 画像＋ラジオボタン群＋金額・在庫 -->
    <div class="popup-row2">
      <div class="popup-img-col">
        <img id="popupProductImgPreview" src="${product && product.imageUrl ? product.imageUrl : "https://placehold.co/120x120?text=No+Image"}" class="popup-img">
        <input type="file" id="popupProductImage" accept="image/*" style="display:none;">
      </div>
      <div class="popup-radio-col" style="flex:2;">
        <div class="radio-group">
          <label class="radio-btn"><input type="radio" name="popupProductType" value="goods" ${!product || product.type === "goods" ? "checked" : ""}><span>グッズ</span></label>
          <label class="radio-btn"><input type="radio" name="popupProductType" value="book" ${product && product.type === "book" ? "checked" : ""}><span>本</span></label>
        </div>
        <div class="radio-group">
          <label class="radio-btn"><input type="radio" name="popupProductShin" value="new" ${!product || product.shin === "new" ? "checked" : ""}><span>新刊</span></label>
          <label class="radio-btn"><input type="radio" name="popupProductShin" value="old" ${product && product.shin === "old" ? "checked" : ""}><span>既刊</span></label>
        </div>
        <div class="radio-group" style="align-items: flex-end;">
          <label class="radio-btn"><input type="radio" name="popupProductAge" value="all" ${!product || product.age === "all" ? "checked" : ""}><span>全年齢</span></label>
          <label class="radio-btn"><input type="radio" name="popupProductAge" value="r18" ${product && product.age === "r18" ? "checked" : ""}><span>R18</span></label>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
          <div style="display: flex; align-items: center;">
            <label style="font-size:1.1em; width: 55px; text-align: right;">金額：</label>
            <input type="number" id="popupProductPrice" placeholder="金額" min="0"
              style="width:110px; font-size:1.1em; padding:8px 10px; border-radius:8px; border:2px solid #1976d2; margin-left:8px; height:30px;"
              value="${product && product.price ? product.price : ""}">
          </div>
          <div style="display: flex; align-items: center;">
            <label style="font-size:1.1em; width: 55px; text-align: right;">在庫：</label>
            <input type="number" id="popupProductStock" placeholder="在庫" min="0"
              style="width:110px; font-size:1.1em; padding:8px 10px; border-radius:8px; border:2px solid #1976d2; margin-left:8px; height:30px;"
              value="${product && product.stock ? product.stock : ""}">
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
    <!-- 3行目: メモ -->
    <div style="margin:12px 0;">
      <textarea id="popupProductMemo" placeholder="メモ" style="width:100%;min-height:60px;resize:vertical;border-radius:8px;border:1px solid #bbb;padding:8px;font-size:1em;">${product ? escapeHtml(product.memo) : ""}</textarea>
    </div>
    <!-- 4行目: ボタン -->
    <div class="popup-btn-row">
      <button id="popupProductBack" class="btn" type="button">↩</button>
      <button id="popupProductRegister" class="btn" type="button">${product ? "更新" : "登録"}</button>
      ${product !== null ? `<button id="popupProductDelete" class="btn" type="button" style="background:#d32f2f;">削除</button>` : ""}
    </div>
  `;

  // 画像プレビュー
  const popupProductImage = document.getElementById("popupProductImage");
  const popupProductImgPreview = document.getElementById("popupProductImgPreview");
  popupProductImage.style.display = "none";

  popupProductImgPreview.onclick = () => popupProductImage.click();
  popupProductImage.addEventListener("change", () => {
    if (popupProductImage.files && popupProductImage.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        popupProductImgPreview.src = e.target.result;
      };
      reader.readAsDataURL(popupProductImage.files[0]);
    }
  });

  // 戻る
  document.getElementById("popupProductBack").onclick = () => {
    productPopupOverlay.classList.add("hidden");
    productPopupContent.innerHTML = "";
  };

  // 登録・更新
  document.getElementById("popupProductRegister").onclick = () => {
    const title = document.getElementById("popupProductTitle").value.trim();
    const type = document.querySelector('input[name="popupProductType"]:checked').value;
    const shin = document.querySelector('input[name="popupProductShin"]:checked').value;
    const age = document.querySelector('input[name="popupProductAge"]:checked').value;
    const price = document.getElementById("popupProductPrice").value;
    const stock = document.getElementById("popupProductStock").value;
    const memo = document.getElementById("popupProductMemo").value;
    let imageUrl = product && product.imageUrl ? product.imageUrl : "https://placehold.co/120x120?text=No+Image";

    const popupProductImage = document.getElementById("popupProductImage");
    if (popupProductImage.files && popupProductImage.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        imageUrl = e.target.result;
        saveAndClose();
      };
      reader.readAsDataURL(popupProductImage.files[0]);
    } else {
      saveAndClose();
    }

    function saveAndClose() {
  const newProduct = { title, type, shin, age, price, stock, memo, imageUrl };
  let shouldUpdate = false;
  if (product) {
    for (const key of Object.keys(newProduct)) {
      // 文字列比較に統一
      if (String(newProduct[key]) !== String(product[key])) {
        shouldUpdate = true;
        break;
      }
    }
  } else {
    shouldUpdate = true; // 新規登録
  }

  if (shouldUpdate) {
    if (typeof idx === "number" && idx >= 0) {
      products[idx] = newProduct; // 編集時は上書き
    } else {
      products.push(newProduct);  // 新規時は追加
    }
    localStorage.setItem("urikoProducts", JSON.stringify(products));
    renderProductList();
  }
  productPopupOverlay.classList.add("hidden");
  productPopupContent.innerHTML = "";
}
  };

  // 削除
  if (product !== null) {
    document.getElementById("popupProductDelete").onclick = () => {
      if (confirm("この商品を削除しますか？")) {
        products.splice(idx, 1);
        localStorage.setItem("urikoProducts", JSON.stringify(products));
        renderProductList();
        productPopupOverlay.classList.add("hidden");
        productPopupContent.innerHTML = "";
      }
    };
  }

  productPopupOverlay.classList.remove("hidden");

}

// ＋ボタンで新規登録ポップアップ
btnAddProduct.addEventListener("click", () => {
  // 商品一覧画面を表示、商品登録フォームを非表示
  productListView.classList.remove("hidden");
  productFormView.classList.add("hidden");
  showProductPopup();
});

// 商品画像クリックで編集ポップアップ
function renderProductList() {
  productList.innerHTML = "";
  products.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "product-card";

    // 画像ラッパー
    const imgWrap = document.createElement("div");
    imgWrap.className = "img-wrap";

    // 画像
    const img = document.createElement("img");
    img.src = p.imageUrl || "https://placehold.co/120x120?text=No+Image";
    img.style.cursor = "pointer";
    img.addEventListener("click", () => {
      showProductPopup(p, idx); 
    });
    imgWrap.appendChild(img);

    // 金額（画像内右下〇バッジ）
    if (p.price) {
      const priceTag = document.createElement("div");
      priceTag.className = "price-tag";
      priceTag.textContent = `￥${p.price}`;
      priceTag.style.position = "absolute";
      priceTag.style.right = "6px";
      priceTag.style.bottom = "6px";
      priceTag.style.background = "#fff";
      priceTag.style.color = "#1976d2";
      priceTag.style.border = "2px solid #1976d2";
      priceTag.style.borderRadius = "50%";
      priceTag.style.width = "38px";
      priceTag.style.height = "38px";
      priceTag.style.display = "flex";
      priceTag.style.alignItems = "center";
      priceTag.style.justifyContent = "center";
      priceTag.style.fontWeight = "bold";
      priceTag.style.fontSize = "1em";
      priceTag.style.boxShadow = "0 1px 4px #0002";
      imgWrap.appendChild(priceTag);
    }

    card.appendChild(imgWrap);

    // タイトル＋R18（画像下）
    const infoRow = document.createElement("div");
    infoRow.className = "info-row";
    if (p.age === "r18") {
      const r18 = document.createElement("span");
      r18.className = "r18";
      r18.textContent = "🔞";
      infoRow.appendChild(r18);
    }
    const title = document.createElement("span");
    title.className = "product-title";
    title.textContent = p.title;
    infoRow.appendChild(title);

    card.appendChild(infoRow);

    productList.appendChild(card);
  });
}

// 商品登録フォームを開いたときに削除ボタンを消す
function resetProductForm() {
  productTitle.value = "";
  productType.value = "book";
  productR18.checked = false;
  productImage.value = "";
  productPrice.value = "";
  productMemo.value = "";
  const delBtn = document.getElementById("btnProductDelete");
  if (delBtn) delBtn.remove();
}

btnProductBack.addEventListener("click", () => {
  productListView.classList.add("hidden");
  urikoButtons.classList.remove("hidden");
});

// HTMLエスケープ
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m];
  });
}

// フォームリセット
function resetProductForm() {
  productTitle.value = "";
  productType.value = "book";
  productR18.checked = false;
  productImage.value = "";
  productPrice.value = "";
  productMemo.value = "";
}

// 初期化時に商品リスト読込
window.addEventListener("load", () => {
  const saved = localStorage.getItem("urikoProducts");
  if (saved) products = JSON.parse(saved);
});

// ------------------------------
// 会計関連処理
// ------------------------------
// 会計パネルの表示・非表示制御

// 初期状態で非表示
if (checkoutPanel) {
  checkoutPanel.style.display = "none";
}

// 会計ボタン押下で会計画面を表示し、他の売り子画面を非表示
if (btnKaikei && checkoutPanel) {
  btnKaikei.addEventListener('click', () => {
    checkoutPanel.style.display = "flex";
    urikoButtons.classList.add("hidden");
    renderCheckoutProducts();
  });
}

// 戻るボタンで会計画面を非表示、売り子タブのメインボタン群を表示
if (checkoutBackBtn && checkoutPanel) {
  checkoutBackBtn.addEventListener('click', () => {
    checkoutPanel.style.display = "none";
    urikoButtons.classList.remove("hidden");
    // 必要なら他の売り子画面もここで制御
  });
}

// 会計画面の商品一覧を描画
function renderCheckoutProducts() {
  const grid = document.querySelector('.checkout-products-grid');
  if (!grid) return;
  grid.innerHTML = ""; // 一度クリア

  // 選択数を保持する（セッション中のみ）
  if (!window.checkoutCounts) window.checkoutCounts = {};
  const counts = window.checkoutCounts;

  products.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "checkout-product";

    // 商品画像
    const img = document.createElement("img");
    img.src = p.imageUrl || "https://placehold.co/120x120?text=No+Image";
    img.alt = p.title || "";
    card.appendChild(img);

    // 選択数バッジ
    const count = counts[idx] || 0;
    const badge = document.createElement("span");
    badge.className = "count-badge";
    badge.textContent = count > 0 ? count : "";
    card.appendChild(badge);

    // マイナスボタン
    const minusBtn = document.createElement("button");
    minusBtn.className = "minus-btn";
    minusBtn.textContent = "−";
    minusBtn.style.display = count > 0 ? "flex" : "none";
    minusBtn.onclick = (e) => {
      e.stopPropagation();
      if (counts[idx] > 0) {
        counts[idx]--;
        renderCheckoutProducts();
      }
    };
    card.appendChild(minusBtn);

    // 画像押下でカウント増加
    // 取り置き分（チェック有無関係なく全て）を計算
    let reservedCount = 0;
    reserves.forEach(r => {
      const item = r.items && r.items.find(it => it.product === p.title);
      if (item) reservedCount += item.count;
    });
    const stock = Number(p.stock) || 0;
    const maxCount = stock - reservedCount;

    img.onclick = () => {
      if (counts[idx] === undefined) counts[idx] = 0;
      if (maxCount <= 0 || counts[idx] >= maxCount) {
        alert("在庫数に達しています");
        return;
      }
      counts[idx]++;
      renderCheckoutProducts();
    };

    grid.appendChild(card);
  });
}

// ------------------------------
// 会計確認画面
// ------------------------------
// --- 会計確認画面の表示 ---
function showCheckoutConfirm(onPaidCallback) {
  // 1. 選択アイテム取得
  const counts = window.checkoutCounts || {};
  const selected = products
    .map((p, idx) => ({ ...p, count: counts[idx] || 0, idx }))
    .filter(p => p.count > 0);

  // 2. 合計金額計算
  const total = selected.reduce((sum, p) => sum + (Number(p.price) || 0) * p.count, 0);

  // 3. テンプレートから会計確認画面を複製
  let overlay = document.getElementById("checkoutConfirmOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "checkoutConfirmOverlay";
    overlay.className = "overlay";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = "";
  const template = document.getElementById("checkout-confirm-template");
  overlay.appendChild(document.importNode(template.content, true));
  overlay.classList.remove("hidden");

  // 商品リストを流し込む
  const listGrid = overlay.querySelector(".checkout-confirm-list-grid");
  listGrid.innerHTML = selected.map(p => `
    <div class="checkout-confirm-item">
      <span class="item-title">${escapeHtml(p.title)}</span>
      <span class="item-price">￥${p.price}</span>
      <span class="item-mult">×${p.count}</span>
    </div>
  `).join("");

  // 合計金額
  overlay.querySelector("#checkoutTotal").textContent = total;

  // 電卓パッド生成
  renderCalcPad();

  // ぴったりボタン
  overlay.querySelector("#btnJust").onclick = () => {
    overlay.querySelector("#payInput").value = total;
    showChangePopup(total, total, selected);
  };

  // 戻るボタン
  overlay.querySelector("#btnCheckoutBack").onclick = () => {
    overlay.classList.add("hidden");
  };

  // 会計ボタン
  overlay.querySelector("#btnCheckoutOk").onclick = () => {
    const payInput = overlay.querySelector("#payInput");
    const pay = Number(payInput.value);
    if (!pay || pay < total) {
      alert("金額が未入力、または合計金額より少ないです");
      return;
    }
    showChangePopup(pay, total, selected);
  };

  // お釣り・年齢確認ポップアップ
  function showChangePopup(pay, total, selectedItems) {
    const hasR18 = selectedItems.some(p => p.age === "r18");
    const change = pay - total;

    // 18歳以上の生年月日（今日基準）
    let ageCheckHtml = "";
    if (hasR18) {
      const now = new Date();
      const y = now.getFullYear() - 18;
      const m = now.getMonth() + 1;
      const d = now.getDate();
      let wareki = "";
      if (y >= 2019) {
        wareki = `令和${y - 2018}年${m}月${d}日以前`;
      } else if (y >= 1989) {
        wareki = `平成${y - 1988}年${m}月${d}日以前`;
      } else {
        wareki = `昭和${y - 1925}年${m}月${d}日以前`;
      }
      ageCheckHtml = `
        <div class="age-check-alert">※年齢確認を忘れずに！</div>
        <div class="age-check-date">${y}年${m}月${d}日（${wareki}）生まれ以前が18歳以上です</div>
      `;
    }

    // 売上記録
    let sales = JSON.parse(localStorage.getItem("sales") || "[]");
    selectedItems.forEach(item => {
      sales.push({
        title: item.title,
        price: item.price,
        count: item.count,
        date: new Date().toISOString()
      });
      // 在庫を減らす
      if (typeof item.idx === "number" && products[item.idx]) {
        products[item.idx].stock = String((Number(products[item.idx].stock) || 0) - item.count);
      }
    });
    localStorage.setItem("sales", JSON.stringify(sales));
    localStorage.setItem("urikoProducts", JSON.stringify(products));

    // 押下数クリア
    window.checkoutCounts = {};

    // ポップアップ内容
    overlay.innerHTML = "";
    const changeTemplate = document.getElementById("change-popup-template");
    overlay.appendChild(document.importNode(changeTemplate.content, true));
    overlay.querySelector(".change-message").innerHTML = `お釣りは${change}円です`;
    overlay.querySelector(".age-check").innerHTML = ageCheckHtml;

    // 新規ボタン
    overlay.querySelector("#btnKaikeiNew").onclick = () => {
      overlay.classList.add("hidden");
      renderCheckoutProducts();
      if (typeof onPaidCallback === "function") onPaidCallback();
    };
  }
}

// 電卓パッド描画
function renderCalcPad() {
  const pad = document.getElementById("checkoutCalcPad");
  if (!pad) return;
  const keys = [
    ["7","8","9"],
    ["4","5","6"],
    ["1","2","3"],
    ["0","00","C"]
  ];
  pad.innerHTML = keys.map(row =>
    `<div class="calc-row">${row.map(k =>
      `<button class="calc-btn" data-key="${k}">${k}</button>`
    ).join("")}</div>`
  ).join("");
  pad.querySelectorAll(".calc-btn").forEach(btn => {
    btn.onclick = () => {
      const input = document.getElementById("payInput");
      if (!input) return;
      if (btn.dataset.key === "C") {
        input.value = "";
      } else {
        input.value += btn.dataset.key;
      }
    };
  });
}

// 会計画面の会計ボタン押下で確認画面へ
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    showCheckoutConfirm();
  });
}

// ------------------------------
// 取り置きリスト画面
// ------------------------------
// 取り置きリスト画面の表示・非表示制御
function showReserveList(list = reserves, options = {}) {
  const panel = document.querySelector('.reserve-list-panel');
  if (!panel) return;
  panel.style.display = 'flex';

  // チェック済みは下に来るようソート
  const sorted = [...list].sort((a, b) => {
    if (a.checked === b.checked) {
      return a.name.localeCompare(b.name, 'ja');
    }
    return a.checked ? 1 : -1;
  });

  // 会計タブ判定
  const isKaikeiTab = (checkoutPanel && checkoutPanel.style.display !== "none" && reserveTab.classList.contains('active'));

  // 名前・状況（チェックボックス）で表示、チェック済みは行を灰色に
  const grid = panel.querySelector('.reserve-list-grid');
  if (grid) {
    grid.innerHTML = sorted.map((r, i) => `
    <div class="reserve-list-item" style="display:flex;align-items:center;gap:12px;max-width:480px;margin:0 auto;width:100%;${r.checked ? 'background:#ccc;' : ''}">
      <span class="reserve-list-name" style="font-weight:bold;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;">
        ${escapeHtml(r.name)}
      </span>
      <input type="checkbox" ${r.checked ? "checked" : ""} ${isKaikeiTab ? "disabled" : ""} style="margin-right:0;flex:0 0 auto;" data-idx="${i}">
    </div>
  `).join("");

  grid.querySelectorAll('.reserve-list-name').forEach((el, idx) => {
  const isKaikeiTab = (checkoutPanel && checkoutPanel.style.display !== "none" && reserveTab.classList.contains('active'));
  el.onclick = () => showReserveProductPopup(sorted[idx], isKaikeiTab);
});
    // チェックボックス変更時に保存＆再描画
    grid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.onchange = (e) => {
        const idx = Number(cb.dataset.idx);
        reserves[idx].checked = cb.checked;
        saveReservesToStorage();
        showReserveList();
    
    // チェックが付いた時だけ在庫を減らす
    if (cb.checked) {
      reserves[idx].items.forEach(item => {
        const prod = products.find(p => p.title === item.product);
        if (prod && typeof prod.stock === "number") {
          prod.stock = Math.max(0, prod.stock - item.count);
        }
      });
      localStorage.setItem("urikoProducts", JSON.stringify(products));
    }
    // チェックが外れた時は在庫数を元に戻す
    else {
      reserves[idx].items.forEach(item => {
        const prod = products.find(p => p.title === item.product);
        if (prod && typeof prod.stock === "number") {
          prod.stock = Number(prod.stock) + item.count;
        }
      });
      localStorage.setItem("urikoProducts", JSON.stringify(products));
    }
      };
    });
    
  }

  // メッセージ欄の表示/非表示
  const msgElem = panel.querySelector('.reserve-list-message');
  if (msgElem) {
    if (options.message === false) {
      msgElem.style.display = 'none';
    } else {
      msgElem.style.display = '';
      msgElem.textContent = '※チェックしたら取り置き済みとして扱います';
    }
  }
}

// 初期化時に一度だけイベント登録
window.addEventListener("DOMContentLoaded", () => {
  // 新規登録ボタン
  const btnNew = document.getElementById("btnReserveNew");
  if (btnNew) {
    btnNew.onclick = () => {
      showReserveProductPopup();
    };
  }
  // 戻るボタン
  const btnBack = document.getElementById("btnReserveBack");
  if (btnBack) {
    btnBack.onclick = () => {
      const panel = document.querySelector('.reserve-list-panel');
      panel.style.display = 'none';

      // 会計画面の取り置きタブから戻る場合は会計タブを初期化し会計画面も非表示
      if (reserveTab.classList.contains('active')) {
        kaikeiTab.classList.add('active');
        reserveTab.classList.remove('active');
        if (checkoutProductsScroll) checkoutProductsScroll.style.display = '';
        if (checkoutBottomBar) checkoutBottomBar.style.display = '';
        reservePanel.style.display = 'none';
        checkoutPanel.style.display = 'none';
        // 売り子タブの初期画面も表示
        tabUriko.classList.add("active");
        tabKaiko.classList.remove("active");
        sectionUriko.classList.remove("hidden");
        sectionKaiko.classList.add("hidden");
        if (urikoButtons) urikoButtons.classList.remove("hidden");
        return;
      }

      // 売り子タブの初期画面に遷移
      if (typeof tabUriko !== "undefined" && typeof tabKaiko !== "undefined") {
        tabUriko.classList.add("active");
        tabKaiko.classList.remove("active");
      }
      if (typeof sectionUriko !== "undefined" && typeof sectionKaiko !== "undefined") {
        sectionUriko.classList.remove("hidden");
        sectionKaiko.classList.add("hidden");
      }
      if (typeof urikoButtons !== "undefined" && urikoButtons) {
        urikoButtons.classList.remove("hidden");
      }
      // 会計画面は非表示
      if (typeof checkoutPanel !== "undefined" && checkoutPanel) {
        checkoutPanel.style.display = "none";
      }
    };
  }
});

// 会計画面のタブ切り替え
reserveTab.addEventListener('click', () => {
  if (btn.textContent.includes("取置きリスト") || btn.textContent.includes("取り置きリスト")) {
    btn.addEventListener('click', () => {
      reservePanel.style.display = 'flex';
      checkoutPanel.style.display = 'none';
      if (checkoutProductsScroll) checkoutProductsScroll.style.display = '';
      if (checkoutBottomBar) checkoutBottomBar.style.display = '';
      reserveTab.classList.add('active');
      kaikeiTab.classList.remove('active');
      if (typeof urikoButtons !== "undefined" && urikoButtons) urikoButtons.classList.add("hidden");
    });
  }
});

// 会計画面のタブ切り替え（取り置きタブ）→新規登録ボタンを非表示
reserveTab.addEventListener('click', () => {
  reserveTab.classList.add('active');
  kaikeiTab.classList.remove('active');
  if (checkoutProductsScroll) checkoutProductsScroll.style.display = 'none';
  if (checkoutBottomBar) checkoutBottomBar.style.display = 'none';
  reservePanel.style.display = 'flex';
  checkoutPanel.style.display = 'flex';
  showReserveList(reserves, { message: false });
});

// 会計タブに戻したときは新規登録ボタンを再表示
kaikeiTab.addEventListener('click', () => {
  kaikeiTab.classList.add('active');
  reserveTab.classList.remove('active');
  if (checkoutProductsScroll) checkoutProductsScroll.style.display = '';
  if (checkoutBottomBar) checkoutBottomBar.style.display = '';
  reservePanel.style.display = 'none';
  checkoutPanel.style.display = 'flex';
  const btnNew = document.getElementById("btnReserveNew");
  if (btnNew) btnNew.style.display = "";
});

// 「取り置きリスト」ボタン押下時は買い子風でメッセージあり
document.querySelectorAll("button").forEach(btn => {
  if (btn.textContent.includes("取置きリスト") || btn.textContent.includes("取り置きリスト")) {
    btn.addEventListener('click', () => {
      reservePanel.style.display = 'flex';
      checkoutPanel.style.display = 'none';
      if (checkoutProductsScroll) checkoutProductsScroll.style.display = '';
      if (checkoutBottomBar) checkoutBottomBar.style.display = '';
      reserveTab.classList.add('active');
      kaikeiTab.classList.remove('active');
      if (typeof urikoButtons !== "undefined" && urikoButtons) urikoButtons.classList.add("hidden");
      // ここでグリッドを必ず表示
      showReserveList(reserves, { message: true });
    });
  }
});

// ------------------------------
// 取り置きリスト追加登録画面
// ------------------------------
// 取り置きリスト保存・読込
function saveReservesToStorage() {
  localStorage.setItem("reserveItems", JSON.stringify(reserves));
}
function loadReservesFromStorage() {
  const saved = localStorage.getItem("reserveItems");
  if (saved) {
    reserves = JSON.parse(saved);
  } else {
    reserves = [];
  }
}

// reserve: { name: string, items: [{ product: 商品名, count: 数 }]}
// isKaikeiTab: 会計タブから呼ぶ場合true
function showReserveProductPopup(reserve = null, isKaikeiTab = false) {
  const nameInput = document.getElementById("reservePersonName");
  const btnCancel = document.getElementById("btnReserveProductCancel");
  const btnOk = document.getElementById("btnReserveProductOk");

  // 名前を反映
  nameInput.value = reserve && reserve.name ? reserve.name : "";
  nameInput.disabled = !!isKaikeiTab;
  btnCancel.textContent = "↩";
  btnOk.textContent = isKaikeiTab ? "会計" : "OK";

  // ★ すでに会計済み（チェック済み）の場合はOKボタンを非活性
  if (reserve && reserve.checked) {
    btnOk.disabled = true;
    btnOk.title = "すでに会計済みです";
    btnOk.style.background = "#ccc";
    btnOk.style.color = "#888";
    btnOk.style.cursor = "not-allowed";
  } else {
    btnOk.disabled = false;
    btnOk.title = "";
    btnOk.style.background = ""; // デフォルトに戻す
    btnOk.style.color = "";
    btnOk.style.cursor = "";
  }

  // 商品ごとの押下数を初期化
  const counts = {};
  if (reserve && reserve.items) {
    reserve.items.forEach(item => {
      const idx = products.findIndex(p => p.title === item.product);
      if (idx !== -1) counts[idx] = item.count;
    });
  }

  // 商品リストをグリッドで表示
  reserveProductGrid.innerHTML = products.map((p, idx) => `
    <div class="reserve-product-card" data-idx="${idx}">
      <div class="reserve-product-img-wrap">
        <img src="${p.imageUrl || "https://placehold.co/120x120?text=No+Image"}" alt="${escapeHtml(p.title)}">
        <span class="reserve-product-count-badge" style="display:${counts[idx] > 0 ? "flex" : "none"};">${counts[idx] > 0 ? counts[idx] : ""}</span>
        <button class="reserve-product-minus-btn" type="button" style="display:${counts[idx] > 0 ? "flex" : "none"};">−</button>
      </div>
      <div class="reserve-product-title">${escapeHtml(p.title)}</div>
    </div>
  `).join("");

  // カウント操作
  reserveProductGrid.querySelectorAll(".reserve-product-card").forEach(card => {
    const idx = Number(card.dataset.idx);
    const imgWrap = card.querySelector('.reserve-product-img-wrap');
    const img = imgWrap.querySelector('img');
    const minusBtn = imgWrap.querySelector('.reserve-product-minus-btn');
    const countBadge = imgWrap.querySelector('.reserve-product-count-badge');
    if (counts[idx] === undefined) counts[idx] = 0;

    // 既存の取り置き合計数（自分自身を除く）
  let reservedCount = 0;
  reserves.forEach(r => {
    if (!reserve || r !== reserve) {
      const item = r.items && r.items.find(it => it.product === products[idx].title);
      if (item) reservedCount += item.count;
    }
  });
  // 在庫数
  const stock = Number(products[idx].stock) || 0;
  // 押下上限
  const maxCount = stock - reservedCount;

  // 画像クリックでカウント＋
  img.onclick = () => {
    if (maxCount >= 0 && counts[idx] >= maxCount) {
      alert("在庫数に達しています");
      return;
    }
    counts[idx]++;
    updateDisplay();
  };

  // マイナスボタン
  minusBtn.onclick = (e) => {
    e.stopPropagation();
    if (counts[idx] > 0) {
      counts[idx]--;
      updateDisplay();
    }
  };

  function updateDisplay() {
    if (counts[idx] > 0) {
      countBadge.textContent = counts[idx];
      countBadge.style.display = "flex";
      minusBtn.style.display = "flex";
      card.classList.add("selected");
    } else {
      countBadge.textContent = "";
      countBadge.style.display = "none";
      minusBtn.style.display = "none";
      card.classList.remove("selected");
    }
  }
  // 初期表示
  updateDisplay();
  });

  // ポップアップ表示
  reserveProductPopup.classList.remove("hidden");

  // 取消
  btnReserveProductCancel.onclick = () => {
    reserveProductPopup.classList.add("hidden");
  };

  // OKボタン押下時
  btnReserveProductOk.onclick = () => {
    const personName = document.getElementById("reservePersonName").value.trim();
    if (!personName) {
      alert("名前を入力してください");
      return;
    }
    // 選択された商品と個数を取得
    const selectedProducts = [];
    reserveProductGrid.querySelectorAll(".reserve-product-card").forEach(card => {
      const idx = Number(card.dataset.idx);
      if (counts[idx] > 0) {
        selectedProducts.push({
          product: products[idx].title,
          count: counts[idx]
        });
      }
    });
    if (selectedProducts.length === 0) {
      alert("商品を1つ以上選択してください");
      return;
    }

    // 「会計」ボタンの場合は会計確認画面へ遷移
  if (btnReserveProductOk.textContent === "会計") {
    window.checkoutCounts = {};
    selectedProducts.forEach(sel => {
      const idx = products.findIndex(p => p.title === sel.product);
      if (idx !== -1) window.checkoutCounts[idx] = sel.count;
    });
    reserveProductPopup.classList.add("hidden");
    showCheckoutConfirm(() => {
      if (reserve) {
        reserve.checked = true;
        saveReservesToStorage();
        showReserveList();
      }
    });
    return;
  }

    // 編集時は上書き、新規時のみ追加
  if (reserve) {
    // 既存リストの内容を上書き
    reserve.name = personName;
    reserve.items = selectedProducts;
    saveReservesToStorage();
    reserveProductPopup.classList.add("hidden");
    showReserveList();
  } else {
    // 新規追加
    reserves.push({
      name: personName,
      checked: false,
      items: selectedProducts
    });
    saveReservesToStorage();
    reserveProductPopup.classList.add("hidden");
    showReserveList();
  }
  };
}
// escapeHtmlユーティリティ
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

document.getElementById("btnSalesInfo").onclick = function() {
  // 他の画面を非表示
  document.getElementById("sectionUriko").classList.add("hidden");
  document.getElementById("salesInfoView").classList.remove("hidden");

  // 売上データ取得
  const sales = JSON.parse(localStorage.getItem("sales") || "[]");
  // 商品ごとに売れた数を集計
  const productMap = {};
  products.forEach((p, idx) => {
    productMap[p.title] = {
      seq: idx + 1,
      title: p.title,
      originalStock: Number(p.stock) + sales.filter(s => s.title === p.title).reduce((sum, s) => sum + Number(s.count), 0),
      sold: 0,
      price: Number(p.price) || 0,
      currentStock: Number(p.stock)
    };
  });
  sales.forEach(s => {
    if (productMap[s.title]) {
      productMap[s.title].sold += Number(s.count);
    }
  });

  // 表HTML生成
  let tableHtml = `
    <table>
      <thead>
        <tr>
          <th>SEQ</th>
          <th>商品名</th>
          <th>元の在庫数</th>
          <th>売れた数</th>
          <th>残在庫</th>
        </tr>
      </thead>
      <tbody>
  `;
  let totalAmount = 0;
  Object.values(productMap).forEach(p => {
    tableHtml += `
      <tr>
        <td>${p.seq}</td>
        <td>${escapeHtml(p.title)}</td>
        <td>${p.originalStock}</td>
        <td>${p.sold}</td>
        <td>${p.currentStock}</td>
      </tr>
    `;
    totalAmount += p.sold * p.price;
  });
  tableHtml += `
      </tbody>
    </table>
  `;
  document.getElementById("salesInfoTable").innerHTML = tableHtml;
  document.getElementById("salesInfoTotal").textContent = `合計売上金額：￥${totalAmount.toLocaleString()}`;
};

// 戻るボタンも同様
document.getElementById("salesInfoBack").onclick = function() {
  hideSalesInfoView();
  // 売り子タブの初期画面（ボタン4つ）を表示
  document.getElementById("sectionUriko").classList.remove("hidden");
  document.getElementById("sectionKaiko").classList.add("hidden");
  if (urikoButtons) urikoButtons.classList.remove("hidden");
  if (productListView) productListView.classList.add("hidden");
  if (productFormView) productFormView.classList.add("hidden");
  if (checkoutPanel) checkoutPanel.style.display = "none";
};

// 売上情報画面を非表示にする関数
function hideSalesInfoView() {
  const salesInfoView = document.getElementById("salesInfoView");
  if (salesInfoView) salesInfoView.classList.add("hidden");
}