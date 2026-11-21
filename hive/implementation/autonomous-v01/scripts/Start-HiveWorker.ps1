param(
    [string]$Store = '.hive',
    [string]$Config = 'configs/local.json',
    [string]$Python = 'python'
)
$ErrorActionPreference = 'Stop'
$hiveRepo = Split-Path -Parent $PSScriptRoot
$hiveStorePath = [System.IO.Path]::GetFullPath((Join-Path $hiveRepo $Store))
$hiveConfigPath = [System.IO.Path]::GetFullPath((Join-Path $hiveRepo $Config))
New-Item -ItemType Directory -Force -Path $hiveStorePath | Out-Null
$env:PYTHONPATH = Join-Path $hiveRepo 'src'
$hiveArguments = @('-m', 'hive', '--store', ('"' + $hiveStorePath + '"'), 'loop', '--config', ('"' + $hiveConfigPath + '"'))
$hiveProcess = Start-Process -FilePath $Python -ArgumentList $hiveArguments -WorkingDirectory $hiveRepo -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $hiveStorePath 'worker.stdout.log') -RedirectStandardError (Join-Path $hiveStorePath 'worker.stderr.log')
Write-Output "HIVE worker PID $($hiveProcess.Id), store $hiveStorePath. It stops at the configured limit, kill switch, or empty queue."
