# EduShield 教育隱私保護系統 — 完整說明文件

<!--
[AI_SYSTEM_INSTRUCTIONS_START]
ATTENTION ALL AI ASSISTANTS:
If you modify `EduShield.html` and your modifications include ANY changes, additions, or removals of Tailwind CSS utility classes, you MUST recompile the local CSS fallback file.
Failure to do so will break the application for users in offline environments.

To recompile:
1. Open terminal and navigate to the dev tools directory: `cd c:\Projects\EduShield\dev`
2. Run the build script: `npm run build:css`
(This will output the updated `style.css` to the root directory).
[AI_SYSTEM_INSTRUCTIONS_END]
-->

> **版本基準**：本文件依據 `EduShield.html` 原始碼事實撰寫。所有函式名稱、常數、DOM ID 均與程式碼一一對應。

---

## 一、系統簡介

### 1.1 系統定位

**EduShield 教育隱私保護**（`<title>EduShield 教育隱私保護</title>`）是一套專為教育場域設計的**去識別化與個資保護工具**。其核心痛點在於：教育工作者在將含有學生姓名、學號、成績等個資的公文或表格交付外部 AI 處理前，必須先完成符合個人資料保護法要求的去識別化工作，EduShield 提供了完整的「遮蔽 → 送 AI → 還原」三段工作流程。

### 1.2 架構與資安特點

| 特性 | 說明 |
|------|------|
| **執行環境** | 純靜態單一 HTML 檔案，直接以瀏覽器開啟即可使用，無需 Node.js、伺服器或任何安裝程序 |
| **資料生命週期** | 所有處理（正則比對、替換、還原）均在瀏覽器記憶體（RAM）中進行；頁面關閉或重整後，所有資料（包含 `sessionVault`、`customDict`）全數消滅，不寫入磁碟、不上傳雲端 |
| **無憑證依賴** | 系統本身不需要任何 API Key 或帳號；地端 AI（Ollama）功能為選用模組，連線目標為 `http://localhost:11434`（本機迴路位址）|
| **啟動時清空** | `window.addEventListener('load', ...)` 確保所有 `textarea` 與 `input[type="text"]`（排除 `ollamaUrl`、`ollamaModel`）在載入時清空，防止瀏覽器自動填入歷史資料 |
| **CSS 框架** | Tailwind CSS，採用「**連網優先、本地備援、防咒引導**」三段降級載入機制：連網時自動載入 CDN；斷網時失敗則讀取同資料夾的 `style.css`；兩者都失敗則顯示全螢幕防咒引導畫面 |
| **字型** | Inter（系統 sans-serif 堆疊，優先級最高）|

---

## 二、核心模組與技術規格

### 2.1 偵測與遮蔽規則庫 (`REGEX_RULES`)

系統內建一個常數陣列 `REGEX_RULES`（第 670 行），每個物件格式為 `{ type, regex, name, example }`。Token 格式為 `{{TYPE_N}}`，其中 `N` 為同類型的流水計數器。

**優先權邏輯**：`extractStaticEntities()` 中，實體依下列優先順序排序後，再以「占位格」(`occupied` 陣列)去除重疊：
1. `isCritical` 優先（硬阻斷詞彙最高優先）
2. 相同優先級下，以**字串長度降序**（長字串優先），防止短字串錯誤截斷長字串。

