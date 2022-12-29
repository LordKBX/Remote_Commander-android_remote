@echo off
set /p appdir=<%~dp0\..\appdir.txt
cd /D %~dp0\..\..\%appdir%
%AppData%\npm\cordova prepare android && %AppData%\npm\cordova run android
pause