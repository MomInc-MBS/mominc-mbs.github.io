$ErrorActionPreference = 'Stop'
$project = 'D:/Repos/hive-ai'
$runtime = Join-Path $project 'build/prototype-v04/runtime-recovery'
$out = Join-Path $project 'build/prototype-v04/public/final-verification'
$work = Join-Path $project '.hive/prototype-v04-recovery-final-objective'
if (!(Test-Path (Join-Path $runtime 'src/hive/__init__.py'))) { throw 'Frozen runtime extraction missing' }
if (Test-Path $work) { throw 'Final objective work directory must be fresh' }
if (!(Test-Path (Join-Path $runtime 'node_modules'))) { New-Item -ItemType Junction -Path (Join-Path $runtime 'node_modules') -Target (Join-Path $project 'node_modules') | Out-Null }
Push-Location $runtime
try {
 $env:PYTHONPATH = Join-Path $runtime 'src'
 $env:GIT_CEILING_DIRECTORIES = Split-Path $runtime
 cmd /c "python -u -m pytest -q -r s --junitxml=`"$out/pytest.xml`" > `"$out/pytest.log`" 2>&1"
 $pytestExit = $LASTEXITCODE; Set-Content -Encoding ASCII "$out/pytest.exit" $pytestExit
 cmd /c "npx --no-install e2e run --workers 1 --retries 0 --output final-e2e > `"$out/e2e.log`" 2>&1"
 $e2eExit = $LASTEXITCODE; Set-Content -Encoding ASCII "$out/e2e.exit" $e2eExit
 if (Test-Path 'final-e2e/report.json') { Copy-Item 'final-e2e/report.json' "$out/e2e-report.json" }
 cmd /c "python -u scripts/objective_smoke.py --work `"$work`" > `"$out/objective.log`" 2>&1"
 $objectiveExit = $LASTEXITCODE; Set-Content -Encoding ASCII "$out/objective.exit" $objectiveExit
 if (Test-Path "$work/report.json") { Copy-Item "$work/report.json" "$out/objective-report.json" }
 cmd /c "python -u scripts/objective_smoke.py --work `"$work`" --replay > `"$out/replay.json`" 2> `"$out/replay.stderr`""
 $replayExit = $LASTEXITCODE; Set-Content -Encoding ASCII "$out/replay.exit" $replayExit
 cmd /c "python -u scripts/objective_smoke.py --work `"$work`" --replay-data > `"$out/replay-data.json`" 2> `"$out/replay-data.stderr`""
 $dataExit = $LASTEXITCODE; Set-Content -Encoding ASCII "$out/replay-data.exit" $dataExit
 Write-Output "pytest=$pytestExit e2e=$e2eExit objective=$objectiveExit replay=$replayExit replay_data=$dataExit"
} finally { Pop-Location }


