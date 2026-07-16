# Project Tracker: Engineering Backlog & Future R&D Roadmap

This document serves as the operational tracking ledger for upcoming development cycles, technical backlog expansion, and next-generation research modules mapped for the ENG-Portal ecosystem.

---

## 1. Completed & Verified Milestones (Archive)

* [x] **Vanilla MD3 Core Refactoring:** Completely purged all Tailwind CSS overhead from `index.html`, `powershell_sim.html`, `my_tech_dna.html`, and `legal_terms.html`.
* [x] **Centralized Design System:** Created and linked `global-tokens.css` to manage theme continuity via unified properties.
* [x] **SEO & Accessibility Implementation:** Patched accessibility flags, added high-impact description meta tags, and forced resource lazy-loading loops.
* [x] **NotebookLM Interface Mockup:** Programmed `notebook-simulator.js` with typewriter rendering engines and input boundary anti-XSS filters.

---

## 2. High-Priority Infrastructure & Automation Backlog

### 🔲 Local Automation Database Python Aggregator (`@task`)
* **Objective:** Build a Python-based server side orchestration tool (`update_notebook_db.py`) executing natively inside a Proxmox container node or Git hook pipeline.
* **Technical Blueprint:**
  * The script will monitor local R&D directories and scan markdown log entries for explicit annotations (`@decision`, `@task`, `@note`, `@idea`).
  * On a commit trigger, it will automatically parse the captured strings, format them into sanitized text chunks, and update the static knowledge database structure inside `notebook-simulator.js` without manual file alterations.
* **Target Environment:** Python 3.10+, Local Dev Station / `srv-1` automation tier.

### 🔲 Real-Time WebSockets Engine Integration (`@idea`)
* **Objective:** Evolve the PowerShell Systems Cockpit from an isolated client-side simulation array into a live infrastructure utility.
* **Technical Blueprint:**
  * Open encrypted, authenticated WebSocket communication channels between the browser UI and a local Node.js process.
  * Establish strict backend regex command filters to completely block destructive or malicious string inputs from touching target environment shells.
  * Map real-time standard output and error buffers dynamically into the Material Design 3 (M3) Log Viewer log container.

### 🔲 Advanced Data Schema & Automated VDD Compiler (`@task`)
* **Objective:** Finalize the structured JSON repository schema to generate automatic Version Description Documents (VDD) for specialized Windows 11 IoT machinery deployments.
* **Technical Blueprint:**
  * Design a rigorous validation template capturing host processors parameters, configuration hash footprints, network topologies, and active software layers.
  * Write an optimized compilation routine that converts raw database dumps instantly into official engineering deployment files.

---

## 3. UI/UX Component & Modular Views Backlog

### 🔲 Pure Canvas Diagnostic Graphing Component (`@task`)
* **Objective:** Discard the current CSS-static graphs container within the terminal sidebar and implement fully responsive visual performance metrics charts.
* **Technical Blueprint:**
  * Pull in a light, framework-free graphing library (or write a custom HTML5 Canvas wrapper) to chart true operational parameters like round-trip latency, token generation output speed, and edge node availability percentages.
  * Bind chart drawing scripts directly to terminal simulator event loops to generate realistic visual spikes when a diagnostic cmdlet is fired.

### 🔲 Complete Refactoring of Core Environment View (`core_memory.html`)
* **Objective:** Bring the remaining core project page up to full parity with Phase 5 Vanilla component standards.
* **Technical Blueprint:**
  * Discard all legacy inline attributes and Tailwind classes from the file.
  * Link the template to `global-tokens.css` and map structural components into a balanced multi-column flex layout.
  * Hook the layout footer container directly into the global `version-sync.js` script module.

---

## 4. Strategic Research Initiatives

### 🔲 Electronic Design Automation (EDA) Library Agent Integration (`@idea`)
* **Objective:** Expand the capabilities of the hardware pipeline persona (Naftali Node) by building an OrCAD Capture CIS automated auditor tool.
* **Technical Blueprint:**
  * Code an upload slot capable of ingesting tabular Bill of Materials (.csv, .xlsx) files exported directly from schematic design software.
  * Have the background parsing agent loop through part rows, isolate the Manufacturer Part Number (MPN), call external components inventory APIs, and generate a structural health breakdown flagging obsolete, end-of-life (EOL), or unverified electronic assets.