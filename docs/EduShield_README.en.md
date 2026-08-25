# EduShield — Full Technical Reference

<!--
[AI_SYSTEM_INSTRUCTIONS_START]
ATTENTION ALL AI ASSISTANTS:
If you modify `EduShield.html` and your modifications include ANY changes, additions, or removals of Tailwind CSS utility classes, you MUST recompile the local CSS fallback file.
Failure to do so will break the application for users in offline environments.

To recompile:
1. Open terminal, navigate to the `dev/` folder inside the project root.
2. Run the build script: `npm run build:css`
(This will output the updated `style.css` to the project root.)

IMPORTANT SYNC NOTE:
This file (`EduShield_README.en.md`) is a full English translation of `EduShield_README.md`.
Whenever `EduShield_README.md` is updated, this file MUST be updated to match.
[AI_SYSTEM_INSTRUCTIONS_END]
-->

> **Reference Baseline**: This document is written strictly against the `EduShield.html` source code. All function names, constants, and DOM IDs correspond directly to the codebase.

[ [繁體中文 (EduShield_README.md)](EduShield_README.md) | [English](EduShield_README.en.md) ]

✨ **[Try the Interactive Manual](https://oasgrow.com/EduShield/#)** ✨  
*We highly recommend exploring the interactive manual first to experience how EduShield works.*

> [!IMPORTANT]
> **Disclaimer**: This document and the EduShield tool itself provide only technical masking/restoration capability to reduce data-exposure risk when submitting content to AI; **neither constitutes legal advice, and using them alone does not guarantee compliance with Taiwan's Personal Data Protection Act or any other regulation**. Whether your data handling is compliant still depends on your (or your organization's) overall data collection, processing, and use practices — consult professional legal advice if in doubt.

---

## I. System Overview

### 1.1 Purpose

