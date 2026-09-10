# Feature Specification: Reliable inference and verified application state
**Feature**: 001-reliability-review (existing working tree)
**Created**: 2026-09-10
**Status**: Accepted for implementation
**Input**: Resolve all seven review findings and complete Spec Kit without retraining or losing the redesign.

## User Scenarios & Testing
### User Story 1 - Stable saved inference (Priority: P1)
Independent test: serialize deterministic model state and reload through the orchestrator, without fitting models.
Acceptance: given a complete bundle, predictions, calibration, hybrid weights, abstention, manifest, and metrics survive reload. Missing or inconsistent artifacts fail clearly without training.
### User Story 2 - Trustworthy navigation and connectivity (Priority: P1)
Independent test: render analysis at a path URL and switch disease; render settings, resolve a health request, then reject its refresh.
Acceptance: path and query deep links initialize correctly, selection updates the canonical URL, browser history restores selection. Failed refresh clears Connected; superseded responses cannot overwrite current state.
### User Story 3 - Reproducible quality checks (Priority: P1)
Independent test: execute frontend checks and default backend tests, inspect collection and CI.
Acceptance: lint and tests block CI; both backend directories are collected; training tests require explicit opt-in.
### User Story 4 - Honest verification evidence (Priority: P2)
Independent test: search API/UI for unsupported claims; run Spec Kit prerequisite and consistency analysis.
Acceptance: fixed passing counts are removed; completed artifacts map requirements to actual dated verification and limitations.

### Edge Cases
Incomplete legacy caches; mismatched preprocessing; optional classifiers absent from a bundle; conflicting URL values; back navigation; overlapping health requests; duplicate test module names.

## Requirements
- FR-001: Atomically restore all saved inference state and validate disease/preprocessing identity.
- FR-002: Reject incomplete caches without implicit training; test reload equivalence and corrupt cache failures.
- FR-003: Enforce frontend tests and lint in CI.
- FR-004: Configure ESLint 9 and resolve meaningful rule findings.
- FR-005: Canonical disease navigation retains path/query compatibility and history behavior.
- FR-006: Clear stale health data and ignore superseded requests.
- FR-007: Unify both backend suites with an explicit training opt-in and documented commands.
- FR-008: Remove unsupported fixed passing claims from API/UI.
- FR-009: Preserve existing work and behavior; no deployment or model training.
- FR-010: Complete Spec Kit and report commands, dates, outcomes, and limitations.

### Key Entities
Model bundle, preprocessing artifact, manifest, disease URL, health request generation, test classification, verification report.

## Success Criteria
- SC-001: Predictions and abstention match across reload; corrupt-cache tests pass.
- SC-002: Rendered route/history/health regressions pass and CI gates failures.
- SC-003: Default backend collection covers both directories; training exclusions and results are reported.
- SC-004: Typecheck, lint, frontend tests, build, audit have recorded outcomes; unsupported passing claims are absent.
- SC-005: All ten requirements map to tasks and evidence; runtime limitations are explicit.

## Assumptions
Only trusted local model files are deserialized. QA may use an isolated environment when the user's interpreter is inaccessible. Feature documents live with code; the parent Spec Kit installation resolves their absolute directory.
