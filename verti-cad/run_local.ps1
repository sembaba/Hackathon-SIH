# VERTI-CAD Local Startup Script (PowerShell)
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " VERTI-CAD: 3D ULPIN & Vertical Property Mapping System" -ForegroundColor Cyan
Write-Host " 'One Property. Every Dimension. One Unique Identity.'" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$env:PATH = "$env:LOCALAPPDATA\Programs\Python\Python311;$env:LOCALAPPDATA\Programs\Python\Python311\Scripts;C:\Program Files\nodejs;" + $env:PATH

Write-Host "`n[1/3] Checking Database and Seeding Demo Records..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\backend"
python manage.py migrate
python manage.py seed_demo

Write-Host "`n[2/3] Starting Django REST Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = '$env:LOCALAPPDATA\Programs\Python\Python311;$env:LOCALAPPDATA\Programs\Python\Python311\Scripts;' + `$env:PATH; cd '$PSScriptRoot\backend'; python manage.py runserver"

Write-Host "`n[3/3] Starting Vite React Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = 'C:\Program Files\nodejs;' + `$env:PATH; cd '$PSScriptRoot\frontend'; npm.cmd run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " VERTI-CAD services launched successfully!" -ForegroundColor Green
Write-Host " Frontend: http://localhost:5173" -ForegroundColor White
Write-Host " Backend API: http://127.0.0.1:8000/api/" -ForegroundColor White
Write-Host " OpenAPI Docs: http://127.0.0.1:8000/api/docs/" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
