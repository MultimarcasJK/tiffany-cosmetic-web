@echo off
title Tiffany Cosmetic - Servidor Local
echo ======================================================
echo    Iniciando Servidor Web de Tiffany Cosmetic...
echo ======================================================
echo.
echo Abriendo tu tienda en el navegador...
start http://localhost:3000
echo Servidor activo en http://localhost:3000
echo Panel de admin en http://localhost:3000/admin
echo.
echo Presiona Ctrl+C si deseas detener el servidor.
echo.
python -m http.server 3000
pause
