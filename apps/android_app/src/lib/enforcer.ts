import ScreenlyEnforcer from '../modules/screenly-enforcer/src/ScreenlyEnforcerModule';
import { orpcClient } from './orpc';

export async function syncRules() {
  try {
    const rules = await orpcClient.listRules({});
    const activeRules = (rules as any[]).filter((r) => r.paymentStatus === 'completed' && r.enabled);
    await ScreenlyEnforcer.updateRules(JSON.stringify(activeRules));
  } catch {}
}

export async function unlockApp(packageName: string) {
  try {
    await ScreenlyEnforcer.unlockApp(packageName);
  } catch {}
}
