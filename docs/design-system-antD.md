# Design System AntD

## Goal

Use Ant Design as the default UI layer across the app, with project-specific wrappers and tokens.

## Source of truth

- Theme tokens: `src/lib/design-system/antd-theme.ts`
- Global provider: `src/components/providers/AntdProvider.tsx`
- Wrappers: `src/components/ui/rogue/*`

## Rules

1. New UI work must use `Rogue*` wrappers first.
2. Avoid direct `antd` imports in feature components.
3. Avoid new raw primitives (`<button>`, `<input>`, `<select>`, `<table>`) unless there is a documented exception.
4. Do not hardcode colors that already exist in theme tokens.
5. Keep shared visual styles in wrappers, not duplicated per screen.

## Wrapper mapping

- `RogueButton` -> `antd/Button`
- `RogueTag` -> `antd/Tag`
- `RogueInput` -> `antd/Input`
- `RogueTextArea` -> `antd/Input.TextArea`
- `RogueSelect` -> `antd/Select`
- `RogueTabs` -> `antd/Tabs`
- `RogueSegmented` -> `antd/Segmented`
- `RogueModal` -> `antd/Modal`
- `RogueTooltip` -> `antd/Tooltip`
- `RogueTable` -> `antd/Table`
- `RogueAlert` -> `antd/Alert`
- `RogueEmpty` -> `antd/Empty`
- `RogueCard` -> `antd/Card`
- `RoguePageHeader` -> composed page header primitive

## Migration strategy

1. Replace direct `antd` imports in feature screens with wrappers.
2. Migrate high-repetition areas first (`library`, `leaderboard`, `auth`).
3. Keep custom gameplay-heavy components where AntD would hurt UX or performance.
4. Remove deprecated `src/components/ui/*` after migration reaches zero usage.

## Verification

- Run: `npm run antd:first:check`
- Refresh baseline intentionally only after review: `npm run antd:first:update-baseline`
