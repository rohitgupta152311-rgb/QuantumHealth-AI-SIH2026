@echo off
setlocal
powershell.exe -NoProfile -File "%~dp0run_all.ps1" %*
set "QH_EXIT_CODE=%ERRORLEVEL%"
if not "%QH_EXIT_CODE%"=="0" (
    echo QuantumHealth startup failed. Review the error above.
    pause
)
exit /b %QH_EXIT_CODE%
