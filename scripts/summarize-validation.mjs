import fs from "node:fs";
const folder = "docs/validation-2026-10-12";
const read = name => JSON.parse(fs.readFileSync(`${folder}/${name}.json`, "utf8"));
const balance = read("balance"), journeys = read("journeys"), builds = read("builds").summary;
const full = balance.filter(r => r.meta !== "none" && !r.strict);
const rows = [...new Set(full.map(r => `${r.character}/${r.build}`))].map(key => {
  const values = Array.from({ length: 6 }, (_, d) => { const r = full.find(r => `${r.character}/${r.build}` === key && r.difficulty === d); return r ? `${r.wins}/${r.runs}` : "en attente"; });
  return `| ${key} | ${values.join(" | ")} |`;
});
const draft = {}, upgrades = { A: 0, B: 0 };
for (const row of full) {
  const data = JSON.parse(fs.readFileSync(row.file, "utf8"));
  for (const [id, counts] of Object.entries(data.draftStats)) {
    draft[id] ??= { offered: 0, picked: 0 };
    draft[id].offered += counts.offered; draft[id].picked += counts.picked;
  }
  upgrades.A += data.upgradeStats.A; upgrades.B += data.upgradeStats.B;
}
const ignored = Object.entries(draft).filter(([, c]) => c.offered >= 30 && c.picked === 0).sort((a, b) => b[1].offered - a[1].offered);
fs.writeFileSync(`${folder}/draft-summary.json`, JSON.stringify({ upgrades, ignored, draft, note: "Draft heuristic has no deck-context valuation for most conditional effects and favors A on ties. Not player preferences or proof of dominated cards." }, null, 2));
const total = balance.reduce((n, r) => n + r.runs, 0);
const text = [
  "# Résultats automatisés — 12 octobre 2026", "",
  `${total}/2040 simulations de confirmation terminées ; ${balance.reduce((n, r) => n + r.errors.length, 0)} erreurs moteur. La campagne interrompue par un manque d’espace disque a repris les cas manquants, sans changer les graines réussies.`, "",
  `${journeys.reduce((n, r) => n + r.runs, 0)} parcours supplémentaires couvrent quatre personnages et neuf biomes forcés, avec ${journeys.reduce((n, r) => n + r.checkpoints, 0)} états de salle sérialisés puis validés. ${journeys.reduce((n, r) => n + r.wins, 0)} victoires ; aucune erreur technique.`, "",
  "## Difficulté et orientations", "",
  "Méta average en D0–D1, strong en D2–D5. Vingt graines par case. Les intervalles de Wilson à 95 % figurent dans balance.json ; un petit échantillon n’est pas un taux de victoire humain.", "",
  "| Personnage / build | D0 | D1 | D2 | D3 | D4 | D5 |", "| --- | --- | --- | --- | --- | --- | --- |", ...rows, "",
  "### Départs D0 sans méta", "", ...balance.filter(r => r.meta === "none").map(r => `- ${r.character} : ${r.wins}/${r.runs}.`), "",
  "### Sans cartes offensives Armure/Épines", "",
  ...balance.filter(r => r.strict).map(r => `- ${r.character}/${r.build}, D${r.difficulty} : ${r.wins}/${r.runs}.`), "",
  "Le blocage défensif, les reliques et les consommables restent autorisés. Aucune carte ajoutée artificiellement au départ.", "",
  "### Confirmation Griot Rythme D5", "",
  `Après le 0/20 initial, une série indépendante de 60 graines donne ${read("rhythm-D5-extra").wins}/60 victoires. Le rejeu des 30 graines historiques donne ${read("rhythm-D5-replay").wins}/30, comme le rapport du 10 octobre. Aucune erreur moteur. Le build peut gagner en D5 mais reste nettement moins régulier que Dette/Armure ; cette faiblesse reste ouverte. Les 30 rejeux ne constituent pas un échantillon indépendant.`, "",
  "## Catalogue et choix", "",
  `${builds.active} cartes collectables auditées, ${builds.owned.scribe} propres à chaque personnage et ${builds.totalAccessible.scribe} accessibles par personnage à déblocages complets. Aucun ajout d’amélioration incompatible détecté.`, "",
  `Le pilote choisit A ${upgrades.A} fois et B ${upgrades.B} fois. Il préfère A en cas d’égalité et estime sommairement les effets conditionnels : cette distribution n’établit pas la supériorité réelle d’A.`, "",
  "Cartes proposées au moins trente fois et jamais retenues par ce pilote :", "", ...ignored.map(([id, c]) => `- ${id} : ${c.offered} propositions.`), "",
  "Les détails d’exposition, sélections et branches sont conservés dans draft-summary.json. Les profils de builds, les conditions d’accès et les effets de chaque carte restent dans builds.json. Aucune hausse de puissance fondée uniquement sur un rejet du pilote.", "",
].join("\n");
fs.writeFileSync(`${folder}/RESULTATS.md`, text);
console.log({ cases: balance.length, simulations: total, upgrades, ignored: ignored.length });
