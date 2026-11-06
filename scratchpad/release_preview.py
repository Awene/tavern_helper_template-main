from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
class Handler(SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Access-Control-Allow-Origin','http://localhost:8000')
  super().end_headers()
ThreadingHTTPServer(('127.0.0.1',8767),partial(Handler,directory='../Cultivation-Card-Game/发布文件/Ver.1.2')).serve_forever()
