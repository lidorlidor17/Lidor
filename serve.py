"""Serve the pre-built frontend SPA with Python's built-in HTTP server."""
import http.server
import os
import sys

DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")
PORT = 5173


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def do_GET(self):
        # If path has no extension (SPA route), serve index.html
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            self.path = "/index.html"
        super().do_GET()

    def log_message(self, fmt, *args):
        pass  # silence request logs


print(f"Frontend: http://localhost:{PORT}")
print("Press Ctrl+C to stop.\n")
http.server.HTTPServer(("", PORT), SPAHandler).serve_forever()
