# ENG Portal Development Rules

## Project purpose

This repository contains Yevgeni's engineering portal.

## General rules

- Preserve the current visual identity.
- Do not rewrite entire files for small changes.
- Prefer focused and reversible modifications.
- Do not change JavaScript behavior unless explicitly requested.
- Do not remove existing features.
- Keep HTML semantic and accessible.
- Keep CSS responsive.
- Reuse existing variables and components before creating new ones.
- Explain affected files before major edits.
- Review the diff after every task.

## Styling rules

- Use CSS variables for repeated colors and spacing.
- Avoid inline styles.
- Use consistent border radius, spacing and typography.
- Prefer subtle professional shadows.
- Preserve mobile layouts.
- Avoid unnecessary animations.
- Maintain fast page loading.

## Safety

- Never expose API keys, passwords or tokens.
- Never modify deployment or security configuration without explicit approval.
- Create or recommend a Git checkpoint before broad refactoring.# 1. היסטוריית החלטות קריטיות (עבור Project_Historical_Context.md)

## 🏛️ החלטות ארכיטקטוניות ועסקיות
* **שימוש ב-WSL 2 כגשר סביבת עבודה:** החלטה אסטרטגית המאפשרת פיתוח ובדיקות בסביבת Windows Enterprise המשולבת עם לינוקס מלאה וביצועי כרטיס גרפי (GPU Passthrough) עבור מודלים מקומיים בשעות הפנאי.
* **בחירה בארכיטקטורת מנוע אוטומציה היברידית:** שילוב בין מקורות מידע וטפסים מבוססי ענן (Google Sheets/Drive/Forms) לבין סקריפטים מקומיים ב-Python וספריות ייעודיות לטיפול בשבלונות Word במסגרת פרויקט הלמידה והפיתוח האישי.
* **עבודה מונחית סוכנים (Agentic Workflow):** מעבר מתשאול ליניארי למודל של "סוכנים מרובים" (אנליזה, תקינה, וביקורת) המבצעים איטרציות של "ניסוי ותהייה" (ReAct Prompting) על חומרי הגלם ההנדסיים לפני יצירת המסמך הסופי.
* **ניהול גרסאות קפדני ותיק עבודות ב-GitHub:** החלטה לקשור את כל שלבי הלימוד ופיתוח האוטומציות לתוך מאגר (Repository) מסודר ב-GitHub לצורך יצירת פורטפוליו מקצועי ובניית קורות חיים בעולם הבדיקות והתוכנה.

## ⚙️ רכיבי קוד ופיצ'רים מרכזיים
* **מנוע סוכנים אוטונומי (`LangChain` / `CrewAI`):** תשתית המנהלת את לולאת המחשבה, הפעולה והתצפית (ReAct) לצורך סריקת החומרים הגולמיים, בדיקת חריגות ואימות המידע הטכני.
* **מנתח מידע רב-מודאלי (`Vision-Language Models / Ollama`):** רכיב ה-AI המקומי הרץ על גבי ה-GPU בלינוקס (WSL 2) ומסוגל לקרוא ולחלץ נתונים מגרפים, לוגים וצילומי מסך של בדיקות חומרה.
* **צינור הזרקת נתונים לשבלונות (`python-docx`):** סקריפט Python ייעודי הפותח שבלונות קובצי Word קיימות (בפורמטים העדכניים ביותר כולל תמונות וטבלאות), מאתר תגיות דינמיות (כמו `{{שם_לקוח}}`), ומזריק לתוכן את המידע המזוקק.
* **מערכת ניהול סודות ואינטגרציה (`Google Drive / Docs APIs`):** קוד קישור המשתמש במפתחות גישה מאובטחים (`credentials.json`) וספריות כגון `gspread` כדי למשוך ולעדכן נתונים באופן אוטומטי ישירות מתוך סביבת הענן של Google.