**EduShield** is a de-identification and PII (Personally Identifiable Information) protection tool designed for the education sector. The core problem it solves: educators need to submit documents or spreadsheets containing student names, ID numbers, grades, and other personal data to external AI services (e.g., ChatGPT, Claude) for processing — but doing so risks exposing that data. EduShield provides a complete three-stage workflow — **Mask → Send to AI → Restore** — to reduce that risk at a technical level (it does not by itself guarantee compliance with Taiwan's Personal Data Protection Act or any other regulation).

### 1.2 Architecture & Security Features

| Feature | Description |
|---------|-------------|
| **Runtime Environment** | Pure static single-file HTML. Open directly in a browser — no Node.js, no server, no installation required |
| **Data Lifecycle** | All processing (regex matching, token replacement, restoration) occurs entirely in browser RAM. On page close or refresh, all data (`sessionVault`, `customDict`) is destroyed — no disk writes, no cloud uploads |
| **Zero Credential Dependency** | The system requires no API keys or accounts. The local AI (Ollama) module is optional and connects only to `http://localhost:11434` (loopback address) |
| **Startup Sanitization** | `window.addEventListener('load', ...)` clears all `textarea` and `input[type="text"]` fields (except `ollamaUrl` and `ollamaModel`) on load, preventing browser autofill from leaking history |
| **CSS Framework** | Tailwind CSS with a three-tier graceful degradation strategy: **CDN-first → Local fallback (`style.css`) → Failsafe guidance screen** |
| **Font** | Inter (system sans-serif stack, highest priority) |
| **Mobile Responsive Support** | Fully responsive interface with intelligent breakpoint design and auto-adjusting heights, ensuring smooth scrolling and operation across various device sizes. |

---

## II. Core Modules & Technical Specifications

### 2.1 Detection & Masking Rule Engine (`REGEX_RULES_DEFAULT`)

The system defines a frozen constant array `REGEX_RULES_DEFAULT` (`Object.freeze`) as the built-in baseline that "Reset to Defaults" restores to. Detection logic actually reads from the live working state `regexRules` (each entry additionally carries `pattern`/`flags`/`source`), which can be extended via the "Manage Custom Protection Rules" UI — see 2.6. Each entry follows the format `{ type, regex, name, example }`. Tokens follow the format `{{TYPE_N}}`, where `N` is a per-type sequential counter.

**Priority Logic**: Inside `extractStaticEntities()`, entities are sorted before overlap removal (`occupied` array):
1. `isCritical` entities take highest priority (Hard Block keywords first)
2. Within the same priority level, longer strings take precedence (prevents short strings from incorrectly truncating longer ones)

> **Note**: The default rule set is primarily designed for **Taiwan (ROC)** data formats. Developers are warmly invited to submit Pull Requests to extend coverage for other countries' PII formats (e.g., US SSN, EU GDPR fields, etc.).

| Category | Token Format | Regex Summary | Example |
|----------|-------------|---------------|---------|
| National ID (ROC) | `ID_CARD_N` | `[A-Z][12]\d{8}` | A123456789 |
| ARC / Resident Certificate | `ARC_ID_N` | `[A-Z][A-D89]\d{8}` | A800000014 |
| ROC Date (written) | `ROC_DATE_N` | `(?:民國\s*)?(\d{2,3})\s*年...` | 民國112年8月15日 |
| ROC Date (numeric) | `ROC_DATE_NUM_N` | `\b\d{2,3}[\/.-]\d{1,2}[\/.-]\d{1,2}\b` | 112/08/15 |
| Gregorian Date | `DATE_N` | `\b(19\d{2}\|20\d{2})[-/.年]...` | 2026/08/19 |
| Mobile Phone (TW) | `PHONE_N` | `09\d{2}-?\d{3}-?\d{3}` | 0912-345-678 |
| Landline / Extension | `TEL_N` | `0\d{1,2}-?\d{7,8}(?:...)` | 02-23456789#123 |
| Email Address | `EMAIL_N` | `[a-zA-Z0-9._%+-]+@[...]` | user@mail.edu.tw |
| Taiwan Address | `ADDRESS_N` | City + District + Street + Number composite Regex | 406 台中市北屯區崇德路三段100號 |
| Student ID | `STUDENT_ID_N` | `\b\d{9}\b` | 112001001 |
| Department / Class | `DEPT_CLASS_N` | Department/College/Program + Year/Class group | 資訊工程學系、一年A班 |
| Academic Score | `SCORE_N` | `\b(?:100(?:\.0+)?|[1-9]?\d(?:\.\d+)?)\s*分` | 85.5分 |
| Class Rank | `RANK_N` | `(?:全[校系班級]\s*)?第\s*\d+\s*名` | 全系第 3 名 |
| Percentile Rank (PR) | `PR_N` | `\bPR\s*\d{1,2}\b` | PR 92 |
| Disciplinary Record | `DISCIPLINE_N` | `(?:予以)?(?:警告|大過|小過|...)` | 警告一次 |
| School Title / Role | `TITLE_N` | Principal / Dean / Director / Teacher / Homeroom, etc. (composite Regex) | 學務主任 |
| Form Case Number | `FORM_NUM_N` | `\b\d{8}\b` | 12345678 |
| Official Document Number | `DOC_NUM_N` | `\b[A-Z]\d{10}\b` | A1234567890 |
| Vendor / Contractor Name | `VENDOR_N` | `...(?:股份有限公司|有限公司|企業社|...)` | 台灣資訊股份有限公司 |
| Budget / Expense Amount | `AMOUNT_N` | `NT$...\|...\d+\s*(?:元|萬元)` | 1,250,000 元 |

### 2.2 Hard Block Safety Interlock (`HARD_BLOCK_KEYWORDS_DEFAULT`)

The system defines a frozen constant array `HARD_BLOCK_KEYWORDS_DEFAULT` (`Object.freeze`) containing 36 extremely sensitive terms related to special education needs, child protection, gender-based violence, mental health records, and economic vulnerability, as the built-in baseline. Detection logic actually reads from the live working state `hardBlockKeywords` (each entry carries a `source` field), which can be extended via the "Manage Custom Protection Rules" UI — see 2.6. When any of these terms are detected, the system immediately locks down.

**DOM Cascade on Trigger** (`triggerHardBlock()`):
1. `#hardBlockBanner` becomes visible (red warning banner at the top)
2. `#copyPromptBtn` is set to `disabled = true` (copy function locked)
3. `#anonymizedOutput` is set to `disabled = true` + `pointer-events-none`, `select-none`, `opacity-50`, `cursor-not-allowed`

**Unlock Flow**: `openUnlockModal()` → `confirmUnlock()` → `resetHardBlockState()` (restores all DOM states).

AI Channel 2 (risk assessment) can also trigger this flow if it returns `critical: true`.

### 2.3 Custom Dictionary Module (`customDict`)

- **Data Structure**: `customDict` (global array), each entry: `{ type: string, value: string, reason: string, isAi?: boolean, source: string }`
- **Loading Methods**:
  1. **CSV Upload** (`handleCsvUpload`): Uses `FileReader.readAsText()`, parsed via `parseCsvLine()` (supports standard CSV double-quote escaping, so field values may contain commas). Automatically skips header rows (if the first column contains "關鍵字" / keyword). The parsed rows are then handed to the Merge/Replace/Cancel dialog rather than blindly overwriting the dictionary — see 2.6.
  2. **Online Create / Edit** (`applyOnlineCsv`): Reads from each `.csv-kw-input` / `.csv-type-input` in `#csvEditTbody`. If `type` is left blank, defaults to `'CUSTOM'`. (This path keeps its original overwrite-everything behavior and does not go through the merge dialog.)
  3. **Manual Text Selection**: Select text in the editor, then click "設為機密" (Mark as Confidential) in the floating menu — adds entry with `type: 'CUSTOM'`.
  4. **AI Return** (`processAnonymizePhase2`): Entities returned by Channel 1 are added with `isAi: true` and `source: 'ai-session'` — a per-document, session-only result excluded when exporting a config file.
- **CSV Export**: `downloadOnlineCsv()` outputs UTF-8 with BOM, with keyword fields wrapped in double quotes; the blank template is served separately by `downloadCsvTemplate()` (filename `EduShield_詞庫範本.csv`, deliberately different from the export filename to avoid one overwriting the other).

### 2.4 Local AI Module (Ollama)

- **API Endpoint**: `{ollamaUrl}/api/generate` (POST), default: `http://localhost:11434`
- **Connection Test Endpoint**: `{ollamaUrl}/api/tags` (GET) — verifies Ollama is running and the target model exists
- **Default Model Options**: `qwen2.5:3b` (default, recommended), `qwen2.5:1.5b`, `llama3.1`, or custom input
- **Payload Format**: `{ model, prompt, stream: true, format, options }` — `format` is a full JSON Schema (not the loose `"json"` string), forcing a flat array with a 5-value `type` enum (`PERSON`/`VENDOR`/`ADDRESS`/`PROJECT`/`BANK_ACCT`) so the model can't return a type-grouped object that gets silently reduced to one category by the existing fallback parser. Channel 1 fixes `options: { temperature: 0, num_ctx: 8192 }` for deterministic extraction; Channel 2 fixes `options: { num_ctx: 8192 }` (deliberately *not* pinning `temperature` — see the Channel 2 note below). `num_ctx` is raised from Ollama's 2048 default so longer pasted text doesn't get silently truncated.
- **Trigger Condition**: Clicking the "透過地端 AI 深度掃描" (Local AI Deep Scan) button, which appears only after Phase 1 (de-identification) is complete

| Channel | Purpose | Prompt Summary | Return Format |
|---------|---------|----------------|---------------|
| Channel 1 | Entity Extraction | Identifies person names (with various title/honorific patterns), vendors/shops (including informal names without 公司/Co.), addresses, project names, account numbers | `[{"type":"PERSON","value":"...","reason":"..."}]` |
| Channel 2 | Risk Assessment | Detects semantically sensitive content (self-harm, sexual assault, domestic violence, counseling records, special education needs, etc.) described in narrative form — even without triggering static hard-block keywords | `{"critical": true/false, "reason": "..."}` |

> **Known accuracy limitation**: real-world testing shows Channel 1's `PERSON` extraction is not reliable — small models like `qwen2.5:3b` frequently miss names, since they're a free-form, highly context-dependent entity type. The UI's passive hint (`layer1HintBanner`) points users at the Custom Dictionary for names instead of the deep scan for this reason; treat Channel 1's `PERSON` output as best-effort, not authoritative.

> **Channel 2 runs 3 sequential calls and unions the results**: any single run returning `critical: true` marks the text as risky — this is a union, not a majority vote. The 3 runs deliberately keep the model's default `temperature` (not Channel 1's `temperature: 0`), otherwise all 3 runs would return nearly identical output and the repetition would be wasted. Real-text testing found that softly-worded, indirect phrasing (the kind teachers/social workers commonly use for sensitive topics) had only ~20% single-call hit rate; repeating the call raises the cumulative catch rate. If a run fails (timeout, connection drop), it's skipped and the remaining runs continue — an error is only shown if all 3 fail.

