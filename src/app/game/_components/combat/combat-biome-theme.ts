import type { BiomeType } from "@/game/schemas/enums";

export interface CombatBiomeTheme {
  sceneBase: string;
  sceneAtmosphere: string;
  sceneTopGlow: string;
  sceneBottomGlow: string;
  turnChip: string;
  turnFrame: string;
  summonBanner: string;
  playerZoneShell: string;
  playerZoneRule: string;
  sidePanelShell: string;
  sidePanelTitle: string;
  pileButton: string;
  pileButtonValue: string;
  inventoryButton: string;
  inventoryButtonSelected: string;
  endTurnReady: string;
  endTurnDisabled: string;
  inkGaugeShell: string;
  inkGaugeLabel: string;
  inkGaugeFill: string;
  inkPowerReady: string;
  drawerShell: string;
  drawerHandle: string;
  drawerClose: string;
}

const DISABLED_ACTION_CLASS =
  "cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-500 opacity-50";

export const COMBAT_BIOME_THEMES: Record<BiomeType, CombatBiomeTheme> = {
  LIBRARY: {
    sceneBase:
      "bg-[linear-gradient(180deg,#04070d_0%,#0a1119_45%,#171109_100%)]",
    sceneAtmosphere:
      "bg-[radial-gradient(ellipse_88%_60%_at_50%_12%,rgba(245,158,11,0.16),transparent_60%),radial-gradient(ellipse_52%_26%_at_50%_78%,rgba(120,53,15,0.18),transparent_82%)]",
    sceneTopGlow: "from-amber-300/12 via-amber-500/6 to-transparent",
    sceneBottomGlow: "from-[#16100b]/90 via-[#0c1118]/35 to-transparent",
    turnChip: "border-amber-300/20 bg-amber-500/10 text-amber-100",
    turnFrame:
      "border border-amber-400/20 shadow-[0_0_18px_rgba(245,158,11,0.08)]",
    summonBanner:
      "border-amber-400/55 bg-amber-950/82 text-amber-100 shadow-[0_10px_24px_rgba(120,53,15,0.28)]",
    playerZoneShell:
      "border-t border-amber-400/20 bg-[linear-gradient(180deg,rgba(10,12,18,0.96),rgba(20,14,10,0.96))]",
    playerZoneRule: "border-amber-300/10",
    sidePanelShell:
      "border border-amber-400/25 bg-gradient-to-b from-amber-950/32 to-slate-900/84 shadow-[0_0_20px_rgba(245,158,11,0.10)]",
    sidePanelTitle: "text-amber-200/80",
    pileButton:
      "border-amber-300/22 bg-amber-400/10 hover:border-amber-200/45 hover:bg-amber-400/14 shadow-[0_10px_20px_rgba(120,53,15,0.18)]",
    pileButtonValue: "text-amber-50",
    inventoryButton:
      "!border-amber-500/35 !bg-amber-950/40 !text-amber-100 hover:!border-amber-300/55 hover:!bg-amber-900/45",
    inventoryButtonSelected:
      "!border-amber-200/60 !bg-amber-500/26 !text-amber-50 !shadow-[0_0_16px_rgba(245,158,11,0.18)]",
    endTurnReady:
      "border border-amber-200/30 bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-[0_0_18px_rgba(245,158,11,0.35)] hover:from-amber-500 hover:to-orange-400",
    endTurnDisabled: DISABLED_ACTION_CLASS,
    inkGaugeShell: "border-amber-400/25 bg-amber-950/28",
    inkGaugeLabel: "text-amber-200/85",
    inkGaugeFill: "bg-amber-400",
    inkPowerReady:
      "!border-amber-200/35 !bg-amber-500/18 !text-amber-50 hover:!bg-amber-500/28",
    drawerShell: "border-amber-400/35 bg-slate-950/96",
    drawerHandle: "bg-amber-200/30",
    drawerClose:
      "!border-amber-400/30 !bg-amber-950/35 !text-amber-100 hover:!border-amber-200/50",
  },
  VIKING: {
    sceneBase:
      "bg-[linear-gradient(180deg,#030711_0%,#081728_45%,#0d1f2b_100%)]",
    sceneAtmosphere:
      "bg-[radial-gradient(ellipse_88%_60%_at_50%_10%,rgba(103,232,249,0.16),transparent_58%),radial-gradient(ellipse_58%_24%_at_50%_78%,rgba(14,116,144,0.18),transparent_84%)]",
    sceneTopGlow: "from-cyan-200/12 via-sky-400/8 to-transparent",
    sceneBottomGlow: "from-[#091622]/92 via-[#08111a]/36 to-transparent",
    turnChip: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
    turnFrame:
      "border border-cyan-300/18 shadow-[0_0_18px_rgba(34,211,238,0.10)]",
    summonBanner:
      "border-cyan-300/55 bg-sky-950/82 text-cyan-100 shadow-[0_10px_24px_rgba(8,47,73,0.30)]",
    playerZoneShell:
      "border-t border-cyan-300/20 bg-[linear-gradient(180deg,rgba(6,12,20,0.96),rgba(8,25,39,0.96))]",
    playerZoneRule: "border-cyan-300/10",
    sidePanelShell:
      "border border-cyan-300/22 bg-gradient-to-b from-sky-950/34 to-slate-900/86 shadow-[0_0_20px_rgba(34,211,238,0.10)]",
    sidePanelTitle: "text-cyan-200/80",
    pileButton:
      "border-cyan-300/22 bg-cyan-400/10 hover:border-cyan-200/45 hover:bg-cyan-400/14 shadow-[0_10px_20px_rgba(8,145,178,0.18)]",
    pileButtonValue: "text-cyan-50",
    inventoryButton:
      "!border-cyan-400/35 !bg-sky-950/40 !text-cyan-100 hover:!border-cyan-200/55 hover:!bg-sky-900/45",
    inventoryButtonSelected:
      "!border-cyan-100/60 !bg-cyan-500/24 !text-cyan-50 !shadow-[0_0_16px_rgba(34,211,238,0.18)]",
    endTurnReady:
      "border border-cyan-200/30 bg-gradient-to-r from-sky-700 to-cyan-500 text-white shadow-[0_0_18px_rgba(14,165,233,0.32)] hover:from-sky-600 hover:to-cyan-400",
    endTurnDisabled: DISABLED_ACTION_CLASS,
    inkGaugeShell: "border-cyan-300/25 bg-sky-950/28",
    inkGaugeLabel: "text-cyan-200/85",
    inkGaugeFill: "bg-cyan-400",
    inkPowerReady:
      "!border-cyan-200/35 !bg-cyan-500/18 !text-cyan-50 hover:!bg-cyan-500/28",
    drawerShell: "border-cyan-300/35 bg-slate-950/96",
    drawerHandle: "bg-cyan-200/30",
    drawerClose:
      "!border-cyan-300/30 !bg-sky-950/35 !text-cyan-100 hover:!border-cyan-100/50",
  },
  GREEK: {
    sceneBase:
      "bg-[linear-gradient(180deg,#060913_0%,#101a37_46%,#1a1425_100%)]",
    sceneAtmosphere:
      "bg-[radial-gradient(ellipse_88%_60%_at_50%_10%,rgba(125,211,252,0.16),transparent_58%),radial-gradient(ellipse_56%_24%_at_50%_78%,rgba(250,204,21,0.16),transparent_84%)]",
    sceneTopGlow: "from-sky-200/12 via-yellow-300/8 to-transparent",
    sceneBottomGlow: "from-[#151021]/92 via-[#0c1220]/36 to-transparent",
    turnChip: "border-sky-300/20 bg-sky-400/10 text-sky-100",
    turnFrame:
      "border border-sky-300/18 shadow-[0_0_18px_rgba(56,189,248,0.10)]",
    summonBanner:
      "border-sky-300/55 bg-indigo-950/82 text-sky-100 shadow-[0_10px_24px_rgba(30,41,59,0.32)]",
    playerZoneShell:
      "border-t border-sky-300/20 bg-[linear-gradient(180deg,rgba(7,12,22,0.96),rgba(18,19,38,0.96))]",
    playerZoneRule: "border-sky-300/10",
    sidePanelShell:
      "border border-sky-300/22 bg-gradient-to-b from-indigo-950/32 to-slate-900/86 shadow-[0_0_20px_rgba(56,189,248,0.10)]",
    sidePanelTitle: "text-sky-200/80",
    pileButton:
      "border-sky-300/22 bg-sky-400/10 hover:border-sky-200/45 hover:bg-sky-400/14 shadow-[0_10px_20px_rgba(14,165,233,0.18)]",
    pileButtonValue: "text-sky-50",
    inventoryButton:
      "!border-sky-400/35 !bg-indigo-950/40 !text-sky-100 hover:!border-sky-200/55 hover:!bg-indigo-900/45",
    inventoryButtonSelected:
      "!border-sky-100/60 !bg-sky-500/24 !text-sky-50 !shadow-[0_0_16px_rgba(56,189,248,0.18)]",
    endTurnReady:
      "border border-sky-200/30 bg-gradient-to-r from-sky-700 to-blue-500 text-white shadow-[0_0_18px_rgba(56,189,248,0.30)] hover:from-sky-600 hover:to-blue-400",
    endTurnDisabled: DISABLED_ACTION_CLASS,
    inkGaugeShell: "border-sky-300/25 bg-indigo-950/28",
    inkGaugeLabel: "text-sky-200/85",
    inkGaugeFill: "bg-sky-400",
    inkPowerReady:
      "!border-sky-200/35 !bg-sky-500/18 !text-sky-50 hover:!bg-sky-500/28",
    drawerShell: "border-sky-300/35 bg-slate-950/96",
    drawerHandle: "bg-sky-200/30",
    drawerClose:
      "!border-sky-300/30 !bg-indigo-950/35 !text-sky-100 hover:!border-sky-100/50",
  },
  EGYPTIAN: {
    sceneBase:
      "bg-[linear-gradient(180deg,#09070b_0%,#1c1109_44%,#2d1809_100%)]",
    sceneAtmosphere:
      "bg-[radial-gradient(ellipse_88%_60%_at_50%_10%,rgba(251,191,36,0.17),transparent_58%),radial-gradient(ellipse_60%_24%_at_50%_80%,rgba(249,115,22,0.16),transparent_84%)]",
    sceneTopGlow: "from-yellow-200/12 via-orange-300/8 to-transparent",
    sceneBottomGlow: "from-[#221308]/94 via-[#120d0b]/36 to-transparent",
    turnChip: "border-yellow-300/22 bg-yellow-400/10 text-yellow-100",
    turnFrame:
      "border border-yellow-300/20 shadow-[0_0_18px_rgba(251,191,36,0.10)]",
    summonBanner:
      "border-yellow-300/55 bg-orange-950/84 text-yellow-100 shadow-[0_10px_24px_rgba(124,45,18,0.32)]",
    playerZoneShell:
      "border-t border-yellow-300/20 bg-[linear-gradient(180deg,rgba(12,10,14,0.96),rgba(31,19,10,0.96))]",
    playerZoneRule: "border-yellow-300/10",
    sidePanelShell:
      "border border-yellow-300/24 bg-gradient-to-b from-yellow-950/30 to-slate-900/86 shadow-[0_0_20px_rgba(251,191,36,0.11)]",
    sidePanelTitle: "text-yellow-200/82",
    pileButton:
      "border-yellow-300/22 bg-yellow-400/10 hover:border-yellow-200/45 hover:bg-yellow-400/14 shadow-[0_10px_20px_rgba(249,115,22,0.18)]",
    pileButtonValue: "text-yellow-50",
    inventoryButton:
      "!border-yellow-400/35 !bg-yellow-950/36 !text-yellow-100 hover:!border-yellow-200/55 hover:!bg-orange-950/42",
    inventoryButtonSelected:
      "!border-yellow-100/60 !bg-yellow-500/24 !text-yellow-50 !shadow-[0_0_16px_rgba(251,191,36,0.18)]",
    endTurnReady:
      "border border-yellow-200/32 bg-gradient-to-r from-yellow-600 to-orange-500 text-white shadow-[0_0_18px_rgba(251,191,36,0.34)] hover:from-yellow-500 hover:to-orange-400",
    endTurnDisabled: DISABLED_ACTION_CLASS,
    inkGaugeShell: "border-yellow-300/25 bg-yellow-950/26",
    inkGaugeLabel: "text-yellow-200/85",
    inkGaugeFill: "bg-yellow-400",
    inkPowerReady:
      "!border-yellow-200/35 !bg-yellow-500/18 !text-yellow-50 hover:!bg-yellow-500/28",
    drawerShell: "border-yellow-300/35 bg-slate-950/96",
    drawerHandle: "bg-yellow-200/30",
    drawerClose:
      "!border-yellow-300/30 !bg-yellow-950/35 !text-yellow-100 hover:!border-yellow-100/50",
  },
  LOVECRAFTIAN: {
    sceneBase:
      "bg-[linear-gradient(180deg,#04070b_0%,#081418_42%,#111024_100%)]",
    sceneAtmosphere:
      "bg-[radial-gradient(ellipse_88%_60%_at_50%_10%,rgba(16,185,129,0.14),transparent_58%),radial-gradient(ellipse_56%_24%_at_50%_78%,rgba(168,85,247,0.16),transparent_84%)]",
    sceneTopGlow: "from-emerald-200/10 via-violet-300/8 to-transparent",
    sceneBottomGlow: "from-[#120f1d]/94 via-[#081218]/36 to-transparent",
    turnChip: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    turnFrame:
      "border border-emerald-300/18 shadow-[0_0_18px_rgba(16,185,129,0.10)]",
    summonBanner:
      "border-emerald-300/45 bg-emerald-950/82 text-emerald-100 shadow-[0_10px_24px_rgba(6,78,59,0.32)]",
    playerZoneShell:
      "border-t border-emerald-300/20 bg-[linear-gradient(180deg,rgba(8,11,18,0.96),rgba(9,22,22,0.96))]",
    playerZoneRule: "border-emerald-300/10",
    sidePanelShell:
      "border border-emerald-300/22 bg-gradient-to-b from-emerald-950/28 to-slate-900/86 shadow-[0_0_20px_rgba(16,185,129,0.10)]",
    sidePanelTitle: "text-emerald-200/80",
    pileButton:
      "border-emerald-300/22 bg-emerald-400/10 hover:border-emerald-200/45 hover:bg-emerald-400/14 shadow-[0_10px_20px_rgba(5,150,105,0.18)]",
    pileButtonValue: "text-emerald-50",
    inventoryButton:
      "!border-emerald-400/35 !bg-emerald-950/36 !text-emerald-100 hover:!border-emerald-200/55 hover:!bg-emerald-900/42",
    inventoryButtonSelected:
      "!border-emerald-100/60 !bg-emerald-500/22 !text-emerald-50 !shadow-[0_0_16px_rgba(16,185,129,0.18)]",
    endTurnReady:
      "border border-emerald-200/30 bg-gradient-to-r from-emerald-700 to-teal-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.30)] hover:from-emerald-600 hover:to-teal-400",
    endTurnDisabled: DISABLED_ACTION_CLASS,
    inkGaugeShell: "border-emerald-300/25 bg-emerald-950/24",
    inkGaugeLabel: "text-emerald-200/85",
    inkGaugeFill: "bg-emerald-400",
    inkPowerReady:
      "!border-emerald-200/35 !bg-emerald-500/18 !text-emerald-50 hover:!bg-emerald-500/28",
    drawerShell: "border-emerald-300/35 bg-slate-950/96",
    drawerHandle: "bg-emerald-200/30",
    drawerClose:
      "!border-emerald-300/30 !bg-emerald-950/35 !text-emerald-100 hover:!border-emerald-100/50",
  },
  AZTEC: {
    sceneBase:
      "bg-[linear-gradient(180deg,#0a0707_0%,#1c0f0a_44%,#1d1a0d_100%)]",
    sceneAtmosphere:
      "bg-[radial-gradient(ellipse_88%_60%_at_50%_10%,rgba(251,146,60,0.15),transparent_58%),radial-gradient(ellipse_58%_24%_at_50%_80%,rgba(34,197,94,0.12),transparent_84%)]",
    sceneTopGlow: "from-orange-200/12 via-emerald-300/6 to-transparent",
    sceneBottomGlow: "from-[#1d1309]/94 via-[#110d0d]/36 to-transparent",
    turnChip: "border-orange-300/22 bg-orange-400/10 text-orange-100",
    turnFrame:
      "border border-orange-300/20 shadow-[0_0_18px_rgba(249,115,22,0.10)]",
    summonBanner:
      "border-orange-300/55 bg-orange-950/84 text-orange-100 shadow-[0_10px_24px_rgba(124,45,18,0.32)]",
    playerZoneShell:
      "border-t border-orange-300/20 bg-[linear-gradient(180deg,rgba(10,10,14,0.96),rgba(28,16,10,0.96))]",
    playerZoneRule: "border-orange-300/10",
    sidePanelShell:
      "border border-orange-300/24 bg-gradient-to-b from-orange-950/30 to-slate-900/86 shadow-[0_0_20px_rgba(249,115,22,0.10)]",
    sidePanelTitle: "text-orange-200/82",
    pileButton:
      "border-orange-300/22 bg-orange-400/10 hover:border-orange-200/45 hover:bg-orange-400/14 shadow-[0_10px_20px_rgba(249,115,22,0.18)]",
    pileButtonValue: "text-orange-50",
    inventoryButton:
      "!border-orange-400/35 !bg-orange-950/38 !text-orange-100 hover:!border-orange-200/55 hover:!bg-orange-900/44",
    inventoryButtonSelected:
      "!border-orange-100/60 !bg-orange-500/24 !text-orange-50 !shadow-[0_0_16px_rgba(249,115,22,0.18)]",
    endTurnReady:
      "border border-orange-200/32 bg-gradient-to-r from-orange-700 to-amber-500 text-white shadow-[0_0_18px_rgba(249,115,22,0.32)] hover:from-orange-600 hover:to-amber-400",
    endTurnDisabled: DISABLED_ACTION_CLASS,
    inkGaugeShell: "border-orange-300/25 bg-orange-950/24",
    inkGaugeLabel: "text-orange-200/85",
    inkGaugeFill: "bg-orange-400",
    inkPowerReady:
      "!border-orange-200/35 !bg-orange-500/18 !text-orange-50 hover:!bg-orange-500/28",
    drawerShell: "border-orange-300/35 bg-slate-950/96",
    drawerHandle: "bg-orange-200/30",
    drawerClose:
      "!border-orange-300/30 !bg-orange-950/35 !text-orange-100 hover:!border-orange-100/50",
  },
  CELTIC: {
    sceneBase:
      "bg-[linear-gradient(180deg,#04090a_0%,#0b1711_44%,#101e12_100%)]",
    sceneAtmosphere:
      "bg-[radial-gradient(ellipse_88%_60%_at_50%_10%,rgba(74,222,128,0.14),transparent_58%),radial-gradient(ellipse_56%_24%_at_50%_80%,rgba(163,230,53,0.12),transparent_84%)]",
    sceneTopGlow: "from-emerald-200/10 via-lime-300/8 to-transparent",
    sceneBottomGlow: "from-[#0f1a10]/94 via-[#0a1110]/36 to-transparent",
    turnChip: "border-emerald-300/22 bg-emerald-400/10 text-emerald-100",
    turnFrame:
      "border border-emerald-300/18 shadow-[0_0_18px_rgba(74,222,128,0.10)]",
    summonBanner:
      "border-emerald-300/50 bg-emerald-950/84 text-emerald-100 shadow-[0_10px_24px_rgba(6,78,59,0.30)]",
    playerZoneShell:
      "border-t border-emerald-300/20 bg-[linear-gradient(180deg,rgba(8,12,18,0.96),rgba(10,23,16,0.96))]",
    playerZoneRule: "border-emerald-300/10",
    sidePanelShell:
      "border border-emerald-300/24 bg-gradient-to-b from-emerald-950/28 to-slate-900/86 shadow-[0_0_20px_rgba(74,222,128,0.10)]",
    sidePanelTitle: "text-emerald-200/82",
    pileButton:
      "border-emerald-300/22 bg-emerald-400/10 hover:border-emerald-200/45 hover:bg-emerald-400/14 shadow-[0_10px_20px_rgba(16,185,129,0.18)]",
    pileButtonValue: "text-emerald-50",
    inventoryButton:
      "!border-emerald-400/35 !bg-emerald-950/38 !text-emerald-100 hover:!border-emerald-200/55 hover:!bg-emerald-900/44",
    inventoryButtonSelected:
      "!border-emerald-100/60 !bg-emerald-500/22 !text-emerald-50 !shadow-[0_0_16px_rgba(74,222,128,0.18)]",
    endTurnReady:
      "border border-emerald-200/30 bg-gradient-to-r from-emerald-700 to-lime-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.30)] hover:from-emerald-600 hover:to-lime-400",
    endTurnDisabled: DISABLED_ACTION_CLASS,
    inkGaugeShell: "border-emerald-300/25 bg-emerald-950/24",
    inkGaugeLabel: "text-emerald-200/85",
    inkGaugeFill: "bg-emerald-400",
    inkPowerReady:
      "!border-emerald-200/35 !bg-emerald-500/18 !text-emerald-50 hover:!bg-emerald-500/28",
    drawerShell: "border-emerald-300/35 bg-slate-950/96",
    drawerHandle: "bg-emerald-200/30",
    drawerClose:
      "!border-emerald-300/30 !bg-emerald-950/35 !text-emerald-100 hover:!border-emerald-100/50",
  },
  RUSSIAN: {
    sceneBase:
      "bg-[linear-gradient(180deg,#05060d_0%,#13192b_42%,#1a1020_100%)]",
    sceneAtmosphere:
      "bg-[radial-gradient(ellipse_88%_60%_at_50%_10%,rgba(186,230,253,0.14),transparent_58%),radial-gradient(ellipse_58%_24%_at_50%_80%,rgba(244,63,94,0.12),transparent_84%)]",
    sceneTopGlow: "from-sky-100/10 via-rose-300/8 to-transparent",
    sceneBottomGlow: "from-[#15101d]/94 via-[#0b1220]/36 to-transparent",
    turnChip: "border-rose-300/20 bg-rose-400/10 text-rose-100",
    turnFrame:
      "border border-rose-300/18 shadow-[0_0_18px_rgba(244,63,94,0.10)]",
    summonBanner:
      "border-rose-300/50 bg-rose-950/84 text-rose-100 shadow-[0_10px_24px_rgba(76,5,25,0.34)]",
    playerZoneShell:
      "border-t border-rose-300/20 bg-[linear-gradient(180deg,rgba(8,11,18,0.96),rgba(20,12,24,0.96))]",
    playerZoneRule: "border-rose-300/10",
    sidePanelShell:
      "border border-rose-300/24 bg-gradient-to-b from-rose-950/28 to-slate-900/86 shadow-[0_0_20px_rgba(244,63,94,0.10)]",
    sidePanelTitle: "text-rose-200/82",
    pileButton:
      "border-rose-300/22 bg-rose-400/10 hover:border-rose-200/45 hover:bg-rose-400/14 shadow-[0_10px_20px_rgba(190,24,93,0.18)]",
    pileButtonValue: "text-rose-50",
    inventoryButton:
      "!border-rose-400/35 !bg-rose-950/38 !text-rose-100 hover:!border-rose-200/55 hover:!bg-rose-900/44",
    inventoryButtonSelected:
      "!border-rose-100/60 !bg-rose-500/22 !text-rose-50 !shadow-[0_0_16px_rgba(244,63,94,0.18)]",
    endTurnReady:
      "border border-rose-200/30 bg-gradient-to-r from-rose-700 to-red-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.30)] hover:from-rose-600 hover:to-red-400",
    endTurnDisabled: DISABLED_ACTION_CLASS,
    inkGaugeShell: "border-rose-300/25 bg-rose-950/22",
    inkGaugeLabel: "text-rose-200/85",
    inkGaugeFill: "bg-rose-400",
    inkPowerReady:
      "!border-rose-200/35 !bg-rose-500/18 !text-rose-50 hover:!bg-rose-500/28",
    drawerShell: "border-rose-300/35 bg-slate-950/96",
    drawerHandle: "bg-rose-200/30",
    drawerClose:
      "!border-rose-300/30 !bg-rose-950/35 !text-rose-100 hover:!border-rose-100/50",
  },
  AFRICAN: {
    sceneBase:
      "bg-[linear-gradient(180deg,#090708_0%,#1a100d_44%,#2a170f_100%)]",
    sceneAtmosphere:
      "bg-[radial-gradient(ellipse_88%_60%_at_50%_10%,rgba(251,191,36,0.15),transparent_58%),radial-gradient(ellipse_56%_24%_at_50%_80%,rgba(217,119,6,0.14),transparent_84%)]",
    sceneTopGlow: "from-amber-200/12 via-orange-300/6 to-transparent",
    sceneBottomGlow: "from-[#21130d]/94 via-[#120d0c]/36 to-transparent",
    turnChip: "border-amber-300/22 bg-amber-400/10 text-amber-100",
    turnFrame:
      "border border-amber-300/20 shadow-[0_0_18px_rgba(251,191,36,0.10)]",
    summonBanner:
      "border-amber-300/55 bg-amber-950/84 text-amber-100 shadow-[0_10px_24px_rgba(120,53,15,0.30)]",
    playerZoneShell:
      "border-t border-amber-300/20 bg-[linear-gradient(180deg,rgba(10,11,18,0.96),rgba(28,16,10,0.96))]",
    playerZoneRule: "border-amber-300/10",
    sidePanelShell:
      "border border-amber-300/24 bg-gradient-to-b from-amber-950/28 to-slate-900/86 shadow-[0_0_20px_rgba(251,191,36,0.10)]",
    sidePanelTitle: "text-amber-200/82",
    pileButton:
      "border-amber-300/22 bg-amber-400/10 hover:border-amber-200/45 hover:bg-amber-400/14 shadow-[0_10px_20px_rgba(217,119,6,0.18)]",
    pileButtonValue: "text-amber-50",
    inventoryButton:
      "!border-amber-400/35 !bg-amber-950/38 !text-amber-100 hover:!border-amber-200/55 hover:!bg-amber-900/44",
    inventoryButtonSelected:
      "!border-amber-100/60 !bg-amber-500/22 !text-amber-50 !shadow-[0_0_16px_rgba(251,191,36,0.18)]",
    endTurnReady:
      "border border-amber-200/32 bg-gradient-to-r from-amber-700 to-orange-500 text-white shadow-[0_0_18px_rgba(245,158,11,0.30)] hover:from-amber-600 hover:to-orange-400",
    endTurnDisabled: DISABLED_ACTION_CLASS,
    inkGaugeShell: "border-amber-300/25 bg-amber-950/24",
    inkGaugeLabel: "text-amber-200/85",
    inkGaugeFill: "bg-amber-400",
    inkPowerReady:
      "!border-amber-200/35 !bg-amber-500/18 !text-amber-50 hover:!bg-amber-500/28",
    drawerShell: "border-amber-300/35 bg-slate-950/96",
    drawerHandle: "bg-amber-200/30",
    drawerClose:
      "!border-amber-300/30 !bg-amber-950/35 !text-amber-100 hover:!border-amber-100/50",
  },
};

export function getCombatBiomeTheme(biome: BiomeType): CombatBiomeTheme {
  return COMBAT_BIOME_THEMES[biome];
}
