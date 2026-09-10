# Implementation Plan: Reliable inference and verified application state
**Feature**: 001-reliability-review | **Date**: 2026-09-10 | **Spec**: spec.md

## Summary
Load composite bundles through one validating, non-training method. Canonicalize disease navigation, invalidate health request generations, enforce frontend quality gates, separate backend training tests, and remove unsupported claims.

## Technical Context
Python backend (CI 3.11; isolated QA 3.12), FastAPI, scikit-learn/joblib; React 18, TypeScript, Vite 7, Vitest 4, ESLint 9. Trusted local pkl/JSON artifacts and existing SQLAlchemy storage. Windows local development and Linux CI. Scope is the seven findings; no new performance target or persistence service. Reload must perform no fitting. Preserve the current UI and avoid new runtime frontend dependencies; DOM test tools are development dependencies.

## Constitution Check
Pre-research and post-design: all five principles satisfied by design. Honest evidence: explicit unavailable state. State preservation: complete bundle validation. Gates: CI fails on checks. User work: targeted edits only. Operation: no retraining/deploy, isolated QA environment. Actual execution is recorded separately; design compliance is not a test pass.

## Project Structure
- backend/app/classical_ml/trainer.py: shared cached-bundle loader.
- backend/app/services/training_orchestrator.py: inference cache path.
- backend/tests/test_cache_reload.py: non-training serialization regressions.
- frontend/src/pages and frontend/src/__tests__: state repairs and DOM regressions.
- frontend/eslint.config.js, .github/workflows: quality gates.
- pytest.ini, conftest.py, both backend test directories: discovery and training opt-in.
- specs/001-reliability-review: spec, plan, research, data-model, contracts, quickstart, tasks, analysis.

## Implementation sequence
US1 cached-state restoration; US2 rendered interaction fixes; US3 lint/CI and safe test classification; US4 claim removal and evidence. Validate independently, then run combined checks. Training/integration exclusions must be reported explicitly.

## Complexity Tracking
No constitutional exceptions. No new production service or data schema migration.

## Final compatibility detail
Full metric records are retained in new bundles. Older abbreviated manifests remain readable; prediction_service.py computes missing comparison fields by evaluating saved classifiers without fitting models. Regression coverage includes this path. UI fusion labels no longer assert fixed weights that conflict with the saved ensemble.