- **Streaming**: Uses `ReadableStream` + `TextDecoder` to parse NDJSON line-by-line. Channel 1 updates the button text with a live character count (e.g., `掃描(1/2) 已收 N 字`); Channel 2's output is small enough that a character count isn't meaningful, so it instead shows the current attempt number (e.g., `Confirming semantic risk (2/3)`). Both use `truncate` to prevent overflow.
- **JSON Fault Tolerance**: Channel 1 still keeps its Array / Object-wrapped Array / single Object fallback parser as a safety net on top of the schema-enforced format.
- **Error Handling & Protection**:
  - **Pre-flight Connection Check**: Before scanning, the system verifies Ollama is running. If not, an alert is shown immediately and scanning is aborted.
  - **Manual Cancel**: During scanning, the button shows "點擊取消" (Click to Cancel) — the user can abort at any time.
  - **Runaway Output Protection**: The system monitors response character count in real time. If output exceeds the allowed limit (at least 3,000 characters, or 3× the input length), the connection is automatically terminated and a warning is shown.
  - **Timeout Protection**: If the AI takes more than 3 minutes to respond, a dialog asks the user whether to abort.
  - Errors and interruptions are shown via `alert()`; the `finally` block always restores button state and hides the spinner.

### 2.5 Restore & Integrity Verification Module

