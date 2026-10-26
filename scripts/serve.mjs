import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('out');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
const port = Number(process.env.PORT || 3000);
createServer(async (req,res) => {
 try {
  let pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file = resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try { if ((await stat(file)).isDirectory()) file=resolve(file,'index.html'); }
  catch { if(!extname(file)) file += '.html'; }
  const body = await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)] || 'application/octet-stream','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:body);
 } catch {
  res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
  res.end(await readFile(resolve(root,'404.html')).catch(()=>Buffer.from('Not found')));
 }
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://localhost:${port}`));
