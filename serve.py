"""Serve the pre-built frontend SPA with Python's built-in HTTP server."""
import http.server
import os
from pathlib import Path

DIST = Path(__file__).parent / "frontend" / "dist"
PORT = 5173

MIME = {
    '.html': 'text/html',
    '.js':   'application/javascript',
    '.mjs':  'application/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.ico':  'image/x-icon',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
}


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def do_GET(self):
        # Strip query string
        url_path = self.path.split('?')[0]
        file_path = DIST / url_path.lstrip('/')
        if not file_path.is_file():
            file_path = DIST / 'index.html'
            self.path = '/index.html'
        super().do_GET()

    def guess_type(self, path):
        ext = os.path.splitext(str(path))[1].lower()
        return MIME.get(ext, 'application/octet-stream'), None

    def log_message(self, fmt, *args):
        pass


print(f"Frontend: http://localhost:{PORT}")
print("Press Ctrl+C to stop.\n")
http.server.HTTPServer(("", PORT), SPAHandler).serve_forever()
