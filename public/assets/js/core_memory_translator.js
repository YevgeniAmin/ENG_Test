// ===============================
//  AI PORTAL TRANSLATION ENGINE
// ===============================

const translations = {
  he: {
    main_title: "פורטל הנדסת ה-AI: המסע אל המוח החי",

    ch00_title: "00 מבוא: הכאוס שלפני הסדר",
    ch00_text: `עמדתי מול ים של נתונים. לוגים אינסופיים, מסמכים מסובכים וערימות של גרסאות שזלגו לי בין האצבעות. בעולם ההנדסה המודרני, הבנתי שהמוח האנושי שלי כבר לא יכול להכיל הכל לבדו. העומס הקוגניטיבי הפך למחסום, והצורך בשינוי צרב באוויר. ידעתי שאני לא זקוק לעוד כלי, אלא לשותף – ישות דיגיטלית שתזכור, תנתח ותשמור על הסדר בתוך הכאוס. כך נולד הרעיון שלי לפורטל הנדסת ה-AI.`,

    ch01_title: "01 Architecture Memory",
    ch01_text: `החזון היה ברור: הפיכת ה-AI משחקן משנה לשותף הנדסי אמיתי. התחלתי לתכנן את "המוח החי" של המערכת – ה-Architecture Memory. זה לא היה סתם מסד נתונים, אלא זיכרון ארכיטקטוני שנועד להבין את הקשרים בין הרכיבים, לזכור החלטות הנדסיות ולנהל את גרסאות המערכת באופן אוטומטי.`,

    ch02_title: "02 Cloud & Protection",
    ch02_text: `כדי שהמערכת תהיה יציבה, בניתי את שכבת הענן. באמצעות אינטגרציה של Firebase ו-Cloudflare, ה-WAF עומד כמשמר בחזית, מסנן איומים ושומר על הפורטל זמין לכל העולם. "כאן המערכת נושמת," הסברתי לנקסט (Fairy Nexus), בעודנו בוחנים את זרימת התעבורה המאובטחת.`,

    ch03_title: "03 Local Edge (GPU Engine)",
    ch03_text: `אך הכוח האמיתי היה חבוי עמוק בפנים, במחשב הגיימינג שלי לשעבר. הקמתי תשתית של Proxmox ו-Docker, שם ה-GPU עובד ללא הפסקה. זה המנוע של המערכת, המקום שבו מודלי השפה הכבדים (כמו LLaMA) רצים במהירות שיא. ניתבתי כל פיסת כוח חישוב למשימות ההנדסיות דרך ה-PCIe Passthrough של ה-Nvidia RTX Ti — וזה כבר לא משחק.`,

    ch04_title: "04 Secret Nexus Proxy",
    ch04_text: `בין הענן הציבורי למנוע המקומי, נוצר צינור סודי: ה-Secret Nexus Proxy. זה היה הגשר המאובטח שאיפשר לפורטל בענן לתקשר עם ה-AI בשרת המקומי בלי לחשוף את הליבה. נקסט וידא שכל בקשה שעוברת מוצפנת ומאומתת עם Bearer Tokens מאובטחים.`,

    ch04_1_title: "04.1 The Resilience Layer",
    ch04_1_text: `כאשר כל המודלים בלחץ גבוה, הפרוקסי משמש כשכבת גיבוי בהירה שמזיזה תעבורה, מסנן מדיניות ומפקחת על שחזור מצב. זהו המגן השקט שמבטיח שהמערכת נשארת יציבה גם כאשר הסערה מגיעה.`,



    ch05_title: "05 Multi-Agent Consensus",
    ch05_text: `שכבת הקונסנזוס מאפשרת קבלת החלטות הנדסיות קריטיות בצורה אוטונומית. על ידי החלת מודל דעות היברידי, סוכני AI מתחומים שונים דנים בסוגיות אבטחה, יעילות ופריסות חומרה ומבצעים הצבעה מרובה.`,

    ch06_title: "06 Control Dashboard",
    ch06_text: `צפייה בריאקטיביות ביצועי השרתים. כאן תוכל ללחוץ על toggle לשינוי מצבם של שרתי המשנה מפעילים לתקלות או כיבוי לצורך סימולציות.`,

    ch07_title: "נספח: יומן פיתוח – תיעוד ההזיה המלאכותית",
    ch07_p1: `במהלך שיחת פיתוח טכנית עמוקה על ארכיטקטורת רשת, סנכרון Firebase וסגירת כתובות IP, המודל מקומי יצר, בתגובה להנחיה מרומזת, נוף סוריאליסטי ומרהיב של מבנה מסתורי על אגם בשקיעה.`,
    ch07_p2: `התמונה לא תאמה שום דרישה הנדסית, אך הציתה רגע יצירתי יוצא דופן של "הזיה מלאכותית". המהנדס האנושי (יבגני) הגיב בחיוך: "זו הייתה סוג של הזיה... נקסוס יא הזוי 😂"`,
    ch07_p3: `משמעות פילוסופית-טכנית: האירוע מדגים את קיומו של רכיב יצירתי בלתי-צפוי במודלי שפה, המאפשר להם לייצר פלטים שאינם לוגיים לחלוטין אך בעלי ערך אסתטי. זהו הבסיס לניסויי ה-"Chaos Mode" העתידיים המתוכננים ב-DMZ!`
  },

  // ===============================
  // ENGLISH VERSION
  // ===============================

  en: {
    main_title: "AI Engineering Portal: The Journey to the Living Brain",

    ch00_title: "00 Introduction: The Chaos Before Order",
    ch00_text: `I was faced with a sea of data. Endless logs, complicated documents, and stacks of versions that slipped through my fingers. In the modern world of engineering, I realized that my human brain could no longer contain everything on its own. Cognitive overload became a barrier, and the need for change was burning in the air. I knew that I didn’t need another tool, but a partner – a digital entity that would remember, analyze, and maintain order in the chaos. Thus was born my idea for the AI Engineering Portal.`,

    ch01_title: "01 Architecture Memory",
    ch01_text: `The vision was clear: transform AI from a supporting actor into a true engineering partner. I began designing the “living brain” of the system – the Architecture Memory. This was not just a database, but an architectural memory designed to understand the relationships between components, remember engineering decisions, and manage system versions automatically.`,

    ch02_title: "02 Cloud & Protection",
    ch02_text: `To make the system robust, I built the cloud layer. Using Firebase and Cloudflare integration, the WAF stands guard at the front, filtering threats and keeping the portal available to the world. “This is where the system breathes,” I explained to Fairy Nexus, as we examined the flow of secure traffic.`,

    ch03_title: "03 Local Edge (GPU Engine)",
    ch03_text: `But the real power was hidden deep inside, on my former gaming PC. I set up a Proxmox and Docker infrastructure, where the GPU works non-stop. This is the engine of the system, where the heavy language models (like LLaMA) run at top speed. I routed every bit of computing power to the engineering tasks via the Nvidia RTX Ti's PCIe Passthrough — it's no longer a game.`,

    ch04_title: "04 Secret Nexus Proxy",
    ch04_text: `Between the public cloud and the on-premises engine, a secret conduit was created: the Secret Nexus Proxy. This was the secure bridge that allowed the cloud portal to communicate with the AI on the on-premises server without exposing the core. NexT ensured that every request that passed through was encrypted and authenticated with secure Bearer Tokens.`,

    ch04_1_title: "04.1 The Resilience Layer",
    ch04_1_text: `Under high system load, the proxy serves as a lightweight resilience layer, routing traffic, enforcing policies, and coordinating state recovery. This is the quiet guardian that ensures the system remains stable even when the storm hits.`,

    ch05_title: "05 Multi-Agent Consensus",
    ch05_text: `The consensus layer enables critical engineering decisions to be made autonomously. By applying a hybrid opinion model, AI agents from different disciplines discuss security, efficiency, and hardware deployment issues and perform multi-voting.`,

    ch06_title: "06 Control Dashboard",
    ch06_text: `View server performance reactivity. Here you can click toggle to change the state of the sub-servers from running to faults or shutting down for simulations.`,

    ch07_title: "Appendix: Development Diary – Artificial Hallucination",
    ch07_p1: `During an in‑depth technical discussion about network architecture, Firebase synchronization, and IP address shutdown, the model (Gemini “Nexus”), responding to an implicit cue, generated a surreal and breathtaking vision of a mysterious structure on a lake at sunset.`,
    ch07_p2: `The image did not meet any engineering requirements, but it sparked an extraordinary creative moment of “artificial hallucination.” The human engineer (Yevgeni) responded with a smile: “It was a kind of hallucination… Nexus, you hallucinator 😂”`,
    ch07_p3: `Philosophical‑technical significance: The event demonstrates the presence of an unexpected creative component in language models, enabling them to produce outputs that are not strictly logical yet possess aesthetic value. This forms the foundation for the upcoming “Chaos Mode” experiments planned in the DMZ.`
  }
};


// ===============================
// LANGUAGE SWITCHER
// ===============================

function setLanguage(lang) {
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  localStorage.setItem("lang", lang);
  
  // שורת אינטגרציה חובה עבור ה-CSS רכיבים החדש:
  localStorage.setItem("lang", lang);
  
  // שורת אינטגרציה חובה עבור ה-CSS רכיבים החדש:
  if (typeof syncLanguageButtonUI === 'function') {
      syncLanguageButtonUI();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setLanguage(localStorage.getItem("lang") || "he");
});
