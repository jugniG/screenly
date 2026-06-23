// ── Solana Program & Token Config ──────────────────────────────────
//
// Set via .env in packages/mobile/:
//   EXPO_PUBLIC_SOLANA_ESCROW_PROGRAM_ID
//   EXPO_PUBLIC_SOLANA_USDC_MINT
//   EXPO_PUBLIC_SOLANA_VAULT_ATA
//
// USDC on Solana mainnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

import { PublicKey } from '@solana/web3.js';

export const ESCROW_PROGRAM_ID = new PublicKey(
  process.env.EXPO_PUBLIC_SOLANA_ESCROW_PROGRAM_ID || 'ESCROW_PROGRAM_ID_PLACEHOLDER'
);

export const USDC_MINT = new PublicKey(
  process.env.EXPO_PUBLIC_SOLANA_USDC_MINT || 'USDC_MINT_PLACEHOLDER'
);

export const VAULT_TOKEN_ACCOUNT = new PublicKey(
  process.env.EXPO_PUBLIC_SOLANA_VAULT_ATA || 'VAULT_ATA_PLACEHOLDER'
);

// Minimum $10 = 10,000,000 USDC (6 decimals)
export const MIN_DEPOSIT_AMOUNT = 10_000_000;
export const USDC_DECIMALS = 6;

export const PROGRAM_SEED = 'screenly';
export const ESCROW_SEED = 'escrow';
