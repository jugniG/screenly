import ScreenlyEnforcer from '../modules/screenly-enforcer/src/ScreenlyEnforcerModule';
import { orpc } from './orpc';

export async function syncRules() {
  try {
    const rules = await orpc<Record<string, never>, any[]>('listRules');
    await ScreenlyEnforcer.updateRules(JSON.stringify(rules));
  } catch {}
}

export async function unlockApp(packageName: string) {
  try {
    await ScreenlyEnforcer.unlockApp(packageName);
  } catch {}
}
