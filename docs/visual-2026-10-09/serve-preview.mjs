import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
const root = process.cwd();
const out = path.join(root,'docs/visual-2026-10-09');
await build({entryPoints:[path.join(out,'preview.tsx')],outfile:path.join(out,'preview.js'),bundle:true,platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},plugins:[{
  name:'local-auth-and-next-adapters',setup(b){
    b.onResolve({filter:/^(next\/image|next\/link|@\/components\/auth\/LogoutButton)$/},args=>({path:args.path,namespace:'preview-adapter'}));
    b.onLoad({filter:/.*/,namespace:'preview-adapter'},args=>({loader:'jsx',resolveDir:root,contents: args.path==='next/image' ? `import React from 'react'; export default function Image({fill,priority,quality,sizes,...p}){return <img {...p} style={fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:p.style}/>}` : args.path==='next/link' ? `import React from 'react';export default function Link(p){return <a {...p}/ >}` : `import React from 'react';export function LogoutButton({label,className}){return <button className={className}>{label}</button>}`}));
  }
}]});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/') {res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="/preview.css"><style>body{margin:0;background:#05090f;font-family:Arial,sans-serif}#root{min-height:100dvh}</style><body><div id="root"></div><script src="/preview.js"></script></body></html>');return;}
  const base=url.pathname.startsWith('/images/')?path.join(root,'public'):out;
  const file=path.resolve(base,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(base+path.sep)||!fs.existsSync(file)){res.statusCode=404;res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
}).listen(4318,'127.0.0.1',()=>console.log('Local visual preview http://127.0.0.1:4318'));
