"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  RogueButton,
  RogueCollapse,
  RogueTable,
  RogueTag,
} from "@/components/ui/rogue";

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

interface InkTableRow {
  key: string;
  power: string;
  cost: string;
  effect: string;
}

interface RoomTableRow {
  key: string;
  room: string;
  content: string;
  reward: string;
}

interface BuffTableRow {
  key: string;
  effect: string;
  impact: string;
}

export function RulesContent({ mode = "page", onClose }: RulesContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
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

  const inkTableData = useMemo(
    () =>
      inkRows.map((row, index) => ({
        key: `ink-row-${index}`,
        power: row.power ?? "",
        cost: row.cost ?? "",
        effect: row.effect ?? "",
      })),
    [inkRows]
  );
  const roomTableData = useMemo(
    () =>
      roomRows.map((row, index) => ({
        key: `room-row-${index}`,
        room: row.room ?? "",
        content: row.content ?? "",
        reward: row.reward ?? "",
      })),
    [roomRows]
  );
  const buffTableData = useMemo(
    () =>
      buffRows.map((row, index) => ({
        key: `buff-row-${index}`,
        effect: row.effect ?? "",
        impact: row.impact ?? "",
      })),
    [buffRows]
  );

  const inkColumns = useMemo(
    () => [
      {
        title: t("rules.sections.ink.tableHeaders.power"),
        dataIndex: "power",
        key: "power",
        render: (value: string) => (
          <span className="font-semibold text-blue-300">{value}</span>
        ),
      },
      {
        title: t("rules.sections.ink.tableHeaders.cost"),
        dataIndex: "cost",
        key: "cost",
      },
      {
        title: t("rules.sections.ink.tableHeaders.effect"),
        dataIndex: "effect",
        key: "effect",
      },
    ],
    [t]
  );
  const roomColumns = useMemo(
    () => [
      {
        title: t("rules.sections.rooms.tableHeaders.room"),
        dataIndex: "room",
        key: "room",
        render: (value: string) => (
          <span className="font-semibold text-gray-200">{value}</span>
        ),
      },
      {
        title: t("rules.sections.rooms.tableHeaders.content"),
        dataIndex: "content",
        key: "content",
      },
      {
        title: t("rules.sections.rooms.tableHeaders.reward"),
        dataIndex: "reward",
        key: "reward",
      },
    ],
    [t]
  );
  const buffColumns = useMemo(
    () => [
      {
        title: t("rules.sections.buffs.tableHeaders.effect"),
        dataIndex: "effect",
        key: "effect",
        render: (value: string) => (
          <span className="font-semibold text-red-300">{value}</span>
        ),
      },
      {
        title: t("rules.sections.buffs.tableHeaders.impact"),
        dataIndex: "impact",
        key: "impact",
      },
    ],
    [t]
  );

  const tableClassName =
    "rounded-xl border border-gray-700 bg-gray-950/60 [&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!border-b-gray-700 [&_.ant-table-thead>tr>th]:!bg-transparent [&_.ant-table-thead>tr>th]:!text-gray-300 [&_.ant-table-tbody>tr>td]:!border-b-gray-800 [&_.ant-table-tbody>tr>td]:!bg-transparent [&_.ant-table-tbody>tr>td]:!text-gray-300";

  return (
    <div className="w-full space-y-5">
      <header className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 backdrop-blur-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isModal ? (
              <RogueTag className="rounded-lg border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300">
                {t("rules.quickGuide")}
              </RogueTag>
            ) : (
              <RogueButton
                onClick={() => router.push("/")}
                className="!rounded-lg !border !border-gray-700 !bg-transparent !px-3 !py-1 !text-xs !font-semibold !text-gray-300 hover:!border-gray-500 hover:!text-white"
              >
                {"<-"} {t("rules.back")}
              </RogueButton>
            )}
          </div>

          {isModal && onClose && (
            <RogueButton
              onClick={onClose}
              className="!rounded-lg !border !border-gray-700 !bg-transparent !px-3 !py-1 !text-xs !font-semibold !text-gray-300 hover:!border-gray-500 hover:!text-white"
            >
              {t("rules.close")}
            </RogueButton>
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
              <RogueTable<InkTableRow>
                dataSource={inkTableData}
                columns={inkColumns}
                pagination={false}
                size="small"
                className={tableClassName}
              />
            </div>
          </div>
        </RuleBlock>

        <RuleBlock
          number="6"
          title={t("rules.sections.rooms.title")}
          emoji={t("rules.sections.rooms.emoji")}
        >
          <div className="overflow-x-auto">
            <RogueTable<RoomTableRow>
              dataSource={roomTableData}
              columns={roomColumns}
              pagination={false}
              size="small"
              className={tableClassName}
            />
          </div>
        </RuleBlock>

        <RuleBlock
          number="7"
          title={t("rules.sections.buffs.title")}
          emoji={t("rules.sections.buffs.emoji")}
        >
          <div className="overflow-x-auto">
            <RogueTable<BuffTableRow>
              dataSource={buffTableData}
              columns={buffColumns}
              pagination={false}
              size="small"
              className={tableClassName}
            />
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
    <RogueCollapse
      bordered={false}
      defaultActiveKey={defaultOpen ? [number] : []}
      items={[
        {
          key: number,
          label: (
            <div className="flex items-center gap-3">
              <span className="text-lg">{emoji}</span>
              <h2 className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
                {number}. {title}
              </h2>
            </div>
          ),
          children: <div className="mt-2">{children}</div>,
        },
      ]}
      className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm [&_.ant-collapse-content-box]:!px-4 [&_.ant-collapse-content-box]:!pb-4 [&_.ant-collapse-content-box]:!pt-0 [&_.ant-collapse-header]:!px-4 [&_.ant-collapse-header]:!py-4"
    />
  );
}
