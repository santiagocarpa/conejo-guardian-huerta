@echo off
title El Conejo Guardian de la Huerta
cd /d "%~dp0"

if exist "dist\Conejo_Guardian_Huerta.exe" (
    start "" "dist\Conejo_Guardian_Huerta.exe"
    exit
)

if exist "launcher.py" (
    start "" python launcher.py
    exit
)

start "" index.html
