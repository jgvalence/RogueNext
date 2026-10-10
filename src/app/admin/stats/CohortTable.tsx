"use client";
import { RogueTable } from "@/components/ui/rogue";
import type { summarizeAnalyticsCohorts } from "@/game/engine/analytics-cohorts";

type Cohort = ReturnType<typeof summarizeAnalyticsCohorts>[number];
export function CohortTable({ cohorts }: { cohorts: Cohort[] }) {
  return (
    <RogueTable<Cohort>
      rowKey="label"
      size="small"
      dataSource={cohorts}
      pagination={{ pageSize: 20 }}
      scroll={{ x: 1000 }}
      columns={[
        {
          title: "Version / personnage / difficulté / méta / expérience",
          dataIndex: "label",
          width: 420,
        },
        { title: "N", dataIndex: "runs" },
        {
          title: "Victoires",
          dataIndex: "winRate",
          render: (value: number | null) =>
            value == null ? "n/a" : `${(value * 100).toFixed(1)}%`,
        },
        { title: "Abandons", dataIndex: "abandoned" },
        {
          title: "Offres / passes",
          render: (_value: unknown, group: Cohort) =>
            `${group.offers} / ${group.skipped}`,
        },
        { title: "Tours sans carte", dataIndex: "cardless" },
        { title: "Objets restants", dataIndex: "unusedItems" },
        { title: "Alliés perdus", dataIndex: "alliesLost" },
      ]}
    />
  );
}
