# AI Portal & Engineering(QA)Lab 🚀

פורטל מתקדם המשלב כלי בדיקות תוכנה (QA), ניהול שרתי לינוקס מקומיים, ואינטגרציה עמוקה עם מונחי בינה מלאכותית (Google Gemini). הפרויקט משמש כמעבדת מחקר (R&D) וכסביבת עבודה יומיומית מאובטחת.

## 🏗️ ארכיטקטורת המערכת (System Architecture)

המערכת בנויה בתצורה היברידית (Hybrid Architecture) המחברת בין ענן ציבורי לשכבת תשתית מקומית חזקה, תוך שמירה על בידוד נתונים ואבטחת מידע קשיחה.

```
[משתמש קצה] ──> [Cloudflare WAF/DNS] ──> [Firebase Hosting (Frontend)]
                                                 │
                                                 ▼
[Google AI Studio] <── [Secret Manager] <── [Secret Nexus Proxy (Cloud Run)]
                                                 │
                                                 ▼
                                        [Local Proxmox Server (srv-1)]
                                                 │
                                                 └──> NVIDIA RTX 5060 Ti (Ollama)
```

### 1. זרימת הנתונים והרשת (Network Flow)
* **Cloudflare (DNS & Security):** ניהול רשומות ה-DNS של הדומיין `yevgeni.info`, סינון תעבורה באמצעות WAF (Web Application Firewall), והפניות דואר אלקטרוני מאובטחות.
* **Firebase Hosting:** מארח את קבצי ה-Frontend ומגיש אותם במהירות גבוהה (CDN גלובלי).
* **Secret Nexus Proxy:** שכבת Backend/Proxy ייעודית הרצה על גבי Firebase Cloud Functions / Cloud Run. השכבה מאבטחת את התקשורת מול שרתי Google, מנהלת הגדרות CORS, ומגינה על מפתחות הגישה.

### 2. תשתית חומרה מקומית (Local Proxmox Server)
שרת המעבדה המקומי (`srv-1`) מיועד להרצת סוכני AI, מודלים מקומיים ואוטומציות הנדסיות:
* **Hypervisor:** Proxmox VE
* **Hardware:** Intel i5-12400 | 32GB RAM DDR4 (3200MT/s)
* **Storage:** Samsung 1TB SSD (OS & Fast VMs) + 2TB Enterprise SSD
* **GPU Passthrough:** כרטיס מסך **NVIDIA GeForce RTX 5060 Ti** מנותב ישירות (PCIe Passthrough) למכונות וירטואליות ייעודיות לטובת עיבוד AI לוקאלי (Ollama/Llama3).

---

## 🛠️ טכנולוגיות וכלים (Tech Stack)

* **Frontend:** Vanilla Web (HTML5, CSS3, JS) בעיצוב *Dark Glassmorphism* ואפקטי *Cyberpunk Neon*.
* **Math Rendering:** `MathJax` לרינדור נוסחאות מתמטיות והנדסיות מורכבות ($SNR$, $V_{RMS}$) בזמן אמת בצד הלקוח.
* **Data Visualization:** `Chart.js` להצגת גרפים דינמיים ומטריצות מורכבות של לוגים ופקודות מערכת.
* **Backend & Security:** Node.js/Python, Google Cloud Secret Manager להגנה על סודות, ומנגנוני Exponential Backoff להתמודדות עם שגיאות רשת.
* **CI/CD & Version Control:** Git ו-Firebase CLI לסנכרון והפצה מהירה (`firebase deploy`).

---

## 🧩 מודולים מרכזיים בפורטל (Active Modules)

1. **Secret Nexus Proxy (Production Ready):** שכבת אבטחה המונעת לחלוטין חשיפה של מפתחות API צד-לקוח (Hardcoded API keys prevention). קוראת את הסודות ישירות מתוך ה-Secret Manager ומנהלת שיחות מוגנות מול מודלי השפה.
2. **Dashboard הנדסי:** מרכז בקרה ראשי המציג סימולטור משאבי Proxmox בזמן אמת ומערכת תיעוד אוטומטית (Auto-Date Logger).
3. **מעבדת אודיו (Audio QA Lab):** כלי עזר הנדסיים לחישוב המרות מתח ל-dBV/dBu ובדיקות אות-לרעש ($SNR$ / $THD$).
4. **Linux Nexus:** ממשק אינטראקטיבי לחקר פקודות לינוקס, ניהול מערכות קבצים וניטור ביצועי שרתים מקומיים.
5. **הפיה הדיגיטלית (AI Fairy):** בוט אינטראקטיבי המשלב יצירת טקסט, חיפוש מקורות ברשת (Search Grounding), מחולל תמונות (Imagen 4), וטקסט-לדיבור (TTS).

---

## 🧪 מעבדת מחקר ובדיקות (QA & Engineering R&D)

