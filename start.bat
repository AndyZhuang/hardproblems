@echo off
chcp 65001 > nul
title HardProblems.World

echo.
echo  ╔════════════════════════════════════════════╗
echo  ║   HardProblems.World - 一键启动              ║
echo  ╚════════════════════════════════════════════╝
echo.

:: 检查 Node.js
where node >nul 2>&1
if errorlevel 1 (
  echo  [错误] 未检测到 Node.js，请先安装 Node 18+
  echo  下载: https://nodejs.org/
  pause
  exit /b 1
)

:: 启动后端（在新窗口）
echo  [1/2] 启动后端 (http://localhost:4000)...
start "HardProblems Server" /min cmd /c "cd /d %~dp0server && node src/index.js"

:: 等待后端就绪
timeout /t 3 /nobreak >nul

:: 启动前端（在新窗口）
echo  [2/2] 启动前端 (http://localhost:5173)...
start "HardProblems Client" /min cmd /c "cd /d %~dp0client && npx vite --port 5173"

:: 等待前端就绪
timeout /t 5 /nobreak >nul

echo.
echo  ✅ 启动完成！
echo.
echo  🌐 浏览器打开: http://localhost:5173
echo  📡 API 地址:    http://localhost:4000/api
echo.
echo  💡 关闭服务：在任务栏找到 "HardProblems Server" 和 "HardProblems Client" 窗口，关闭即可
echo.
pause