#### `sessionVault` Data Structure

```javascript
sessionVault = {
  "{{PERSON_1}}": "王小明",
  "{{ID_CARD_1}}": "A123456789",
  "{{TAB_C1_1}}": "(original cell value)",
  // ...
}
```

Token naming rules:
- Standard rules / dictionary / manual: `{{TYPE_N}}`
- Table cell masking: `{{TAB_C{col+1}_{row counter}}}`

#### Persistent Mapping Vault (`persistentVault`)

`sessionVault` is cleared and rebuilt on every de-identification run, and tokens are sequential numbers — so the same original value can get a different token across different batches (or browser sessions), making cross-batch restore checks unreliable. The "Mapping Vault" button on the Restore tab lets you export the accumulated original-value ↔ token mapping to a file, then import it later so already-known values reuse their previous token instead of being renumbered.

- **Unencrypted (CSV)**: three columns (original value / token / type), openable directly in Excel; a risk notice is shown before export (the file is plain text — avoid folders that auto-sync to the cloud).
- **Encrypted (JSON)**: encrypted with a user-chosen password via the Web Crypto API (PBKDF2 key derivation + AES-GCM). If you forget the password, the file cannot be recovered — there is no backdoor.
- On import, you choose to merge with or completely replace the current mapping.
- Coordinate-based table masking tokens (`{{TAB_C...}}`) are positional and are not included in this vault.
- This is a manual, one-off export/import feature — it is never written to browser storage automatically. `persistentVault` starts empty on every page load and must be re-imported each time.

#### Restore Algorithm (`processRestore()`)

1. Reads text content from `#aiReplyInput`
2. **Auto-strips system instruction prefix**: Regex-removes any `【系統指令：...】` prefix that the AI may have echoed back
3. Iterates `sessionVault`, matching each token:
   - **Exact match**: `replyText.includes(token)` — uses `split().join()` for global replacement
   - **Fuzzy match 1 (whitespace tolerance)**: Builds `/\{\{\s*TYPE_N\s*\}\}/gi` to allow whitespace around the token
   - **Fuzzy match 2 (bracket tolerance)**: Builds regex to match `【TYPE_N】`, `(TYPE_N)`, `[TYPE_N]` (full-width and CJK brackets)
   - **Unmatched**: Added to the `missing` array
4. Table rows (containing `\t`) are wrapped in dashed outline `<span>` elements
5. HTML is written to `#restoredOutputView` (`contenteditable="true"`, directly editable)

#### Integrity Feedback (`#integrityStatus`)

