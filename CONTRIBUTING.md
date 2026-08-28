# Contributing to QuantumHealth AI

Thank you for contributing to **QuantumHealth AI** — SIH 2026 Problem Statement 26139.

---

## 👥 Team Responsibilities

| Member | Branch Prefix | Primary Areas |
|--------|--------------|--------------|
| TM1 | `feature/frontend-*` | `frontend/` — all React/UI work |
| TM2 | `feature/classical-ml-*` | `backend/app/preprocessing/`, `classical_ml/`, `datasets/` |
| TM3 | `feature/quantum-ml-*` | `backend/app/quantum_ml/`, `hybrid_ml/` |
| TM4 | `feature/backend-api-*`, `devops/*` | `backend/app/api/`, `core/`, `.github/` |

---

## 🌿 Git Branch Strategy

```
main          ← stable, production-ready (protected branch)
  └── develop ← integration branch
        ├── feature/frontend-dashboard
        ├── feature/frontend-quantum-lab
        ├── feature/classical-ml-diabetes
        ├── feature/classical-ml-heart
        ├── feature/quantum-ml-vqc
        ├── feature/quantum-ml-hybrid
        ├── feature/backend-api-predict
        ├── feature/backend-api-comparison
        └── bugfix/issue-description
```

### Branch Naming Convention

```
feature/<area>-<short-description>
bugfix/<issue-description>
hotfix/<critical-fix>
docs/<documentation-topic>
devops/<ci-cd-task>
```

**Examples:**
```
feature/frontend-disease-analysis-form
feature/classical-ml-breast-cancer-pipeline
feature/quantum-ml-angle-encoding
feature/backend-api-prediction-endpoint
bugfix/quantum-circuit-normalization-error
docs/quantum-workflow-explanation
```

---

## 📝 Commit Convention

Use **Conventional Commits** format:

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

### Types
| Type | When to Use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code formatting, no logic change |
| `refactor` | Code restructuring |
| `test` | Adding/fixing tests |
| `chore` | Build, deps, CI/CD |
| `perf` | Performance improvement |

### Scopes
| Scope | Area |
|-------|------|
| `frontend` | React UI |
| `classical-ml` | Classical ML pipeline |
| `quantum-ml` | Quantum ML pipeline |
| `hybrid-ml` | Hybrid model |
| `api` | FastAPI routes |
| `preprocessing` | Data preprocessing |
| `datasets` | Dataset loaders |
| `explainability` | SHAP/feature importance |
| `ci` | GitHub Actions |

### Examples
```
feat(quantum-ml): implement angle encoding for VQC
fix(classical-ml): handle NaN in diabetes feature selector
docs(api): add prediction endpoint documentation
test(preprocessing): add unit tests for DataCleaner
chore(ci): add backend test GitHub Action
feat(frontend): implement quantum readiness analyzer card
```

---

## 🔄 Pull Request Workflow

### Step 1: Create Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/quantum-ml-vqc-training
```

### Step 2: Develop & Commit
```bash
# Make changes
git add .
git commit -m "feat(quantum-ml): implement VQC training with Nelder-Mead optimizer"
```

### Step 3: Push & Create PR
```bash
git push origin feature/quantum-ml-vqc-training
# Open Pull Request on GitHub: feature/... → develop
```

### Step 4: PR Template (fill this in on GitHub)
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactor

## Testing
- [ ] Unit tests pass (`pytest tests/backend/`)
- [ ] Frontend builds (`npm run build`)
- [ ] Manual testing done

## Reviewer Notes
Any specific areas to review.
```

### Step 5: Code Review Requirements
- At least **1 review** required before merge
- All CI checks must pass (pytest, lint)
- No force-pushes to `develop` or `main`
- Squash merges preferred for feature branches

### Step 6: Merge to Develop
After approval: **Squash and Merge** → `develop`

### Step 7: Release to Main
After stability testing on `develop`:
```bash
git checkout main
git merge develop
git tag v1.x.x
git push origin main --tags
```

---

## ⚙️ Development Setup

See [docs/setup.md](docs/setup.md) for full setup instructions.

Quick reference:
```powershell
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest ../tests/backend/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Linting
```bash
# Backend
cd backend
.\venv\Scripts\python.exe -m flake8 app/

# Frontend
cd frontend
npm run lint
```

---

## 📐 Code Standards

### Python (Backend)
- Follow **PEP 8**
- Type hints on all function signatures
- Docstrings on all public classes and functions
- Max line length: 100 characters
- Use `pathlib.Path` for file paths

### TypeScript (Frontend)
- Strict mode enabled
- No `any` types
- All API calls typed with interfaces from `src/types/`
- Components: one component per file
- Props interfaces defined before the component

### Quantum ML Code
- Always document qubit count and circuit depth
- Label all quantum operations as "simulation mode"
- Never claim quantum advantage without evidence
- Include fallback for when PennyLane is not available

---

## 🚫 Rules

1. **Never push directly to `main`**
2. **Never push directly to `develop`** (except hotfixes)
3. **Never commit secrets** (API keys, passwords) — use `.env` files
4. **Never delete remote branches** without team agreement
5. **Test before pushing** — `pytest` and `npm run build` must pass

---

## 🐛 Reporting Issues

Create a GitHub Issue with:
- **Title**: `[<area>] Short description`
- **Description**: Steps to reproduce, expected vs actual behavior
- **Labels**: bug, enhancement, documentation, quantum-ml, classical-ml, frontend, etc.

---

## 📞 Team Communication

- **Daily sync**: Share progress in team channel
- **PR reviews**: Respond within 24 hours
- **Blocking issues**: Tag relevant team member immediately

---

*SIH 2026 | QuantumHealth AI | Problem Statement 26139*
