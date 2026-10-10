import fs from "node:fs";
import { enemyDefinitions } from "../src/game/data";
import { getEnemyImageSrc } from "../src/lib/assets";
import { getEnemyTextEntry } from "../src/lib/i18n/enemy-text-resources";

async function main() {
  const esc = (s: string) =>
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
  const enemies = [...enemyDefinitions].sort(
    (a, b) => Number(b.isBoss) - Number(a.isBoss)
  );
  const items = enemies.map((e) => ({
    id: e.id,
    name: getEnemyTextEntry("fr", e.id)?.name ?? e.name,
    biome: e.biome,
    type: e.isBoss ? "Boss" : e.isElite ? "Élite" : "Ennemi / entité",
    src: "../../public" + getEnemyImageSrc(e.id),
    full: "../../public" + getEnemyImageSrc(e.id, "full"),
  }));
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Panlibrarium — Ennemis et boss</title>
<style>:root{color-scheme:dark;font-family:system-ui;background:#0b1218;color:#eee4cc}*{box-sizing:border-box}body{margin:0;padding:24px;max-width:1600px;margin-inline:auto}h1,h2{font-family:Georgia,serif}h1{font-size:clamp(28px,4vw,44px)}p{color:#b9b4a8}input,select,button{font:inherit;color:inherit;background:#16232c;border:1px solid #7b6946;border-radius:6px;padding:10px;margin:4px}label{display:inline-block}input{max-width:70vw}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,270px),1fr));gap:18px;margin-top:24px}article{border:1px solid #514630;border-radius:10px;overflow:hidden;background:#121c24}article[hidden]{display:none}a{color:inherit;text-decoration:none}img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:contain}h2{font-size:20px;margin:14px}article p{margin:14px;font-size:12px}a:focus-visible,button:focus-visible{outline:3px solid #e5bc72;outline-offset:3px}dialog{width:min(1500px,96vw);max-height:96dvh;padding:16px;border:1px solid #ad8b51;background:#0c161e;color:#eee4cc;border-radius:10px}dialog::backdrop{background:#000d}dialog img{max-height:calc(96dvh - 130px);height:auto;object-fit:contain}dialog .bar{display:flex;align-items:center;justify-content:space-between;gap:12px}@media(max-width:500px){body{padding:12px}}</style>
<h1>Ennemis et boss de Panlibrarium</h1><p>101 portraits de combat, dont 18 boss. Cliquez pour voir la peinture entière.</p><label>Recherche <input id="search" type="search"></label><label>Type <select id="kind"><option value="">Tous</option><option>Boss</option><option>Élite</option><option>Ennemi / entité</option></select></label><label>Monde <select id="world"><option value="">Tous</option>${[...new Set(items.map((e) => e.biome))].map((b) => `<option>${b}</option>`).join("")}</select></label><p id="count"></p>
<div class="grid">${items.map((e) => `<article data-world="${e.biome}" data-kind="${e.type}" data-search="${esc(e.name + " " + e.id)}"><a href="${e.full}"><img src="${e.src}" alt="${esc(e.name)}" loading="lazy" width="768" height="512"><h2>${esc(e.name)}</h2></a><p>${e.type} · ${e.biome}</p></article>`).join("")}</div>
<dialog><div class="bar"><h2 id="title"></h2><button id="close">Fermer</button></div><img id="full" alt=""></dialog>
<script>const search=document.querySelector('#search'),world=document.querySelector('#world'),kind=document.querySelector('#kind'),dialog=document.querySelector('dialog'),full=document.querySelector('#full');const normalize=s=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();function filter(){let n=0;document.querySelectorAll('article').forEach(e=>{e.hidden=!!((world.value&&e.dataset.world!==world.value)||(kind.value&&e.dataset.kind!==kind.value)||!normalize(e.dataset.search).includes(normalize(search.value)));if(!e.hidden)n++});document.querySelector('#count').textContent=n+' portraits affichés'}search.oninput=world.onchange=kind.onchange=filter;filter();document.querySelectorAll('article a').forEach(a=>a.onclick=e=>{e.preventDefault();full.src=a.href;full.alt=a.querySelector('h2').textContent;document.querySelector('#title').textContent=full.alt;dialog.showModal()});document.querySelector('#close').onclick=()=>dialog.close();</script></html>`;
  fs.writeFileSync("docs/enemy-art-2026-10-10/galerie.html", html);
  console.log("Gallery: " + items.length + " enemies");
}
void main();
