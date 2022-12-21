@echo off
set /p appdir=<..\appdir.txt
cd /D %~dp0\..\..\%appdir%
set ip_address_string="Adresse IPv4"
for /f "usebackq tokens=2 delims=:" %%f in (`ipconfig ^| findstr /c:%ip_address_string%`) do (
    echo Your IP Address is: %%f
	echo debug:%%f
	echo debug:%%f > .\www\mode.txt
	START /B node "..\services\livews.js"
	%AppData%\npm\cordova prepare android && %AppData%\npm\cordova run android
	pause
    goto :eof
)