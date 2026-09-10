# Local startup and verification

From the repository root:

```powershell
.\run_all.ps1
```

`run_all.bat` delegates to the same launcher. Use `-NoBrowser` to avoid opening a browser, and `-PythonPath 'C:\path\to\python.exe'` to choose the interpreter. The launcher prefers `backend/.venv`, `backend/venv`, then root `.venv`, before checking installed Python. Install dependencies into that exact interpreter using `-m pip install -r backend/requirements.txt` when needed.

Frontend: http://127.0.0.1:5173. Backend: http://127.0.0.1:8000. Logs: `logs/`. Matching services are reused, unknown port owners are left untouched, and startup waits for service and proxy readiness. Service readiness does not establish model availability.

Node requirement: 20.19+, 22.12+, or 24+. The config runner avoids the esbuild parent-directory access problem observed in the restricted Windows environment. Use `npm.cmd` if the PowerShell npm shim resolves a missing roaming npm installation.

## Model safety

`AUTO_TRAIN_MISSING_MODELS` defaults to false. Inference restores the complete saved bundle, preprocessing, manifest, calibration, fusion, and abstention threshold. Standalone classifier files are not sufficient. Adding an optional installed classifier does not alter the saved bundle's classifier set.

A preprocessing SHA-256 mismatch must be resolved by restoring the matching trusted pipeline/bundle/manifest from the same training run. Never edit hashes to make an incompatible checkpoint appear valid. Explicit training requires separate authorization.

## Tests

The canonical backend command from the repository root is:

```powershell
python -m pytest
```

This collects both `tests/backend` and `backend/tests`, while excluding `training` and `integration` tests by default. Unit tests use temporary caches and an in-memory database; cloud services are disabled. Model training calls fail if attempted outside explicit training tests.

Inspect all tests without running them:

```powershell
python -m pytest --collect-only --run-training --run-integration
```

Explicit training-only command (NOT run during this repair):

```powershell
python -m pytest --run-training -m training
```

Existing-artifact integration, only after restoring compatible checkpoints:

```powershell
python -m pytest --run-integration -m integration
```

These opt-ins are independent. Backend CI uses the same default root command. Tests performing only preprocessing operations on temporary synthetic arrays remain in the default suite; classifier/VQC training tests do not.

From `frontend`:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test -- --run
npm.cmd run build
npm.cmd audit
npm.cmd audit --omit=dev
```

See `docs/reliability-verification.md` for the dated execution evidence and remaining checkpoint blockers. An isolated Python 3.12 QA environment was used because the user's Python 3.14 executable could not be launched in the agent sandbox. The user's interpreter was not replaced.