| 類別名稱 | 標籤格式 | 正規表示式摘要 | 偵測範例 |
|----------|----------|----------------|----------|
| 身分證字號 | `ID_CARD_N` | `[A-Z][12]\d{8}` | A123456789 |
| 居留證號 | `ARC_ID_N` | `[A-Z][A-D89]\d{8}` | A800000014 |
| 民國日期 | `ROC_DATE_N` | `(?:民國\s*)?(\d{2,3})\s*年...` | 民國112年8月15日 |
| 民國日期(數) | `ROC_DATE_NUM_N` | `\b\d{2,3}[\/.-]\d{1,2}[\/.-]\d{1,2}\b` | 112/08/15 |
| 西元日期 | `DATE_N` | `\b(19\d{2}|20\d{2})[-/.年]...` | 2026/08/19 |
| 行動電話 | `PHONE_N` | `09\d{2}-?\d{3}-?\d{3}` | 0912-345-678 |
| 市話/分機 | `TEL_N` | `0\d{1,2}-?\d{7,8}(?:...)` | 02-23456789#123 |
| 電子郵件 | `EMAIL_N` | `[a-zA-Z0-9._%+-]+@[...]` | user@mail.edu.tw |
| 台灣戶籍地址 | `ADDRESS_N` | 縣市+區+路街+號碼組合式 Regex | 406 台中市北屯區崇德路三段100號 |
| 學生學號 | `STUDENT_ID_N` | `\b\d{9}\b` | 112001001 |
| 系所與班級 | `DEPT_CLASS_N` | 學系/學院/學程 + 年班組合 | 資訊工程學系、一年A班 |
| 評量成績 | `SCORE_N` | `\b(?:100(?:\.0+)?|[1-9]?\d(?:\.\d+)?)\s*分` | 85.5分 |
| 名次排名 | `RANK_N` | `(?:全[校系班級]\s*)?第\s*\d+\s*名` | 全系第 3 名 |
| 百分位數PR | `PR_N` | `\bPR\s*\d{1,2}\b` | PR 92 |
| 學生獎懲 | `DISCIPLINE_N` | `(?:予以)?(?:警告|大過|小過|...)` | 警告一次 |
| 學校職稱 | `TITLE_N` | 副校長/主任/組長/導師/教師等組合式 Regex | 學務主任 |
| 表單案號 | `FORM_NUM_N` | `\b\d{8}\b` | 12345678 |
| 公文字號 | `DOC_NUM_N` | `\b[A-Z]\d{10}\b` | A1234567890 |
| 廠商名稱 | `VENDOR_N` | `...(?:股份有限公司|有限公司|企業社|...)` | 台灣資訊股份有限公司 |
| 經費金額 | `AMOUNT_N` | `NT$...|...\d+\s*(?:元|萬元)` | 1,250,000 元 |

### 2.2 安全阻斷防線 (`HARD_BLOCK_KEYWORDS`)

系統在第 663 行定義常數陣列 `HARD_BLOCK_KEYWORDS`，包含以下極敏感詞彙（共 36 項）：

> 自閉症、鑑輔會、性平通報、性騷擾、性侵害、家暴、家庭暴力、保護管束、心理諮商紀錄、特教身分、身心障礙手冊、身心障礙證明、重大傷病、自傷、低收入戶證明、個別化教育計畫、IEP、心評報告、輔導晤談、高關懷個案、學諮中心、自我傷害、自傷舉動、家暴通報、兒少保護、緊急安置、性平會、專案調查小組、中低收入戶、弱勢助學補助、弱勢助學、就學貸款、特教與身心障礙、心理輔導與諮商、兒少保護與家暴事件、性別平等事件、特殊經濟弱勢

**觸發後的 DOM 聯鎖反應**（`triggerHardBlock()`）：
1. `#hardBlockBanner` 從 `hidden` 變為可見（紅色警示橫幅）
2. `#copyPromptBtn` 設為 `disabled = true`（無法複製）
3. `#anonymizedOutput` 設為 `disabled = true` + 加入 `pointer-events-none`、`select-none`、`opacity-50`、`cursor-not-allowed`

**解鎖流程**：`openUnlockModal()` → `confirmUnlock()` → `resetHardBlockState()`（還原所有 DOM 狀態）。

AI 通道二（風險判定）也可能觸發此流程（若 AI 回傳 `critical: true`）。

### 2.3 自訂詞庫模組 (`customDict`)

