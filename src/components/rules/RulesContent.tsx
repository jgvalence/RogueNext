"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface RulesContentProps {
  mode?: "page" | "modal";
  onClose?: () => void;
}

interface SimpleTableRow {
  power?: string;
  cost?: string;
  effect?: string;
  room?: string;
  content?: string;
  reward?: string;
  impact?: string;
}

export function RulesContent({ mode = "page", onClose }: RulesContentProps) {
  const { t } = useTranslation();
  const isModal = mode === "modal";

  const runStructureBullets = t("rules.sections.runStructure.bullets", {
    returnObjects: true,
  }) as string[];
  const combatSteps = t("rules.sections.combat.steps", {
    returnObjects: true,
  }) as string[];
  const inkBullets = t("rules.sections.ink.bullets", {
    returnObjects: true,
  }) as string[];
  const inkRows = t("rules.sections.ink.rows", {
    returnObjects: true,
  }) as SimpleTableRow[];
  const roomRows = t("rules.sections.rooms.rows", {
    returnObjects: true,
  }) as SimpleTableRow[];
  const buffRows = t("rules.sections.buffs.rows", {
    returnObjects: true,
  }) as SimpleTableRow[];
  const tipBullets = t("rules.sections.tips.bullets", {
    returnObjects: true,
  }) as string[];

  return (
    <div className="w-full space-y-5">
      <header className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 backdrop-blur-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isModal ? (
              <span className="rounded-lg border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300">
                {t("rules.quickGuide")}
              </span>
            ) : (
              <Link
                href="/"
                className="rounded-lg border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white"
              >
                {"<-"} {t("rules.back")}
              </Link>
            )}
          </div>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white"
              type="button"
            >
              {t("rules.close")}
            </button>
          )}
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
          {t("rules.gameTitle")}
        </p>
        <h1 className="mt-1 bg-gradient-to-r from-purple-300 via-blue-300 to-amber-300 bg-clip-text text-2xl font-black text-transparent sm:text-4xl">
          {t("rules.pageTitle")}
        </h1>
      </header>

      <section className="space-y-3">
        <RuleBlock
          number="1"
          title={t("rules.sections.overview.title")}
          emoji={t("rules.sections.overview.emoji")}
          defaultOpen
        >
          <p className="text-sm text-gray-300 sm:text-base">
            {t("rules.sections.overview.text")}
          </p>
        </RuleBlock>

        <RuleBlock
          number="2"
          title={t("rules.sections.runStructure.title")}
          emoji={t("rules.sections.runStructure.emoji")}
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300 sm:text-base">
            {runStructureBullets.map((item, index) => (
              <li key={`run-structure-${index}`}>{item}</li>
            ))}
          </ul>
        </RuleBlock>

        <RuleBlock
          number="3"
          title={t("rules.sections.combat.title")}
          emoji={t("rules.sections.combat.emoji")}
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-300 sm:text-base">
              {t("rules.sections.combat.intro")}
            </p>
            <div className="rounded-xl border border-gray-700 bg-gray-950/60 p-3">
              <p className="mb-2 text-sm font-semibold text-gray-200">
                {t("rules.sections.combat.turnTitle")}
              </p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-300">
                {combatSteps.map((step, index) => (
                  <li key={`combat-step-${index}`}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </RuleBlock>

        <RuleBlock
          number="4"
          title={t("rules.sections.cardTypes.title")}
          emoji={t("rules.sections.cardTypes.emoji")}
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300 sm:text-base">
            <li>
              <span className="font-semibold text-red-300">
                {t("rules.sections.cardTypes.attack")}
              </span>
              : {t("rules.sections.cardTypes.attackDesc")}
            </li>
            <li>
              <span className="font-semibold text-cyan-300">
                {t("rules.sections.cardTypes.skill")}
              </span>
              : {t("rules.sections.cardTypes.skillDesc")}
            </li>
            <li>
              <span className="font-semibold text-purple-300">
                {t("rules.sections.cardTypes.power")}
              </span>
              : {t("rules.sections.cardTypes.powerDesc")}
            </li>
            <li>
              {t("rules.sections.cardTypes.upgradesPrefix")}{" "}
              <span className="font-semibold text-amber-300">
                {t("rules.sections.cardTypes.upgradesKey")}
              </span>{" "}
              {t("rules.sections.cardTypes.upgradesSuffix")}
            </li>
          </ul>
        </RuleBlock>

        <RuleBlock
          number="5"
          title={t("rules.sections.ink.title")}
          emoji={t("rules.sections.ink.emoji")}
        >
          <div className="space-y-3">
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300 sm:text-base">
              {inkBullets.map((item, index) => (
                <li key={`ink-${index}`}>{item}</li>
              ))}
            </ul>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-300">
                    <th className="py-2 pr-3">
                      {t("rules.sections.ink.tableHeaders.power")}
                    </th>
                    <th className="py-2 pr-3">
                      {t("rules.sections.ink.tableHeaders.cost")}
                    </th>
                    <th className="py-2">
                      {t("rules.sections.ink.tableHeaders.effect")}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {inkRows.map((row, index) => (
                    <tr
                      key={`ink-row-${index}`}
                      className={
                        index < inkRows.length - 1
                          ? "border-b border-gray-800"
                          : ""
                      }
                    >
                      <td className="py-2 pr-3 font-semibold text-blue-300">
                        {row.power}
                      </td>
                      <td className="py-2 pr-3">{row.cost}</td>
                      <td className="py-2">{row.effect}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </RuleBlock>

        <RuleBlock
          number="6"
          title={t("rules.sections.rooms.title")}
          emoji={t("rules.sections.rooms.emoji")}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-300">
                  <th className="py-2 pr-3">
                    {t("rules.sections.rooms.tableHeaders.room")}
                  </th>
                  <th className="py-2 pr-3">
                    {t("rules.sections.rooms.tableHeaders.content")}
                  </th>
                  <th className="py-2">
                    {t("rules.sections.rooms.tableHeaders.reward")}
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {roomRows.map((row, index) => (
                  <tr
                    key={`room-row-${index}`}
                    className={
                      index < roomRows.length - 1
                        ? "border-b border-gray-800"
                        : ""
                    }
                  >
                    <td className="py-2 pr-3 font-semibold text-gray-200">
                      {row.room}
                    </td>
                    <td className="py-2 pr-3">{row.content}</td>
                    <td className="py-2">{row.reward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RuleBlock>

        <RuleBlock
          number="7"
          title={t("rules.sections.buffs.title")}
          emoji={t("rules.sections.buffs.emoji")}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-300">
                  <th className="py-2 pr-3">
                    {t("rules.sections.buffs.tableHeaders.effect")}
                  </th>
                  <th className="py-2">
                    {t("rules.sections.buffs.tableHeaders.impact")}
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {buffRows.map((row, index) => (
                  <tr
                    key={`buff-row-${index}`}
                    className={
                      index < buffRows.length - 1
                        ? "border-b border-gray-800"
                        : ""
                    }
                  >
                    <td className="py-2 pr-3 font-semibold text-red-300">
                      {row.effect}
                    </td>
                    <td className="py-2">{row.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RuleBlock>

        <RuleBlock
          number="8"
          title={t("rules.sections.tips.title")}
          emoji={t("rules.sections.tips.emoji")}
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300 sm:text-base">
            {tipBullets.map((item, index) => (
              <li key={`tip-${index}`}>{item}</li>
            ))}
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
