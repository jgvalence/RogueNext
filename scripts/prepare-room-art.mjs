import fs from 'node:fs';
import sharp from 'sharp';
const root='docs/rooms-balance-2026-10-10';
const out='public/images/rooms/painted-v1';
fs.mkdirSync(out,{recursive:true});
let count=0;
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.json'))){
  const meta=JSON.parse(fs.readFileSync(`${root}/${file}`,'utf8'));
  if(!meta.source||!meta.prompt)continue;
  for(const [suffix,width,quality] of [['-small',480,78],['',960,83],['-full',1536,85]]){
    const target=`${out}/${meta.id}${suffix}.webp`;
    if(fs.existsSync(target)&&fs.statSync(target).mtimeMs>=fs.statSync(`${root}/${file}`).mtimeMs)continue;
    await sharp(meta.source).resize(width,Math.round(width*2/3),{fit:'cover'}).webp({quality}).toFile(target);
  }
  count++;
}
console.log(`${count} room illustrations prepared`);