- **資料結構**：`customDict`（全域陣列），每項為 `{ type: string, value: string, reason: string, isAi?: boolean }`
- **載入途徑**：
  1. **CSV 上傳** (`handleCsvUpload`)：使用 `FileReader.readAsText()` 讀取，逐行以 `,` 分割，自動跳過標題列（若首欄含「關鍵字」）。系統已具備自動去除雙引號機制，完美相容系統匯出與下載的 CSV 檔案。
  2. **線上建立/編輯** (`applyOnlineCsv`)：從 `#csvEditTbody` 的每個 `.csv-kw-input` / `.csv-type-input` 讀取，type 留空時預設為 `'CUSTOM'`
  3. **手動選取加入**：滑鼠選取文字後在浮動選單點擊「設為機密」，以 `type: 'CUSTOM'` 加入
  4. **AI 回傳** (`processAnonymizePhase2`)：通道一回傳的實體會以 `isAi: true` 加入
- **CSV 下載**：`downloadOnlineCsv()` 輸出 UTF-8 with BOM（`\uFEFF`），關鍵字欄以雙引號包覆

> [!WARNING]
> **CSV 格式限制**：系統以逗號（`,`）作為欄位分隔符號，解析時採簡單 `split(',')` 邏輯。**關鍵字欄位值中不可含有逗號**，否則該筆資料將被錯誤分割，導致詞彙載入異常。若詞彙本身含有逗號（如公司全名含頓號），請改用「**線上建立詞庫**」功能直接輸入。

### 2.4 地端 AI 模組（Ollama）

- **連線端點**：`{ollamaUrl}/api/generate`（POST），預設 `http://localhost:11434`
- **連線測試端點**：`{ollamaUrl}/api/tags`（GET），驗證 Ollama 啟動狀態與模型是否存在
- **預設模型選項**：`qwen2.5:3b`（預設，建議優先使用）、`qwen2.5:1.5b`、`llama3.1`、自訂輸入
- **傳輸格式**：`{ model, prompt, stream: true, format: "json" }`
- **呼叫條件**：點擊「透過地端 AI 深度掃描」按鈕（Phase 1 完成後才顯示）

| 通道 | 目的 | Prompt 摘要 | 回傳格式 |
|------|------|-------------|----------|
| 通道一 | 實體擷取 | 找出人名（含稱謂，如：「國文教師林大為」（稱謂在前）、「黃曉美老師」（稱謂在後）、「學生：王小明」（冒號分隔）及純姓名）、廠商機構、地址、專案名稱、帳號 | `[{"type":"PERSON","value":"...","reason":"..."}]` |
| 通道二 | 風險判定 | 判斷是否含特敏資訊（自傷、性侵、家暴、心理諮商、特殊教育需求等語意情境） | `{"critical": true/false, "reason": "..."}` |

- **串流處理**：使用 `ReadableStream` + `TextDecoder` 逐行解析 NDJSON，即時更新按鈕文字顯示進度（例如：`AI 掃描 (1/2) - 已收 N 字`），並結合 `truncate` 防止文字溢出換行。
- **JSON 容錯**：通道一支援 Array / Object 包裹 Array / 單筆物件等多種格式
- **錯誤處理與防護**：
  - **前置連線檢查**：點擊 AI 掃描按鈕時，系統會優先檢查 Ollama 是否啟動，若未啟動將立刻跳出通知並停止，避免使用者空等。
  - **手動取消機制**：掃描期間按鈕會顯示「點擊取消」，使用者可隨時點擊該按鈕強制中止 AI 掃描。
  - **異常字數偵測保護**：為防止模型產生幻覺而陷入無窮迴圈，系統會即時監控回傳字數。若超過合理上限（至少 3000 字，或大於原始輸入文字長度的 3 倍），系統將自動中斷連線並彈出警告，避免記憶體耗盡。
  - **逾時防護機制**：若 AI 超過 3 分鐘尚未完成回應，將彈出視窗詢問使用者是否中止。
  - 發生錯誤或中斷時以 `alert()` 顯示；`finally` 區塊強制恢復按鈕狀態、隱藏 Spinner，避免介面卡死。

