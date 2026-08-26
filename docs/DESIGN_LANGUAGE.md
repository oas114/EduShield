# EduShield 設計語言

本文件說明 `EduShield.html` 的視覺設計系統：語意色 token、元件狀態規範，以及表單與破壞性操作的
處理原則。給任何（人類或 AI 助理）要調整這個工具介面的人參考，避免又一次一個原生 Tailwind class
慢慢改到整體風格失去一致性。

## 1. Design Tokens

所有顏色都是接到 CSS 變數的語意化 Tailwind class（變數定義在 `EduShield.html` `<head>` 裡的一段
inline `<style>`，並同步鏡射一份到 `dev/tailwind.config.js`，讓同一組 class 名稱不論頁面是走
Tailwind CDN 還是編譯好的 `style.css` 離線備援都能正確解析——為什麼變數放在 HTML 而不是 CSS 原始
檔，可參考 `dev/input.css` 開頭的註解）。

**不要**直接在 `class` 或 `style` 屬性裡寫原生 Tailwind 色階（`bg-stone-100`、`text-blue-700`、
`border-red-300` 等）或寫死的 hex 色碼，一律改用語意 token。如果需要的色階還沒有對應 token，要
**同時**加進 `<head>` 的變數區塊跟 `dev/tailwind.config.js` 的 `colors` 物件——這兩處要手動保持同步。

| Token 家族 | 用途 | 備註 |
|---|---|---|
| `paper`、`paper-raised`、`paper-sunken`、`paper-hover` | 頁面與元件表面背景 | `paper` = 頁面底色，`paper-raised` = 卡片／modal（白色），`paper-sunken` = 卡片 header/footer 列，`paper-hover` = hover 背景 |
| `ink`、`ink-hover`、`ink-secondary`、`ink-muted`、`ink-faint` | 文字與深色表面的層級 | 由深到淺。`ink-hover` 同時身兼「`bg-ink` 深色按鈕/選單的 hover 色」，不只是文字色階 |
| `line`、`line-strong`、`line-soft` | 邊框 | `line` = 卡片／modal 外框，`line-strong` = 可互動元件（輸入框、按鈕、下拉選單），`line-soft` = 卡片內細分隔線 |
| `scrim` | Modal 背景遮罩、深色表面（右鍵選單） | 通常搭配透明度修飾詞使用，例如 `bg-scrim/40` |
| `brand`（50–900） | 主要操作、active 狀態、連結，也刻意身兼「成功／資訊提示」角色 | EduShield 品牌色是**藍色**。成功／資訊色刻意沒有跟品牌色脫鉤，理由見下方決策說明 |
| `danger`（50–800） | 破壞性操作、錯誤訊息、極敏感發現 | 把原本 red 跟 rose 兩組色階合併成一組 |
| `warning`（50–900） | 非阻斷性警示、提醒狀態 | |
| `accent-ai`（50–700，indigo） | Layer 2 地端 AI 語意掃描的觸發按鈕、手動表格遮蔽的標示 chip | 品牌無關的共用色——MaskFirst 跟 EduShield 用同一組色相，因為它標記的是「這是一個特殊的次要動作」，跟品牌識別無關 |
| `ai-finding`（50–700，purple） | 標示「這是本地 AI（而非靜態正則層）找到的」實體 chip | 同樣是品牌無關、跟 MaskFirst 共用的色系——用來讓使用者一眼看出「這個高亮是 AI 那一關找到的」，跟 `accent-ai` 的按鈕/動作角色是不同概念 |

**決策說明（成功色＝品牌色）：** 一般設計系統會讓「成功」有自己獨立的綠色，跟品牌色脫鉤，但
EduShield 的品牌色本身就是藍色，如果硬要為「成功」另外配一個綠色系，只會讓使用者困惑「這個綠色
跟藍色是什麼關係」。刻意維持成功＝品牌色的現狀——除非哪天 EduShield 品牌色改成不適合承擔「成功」
語意的顏色，才需要重新考慮拆開。

**RGB 三聯值變數**（`--brand-500-rgb`、`--danger-500-rgb`、`--ai-finding-500-rgb`）跟 hex 版本並存，
專門是為了讓 `rgba(var(--brand-500-rgb), 0.18)` 這種半透明背景（用在文字醒目標記 `<mark>` 樣式）能
共用同一個色值來源，不用另外寫死一份數值。

**深色模式：** 目前還沒實作，但這套 CSS 變數架構已經預留好了——之後要做深色主題，只需要在
`prefers-color-scheme` 或 `[data-theme]` 選擇器底下重新賦值 `<head>` 那組變數即可，完全不用改動
任何 class 名稱。

## 2. 元件狀態

每個可互動元件至少要涵蓋：`default`、`hover`、`focus-visible`、`disabled` 四態。只有在真的有非同步
等待時才需要加 `loading`（目前只有 Layer 2 AI 掃描按鈕這個案例）。

