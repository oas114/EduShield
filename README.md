[ English | [繁體中文 (README.zh-TW.md)](README.zh-TW.md) ]

# 🛡️ EduShield — Zero-Trust PII De-identification for AI Workflows

> *"Mask sensitive data before sending to AI. Restore it back in one click. 100% in-browser — no data ever leaves your device."*

**Author:** OA (oas114) | **[Support this project (Ko-fi)](https://ko-fi.com/oasgrow)**

---

✨ **[Try the Interactive Manual](https://oasgrow.com/EduShield/#)** ✨  
*We highly recommend exploring the interactive manual first to experience how EduShield works.*

---

## Why EduShield?

With generative AI now mainstream, educators, social workers, and administrators face a critical dilemma: they want to use AI (ChatGPT, Claude, etc.) to handle paperwork more efficiently, but cannot risk exposing students' personal data or confidential records, which may violate data protection laws.

**EduShield** solves this with a complete three-stage privacy-safe AI workflow: **Mask → Send → Restore** — and it runs entirely inside your browser without sending a single byte to any server.

---

## Technical Architecture

### Zero-Trust, Pure Frontend Design

EduShield is a **single static HTML file**. There is no backend, no database, no API server. Everything — regex matching, token replacement, restoration, and AI interaction — runs in your **local browser RAM**.

### Responsive Mobile UI

EduShield features a fully responsive layout tailored for mobile devices. Users can effortlessly use the tool on smartphones or tablets, with smooth scrolling, auto-adjusting text areas, and optimized touch interfaces, while retaining the locked 100vh layout on desktop.

| Property | Detail |
|----------|--------|
| **Data Persistence** | Zero. All data is destroyed on page close or refresh. No disk writes, no cloud uploads. |
| **Credentials** | None required. No API keys, no accounts. |
| **Network** | Fully optional. Works completely offline. Local AI (Ollama) connects only to `http://localhost:11434` (loopback). |
| **Startup Safety** | All input fields are cleared on load to prevent browser autofill from leaking previous session data. |

### Hybrid Defense Engine

**Layer 1 — Static Regex Fast-Match**

Built-in `REGEX_RULES` array covers 20+ PII categories with instant matching:
- National IDs, Resident Certificates, Dates (ROC & Gregorian), Mobile & Landline Phones, Email, Addresses, Student IDs, Grades, Class Ranks, Disciplinary Records, School Roles/Titles, Document Numbers, Vendor Names, Budget Amounts, and more.

> **Note on Localization**: Default rules are tuned for **Taiwan (ROC)** data formats. Contributions for other countries' formats (US SSN, EU GDPR fields, UK NI numbers, etc.) are very welcome — see [Contributing](#localization--contributing) below.

**Layer 2 — Local LLM Semantic Scan** *(Optional)*

Integrates with [Ollama](https://ollama.com/) running on your own machine. No data ever leaves your device.

- **Channel 1 (Entity Extraction)**: Catches entities that static regex cannot detect — informal person names, vendor shops without formal registration suffixes, internal project codenames, etc.
- **Channel 2 (Risk Assessment)**: Performs semantic risk detection for sensitive *narratives* described in plain language (e.g., domestic violence situations, self-harm references, counseling records) — even when no hard-block keyword is used verbatim.

Recommended model: `qwen2.5:3b` — runs well on older hardware and low-memory machines.

### Session Vault & Restore Mechanism

Every masked item is stored in an in-memory `sessionVault` as a unique token (`{{TYPE_N}}`). After the external AI processes the masked text, EduShield restores original data using a **triple-tolerance matching algorithm**:
1. Exact match
2. Whitespace-tolerant match (handles AI-introduced spaces around tokens)
3. Bracket-tolerant match (handles `【TYPE_N】`, `[TYPE_N]`, `(TYPE_N)`)

### Hard Block Interlock

The `HARD_BLOCK_KEYWORDS` array contains 36 extremely sensitive terms (related to child protection, gender-based violence, special education status, mental health records, etc.). If any are detected:
- A **red warning banner** appears at the top of the UI
- The **copy button is locked** — preventing accidental data exfiltration
- The user must explicitly **acknowledge and unlock** before proceeding

---

## Deployment Modes

| Mode | Use Case | Files Needed |
|------|----------|-------------|
| **Online Sandbox** | Quick feature evaluation — *never use with real data* | None (browser-based via GitHub Pages) |
| **Offline Single-File** *(Recommended)* | Everyday use with real documents | `EduShield.html` only |
| **Air-Gapped / No Internet** | Government machines, closed intranets | `EduShield.html` + `style.css` (in the same folder) |

🔗 **Online Sandbox**: [https://oas114.github.io/EduShield/EduShield.html](https://oas114.github.io/EduShield/EduShield.html)

> [!WARNING]
> The online version is for **evaluation only**. For any real personal data or confidential records, always use the **offline single-file mode**.

---

## Core Workflow

```
1. Paste & Mask
   Paste your document → System auto-detects & replaces PII with tokens (e.g., {{PERSON_1}})

2. Send to AI
   Click "Copy Masked Data" → Paste into ChatGPT / Claude → AI processes safely

3. Restore
   Paste AI reply back → Click "Run Restore" → All tokens replaced with originals
```

---

## Localization & Contributing

EduShield's default `REGEX_RULES` engine is optimized for **Taiwan (ROC)** identifiers and data formats. We recognize that PII looks very different around the world.

**We warmly invite developers worldwide to submit Pull Requests to:**
- Add Regex rules for your country's PII formats (US SSN, Japanese My Number, Korean 주민번호, EU GDPR-relevant fields, etc.)
- Contribute domain-specific `HARD_BLOCK_KEYWORDS` for your sector (healthcare, legal, social work, etc.)
- Translate the UI or documentation into additional languages

To add a custom detection rule, open `EduShield.html`, search for `REGEX_RULES`, and add an entry:
```javascript
{ type: "TAG_NAME", regex: /your-regex/g, name: "Display Name", example: "Match Example" }
```

To add a Hard Block keyword, search for `HARD_BLOCK_KEYWORDS` and add a string to the array.

---

## Documentation

| Document | Description |
|----------|-------------|
| 📖 [EduShield_README.en.md](./EduShield_README.en.md) | Full technical reference — modules, APIs, data structures, developer guide (English) |
| 📖 [EduShield_README.md](./EduShield_README.md) | Full technical reference (Traditional Chinese) |
| 🧪 [EduShield_Test_Scenarios.md](./EduShield_Test_Scenarios.md) | 12 hands-on test scenarios covering all major features (Traditional Chinese) |

---

## Roadmap

EduShield is an open-source public-benefit project. Planned development includes:

1. **Multi-domain Expansion**: Collaborate with contributors across sectors to build domain-specific `REGEX_RULES` and `HARD_BLOCK_KEYWORDS` libraries — enabling rapid deployment of specialized "Shields" beyond education (e.g., MedShield, LawShield).
2. **Ongoing Maintenance**: Expand and keep the Taiwan-specific PII rule library current.
3. **AI Integration Research**: Improve local LLM (Ollama) semantic detection accuracy.
4. **Advanced Editions**: Lay groundwork for future enterprise (with audit logs), personal, and international editions.

---

## License & Author

- **License**: [MIT License](./LICENSE)
- **Author**: OA (oas114)
- **Support**: [Buy me a coffee on Ko-fi](https://ko-fi.com/oasgrow)
- **Contact**: oasgrow [at] gmail.com — open to partnerships, institutional inquiries, and feature feedback