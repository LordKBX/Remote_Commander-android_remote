REM @echo off
cd /D %~dp0
set /p appdir=<..\appdir.txt
cd /D %~dp0\..\..\%appdir%
echo "release" > .\www\mode.txt
%AppData%\npm\cordova emulate android
pause