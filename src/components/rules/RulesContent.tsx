"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface RulesContentProps {
  mode?: "page" | "modal";
  onClose?: () => void;
}

export function RulesContent({ mode = "page", onClose }: RulesContentProps) {
  const isModal = mode === "modal";

  return (
    <div className="w-full space-y-5">
      <header className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 backdrop-blur-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {isModal ? (
            <span className="rounded-lg border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300">
              Guide rapide
            </span>
          ) : (
            <Link
              href="/"
              className="rounded-lg border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white"
            >
              ← Retour
            </Link>
          )}

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white"
              type="button"
            >
              Fermer
            </button>
          )}
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
          Panlibrarium
        </p>
        <h1 className="mt-1 bg-gradient-to-r from-purple-300 via-blue-300 to-amber-300 bg-clip-text text-2xl font-black text-transparent sm:text-4xl">
          R&egrave;gles du jeu
        </h1>
      </header>

      <section className="space-y-3">
        <RuleBlock number="1" title="Aper&ccedil;u" emoji="📚" defaultOpen>
          <p className="text-sm text-gray-300 sm:text-base">
            Panlibrarium est un roguelike deck-builder: vous progressez salle
            apr&egrave;s salle, vous renforcez votre deck, puis vous affrontez
            un boss de biome. Chaque d&eacute;cision compte: cartes choisies,
            reliques, gestion de vos ressources et ordre des combats. Le but est
            de survivre aux 5 &eacute;tages et vaincre les boss.
          </p>
        </RuleBlock>

        <RuleBlock number="2" title="Structure d'une partie" emoji="🧭">
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300 sm:text-base">
            <li>Une run se compose de 5 &eacute;tages.</li>
            <li>
              Chaque &eacute;tage contient 10 salles, avec progression de gauche
              &agrave; droite.
            </li>
            <li>
              La difficult&eacute; monte progressivement jusqu&apos;au combat de
              boss.
            </li>
            <li>
              Apr&egrave;s un boss, vous passez au biome suivant avec de
              nouveaux ennemis et th&egrave;mes.
            </li>
          </ul>
        </RuleBlock>

        <RuleBlock number="3" title="Le combat" emoji="⚔️">
          <div className="space-y-3">
            <p className="text-sm text-gray-300 sm:text-base">
              Le combat repose sur l&apos;&eacute;nergie, la main, la pioche et
              la d&eacute;fausse. Vous jouez vos cartes pendant votre tour, puis
              les ennemis agissent.
            </p>
            <div className="rounded-xl border border-gray-700 bg-gray-950/60 p-3">
              <p className="mb-2 text-sm font-semibold text-gray-200">
                D&eacute;roul&eacute; d&apos;un tour
              </p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-300">
                <li>
                  D&eacute;but de tour: &eacute;nergie restaur&eacute;e (3),
                  effets des reliques appliqu&eacute;s.
                </li>
                <li>
                  Tour joueur: jouer des cartes depuis la main (co&ucirc;t en
                  &eacute;nergie).
                </li>
                <li>
                  Fin de tour: la main est d&eacute;fauss&eacute;e, puis phase
                  ennemie.
                </li>
                <li>Phase ennemie: attaques par ordre de vitesse.</li>
              </ol>
            </div>
          </div>
        </RuleBlock>

        <RuleBlock number="4" title="Types de cartes" emoji="🃏">
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300 sm:text-base">
            <li>
              <span className="font-semibold text-red-300">Attaque</span>:
              inflige des d&eacute;g&acirc;ts.
            </li>
            <li>
              <span className="font-semibold text-cyan-300">
                Comp&eacute;tence
              </span>
              : d&eacute;fense, pioche, gain de ressources, utilitaires.
            </li>
            <li>
              <span className="font-semibold text-purple-300">Pouvoir</span>:
              effets persistants, souvent tr&egrave;s puissants.
            </li>
            <li>
              Les cartes peuvent &ecirc;tre{" "}
              <span className="font-semibold text-amber-300">
                am&eacute;lior&eacute;es
              </span>{" "}
              pour augmenter leurs effets ou r&eacute;duire leur co&ucirc;t.
            </li>
          </ul>
        </RuleBlock>

        <RuleBlock number="5" title="L'encre" emoji="🖋️">
          <div className="space-y-3">
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300 sm:text-base">
              <li>
                L&apos;encre est la ressource secondaire du combat (max 5 par
                d&eacute;faut).
              </li>
              <li>
                Ce maximum peut &ecirc;tre augment&eacute; via certaines
                reliques.
              </li>
              <li>
                Marquer une carte avec de l&apos;encre (co&ucirc;t variable)
                amplifie son effet.
              </li>
              <li>Vous pouvez utiliser 1 pouvoir d&apos;encre par tour.</li>
            </ul>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-300">
                    <th className="py-2 pr-3">Pouvoir</th>
                    <th className="py-2 pr-3">Co&ucirc;t</th>
                    <th className="py-2">Effet</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-800">
                    <td className="py-2 pr-3 font-semibold text-blue-300">
                      R&eacute;&eacute;criture
                    </td>
                    <td className="py-2 pr-3">3 encre</td>
                    <td className="py-2">
                      Reprendre une carte de la d&eacute;fausse en main.
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 pr-3 font-semibold text-purple-300">
                      Chapitre Perdu
                    </td>
                    <td className="py-2 pr-3">2 encre</td>
                    <td className="py-2">
                      Piocher 2 cartes suppl&eacute;mentaires.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-semibold text-amber-300">
                      Sceau
                    </td>
                    <td className="py-2 pr-3">2 encre</td>
                    <td className="py-2">
                      Gagner 8 armure imm&eacute;diatement.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </RuleBlock>

        <RuleBlock number="6" title="Les salles" emoji="🚪">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-300">
                  <th className="py-2 pr-3">Salle</th>
                  <th className="py-2 pr-3">Contenu</th>
                  <th className="py-2">R&eacute;compense</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-3 font-semibold text-gray-200">
                    Combats
                  </td>
                  <td className="py-2 pr-3">1 &agrave; 4 ennemis</td>
                  <td className="py-2">Or + 3 cartes &agrave; choisir</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-3 font-semibold text-red-300">
                    &Eacute;lite
                  </td>
                  <td className="py-2 pr-3">
                    1 ennemi &eacute;lite (d&egrave;s salle 3)
                  </td>
                  <td className="py-2">Or bonus + relique</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-3 font-semibold text-amber-300">
                    Marchand
                  </td>
                  <td className="py-2 pr-3">
                    Boutique: cartes, reliques, soins, purge
                  </td>
                  <td className="py-2">-</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-3 font-semibold text-cyan-300">
                    Sp&eacute;ciale
                  </td>
                  <td className="py-2 pr-3">
                    Soin 30% PV, am&eacute;lioration carte, ou
                    &eacute;v&eacute;nement
                  </td>
                  <td className="py-2">-</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-3 font-semibold text-purple-300">
                    Pr&eacute;-boss
                  </td>
                  <td className="py-2 pr-3">Combat &eacute;lite</td>
                  <td className="py-2">Acc&egrave;s boss</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-rose-300">
                    Boss
                  </td>
                  <td className="py-2 pr-3">Boss du biome</td>
                  <td className="py-2">3 reliques &agrave; choisir</td>
                </tr>
              </tbody>
            </table>
          </div>
        </RuleBlock>

        <RuleBlock number="7" title="Buffs &amp; D&eacute;buffs" emoji="📊">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-300">
                  <th className="py-2 pr-3">Effet</th>
                  <th className="py-2">Impact</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-3 font-semibold text-red-300">
                    Force
                  </td>
                  <td className="py-2">
                    Augmente les d&eacute;g&acirc;ts inflig&eacute;s.
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-3 font-semibold text-blue-300">
                    Concentration
                  </td>
                  <td className="py-2">
                    Renforce certains effets utilitaires et de cartes.
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-3 font-semibold text-amber-300">
                    Vuln&eacute;rable
                  </td>
                  <td className="py-2">
                    Vous subissez plus de d&eacute;g&acirc;ts.
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-3 font-semibold text-slate-300">
                    Faible
                  </td>
                  <td className="py-2">
                    Vos attaques infligent moins de d&eacute;g&acirc;ts.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-green-300">
                    Poison
                  </td>
                  <td className="py-2">
                    D&eacute;g&acirc;ts progressifs &agrave; chaque tour.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </RuleBlock>

        <RuleBlock number="8" title="Conseils de d&eacute;part" emoji="💡">
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300 sm:text-base">
            <li>
              Gardez un deck compact au d&eacute;but: moins de cartes, plus de
              coh&eacute;rence.
            </li>
            <li>
              Priorisez les cartes de d&eacute;fense avant le premier boss.
            </li>
            <li>
              D&eacute;pensez l&apos;encre quand l&apos;impact est
              d&eacute;cisif, pas automatiquement.
            </li>
            <li>
              Le marchand est id&eacute;al pour purger les cartes faibles et
              stabiliser votre plan.
            </li>
          </ul>
        </RuleBlock>
      </section>
    </div>
  );
}

interface RuleBlockProps {
  number: string;
  title: string;
  emoji: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

function RuleBlock({
  number,
  title,
  emoji,
  children,
  defaultOpen = false,
}: RuleBlockProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur-sm"
    >
      <summary className="cursor-pointer select-none list-none">
        <div className="flex items-center gap-3">
          <span className="text-lg">{emoji}</span>
          <h2 className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
            {number}. {title}
          </h2>
        </div>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
