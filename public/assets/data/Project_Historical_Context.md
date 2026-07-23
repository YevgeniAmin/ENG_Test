# Project Historical Context: ENG-Portal Enterprise Suite

This document serves as the absolute single source of truth for the architectural evolution, core design systems, developed modules, and internal engineering terminology established throughout the R&D lifecycle of the ENG-Portal.

---

## 1. Architectural Evolution & R&D Milestones

### Phase 1: Cloud-Dependent UI
* **Core Paradigm:** Initial client-side design code-named the "Digital Fairy."
* **Technical Footprint:** Heavy frontend layout reliance on Tailwind CSS and public cloud engines.
* **Bottlenecks:** High execution latency, strict cross-origin blocking parameters (CORS crashes), and volatile cloud computing consumption fees.

### Phase 2: Local Edge Cluster Shift (`srv-1`)
* **Core Paradigm:** Re-architecting the backend core into a self-hosted hypervisor infrastructure.
* **Technical Footprint:** Deployment of a bare-metal Proxmox VE node (`srv-1.yevgeni.info`). Configured physical PCIe pass-through of an NVIDIA RTX 5060 Ti GPU directly into an isolated Linux Container (LXC). Orchestrated local LLM model execution via Ollama (Llama 3 / Llama 3.1 8B).

### Phase 3: The Secret Nexus Proxy Solution
* **Core Paradigm:** Eliminating HTTP Error 500 boundary loops caused by rigid cross-origin firewall rules.
* **Technical Footprint:** Programmed an intelligent Node.js middle tier (`server.js`) acting as the **Secret Nexus Proxy**. Implemented automated sequential handshake parsing, cryptographic token protection, and a fail-safe execution loop: "Execute pipeline via local Edge GPU; if node reports extreme VRAM stress or an 8-second connection timeout, fallback instantly and invisibly to Google Cloud Gemini APIs utilizing strict `BLOCK_NONE` safety arrays."

### Phase 4: Decentralized AI Advisory Board
* **Core Paradigm:** Multi-agent role governance injected uniformly across chat environments to establish structured code validation patterns.
* **Persona Mapping:**
  * **Max (Gemini Node):** Software Quality Assurance (QA) Director. Mandate: Detailed bug hunting, event log parsing, CORS isolation audits.
  * **David (ChatGPT Node):** Technical Project Manager (PM). Mandate: Sprint orchestration, verification checklists, milestone tracking.
  * **Copilot (GitHub Node):** Solutions Architect & Tech Writer. Mandate: ATP boilerplates, security blueprints, component definitions.
  * **Naftali (Local Node):** Lead Electronics & Hardware Specialist. Mandate: OrCAD Capture CIS component library mapping and MPN matrices.

### Phase 5: Complete Vanilla Component Refactoring (Latest Achievement)
* **Core Paradigm:** Full purge of all layout frameworks (Purged Tailwind CSS, Bootstrap, React, and jQuery) to eliminate framework lock-in and optimize asset rendering overhead.
* **Technical Footprint:** Transitioned to pure, native HTML5 semantic tags, vanilla JavaScript DOM manipulation engines, and centralized CSS global properties stored inside the document layout hierarchy.

---

## 2. Major Architectural Core Decisions

### 2.1 Global Tokenization (`global-tokens.css`)
* **Decision:** Extracted all loose layout variables into a standalone, project-wide theme token spreadsheet.
* **Execution:** All component attributes (Material Design 3 palette configurations, rigid 8px system grid margins, `--radius-md: 12px` declarations, subtle elevation filters, and standard 200ms cubic-bezier transition speeds) are stored in the global `:root`. This guarantees a flawless, unified look across completely decoupled views.

### 2.2 Security & Telemetry Hardening (Copilot Audit Compliance)
* **Decision:** Injected rigid SEO metadata frameworks, semantic navigation accessibility states (`aria-expanded="false"` tags), and native asset optimization layers (`loading="lazy"`) directly into the master container layout.
* **Execution:** Eliminated script injection risk vectors by enforcing full plain-text extraction filters inside dynamic DOM rendering scripts.

### 2.3 Single Point Version Telemetry
* **Decision:** Implemented a centralized orchestration script (`version-sync.js`) that tracked, mapped, and updated build status tags (`v2.4.0-Sim`) and security classification bars across static portal resources.
* **Update:** `version-sync.js` was removed from the repository (see `docs/architecture/known-risks.md`, R-07). The pages that used it now render a static, unstyled `.version-sync` placeholder pending a follow-up decision on whether to restore, restyle, or remove it.

---

## 3. Active UI Components & Core Modules

* **Production Dashboard Grid (`index.html`):** The primary launchpad interface. Features responsive visual slots, descriptive subtitle tracking matrices ("Architecting the Future of Hybrid Edge-Cloud AI"), and direct card linkages.
* **NotebookLM Cognitive Simulator Layer (`notebook-simulator.js`):** An high-fidelity portfolio presentation widget embedded in the main dashboard workspace. Uses a highly stable client-side chunking mechanism to partition raw project data arrays into 3 curated templates. Renders outputs using a typewriter animation loop (4ms cadence) to safely mockup interactive model execution without network overhead or XSS vulnerabilities.
* **PowerShell Enterprise Systems Cockpit (`powershell-sim.html`):** A beautiful, desktop-first, multi-column simulation board. Features a live cmdlet list creating dynamic data blocks for specialized system tests (Win32 Physical Memory tracking, CimInstance hardware auditing, secure Proxmox CT 102 package updates, and local token throughput benchmarks). Includes a functional 4-stage Workflow Stepper panel.
* **Lossless Audio Verification Lab:** A modular DSP calculation component built using the native Web Audio API suite. Supports accurate SNR sweeps, absolute phase reversal tests, pink/white noise wave compilation, and high-resolution 24-bit/96kHz output file creation blocks.
* **The Digital Mirror & Legal Engine (`my_tech_dna.html` & `legal_terms.html`):** Fully sanitized, isolated document templates running entirely on the new token system, containing deep, legally binding intellectual property clauses and R&D logs.

---

## 4. Engineering Vocabulary & Glossary

* **M3 Tokens:** Centralized CSS design system properties storing structural atoms to maintain aesthetic harmony.
* **CORS / Cross-Origin Resource Sharing:** A browser security protocol that originally blocked incoming cloud layout fetches, solved via the Secret Nexus.
* **Zero Inline Styles:** A strict portal design constraint mandating 100% decoupling of markup logic from layout attributes.
* **VDD / Version Description Document:** An automated ledger of software compilation updates mapped for industrial IoT edge units.