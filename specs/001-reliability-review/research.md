# Research decisions
- Existing trainer already saves a composite bundle plus manifest. Restore that format rather than reconstructing individual classifiers and silently losing calibration. Validate required fields and preprocessing hash before assigning trainer state.
- Disease path parameters outrank query parameters on initialization. User selection will navigate to a new path, preserving legacy query entry compatibility and router history.
- Settings requests use a monotonically increasing request generation, clearing prior health data at refresh and ignoring obsolete completions.
- ESLint flat config uses installed TypeScript and hooks plugins; add DOM testing tools only as development dependencies.
- Both pytest directories must be discovered. Tests invoking model fit/train are explicitly marked training, and collection deselects them unless --run-training is supplied. Artifact-dependent integration tests are separately opt-in.
- User Python is inaccessible in this environment. An isolated QA venv using the runnable bundled Python enables safe test execution without altering the user's interpreter or saved model artifacts.
No unresolved design questions. Runtime compatibility is a verification risk, not presumed success.
