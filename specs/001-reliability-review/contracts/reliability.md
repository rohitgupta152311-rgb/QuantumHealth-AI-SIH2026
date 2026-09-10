# Compatibility contracts
Prediction request/response schemas and route aliases remain unchanged. Cache incompatibility raises an actionable error without training. No fallback to fixed hybrid weights on valid bundle reload.
Health keeps test_suite_status for compatibility but uses not_verified when no dated test evidence is supplied. Service health does not imply tests have passed.
Frontend CI must return failure for failed lint, typecheck, tests, or build.
Backend default command from repository root: python -m pytest. Explicit training opt-in: python -m pytest --run-training -m training. Artifact integration opt-in: python -m pytest --run-integration -m integration. Neither opt-in is executed by this repair task.
