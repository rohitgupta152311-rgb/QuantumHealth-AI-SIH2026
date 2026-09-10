# Reliability repair verification — 2026-09-10

## Outcome

The seven reported code/workflow issues are repaired. The Spec Kit constitution, feature specification, plan, tasks, and analysis are complete. **Live prediction is still blocked by inconsistent existing checkpoint files.** No model retraining or deployment was performed. Existing uncommitted design changes and model files were preserved.

## Fixes and files

| Finding | Repair | Primary files |
|---|---|---|
| Incomplete cache reload | One validating composite loader restores saved classifiers, VQC, hybrid ensemble, calibrators, tuned alpha, abstention threshold, manifest and metrics atomically. Disease, schema, preprocessing identity and required state are checked. Optional installed classifiers do not expand the saved classifier set. | `backend/app/classical_ml/trainer.py`, `backend/app/services/training_orchestrator.py` |
| Abbreviated saved metrics | New bundles retain full metrics. Older manifest summaries remain available; model comparison computes missing fields from saved classifiers rather than passing incomplete summaries to the response schema. No fitting occurs. | `backend/app/services/prediction_service.py`, `backend/tests/test_cache_reload.py` |
| CI tolerated failed tests | Removed `continue-on-error`; frontend tests and lint are blocking steps in both relevant workflows. | `.github/workflows/frontend-tests.yml`, `.github/workflows/full-ci.yml` |
| Lint checked nothing | Added ESLint 9 flat configuration, TypeScript recommended rules and React hooks rules. Removed unused imports, fixed hook calls inside mapping callbacks, and corrected effect/callback dependencies. Existing `any` API boundaries remain explicitly allowed; this is not a strict-any migration. | `frontend/eslint.config.js`, affected frontend imports, `LandingPage.tsx`, `QuantumLaboratory.tsx`, `useDisease.ts`, `useToast.ts` |
| URL disease reverted | Selection navigates to `/analyze/:diseaseId`; path/query entry links and back navigation work. Disease cards use keyboard-accessible buttons with pressed state. | `frontend/src/pages/DiseaseAnalysisPage.tsx`, `frontend/src/features/disease/DiseaseSelector.tsx` |
| Stale Connected state | Refresh clears prior health. Request generations reject superseded responses and unmounted completions. Unavailable device data no longer becomes a default simulator assertion. | `frontend/src/pages/SettingsPage.tsx` |
| Inconsistent pytest discovery | Root command covers both suites, with explicit training/integration opt-ins, isolated default caches/database and guards against implicit training. Backend CI runs that root command. Updated obsolete disease-schema and unfitted-model expectations. | `pytest.ini`, `conftest.py`, both test directories, `.github/workflows/backend-tests.yml`, `.github/workflows/full-ci.yml` |
| Fixed test-passing claims | API reports `test_suite_status: not_verified`; About, Limitations and demo UI no longer advertise fixed passing counts. Fixed 60/40 presentation labels/bars were also removed where they conflicted with saved fusion state. | `backend/app/api/routes/health.py`, `AboutPage.tsx`, `LimitationsPage.tsx`, `JudgeDemoMode.tsx`, `ConsensusDisplay.tsx`, `PipelineExecutor.tsx`, `HybridAIDashboard.tsx`, `LandingPage.tsx`, `frontend/src/services/api.ts` |

Added development-only DOM test dependencies in `frontend/package.json` and `package-lock.json`. New rendered regressions are in `frontend/src/__tests__/page-state.test.tsx`; an old arithmetic-only weighting test now checks that the API adapter preserves returned hybrid probability.

Spec Kit files: parent `.specify/memory/constitution.md` (v1.0.0), parent `.specify/feature.json`, and `specs/001-reliability-review/{spec,plan,research,data-model,quickstart,tasks,analysis}.md` plus `contracts/reliability.md`. Feature artifacts live inside the project; the existing parent Spec Kit installation resolves them.

## Executed checks

Working directory for frontend checks: `C:\Users\kumar\Desktop\main\QuantumHealth-AI-SIH2026\frontend`.

