/**
 * Portal Version Web Component
 * Standard HTML5 Custom Element with full CSS separation
 */
class PortalVersionWidget extends HTMLElement {
    async connectedCallback() {
        // 1. הזרקת ה-HTML
        this.innerHTML = `
            <div class="version-widget-wrapper">
                <p>Live Synchronization via Secure Cloud Architecture</p>
                <div class="version-badges-container">
                    <div class="version-badge">
                        <span>Version: </span>
                        <span id="pv-version" class="version-value bold">Syncing...</span>
                    </div>
                    <div class="version-badge">
                        <span>Last Updated: </span>
                        <span id="pv-date" class="version-value">Syncing...</span>
                    </div>
                </div>
            </div>
        `;

        // 2. משיכת הנתונים מה-API של Firebase
        try {
            if (typeof window.logActivity === 'function') {
                window.logActivity('Fetching portal metadata from secure API...', 'info');
            }

            const response = await fetch('https://us-central1-eng-web-portal.cloudfunctions.net/driveVersionsProxy');
            const portalRegistry = await response.json();
            
            const currentFileName = window.location.pathname.split("/").pop() || "index.html";
            
            // ניקוי חסין תקלות: הסרת כל סיומת (html, md), החלפת רווחים ומקפים, ומעבר ל-lowercase
            const currentPageKey = currentFileName.replace(/\.[^/.]+$/, "").replace(/ /g, '_').replace(/-/g, '_').toLowerCase();
            
            const pageData = portalRegistry.items[currentPageKey];
            
            // 3. עדכון הנתונים בתוך הקומפוננטה
            if (pageData) {
                this.querySelector('#pv-version').innerText = `v${pageData.version}`;
                //this.querySelector('#pv-date').innerText = pageData.lastModified;
                this.querySelector('#pv-date').innerText = pageData.lastModified.split(' ')[0];

                if (typeof window.logActivity === 'function') {
                    window.logActivity(`Version v${pageData.version} synchronized successfully.`, 'success');
                }
            } else {
                this.querySelector('#pv-version').innerText = "N/A";
                this.querySelector('#pv-date').innerText = "N/A";
                if (typeof window.logActivity === 'function') {
                    window.logActivity(`No metadata found for ${currentPageKey}.`, 'warning');
                }
            }
        } catch (error) {
            console.error("Version Sync Error:", error);
            this.querySelector('#pv-version').innerText = "Error";
            this.querySelector('#pv-date').innerText = "Offline";
            if (typeof window.logActivity === 'function') {
                window.logActivity('Failed to fetch version metadata. Running offline mode.', 'error');
            }
        }
    }
}

// רישום התגית החדשה
customElements.define('portal-version', PortalVersionWidget);