---
## 🏛️ החלטות ארכיטקטוניות ועסקיות
* **שימוש ב-Firebase כמערכת האקולוגית המרכזית:** הוחלט לבסס את הפרויקט על פלטפורמת Firebase עבור סביבת ה-Hosting, ניהול הפריסות (Deploys), ומינוף רכיבי Backend מאובטחים.
* **תיקון והפרדה מבנית של תיקיית הפצה (Public Directory):** החלטה קריטית לניקוי יסודי של סביבת העבודה משאריות הגדרות קודמות שבוצעו בצורה שגויה. כל קבצי ה-Client-side (HTML, CSS, JS) הופרדו לחלוטין והועברו לתוך תיקיית `public` ייעודית, בעוד שקבצי הקונפיגורציה (`firebase.json`, `.firebaserc`, `.gitignore`) נשמרים בשורש הפרויקט (`eng-portal`).
* **חיבור ואינטגרציה ל-Gemini API באופן מאובטח:** בחירה בשימוש בשרת/ארכיטקטורה מוגנת או שימוש בפתרונות מאובטחים מבוססי משתני סביבה כדי למנוע חשיפה ישירה של מפתחות ה-API בדפדפן הלקוח.
* **שילוב ניהול תעבורה ודומיינים דרך Cloudflare:** החלטה ארכיטקטונית לנתב את תעבורת הדומיין המותאם אישית של הפורטל דרך מערכת ה-DNS וההגנה של Cloudflare אל שרתי Firebase Hosting.
* **ניהול שרת וירטואליזציה ביתי מבוסס Proxmox:** החלטה על הקמת תשתית עצמאית/ביתית לטובת הרצת סוכנים, אחסון וניהול קונפיגורציות רשת מתקדמות (כגון פרוקסי ואחסון ייעודי).
* **אימוץ שפת עיצוב עתידנית:** בחירה אסטרטגית בקונספט ויזואלי מסוג **Cyberpunk Dark Glassmorphism** לטובת שיפור ה-UX/UI של הפורטל ההנדסי.

## ⚙️ רכיבי קוד ופיצ'רים מרכזיים
* **index.html ו-404.html (בתוך תיקיית public):** דפי המקור המרכזיים של ממשק המשתמש המשמשים כנקודת הכניסה לפורטל ההנדסי ועמוד השגיאות המותאם.
* **Pro Max Diagnostics Module:** מודול אבחון מתקדם שנועד לבצע ניטור, בדיקות תקינות ומעקב אחר ביצועי המערכת וסוכני ה-AI.
* **בוט ומודול "פיה דיגיטלית" (Digital Fairy):** קומפוננטת ממשק אינטראקטיבית והומוריסטית המשולבת בפורטל, המנגישה יכולות AI ואינטגרציה עם ה-API.
* **סימולטור Pipeline ומערכת בדיקות ESS:** רכיב סימולציה ייעודי המיועד למהנדסי בדיקות, המאפשר לבנות תהליכי עבודה (Workflows) ולבצע אוטומציה למסמכי בדיקות.
* **עמוד עזר ומדריך פקודות לינוקס (Linux Cheat Sheet):** דף תוכן ייעודי ומעוצב בתוך הפורטל המיועד לריכוז פקודות רשת ומערכת הפעלה לשימוש מהיר.
* **Firebase Functions וקובצי קונפיגורציה (`firebase.json`, `.firebaserc`):** רכיבי Backend לקוד שרת מבוסס ענן וניהול הגדרות הפריסה וסביבות העבודה של הפרויקט.



Markdown
# 1. היסטוריית החלטות קריטיות (עבור Project_Historical_Context.md)

