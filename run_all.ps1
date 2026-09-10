[CmdletBinding()]
param(
    [string]$PythonPath = $env:QH_PYTHON,
    [switch]$NoBrowser,
    [ValidateRange(5, 300)][int]$StartupTimeoutSeconds = 60
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = $PSScriptRoot
$BackendUrl = 'http://127.0.0.1:8000'
$FrontendUrl = 'http://127.0.0.1:5173'
$LogDirectory = Join-Path $ProjectRoot 'logs'
$StartedProcesses = @()

function Get-ListenerIds([int]$Port) {
    # netstat works without the administrative CIM permissions Get-NetTCPConnection may require.
    @(netstat -ano -p tcp | ForEach-Object {
        if ($_ -match '^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$') {
            if ([int]$Matches[1] -eq $Port) { [int]$Matches[2] }
        }
    } | Select-Object -Unique)
}

function Test-Service([string]$Kind) {
    try {
        if ($Kind -eq 'backend') {
            $Health = Invoke-RestMethod "$BackendUrl/api/v1/health" -TimeoutSec 3
            $Schema = Invoke-RestMethod "$BackendUrl/openapi.json" -TimeoutSec 3
            return ($Health.status -eq 'ok' -and $Schema.info.title -eq 'QuantumHealth AI Platform API')
        }
        $Page = Invoke-WebRequest $FrontendUrl -UseBasicParsing -TimeoutSec 3
        $Client = Invoke-WebRequest "$FrontendUrl/@vite/client" -UseBasicParsing -TimeoutSec 3
        return ($Page.StatusCode -eq 200 -and $Page.Content -match 'QuantumHealth' -and $Client.Content -match 'createHotContext')
    } catch { return $false }
}

function Wait-Service([string]$Kind, $Process, [string]$ErrorLog) {
    $Deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
    do {
        if (Test-Service $Kind) { return }
        $Process.Refresh()
        if ($Process.HasExited) { break }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $Deadline)
    if (Test-Path -LiteralPath $ErrorLog) { Get-Content -LiteralPath $ErrorLog -Tail 20 | Write-Host }
    throw "$Kind did not become ready. Inspect $ErrorLog. No success has been assumed."
}

function Find-Python {
    if ($PythonPath) {
        if (-not (Test-Path -LiteralPath $PythonPath -PathType Leaf)) { throw "Python executable not found: $PythonPath" }
        return (Resolve-Path -LiteralPath $PythonPath).Path
    }
    foreach ($Relative in @('backend/.venv/Scripts/python.exe', 'backend/venv/Scripts/python.exe', '.venv/Scripts/python.exe')) {
        $Candidate = Join-Path $ProjectRoot $Relative
        if (Test-Path -LiteralPath $Candidate) { return $Candidate }
    }
    $Command = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($Command -and $Command.Source -notmatch 'WindowsApps') { return $Command.Source }
    # Python Install Manager uses per-user pythoncore directories rather than a venv.
    foreach ($Installation in @(Get-ChildItem (Join-Path $env:LOCALAPPDATA 'Python') -Directory -Filter 'pythoncore-*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending)) {
        $Candidate = Join-Path $Installation.FullName 'python.exe'
        if (Test-Path -LiteralPath $Candidate) { return $Candidate }
    }
    foreach ($Root in @('HKCU:\Software\Python\PythonCore', 'HKLM:\Software\Python\PythonCore')) {
        foreach ($VersionKey in @(Get-ChildItem $Root -ErrorAction SilentlyContinue)) {
            $InstallKey = Get-Item "$($VersionKey.PSPath)\InstallPath" -ErrorAction SilentlyContinue
            if ($InstallKey) {
                $Candidate = Join-Path $InstallKey.GetValue('') 'python.exe'
                if (Test-Path -LiteralPath $Candidate) { return $Candidate }
            }
        }
    }
    throw 'No usable Python found. Create backend/.venv or pass -PythonPath C:\path\to\python.exe. Install requirements with that interpreter: python -m pip install -r backend/requirements.txt'
}

try {
    New-Item -ItemType Directory -Force -Path $LogDirectory | Out-Null
    $BackendOwners = @(Get-ListenerIds 8000)
    if ($BackendOwners.Count) {
        if (-not (Test-Service 'backend')) { throw "Port 8000 is occupied by PID(s) $BackendOwners, but the QuantumHealth backend is not ready. Inspect that process; it will not be stopped automatically." }
        Write-Host "Reusing QuantumHealth backend on port 8000 (PID(s): $BackendOwners)."
        foreach ($Owner in $BackendOwners) {
            $Executable = (Get-Process -Id $Owner -ErrorAction SilentlyContinue).Path
            if ($Executable) { Write-Host "Backend executable: $Executable" }
        }
    } else {
        $Python = Find-Python
        Write-Host "Backend interpreter: $Python"
        & $Python -c 'import fastapi, uvicorn, sqlalchemy, aiosqlite, pydantic_settings, sklearn, numpy, pandas, pennylane, scipy, joblib, multipart, firebase_admin, google.genai, xgboost'
        if ($LASTEXITCODE -ne 0) { throw "Backend dependencies are unavailable. Run: & '$Python' -m pip install -r '$ProjectRoot\backend\requirements.txt'" }
        $SavedAutoTrain = $env:AUTO_TRAIN_MISSING_MODELS
        try {
            $env:AUTO_TRAIN_MISSING_MODELS = 'false'
            $BackendErrorLog = Join-Path $LogDirectory 'backend-error.log'
            $Backend = Start-Process -FilePath $Python -ArgumentList @('-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000') -WorkingDirectory (Join-Path $ProjectRoot 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $LogDirectory 'backend.log') -RedirectStandardError $BackendErrorLog
            $StartedProcesses += $Backend
        } finally { $env:AUTO_TRAIN_MISSING_MODELS = $SavedAutoTrain }
        Wait-Service 'backend' $Backend $BackendErrorLog
    }

    $FrontendOwners = @(Get-ListenerIds 5173)
    if ($FrontendOwners.Count) {
        if (-not (Test-Service 'frontend')) { throw "Port 5173 is occupied by PID(s) $FrontendOwners, but the QuantumHealth Vite frontend is not ready. It will not be stopped automatically." }
        Write-Host "Reusing frontend on port 5173 (PID(s): $FrontendOwners)."
    } else {
        $Node = (Get-Command node.exe -ErrorAction Stop).Source
        & $Node -e 'const [M,m]=process.versions.node.split(String.fromCharCode(46)).map(Number); process.exit((M===20&&m>=19)||(M===22&&m>=12)||M>=24 ? 0 : 1)'
        if ($LASTEXITCODE -ne 0) { throw 'The Node.js version is unsupported.' }
        $Vite = Join-Path $ProjectRoot 'frontend/node_modules/vite/bin/vite.js'
        if (-not (Test-Path -LiteralPath $Vite)) { throw 'Frontend dependencies missing. Run npm ci from the frontend folder.' }
        $FrontendErrorLog = Join-Path $LogDirectory 'frontend-error.log'
        $Frontend = Start-Process -FilePath $Node -ArgumentList @(('"' + $Vite + '"'), '--configLoader', 'runner', '--host', '127.0.0.1', '--port', '5173', '--strictPort') -WorkingDirectory (Join-Path $ProjectRoot 'frontend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $LogDirectory 'frontend.log') -RedirectStandardError $FrontendErrorLog
        $StartedProcesses += $Frontend
        Wait-Service 'frontend' $Frontend $FrontendErrorLog
    }

    $ProxiedHealth = Invoke-RestMethod "$FrontendUrl/api/v1/health" -TimeoutSec 5
    $Diseases = Invoke-RestMethod "$FrontendUrl/api/v1/diseases" -TimeoutSec 10
    if ($ProxiedHealth.status -ne 'ok' -or @($Diseases.diseases).Count -eq 0) { throw 'Vite proxy returned invalid health or disease data.' }
    Write-Host "Frontend and API proxy verified: $FrontendUrl" -ForegroundColor Green
    Write-Host "API documentation: $BackendUrl/docs"
    Write-Host "Logs: $LogDirectory"
    Write-Host 'Model predictions are separate from service readiness. No training was requested.'
    if (-not $NoBrowser) { Start-Process $FrontendUrl }
} catch {
    # Only clean up processes started by this invocation, never existing services.
    foreach ($Process in $StartedProcesses) {
        if (-not $Process.HasExited) { Stop-Process -Id $Process.Id -ErrorAction SilentlyContinue }
    }
    Write-Error $_
    exit 1
}
