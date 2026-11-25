"""
El Conejo Guardián de la Huerta - Lanzador de Escritorio Autónomo
Ejecuta el juego localmente en una ventana de aplicación sin barras de navegación,
100% portable y sin necesidad de conexión a internet.
"""

import sys
import os
import time
import socket
import threading
import subprocess
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

def get_base_dir():
    """Obtiene el directorio base, compatible con PyInstaller (_MEIPASS) o ejecución directa."""
    if getattr(sys, 'frozen', False):
        return getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    return os.path.dirname(os.path.abspath(__file__))

def find_free_port():
    """Encuentra un puerto libre en el sistema."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

class QuietHandler(SimpleHTTPRequestHandler):
    """Manejador HTTP silencioso que no ensucia la consola y define MIME types correctos."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=get_base_dir(), **kwargs)

    def log_message(self, format, *args):
        # Silenciar logs para ejecución limpia
        pass

def run_server(server):
    try:
        server.serve_forever()
    except Exception:
        pass

def find_browser_app_executable():
    """Busca ejecutables comunes de navegadores modernos para modo aplicación (--app)."""
    candidates = [
        # Microsoft Edge (incluido en todo Windows 10 y 11)
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe"),
        # Google Chrome
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            return path
    return None

def main():
    base_dir = get_base_dir()
    os.chdir(base_dir)

    port = find_free_port()
    server = ThreadingHTTPServer(('127.0.0.1', port), QuietHandler)
    server_thread = threading.Thread(target=run_server, args=(server,), daemon=True)
    server_thread.start()

    url = f"http://127.0.0.1:{port}/index.html"
    app_exe = find_browser_app_executable()

    if app_exe:
        # Abre en una ventana limpia de escritorio (sin barra de direcciones ni pestañas)
        # con resolución HD óptima (1280x760)
        cmd = [
            app_exe,
            f"--app={url}",
            "--window-size=1280,760",
            "--window-position=100,60"
        ]
        try:
            process = subprocess.Popen(cmd)
            process.wait()
        except Exception:
            webbrowser.open(url)
            time.sleep(2)
    else:
        webbrowser.open(url)
        # Mantener servidor activo mientras el usuario juega
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

    server.shutdown()

if __name__ == "__main__":
    main()
