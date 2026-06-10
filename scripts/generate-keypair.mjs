import { Keypair } from '@solana/web3.js';
import { writeFileSync } from 'fs';

const kp = Keypair.generate();
const secret = JSON.stringify(Array.from(kp.secretKey));
const pubkey = kp.publicKey.toBase58();

writeFileSync('keypair.json', `[${secret.slice(1, -1)}]`);

console.log('Public key:', pubkey);
console.log('Saved to: keypair.json');
