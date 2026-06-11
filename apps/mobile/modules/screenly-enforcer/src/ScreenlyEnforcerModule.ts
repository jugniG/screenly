import { requireNativeModule } from 'expo-modules-core';
import type { ScreenlyEnforcerModule } from './ScreenlyEnforcer.types';

export default requireNativeModule<ScreenlyEnforcerModule>('ScreenlyEnforcer');
