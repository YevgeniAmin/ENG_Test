const PROXY_URL = 'https://translatenexusproxy-sqjr53py2a-uc.a.run.app'; 

/**
 * AI Edge Translator - Enterprise Batch Mode
 * מנוע תרגום חסין תקלות, המשתמש בשליחת מקבצים (Batching) ובמנגנון קאש מיידי.
 */
async function translatePortal(targetLang) {
    // 1. כיווניות אוטומטית (RTL / LTR)
    const rtlLanguages = ['he', 'ar'];
    document.body.setAttribute('dir', rtlLanguages.includes(targetLang) ? 'rtl' : 'ltr');

    // הסרנו 'a code' כי זה יוצר התנגשויות תרגום כפולות, ה-p/li עוטף אותו כבר!
    const elementsToTranslate = document.querySelectorAll('h1, h2, h3, h4, p, li, span.translatable, .card-title, .btn-text, .status-label span, .status-time, .legal-link');
    
    let textsToFetch = [];
    let elementsPending = [];

    // 2. ריצה ראשונית: שולפים מהזיכרון או מכינים רשימה לענן
    for (let el of elementsToTranslate) {
        if (!el.hasAttribute('data-orig-text')) {
            el.setAttribute('data-orig-text', el.innerHTML.trim()); // שמירת ה-HTML (חשוב לעיצוב!)
        }

        let originalText = el.getAttribute('data-orig-text');
        
        // סינון חכם
        if (originalText.length < 2 || !/[a-zA-Zא-ת]/.test(originalText)) continue;

        const cacheKey = `${originalText}_${targetLang}`;
        const cachedText = localStorage.getItem(cacheKey);

        if (cachedText) {
            // 🟢 Cache Hit - מחליפים מיידית (0ms)
            el.innerHTML = cachedText; 
        } else {
            // 🔴 Cache Miss - מוסיפים לרשימת ההמתנה ונשגר את כולם יחד!
            el.style.opacity = '0.5';
            textsToFetch.push(originalText);
            elementsPending.push({ element: el, key: cacheKey });
        }
    }

    // 3. שיגור מרוכז (Batching): במקום N קריאות שרת, אנחנו עושים קריאה אחת בלבד!
    if (textsToFetch.length > 0) {
        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts: textsToFetch, targetLanguage: targetLang }) 
            });

            if (!response.ok) throw new Error('Proxy API Error');
            const data = await response.json();

            // 4. פיזור התוצאות מהענן חזרה למסך ולזיכרון
            if (data.translatedTexts && data.translatedTexts.length === elementsPending.length) {
                data.translatedTexts.forEach((translatedHtml, index) => {
                    const pendingItem = elementsPending[index];
                    pendingItem.element.innerHTML = translatedHtml;
                    localStorage.setItem(pendingItem.key, translatedHtml); // שמירה לעתיד
                });
            }
        } catch (error) {
            // Production Silent Mode - ללא שגיאות קונסולה למשתמש
        } finally {
            elementsPending.forEach(obj => obj.element.style.opacity = '1');
        }
    }
}