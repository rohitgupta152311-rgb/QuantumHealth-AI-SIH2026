# Verification quickstart
From repository root, using the project Python interpreter: python -m pytest
Training only (explicitly opt-in, not run during repairs): python -m pytest --run-training -m training
Existing-artifact integration only: python -m pytest --run-integration -m integration
From frontend: npm ci; npm run lint; npm run typecheck; npm test -- --run; npm run build; npm audit
On Windows use npm.cmd if npm.ps1 resolves an inaccessible roaming npm installation.
Start the application from root with .\run_all.ps1. Never assume readiness until endpoint contents are verified. See docs/local-startup.md for logs and interpreter selection.
