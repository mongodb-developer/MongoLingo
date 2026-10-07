"""Local dev server for MongoLingo that disables browser caching.

`python3 -m http.server` sends no Cache-Control header, so browsers
heuristically cache the in-browser-compiled .jsx files and can mix fresh and
stale files after an edit. This serves the project root with `no-store`.

Usage (from the project root):  python3 scripts/dev-server.py [port]
"""
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    handler = lambda *a, **kw: NoCacheHandler(*a, directory=root, **kw)
    print(f"MongoLingo dev server (no-cache) on http://localhost:{port}")
    http.server.ThreadingHTTPServer(("", port), handler).serve_forever()
