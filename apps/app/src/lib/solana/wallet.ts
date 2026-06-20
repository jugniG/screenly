import { Keypair } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WALLET_KEY = 'screenly_solana_wallet';

export async function loadOrCreateWallet(): Promise<Keypair> {
  try {
    const stored = await AsyncStorage.getItem(WALLET_KEY);
    if (stored) {
      const secret = Uint8Array.from(JSON.parse(stored));
      return Keypair.fromSecretKey(secret);
    }
  } catch {}

  const wallet = Keypair.generate();
  await AsyncStorage.setItem(WALLET_KEY, JSON.stringify(Array.from(wallet.secretKey)));
  return wallet;
}

export async function getWallet(): Promise<Keypair | null> {
  try {
    const stored = await AsyncStorage.getItem(WALLET_KEY);
    if (!stored) return null;
    const secret = Uint8Array.from(JSON.parse(stored));
    return Keypair.fromSecretKey(secret);
  } catch {
    return null;
  }
}

export function walletAddress(wallet: Keypair): string {
  return wallet.publicKey.toBase58();
}
