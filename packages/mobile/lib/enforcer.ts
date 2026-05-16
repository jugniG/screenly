import ScreenlyEnforcer from '../modules/screenly-enforcer/src/ScreenlyEnforcerModule';
import { apiFetch } from './fetchApi';

export async function syncRules() {
  try {
    const res = await apiFetch('/api/rules');
    if (res.ok) {
      const rules = await res.json();
      await ScreenlyEnforcer.updateRules(JSON.stringify(rules));
    }
  } catch {}
}

export async function unlockApp(packageName: string, minutes: number = 30) {
  try {
    await ScreenlyEnforcer.unlockAppForMinutes(packageName, minutes);
  } catch {}
}