- **All restored**: Green "✓ 全數還原成功"
- **No masking records**: If the user clicks Restore without first running de-identification, a warning dialog prompts them to do so.
- **Missing items**: Red "⚠ 遺漏 N 項，請查看左側紀錄". Missing tokens are highlighted in **red** in two locations simultaneously:
  - The corresponding chip in `#readOnlyOriginal` (original text + masking log area) on the left
  - The corresponding chip in `#restoreChips` (masked item chip list) at the bottom left

#### Three-Way Cross-Reference (`highlightCrossReference()`)

Uses `document.querySelectorAll('[data-token]')` + `getAttribute` to compare tokens, bypassing CSS attribute selector failures caused by curly braces (`{`, `}`), ensuring correct synchronized blue-ring highlighting across all three panels.

#### Mask Toggle (`toggleMask()`)

Each restored token is a clickable `<span>` supporting three-state cycling:
- **State 0 (Show)**: Displays the original text
- **State 1 (Full Mask)**: Fills with repeated `#customMaskSymbol` characters (default `■`)
- **State 2 (Partial Mask)**: Keeps the first and last character; fills the middle with full-width `Ｏ`

### 2.6 Custom Protection Manager (Four Dimensions)

Click "**Manage Custom Protection Rules**" in the toolbar to customize, import, and export across four dimensions, with no need to hand-edit the HTML source:

1. **Roster / Dictionary** (`customDict`, see 2.3)
2. **Hard Block Keywords**: its own tab; CSV format is a single column (`關鍵字`)
3. **Regex Rules**: its own tab; CSV format is 4 columns (`替換標籤,規則名稱,正規表示式,說明範例`) — the pattern column accepts either a bare pattern (defaults to flag `g`) or a full `/pattern/flags` literal-style string
4. **Local AI Prompts**: the "地端 AI 提示詞" tab exposes editable textareas for both channels, showing the currently effective prompt text with a one-click "Reset to Default"; the `{{TEXT}}` placeholder is substituted with the actual text to scan at call time

#### Data Model

Built-in defaults are frozen as `HARD_BLOCK_KEYWORDS_DEFAULT` / `REGEX_RULES_DEFAULT` / `AI_PROMPTS_DEFAULT`. Three live working-state variables are what detection logic actually reads:
```javascript
let hardBlockKeywords = []; // [{ value, source }]
let regexRules = [];        // [{ type, pattern, flags, name, example, source }]
let aiPrompts = { channel1: '', channel2: '' };
```
The `source` field marks each rule's origin and is shown as a badge in both the management UI and the PII Rule Guide: `Built-in` / `Config file import` / `Manually imported` / `Overridden` (`customDict` also has an internal-only `ai-session` tag for the current document's transient AI-extracted results, excluded when exporting a config file).

Regex rules no longer hold a real `RegExp` object directly — they're split into `pattern` (`regex.source`) and `flags` (`regex.flags`) strings, since a CSV/JSON config file can only carry strings. Every reconstruction of a `RegExp` goes through the `tryCompileRegexRow()` try/catch guard; a malformed rule is skipped and reported individually without aborting the rest of the scan.

#### Merge / Replace / Cancel (Pattern as the Unique Key)

