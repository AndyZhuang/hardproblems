@echo off
chcp 65001 > nul
title HardProblems.World - 停止

echo  正在停止 HardProblems 服务...

:: 用 taskkill 杀进程
taskkill /FI "WINDOWTITLE eq HardProblems Server*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq HardProblems Client*" /T /F >nul 2>&1

:: 兜底
taskkill /IM node.exe /FI "MEMUSAGE gt 50000" /F >nul 2>&1

echo  ✅ 已停止
timeout /t 2 /nobreak >nul