## 🏛️ החלטות ארכיטקטוניות ועסקיות
* [cite_start]**פלטפורמת פורטל:** החלטה לבנות את ה-AI Portal כמרכז ידע, כלי דיאגנוסטיקה ואוטומציה ל-ESS[cite: 39, 61, 63].
* [cite_start]**שפת עיצוב:** בחירה בעיצוב **Cyberpunk Dark Glassmorphism** מבוסס Tailwind CSS למראה מקצועי, טכנולוגי וגבוה-קריאות[cite: 13, 322, 346].
* [cite_start]**מודל תפעולי:** השילוב בין משימות הנדסיות (בדיקות ESS, ATP) לבין פיתוח כלים דינמיים מבוססי AI ככלי להסבה מקצועית וקידום עסקי[cite: 63, 65].
* [cite_start]**אוטומציה מלאה:** החלטה לעבור ממסמכי Word סטטיים לפורמט מבוסס נתונים (JSON) המאפשר למכונות (Chamber, Shaker) לקרוא ולכתוב נתונים ישירות לפורטל, תוך עמידה בתקני **ISO-9001**[cite: 67, 87, 104, 111].
* [cite_start]**AI Lab Integration:** הטמעת מנוע AI (Gemini API) בתוך הפורטל למטרות ניתוח לוגים בזמן אמת, זיהוי אנומליות הנדסיות (כגון Resonance ב-500Hz) והצעת פתרונות[cite: 14, 17, 301, 308].

## ⚙️ רכיבי קוד ופיצ'רים מרכזיים
* [cite_start]**Linux Command Nexus 2026:** דאשבורד אינטראקטיבי ללינוקס הכולל סימולטור טרמינל, מטריצת Utility vs. Complexity וסרגל חיפוש חכם[cite: 5, 10, 14].
* [cite_start]**Pro Max Diagnostics Module:** מודול בדיקות מערכת הכולל "Pipeline Simulator", גרפים חיים ב-Chart.js, וייצוא דוחות PDF רשמיים[cite: 285, 346].
* [cite_start]**Digital Fairy Alert:** סוכן AI אינטראקטיבי שקופץ ברגע זיהוי כשל (FAIL) כדי להציע פעולות מתקנות (Auto-Ticketing)[cite: 335, 356].
* [cite_start]**שבלונות ESS/ATP/RTP:** יצירת מערך מסמכי עבודה (Master ATP, R-ESS, Go/No-Go) התואמים ל-MIL-STD-810H וניתנים לקריאה ע"י מכונות[cite: 92, 120, 138, 197].
* [cite_start]**סקריפטי אוטומציה:** פיתוח סקריפטים (PowerShell/Python) למערכות Windows 11 LTSC לבדיקת חומרה, רשת ודרייברים ללא מגע יד אדם[cite: 74, 111, 130].

---


## 🏛️ החלטות ארכיטקטוניות ועסקיות
* **אוטומציה מלאה של בדיקות ESS:** החלטה לעבור מתבניות ידניות (Word) למערכת מבוססת פורטל אינטרנטי המבצעת איסוף נתונים אוטומטי (Machine-Readable).
* **שימוש ב-AI כפתרון בזמן אמת:** הטמעת מנגנון `[AI Solution]` לניתוח וטיפול בתקלות (`FAIL`) בזמן אמת, במטרה למנוע השבתה (Downtime) של תהליכי בדיקה יקרים.
* **הפרדת ארכיטקטורה:** חלוקת הפורטל למודולים - פורטל אינטרנטי לממשק משתמש (אינטגרטורים/מנהלים) ומנועי בדיקה אחוריים (PowerShell/Python) המריצים אוטומציה על מחשבים תעשייתיים (Windows 11 LTSC).
* **תאימות לתקנים:** התבססות מוחלטת על תקני ISO-9001 (ניהול איכות וכיולים) ו-MIL-STD-810H (בדיקות סביבה) כבסיס לכל תבניות התיעוד והאוטומציה.

