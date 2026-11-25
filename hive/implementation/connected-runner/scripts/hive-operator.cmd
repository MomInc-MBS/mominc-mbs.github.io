@echo off
rem HIVE Operator Prototype launcher: imports the accepted M2 capabilities (idempotent) and opens the local console.
rem Usage: scripts\hive-operator.cmd <folder with your CSV/JSON inputs> [port]
setlocal
set "HIVE_ROOT=%~dp0.."
if "%~1"=="" (
  echo Usage: scripts\hive-operator.cmd ^<inputs folder^> [port]
  exit /b 2
)
set "PORT=%~2"
if "%PORT%"=="" set "PORT=8765"
set "PYTHONPATH=%HIVE_ROOT%\src"
python -m hive --store "%HIVE_ROOT%\.hive\operator" operator launch --allowed-root "%~1" --port %PORT%
