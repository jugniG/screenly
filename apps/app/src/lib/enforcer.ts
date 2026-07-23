import ScreenlyEnforcer from '../modules/screenly-enforcer/src/ScreenlyEnforcerModule';
import { orpc } from './orpc';

export async function syncRules() {
  try {
    const rules = await orpc<Record<string, never>, any[]>('listRules');
    const activeRules = rules.filter(r => r.paymentStatus === 'completed' && r.enabled);
    await ScreenlyEnforcer.updateRules(JSON.stringify(activeRules));
  } catch {}
}

export async function unlockApp(packageName: string) {
  try {
    await ScreenlyEnforcer.unlockApp(packageName);
  } catch {}
}