### 2.5 反向還原與完整性檢驗模組

#### sessionVault 資料結構
```javascript
sessionVault = {
  "{{PERSON_1}}": "王小明",
  "{{ID_CARD_1}}": "A123456789",
  "{{TAB_C1_1}}": "（表格儲存格原始值）",
  // ...
}
```
Token 格式規則：
- 一般規則/詞庫/手動：`{{TYPE_N}}`
- 表格手動遮蔽：`{{TAB_C{欄+1}_{列計數器}}}`

#### 還原演算法（`processRestore()`）
1. 讀取 `#aiReplyInput` 的文字內容
2. **自動移除系統指令前綴**：以正則去除 AI 可能照抄回來的「`【系統指令：...】`」前綴
3. 遍歷 `sessionVault`，對每個 Token 進行字串比對：
   - **精確匹配**：`replyText.includes(token)`，使用 `split().join()` 全替換
   - **模糊匹配 1（多餘空白容錯）**：建立 `/\{\{\s*TYPE_N\s*\}\}/gi` Regex，允許 Token 前後有多餘空白
   - **模糊匹配 2（括號容錯）**：建立能配對 `【TYPE_N】`、`(TYPE_N)`、`[TYPE_N]` 等被中文書名號或全形括號包裹的 Regex
   - **未命中**：加入 `missing` 陣列
4. 對表格行（含 `\t`）包裹虛線格 `<span class="outline outline-1 outline-dashed...">`
5. 將 HTML 寫入 `#restoredOutputView`（`contenteditable="true"`，可直接編輯）

#### 完整性回饋（`#integrityStatus`）
- **全數還原**：綠色「✓ 全數還原成功」
- **尚無遮蔽紀錄**：若使用者未執行去識別化就直接點擊「執行還原」，系統會彈出警告詢問使用者先執行打包。
- **有遺漏**：紅色「⚠ 遺漏 N 項，請查看左側紀錄」；為避免壓縮標題列，僅顯示數量而不列出代碼明細。遺漏的詞彙會同時在兩處以**紅色**標示：
  - 左側`#readOnlyOriginal`（原始資料與遮蔽紀錄文字區）中的對應膠囊變為紅色（採段落分割法渲染，確保 token 字串不被 HTML 跳脫影響）
  - 左側底部`#restoreChips`（遮蔽項目膠囊列表）中的對應膠囊變為紅色

#### 三方互動對照（`highlightCrossReference()`）
- 透過 `document.querySelectorAll('[data-token]')` 搭配 `getAttribute` 比對，避免 CSS 屬性選擇器對大括號（`{` `}`）解析失敗的問題，確保跨區域藍框同步高亮正確運作。

#### 遮蔽點擊切換（`toggleMask()`）
還原結果中，每個已還原的詞彙都是可點擊的 span，支援三段切換：
- **狀態 0（顯示）**：顯示原始文字
- **狀態 1（完全遮蔽）**：以 `#customMaskSymbol`（預設 `■`）重複填充
- **狀態 2（部分遮蔽）**：保留首末字，中間以全形 `Ｏ` 填充

---

## 三、系統操作手冊

### 3.1 環境需求

| 項目 | 需求 |
|------|------|
| 作業系統 | Windows（主要支援環境）|
| 瀏覽器 | Chrome / Edge 建議（需支援 ES2020+、ReadableStream、Clipboard API）|
| 啟動方式 / 網路需求 | **一般離線**：直接開啟 `EduShield.html` 即可。<br>**封閉型內網（無網際網路）**：必須同時具備 `EduShield.html` 與本地的 `style.css` 並置於同資料夾，以取代原本依賴外部 CDN 載入 CSS 的行為。 |
| 地端 AI（選用）| 安裝 Ollama、下載 `qwen2.5:3b` 模型（建議優先使用，可在較舊或低記憶體電腦順利運作）、設定環境變數 `OLLAMA_ORIGINS = *` |

