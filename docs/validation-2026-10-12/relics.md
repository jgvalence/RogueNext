# Relic Pool Audit

Generated from `src/game/data/relics.ts`.

- Total relic definitions: **194**
- By rarity: **29 common**, **64 uncommon**, **71 rare**, **30 boss**
- Initially unlocked: **40** | Boss-specific: **27** | Archetype-tagged: **126**
- Timing families: **50** combat-start, **10** turn-start, **9** turn-end
- Decision signals: **41** conditional, **29** with an explicit drawback signal
- Unlock gates: **107** enemy mastery, **5** run count, **10** wins, **12** difficulty, **20** character mastery, **2** gold challenge
- Character mastery: scribe 5, bibliothecaire 5, griot 5, fou 5
- Relics without an engine reference: **0**
- Archetype tags: INK 28, BLOCK 32, DRAW 29, STRENGTH 27, HEAL 20, POISON 7, BLEED 6

## Exact Description Duplicates

- No exact duplicate relic descriptions detected.

## Mechanical Signature Hotspots

- **10 relics** share `flag`
  menders_inkwell (RARE, general), echoing_inkstone (RARE, general), library_margin_inkpot (COMMON, general), viking_raider_horn (COMMON, general), viking_fenrir_fang (RARE, general), egypt_tomb_censer (UNCOMMON, general), celtic_sidhe_cloak (COMMON, general), celtic_oak_geas (RARE, general), russian_rusalka_teardrop (RARE, general), russian_deathless_locket (BOSS, boss:koschei_deathless)
- **3 relics** share `1+1`
  bookmark (UNCOMMON, general), priest_obsidian_censer (UNCOMMON, general), iron_binding (BOSS, general)
- **3 relics** share `energycurrent+1`
  beast_bog_heart (RARE, general), sprite_quill_charm (UNCOMMON, general), egypt_ra_brazier (RARE, general)
- **2 relics** share `thorn`
  archon_ink_crown (UNCOMMON, general), briar_codex (COMMON, general)
- **2 relics** share `inkcurrent+1`
  cossack_iron_spur (COMMON, general), spectral_inkwell (UNCOMMON, general)
- **2 relics** share `conditional`
  lamia_veil (UNCOMMON, general), impundulu_thunder_plume (RARE, general)
- **2 relics** share `strength+1`
  wraith_torn_folio (COMMON, general), fading_grimoire (RARE, general)
- **2 relics** share `energycurrent+1+1`
  einherjar_oath_band (RARE, general), energy_crystal (RARE, general)
- **2 relics** share `currenthp+conditional`
  mummy_linen_knot (RARE, general), egypt_anubis_scale (UNCOMMON, general)
- **2 relics** share `thorn+1`
  runic_bulwark (UNCOMMON, general), dagdas_club (BOSS, boss:dagda_shadow)
- **2 relics** share `weak+cadence+conditional+0+0`
  library_redaction_quill (RARE, general), celtic_wild_hunt_horn (RARE, general)
- **2 relics** share `strength+cadence+conditional+0+0+1`
  greek_satyr_flute (RARE, general), african_mask_drum (UNCOMMON, general)
- **2 relics** share `vulnerable`
  greek_medusa_eye (RARE, general), aztec_quetzal_coil (UNCOMMON, general)
- **2 relics** share `poison+1`
  egypt_scarab_idol (RARE, general), venom_grimoire (RARE, general)
- **2 relics** share `bleed+1`
  celtic_briar_seed (RARE, general), hemorrhage_codex (RARE, general)
- **2 relics** share `energycurrent+drawcards+cadence+conditional+0+1`
  russian_midwinter_star (RARE, general), scribe_sealed_edition (RARE, general)

## Strict Dominance Candidates (same rarity and text pattern)

- No numeric strict-dominance candidate detected.

## Unlock Cadence Diagnostics

