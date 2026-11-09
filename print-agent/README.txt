EduCRM chek printeri agenti
===========================

Nima uchun kerak?
  Brauzer xavfsizlik sababli printerga to'g'ridan-to'g'ri yubora olmaydi (har safar print oynasi chiqadi).
  Shu kichik dastur kassa kompyuterida fonda ishlaydi va chekni printerga darhol, oynasiz chiqaradi.

O'rnatish (Windows, bir marta):
  1. Python o'rnating: https://www.python.org/downloads/  ("Add Python to PATH" belgisini qo'ying)
  2. Buyruqlar oynasida (cmd):   pip install pywin32
  3. Shu papkani kompyuterga ko'chiring, masalan:  C:\EduCRM\print-agent
  4. start_agent_windows.bat ni ikki marta bosing — agent ishga tushadi
  5. Kompyuter yonganda o'zi ishlashi uchun:
     Win+R -> shell:startup -> start_agent_windows.bat yorlig'ini shu papkaga tashlang

Sozlash:
  EduCRM -> Sozlamalar -> "Chek printeri" sahifasida:
    - Agent holati "Ulangan" bo'lishi kerak
    - Printerni tanlang (masalan XP-80C) va qog'oz enini (80 yoki 58 mm)
    - "Sinov cheki" tugmasi bilan tekshiring

macOS / Linux:
  python3 edu_print_agent.py   (printer CUPS orqali, "lpstat -a" da ko'rinishi kerak)

Tarmoq (Wi-Fi/LAN) printeri:
  Printer tanlash o'rniga  tcp://192.168.1.50:9100  ko'rinishida manzil yoziladi.