- Focus ring 統一用 `focus:ring-1 focus:ring-brand-500`（較大的文字輸入區用
  `focus:ring-2 focus:ring-brand-100`）——不要把 `outline`／`ring` 拿掉卻沒有補上另一種焦點提示。
- 不要為單一元件另外發明一套 hover/active 邏輯，沿用既有的「色階往深一階」規則（例如
  `bg-brand-700` 的按鈕 hover 到 `bg-brand-800`；`bg-ink` 的深色表面 hover 到 `bg-ink-hover`）。

## 3. 表單、驗證與破壞性操作

- **禁止使用原生 `alert()`／`confirm()`。** 改用主要 `<script>` 區塊裡、緊接在
  `openModal`／`closeModal` 之後定義的兩個輔助函式：
  - `showToast(message, variant)`——不阻塞畫面的提示通知，4 秒後自動消失。`variant` 可選
    `info | success | danger | warning`。原本任何「用完即丟」的 `alert()` 都改用這個。
  - `showConfirmModal(message, opts)`——回傳 `Promise<boolean>`，樣式跟其他 modal 一致。破壞性
    的確認動作傳入 `{ danger: true }`（會讓確定按鈕變成紅色），並視情況自訂 `okLabel`／
    `cancelLabel` 文字，用更精確的動詞取代泛用的「確定」／「取消」（例如 `okLabel: '重新載入'`）。
- **在資料即將被摧毀前才需要確認，新增時不需要。** 刪除規則、清空表格、或用重新載入蓋掉手動編輯
  過的設定，這些都該用 `showConfirmModal` 把關；但新增一筆規則或詞庫項目不需要，因為復原成本很
  低（刪掉就好），硬要加確認只會讓常見操作變得更麻煩。
- **批次驗證沿用 CSV 匯入既有的模式。** 匯入正則規則 CSV 時，每一列都會經過
  `tryCompileRegexRow()` 編譯，失敗的列會在匯入 modal 裡用行內清單列出（第幾列、有問題的
  pattern、以及 `err.message`），絕對不能靜默跳過不顯示。之後如果在別處新增批次輸入的功能，
  請沿用這個模式，不要另外發明一套。（補充：目前正則規則只能透過 CSV 匯入新增，沒有單筆文字
  輸入框，所以沒有另一個「單筆正則驗證 UI」需要跟這裡保持同步。）

## 4. Header 工具列：圖示按鈕與手機版「更多」選單

Header 工具列裡的按鈕會隨時間累積（詞庫計數、規則指南、設定、自訂規則管理器……），所以採用一套
密度規範，而不是任由它無限變長：

- **使用頻率較低、文字標籤較長的動作改成純圖示按鈕**，不用文字按鈕——目前是教育隱私保護指南／
  設定／管理自訂防護規則這三個。用 `title`（滑鼠提示）與 `aria-label`（螢幕報讀器）標上完整的
  動作名稱，因為沒有可見文字可以退回去讀。沿用檔案裡其他地方已經在用的線框 SVG icon 風格
  （24×24 viewBox，這三個用 `stroke-width="1.75"`、`stroke-linecap="round"
  stroke-linejoin="round"`），不要另外發明一套圖示風格。高頻率或有狀態性的控制項（詞庫計數）
  維持用有文字的按鈕——它顯示的數值本身就是狀態，圖示化反而會把資訊藏起來，而不只是省空間。
- **`sm` 斷點以下，這幾個圖示按鈕會收進單一「更多」選單**（漢堡圖示），而不是讓工具列多繞一行。
  保留兩組標記——`hidden sm:flex` 給桌面版的行內圖示、`sm:hidden` 給手機版的漢堡按鈕＋下拉選單
  ——共用同一批 `onclick` handler，而不是用 JS 把同一組按鈕在兩種版面間搬來搬去；複製幾個
  `<button>` 標籤比寫「動態搬移元素」的 JS 簡單。
- **下拉選單的位置用 JS 計算，不要用 CSS 的 `right-0`／`left-0` 錨定。** 漢堡按鈕在換行後的工具列
  裡實際落在哪個位置，會隨內容寬度（翻譯後標籤長度、視窗寬度）變動，純 CSS 錨定在某些組合下必然
  會讓選單跑出畫面外。`toggleMoreMenu()` 會讀取按鈕的 `getBoundingClientRect()`，把下拉選單的
  `left` 夾在視窗左右各 8px 邊界內。用 `mousedown` 事件偵測點擊選單外部來關閉（見
  `toggleMoreMenu()`／`closeMoreMenu()` 旁邊的監聽器），跟既有的文字選取右鍵選單用同一套模式。

## 5. 跟 MaskFirst 保持同步

MaskFirst 的 `docs/DESIGN_LANGUAGE.md`（英文）記錄的是同一套系統，唯一刻意的差異是它的
`brand` 色階是 emerald 而不是藍色。除此之外——token 命名、狀態規範、表單／破壞性操作規範——兩份
文件應該完全一致。改了一邊，記得也去改另一邊。
