# Stop all dotnet processes running HRM.Api
Write-Host "Stopping backend..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "dotnet" -and $_.Path -like "*HRM.Api*"} | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 2

# Start backend again
Write-Host "Starting backend..." -ForegroundColor Green
Set-Location "d:\sinhviennam4\PTUDHTTTHD\Project\Human-Management\backend\HRM.Api"
dotnet run
