#!/usr/bin/env python3
"""
Mini-proxy per Ollama Cloud.
Forwarda le richieste del browser a Ollama Cloud, aggirando i limiti CORS.
Uso: python3 ollama_proxy.py
Il browser chiamera': http://IP-MAC:8777/api/chat
"""
import http.server
import urllib.request
import json
import sys
import os

PORT = int(os.environ.get("OLLAMA_PROXY_PORT", "8777"))
OLLAMA_URL = os.environ.get("OLLAMA_CLOUD_URL", "https://ollama.com")
BIND = os.environ.get("OLLAMA_PROXY_BIND", "0.0.0.0")


class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        target_url = OLLAMA_URL + self.path
        req = urllib.request.Request(target_url, data=body, method="POST")

        for key, val in self.headers.items():
            if key.lower() in ("host", "content-length", "origin", "referer"):
                continue
            req.add_header(key, val)

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                resp_body = resp.read()
                self.send_response(resp.status)
                for key, val in resp.getheaders():
                    if key.lower() in ("transfer-encoding", "connection", "content-encoding"):
                        continue
                    self.send_header(key, val)
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(resp_body)
        except urllib.error.HTTPError as e:
            resp_body = e.read()
            self.send_response(e.code)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(resp_body)
        except Exception as e:
            self.send_response(502)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_GET(self):
        target_url = OLLAMA_URL + self.path
        req = urllib.request.Request(target_url, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_body = resp.read()
                self.send_response(resp.status)
                for key, val in resp.getheaders():
                    if key.lower() in ("transfer-encoding", "connection", "content-encoding"):
                        continue
                    self.send_header(key, val)
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(resp_body)
        except Exception as e:
            self.send_response(502)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def log_message(self, fmt, *args):
        print(f"[{self.client_address[0]}] {fmt % args}", file=sys.stderr)


def main():
    print(f"""
🦙 Ollama Cloud Proxy
   Listening:  http://{BIND}:{PORT}
   Forwarding: {OLLAMA_URL}
   Ctrl+C to stop
""")
    server = http.server.HTTPServer((BIND, PORT), ProxyHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        sys.exit(0)


if __name__ == "__main__":
    main()