## ⚙️ רכיבי קוד ופיצ'רים מרכזיים
* **Master_ESS_Templates.docx:** קובץ מאסטר המרכז את שלוש השבלונות הקריטיות: ATP/ATR (מלא), R-ESS/RTP (מקוצר), ו-R-ESS-GNG (Go/No-Go מהיר).
* **ממשק "Showcase" לבוס (ess-workflow.html):** עמוד אינטראקטיבי בעיצוב Cyberpunk המציג את תהליך ה-Workflow האוטומטי (5 שלבים) כדי להמחיש את היתרונות הטכנולוגיים והכלכליים של המערכת.
* **מנגנון אימות כיולים אוטומטי:** רכיב במערכת שחוסם תחילת בדיקה אם ציוד המדידה חורג מתאריך הכיול המותר (ISO-9001).
* **AI Configuration Panel:** פיצ'ר לניהול מאובטח של מפתחות API ב-localStorage, המאפשר אינטגרציה עם Gemini ללא חשיפת מפתחות בקוד.

---

# 🧠 AI Context & Memory Core 
**Project:** ai-portal || פרויקט שלנו
**Target Audience:** AI Agents (Gemini), System Architecture Readout
**Goal:** 100% Context Retention for Autonomous Development

## 1. 🏗️ System Architecture (The "Stack")
- **Hardware/Server:** Bare-Metal Proxmox (srv-1.yevgeni.info), Intel i5-12400, 32GB RAM, NVIDIA RTX 5060 Ti GPU (Passthrough enabled).
- **Hosting & Networking:** Firebase Hosting eng-portal, Cloudflare DNS (yevgeni.info domain).
- **Frontend Stack:** HTML5, CSS3, Vanilla JS.
- **Backend/Proxy:** Firebase Cloud Functions (Node.js/Python).
- **Integrations:** Chart.js (Data Visualization), Google GenAI SDK (Gemini 2.5 Flash).
- **CI/CD:** GitHub Actions configured for automatic deployment to Firebase.

## 2. 🛡️ Security Posture
- **API Keys:** NEVER HARDCODED. Managed via `.env` files and Google Cloud Secret Manager.
- **Routing:** Frontend requests for AI are routed through `/api/secret-nexus-proxy` to prevent XSS and key leaks.
- **Git:** `.gitignore` strictly protects `.env`, `.firebase/`, and `/node_modules`.

## 3. 🔄 Last Known State & Current Chat Context
- **Recent Action:** Consolidated Linux Nexus 2026 research.
- **Fixes Applied:** Restored and bound `initCharts()` to correctly parse command arrays for Doughnut & Scatter plots without ReferenceErrors.
- **AI Instructions:** When reading this file, the AI must adopt the persona of "eng-portal", understand the Proxmox/Firebase infrastructure, and assume command of engineering, QA, and frontend development tasks. 

## 4. 🚀 Next Steps Pipeline
- Move API calls fully to Firebase Functions (`generateCommand`).
- Implement PWA (Progressive Web App) offline caching for field engineers.
- Finalize CI/CD pipeline logic for the Windows/PowerShell POC extraction scripts.

## 📅 עדכון כרונולוגי: סיכום פעילות וניתוח טכנולוגי (סוף יום - מאי 2026)

### 🛠️ פריצות דרך טכניות והתגברות על חסמים
* **אוטומציית סימולציית נתונים (Data Extractor):** נכתב והוטמע בהצלחה סקריפט PowerShell בשם `Generate-TestData.ps1`. הסקריפט מייצר ומעדכן בלולאה דינמית את קובץ ה-`uut_live_data.json`, המדמה חריגות הנדסיות (Anomaly Detected) ותיקון אוטומטי (RTP).

### 📐 ארגון סביבת העבודה ופרוטוקול תיקיות (Google Drive)
נקבע פרוטוקול ניהול מידע קשיח למניעת "בלגן קבצים" ואיבוד זיכרון ארגוני:
1. **AI Context & Instructions:** תיקייה ייעודית להנחיות ומילוני מושגים עבור סוכני ה-AI.
2. **Human Summaries:** ריכוז סיכומים ומסקנות לקריאה אנושית מהירה.
3. **WIP & Drafts:** סביבת הפיתוח המקומית המכילה קוד וסקיצות לבדיקה.
4. **מנגנון Manage versions:** שימוש מובנה בכלי ניהול הגרסאות של גוגל דרייב לשמירה על היסטוריית קבצים נקייה.

























