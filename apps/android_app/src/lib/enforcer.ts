import ScreenlyEnforcer from '../modules/screenly-enforcer/src/ScreenlyEnforcerModule';
import { orpcClient } from './orpc';

export async function syncRules() {
  try {
    const rules = await orpcClient.listRules({});
    const activeRules = (rules as any[]).filter((r) => r.status === 'active');
    await ScreenlyEnforcer.updateRules(JSON.stringify(activeRules));
  } catch (e) {
    // A silent failure here leaves the device blocking on stale rules, which is
    // worse than logging — the enforcer would never learn about an unlock.
    console.error('[enforcer] failed to sync rules', (e as Error).message);
  }
}
