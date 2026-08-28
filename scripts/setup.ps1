<#
.SYNOPSIS
    QuantumHealth AI — Windows setup script
.DESCRIPTION
    Sets up the Python virtual environment and installs all dependencies.
#>

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$NodePath = "C:\Program Files\nodejs"
$env:PATH = "$NodePath;" + $env:PATH

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  QuantumHealth AI — Setup Script (Windows)" -ForegroundColor Cyan
Write-Host "  SIH 2026 | Problem Statement 26139" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$ROOT = $PSScriptRoot | Split-Path -Parent

# ── Backend Setup ────────────────────────────────────────────────────────────
if (-not $FrontendOnly) {
    Write-Host "[1/4] Setting up Python virtual environment..." -ForegroundColor Yellow
    Set-Location "$ROOT\backend"
    
    if (-not (Test-Path "venv")) {
        python -m venv venv
        Write-Host "  ✓ Virtual environment created." -ForegroundColor Green
    } else {
        Write-Host "  ✓ Virtual environment already exists." -ForegroundColor Green
    }
    
    Write-Host "[2/4] Installing Python dependencies..." -ForegroundColor Yellow
    & "$ROOT\backend\venv\Scripts\pip.exe" install --upgrade pip --quiet
    & "$ROOT\backend\venv\Scripts\pip.exe" install -r requirements.txt
    Write-Host "  ✓ Python dependencies installed." -ForegroundColor Green
    
    # Create models cache dir
    New-Item -ItemType Directory -Force -Path "$ROOT\backend\models_cache" | Out-Null
    Write-Host "  ✓ Models cache directory ready." -ForegroundColor Green
}

# ── Frontend Setup ───────────────────────────────────────────────────────────
if (-not $BackendOnly) {
    Write-Host "[3/4] Installing Node.js dependencies..." -ForegroundColor Yellow
    Set-Location "$ROOT\frontend"
    & "$NodePath\npm.cmd" install
    Write-Host "  ✓ Frontend dependencies installed." -ForegroundColor Green
}

Write-Host ""
Write-Host "[4/4] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the backend:" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  python main.py" -ForegroundColor White
Write-Host ""
Write-Host "To start the frontend (new terminal):" -ForegroundColor Cyan
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "API docs available at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend at: http://localhost:5173" -ForegroundColor Cyan