- Run-only baseline: 0 runs = 40, 3 runs = 40, 6 runs = 43, 10 runs = 45, 20 runs = 45.
- Simultaneous enemy mastery gates: **19**.
  - lernaean_broodling:5: broodling_hydra_spine, greek_hydra_ichor
  - oya_harbinger:5: harbinger_storm_bell, african_oya_anklet
  - mi_go_surgeon:5: surgeon_mi_go_tools, love_migo_lantern
  - cernunnos_shade:3: cernunnos_horn, celtic_cernunnos_antler
  - dagda_shadow:3: dagdas_club, celtic_dagda_cauldron
  - koschei_deathless:3: deathless_bone, russian_deathless_locket
  - osiris_judgment:3: eye_of_maat, egypt_osiris_feather
  - soundiata_spirit:3: griot_drum, african_soundiata_standard
  - hel_queen:3: hels_crown, viking_hel_signet
  - hydra_aspect:3: hydra_scale, greek_hydra_heart
  - tezcatlipoca_echo:3: obsidian_mirror, aztec_tezca_mirror
  - quetzalcoatl_wrath:3: quetzal_feather, aztec_quetzal_crown
  - shub_spawn:3: shub_idol, love_shub_brood_core
  - ra_avatar:3: solar_disc, egypt_ra_brazier
  - medusa:3: stone_pendant, greek_medusa_eye
  - nyarlathotep_shard:3: void_shard, love_nyar_mask
  - anansi_weaver:3: weavers_thread, african_anansi_weave
  - fenrir:3: wolf_fang, viking_fenrir_fang
  - baba_yaga_hut:3: yaga_skull, russian_yaga_mortar

- Character starter relics: scribe_opening_glyph, bibliothecaire_margin_tabs, bleeding_thistle, scroll_of_marginalia.

## Boss Relic Decision Audit

- Decision-changing: **30/30**.
  - interactive: archivists_lens (drawcards+flag+conditional+2+2)
  - interactive: blood_grimoire (marker)
  - interactive: cernunnos_horn (block+thorn+conditional+2)
  - interactive: dagdas_club (thorn+1)
  - interactive: deathless_bone (energycurrent+discard+1+1)
  - interactive: eye_of_maat (block+energycurrent+weak+conditional+1+1+1+5+1)
  - interactive: griot_drum (block+strength+inkcurrent+cadence+conditional+0+1+6+2)
  - interactive: guardians_seal (flag+2)
  - interactive: hels_crown (block+thorn+strength+conditional+1+3+1)
  - interactive: hydra_scale (thorn+cadence+conditional+0+2)
  - interactive: iron_binding (1+1)
  - interactive: obsidian_mirror (currenthp+vulnerable+conditional+0)
  - interactive: quetzal_feather (block+inkcurrent+energycurrent+conditional+1+5+2+1)
  - interactive: shub_idol (strength+inkcurrent+status+discard+conditional+random+2+3)
  - interactive: solar_disc (inkcurrent+energycurrent+1+1)
  - interactive: stone_pendant (block+currenthp+conditional+8)
  - interactive: void_shard (discard+cadence+conditional+0+2)
  - interactive: weavers_thread (block+drawcards+status+cadence+conditional+0+2)
  - interactive: wolf_fang (block+currenthp+conditional+0)
  - interactive: yaga_skull (discard+cadence+conditional+1+0)
  - interactive: library_archivist_eye (exhaust+flag+1+2)
  - interactive: viking_hel_signet (thorn+currenthp+vulnerable+conditional+0+2)
  - interactive: greek_hydra_heart (marker)
  - interactive: egypt_osiris_feather (currenthp+15+15+5)
  - interactive: love_shub_brood_core (energycurrent+status+discard+random+1+1)
  - interactive: aztec_quetzal_crown (inkcurrent+energycurrent+currenthp+1+1+1)
  - interactive: celtic_cernunnos_antler (thorn+currenthp+conditional+0+1)
  - interactive: russian_deathless_locket (flag)
  - interactive: african_anansi_weave (block+drawcards+flag+cadence+conditional+0+4)
  - interactive: global_labyrinth_spiral (strength+energycurrent+drawcards+cadence+conditional+3+0+1+1+1)

## Pattern Description Hotspots

- **2 relics** share `start each combat with # block and # thorn.`
  warded_ribbon (COMMON, general), shaman_storm_totem (UNCOMMON, general)
- **2 relics** share `start each combat with # thorns.`
  archon_ink_crown (UNCOMMON, general), briar_codex (COMMON, general)
- **2 relics** share `start each combat with # ink.`
  ink_stamp (COMMON, general), russian_domovoi_hearth (UNCOMMON, general)
- **2 relics** share `start each combat with # strength.`
  wraith_torn_folio (COMMON, general), berserker_rune_axehead (UNCOMMON, general)
