# QuantumHealth AI - Launch both Backend and Frontend
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Starting QuantumHealth AI (SIH 2026 - PS #26139)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "
[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\backend'; & '.\venv\Scripts\python.exe' -m uvicorn main:app --host 0.0.0.0 --port 8000"

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5174..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`C:/Users/rohit/.gemini/antigravity/bin;C:\Users\rohit\AppData\Roaming\Antigravity\bin;C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\WINDOWS\System32\OpenSSH\;C:\MinGW\bin;C:\Program Files\dotnet\;C:\Program Files\Siemens\NXStudentEdition2506\CAPITALINTEGRATION\capitalnxremote\;C:\Program Files\nodejs\;C:\ProgramData\chocolatey\bin;C:\Users\rohit\AppData\Local\Programs\Python\Python314\Scripts\;C:\Users\rohit\AppData\Local\Programs\Python\Python314\;C:\Users\rohit\AppData\Local\Microsoft\WindowsApps;C:\Users\rohit\AppData\Local\Programs\Microsoft VS Code\bin;C:\MinGW\bin;C:\Users\rohit\AppData\Local\GitHubDesktop\bin;C:\Users\rohit\AppData\Roaming\npm;C:\Users\rohit\AppData\Local\Programs\Antigravity IDE\bin = 'C:\Program Files\nodejs;' + `C:/Users/rohit/.gemini/antigravity/bin;C:\Users\rohit\AppData\Roaming\Antigravity\bin;C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\WINDOWS\System32\OpenSSH\;C:\MinGW\bin;C:\Program Files\dotnet\;C:\Program Files\Siemens\NXStudentEdition2506\CAPITALINTEGRATION\capitalnxremote\;C:\Program Files\nodejs\;C:\ProgramData\chocolatey\bin;C:\Users\rohit\AppData\Local\Programs\Python\Python314\Scripts\;C:\Users\rohit\AppData\Local\Programs\Python\Python314\;C:\Users\rohit\AppData\Local\Microsoft\WindowsApps;C:\Users\rohit\AppData\Local\Programs\Microsoft VS Code\bin;C:\MinGW\bin;C:\Users\rohit\AppData\Local\GitHubDesktop\bin;C:\Users\rohit\AppData\Roaming\npm;C:\Users\rohit\AppData\Local\Programs\Antigravity IDE\bin; cd '$ProjectRoot\frontend'; npm run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5174"

Write-Host "
✓ System is running!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5174" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000/docs
" -ForegroundColor White
