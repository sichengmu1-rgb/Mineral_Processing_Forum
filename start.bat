@echo off
setlocal

REM ============================================================
REM  选矿技术论坛 Demo - 一键启动
REM
REM  本文件保存为 GBK 编码。中文 Windows 的 cmd 按 ANSI 代码页
REM  读取 bat，用 UTF-8 存会导致中文被解析错位、整批命令报错。
REM ============================================================

REM 微信开发者工具自带的 Node 16 会排在 PATH 前面，Vite 8 需要 Node 18+
set "PATH=C:\Program Files;%PATH%"

cd /d "%~dp0"

echo ============================================
echo   选矿技术论坛 Demo
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [x] 没找到 node，请先安装 Node 18 或更高版本： https://nodejs.org
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node -v') do set "NODEV=%%v"
echo [ok] Node %NODEV%

where python >nul 2>nul
if errorlevel 1 (
    echo [x] 没找到 python，请先安装 Python 3.10 或更高版本： https://python.org
    pause
    exit /b 1
)

if not exist "backend\.venv\Scripts\python.exe" (
    echo [..] 首次运行，创建 Python 虚拟环境
    python -m venv backend\.venv
    backend\.venv\Scripts\python.exe -m pip install --quiet --upgrade pip
    backend\.venv\Scripts\python.exe -m pip install --quiet -r backend\requirements.txt
    echo [ok] Python 环境就绪
) else (
    echo [ok] Python 环境已就绪
)

if not exist "frontend\node_modules" (
    echo [..] 首次运行，安装前端依赖，可能要几分钟
    pushd frontend
    call npm install
    popd
    echo [ok] 前端依赖就绪
) else (
    echo [ok] 前端依赖已就绪
)

echo.
echo [..] 启动服务
echo.

start "forum-backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe app.py"
timeout /t 3 /nobreak >nul

echo ------------------------------------------------------------
echo   本机访问:  http://localhost:5173
echo.
echo   手机访问（需与电脑连同一个 WiFi）:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do echo       http://%%b:5173
)
echo ------------------------------------------------------------
echo.
echo   手机连不上，多半是 Windows 防火墙拦了入站。
echo   用管理员身份运行下面这行，然后重试:
echo.
echo     netsh advfirewall firewall add rule name="forum-dev" dir=in action=allow protocol=TCP localport=5173,5000
echo.

start "forum-frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo   关闭新开的那两个窗口即可停止服务。
echo.
pause
