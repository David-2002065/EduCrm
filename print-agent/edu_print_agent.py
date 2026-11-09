"""EduCRM chek printeri agenti.

Kassa kompyuterida fonda ishlaydi va brauzerdagi EduCRM'dan kelgan chekni
printerga TO'G'RIDAN-TO'G'RI (print oynasisiz) yuboradi — ESC/POS buyruqlari bilan:
qog'oz kontent tugagan joyda kesiladi, A4 printerlarga ta'sir qilmaydi.

Ishga tushirish:   python edu_print_agent.py
Windows uchun:     pip install pywin32   (bir marta)
Port:              17777  (o'zgartirish: EDU_PRINT_PORT=18000)

Printer turlari:
  - Kompyuterga ulangan (USB) printer — nomi bilan, masalan "XP-80C"
  - Tarmoq printeri — "tcp://192.168.1.50:9100"
"""
import json
import os
import platform
import socket
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSION = "1.0"
PORT = int(os.getenv("EDU_PRINT_PORT", "17777"))
IS_WINDOWS = platform.system() == "Windows"

ESC, GS = b"\x1b", b"\x1d"

# Kassa printerlari o'zbek apostroflarini bilmaydi — oddiy belgilarga almashtiramiz
TRANSLATE = str.maketrans({
    "ʻ": "'", "ʼ": "'", "‘": "'", "’": "'", "“": '"', "”": '"', "«": '"', "»": '"',
    "—": "-", "–": "-", "№": "No",
})


# ---------- Printerlar ro'yxati ----------
def list_printers():
    if IS_WINDOWS:
        import win32print
        flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
        return [p[2] for p in win32print.EnumPrinters(flags)]
    try:
        out = subprocess.run(["lpstat", "-a"], capture_output=True, text=True, timeout=5).stdout
        return [line.split()[0] for line in out.splitlines() if line.strip()]
    except Exception:
        return []


def default_printer():
    if IS_WINDOWS:
        import win32print
        return win32print.GetDefaultPrinter()
    try:
        out = subprocess.run(["lpstat", "-d"], capture_output=True, text=True, timeout=5).stdout
        return out.split(":", 1)[1].strip() if ":" in out else ""
    except Exception:
        return ""


# ---------- ESC/POS ----------
def build_escpos(lines, cut=True):
    """lines: [{text, align: left|center|right, bold: bool, size: normal|double}] -> printer baytlari."""
    out = bytearray(ESC + b"@")          # printerni boshlang'ich holatga keltirish
    out += ESC + b"t\x00"                # kodlar jadvali: PC437
    for line in lines:
        align = {"left": 0, "center": 1, "right": 2}.get(line.get("align"), 0)
        size = 0x11 if line.get("size") == "double" else 0x00
        out += ESC + b"a" + bytes([align])
        out += ESC + b"E" + bytes([1 if line.get("bold") else 0])
        out += GS + b"!" + bytes([size])
        out += str(line.get("text", "")).translate(TRANSLATE).encode("cp437", "replace") + b"\n"
    out += ESC + b"E\x00" + GS + b"!\x00" + ESC + b"a\x00"
    out += b"\n" * 4                     # kesgichgacha bo'sh joy
    if cut:
        out += GS + b"V\x42\x00"         # qog'ozni kesish
    return bytes(out)


def send_raw(printer, data):
    if printer.startswith("tcp://"):
        host, _, port = printer[6:].partition(":")
        with socket.create_connection((host, int(port or 9100)), timeout=5) as conn:
            conn.sendall(data)
        return
    if IS_WINDOWS:
        import win32print
        handle = win32print.OpenPrinter(printer)
        try:
            win32print.StartDocPrinter(handle, 1, ("EduCRM chek", None, "RAW"))
            win32print.StartPagePrinter(handle)
            win32print.WritePrinter(handle, data)
            win32print.EndPagePrinter(handle)
            win32print.EndDocPrinter(handle)
        finally:
            win32print.ClosePrinter(handle)
        return
    # macOS / Linux (CUPS)
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(data)
        path = f.name
    try:
        result = subprocess.run(["lp", "-d", printer, "-o", "raw", path], capture_output=True, text=True, timeout=15)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or "Printerga yuborib bo'lmadi")
    finally:
        os.unlink(path)


# ---------- HTTP ----------
class Handler(BaseHTTPRequestHandler):
    def _send(self, code, payload=None):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        # Brauzerdagi EduCRM sahifasi shu agentga murojaat qila olishi uchun
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.end_headers()
        if payload is not None:
            self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def do_OPTIONS(self):
        self._send(204)

    def do_GET(self):
        if self.path.startswith("/health"):
            return self._send(200, {"ok": True, "version": VERSION, "printers": list_printers(), "default": default_printer()})
        self._send(404, {"ok": False, "error": "Topilmadi"})

    def do_POST(self):
        if not self.path.startswith("/print"):
            return self._send(404, {"ok": False, "error": "Topilmadi"})
        try:
            length = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(length) or b"{}")
            printer = body.get("printer") or default_printer()
            if not printer:
                raise RuntimeError("Printer tanlanmagan")
            send_raw(printer, build_escpos(body.get("lines", []), body.get("cut", True)))
            self._send(200, {"ok": True, "printer": printer})
        except Exception as e:  # xatoni brauzerga qaytaramiz — kassir ko'radi
            self._send(500, {"ok": False, "error": str(e)})

    def log_message(self, fmt, *args):
        pass  # konsolni toza saqlaymiz


if __name__ == "__main__":
    # Faqat shu kompyuterdan ulanish mumkin (127.0.0.1)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"EduCRM chek agenti ishlayapti: http://127.0.0.1:{PORT}  (to'xtatish: Ctrl+C)")
    print("Printerlar:", ", ".join(list_printers()) or "topilmadi")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
