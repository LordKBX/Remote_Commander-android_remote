REM @echo off
cd /D %~dp0
set /p appdir=<..\appdir.txt
cd /D %~dp0\..\..\%appdir%
set ip_address_string="Adresse IPv4"
for /f "usebackq tokens=2 delims=:" %%f in (`ipconfig ^| findstr /c:%ip_address_string%`) do (
    echo Your IP Address is: %%f
	echo debug:%%f
	echo debug:%%f > .\www\mode.txt
)