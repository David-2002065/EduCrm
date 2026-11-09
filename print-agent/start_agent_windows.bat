@echo off
rem EduCRM chek agenti — Windows'da oynasiz ishga tushirish.
rem Kompyuter yonganda o'zi ishlashi uchun: Win+R -> shell:startup -> shu faylning yorlig'ini tashlang.
cd /d "%~dp0"
start "" pythonw edu_print_agent.py
