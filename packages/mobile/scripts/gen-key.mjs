import { Keypair } from '@solana/web3.js';
import { writeFileSync } from 'fs';
const kp = Keypair.generate();
const secret = JSON.stringify(Array.from(kp.secretKey));
writeFileSync('../../programs/screenly-escrow/keypair.json', '[' + secret.slice(1, -1) + ']');
console.log('Public key:', kp.publicKey.toBase58());
