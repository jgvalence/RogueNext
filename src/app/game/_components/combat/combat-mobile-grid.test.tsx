import { fireEvent, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { buildAllyDefsMap, buildEnemyDefsMap } from "@/game/data";
import type { CombatState, TurnDisruption } from "@/game/schemas/combat-state";
import type {
  AllyState,
  EnemyState,
  PlayerState,
} from "@/game/schemas/entities";
import { CombatMobileGrid } from "./combat-mobile-grid";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      options?: {
        defaultValue?: string;
      }
    ) => options?.defaultValue ?? key,
  }),
}));

const allyDefs = buildAllyDefsMap();
const enemyDefs = buildEnemyDefsMap();

function emptyDisruption(): TurnDisruption {
  return {
    extraCardCost: 0,
    drawPenalty: 0,
    drawsToDiscardRemaining: 0,
    freezeNextDrawsRemaining: 0,
    frozenHandCardIds: [],
    disabledInkPowers: [],
  };
}

function basePlayer(): PlayerState {
  return {
    currentHp: 40,
    maxHp: 40,
    block: 0,
    energyCurrent: 3,
    energyMax: 3,
    inkCurrent: 2,
    inkMax: 10,
    inkPerCardChance: 100,
    inkPerCardValue: 1,
    regenPerTurn: 0,
    firstHitDamageReductionPercent: 0,
    drawCount: 5,
    speed: 0,
    strength: 0,
    focus: 0,
    buffs: [],
  };
}

function buildAllyState(
  definitionId: string,
  instanceId: string,
  overrides: Partial<AllyState> = {}
): AllyState {
  const definition = allyDefs.get(definitionId);
  if (!definition) {
    throw new Error(`Missing ally definition ${definitionId}`);
  }

  return {
    instanceId,
    definitionId,
    name: definition.name,
    currentHp: definition.maxHp,
    maxHp: definition.maxHp,
    block: 0,
    speed: definition.speed,
    buffs: [],
    intentIndex: 0,
    ...overrides,
  };
}

function buildEnemyState(
  definitionId: string,
  instanceId: string,
  overrides: Partial<EnemyState> = {}
): EnemyState {
  const definition = enemyDefs.get(definitionId);
  if (!definition) {
    throw new Error(`Missing enemy definition ${definitionId}`);
  }

  return {
    instanceId,
    definitionId,
    name: definition.name,
    isBoss: definition.isBoss,
    isElite: definition.isElite,
    currentHp: definition.maxHp,
    maxHp: definition.maxHp,
    block: 0,
    speed: definition.speed,
    buffs: [],
    intentIndex: 0,
    ...overrides,
  };
}

function buildCombatState(overrides: Partial<CombatState> = {}): CombatState {
  return {
    floor: 1,
    difficultyLevel: 0,
    enemyDamageScale: 1,
    turnNumber: 1,
    phase: "PLAYER_TURN",
    player: basePlayer(),
    allies: [],
    enemies: [],
    drawPile: [],
    hand: [],
    discardPile: [],
    exhaustPile: [],
    pendingHandOverflowExhaust: 0,
    drawDebugHistory: [],
    inkPowerUsedThisTurn: false,
    firstHitReductionUsed: false,
    playerDisruption: emptyDisruption(),
    nextPlayerDisruption: emptyDisruption(),
    ...overrides,
  };
}

function renderGrid(
  combat: CombatState,
  props: Partial<ComponentProps<typeof CombatMobileGrid>> = {}
) {
  return render(
    <CombatMobileGrid
      combat={combat}
      allyDefs={allyDefs}
      enemyDefs={enemyDefs}
      selectingEnemyTarget={false}
      selectingAllyTarget={false}
      selfCanRetargetToAlly={false}
      selectedCardId={null}
      actingEnemyId={null}
      attackingEnemyId={null}
      isSelectingCheatKillTarget={false}
      newlySummonedIds={new Set()}
      enemyArtFailures={
        new Set(combat.enemies.map((enemy) => enemy.definitionId))
      }
      attackBonus={0}
      playerHit={false}
      avatarFailed={true}
      onAvatarError={vi.fn()}
      onMobileAllyPress={vi.fn()}
      onMobileEnemyPress={vi.fn()}
      onOpenPlayerInfo={vi.fn()}
      getEnemyDisplayName={(enemy) => enemy.name}
      markEnemyArtFailure={vi.fn()}
      isArmorTutorialStep={false}
      aoeFlashMap={new Map()}
      incomingDamageByEnemyId={new Map()}
      {...props}
    />
  );
}

