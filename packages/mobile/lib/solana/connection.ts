import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
} from '@solana/web3.js';

const CLUSTER = 'devnet';

export function getConnection(): Connection {
  return new Connection(clusterApiUrl(CLUSTER), 'confirmed');
}

export const CLUSTER_NAME = CLUSTER;
