# Lighthouse Production Evidence Manifest

- Repository: YevgeniAmin/ENG_Test
- Branch: `fix/global-tokens-contrast` (merged and deleted)
- Pull Request: [#6](https://github.com/YevgeniAmin/ENG_Test/pull/6)
- Validated PR head SHA (application code): `8ebc2d3be9dff96218e2e9413789dc292297a813`
- Final PR head SHA (docs/evidence only, no `public/` changes after `8ebc2d3`): `f04cb0bcdf0adc4a75c05e5a8df112c4d4028891`
- Merge commit SHA: `28f19076085f14b1ec4bbbdc779dab3f631f307b`
- Merge timestamp: 2026-07-24T18:04:54Z
- Merge method: merge commit (`gh pr merge --merge`), consistent with PR #4/#5 history
- Deployed commit SHA: `28f19076085f14b1ec4bbbdc779dab3f631f307b`
- Production workflow run: [30115527966](https://github.com/YevgeniAmin/ENG_Test/actions/runs/30115527966) ("Deploy to Firebase Hosting on merge", triggered from `main` by the merge push, completed 2026-07-24T18:05:38Z, conclusion: success, no failed/cancelled steps)
- Production domain: `https://yevgeni.info`
- Execution date: 2026-07-24
- Lighthouse version: 13.4.1

| Route | Tested URL | Accessibility | Report | Failed Audits |
|---|---|---:|---|---|
| Homepage | `/` | 1.00 | `lighthouse-index.json` | None |
| Core Memory | `/core-memory` | 1.00 | `lighthouse-core-memory.json` | None |
| PowerShell Sim | `/powershell-sim` | 1.00 | `lighthouse-powershell-sim.json` | None |
| ATP AI Simulation | `/atp-ai-simulation` | 1.00 | `lighthouse-atp-ai-simulation.json` | `table-fake-caption` (weight 0, non-scoring, pre-existing) |
| My Tech DNA | `/my-tech-dna` | 1.00 | `lighthouse-my-tech-dna.json` | `label-content-name-mismatch` (weight 0, non-scoring, pre-existing) |
| ESS Lab | `/ess-lab` | 1.00 | `lighthouse-ess-lab.json` | None |
| Legal Terms | `/legal-terms` | 1.00 | `lighthouse-legal-terms.json` | None |
| 404 | `/404` | 1.00 | `lighthouse-404.json` | None |

All eight scores read `categories.accessibility.score === 1` directly from the JSON. The two non-scoring findings (`table-fake-caption`, `label-content-name-mismatch`) carry `weight: 0` / `group: "hidden"` in their respective `auditRefs` — they do not affect the category score, predate this PR, and are not a regression from it. Both remain open as deferred, non-blocking follow-up scope (see ADS-003).

## Dynamic / latent state validation (live, against production)

| State | Trigger | Live-measured colors | Contrast | Result |
|---|---|---|---|---|
| ATP `#final-status` ACCEPTED | select "ACCEPTED", fire `change` | `rgb(26,107,48)` on `rgb(230,244,234)` (`#1a6b30`/`#e6f4ea`) | 5.8:1 | Pass |
| ATP `#final-status` REJECTED | select "REJECTED", fire `change` | `rgb(184,36,28)` on `rgb(252,232,230)` (`#b8241c`/`#fce8e6`) | 5.39:1 | Pass |
| PowerShell `#terminal-status` EXECUTING | select a cmdlet card → click "Open Terminal" → click "Execute" | `rgb(185,28,28)` on `rgb(241,245,249)` (`#b91c1c`/`#f1f5f9`) | 5.91:1 | Pass |
| Core Memory `.alert-danger` | — | not reachable | n/a | **Static CSS verification only, not a live-state validation.** Grepped `core-memory.html`, `core_memory.js`, and `core_memory_translator.js` on the deployed code — no path applies this class; it is dead CSS with no reachable trigger. Its declared color pair (`#b91c1c` on `#fef2f2`) calculates to 5.91:1, which would pass if the component were ever wired up, but this was not observed rendering live. |

`.log-error` (PowerShell Sim) is not listed above because it was never the active state — grepping `powershell-sim.js` confirms no script path applies that class. The verified reachable state is `#terminal-status`, which is what this manifest validates.
