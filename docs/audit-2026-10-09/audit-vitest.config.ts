import { mergeConfig } from 'vitest/config';
import base from '../../vitest.config';
export default mergeConfig(base,{test:{include:['docs/audit-2026-10-09/reproduce-autosave.audit.tsx']}});
