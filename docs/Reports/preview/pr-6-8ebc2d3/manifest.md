# Lighthouse Preview Evidence Manifest

- Repository: YevgeniAmin/ENG_Test
- Branch: `fix/global-tokens-contrast`
- Pull Request: [#6](https://github.com/YevgeniAmin/ENG_Test/pull/6)
- Validated PR head SHA: `8ebc2d3be9dff96218e2e9413789dc292297a813`
- Preview workflow run: [30114308449](https://github.com/YevgeniAmin/ENG_Test/actions/runs/30114308449) (`Deploy to Firebase Hosting on PR`, completed 2026-07-24T17:47:08Z, conclusion: success)
- Preview URL: `https://eng-web-portal--pr6-fix-global-tokens-co-7mrpizfq.web.app` (channel expires 2026-07-31T17:46:57Z)
- Merge commit SHA: not yet merged
- Deployed commit SHA (production): not applicable — this manifest covers preview only
- Production workflow run: not applicable
- Production domain: `https://yevgeni.info` (not yet updated by this PR)
- Execution date: 2026-07-24
- Lighthouse version: 13.4.1

**Note on head SHA:** an earlier request asked to validate commit `54286c6`. While validating the dynamic/latent states below, live interaction against that commit's preview found a real, previously-unflagged failure (PowerShell Sim's `#terminal-status` during execution, 3.44:1, `.log-error` — the class named in this branch's prior description — is actually dead code and irrelevant). That was fixed in commit `8ebc2d3`, which is what this manifest and all reports below validate. `54286c6`'s reports were not saved as evidence since they reflect a known-incomplete state.

| Route | Tested URL | Accessibility | Report | Failed Audits |
|---|---|---:|---|---|
| Homepage | `/` | 1.00 | `lighthouse-index.json` | None |
| Core Memory | `/core-memory` | 1.00 | `lighthouse-core-memory.json` | None |
| PowerShell Sim | `/powershell-sim` | 1.00 | `lighthouse-powershell-sim.json` | None |
| ATP AI Simulation | `/atp-ai-simulation` | 1.00 | `lighthouse-atp-ai-simulation.json` | `table-fake-caption` (weight 0, non-scoring, pre-existing — table uses colspan cells instead of a `<caption>`) |
| My Tech DNA | `/my-tech-dna` | 1.00 | `lighthouse-my-tech-dna.json` | `label-content-name-mismatch` (weight 0, non-scoring, pre-existing — `a.brand`'s visible text "EA / ENG-PORTAL" isn't included in its `aria-label` "ENG-Portal home") |
| ESS Lab | `/ess-lab` | 1.00 | `lighthouse-ess-lab.json` | None |
| Legal Terms | `/legal-terms` | 1.00 | `lighthouse-legal-terms.json` | None |
| 404 | `/404` | 1.00 | `lighthouse-404.json` | None |

All eight scores read `categories.accessibility.score === 1` directly from the JSON (not a rounded UI percentage). The two non-scoring findings above (`table-fake-caption`, `label-content-name-mismatch`) do not affect the category score (`weight: 0`, `group: "hidden"` in each report's `auditRefs`) and predate this PR — neither is a regression from these changes, and neither is required to close this PR's scope, but both are real and worth a future ticket.

## Dynamic / latent state validation

These states are not present in the default DOM (hidden by default, or only rendered after user interaction), so Lighthouse's static crawl never exercises them. Validated by live browser interaction (Puppeteer) against the preview above, not by static analysis alone:

| State | Trigger | Live-measured colors | Contrast | Result |
|---|---|---|---|---|
| ATP `#final-status` ACCEPTED | select "ACCEPTED", fire `change` | `rgb(26,107,48)` on `rgb(230,244,234)` (`#1a6b30`/`#e6f4ea`) | 5.8:1 | Pass |
| ATP `#final-status` REJECTED | select "REJECTED", fire `change` | `rgb(184,36,28)` on `rgb(252,232,230)` (`#b8241c`/`#fce8e6`) | 5.39:1 | Pass |
| PowerShell `#terminal-status` EXECUTING | select a cmdlet card → click "Open Terminal" → click "Execute" | `rgb(185,28,28)` on `rgb(241,245,249)` (`#b91c1c`/`#f1f5f9`) | 5.91:1 | Pass (fixed by commit `8ebc2d3`; measured `rgb(239,68,68)`/3.44:1, failing, on the prior commit `54286c6`) |
| Core Memory `.alert-danger` | — | not reachable | n/a | **Not triggerable** — grepped `core-memory.html` and both its scripts (`core_memory.js`, `core_memory_translator.js`); no code path adds this class or references it anywhere. Confirmed dead CSS, not a live UI state. Its color pair (`#b91c1c` on `#fef2f2`, 5.91:1) was fixed anyway since it shares Core Memory's `#ef4444`/`#fef2f2` bug pattern, but this can't be verified live because nothing renders it. |
| PowerShell `.log-error` | — | not reachable | n/a | **Not triggerable** — grepped `powershell-sim.js`; the class is defined in CSS but never applied by any code path. The prior PR description's claim that this class "relies on [the error token] against a dark terminal background" was incorrect and unverified; the actual reachable error-colored dynamic state is `#terminal-status` (row above), which sits on a **light** background, not dark. This is the correction that drove the `8ebc2d3` fix.