Importing a CSV via "Manage Custom Protection Rules" (applies to Hard Block Keywords and Regex Rules; the roster's existing "Import Custom Dictionary" button has been upgraded to the same flow, while "Online Dictionary Builder" keeps its original overwrite behavior) pops up a choice dialog whenever that dimension already has data:
- **Merge**: keep existing entries and append the new ones; if a regex's **pattern string** (flags excluded) or a roster/hard-block **value** matches an existing entry, the existing entry is fully overwritten (tagged `Overridden`) — name, tag, example, etc. are all replaced too.
- **Replace All**: wipe every existing entry in that dimension (including built-ins) and use only the imported file's content.
- **Cancel**: no changes.

Any row that fails `new RegExp()` validation during a regex import is listed separately and skipped, without blocking the rest of the batch from importing.

#### Manual Config File Import

> [!NOTE]
> An earlier version auto-loaded `edushield.config.js` from the same folder on startup via `<script src="edushield.config.js">`. That approach let a tampered file execute arbitrary code without the user noticing, contradicting the "PII never leaves the browser" trust claim — it was replaced on 2026-08-25 with the manual import flow described below.

A collapsible "Advanced Settings: Import / Export Config File" section at the bottom of the "Manage Custom Protection Rules" panel (hidden below desktop viewport widths) offers three buttons:
- **Import Config File**: opens a file picker; once a file is selected, `extractAutoConfigJson()` does nothing but string-scanning and `JSON.parse()` (never `eval`, never executes file content), then shows a confirmation summary (counts of roster/hard-block/regex entries about to be imported) — nothing is applied until the user confirms (merged in, tagged `Config file import`).
- **Export Config File**: packages the current in-memory state of all four dimensions (including every merge/override result) into the same config format for download, with the fixed filename `edushield.config.js` — share it with a colleague or reuse it on another machine.
- **Reset to Defaults**: prompts for confirmation, then resets all four dimensions to their built-in defaults, discarding this session's manual edits or imported settings.

> [!IMPORTANT]
> This is a **manual** import — it does **not** apply automatically on refresh or the next time the page is opened; the user must click "Import Config File" and pick the file again each time. A persistent (non-auto-dismissing) notice on page load nudges the user to import; browser security prevents background-detecting whether a same-folder file exists (`fetch`/`XHR`/sandboxed-`iframe` reads of local files are all blocked), so the wording deliberately never claims a file was "detected."

Config file format:
```javascript
window.EDUSHIELD_AUTO_CONFIG = {
  version: 1,
  roster: [ { type: "VENDOR", value: "...", reason: "..." } ],
  hardBlock: [ "Custom hard-block term A" ],
  regexRules: [ { type: "CUSTOM_CODE", pattern: "CODE-\\d{4}", flags: "g", name: "Custom code", example: "CODE-1234" } ],
  aiPrompts: { channel1: "...{{TEXT}}", channel2: "...{{TEXT}}" }
};
```

> [!NOTE]
> This mechanism deliberately only handles rule/prompt configuration — it never touches the actual document content the user types in. `sessionVault`, the raw input textarea, etc. still fully honor the existing zero-trust, zero-persistence promise and vanish on page close or refresh.

---

## III. User Operation Manual

### 3.1 System Requirements

| Item | Requirement |
|------|-------------|
| OS | Windows (primary supported environment) |
| Browser | Chrome / Edge recommended (requires ES2020+, ReadableStream, Clipboard API) |
| Launch / Network | **General Offline**: Open `EduShield.html` directly.<br>**Air-Gapped / No Internet**: Must have both `EduShield.html` and `style.css` in the same folder (replaces CDN-loaded CSS). |
| Local AI (Optional) | Install Ollama, download the `qwen2.5:3b` model (recommended — runs well on older or low-memory machines), set environment variable `OLLAMA_ORIGINS = *` |

### 3.2 Standard Operation Flow

> [!IMPORTANT]
> **Pre-flight Safety Reminder (Zero-Trust Principle)**
>
> For real confidential data, **always download the file and run it locally in offline mode**. The GitHub Pages online deployment link is for feature demonstration and rule testing only.

#### Step 1 (Optional): Import or Build Custom Dictionary

The system offers two ways to manage custom terms (e.g., internal project names, staff rosters):
1. **Import CSV**: Click the **"匯入自訂詞庫 (CSV)"** button at the top of the page to upload a `.csv` file.
2. **View, Expand & Search**: After loading, click the **`詞庫: N`** button (where N = count) to open the Dictionary Manager. Use the two search boxes to filter by keyword or category; edit or delete entries at any time.
3. **Online Build & Edit**: Click **"詞庫: N"** at any time to open the editor.
   - **Pre-populated**: The editor automatically loads all terms currently in memory so you can continue editing from where you left off. Row numbers re-sort automatically after deletion.
   - **Excel Quick-Paste**: Paste multi-row, multi-column data from Excel directly — the table auto-expands. Pasting a single column into the "Category" field fills only categories without overwriting keywords.
   - **Keyboard Navigation**: Arrow keys navigate between cells; pressing Enter on the Delete button removes the row and moves focus to the next.
   - **Dual Export**: Click **"直接套用至系統"** (Apply to System) to apply immediately, or **"下載成 CSV"** (Download as CSV) for future reuse (UTF-8 with BOM output).

#### Step 2: Input Raw Data

1. Paste your document or table content into the **"原始資料輸入"** (Raw Data Input) area on the left.
2. The system scans in real time (200ms debounce) and highlights detected sensitive terms in color. All matched items appear as chips in the **"偵測項目"** (Detected Items) panel below.
   > Note: Input longer than 50,000 characters will trigger a performance warning.
3. To **un-mask a specific term**: Click the `×` on its chip, or select the text and choose "取消遮蔽" (Unmask) from the floating menu.
4. To **manually mark additional terms**: Select the text, then click "設為機密" (Mark as Confidential) in the floating menu.

#### Step 3 (Optional): Table Masking

When pasted text contains tab-separated (`\t`) table data, the system automatically renders dashed cell borders.
1. **Single-click** anywhere inside a cell (without selecting text) to show the floating menu with:
   - `[表格] 遮蔽此儲存格` — Mask this cell
   - `[表格] 遮蔽整欄` — Mask the entire column
   - `[表格] 遮蔽整列` — Mask the entire row
2. Masked cells/columns/rows can be **unmasked** via the same floating menu.
3. **Chip Support**: Manually masked table cells appear as **indigo chips** (labeled "表格") in the Detected Items panel. Hovering highlights the corresponding cell in the backdrop preview.

   > [!NOTE]
   > Table cell chips are rendered independently into the chip list and are **not injected** into `activeExtractedEntities`, preventing `processAnonymize` from creating duplicate tokens (both `{{TAB_C_r_c}}` and `{{TABLE_CELL_N}}`). This ensures `sessionVault` entries are unique and restoration is accurate.

#### Step 4: Run De-identification

Click the **"執行去識別化"** (Run De-identification) button. The right panel will display:
- **Masking Detail Log**: Original text → Token mapping (e.g., `王小明 → {{PERSON_1}}`)
- **De-identified Output**: The fully tokenized text with a system instruction prefix, ready to copy to an external AI
- **Three-Way Hover Sync**: Hovering over a chip (bottom-left) or a log entry (right panel) synchronizes all three areas — the corresponding term in the raw input highlights, the chip enlarges, and the log list scrolls to the matching row
- If a Hard Block keyword is detected, a red warning banner appears at the top and the copy button is locked

#### Step 5 (Optional): Local AI Deep Scan

If Ollama is configured, the **"透過地端 AI 深度掃描"** (Local AI Deep Scan) button (shown after Step 4) enables:
1. **Channel 1**: Extracts entities that static rules may have missed (person names, vendors, addresses, project names, account numbers)
2. **Channel 2**: Performs semantic risk assessment for sensitive narratives (self-harm, sexual assault, domestic violence, etc.) — triggers a Hard Block if `critical: true` is returned

#### Step 6: Copy, Send & Restore

1. Click **"複製已遮蔽資料"** (Copy Masked Data) to send the tokenized text (with system instructions) to an external AI (ChatGPT / Claude)
2. Switch to the **"還原"** (Restore) tab
3. Paste the AI's reply into the "外部 AI 回覆" (External AI Reply) area (supports "Paste from Clipboard" or "Expand View" modal)
4. Click **"執行還原"** (Run Restore) — the system automatically matches tokens and restores the original data
5. The **"還原結果"** (Restore Result) area is a fully editable rich-text zone. Click any restored token to cycle through Show / Partial Mask / Full Mask states
6. Click **"清除結果"** (Clear Result) to reset the restore area and status bar while preserving the AI reply (so you can tweak and re-restore)
7. When done, click **"複製還原文字"** (Copy Restored Text) to finalize

### 3.3 Troubleshooting

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| Dictionary shows "詞庫: 0" despite successful import | CSV encoding is not UTF-8, or fields contain special characters | Click `詞庫: N` to open the manager and verify data loaded correctly; or use the Online Builder to enter terms directly |
| Some terms not masked after de-identification | The term is in the whitelist (`whitelist` Set) or does not match any rule | Select the text manually and click "設為機密" |
| AI scan button unresponsive | Ollama not running or CORS not configured | Go to "系統設定" (System Settings) and run "測試連線" (Test Connection) — check for the green "連線成功！" message |
| "Abnormal output length" error during AI scan | Model hallucination — generating endless meaningless characters | The system has already auto-terminated. Try switching to a different model or modifying the input |
| Restore result shows "遺漏 N 項" (N missing) | External AI modified or deleted token tags | Match against the red chips in "原始資料與遮蔽紀錄" (left panel) and manually fill in the missing values in the restore area |
| Copy button grayed out / disabled | Hard Block triggered (extremely sensitive terms detected) | Click the red banner "查看詳情與解鎖" (View Details & Unlock), verify, and force-unlock; or remove the sensitive terms from the input |
| Table grid misaligned after pasting | Browser font rendering differences or non-monospace font | Use Chrome / Edge; the highlight editor uses `font-family: monospace` and `tab-size: 4` |

---

## IV. Advanced Developer Information

### 4.1 Adding Custom Hard Block Keywords

No source editing needed — use the toolbar's "Manage Custom Protection Rules" → "Hard Block Keywords" tab: download the CSV template, fill in your terms, and import (see 2.6). To change the built-in defaults themselves, search for `HARD_BLOCK_KEYWORDS_DEFAULT`.

### 4.2 Adding Custom Detection Rules

Use "Manage Custom Protection Rules" → "Regex Rules" tab to import a 4-column CSV (`TypeTag,RuleName,Pattern,ExampleText`) — see 2.6. To change the built-in defaults themselves, search for `REGEX_RULES_DEFAULT` and add a new rule object in the format:
```javascript
{ type: "TAG_NAME", regex: /your-regex-here/g, name: "Display Name", example: "Example Match" }
```

### 4.3 Customizing Default Model Options

Search for `<select id="ollamaModelSelect">` and add your institution's preferred model names to the `<option>` list.

---

### 4.4 Tailwind CSS Local Fallback: Compiling `style.css`

> [!IMPORTANT]
> When the app is opened in an offline environment, the browser attempts to load `style.css` from the same folder. If it doesn't exist, the failsafe guidance screen is displayed instead.

#### Development Environment Setup (One-time, Already Complete)

> [!NOTE]
> To keep the project root clean, all Tailwind CSS build tools have been placed in the **`dev/`** subfolder.

The following steps **have already been completed**. The files `dev/package.json`, `dev/tailwind.config.js`, and `dev/input.css` already exist — no need to repeat.

```powershell
# 1. Create and enter the dev folder
mkdir dev; cd dev

# 2. Initialize npm project and install Tailwind CSS v3
npm init -y
npm install --save-dev tailwindcss@3
```

**`dev/tailwind.config.js`**:
(Note: `content` path points to the HTML file one level up)
```javascript
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
```

**`dev/input.css`**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

#### Recompile Workflow (Required After Each Change to `EduShield.html`)

> [!IMPORTANT]
> Whenever Tailwind CSS utility classes are added or modified in `EduShield.html`, you **must** recompile `style.css` to ensure the offline fallback renders correctly.

Open a terminal, navigate to the `dev/` folder, then run:

```powershell
# Navigate to the dev folder
cd dev

# Run the build (outputs style.css to the project root)
npm run build:css
```

This script is defined in `dev/package.json` under `scripts`, equivalent to:
```powershell
tailwindcss -i ./input.css -o ../style.css --minify
```

#### Current Project Structure

```text
EduShield/  (repo root)
├── EduShield.html                      <- Main application (three-tier CSS loading logic)
├── docs/
│   ├── EduShield_README.md             <- Technical reference (Traditional Chinese, this file's counterpart)
│   ├── EduShield_README.en.md          <- Technical reference (English, this file)
│   └── EduShield_Test_Scenarios.md     <- Hands-on test scenarios
├── README.md                            <- Project introduction (Traditional Chinese, primary)
├── README.en.md                         <- Project introduction (English, secondary translation)
├── LICENSE                             <- MIT License
├── .gitignore / .nojekyll
├── style.css                           <- ✅ Compiled local CSS fallback (minified)
└── dev/                                <- 📁 Tailwind build tools
    ├── input.css / tailwind.config.js / package.json
```

> [!NOTE]
> **When distributing to end users**, only provide the root-level **`EduShield.html`** and **`style.css`** files.
> All files inside `dev/` and this documentation are for development purposes only — **do not distribute them to general users**.

---

## V. About This Project

* **GitHub Repository**: [oas114/EduShield](https://github.com/oas114/EduShield)
* **Author**: OA (oas114)
* **Support the Developer**: [Buy me a coffee on Ko-fi](https://ko-fi.com/oasgrow)
