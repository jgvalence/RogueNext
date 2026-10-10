import fs from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const root='docs/rooms-balance-2026-10-10';
const catalog=JSON.parse(fs.readFileSync(`${root}/events.json`,'utf8'));
const metadata=fs.readdirSync(root).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(`${root}/${f}`,'utf8'))).filter(m=>m.source&&m.prompt);
const ids=new Set(metadata.map(m=>m.id));
const mapped=catalog.map(event=>({id:event.id,art:event.id.startsWith('scribe_')?'erased_scribe':event.id}));
for(const {art} of mapped)assert(ids.has(art),`Missing event artwork: ${art}`);
for(const id of ['atlas','merchant','rest','forge'])assert(ids.has(id));
const files=[];
for(const id of ids)for(const [suffix,width] of [['-small',480],['',960],['-full',1536]]){
  const file=`public/images/rooms/painted-v1/${id}${suffix}.webp`;
  const image=await sharp(file).metadata();
  assert.equal(image.width,width,file);assert.equal(image.height,Math.round(width*2/3),file);
  files.push({file,width,height:image.height,bytes:fs.statSync(file).size});
}
fs.writeFileSync(`${root}/asset-check.json`,JSON.stringify({illustrations:ids.size,eventCoverage:mapped,files,totalBytes:files.reduce((n,f)=>n+f.bytes,0)},null,2));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const tiles=metadata.map(m=>`<a href="../../public/images/rooms/painted-v1/${m.id}-full.webp" target="_blank"><img loading="lazy" src="../../public/images/rooms/painted-v1/${m.id}-small.webp" alt="${escape(m.id)}"><span>${escape(m.id.replaceAll('_',' '))}</span></a>`).join('');
fs.writeFileSync(`${root}/gallery.html`,`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Les lieux de RogueNext</title><style>body{margin:0;padding:24px;background:#080e18;color:#ebd8a3;font:16px system-ui}h1{font-family:Georgia}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}a{display:block;border:1px solid #65532e;border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;background:#111824}img{width:100%;aspect-ratio:1.5;object-fit:cover;display:block}span{display:block;padding:12px;text-transform:capitalize}</style><h1>Les lieux de RogueNext</h1><p>${ids.size} illustrations : carte, marchand, repos, forge et ${catalog.length} événements. Cliquer pour ouvrir le fichier en grand.</p><main>${tiles}</main></html>`);
console.log(`${ids.size} illustrations, ${catalog.length} events, ${files.length} valid WebP files`);
