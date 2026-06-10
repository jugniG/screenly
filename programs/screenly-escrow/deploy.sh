#!/bin/bash
set -e

cd /workspace

# 1. Set config to devnet
solana config set --url https://api.devnet.solana.com

# 2. Airdrop SOL (might need multiple tries)
echo "Airdropping SOL..."
solana airdrop 5 /workspace/keypair.json --url https://api.devnet.solana.com || true
solana airdrop 5 /workspace/keypair.json --url https://api.devnet.solana.com || true

# 3. Check balance
echo "Balance:"
solana balance /workspace/keypair.json --url https://api.devnet.solana.com

# 4. Build Anchor program
echo "Building Anchor program..."
anchor build --provider.cluster devnet --provider.wallet /workspace/keypair.json

# 5. Extract the new program ID from build
echo "Program built. Binary at: target/deploy/screenly_escrow.so"

# 6. Deploy
echo "Deploying..."
PROGRAM_ID=$(solana address -k /workspace/keypair.json)
anchor deploy --provider.cluster devnet --provider.wallet /workspace/keypair.json
echo "Deployed!"
echo "Program ID: $(solana address -k /workspace/keypair.json)"

# 7. Create test USDC mint
echo "Creating test USDC mint..."
USDC_MINT=$(spl-token create-token --url https://api.devnet.solana.com --fee-payer /workspace/keypair.json --mint-authority /workspace/keypair.json 2>&1 | grep "Creating token" | awk '{print $NF}')
echo "USDC Mint: $USDC_MINT"

# 8. Create vault ATA and mint USDC to it
echo "Creating vault ATA..."
spl-token create-account "$USDC_MINT" --url https://api.devnet.solana.com --fee-payer /workspace/keypair.json --owner /workspace/keypair.json
VAULT_ATA=$(spl-token address --owner /workspace/keypair.json --token "$USDC_MINT" --url https://api.devnet.solana.com 2>&1 | grep "Address:" | awk '{print $NF}')
echo "Vault ATA: $VAULT_ATA"
spl-token mint "$USDC_MINT" 10000000000 --url https://api.devnet.solana.com --fee-payer /workspace/keypair.json --mint-authority /workspace/keypair.json

echo ""
echo "========== SOLANA DEVNET ADDRESSES =========="
echo "EXPO_PUBLIC_SOLANA_ESCROW_PROGRAM_ID=??? (check anchor deploy output)"
echo "EXPO_PUBLIC_SOLANA_USDC_MINT=$USDC_MINT"
echo "EXPO_PUBLIC_SOLANA_VAULT_ATA=$VAULT_ATA"
echo "============================================="
