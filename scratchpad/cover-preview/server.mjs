import http from 'node:http';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const routes = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/cover.html': ['cover.html', 'text/html; charset=utf-8'],
  '/cover.css': ['cover.css', 'text/css; charset=utf-8'],
  '/Cultivation-Card-Game/头像.png': ['../../../Cultivation-Card-Game/头像.png', 'image/png'],
};
http.createServer((req,res)=>{
  const route=routes[decodeURIComponent(new URL(req.url,'http://localhost').pathname)];
  if(!route){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':route[1],'Cache-Control':'no-store'});
  fs.createReadStream(fileURLToPath(new URL(route[0],import.meta.url))).pipe(res);
}).listen(18746,'127.0.0.1',()=>console.log('Cover preview: http://127.0.0.1:18746'));
