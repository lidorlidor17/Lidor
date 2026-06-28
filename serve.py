"""Serve the pre-built frontend SPA with Python's built-in HTTP server."""
import http.server
import mimetypes
import os

# Fix Windows registry missing/wrong MIME types
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('image/svg+xml', '.svg')

DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")
PORT = 5173


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = "/index.html"
        super().do_GET()

    def log_message(self, fmt, *args):
        pass


print(f"Frontend: http://localhost:{PORT}")
print("Press Ctrl+C to stop.\n")
http.server.HTTPServer(("", PORT), SPAHandler).serve_forever()
