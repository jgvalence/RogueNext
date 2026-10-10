import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {I18nextProvider} from 'react-i18next';
import {i18n} from '../../src/lib/i18n';
import {GameCard} from '../../src/app/game/_components/combat/GameCard';
import {allCardDefinitions} from '../../src/game/data';
(globalThis as any).React = React;
const ids=['strike','defend','ink_surge','trace_tranchant','catalogue','piqure','frappe_folle','saga_keeper'];
const cards=ids.map(id=>allCardDefinitions.find(c=>c.id===id)!).filter(Boolean);
let markup=renderToStaticMarkup(<I18nextProvider i18n={i18n}><div className="flex flex-wrap gap-4">{cards.map(c=><GameCard key={c.id} definition={c} size="lg" canPlayInked={true}/>)}</div></I18nextProvider>);
markup=markup.replaceAll('src="/images/','src="../../public/images/');
const examples=['ink_slime','paper_golem','fenrir','hel_queen','medusa','hydra_aspect','ra_avatar','nyarlathotep_shard','baba_yaga_hut','anansi_weaver','archivist_black_inkwell','hydra_head_left','koschei_hidden_needle'];
const html=`<!doctype html><html lang="fr"><meta charset="utf-8"><link rel="stylesheet" href="corrected-visual.css"><style>body{background:#10131b;color:#ede8d8;padding:24px;font-family:Georgia}h1{font-size:24px;margin-bottom:20px}h2{font-size:20px;margin:25px 0 12px}.assets{display:flex;flex-wrap:wrap;gap:12px}.unit{background:#1b202b;border:1px solid #48413a;padding:8px;width:160px;font-family:Arial;font-size:11px}.unit img{width:144px;height:140px;object-fit:contain}.backs img{width:30%;margin:8px}</style><body><h1>Panlibrarium — planche de contrôle des composants et assets existants</h1><p>Rendu statique de GameCard, hors écran de combat. Illustrations de depart completees.</p>${markup}<h2>Ennemis et boss</h2><div class="assets">${examples.map(id=>`<div class="unit"><img src="../../public/images/enemies/${id}.svg">${id}</div>`).join('')}</div><h2>Décors</h2><div class="backs">${['combat','combat_viking','combat_greek'].map(id=>`<img src="../../public/images/backgrounds/${id}.svg">`).join('')}</div></body></html>`;
fs.writeFileSync('docs/audit-2026-10-09/corrected-visual.html',html);

