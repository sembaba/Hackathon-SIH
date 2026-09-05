@echo off
TITLE VERTI-CAD - 3D ULPIN & Vertical Property Mapping System
echo ========================================================
echo  VERTI-CAD: Starting Local Development Environment
echo  "One Property. Every Dimension. One Unique Identity."
echo ========================================================

SET "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;C:\Program Files\nodejs;%PATH%"

echo [1/3] Applying Database Migrations & Seeding Demo Cadastre...
cd backend
python manage.py migrate
python manage.py seed_demo
cd ..

echo [2/3] Starting Django REST Backend on http://127.0.0.1:8000 ...
start "VERTI-CAD Backend" cmd /k "SET PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH% && cd backend && python manage.py runserver"

echo [3/3] Starting Vite React Frontend on http://localhost:5173 ...
start "VERTI-CAD Frontend" cmd /k "SET PATH=C:\Program Files\nodejs;%PATH% && cd frontend && npm run dev"

timeout /t 3 >nul
start http://localhost:5173

echo ========================================================
echo  VERTI-CAD is running!
echo  Frontend: http://localhost:5173
echo  Backend API: http://127.0.0.1:8000/api/
echo  Swagger UI: http://127.0.0.1:8000/api/docs/
echo ========================================================
pause
