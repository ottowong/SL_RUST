@echo off
:loop
python index.py
echo Index.py has closed. Restarting...
timeout /t 1
goto loop