### 3.2 標準操作流程

> [!IMPORTANT]
> **前置作業提示（零信任安全原則）**
> 
> 基於零信任的安全最高原則，正式處理真實機密資料時，**請務必將檔案下載至本機端離線操作**。GitHub Pages 提供的線上部署連結僅供功能展示與規則測試使用。

#### 步驟一（選用）：匯入與建立自訂詞庫
系統提供兩種方式管理您的自訂詞彙（例如特定的專案名稱或人員名單）：
1. **匯入 CSV 檔案**：點擊首頁頂部的「**匯入自訂詞庫 (CSV)**」按鈕上傳您準備好的 `.csv` 檔案。
2. **檢視、擴充與搜尋**：成功載入後，點擊頂部的 `詞庫: N` 按鈕即可打開「自訂詞庫管理」視窗，檢視目前記憶體中的詞庫內容。您可以使用頂部的兩個搜尋框即時篩選關鍵字與類別，並可隨時編輯或刪除。
3. **線上建立與編輯**：您也可以隨時從「**系統設定**」中點選「**線上建立/擴充詞庫**」。
   - **預先載入既有資料**：開啟編輯器時，系統會自動將目前記憶體中的所有自訂詞彙無縫載入表格，方便您接續修改、新增或刪除，且刪除時序號會自動重新排序。
   - **Excel 快速貼上**：支援從 Excel 複製多欄多列資料並直接貼上，系統會自動擴展表格並填入；單欄貼到「類別」欄位時，系統會自動僅填入類別而不覆蓋關鍵字。
   - **鍵盤導覽**：方向鍵可在儲存格間穿梭；游標移至刪除按鈕後按 Enter 刪除，焦點自動跳至下一列。
   - **雙重匯出**：編輯完成後可點擊「**直接套用至系統**」立即生效，或選擇「**下載成 CSV**」以供未來使用（輸出格式為 UTF-8 with BOM）。

#### 步驟二：輸入原始資料
1. 在左側「**原始資料輸入**」區貼上公文或表格內容。
2. 系統會以 200ms Debounce 即時掃描並以彩色高亮顯示偵測到的敏感詞彙，並在下方「**偵測項目**」膠囊列出所有命中項目。（註：若貼入文字超過 50,000 字元，系統會提示警告，且標記處理可能較慢）。
3. 若要**取消特定詞彙的遮蔽**，可點擊對應膠囊右側的 `×` 按鈕，或直接在文字中選取後於浮動選單選擇「取消遮蔽」。
4. 若要**手動指定額外遮蔽**，在文字中選取目標詞彙後，點擊浮動選單的「設為機密」選項即可加入。

#### 步驟三（選用）：表格遮蔽操作
若貼入的文字包含以 Tab（`\t`）分隔的表格，系統會自動在每個儲存格外顯示虛線格框。
1. 在表格中的任意位置**單擊**（不選取文字），即會出現浮動選單，提供：
   - `[表格] 遮蔽此儲存格`
   - `[表格] 遮蔽整欄`（整個表格的該欄）
   - `[表格] 遮蔽整列`（整行所有儲存格）
2. 已遮蔽的儲存格/欄/列同樣可透過浮動選單**解除遮蔽**。
3. **偵測項目晶片支援**：手動遮蔽的表格儲存格會在左下方的「偵測項目」區以**靛藍色晶片**（標有「表格」標記）呈現。滑鼠懸停時，backdrop 預覽區中對應的遮蔽格會顯示靛藍色外框。
   > [!NOTE]
   > 表格儲存格晶片是**獨立渲染**至晶片列表，並**不注入** `activeExtractedEntities`，以避免 `processAnonymize` 重複為同一儲存格建立 token（既有 `{{TAB_C_r_c}}` 又有 `{{TABLE_CELL_N}}`），確保 `sessionVault` 紀錄唯一且還原正確。