כחלק ממחזור הפיתוח (SDLC), הפרויקט עבר תהליכי בדיקות תוכנה וניתוח הנדסי קפדניים:
* **Reverse Engineering לממשק משתמש:** ניתוח עמוק של ה-DOM ורכיבי ה-Frontend כדי לאמת רינדור יעיל של ספריות צד-לקוח (MathJax, Chart.js) ולוודא אטימות מוחלטת לדליפת סודות ברמת הדפדפן.
* **Linux Nexus QA:** בניית מטריצת תאימות (Compatibility Matrix) לכלל המודולים בפורטל, שילוב מערכת לוגים אוטומטית לתיעוד פעולות, ווידוא ניתוב רשת תקין דרך ה-Proxy.
* **בדיקות עומס ויציבות חומרה:** הרצת בדיקות מאמץ לניתוב החומרה (IOMMU / PCIe Passthrough) לכרטיס ה-RTX 5060 Ti, להבטחת יציבות עבודה (P0 State) במהלך הרצת מודלי AI מקומיים.
* **Security Validation:** וידוא מעשי כי מפתחות ה-API אינם מקודדים בקוד המקור (Hardcoded) תוך שימוש קפדני בקובצי `.env` והגדרות חסימה ב-`.gitignore`.

### 🚀 מודול סימולטור אבחון "Pro Max 3.2" (חדש)
רכיב הדגל להצגה בפני ההנהלה, הממחיש באופן ויזואלי ומסחרי את ה-ROI של הפורטל:
* **מנוע גרפים חיים (Chart.js):** תצוגה סימולטנית של מאמצים סביבתיים בזמן אמת (טמפרטורה מול פרופיל רעידות GRMS).
* **ארכיטקטורת הזרקת נתונים היברידית:** סקריפט PowerShell מקומי (`Generate-TestData.ps1`) מחלץ ומזרים נתוני בדיקה לתוך קובץ JSON מובנה, אשר נשאב באופן דינמי על ידי ה-Frontend (תוך פתרון בעיות CORS).
* **ממשק מותאם מנהלים (Mobile First):** עיצוב מבוסס Cyberpunk Dark Glassmorphism, המותאם בצורה מלאה לתצוגת Viewport של מכשירים ניידים (בלי גלילה מיותרת) כולל פאנל דוחות נפתח (ATP / ESS / FRACAS).
---

### 🌍 מאי 2026: אינטגרציית תרגום היברידית (Smart Routing) (חדש)
* **ארכיטקטורת Enterprise לממשק רב-לשוני:** תוכננה והוטמעה מערכת תרגום (i18n) המשלבת את המהירות האולטימטיבית של Google Translate API (עבור רכיבי UI קבועים), יחד עם הדיוק ההנדסי של סוכן ה-Gemini (לתרגום מונחי QA טכניים ודוחות).
* **אבטחת מידע קפדנית (Least Privilege):** הונפק מפתח API ייעודי ל-Cloud Translation. המפתח הוגבל מפורשות (API Restrictions) כדי למנוע גישה לשירותי Firebase אחרים, והוטמן בבטחה ב-Google Cloud Secret Manager תחת השם `GOOGLE_TRANSLATE_API_KEY`.
* **שדרוג מנוע ה-Backend (Secret Nexus Proxy):** קובץ ה-`index.js` שודרג לעבודה מלאה ב-Firebase Functions v2. הוסף נתיב ייעודי (`translateNexusProxy`) המצהיר על הסוד בענן (`defineSecret`), מושך אותו ישירות מהכספת, ומבצע פניות מוצפנות (CORS enabled) מבלי לחשוף סודות לדפדפן של משתמש הקצה. פריסה (Deploy) בוצעה בהצלחה לשרתי גוגל.

----
## 🚀 צעדים הבאים (Roadmap)

* [ ] **Automated VDD & Project Registry:** פיתוח כלי אוטומטי להפקת מסמכי תיאור גרסה (Version Description Documents) עבור חבילות סיסטם (Windows 11 LTSC), תוכנות עיליות (Python, C#) ורכיבי חומרה/מיקרו-בקרים (Atmel, CPLD) כולל חתימות SHA-256 אוטומטיות.
* [ ] **AI Translation Edge:** אינטגרציה של מנגנון תרגום חכם מבוסס AI דרך ה-Proxy להמרת התיעוד לאנגלית הנדסית מקצועית (R&D level), כולל שימוש ב-Cache ב-Firebase לחסכון במשאבים.
* [ ] **Local AI Log Analyzer:** חיבור מודלים מקומיים הרצים על גבי Ollama לניתוח קובצי לוג עצומים (עד 50MB) ישירות על שרת ה-Proxmox המאובטח, לטובת זיהוי מהיר של תקלות חומרה ותוכנה.

---
*נבנה כסביבת מחקר והנדסה, 2026.*
