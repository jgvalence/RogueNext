import fs from "node:fs/promises";
import path from "node:path";
import { fr } from "../src/lib/i18n/messages/fr";

type Entry = { id: string; name: string; biome: string };
async function main() {
  const directory = "docs/card-art-2026-10-10";
  const catalog: Entry[] = JSON.parse(
    await fs.readFile(path.join(directory, "catalog.json"), "utf8")
  );
  const names = fr.cards as Record<string, { name?: string }>;
  const assets = new Set(await fs.readdir("public/images/cards/painted-v1"));
  const cards = catalog
    .filter((c) => assets.has(`${c.id}-full.webp`))
    .map((c) => ({ ...c, name: names[c.id]?.name ?? c.name }));
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!
    );
  const worlds: Record<string, string> = {
    LIBRARY: "Bibliothèque",
    VIKING: "Sagas nordiques",
    GREEK: "Grèce",
    EGYPTIAN: "Égypte",
    LOVECRAFTIAN: "Abîmes cosmiques",
    AZTEC: "Monde aztèque",
    CELTIC: "Forêts celtiques",
    RUSSIAN: "Contes slaves",
    AFRICAN: "Traditions africaines",
  };
  const art = "../../public/images/cards/painted-v1/";
  const html = `<!doctype html>
<html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Panlibrarium — Illustrations des cartes</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#0b1218;color:#eee4cc}*{box-sizing:border-box}body{margin:0;padding:24px;max-width:1680px;margin-inline:auto}h1{font-family:Georgia,serif;font-size:clamp(28px,4vw,48px);font-weight:400;margin-bottom:8px}p{color:#b9b4a8;line-height:1.6}header{margin-bottom:24px}label{display:inline-flex;gap:10px;align-items:center;margin:6px 12px 6px 0}input,select,button{font:inherit;color:inherit;background:#16232c;border:1px solid #7b6946;border-radius:6px;padding:10px}input{max-width:65vw}button,a{touch-action:manipulation}a{color:inherit;text-decoration:none}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #dfbd76;outline-offset:3px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:18px}article{border:1px solid #514630;background:#121c24;border-radius:10px;overflow:hidden}article[hidden]{display:none}article img{width:100%;height:auto;aspect-ratio:3/2;object-fit:contain;display:block;background:#080e12}article h2{font:20px Georgia,serif;margin:14px 14px 6px}article p{margin:0 14px 14px;font-size:12px}article a:hover img{filter:brightness(1.12)}dialog{width:min(1500px,96vw);max-height:96dvh;padding:16px;border:1px solid #ad8b51;background:#0c161e;color:#eee4cc;border-radius:10px}dialog::backdrop{background:#000c}dialog img{display:block;width:100%;height:auto;max-height:calc(96dvh - 120px);object-fit:contain}dialog .bar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}dialog h2{font:22px Georgia,serif;margin:0}#count{font-size:14px}@media(max-width:500px){body{padding:14px}.grid{gap:12px}}
</style>
<header><h1>Les illustrations de Panlibrarium</h1><p>${cards.length} illustrations sur ${catalog.length} cartes. Cliquez sur une image pour la voir entière. Échap ferme l’agrandissement.</p>
<label>Recherche <input id="search" type="search" placeholder="Nom d’une carte…"></label>
<label>Monde <select id="world"><option value="">Tous les mondes</option>${Object.entries(
    worlds
  )
    .map(([key, name]) => `<option value="${key}">${escape(name)}</option>`)
    .join("")}</select></label>
<p id="count" role="status"></p></header>
<main class="grid">${cards.map((c) => `<article data-world="${c.biome}" data-search="${escape(c.name + " " + c.id)}"><a href="${art}${c.id}-full.webp" data-name="${escape(c.name)}"><img src="${art}${c.id}.webp" width="768" height="512" loading="lazy" alt="${escape(c.name)}"><h2>${escape(c.name)}</h2></a><p>${escape(worlds[c.biome] ?? c.biome)} · ${escape(c.id)}</p></article>`).join("\n")}</main>
<dialog aria-labelledby="title"><div class="bar"><h2 id="title"></h2><button id="close" type="button">Fermer</button></div><img id="full" alt=""></dialog>
<script>
const search=document.querySelector('#search'),world=document.querySelector('#world'),entries=[...document.querySelectorAll('article')],dialog=document.querySelector('dialog'),full=document.querySelector('#full');
const normalize=s=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
function filter(){let count=0;for(const e of entries){e.hidden=Boolean(world.value&&e.dataset.world!==world.value)||!normalize(e.dataset.search).includes(normalize(search.value));if(!e.hidden)count++;}document.querySelector('#count').textContent=count+' illustration'+(count>1?'s':'')+' affichée'+(count>1?'s':'');}
search.addEventListener('input',filter);world.addEventListener('change',filter);filter();
for(const a of document.querySelectorAll('article a'))a.addEventListener('click',e=>{e.preventDefault();full.src=a.href;full.alt=a.dataset.name;document.querySelector('#title').textContent=a.dataset.name;dialog.showModal();});
document.querySelector('#close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
</script></html>`;
  await fs.writeFile(path.join(directory, "galerie.html"), html);
  console.log(`Gallery saved: ${cards.length}/${catalog.length} cards`);
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