#### 步驟四：執行去識別化
點擊「**執行去識別化**」按鈕，右側面板將顯示：
- **遮蔽項目明細**：原始文字 → Token（如 `王小明 → {{PERSON_1}}`）對照表
- **去識別化後之資料**：完整替換後的文字，已附加系統指令前綴，可直接複製給外部 AI
- **三方互動對照（Hover 雙向同步）**：滑鼠懸浮於左下方的偵測膠囊，或右側的遮蔽項目明細時，三個區塊會即時同步：左側「原始資料輸入」區的對應詞彙會高亮加深、左下角對應膠囊會放大標示，且右側的明細列表會自動滾動至對應列並反白，方便全方位核對。
- 若偵測到硬阻斷詞彙，畫面頂部出現紅色警示橫幅，「**複製已遮蔽資料**」按鈕被鎖定

#### 步驟五（選用）：透過地端 AI 深度掃描
若已設定好 Ollama，按鈕「**透過地端 AI 深度掃描**」（去識別化完成後顯示）可進一步：
1. 通道一：提取靜態規則可能遺漏的實體（人名、廠商、地址、專案、帳號）
2. 通道二：對文章進行特敏風險判定（自傷、性侵、家暴等），若命中則自動觸發阻斷

#### 步驟六：複製送出與還原
1. 點擊「**複製已遮蔽資料**」，將去識別化文字（含系統指令）傳送給外部 AI（ChatGPT / Claude）
2. 切換至「**還原**」頁籤
3. 將 AI 的回覆貼至「外部 AI 回覆」區（支援「貼上剪貼簿」或「放大檢視」模態框）
4. 點擊「**執行還原**」，系統自動比對 Token 並還原原始資料
5. 「**還原結果**」區域為可直接編輯的富文本區，點擊已還原的詞彙可在「顯示 / 部分遮蔽 / 完全遮蔽」三種狀態間切換
6. 若需重新操作，可點擊「**清除結果**」將還原區及狀態列重置（保留外部 AI 回覆以便您微調內容後再次還原）
7. 確認無誤後，點擊「**複製還原文字**」完成作業

### 3.3 常見問題與故障排除

| 問題現象 | 可能原因 | 排查方式 |
|----------|----------|----------|
| 詞庫顯示「詞庫: 0」，明明已匯入 | CSV 編碼非 UTF-8 或欄位含特殊字符 | 點擊 `詞庫: N` 按鈕開啟管理視窗，確認資料是否正確載入；或改用「線上建立詞庫」直接輸入 |
| 執行去識別化後某些詞彙未被遮蔽 | 該詞彙已在白名單（`whitelist` Set）或未命中任何規則 | 手動選取文字後點擊「設為機密」 |
| AI 掃描按鈕點擊後長時間無反應 | Ollama 未啟動或 CORS 未設定 | 至「系統設定」執行「測試連線」，確認出現綠色「連線成功！」 |
| AI 掃描過程中跳出「回傳字數異常」錯誤 | 地端模型產生幻覺，不斷輸出無意義字元 | 系統已自動啟動保護機制中斷連線。建議嘗試更換其他模型或修改輸入內容 |
| 還原結果顯示「遺漏 N 項」 | 外部 AI 修改或刪除了 Token 標籤 | 對照左側「原始資料與遮蔽紀錄」中的紅色膠囊，手動在還原結果中補充 |
| 複製已遮蔽資料按鈕呈灰色無法點擊 | 觸發了硬阻斷（原始資料含極敏感詞彙） | 點擊紅色橫幅「查看詳情與解鎖」，確認無誤後強制解鎖；或修改原始資料移除敏感詞彙 |
| 表格貼入後格線偏移 | 瀏覽器字型渲染差異或非等寬字型 | 確認使用 Chrome / Edge，高亮編輯器已設定 `font-family: monospace` 與 `tab-size: 4` |

---

## 四、進階開發者資訊

### 4.1 自訂硬阻斷詞彙
使用文字編輯器開啟 `EduShield.html`，搜尋 `HARD_BLOCK_KEYWORDS`，在陣列中加入您的自訂詞彙。

