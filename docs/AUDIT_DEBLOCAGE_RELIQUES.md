# Audit des conditions de deblocage des reliques

Date : 4 aout 2026

## Verdict

Les 194 reliques possedent maintenant une condition classee et verifiable par l'audit `npm run audit:relics -- --unlock-details`. Chaque ligne du rapport indique la rarete, la condition et la fonction de progression de la relique.

La progression conserve trois couches distinctes :

1. un socle initial suffisamment large ;
2. des maitrises thematiques liees aux ennemis et aux boss ;
3. des accomplissements de victoire, difficulte, personnage et economie.

## Etat final

- 194 reliques au total.
- 40 reliques dans le pool initial, dont 4 reliques identitaires de depart.
- 107 conditions de maitrise d'ennemi.
- 5 conditions de nombre de runs, conservees comme filet de progression.
- 10 conditions de victoires.
- 12 conditions de difficulte globale.
- 20 conditions de maitrise de personnage : 5 par personnage.
- 2 accomplissements lies a l'or.
- 19 seuils de maitrise debloquent deux reliques simultanement, contre 26 avant la passe.

## Reliques de depart

Chaque personnage commence desormais toutes ses runs avec une relique propre :

| Personnage | Relique | Identite enseignee |
| --- | --- | --- |
| Scribe | `scribe_opening_glyph` | Choisir soigneusement la premiere carte du tour |
| Bibliothecaire | `bibliothecaire_margin_tabs` | Conserver une main suffisamment fournie |
| Griot | `bleeding_thistle` | Construire un rythme de trois Attaques |
| Fou | `scroll_of_marginalia` | Accepter une contrepartie pour accelerer la pioche |

Ces reliques sont disponibles immediatement. Une identite de personnage ne doit pas demander au joueur d'echouer plusieurs fois, et une premiere victoire ne doit pas etre exigee avant que le kit de base devienne coherent.

Les quatre anciennes recompenses de difficulte 1 ont ete remplacees sans augmenter le catalogue :

- Scribe : `ink_stamp` ;
- Bibliothecaire : `bookmark` ;
- Griot : `venom_grimoire` ;
- Fou : `cursed_diacrit`.

Chaque personnage conserve donc exactement cinq recompenses de maitrise, aux difficultes 1 a 5.

## Lissage de la Bibliotheque

Sept variantes de la Bibliotheque se debloquaient simultanement avec une autre relique du meme ennemi. Elles forment maintenant une progression lisible :

- premiere victoire : `library_margin_inkpot` ;
- difficulte 1 : `library_prep_satchel` ;
- trois victoires : `library_redaction_quill` ;
- difficultes 2 a 5 : `library_archon_stamp`, `library_colossus_plate`, `library_guardian_chain`, `library_archivist_eye`.

Les 19 doubles seuils restants sont principalement volontaires : ils associent la relique directe d'un boss a sa variante culturelle de biome. Ils renforcent la memoire du boss plutot que de produire deux recompenses sans rapport.

## Garde-fous

L'audit echoue maintenant si :

- le catalogue ne contient plus 194 reliques ;
- un personnage ne possede plus cinq recompenses de maitrise ;
- les quatre reliques de depart ne sont pas uniques ;
- une relique de depart n'existe pas ou possede encore une condition de deblocage ;
- une relique ne possede aucune reference dans le moteur.

## Validation restante

La structure et la coherence sont traitees. Seules les donnees de parties permettront de confirmer la cadence ressentie : temps moyen avant chaque seuil, reliques ignorees apres deblocage et satisfaction lors des doubles maitrises de boss.
