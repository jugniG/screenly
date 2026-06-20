#!/bin/bash
set -e

echo "=== 1. Setup keypairs ==="
mkdir -p /root/.config/solana
cp /workspace/keypair.json /root/.config/solana/id.json

echo "=== 2. Set Solana config to devnet ==="
solana config set --url https://api.devnet.solana.com --keypair /root/.config/solana/id.json

echo "=== 3. Check balance ==="
solana balance

echo "=== 4. Build program with cargo build-sbf ==="
cd /workspace
cargo build-sbf --verbose

echo "=== 5. Deploy to devnet ==="
PROGRAM_BINARY="target/deploy/screenly_escrow.so"
if [ ! -f "$PROGRAM_BINARY" ]; then
  echo "ERROR: Program binary not found at $PROGRAM_BINARY"
  ls -la target/deploy/ 2>/dev/null || echo "No deploy dir"
  exit 1
fi

solana program deploy "$PROGRAM_BINARY" --program-id /workspace/program-keypair.json

echo "=== 6. Derive vault ATA ==="
spl-token create-account BFNCYpxJyjeBosNGodRP9qWLybRtyRMyfyFxkdoXvsCx \
  --owner /root/.config/solana/id.json \
  --url https://api.devnet.solana.com \
  --fee-payer /root/.config/solana/id.json 2>&1 || echo "Account may already exist"

VAULT_ATA=$(spl-token address --owner /root/.config/solana/id.json --token BFNCYpxJyjeBosNGodRP9qWLybRtyRMyfyFxkdoXvsCx --url https://api.devnet.solana.com 2>&1 | grep "Address:" | awk '{print $NF}')
echo "Vault ATA: $VAULT_ATA"

echo ""
echo "========== SOLANA DEVNET ADDRESSES =========="
echo "EXPO_PUBLIC_SOLANA_ESCROW_PROGRAM_ID=$(solana address -k /workspace/program-keypair.json)"
echo "EXPO_PUBLIC_SOLANA_USDC_MINT=BFNCYpxJyjeBosNGodRP9qWLybRtyRMyfyFxkdoXvsCx"
echo "EXPO_PUBLIC_SOLANA_VAULT_ATA=$VAULT_ATA"
echo "============================================="