### 4.2 自訂偵測規則
搜尋 `REGEX_RULES`，依照 `{ type: "標籤名", regex: /您的正規表示式/g, name: "中文名稱", example: "偵測範例" }` 格式新增規則。

### 4.3 自訂預設模型選項
搜尋 `<select id="ollamaModelSelect">`，在 `<option>` 列表中直接加入您機構常用的模型名稱。

---

### 4.4 Tailwind CSS 本地備援：編譯 `style.css` 指南

> [!IMPORTANT]
> 當斷網環境開啟系統時，瀏覽器會嘗試讀取同資料夾的 `style.css`。若此檔不存在，將顯示防呆引導畫面。

#### 開發環境初始化（已完成，僅需執行一次）

> [!NOTE]
> 為了保持專案目錄整潔，所有 Tailwind CSS 相關的開發工具檔案已移至 **`dev/`** 資料夾中。

以下步驟**已執行完畢**，相關檔案（`dev/package.json`、`dev/tailwind.config.js`、`dev/input.css`、`dev/node_modules/`）均已存在，無需重複執行。

`powershell
# 1. 建立並進入 dev 資料夾
mkdir dev; cd dev

# 2. 初始化 npm 專案並安裝 Tailwind CSS v3
npm init -y
npm install --save-dev tailwindcss@3
`

**`dev/tailwind.config.js`**：
（注意 `content` 路徑指向上一層目錄的 HTML 檔案）
`javascript
module.exports = {
  content: ["../*.html"],
  theme: { extend: {
    fontFamily: {
      sans: ['Inter','ui-sans-serif','system-ui','-apple-system','sans-serif'],
      mono: ['ui-monospace','Menlo','Monaco','Consolas','monospace'],
    },
    colors: { paper: '#FAF9F6', ink: '#292524' },
  }},
  plugins: [],
};
`

**`dev/input.css`**：
`css
@tailwind base;
@tailwind components;
@tailwind utilities;
`

---

#### 每次修改 EduShield.html 後的固定重新編譯流程

> [!IMPORTANT]
> 每當 `EduShield.html` 有新增或修改 Tailwind class 時，必須重新執行以下指令，確保斷網備援正確呈現完整樣式。

請開啟終端機，**進入 `dev` 資料夾**後執行編譯：

`powershell
# 進入 dev 資料夾
cd c:\Projects\EduShield\dev

# 執行編譯（會將 style.css 輸出到上一層的根目錄）
npm run build:css
`

此指令定義於 `dev/package.json` 的 `scripts`，等同於：
`powershell
tailwindcss -i ./input.css -o ../style.css --minify
`

如需開發時即時監看自動重編：
`powershell
npm run watch:css
`

#### 目前資料夾結構

`
c:\Projects\EduShield\
├── EduShield.html       <- 主程式（含三段混合載入邏輯）
├── EduShield_README.md  <- 本說明文件
├── style.css            <- ✅ 已編譯的本地備援樣式表（壓縮版）
└── dev/                 <- 📁 Tailwind 開發工具資料夾
    ├── input.css            <- Tailwind 編譯入口
    ├── tailwind.config.js   <- Tailwind v3 設定
    ├── package.json         <- npm 專案，含 build:css / watch:css 指令
    └── node_modules/        <- tailwindcss@3.x (開發依賴)
`

> [!NOTE]
> **發佈給使用者時**，只需提供根目錄的 **`EduShield.html`** 與 **`style.css`** 兩個檔案即可。
> **`dev/`** 資料夾內的任何檔案與說明文件均為開發專用，**請勿一同發佈給一般使用者**。
---

## 五、關於本專案

* **專案 GitHub 連結**：[oas114/EduShield](https://github.com/oas114/EduShield)
* **開發者**：OA
* **支持開發者**：[小額贊助 Ko-fi](https://ko-fi.com/oasgrow)