| Check | Exact command / method | Result |
|---|---|---|
| Lint | `C:\Program Files\nodejs\npm.cmd run lint` | Passed; zero findings under the configured rules |
| TypeScript | `C:\Program Files\nodejs\npm.cmd run typecheck` | Passed |
| Frontend tests | `C:\Program Files\nodejs\npm.cmd test -- --run` | 25 passed, 4 files; final run 9.94s |
| Production build | `C:\Program Files\nodejs\npm.cmd run build` | Passed; final JS 1,093.08 kB, gzip 310.18 kB; existing large-chunk warning remains |
| Full npm audit | `C:\Program Files\nodejs\npm.cmd audit --json` | 0 vulnerabilities |
| Production npm audit | `C:\Program Files\nodejs\npm.cmd audit --omit=dev --json` | 0 vulnerabilities |
| Python dependencies | QA interpreter `-m pip install -r backend/requirements.txt`, then `-m pip check` | Installed declared requirements; no broken requirements |
| Backend tests | QA interpreter `-m pytest -q --tb=short --basetemp=C:/Users/kumar/Documents/Codex/2026-09-10/re/work/pytest-final-20260910`, from project root | **67 passed, 24 deselected**, 13.22s |
| Spec Kit prerequisites | `../.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireSpec -RequireTasks -IncludeTasks` | Passed; spec, plan, tasks and supporting docs resolved |
| Diff whitespace | `git -c core.safecrlf=false diff --check` | Passed |
| CI gates | Inspected all three workflow files | No tolerated frontend-test failure; lint and tests enforced; backend root command aligned. Remote GitHub Actions was not run. |
| Browser | Settings and analysis at 1440×900 and 390×844; actual disease selection and Back | Selection/URL/history verified; no document horizontal overflow at those sizes. Mobile Settings screenshot inspected. Viewport override reset. |

QA Python: `C:\Users\kumar\Documents\Codex\2026-09-10\re\work\qa-venv\Scripts\python.exe`, Python 3.12.14, created from the bundled runtime. The user's Python 3.14 executable remained inaccessible in the sandbox and was not replaced. Node: 24.19.0. This is not verification of the user's original Python environment or CI's Python 3.11 environment.

One intermediate backend run encountered Windows access denial for the shared pytest temporary directory after the turn's permissions changed. Re-running with the fresh workspace `--basetemp` above resolved that environmental error. Earlier assertion failures were repaired before the final passing run. The temp override is local QA infrastructure, not a different test selection.

The 24 exclusions comprise **15 training tests** and **9 artifact integration tests**. They were not run or claimed passing. Default tests may fit temporary preprocessing scalers/selectors on synthetic data; they do not train classifiers or VQCs. The 11 cache tests serialize deterministic fixtures, test reload predictions/abstention, corrupt-cache rejection, atomic state restoration and metric compatibility. These fixtures do not establish clinical model quality.

## Services and checkpoint blocker

The launcher was exercised with the QA interpreter and `-NoBrowser`. It started backend PID 24972, then restarted only that QA backend as PID 18352 to load the final code on `127.0.0.1:8000` and reused Vite PID 10596 on `127.0.0.1:5173`. These are observed PIDs, not identifiers to hardcode into scripts. QA backend Firebase/cloud access was disabled; no live cloud functionality was verified.

Direct and proxied `/api/v1/health` returned status `ok` and `test_suite_status: not_verified`. Direct and proxied `/api/v1/diseases` returned the same four disease IDs: diabetes, heart, breast_cancer, kidney. The direct heart prediction request used only fields from the current disease schema and returned **HTTP 500 with an explicit preprocessing mismatch**, not fabricated model results.

Read-only artifact inspection found matching bundle/manifest expectations but different on-disk pipeline SHA-256 values for **all four diseases**:

| Disease | Expected pipeline hash prefix | Actual pipeline hash prefix |
|---|---|---|
| heart | `1877e7368038` | `5a3b4fa34791` |
| diabetes | `d9317ec22ffb` | `6f91fe636dc1` |
| kidney | `4a8c26dc9b1e` | `b903c54c560c` |
| breast_cancer | `e373fd8f20e3` | `55245c4caa5b` |

No alternative pipeline copies were found under `C:\Users\kumar\Desktop\main`; no pipeline history was available from the inspected Git path. The files were not changed and hashes were not rewritten. Restoring trusted pipeline/bundle/manifest sets from the same training runs is required. Model retraining would require separate authorization. The cause of the existing pipeline replacement is not established by this audit.

## Reliable commands

From the project root, normal local startup is `./run_all.ps1` or `run_all.bat`. To explicitly use the QA environment created in this task:

```powershell
.\run_all.ps1 -PythonPath 'C:\Users\kumar\Documents\Codex\2026-09-10\re\work\qa-venv\Scripts\python.exe' -NoBrowser
```

Canonical backend verification is `python -m pytest` from the root using the chosen project interpreter. Optional commands are documented in `docs/local-startup.md`: `--run-training -m training` requires deliberate training authorization; `--run-integration -m integration` requires restored compatible artifacts. Never use `npm audit fix --force` as a shortcut. No additional dependency-security advisories remained in either npm audit.

Overall readiness: **frontend and service connectivity verified; real saved-model inference blocked by checkpoint mismatch.**