describe("CombatMobileGrid mobile slot layout", () => {
  it("keeps hero inspection and every living enemy reachable without duplicate targets", () => {
    const onOpenPlayerInfo = vi.fn();
    const onMobileEnemyPress = vi.fn();
    const combat = buildCombatState({
      enemies: Array.from({ length: 5 }, (_, i) =>
        buildEnemyState("ink_slime", `enemy-${i}`, {
          currentHp: i === 0 ? 0 : 10,
        })
      ),
    });
    const { container } = renderGrid(combat, {
      characterId: "griot",
      onOpenPlayerInfo,
      onMobileEnemyPress,
    });
    expect(container.querySelector(".mobile-hero-name")).toHaveTextContent(
      "characters.griot.name"
    );
    fireEvent.click(container.querySelector(".mobile-player-summary")!);
    expect(onOpenPlayerInfo).toHaveBeenCalledOnce();
    expect(container.querySelectorAll("[data-enemy-id]")).toHaveLength(5);
    fireEvent.click(container.querySelector('[data-enemy-id="enemy-0"]')!);
    expect(onMobileEnemyPress).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('[data-enemy-id="enemy-4"]')!);
    expect(onMobileEnemyPress).toHaveBeenCalledWith("enemy-4");
  });

  it("shows the hidden-intent label without exposing an elite's attack on D3", () => {
    const combat = buildCombatState({
      difficultyLevel: 3,
      turnNumber: 3,
      enemies: [buildEnemyState("ink_slime", "elite", { isElite: true })],
    });
    const { container } = renderGrid(combat);
    expect(container.querySelector(".mobile-enemy-intent")).toHaveTextContent(
      "enemyCard.intentHidden"
    );
    expect(
      container.querySelector('[data-enemy-id="elite"]')
    ).toHaveAccessibleName(expect.stringContaining("enemyCard.intentHidden"));
  });

  it("keeps allies and enemies on separate readable rails for five occupied slots", () => {
    const combat = buildCombatState({
      allies: [buildAllyState("ink_familiar", "ally-1")],
      enemies: [
        buildEnemyState("ink_slime", "enemy-1"),
        buildEnemyState("paper_golem", "enemy-2"),
        buildEnemyState("tome_wraith", "enemy-3"),
      ],
    });

    const { container } = renderGrid(combat);
    const rows = Array.from(
      container.querySelectorAll("[data-mobile-row]")
    ).map((row) => row.getAttribute("data-mobile-row"));

    expect(rows).toEqual(["3", "2"]);
    expect(container.querySelectorAll('[data-mobile-row="1"]')).toHaveLength(0);
  });

  it("keeps the battlefield to team rails instead of fragmenting crowded encounters", () => {
    const combat = buildCombatState({
      allies: [
        buildAllyState("ink_familiar", "ally-1"),
        buildAllyState("scribe_apprentice", "ally-2"),
      ],
      enemies: [
        buildEnemyState("ink_slime", "enemy-1"),
        buildEnemyState("paper_golem", "enemy-2"),
        buildEnemyState("tome_wraith", "enemy-3"),
        buildEnemyState("scroll_serpent", "enemy-4"),
      ],
    });

    const { container } = renderGrid(combat);
    const rows = Array.from(
      container.querySelectorAll("[data-mobile-row]")
    ).map((row) => row.getAttribute("data-mobile-row"));

    expect(rows).toEqual(["4", "3"]);
    expect(container.querySelectorAll('[data-mobile-row="1"]')).toHaveLength(0);
  });
});
