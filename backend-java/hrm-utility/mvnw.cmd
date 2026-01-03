@echo off
setlocal enabledelayedexpansion
set WRAPPER_DIR=%~dp0.mvn\wrapper
set PROPS=%WRAPPER_DIR%\maven-wrapper.properties
if exist "%PROPS%" (
  for /f "usebackq tokens=1* delims==" %%A in ("%PROPS%") do (
    if /I "%%A"=="distributionUrl" set DIST_URL=%%B
  )
)
if not defined DIST_URL set DIST_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.4/apache-maven-3.9.4-bin.zip
set DIST_DIR=%WRAPPER_DIR%\apache-maven
set MVN_BIN=%DIST_DIR%\bin\mvn.cmd
if not exist "%MVN_BIN%" (
  powershell -Command "New-Item -ItemType Directory -Force -Path '%WRAPPER_DIR%' | Out-Null"
  set TMPZIP=%WRAPPER_DIR%\maven-dist.zip
  powershell -Command "Invoke-WebRequest -Uri '%DIST_URL%' -OutFile '%TMPZIP%'"
  powershell -Command "Expand-Archive -Path '%TMPZIP%' -DestinationPath '%WRAPPER_DIR%' -Force"
  for /f "delims=" %%i in ('dir /b /ad "%WRAPPER_DIR%\apache-maven*" 2^>nul') do (
    move "%WRAPPER_DIR%\%%i" "%DIST_DIR%" >nul 2>&1 || move "%WRAPPER_DIR%\%%i" "%DIST_DIR%" >nul 2>&1
  )
  del /f /q "%TMPZIP%" >nul 2>&1
)
if exist "%DIST_DIR%\bin\mvn.cmd" (
  "%DIST_DIR%\bin\mvn.cmd" %*
) else (
  rem fallback to system mvn
  mvn %*
)
