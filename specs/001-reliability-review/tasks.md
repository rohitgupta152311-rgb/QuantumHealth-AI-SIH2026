# Tasks: Reliability review
## Foundation
- [x] T001 Record constitution and acceptance criteria in ../.specify/memory/constitution.md and specs/001-reliability-review/spec.md (FR-009, FR-010).
- [x] T002 Complete plan and design artifacts in specs/001-reliability-review/plan.md (FR-010).
## US1 - Stable inference (P1)
- [x] T003 [US1] Add non-training reload, incomplete bundle, and preprocessing mismatch regressions in backend/tests/test_cache_reload.py (FR-001, FR-002).
- [x] T004 [US1] Implement validated complete bundle loading in backend/app/classical_ml/trainer.py and backend/app/services/training_orchestrator.py and backend/app/services/prediction_service.py (FR-001, FR-002).
## US2 - Navigation and connectivity (P1)
- [x] T005 [US2] Add rendered URL/history and health refresh regression tests in frontend/src/__tests__/page-state.test.tsx (FR-005, FR-006).
- [x] T006 [US2] Repair navigation in frontend/src/pages/DiseaseAnalysisPage.tsx and stale requests in frontend/src/pages/SettingsPage.tsx (FR-005, FR-006).
## US3 - Quality gates (P1)
- [x] T007 [US3] Configure frontend/eslint.config.js and resolve findings in frontend/src (FR-004).
- [x] T008 [US3] Enforce lint and tests in .github/workflows/frontend-tests.yml and .github/workflows/full-ci.yml (FR-003).
- [x] T009 [US3] Unify pytest.ini, add explicit training/integration opt-ins in conftest.py, classify tests in backend/tests and tests/backend, and align backend CI commands (FR-007).
- [x] T010 [US3] Run and record typecheck, lint, tests, build, audit and backend default checks in docs/reliability-verification.md (FR-003, FR-004, FR-007, FR-009).
## US4 - Honest evidence (P2)
- [x] T011 [US4] Remove hardcoded passing claims in backend/app/api/routes/health.py and frontend/src/pages/AboutPage.tsx, LimitationsPage.tsx, components/demo/JudgeDemoMode.tsx (FR-008).
- [x] T012 [US4] Complete analysis and dated verification in specs/001-reliability-review/analysis.md and docs/reliability-verification.md (FR-010).

## Dependencies and strategy
T001 -> T002 -> prerequisite analysis. T003 before T004; T005 before T006. T007/T008/T009 before T010. T011 and all verification before T012. US1, US2, and US3 may be implemented independently after setup, but execution is sequential to preserve user edits. Each story has independent tests in spec.md. No deployment or training phase is included.

## Verified completion
All implementation/reporting tasks completed on 2026-09-10. Backend: 67 passed, 24 excluded; frontend: 25 passed; lint/typecheck/build passed; audits zero. Real prediction remains blocked by existing checkpoint hash mismatches; no training or artifact rewrite was performed.

