/**
 * Version Display Component
 * Loads and displays version information in the page footer
 */

class VersionDisplayComponent {
    constructor(options = {}) {
        this.versionsDataUrl = options.versionsDataUrl || '/assets/data/versions.json';
        this.footerId = options.footerId || 'portal-footer';
        this.versionData = null;
        this.init();
    }

    async init() {
        try {
            await this.loadVersionData();
            this.enhanceFooter();
        } catch (error) {
            console.error('Error initializing version display:', error);
        }
    }

    async loadVersionData() {
        try {
            const response = await fetch(this.versionsDataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.versionData = await response.json();
        } catch (error) {
            console.error('Failed to load versions.json:', error);
            throw error;
        }
    }

    getCurrentPageInfo() {
        // Get the current page filename
        const currentPath = window.location.pathname;
        const filename = currentPath.split('/').pop() || 'index.html';
        
        // Find matching page in versions data
        if (this.versionData && this.versionData.pages) {
            return this.versionData.pages.find(page => page.filename === filename);
        }
        return null;
    }

    getStatusDefinition(status) {
        if (this.versionData && this.versionData.statusDefinitions) {
            return this.versionData.statusDefinitions[status];
        }
        return null;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    enhanceFooter() {
        const footer = document.getElementById(this.footerId);
        if (!footer) {
            console.warn(`Footer with ID "${this.footerId}" not found`);
            return;
        }

        const pageInfo = this.getCurrentPageInfo();
        const portalInfo = this.versionData?.portal;

        if (!pageInfo || !portalInfo) {
            console.warn('Could not find page or portal version information');
            return;
        }

        const statusDef = this.getStatusDefinition(pageInfo.status);
        
        // Create version display element
        const versionDisplay = document.createElement('div');
        versionDisplay.className = 'version-display';
        versionDisplay.innerHTML = `
            <div class="version-info">
                <div class="version-left">
                    <span class="version-label">Version:</span>
                    <span class="version-number">${pageInfo.version}</span>
                </div>
                <div class="version-middle">
                    <span class="status-badge" style="background-color: ${statusDef?.color || '#6c757d'}">
                        ${statusDef?.label || pageInfo.status.toUpperCase()}
                    </span>
                </div>
                <div class="version-right">
                    <span class="version-timestamp" title="Last updated on ${pageInfo.lastUpdated}">
                        Updated: ${this.formatDate(pageInfo.releaseDate)}
                    </span>
                </div>
            </div>
            <div class="version-meta">
                <span class="portal-version">Portal v${portalInfo.currentVersion}</span>
                <button class="version-info-btn" aria-label="View version details" title="Version Details">ℹ️</button>
            </div>
        `;

        // Add click handler for info button
        const infoBtn = versionDisplay.querySelector('.version-info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => this.showVersionDetails(pageInfo));
        }

        // Insert at the beginning of footer content
        footer.insertBefore(versionDisplay, footer.firstChild);
    }

    showVersionDetails(pageInfo) {
        // Create a modal or expandable details section
        const detailsHtml = this.generateVersionDetailsHtml(pageInfo);
        
        // Check if details already exist
        let detailsElement = document.getElementById('version-details-modal');
        if (!detailsElement) {
            detailsElement = document.createElement('div');
            detailsElement.id = 'version-details-modal';
            detailsElement.className = 'version-details-modal';
            document.body.appendChild(detailsElement);
        }

        detailsElement.innerHTML = detailsHtml;
        detailsElement.style.display = 'block';

        // Close button handler
        const closeBtn = detailsElement.querySelector('.close-details');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                detailsElement.style.display = 'none';
            });
        }

        // Close on outside click
        detailsElement.addEventListener('click', (e) => {
            if (e.target === detailsElement) {
                detailsElement.style.display = 'none';
            }
        });
    }

    generateVersionDetailsHtml(pageInfo) {
        const statusDef = this.getStatusDefinition(pageInfo.status);
        
        let changelogHtml = '';
        if (pageInfo.changelog && pageInfo.changelog.length > 0) {
            changelogHtml = '<div class="changelog"><h4>Version History</h4>';
            pageInfo.changelog.forEach(entry => {
                changelogHtml += `
                    <div class="changelog-entry">
                        <div class="changelog-version">v${entry.version} (${this.formatDate(entry.date)})</div>
                        <ul class="changelog-changes">
                            ${entry.changes.map(change => `<li>${change}</li>`).join('')}
                        </ul>
                    </div>
                `;
            });
            changelogHtml += '</div>';
        }

        return `
            <div class="version-details-content">
                <button class="close-details" aria-label="Close details">✕</button>
                <div class="details-header">
                    <h3>${pageInfo.title}</h3>
                    <span class="status-badge" style="background-color: ${statusDef?.color || '#6c757d'}">
                        ${statusDef?.label || pageInfo.status.toUpperCase()}
                    </span>
                </div>
                <div class="details-body">
                    <div class="detail-item">
                        <span class="detail-label">Current Version:</span>
                        <span class="detail-value">${pageInfo.version}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Released:</span>
                        <span class="detail-value">${this.formatDate(pageInfo.releaseDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Description:</span>
                        <span class="detail-value">${pageInfo.description}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">File:</span>
                        <span class="detail-value mono">${pageInfo.filename}</span>
                    </div>
                    ${changelogHtml}
                </div>
            </div>
        `;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new VersionDisplayComponent();
});
