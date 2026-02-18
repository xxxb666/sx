import http.server
import socketserver
import sys

PORT = 8088

Handler = http.server.SimpleHTTPRequestHandler

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        sys.stdout.flush()
        httpd.serve_forever()
except Exception as e:
    print(f"Error: {e}")
    sys.stdout.flush()
