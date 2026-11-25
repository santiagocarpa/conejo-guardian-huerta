"""
El Conejo Guardián de la Huerta - Lanzador de Escritorio Autónomo
Ejecuta el juego localmente en una ventana de aplicación sin barras de navegación,
100% portable y sin necesidad de conexión a internet.
"""

import sys
import os
import time
import socket
import shutil
import tempfile
import threading
import subprocess
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Variables de control del ciclo de vida
last_activity_time = time.time()
has_client_connected = False
should_shutdown = False

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
    """Manejador HTTP silencioso con soporte de heartbeat para mantener el servidor vivo."""

    extensions_map = SimpleHTTPRequestHandler.extensions_map.copy()
    extensions_map.update({
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.ico': 'image/x-icon',
        '.json': 'application/json',
    })

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=get_base_dir(), **kwargs)

    def log_message(self, format, *args):
        # Silenciar logs para ejecución limpia
        pass

    def do_GET(self):
        global last_activity_time, has_client_connected
        last_activity_time = time.time()
        has_client_connected = True

        if self.path == '/api/ping':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(b'pong')
            return

        super().do_GET()

    def do_POST(self):
        global last_activity_time, has_client_connected, should_shutdown
        last_activity_time = time.time()
        has_client_connected = True

        if self.path in ('/api/ping', '/api/heartbeat'):
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(b'pong')
            return

        if self.path == '/api/shutdown':
            should_shutdown = True
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(b'bye')
            return

        self.send_error(404, "Not Found")

def run_server(server):
    try:
        server.serve_forever()
    except Exception:
        pass

def find_browser_app_executable():
    """Busca ejecutables comunes de navegadores modernos para modo aplicación (--app)."""
    candidates = [
        # Microsoft Edge (incluido por defecto en Windows 10 y 11)
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
    global should_shutdown, has_client_connected, last_activity_time
    base_dir = get_base_dir()
    os.chdir(base_dir)

    port = find_free_port()
    server = ThreadingHTTPServer(('127.0.0.1', port), QuietHandler)
    server_thread = threading.Thread(target=run_server, args=(server,), daemon=True)
    server_thread.start()

    url = f"http://127.0.0.1:{port}/index.html"
    app_exe = find_browser_app_executable()
    temp_profile_dir = None
    browser_process = None

    if app_exe:
        # Perfil aislado para evitar conflictos con Edge/Chrome ya abiertos en segundo plano
        temp_profile_dir = os.path.join(tempfile.gettempdir(), f"conejo_app_profile_{port}")
        cmd = [
            app_exe,
            f"--app={url}",
            f"--user-data-dir={temp_profile_dir}",
            "--window-size=1280,760",
            "--window-position=100,60",
            "--no-first-run",
            "--no-default-browser-check"
        ]
        try:
            browser_process = subprocess.Popen(cmd)
        except Exception:
            webbrowser.open(url)
    else:
        webbrowser.open(url)

    # El servidor se mantiene vivo mientras el juego esté activo en pantalla.
    # El juego envía un /api/ping cada 2 segundos.
    # Si la ventana se cierra, se envía /api/shutdown o se detienen los pings.
    start_time = time.time()
    last_activity_time = time.time()

    try:
        while not should_shutdown:
            time.sleep(1)
            now = time.time()

            # Si el proceso del navegador terminó y ya se había conectado
            if browser_process and browser_process.poll() is not None:
                if has_client_connected and (now - last_activity_time > 4):
                    break

            if not has_client_connected:
                # Dar hasta 45 segundos para la apertura inicial del navegador
                if now - start_time > 45:
                    break
            else:
                # Una vez conectado, si pasan más de 8 segundos sin actividad, salir
                if now - last_activity_time > 8:
                    break
    except KeyboardInterrupt:
        pass

    try:
        server.shutdown()
    except Exception:
        pass

    # Limpiar perfil temporal si se creó
    if temp_profile_dir and os.path.exists(temp_profile_dir):
        try:
            shutil.rmtree(temp_profile_dir, ignore_errors=True)
        except Exception:
            pass

if __name__ == "__main__":
    main()
