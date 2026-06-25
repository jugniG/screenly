import 'react-native-get-random-values';
import { Buffer } from 'buffer';

(global as any).Buffer = Buffer;
(globalThis as any).Buffer = Buffer;
