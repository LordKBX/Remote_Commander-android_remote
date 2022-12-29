@echo off
cd /D %~dp0
set /p appdir=<..\appdir.txt
cd /D %~dp0\..\..\%appdir%

echo debug:%%f > .\www\mode.txt
%AppData%\npm\cordova prepare android && %AppData%\npm\cordova emulate android