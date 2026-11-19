// AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block
// Real Sui Testnet gRPC Wallet & On-Chain Transaction Helper (Sui 2026 gRPC Standard)

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Transaction } from '@mysten/sui/transactions';
import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysten/sui/faucet';

export const LIVE_TESTNET = {
  packageId: '0x850f67f853eaf9832469302acebb68b734693138f3d1dfb35aaba0860aa21cfe',
  treasuryId: '0x45f2f7c8314a6d5a97e9ded5c862f0d33f6eadf56fc1f98bb937396f1bc33e7e',
  hashRegistryId: '0x1ed5fcb719b814e61e5bea245471056cc6094e6bb8ab65e83877df1697ed0183',
  deptRegistryId: '0xc06f31b6db6576914dd287f2f342cad619f41f3182df12e61fe33502f6787f0d',
};

const STORAGE_KEY = 'marketcraft_lite_sui_testnet_sk';

export const suiClient = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443',
});

export function hasSavedTestnetWallet(): boolean {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

export function loadOrCreateTestnetWallet(forceNew = false): Ed25519Keypair {
  if (!forceNew) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return Ed25519Keypair.fromSecretKey(saved);
      } catch {
        // Regenerate if corrupt
      }
    }
  }
  const kp = Ed25519Keypair.generate();
  localStorage.setItem(STORAGE_KEY, kp.getSecretKey());
  return kp;
}

export async function fetchTestnetSuiBalance(address: string): Promise<number> {
  const clean = address.trim();
  if (!clean.startsWith('0x')) return 0;
  const res = await suiClient.getBalance({ owner: clean, coinType: '0x2::sui::SUI' });
  const raw = res.balance?.balance ?? '0';
  return Number(raw) / 1_000_000_000;
}

export interface LiveTreasurySnapshot {
  genesisBalanceMist: number;
  paymasterBalanceMist: number;
  cloudcraftBalanceMist: number;
  ossToolVaultBalanceMist: number;
  storefrontBalanceMist: number;
  totalSettledVolumeMist: number;
  genesisFounder: string;
}

export async function fetchLiveTreasurySnapshot(): Promise<LiveTreasurySnapshot> {
  const r = await suiClient.getObject({
    objectId: LIVE_TESTNET.treasuryId,
    include: { json: true },
  });
  const j = (r.object?.json ?? {}) as Record<string, string>;
  return {
    genesisBalanceMist: Number(j.genesis_balance ?? '0'),
    paymasterBalanceMist: Number(j.paymaster_balance ?? '0'),
    cloudcraftBalanceMist: Number(j.cloudcraft_walrus_balance ?? '0'),
    ossToolVaultBalanceMist: Number(j.retroactive_tool_vault_balance ?? '0'),
    storefrontBalanceMist: Number(j.storefront_affiliate_balance ?? '0'),
    totalSettledVolumeMist: Number(j.total_settled_volume ?? '0'),
    genesisFounder: String(j.genesis_founder ?? ''),
  };
}

export async function requestTestnetFaucet(address: string): Promise<void> {
  await requestSuiFromFaucetV2({
    host: getFaucetHost('testnet'),
    recipient: address,
  });
}

type GrpcExecRes = {
  $kind: string;
  FailedTransaction?: { digest: string; status?: { error?: { message?: string } } };
  Transaction?: {
    digest: string;
    objectTypes?: Record<string, string>;
    effects?: { changedObjects?: Array<{ objectId: string; idOperation?: string }> };
  };
};

function extractCreatedObjectBySuffix(
  rawRes: unknown,
  typeSuffix: string,
): { digest: string; objectId: string | null } {
  const res = rawRes as GrpcExecRes;
  if (res.$kind === 'FailedTransaction' && res.FailedTransaction) {
    const msg = res.FailedTransaction.status?.error?.message || 'Sui Testnet transaction failed';
    throw new Error(`${msg} (digest: ${res.FailedTransaction.digest})`);
  }
  const tx = res.Transaction;
  if (!tx) throw new Error('Unexpected empty Sui gRPC transaction response');
  const objectTypes = tx.objectTypes ?? {};
  const changed = tx.effects?.changedObjects ?? [];
  let foundId: string | null = null;
  for (const ch of changed) {
    if (ch.idOperation === 'Created') {
      const ty = objectTypes[ch.objectId] ?? '';
      if (ty.endsWith(typeSuffix)) {
        foundId = ch.objectId;
        break;
      }
    }
  }
  return { digest: tx.digest, objectId: foundId };
}

export async function mintRealCreatorUidOnTestnet(
  keypair: Ed25519Keypair,
  handle: string,
): Promise<{ digest: string; creatorUidId: string | null }> {
  const tx = new Transaction();
  const handleBytes = Array.from(new TextEncoder().encode(handle));
  tx.moveCall({
    target: `${LIVE_TESTNET.packageId}::core::mint_self_creator_uid`,
    arguments: [tx.pure.vector('u8', handleBytes)],
  });

  const res = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    include: { effects: true, objectTypes: true },
  });

  const { digest, objectId } = extractCreatedObjectBySuffix(res, '::core::CreatorUID');
  await suiClient.waitForTransaction({ digest });
  return { digest, creatorUidId: objectId };
}

export async function publishRealArtifactOnTestnet(
  keypair: Ed25519Keypair,
  creatorUidId: string,
  title: string,
  uniqueHashTag: string,
  priceMist: number,
  artistAddress: string,
): Promise<{ digest: string; artifactId: string | null }> {
  const tx = new Transaction();
  const enc = new TextEncoder();
  tx.moveCall({
    target: `${LIVE_TESTNET.packageId}::core::publish_artifact_uai`,
    arguments: [
      tx.object(LIVE_TESTNET.hashRegistryId),
      tx.object(creatorUidId),
      tx.pure.vector('u8', Array.from(enc.encode(title))),
      tx.pure.vector('u8', Array.from(enc.encode('game'))),
      tx.pure.vector('u8', Array.from(enc.encode(uniqueHashTag))),
      tx.pure.u64(priceMist),
      tx.pure.u64(7000), // 70.00% Tier-4 Master Creator floor
      tx.pure.vector('address', []),
      tx.pure.vector('u64', []),
      tx.pure.vector('address', [artistAddress]),
      tx.pure.vector('u64', [100]),
      tx.pure.bool(true),  // 6.00% OSS Tool Vault (Blender/Godot)
      tx.pure.bool(false),
    ],
  });

  const res = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    include: { effects: true, objectTypes: true },
  });

  const { digest, objectId } = extractCreatedObjectBySuffix(res, '::core::ArtifactUAI');
  await suiClient.waitForTransaction({ digest });
  return { digest, artifactId: objectId };
}

export async function buyRealArtifactWaterfallOnTestnet(
  keypair: Ed25519Keypair,
  artifactId: string,
  priceMist: number,
): Promise<{ digest: string; receiptId: string | null }> {
  const tx = new Transaction();
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);
  tx.moveCall({
    target: `${LIVE_TESTNET.packageId}::core::buy_artifact_and_settle_waterfall`,
    typeArguments: ['0x2::sui::SUI'],
    arguments: [
      tx.object(LIVE_TESTNET.treasuryId),
      tx.object(artifactId),
      paymentCoin,
    ],
  });

  const res = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    include: { effects: true, objectTypes: true },
  });

  const { digest, objectId } = extractCreatedObjectBySuffix(res, '::core::EntitlementReceipt');
  await suiClient.waitForTransaction({ digest });
  return { digest, receiptId: objectId };
}
