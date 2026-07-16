function updateClock() {
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    
    // שעון מקומי
    const liveClockEl = document.getElementById('liveClock');
    const liveDateEl = document.getElementById('liveDate');
    if (liveClockEl) liveClockEl.textContent = now.toLocaleTimeString('en-GB', timeOptions);
    if (liveDateEl) liveDateEl.textContent = now.toLocaleDateString('en-GB', dateOptions);

    // שעון גלובלי
    const tzSelect = document.getElementById('tzSelect');
    const globalClockEl = document.getElementById('globalClock');
    if (tzSelect && globalClockEl) {
        const selectedTz = tzSelect.value;
        const globalTimeOptions = { ...timeOptions, timeZone: selectedTz };
        globalClockEl.textContent = now.toLocaleTimeString('en-GB', globalTimeOptions);
    }
}

// הפעלה ראשונית וטיימר לקצב ריצה של שניה
document.addEventListener('DOMContentLoaded', () => {
    setInterval(updateClock, 1000);
    updateClock();
});