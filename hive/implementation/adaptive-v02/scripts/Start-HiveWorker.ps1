param(
    [string]$Store = '.hive',
    [string]$Config = 'configs/local.json',
    [string]$Python = 'python',
    [ValidateSet('loop', 'adaptive')][string]$Mode = 'loop',
    [ValidateRange(1, 3)][int]$Rounds = 3,
    [int]$Seed = 20261121
)
$ErrorActionPreference = 'Stop'
$hiveRepo = Split-Path -Parent $PSScriptRoot
$hiveStorePath = [System.IO.Path]::GetFullPath((Join-Path $hiveRepo $Store))
$hiveConfigPath = [System.IO.Path]::GetFullPath((Join-Path $hiveRepo $Config))
New-Item -ItemType Directory -Force -Path $hiveStorePath | Out-Null
$env:PYTHONPATH = Join-Path $hiveRepo 'src'
$hiveArguments = @('-m', 'hive', '--store', ('"' + $hiveStorePath + '"'), $Mode, '--config', ('"' + $hiveConfigPath + '"'))
if ($Mode -eq 'adaptive') {
    $hiveArguments += @('--rounds', $Rounds, '--seed', $Seed)
}
$hiveProcess = Start-Process -FilePath $Python -ArgumentList $hiveArguments -WorkingDirectory $hiveRepo -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $hiveStorePath 'worker.stdout.log') -RedirectStandardError (Join-Path $hiveStorePath 'worker.stderr.log')
Write-Output "HIVE worker PID $($hiveProcess.Id), store $hiveStorePath. It stops at the configured limit, kill switch, or empty queue."
