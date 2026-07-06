// ── Solana Program & Token Config ──────────────────────────────────
//
// Set via .env in packages/mobile/:
//   EXPO_PUBLIC_SOLANA_ESCROW_PROGRAM_ID
//   EXPO_PUBLIC_SOLANA_USDC_MINT
//   EXPO_PUBLIC_SOLANA_VAULT_ATA
//
// USDC on Solana mainnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

import { PublicKey } from '@solana/web3.js';

function getEnv(key: string): string {
  return process.env[key] || '';
}

export const ESCROW_PROGRAM_ID = (() => {
  const val = getEnv('EXPO_PUBLIC_SOLANA_ESCROW_PROGRAM_ID');
  return val ? new PublicKey(val) : null;
})();

export const USDC_MINT = (() => {
  const val = getEnv('EXPO_PUBLIC_SOLANA_USDC_MINT');
  return val ? new PublicKey(val) : null;
})();

export const VAULT_TOKEN_ACCOUNT = (() => {
  const val = getEnv('EXPO_PUBLIC_SOLANA_VAULT_ATA');
  return val ? new PublicKey(val) : null;
})();

// Minimum $10 = 10,000,000,000 USDC (9 decimals)
export const MIN_DEPOSIT_AMOUNT = 10_000_000_000;
export const USDC_DECIMALS = 9;

export const PROGRAM_SEED = 'screenly';
export const ESCROW_SEED = 'escrow';
