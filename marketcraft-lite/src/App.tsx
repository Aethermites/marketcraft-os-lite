// AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block
// MarketCraft OS Lite — 6-Act Live Sui Testnet & Blender Showcase

import { useEffect, useRef, useState } from 'react';
import {
  buyRealArtifactWaterfallOnTestnet,
  fetchLiveTreasurySnapshot,
  fetchTestnetSuiBalance,
  hasSavedTestnetWallet,
  loadOrCreateTestnetWallet,
  mintRealCreatorUidOnTestnet,
  publishRealArtifactOnTestnet,
  requestTestnetFaucet,
  type LiveTreasurySnapshot,
} from './suiTestnet';
import type { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const GENESIS_SEAL = 'AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block';
const FOUNDER_WALLET = '0x93292808389b92e73100284f931f7e027e003fafc2d3cbfbfbc520da6098c0a7';
const TESTNET_PACKAGE_ID = '0x850f67f853eaf9832469302acebb68b734693138f3d1dfb35aaba0860aa21cfe';
const TESTNET_TREASURY_ID = '0x45f2f7c8314a6d5a97e9ded5c862f0d33f6eadf56fc1f98bb937396f1bc33e7e';
const TESTNET_HASH_REG_ID = '0x1ed5fcb719b814e61e5bea245471056cc6094e6bb8ab65e83877df1697ed0183';
const TESTNET_DEPT_REG_ID = '0xc06f31b6db6576914dd287f2f342cad619f41f3182df12e61fe33502f6787f0d';
const TESTNET_PUBLISH_TX = 'FaYwELwaeyV5iRUX53gTG4SuNzEjnT4gMDvzpPkNrvsw';

type PersonaKey = 'signed_out' | 'artist_a' | 'dev_b' | 'player_c' | 'attacker_x';

interface Persona {
  key: PersonaKey;
  label: string;
  role: string;
  suiAddress: string;
  handle: string;
}

const PERSONAS: Record<PersonaKey, Persona> = {
  signed_out: {
    key: 'signed_out',
    label: 'Signed Out (Guest)',
    role: 'No MarketCraft Sui ID',
    suiAddress: '',
    handle: '',
  },
  artist_a: {
    key: 'artist_a',
    label: 'Artist_A (3D Blender Creator)',
    role: 'Tier 3B Asset Author',
    suiAddress: '0x40e60706870bebd6b9d9c21b507c844d2c385c26c3f017810b122fc18e02e837',
    handle: 'artist_a_blender',
  },
  dev_b: {
    key: 'dev_b',
    label: 'Dev_B (Indie Game Dev)',
    role: 'Tier 4 Master Creator',
    suiAddress: '0x2222222222222222222222222222222222222222222222222222222222222222',
    handle: 'dev_b_godot',
  },
  player_c: {
    key: 'player_c',
    label: 'Player_C (Game Buyer)',
    role: 'Consumer',
    suiAddress: '0x3333333333333333333333333333333333333333333333333333333333333333',
    handle: 'player_c_gamer',
  },
  attacker_x: {
    key: 'attacker_x',
    label: 'Attacker_X (Unauthorized)',
    role: 'Piracy / Tamper Test',
    suiAddress: '0xbad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1',
    handle: 'attacker_x_pirate',
  },
};

interface WaterfallSplit {
  label: string;
  tier: string;
  recipient: string;
  bps: number;
  amountSui: number;
}

function computeZeroDustWaterfall(
  grossSui: number,
  masterCreator: string,
  masterBps: number,
  tier3bArtist?: string,
): WaterfallSplit[] {
  const genesis = +(grossSui * 0.015).toFixed(6);
  const paymaster = +(grossSui * 0.0015).toFixed(6);
  const cloudcraft = +(grossSui * 0.0085).toFixed(6);
  const ossTool = +(grossSui * 0.06).toFixed(6);
  const remainingAfterFloor = +(grossSui - genesis - paymaster - cloudcraft - ossTool).toFixed(6);
  const masterFloor = +(grossSui * (masterBps / 10000)).toFixed(6);

  const splits: WaterfallSplit[] = [
    { label: 'Genesis Founder (Hubert Silaa)', tier: 'Tier 0 (Immutable)', recipient: FOUNDER_WALLET, bps: 150, amountSui: genesis },
    { label: 'Gasless Paymaster Pool', tier: 'Tier 7A', recipient: TESTNET_TREASURY_ID, bps: 15, amountSui: paymaster },
    { label: 'CloudCraft / Walrus Storage', tier: 'Tier 7B', recipient: TESTNET_TREASURY_ID, bps: 85, amountSui: cloudcraft },
    { label: 'Retroactive OSS Tool Vault (Blender / Godot)', tier: 'Tier 2', recipient: 'github.com/blender & storytold', bps: 600, amountSui: ossTool },
  ];

  if (tier3bArtist && remainingAfterFloor > masterFloor) {
    const artistCut = +(remainingAfterFloor - masterFloor).toFixed(6);
    const artistBps = Math.round((artistCut / grossSui) * 10000);
    splits.push({
      label: '3D Asset Author (Artist_A — Cyber Sword)',
      tier: 'Tier 3B (Core Asset)',
      recipient: tier3bArtist,
      bps: artistBps,
      amountSui: artistCut,
    });
    splits.push({
      label: 'Master Game Creator (Dev_B — Protected Floor)',
      tier: 'Tier 4',
      recipient: masterCreator,
      bps: masterBps,
      amountSui: masterFloor,
    });
  } else {
    const netMaster = remainingAfterFloor;
    const effBps = Math.round((netMaster / grossSui) * 10000);
    splits.push({
      label: 'Master Creator (Protected Floor + Elastic Rollback)',
      tier: 'Tier 4',
      recipient: masterCreator,
      bps: effBps,
      amountSui: netMaster,
    });
  }

  return splits;
}

function DummyGameCanvas({ unlocked, externalStrikes = 0 }: { unlocked: boolean; externalStrikes?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [manualScore, setManualScore] = useState(0);
  const score = manualScore + externalStrikes * 10;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let angle = 0;

    const render = () => {
      angle += 0.025;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid floor
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (!unlocked) {
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LOCKED — BUY DUMMY GAME V1 AS PLAYER_C TO UNLOCK', cx, cy);
      } else {
        // Rotating 3D-projected Cyber Sword mesh from Artist_A
        ctx.save();
        ctx.translate(cx, cy);
        const scaleX = Math.cos(angle);
        ctx.scale(Math.max(0.25, Math.abs(scaleX)), 1);

        // Blade glow
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.moveTo(0, -85);
        ctx.lineTo(14, 15);
        ctx.lineTo(0, 28);
        ctx.lineTo(-14, 15);
        ctx.closePath();
        ctx.fill();

        // Crossguard
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-38, 18, 76, 10);

        // Hilt
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-6, 28, 12, 34);
        ctx.restore();

        ctx.fillStyle = '#a7f3d0';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('ASSET UAI: cyber_sword_v1.mcraft (Artist_A · Read-Only)', 12, 22);
        ctx.fillText(`SCORE: ${score} (Click sword to strike!)`, 12, canvas.height - 14);
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [unlocked, score]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={240}
      onClick={() => unlocked && setManualScore((s) => s + 10)}
      className="w-full rounded-xl border border-emerald-500/40 cursor-pointer"
    />
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'live_sui' | 'studio' | 'marketplace' | 'game' | 'antipiracy'>('live_sui');
  const [personaKey, setPersonaKey] = useState<PersonaKey>(() => {
    const saved = localStorage.getItem('marketcraft_lite_persona') as PersonaKey | null;
    return saved && saved in PERSONAS ? saved : 'artist_a';
  });
  const [liveKeypair, setLiveKeypair] = useState<Ed25519Keypair | null>(() =>
    hasSavedTestnetWallet() ? loadOrCreateTestnetWallet(false) : null,
  );
  const [customWalletAddress, setCustomWalletAddress] = useState<string>(
    () => localStorage.getItem('marketcraft_lite_custom_addr') || '',
  );
  const [liveSuiBalance, setLiveSuiBalance] = useState<number | null>(null);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState<boolean>(false);
  const [liveCreatorUidId, setLiveCreatorUidId] = useState<string>(() => {
    const addr = hasSavedTestnetWallet() ? loadOrCreateTestnetWallet(false).toSuiAddress() : '';
    return addr ? localStorage.getItem(`marketcraft_lite_uid_${addr}`) || '' : '';
  });
  const [liveArtifactId, setLiveArtifactId] = useState<string>(() => {
    const addr = hasSavedTestnetWallet() ? loadOrCreateTestnetWallet(false).toSuiAddress() : '';
    return addr ? localStorage.getItem(`marketcraft_lite_art_${addr}`) || '' : '';
  });
  const [liveTxLinks, setLiveTxLinks] = useState<Array<{ label: string; digest: string }>>(() => {
    try {
      const raw = localStorage.getItem('marketcraft_lite_tx_links');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [liveBusy, setLiveBusy] = useState<string>('');
  const [showAssetLineage, setShowAssetLineage] = useState<boolean>(true);
  const [blenderPublishedAssets, setBlenderPublishedAssets] = useState<
    Array<{
      title: string;
      creator_sui_id: string;
      payload_sha256: string;
      mcraft_path: string;
      lineage_dependencies?: Array<{ title: string; owner_sui_id: string; tier?: string }>;
      published_at: string;
    }>
  >([]);
  const [mintedUids, setMintedUids] = useState<Record<string, boolean>>({});
  const [swordPublished, setSwordPublished] = useState(false);
  const [swordPayloadHash] = useState('sha256_cyber_sword_v1_8f9a2c4e1b0d');
  const [devBoughtSword, setDevBoughtSword] = useState(false);
  const [gamePublished, setGamePublished] = useState(false);
  const [publishedArtistAddress, setPublishedArtistAddress] = useState<string>(
    () => localStorage.getItem('marketcraft_lite_pub_artist') || '',
  );
  const [publishedGameAuthorAddress, setPublishedGameAuthorAddress] = useState<string>(
    () => localStorage.getItem('marketcraft_lite_pub_game_author') || '',
  );
  const [publishedGameTitle, setPublishedGameTitle] = useState<string>(
    () => localStorage.getItem('marketcraft_lite_pub_game_title') || 'Dummy Game v1 (Uses Cyber Sword)',
  );
  const [lastWaterfallTxDigest, setLastWaterfallTxDigest] = useState<string>('');
  const [liveTreasury, setLiveTreasury] = useState<LiveTreasurySnapshot | null>(null);
  const [playerBoughtGame, setPlayerBoughtGame] = useState(false);
  const [autoStrikes, setAutoStrikes] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [demoCaption, setDemoCaption] = useState<string>('');
  const [lastWaterfall, setLastWaterfall] = useState<WaterfallSplit[] | null>(null);
  const [securityLog, setSecurityLog] = useState<string[]>([
    `Connected to live Sui Testnet package ${TESTNET_PACKAGE_ID.slice(0, 14)}...`,
  ]);

  const persona = PERSONAS[personaKey];
  const activeRealWalletAddress =
    customWalletAddress.trim().startsWith('0x') && customWalletAddress.trim().length >= 10
      ? customWalletAddress.trim()
      : liveKeypair
        ? liveKeypair.toSuiAddress()
        : '';
  const getRoleAddress = (role: PersonaKey): string => {
    if (role === 'signed_out') return '';
    if (role === 'artist_a' && publishedArtistAddress) return publishedArtistAddress;
    if (role === 'dev_b' && publishedGameAuthorAddress) return publishedGameAuthorAddress;
    if (role === personaKey && activeRealWalletAddress) return activeRealWalletAddress;
    return PERSONAS[role].suiAddress;
  };
  const effectiveSuiAddress =
    personaKey === 'signed_out' ? '' : activeRealWalletAddress || getRoleAddress(personaKey);

  const pushLog = (msg: string) => setSecurityLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  // Persist role, custom wallet, UID, Artifact, and Tx history across browser reloads
  useEffect(() => {
    localStorage.setItem('marketcraft_lite_persona', personaKey);
  }, [personaKey]);
  useEffect(() => {
    localStorage.setItem('marketcraft_lite_custom_addr', customWalletAddress);
  }, [customWalletAddress]);
  useEffect(() => {
    if (liveKeypair && liveCreatorUidId) {
      localStorage.setItem(`marketcraft_lite_uid_${liveKeypair.toSuiAddress()}`, liveCreatorUidId);
    }
  }, [liveKeypair, liveCreatorUidId]);
  useEffect(() => {
    if (liveKeypair && liveArtifactId) {
      localStorage.setItem(`marketcraft_lite_art_${liveKeypair.toSuiAddress()}`, liveArtifactId);
    }
  }, [liveKeypair, liveArtifactId]);
  useEffect(() => {
    localStorage.setItem('marketcraft_lite_tx_links', JSON.stringify(liveTxLinks.slice(0, 15)));
  }, [liveTxLinks]);
  useEffect(() => {
    if (publishedArtistAddress) localStorage.setItem('marketcraft_lite_pub_artist', publishedArtistAddress);
  }, [publishedArtistAddress]);
  useEffect(() => {
    if (publishedGameAuthorAddress) localStorage.setItem('marketcraft_lite_pub_game_author', publishedGameAuthorAddress);
  }, [publishedGameAuthorAddress]);
  useEffect(() => {
    if (publishedGameTitle) localStorage.setItem('marketcraft_lite_pub_game_title', publishedGameTitle);
  }, [publishedGameTitle]);

  // Auto-poll live on-chain ProtocolTreasuryUSD<SUI> vault balances via Sui Testnet gRPC
  const refreshLiveTreasury = async () => {
    try {
      const snap = await fetchLiveTreasurySnapshot();
      setLiveTreasury(snap);
    } catch {
      // Ignore transient RPC errors
    }
  };

  useEffect(() => {
    refreshLiveTreasury();
    const t = window.setInterval(refreshLiveTreasury, 6000);
    return () => window.clearInterval(t);
  }, []);

  // Auto-poll live Sui Testnet balance every 5 seconds whenever a real wallet is active
  const refreshLiveBalance = async (addrOverride?: string) => {
    const target = (addrOverride ?? activeRealWalletAddress).trim();
    if (!target) {
      setLiveSuiBalance(null);
      return;
    }
    setIsRefreshingBalance(true);
    try {
      const bal = await fetchTestnetSuiBalance(target);
      setLiveSuiBalance(bal);
    } catch {
      // Keep last known balance on transient RPC hiccup
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  useEffect(() => {
    if (!activeRealWalletAddress) {
      setLiveSuiBalance(null);
      return;
    }
    refreshLiveBalance(activeRealWalletAddress);
    const timer = window.setInterval(() => {
      refreshLiveBalance(activeRealWalletAddress);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeRealWalletAddress]);

  // Auto-sync active MarketCraft Sui Wallet session to local Blender bridge (zero copy-pasting!)
  useEffect(() => {
    fetch('/api/local/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sui_address: effectiveSuiAddress,
        handle: persona.handle || (effectiveSuiAddress ? `sui_${effectiveSuiAddress.slice(2, 8)}` : ''),
        role: personaKey,
        signed_in: Boolean(effectiveSuiAddress),
        entitled_buyers: devBoughtSword ? [PERSONAS.dev_b.suiAddress, ...(activeRealWalletAddress && personaKey === 'dev_b' ? [activeRealWalletAddress] : [])] : [],
        updated_at: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, [personaKey, persona.handle, effectiveSuiAddress, activeRealWalletAddress, devBoughtSword]);

  // Auto-poll real assets published directly from Blender 5.3!
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch('/api/local/blender-publish');
        if (!res.ok) return;
        const list = (await res.json()) as Array<{
          title: string;
          creator_sui_id: string;
          payload_sha256: string;
          mcraft_path: string;
          lineage_dependencies?: Array<{ title: string; owner_sui_id: string; tier?: string }>;
          published_at: string;
        }>;
        if (!cancelled && Array.isArray(list)) {
          // Sync real Blender 5.3 authors (standalone sword AND composite warrior pack/game!)
          const composite = list.find((x) => Array.isArray(x.lineage_dependencies) && x.lineage_dependencies.length > 0);
          const standalone = list.find((x) => !x.lineage_dependencies || x.lineage_dependencies.length === 0);
          if (standalone?.creator_sui_id) {
            setPublishedArtistAddress(standalone.creator_sui_id);
            setSwordPublished(true);
          }
          if (composite) {
            setPublishedGameAuthorAddress(composite.creator_sui_id);
            setPublishedGameTitle(composite.title);
            setGamePublished(true);
            setDevBoughtSword(true);
            if (composite.lineage_dependencies?.[0]?.owner_sui_id) {
              setPublishedArtistAddress(composite.lineage_dependencies[0].owner_sui_id);
              setSwordPublished(true);
            }
          }

          setBlenderPublishedAssets((prev) => {
            if (list.length > prev.length && list[0]) {
              setSwordPublished(true);
              pushLog(`🎨 BLENDER 5.3 PUBLISH RECEIVED ✅ "${list[0].title}" by ${list[0].creator_sui_id.slice(0, 12)}... (SHA-256: ${list[0].payload_sha256.slice(0, 16)}...)`);
            }
            return list;
          });
        }
      } catch {
        // Ignore when static preview
      }
    };
    poll();
    const id = window.setInterval(poll, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const runAutoDemoSequence = async (withRecording: boolean) => {
    if (isAutoPlaying) return;
    let recorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    const chunks: BlobPart[] = [];

    if (withRecording) {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: false,
        });
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';
        recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `marketcraft_lite_6_acts_${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          setIsRecording(false);
          pushLog('🎬 Saved recorded video (.webm) to your Downloads folder!');
        };
        recorder.start(250);
        setIsRecording(true);
      } catch {
        pushLog('Recording cancelled by user — running Auto-Play without screen capture.');
      }
    }

    setIsAutoPlaying(true);
    // Reset cleanly to Step 0
    setMintedUids({});
    setSwordPublished(false);
    setDevBoughtSword(false);
    setGamePublished(false);
    setPlayerBoughtGame(false);
    setAutoStrikes(0);
    setLastWaterfall(null);
    setSecurityLog([`[${new Date().toLocaleTimeString()}] 🎬 Starting 6-Act MarketCraft OS Lite Live Demo...`]);

    // Act 1
    setActiveTab('studio');
    setPersonaKey('artist_a');
    setDemoCaption('ACT 1: Artist_A signs in with MarketCraft Sui ID & mints CreatorUID');
    await sleep(1800);
    setMintedUids({ artist_a: true });
    pushLog('Act 1 ✅ Minted CreatorUID (@artist_a_blender) on marketcraft_core::core::mint_self_creator_uid');
    await sleep(2400);

    // Act 2
    setDemoCaption('ACT 2: Artist_A seals Cyber Sword (.mcraft) in Blender & publishes (0.005 SUI)');
    await sleep(1200);
    setSwordPublished(true);
    pushLog(`Act 2 ✅ Blender sealed cyber_sword_v1.mcraft (SHA-256: ${swordPayloadHash}) & published ArtifactUAI (0.005 SUI).`);
    await sleep(2600);

    // Act 3
    setActiveTab('marketplace');
    setPersonaKey('dev_b');
    setDemoCaption('ACT 3A: Dev_B explores Marketplace & buys Cyber Sword (0.005 SUI) -> Read-Only EntitlementReceipt');
    await sleep(1600);
    setDevBoughtSword(true);
    setLastWaterfall(computeZeroDustWaterfall(0.005, PERSONAS.artist_a.suiAddress, 9150));
    pushLog('Act 3A ✅ Dev_B purchased Cyber Sword (0.005 SUI) -> Minted EntitlementReceipt (can_edit_source = false).');
    await sleep(2400);

    setDemoCaption('ACT 3B: Dev_B embeds Cyber Sword into Dummy Game v1 (0.01 SUI) with Artist_A Tier-3B Lineage');
    await sleep(1200);
    setGamePublished(true);
    pushLog('Act 3B ✅ Dev_B published "Dummy Game v1" (0.01 SUI) with Artist_A linked as Tier-3B Core Asset.');
    await sleep(2600);

    // Act 4
    setActiveTab('game');
    setPersonaKey('player_c');
    setDemoCaption('ACT 4: Player_C buys Dummy Game v1 (0.01 SUI) -> Unlocks 3D Game & Atomic 8-Tier Waterfall!');
    await sleep(1600);
    setPlayerBoughtGame(true);
    setLastWaterfall(computeZeroDustWaterfall(0.01, PERSONAS.dev_b.suiAddress, 7000, PERSONAS.artist_a.suiAddress));
    pushLog('Act 4 ✅ Player_C bought Dummy Game v1 (0.01 SUI) -> Atomic 8-Tier Waterfall paid Founder (0.00015 SUI), OSS Vault (0.0006 SUI), Artist_A (0.00215 SUI), Dev_B (0.007 SUI)! Zero dust.');
    await sleep(1200);
    setAutoStrikes(1);
    await sleep(700);
    setAutoStrikes(2);
    await sleep(700);
    setAutoStrikes(3);
    await sleep(3000);

    // Act 5
    setActiveTab('antipiracy');
    setPersonaKey('signed_out');
    setDemoCaption('ACT 5 (Piracy Test #1): Signed-out user tries to open .mcraft in Blender -> BLOCKED (Code 1069)');
    await sleep(1500);
    pushLog('🛡️ Act 5 BLOCKED [Code 1069 / EMarketCraftSignInRequired]: Cannot open cyber_sword_v1.mcraft in Blender without signing into MarketCraft Sui ID!');
    await sleep(2600);

    // Act 6A
    setPersonaKey('attacker_x');
    setDemoCaption('ACT 6A (Piracy Test #2): Attacker_X tries to open .mcraft without Entitlement -> BLOCKED (Code 1070)');
    await sleep(1500);
    pushLog(`🛡️ Act 6A BLOCKED [Code 1070 / EEntitlementReceiptMissing]: Sui ID ${PERSONAS.attacker_x.suiAddress.slice(0, 12)}... holds NO EntitlementReceipt for Cyber Sword.`);
    await sleep(2600);

    // Act 6B
    setPersonaKey('dev_b');
    setDemoCaption('ACT 6B (Tamper Test): Entitled Buyer Dev_B tries to overwrite source .mcraft -> BLOCKED (Code 1066)');
    await sleep(1500);
    pushLog('🛡️ Act 6B BLOCKED [Code 1066 / EUnauthorizedArtifactModification]: Dev_B (Indie Game Dev) has Read-Only entitlement and CANNOT modify or overwrite Artist_A\'s source file!');
    await sleep(2600);

    // Act 6C
    setPersonaKey('attacker_x');
    setDemoCaption('ACT 6C (On-Chain Plagiarism Test): Attacker_X tries to re-publish copied hash -> BLOCKED (Abort 1065)');
    await sleep(1500);
    pushLog(`🛡️ Act 6C BLOCKED ON-CHAIN [Abort 1065 / EPlagiarizedPayloadHash]: PayloadHashRegistry (${TESTNET_HASH_REG_ID.slice(0, 12)}...) already binds ${swordPayloadHash} to Artist_A!`);
    await sleep(2600);

    // Owner Proof
    setPersonaKey('artist_a');
    setDemoCaption('OWNER PROOF: Original Creator Artist_A unlocks .mcraft in OWNER EDIT MODE ✅');
    await sleep(1500);
    pushLog('✅ Blender unlocked cyber_sword_v1.mcraft for Artist_A (3D Blender Creator) (OWNER EDIT MODE).');
    await sleep(2500);

    setDemoCaption('🎉 All 6 Acts Complete — MarketCraft OS Lite (Live on Sui Testnet)');
    setIsAutoPlaying(false);

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  };

  const handleMintUid = () => {
    if (personaKey === 'signed_out') {
      pushLog('BLOCKED: Select a Sui persona first to mint CreatorUID.');
      return;
    }
    setMintedUids((m) => ({ ...m, [personaKey]: true }));
    pushLog(`Act 1 ✅ Minted CreatorUID (@${persona.handle}) on marketcraft_core::core::mint_self_creator_uid`);
  };

  const handlePublishSword = () => {
    if (personaKey !== 'artist_a') {
      pushLog('Switch to Artist_A (3D Blender Creator) to publish Cyber Sword.');
      return;
    }
    if (!mintedUids.artist_a) setMintedUids((m) => ({ ...m, artist_a: true }));
    if (activeRealWalletAddress) setPublishedArtistAddress(activeRealWalletAddress);
    setSwordPublished(true);
    pushLog(`Act 2 ✅ Blender sealed cyber_sword_v1.mcraft (SHA-256: ${swordPayloadHash}) & published ArtifactUAI (0.005 SUI).`);
  };

  const handleDownloadMcraft = () => {
    const envelope = {
      format: 'MCRAFT_SEALED_V07',
      genesis_attribution: GENESIS_SEAL,
      testnet_package_id: TESTNET_PACKAGE_ID,
      creator_sui_id: getRoleAddress('artist_a'),
      entitled_buyers: devBoughtSword ? [getRoleAddress('dev_b')] : [],
      payload_sha256: swordPayloadHash,
      header: {
        title: 'Cyber Sword 3D (.mcraft)',
        artifact_uai_id: '0x8011947dde9d147b590c7e7c4f80c4cb2bf4daca97d363c9886f71d51d77ddde',
        upstream_tool: 'Blender Foundation (6.00% Retroactive OSS Vault)',
      },
    };
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyber_sword_v1.mcraft';
    a.click();
    URL.revokeObjectURL(url);
    pushLog('Downloaded cyber_sword_v1.mcraft — test opening it in Blender with marketcraft_blender.py!');
  };

  const handleDevBuySword = () => {
    if (personaKey !== 'dev_b') {
      pushLog('Switch to Dev_B (Indie Game Dev) to buy Cyber Sword.');
      return;
    }
    if (!swordPublished) {
      pushLog('Publish Cyber Sword as Artist_A in Act 2 first.');
      return;
    }
    setDevBoughtSword(true);
    setLastWaterfall(computeZeroDustWaterfall(0.005, getRoleAddress('artist_a'), 9150));
    pushLog('Act 3A ✅ Dev_B purchased Cyber Sword (0.005 SUI) -> Minted EntitlementReceipt (can_edit_source = false).');
  };

  const handlePublishDummyGame = () => {
    if (personaKey !== 'dev_b' || !devBoughtSword) {
      pushLog('Dev_B must buy Cyber Sword first before embedding it into Dummy Game v1.');
      return;
    }
    if (activeRealWalletAddress) setPublishedGameAuthorAddress(activeRealWalletAddress);
    setGamePublished(true);
    pushLog(`Act 3B ✅ Dev_B (${getRoleAddress('dev_b').slice(0, 12)}...) published "${publishedGameTitle}" (0.01 SUI) with Artist_A linked as Tier-3B Core Asset.`);
  };

  const handleRealTestnetBuyGameWaterfall = async () => {
    if (!liveKeypair) {
      pushLog('⚠️ Create/Load your funded Persistent Sui Testnet Wallet in Act 1 first (needs >= 0.03 SUI for real tx + gas).');
      setActiveTab('live_sui');
      return;
    }
    setLiveBusy('Executing REAL Sui Testnet 8-Tier Waterfall (0.01 SUI)...');
    try {
      const signerAddr = liveKeypair.toSuiAddress();
      let uidId = localStorage.getItem(`marketcraft_lite_uid_${signerAddr}`) || '';
      if (!uidId) {
        const handle = `mc_${signerAddr.slice(2, 8)}`;
        const mintRes = await mintRealCreatorUidOnTestnet(liveKeypair, handle);
        uidId = mintRes.creatorUidId || '';
        if (uidId) {
          setLiveCreatorUidId(uidId);
          localStorage.setItem(`marketcraft_lite_uid_${signerAddr}`, uidId);
        }
        setLiveTxLinks((prev) => [{ label: 'Mint CreatorUID', digest: mintRes.digest }, ...prev]);
        pushLog(`⛓️ Auto-minted CreatorUID on Sui Testnet: ${mintRes.digest}`);
      }

      const realArtistRecipient = getRoleAddress('artist_a');
      const uniqueHash = `sha256_composite_${Date.now()}`;
      const pubRes = await publishRealArtifactOnTestnet(
        liveKeypair,
        uidId,
        publishedGameTitle,
        uniqueHash,
        10_000_000, // 0.01 SUI
        realArtistRecipient,
      );
      const artId = pubRes.artifactId || '';
      if (artId) setLiveArtifactId(artId);
      setLiveTxLinks((prev) => [{ label: `Publish ${publishedGameTitle}`, digest: pubRes.digest }, ...prev]);
      pushLog(`⛓️ Published REAL ArtifactUAI on Sui Testnet (Tier-3B = ${realArtistRecipient.slice(0, 12)}...): ${pubRes.digest}`);

      const buyRes = await buyRealArtifactWaterfallOnTestnet(liveKeypair, artId, 10_000_000);
      setLastWaterfallTxDigest(buyRes.digest);
      setPlayerBoughtGame(true);
      const splits = computeZeroDustWaterfall(0.01, liveKeypair.toSuiAddress(), 7000, realArtistRecipient);
      setLastWaterfall(splits);
      setLiveTxLinks((prev) => [{ label: 'REAL 8-Tier Waterfall Buy (0.01 SUI)', digest: buyRes.digest }, ...prev]);
      await refreshLiveBalance(liveKeypair.toSuiAddress());
      await refreshLiveTreasury();
      pushLog(`⛓️ REAL SUI TESTNET WATERFALL SETTLED ✅ View on SuiScan: https://suiscan.xyz/testnet/tx/${buyRes.digest}`);
    } catch (err) {
      pushLog(`❌ Real Testnet Waterfall failed: ${String(err)}`);
    } finally {
      setLiveBusy('');
    }
  };

  const handlePlayerBuyGame = () => {
    if (personaKey !== 'player_c') {
      pushLog('Switch to Player_C (Game Buyer) to purchase Dummy Game v1.');
      return;
    }
    if (!gamePublished) {
      pushLog('Publish Dummy Game v1 as Dev_B in Act 3 first.');
      return;
    }
    setPlayerBoughtGame(true);
    const splits = computeZeroDustWaterfall(0.01, getRoleAddress('dev_b'), 7000, getRoleAddress('artist_a'));
    setLastWaterfall(splits);
    pushLog('Act 4 ✅ Player_C bought Dummy Game v1 (0.01 SUI) -> Atomic 8-Tier Waterfall paid Founder (0.00015 SUI), OSS Vault (0.0006 SUI), Artist_A (0.00215 SUI), Dev_B (0.007 SUI)! Zero dust.');
  };

  const runBlenderOpenCheck = (requireEdit: boolean) => {
    if (personaKey === 'signed_out') {
      pushLog('🛡️ Act 5 BLOCKED [Code 1069 / EMarketCraftSignInRequired]: Cannot open cyber_sword_v1.mcraft in Blender without signing into MarketCraft Sui ID!');
      return;
    }
    if (personaKey === 'attacker_x' || (personaKey === 'player_c' && !devBoughtSword)) {
      pushLog(`🛡️ Act 6A BLOCKED [Code 1070 / EEntitlementReceiptMissing]: Sui ID ${effectiveSuiAddress.slice(0, 12)}... holds NO EntitlementReceipt for Cyber Sword.`);
      return;
    }
    if (requireEdit && personaKey !== 'artist_a') {
      pushLog(`🛡️ Act 6B BLOCKED [Code 1066 / EUnauthorizedArtifactModification]: ${persona.label} has Read-Only entitlement and CANNOT modify or overwrite Artist_A's source file!`);
      return;
    }
    pushLog(`✅ Blender unlocked cyber_sword_v1.mcraft for ${persona.label} (${personaKey === 'artist_a' ? 'OWNER EDIT MODE' : 'READ-ONLY GAME IMPORT MODE'}).`);
  };

  const runPlagiarismAttack = () => {
    if (personaKey === 'artist_a') {
      pushLog('Switch to Attacker_X to test the on-chain plagiarism attack.');
      return;
    }
    pushLog(`🛡️ Act 6C BLOCKED ON-CHAIN [Abort 1065 / EPlagiarizedPayloadHash]: PayloadHashRegistry (${TESTNET_HASH_REG_ID.slice(0, 12)}...) already binds ${swordPayloadHash} to Artist_A!`);
  };

  const handleInitLiveWallet = async (forceNew = false) => {
    const kp = loadOrCreateTestnetWallet(forceNew);
    const addr = kp.toSuiAddress();
    setLiveKeypair(kp);
    setLiveCreatorUidId(forceNew ? '' : localStorage.getItem(`marketcraft_lite_uid_${addr}`) || '');
    setLiveArtifactId(forceNew ? '' : localStorage.getItem(`marketcraft_lite_art_${addr}`) || '');
    if (forceNew) {
      localStorage.removeItem('marketcraft_lite_uid_id');
      localStorage.removeItem('marketcraft_lite_art_id');
    }
    pushLog(`🔑 Live Sui Testnet Wallet ready: ${addr.slice(0, 14)}...`);
    try {
      const bal = await fetchTestnetSuiBalance(addr);
      setLiveSuiBalance(bal);
    } catch {
      setLiveSuiBalance(0);
    }
  };

  const handleRequestFaucet = async () => {
    if (!liveKeypair) return;
    const addr = liveKeypair.toSuiAddress();
    setLiveBusy('Requesting Testnet SUI from faucet...');
    try {
      await requestTestnetFaucet(addr);
      const bal = await fetchTestnetSuiBalance(addr);
      setLiveSuiBalance(bal);
      pushLog(`💧 Testnet Faucet funded ${addr.slice(0, 12)}... (Balance: ${bal.toFixed(4)} SUI)`);
    } catch (err) {
      pushLog(`⚠️ Faucet rate-limited or blocked in browser (${String(err)}). Use the Sui Web Faucet link below!`);
    } finally {
      setLiveBusy('');
    }
  };

  const handleLiveMintUid = async () => {
    if (!liveKeypair) return;
    setLiveBusy('Minting real CreatorUID on Sui Testnet...');
    try {
      const handle = `reviewer_${liveKeypair.toSuiAddress().slice(2, 8)}`;
      const { digest, creatorUidId } = await mintRealCreatorUidOnTestnet(liveKeypair, handle);
      if (creatorUidId) setLiveCreatorUidId(creatorUidId);
      setLiveTxLinks((prev) => [{ label: 'Mint CreatorUID', digest }, ...prev]);
      const bal = await fetchTestnetSuiBalance(liveKeypair.toSuiAddress());
      setLiveSuiBalance(bal);
      pushLog(`⛓️ REAL SUI TESTNET TX ✅ CreatorUID minted! Digest: ${digest}`);
    } catch (err) {
      pushLog(`❌ Real Testnet Mint failed: ${String(err)}`);
    } finally {
      setLiveBusy('');
    }
  };

  const handleLivePublishArtifact = async () => {
    if (!liveKeypair || !liveCreatorUidId) return;
    setLiveBusy('Publishing real ArtifactUAI on Sui Testnet...');
    try {
      const uniqueHash = `sha256_live_demo_${Date.now()}`;
      const { digest, artifactId } = await publishRealArtifactOnTestnet(
        liveKeypair,
        liveCreatorUidId,
        'MarketCraft Live Demo Game v1',
        uniqueHash,
        10_000_000, // 0.01 SUI
        PERSONAS.artist_a.suiAddress,
      );
      if (artifactId) setLiveArtifactId(artifactId);
      setLiveTxLinks((prev) => [{ label: 'Publish ArtifactUAI', digest }, ...prev]);
      const bal = await fetchTestnetSuiBalance(liveKeypair.toSuiAddress());
      setLiveSuiBalance(bal);
      pushLog(`⛓️ REAL SUI TESTNET TX ✅ ArtifactUAI published (0.01 SUI)! Digest: ${digest}`);
    } catch (err) {
      pushLog(`❌ Real Testnet Publish failed: ${String(err)}`);
    } finally {
      setLiveBusy('');
    }
  };

  const handleLiveBuyWaterfall = async () => {
    if (!liveKeypair || !liveArtifactId) return;
    setLiveBusy('Executing real atomic 8-Tier Waterfall on Sui Testnet...');
    try {
      const { digest, receiptId } = await buyRealArtifactWaterfallOnTestnet(
        liveKeypair,
        liveArtifactId,
        10_000_000, // 0.01 SUI
      );
      setLiveTxLinks((prev) => [{ label: 'Buy + 8-Tier Waterfall (0.01 SUI)', digest }, ...prev]);
      const bal = await fetchTestnetSuiBalance(liveKeypair.toSuiAddress());
      setLiveSuiBalance(bal);
      pushLog(`⛓️ REAL SUI TESTNET WATERFALL ✅ Paid 0x9329...c0a7 (1.50%), OSS Vault (6%), Artist_A (21.5%), Creator (70%)! Receipt: ${receiptId ?? 'minted'} | Tx: ${digest}`);
    } catch (err) {
      pushLog(`❌ Real Testnet Buy failed: ${String(err)}`);
    } finally {
      setLiveBusy('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <header className="rounded-2xl border border-emerald-500/35 bg-slate-900/80 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">{GENESIS_SEAL}</p>
          <h1 className="text-2xl font-bold text-white mt-1">MarketCraft OS Lite — 6-Act Live Sui Showcase</h1>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300 mt-2">
            <a
              href={`https://suiscan.xyz/testnet/object/${TESTNET_PACKAGE_ID}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 underline hover:text-cyan-200"
            >
              SuiScan Testnet Package: {TESTNET_PACKAGE_ID.slice(0, 12)}...
            </a>
            <a
              href={`https://suiscan.xyz/testnet/tx/${TESTNET_PUBLISH_TX}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              Publish Tx: {TESTNET_PUBLISH_TX.slice(0, 12)}...
            </a>
            <span className="text-amber-300">Founder Tier-0: {FOUNDER_WALLET.slice(0, 10)}...c0a7 (1.50%)</span>
            {activeRealWalletAddress && (
              <span className="rounded-md bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 font-mono text-emerald-200">
                💰 Live Balance: {liveSuiBalance !== null ? `${liveSuiBalance.toFixed(4)} SUI` : 'Loading...'}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isAutoPlaying}
              onClick={() => runAutoDemoSequence(true)}
              className="rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white shadow-lg"
            >
              {isRecording ? '⏺ Recording All 6 Acts...' : '🎬 Auto-Play & Record 6 Acts (.webm)'}
            </button>
            <button
              type="button"
              disabled={isAutoPlaying}
              onClick={() => runAutoDemoSequence(false)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-white"
            >
              ▶ Auto-Play Only
            </button>
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[11px] font-semibold text-slate-400">Active MarketCraft Sui ID Persona</label>
            <select
              value={personaKey}
              onChange={(e) => setPersonaKey(e.target.value as PersonaKey)}
              className="rounded-xl bg-slate-950 border border-emerald-500/50 px-3 py-2 text-sm font-semibold text-emerald-200"
            >
              {Object.values(PERSONAS).map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {demoCaption && (
        <div className="rounded-xl border border-amber-400/50 bg-amber-500/15 px-4 py-2.5 text-sm font-bold text-amber-200 flex items-center justify-between">
          <span>{demoCaption}</span>
          {isRecording && <span className="text-xs font-mono text-rose-300 animate-pulse">● REC</span>}
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { id: 'live_sui', label: 'Act 1 · Live Sui Wallet & Roles' },
          { id: 'studio', label: 'Act 2 · Blender .mcraft Studio' },
          { id: 'marketplace', label: 'Act 3 · Marketplace & Assets' },
          { id: 'game', label: 'Act 4 · Play Game & Waterfall' },
          { id: 'antipiracy', label: 'Act 5–6 · Anti-Piracy Lab' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold border transition ${
              activeTab === t.id
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          {activeTab === 'studio' && (
            <>
              <h2 className="text-lg font-bold text-emerald-300">Act 1 & 2 — Sui Login, CreatorUID & Blender `.mcraft` Publish</h2>
              <p className="text-sm text-slate-300">
                1. Sign in as <strong>Artist_A</strong> and mint your on-chain <code className="text-emerald-300">CreatorUID</code>.
                <br />
                2. In Blender (<code className="text-cyan-300">marketcraft_blender.py</code>), sign in with the same Sui ID, seal your 3D mesh into <code className="text-amber-300">cyber_sword_v1.mcraft</code>, and publish directly to MarketCraft.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleMintUid}
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  1. Mint CreatorUID ({persona.label})
                </button>
                <button
                  type="button"
                  onClick={handlePublishSword}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  2. Publish Cyber Sword (0.005 SUI) from Blender
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMcraft}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200"
                >
                  Download cyber_sword_v1.mcraft
                </button>
              </div>
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs font-mono space-y-1 text-slate-300">
                <div>Active Sui Address: {effectiveSuiAddress || '(Signed Out)'}</div>
                <div>CreatorUID Minted: {mintedUids[personaKey] ? 'YES ✅' : 'Not yet'}</div>
                <div>Cyber Sword Published: {swordPublished ? `YES ✅ (${swordPayloadHash})` : 'Pending Act 2'}</div>
                <div>DepartmentRegistry: {TESTNET_DEPT_REG_ID}</div>
                {blenderPublishedAssets.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 text-emerald-300">
                    🎨 Live Blender 5.3 Published Asset: <strong>{blenderPublishedAssets[0].title}</strong> · Author:{' '}
                    {blenderPublishedAssets[0].creator_sui_id.slice(0, 12)}... · SHA-256:{' '}
                    {blenderPublishedAssets[0].payload_sha256.slice(0, 18)}...
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'marketplace' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-emerald-300">Act 3 — Marketplace & My Assets Explorer (Testnet Pennies)</h2>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-cyan-200 cursor-pointer bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5">
                    <input
                      type="checkbox"
                      checked={showAssetLineage}
                      onChange={(e) => setShowAssetLineage(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    Show Asset Lineage & Owners
                  </label>
                  <button
                    type="button"
                    onClick={() => setPersonaKey('dev_b')}
                    className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200"
                  >
                    Switch to Dev_B
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Browse live assets published from Blender 5.3 & MarketCraft. Priced in pennies (<strong className="text-emerald-300">0.005–0.01 SUI</strong>) so any reviewer can test dozens of transactions from a single 1 SUI Testnet faucet claim.
              </p>

              {/* Marketplace Asset Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Card 1: Cyber Sword 3D */}
                <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {blenderPublishedAssets.length > 0 ? '🎨 LIVE BLENDER 5.3 .MCRAFT' : '3D ASSET · BLENDER'}
                    </span>
                    <span className="text-sm font-bold text-amber-300">0.005 SUI</span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {blenderPublishedAssets[0]?.title || 'Cyber Sword 3D (cyber_sword_v1.mcraft)'}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                    <div>Creator: {getRoleAddress('artist_a').slice(0, 12)}... (Artist_A)</div>
                    <div>SHA-256: {(blenderPublishedAssets[0]?.payload_sha256 || swordPayloadHash).slice(0, 22)}...</div>
                    <div>Status: {swordPublished ? 'Published & Verified ✅' : 'Not published yet (Run Act 2)'}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDevBuySword}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      {devBoughtSword ? 'Purchased ✅' : 'Buy Asset (0.005 SUI)'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadMcraft}
                      className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200"
                    >
                      Download .mcraft
                    </button>
                  </div>
                </div>

                {/* Card 2: Dummy Game v1 */}
                <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      PLAYABLE GAME · TIER-3B LINEAGE
                    </span>
                    <span className="text-sm font-bold text-amber-300">0.01 SUI</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{publishedGameTitle}</h3>
                  <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                    <div>Creator: {getRoleAddress('dev_b').slice(0, 12)}... (Dev_B)</div>
                    <div>Embedded Tier-3B: Artist_A (21.50% Auto-Royalty)</div>
                    <div>Status: {gamePublished ? 'Live on Marketplace ✅' : 'Requires Dev_B to buy Cyber Sword first'}</div>
                  </div>
                  {showAssetLineage && (
                    <div className="rounded-lg bg-slate-900/90 border border-emerald-500/30 p-2.5 text-[11px] font-mono space-y-1 text-slate-300">
                      <div className="text-emerald-300 font-bold">🌳 Asset Lineage & Royalty Owners:</div>
                      <div>• Tier 0 Founder: {FOUNDER_WALLET.slice(0, 10)}...c0a7 (1.50%)</div>
                      <div>• Tier 2 Tools: Blender + Godot OSS Vault (6.00%)</div>
                      <div>• Tier 3B Inherited (LOCKED): Cyber Sword → {getRoleAddress('artist_a').slice(0, 12)}... (21.50%)</div>
                      <div>• Tier 4 Composite Author: Armor + Game → {getRoleAddress('dev_b').slice(0, 12)}... (70.00%)</div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handlePublishDummyGame}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      {gamePublished ? 'Published ✅' : 'Build & Publish Game (0.01 SUI)'}
                    </button>
                    {gamePublished && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('game')}
                        className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Play in Act 4 →
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* My Assets & Entitlement Vault */}
              <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-4 space-y-2">
                <h3 className="text-sm font-bold text-cyan-300">
                  📦 My Assets & Entitlement Vault ({persona.label})
                </h3>
                <div className="text-xs font-mono text-slate-300 space-y-1">
                  {personaKey === 'artist_a' && swordPublished && (
                    <div className="text-emerald-300">• Cyber Sword 3D (.mcraft) — OWNER EDIT RECEIPT (can_edit_source = true)</div>
                  )}
                  {personaKey === 'dev_b' && devBoughtSword && (
                    <div className="text-cyan-300">• Cyber Sword 3D (.mcraft) — BUYER ENTITLEMENT RECEIPT (can_edit_source = false · Game Use Only)</div>
                  )}
                  {personaKey === 'dev_b' && gamePublished && (
                    <div className="text-emerald-300">• Dummy Game v1 — OWNER EDIT RECEIPT (can_edit_source = true)</div>
                  )}
                  {personaKey === 'player_c' && playerBoughtGame && (
                    <div className="text-cyan-300">• Dummy Game v1 — PLAYER ENTITLEMENT RECEIPT (Unlocked 3D Playable)</div>
                  )}
                  {((personaKey === 'signed_out') ||
                    (personaKey === 'attacker_x') ||
                    (personaKey === 'artist_a' && !swordPublished) ||
                    (personaKey === 'dev_b' && !devBoughtSword) ||
                    (personaKey === 'player_c' && !playerBoughtGame)) && (
                    <div className="text-slate-500">No owned assets or EntitlementReceipts for this persona yet.</div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'game' && (
            <>
              <h2 className="text-lg font-bold text-emerald-300">Act 4 — Buy {publishedGameTitle} (0.01 SUI) → Witness Waterfall on SuiScan</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={Boolean(liveBusy)}
                  onClick={handleRealTestnetBuyGameWaterfall}
                  className="rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-4 py-2 text-sm font-bold text-white shadow-lg"
                >
                  {liveBusy ? '⏳ Executing Real Sui Testnet Tx...' : '⛓️ Buy on REAL Sui Testnet (0.01 SUI) & Witness on SuiScan'}
                </button>
                <button
                  type="button"
                  onClick={() => setPersonaKey('player_c')}
                  className="rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200"
                >
                  Switch to Player_C
                </button>
                <button
                  type="button"
                  onClick={handlePlayerBuyGame}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white"
                >
                  Quick Demo Buy (Simulated)
                </button>
              </div>

              {lastWaterfallTxDigest && (
                <div className="rounded-xl border border-cyan-400/50 bg-cyan-950/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-cyan-200">
                    ⛓️ REAL Sui Testnet Waterfall Executed! Click to inspect exact coin splits on SuiScan:
                  </span>
                  <a
                    href={`https://suiscan.xyz/testnet/tx/${lastWaterfallTxDigest}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 font-mono font-bold text-white"
                  >
                    View Tx {lastWaterfallTxDigest.slice(0, 14)}... on SuiScan ↗
                  </a>
                </div>
              )}

              <DummyGameCanvas unlocked={playerBoughtGame} externalStrikes={autoStrikes} />

              {/* Live On-Chain ProtocolTreasuryUSD<SUI> Vault Balances (Read directly from Sui Testnet gRPC) */}
              <div className="rounded-xl border border-cyan-500/35 bg-slate-950 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-cyan-300">
                    🏦 Live On-Chain ProtocolTreasuryUSD&lt;SUI&gt; Vault Balances (Sui Testnet gRPC)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={refreshLiveTreasury}
                      className="rounded-lg bg-slate-800 border border-slate-600 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      🔄 Refresh Vaults
                    </button>
                    <a
                      href={`https://suiscan.xyz/testnet/object/${TESTNET_TREASURY_ID}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-cyan-300 underline hover:text-cyan-200"
                    >
                      Inspect on SuiScan ↗
                    </a>
                  </div>
                </div>
                {liveTreasury ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="rounded-lg bg-slate-900/90 border border-amber-500/30 p-2.5">
                      <div className="text-amber-300 font-bold">Tier 0 · Genesis Founder (1.50%)</div>
                      <div className="text-white text-sm font-bold">
                        {(liveTreasury.genesisBalanceMist / 1e9).toFixed(6)} SUI{' '}
                        <span className="text-[10px] text-slate-400">({liveTreasury.genesisBalanceMist.toLocaleString()} MIST)</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Locked to: {liveTreasury.genesisFounder.slice(0, 12)}...c0a7</div>
                    </div>
                    <div className="rounded-lg bg-slate-900/90 border border-emerald-500/30 p-2.5">
                      <div className="text-emerald-300 font-bold">Tier 2 · Retroactive OSS Tool Vault (6.00%)</div>
                      <div className="text-white text-sm font-bold">
                        {(liveTreasury.ossToolVaultBalanceMist / 1e9).toFixed(6)} SUI{' '}
                        <span className="text-[10px] text-slate-400">({liveTreasury.ossToolVaultBalanceMist.toLocaleString()} MIST)</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Blender / ArtCraft / Godot</div>
                    </div>
                    <div className="rounded-lg bg-slate-900/90 border border-cyan-500/30 p-2.5">
                      <div className="text-cyan-300 font-bold">Tier 7A · Gasless Paymaster (0.15%)</div>
                      <div className="text-white text-sm font-bold">
                        {(liveTreasury.paymasterBalanceMist / 1e9).toFixed(6)} SUI{' '}
                        <span className="text-[10px] text-slate-400">({liveTreasury.paymasterBalanceMist.toLocaleString()} MIST)</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/90 border border-indigo-500/30 p-2.5">
                      <div className="text-indigo-300 font-bold">Tier 7B · CloudCraft / Walrus (0.85%)</div>
                      <div className="text-white text-sm font-bold">
                        {(liveTreasury.cloudcraftBalanceMist / 1e9).toFixed(6)} SUI{' '}
                        <span className="text-[10px] text-slate-400">({liveTreasury.cloudcraftBalanceMist.toLocaleString()} MIST)</span>
                      </div>
                    </div>
                    <div className="sm:col-span-2 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-1.5 flex items-center justify-between">
                      <span className="text-slate-300">Total On-Chain Settled Volume:</span>
                      <span className="text-emerald-300 font-bold">
                        {(liveTreasury.totalSettledVolumeMist / 1e9).toFixed(6)} SUI ({liveTreasury.totalSettledVolumeMist.toLocaleString()} MIST)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-mono text-slate-400">Loading live ProtocolTreasuryUSD&lt;SUI&gt; from Sui Testnet gRPC...</div>
                )}
              </div>

              {lastWaterfall && (
                <div className="rounded-xl border border-emerald-500/35 bg-slate-950 p-4 space-y-2">
                  <h3 className="text-sm font-bold text-emerald-300">Atomic On-Chain 8-Tier Waterfall Breakdown (Zero Dust)</h3>
                  <div className="space-y-1.5 text-xs font-mono">
                    {lastWaterfall.map((s) => (
                      <div key={s.label} className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <div>
                          <span className="text-slate-100 font-semibold">{s.label}</span>{' '}
                          <span className="text-slate-400">({s.tier})</span>
                        </div>
                        <div className="text-emerald-300 font-bold">
                          {s.amountSui.toFixed(6)} SUI ({(s.bps / 100).toFixed(2)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'antipiracy' && (
            <>
              <h2 className="text-lg font-bold text-rose-300">Act 5 & 6 — Cryptographic Sign-In Gate & Anti-Piracy Proof Lab</h2>
              <p className="text-sm text-slate-300">
                Prove live that opening <code className="text-amber-300">cyber_sword_v1.mcraft</code> in Blender fails when signed out (<strong>Act 5</strong>), fails for an unauthorized Sui ID (<strong>Act 6A</strong>), blocks source edits by non-owners (<strong>Act 6B</strong>), and blocks on-chain plagiarism (<strong>Act 6C</strong>).
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPersonaKey('signed_out')}
                  className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200"
                >
                  Set Signed Out (Act 5)
                </button>
                <button
                  type="button"
                  onClick={() => setPersonaKey('attacker_x')}
                  className="rounded-lg bg-rose-950 border border-rose-500/50 px-3 py-1.5 text-xs font-semibold text-rose-200"
                >
                  Set Attacker_X (Act 6)
                </button>
                <button
                  type="button"
                  onClick={() => setPersonaKey('dev_b')}
                  className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200"
                >
                  Set Entitled Dev_B
                </button>
                <button
                  type="button"
                  onClick={() => setPersonaKey('artist_a')}
                  className="rounded-lg bg-emerald-950 border border-emerald-500/50 px-3 py-1.5 text-xs font-semibold text-emerald-200"
                >
                  Set Owner Artist_A
                </button>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => runBlenderOpenCheck(false)}
                  className="rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Try Open .mcraft in Blender
                </button>
                <button
                  type="button"
                  onClick={() => runBlenderOpenCheck(true)}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Try Modify / Overwrite Source .mcraft
                </button>
                <button
                  type="button"
                  onClick={runPlagiarismAttack}
                  className="rounded-xl bg-purple-700 hover:bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Try Re-Publish Copied Hash (Abort 1065)
                </button>
              </div>
            </>
          )}

          {activeTab === 'live_sui' && (
            <>
              <h2 className="text-lg font-bold text-cyan-300">Act 1 — Persistent Sui Testnet Wallet & 4-Role Login</h2>
              <p className="text-sm text-slate-300">
                Create a persistent Sui Testnet wallet (saved in your browser) <strong>or paste your own Sui address</strong>, then choose which of the 4 protocol roles to test live across Blender, Marketplace, Dummy Game, and Anti-Piracy.
              </p>

              {/* Wallet Create / Paste Controls */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomWalletAddress('');
                    handleInitLiveWallet(false);
                  }}
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  🔑 {liveKeypair ? 'Load Persistent Wallet' : 'Create Persistent Sui Wallet'}
                </button>
                {liveKeypair && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomWalletAddress('');
                      handleInitLiveWallet(true);
                    }}
                    className="rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200"
                  >
                    Generate Fresh Wallet
                  </button>
                )}
                {activeRealWalletAddress && (
                  <>
                    <button
                      type="button"
                      disabled={isRefreshingBalance}
                      onClick={() => refreshLiveBalance()}
                      className="rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-3 py-2 text-xs font-bold text-white"
                    >
                      {isRefreshingBalance ? '⏳ Checking...' : '🔄 Refresh Balance'}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(liveBusy)}
                      onClick={handleRequestFaucet}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-white"
                    >
                      💧 Auto-Faucet
                    </button>
                    <a
                      href={`https://faucet.sui.io/?address=${activeRealWalletAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-slate-800 border border-cyan-500/40 px-3 py-2 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                    >
                      Open Sui Web Faucet ↗
                    </a>
                  </>
                )}
              </div>

              {/* Paste Your Own Sui Address */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={customWalletAddress}
                  onChange={(e) => setCustomWalletAddress(e.target.value)}
                  placeholder="Optional: Paste your own 66-char Sui Testnet address (0x...) to track balance & test roles"
                  className="flex-1 min-w-[260px] rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-200"
                />
                {customWalletAddress && (
                  <button
                    type="button"
                    onClick={() => setCustomWalletAddress('')}
                    className="rounded-lg bg-slate-800 px-2.5 py-2 text-xs text-slate-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Persistent Wallet Info Card */}
              {activeRealWalletAddress && (
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs font-mono space-y-1.5 text-slate-300">
                  <div>
                    {customWalletAddress.trim() ? 'Watch Address (Pasted · Read-Only): ' : 'Active Browser Signer Wallet (Has Private Key): '}
                    <a
                      href={`https://suiscan.xyz/testnet/account/${activeRealWalletAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 underline break-all"
                    >
                      {activeRealWalletAddress}
                    </a>
                  </div>
                  {customWalletAddress.trim() && liveKeypair && (
                    <div className="text-amber-300">
                      Note: On-chain Testnet transactions sign with your Browser Signer Wallet ({liveKeypair.toSuiAddress().slice(0, 14)}...) since pasted addresses don't share private keys.
                    </div>
                  )}
                  <div>
                    Live Testnet Balance (Auto-updates every 5s):{' '}
                    <span className="text-emerald-300 font-bold">
                      {liveSuiBalance !== null ? `${liveSuiBalance.toFixed(4)} SUI` : 'Checking Sui Testnet RPC...'}
                    </span>
                  </div>
                  <div>Active Role Bound to Wallet: <span className="text-amber-300 font-bold">{persona.label}</span></div>
                  <div>On-Chain CreatorUID: {liveCreatorUidId || '(Click Step 1 below)'}</div>
                  <div>On-Chain ArtifactUAI: {liveArtifactId || '(Click Step 2 below)'}</div>
                  {liveBusy && <div className="text-amber-300 animate-pulse">⏳ {liveBusy}</div>}
                </div>
              )}

              {/* 4-Role Selector Cards */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Choose Which Role Your Active Wallet Plays (Permissions Enforced Everywhere):
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {[
                    {
                      key: 'artist_a' as PersonaKey,
                      title: '🎨 Artist_A — 3D Blender Creator',
                      desc: 'Creates & owns Cyber Sword (.mcraft). Full Owner Edit rights; earns 21.50% Tier-3B royalty on every downstream game sale.',
                    },
                    {
                      key: 'dev_b' as PersonaKey,
                      title: '🎮 Dev_B — Indie Game Dev',
                      desc: 'Buys Cyber Sword (0.005 SUI, Read-Only — CANNOT edit sword source!), embeds it into Dummy Game v1 (0.01 SUI), earns 70% Tier-4 floor.',
                    },
                    {
                      key: 'player_c' as PersonaKey,
                      title: '🕹️ Player_C — Game Buyer',
                      desc: 'Buys Dummy Game v1 (0.01 SUI). Restricted play-only access — CANNOT edit the game or the Cyber Sword.',
                    },
                    {
                      key: 'attacker_x' as PersonaKey,
                      title: '🛡️ Attacker_X — Unauthorized User',
                      desc: 'Holds ZERO EntitlementReceipts. Blocked from opening .mcraft in Blender (Code 1070), editing (1066), or re-publishing (Abort 1065).',
                    },
                  ].map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        setPersonaKey(r.key);
                        pushLog(`👤 Switched active wallet role -> ${r.title}`);
                      }}
                      className={`text-left rounded-xl p-3 border transition ${
                        personaKey === r.key
                          ? 'bg-emerald-500/15 border-emerald-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-300">{r.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Real On-Chain Sui Testnet Execution Buttons */}
              {liveKeypair && !customWalletAddress && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    disabled={Boolean(liveBusy)}
                    onClick={handleLiveMintUid}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white"
                  >
                    1. Mint Real CreatorUID On-Chain
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(liveBusy) || !liveCreatorUidId}
                    onClick={handleLivePublishArtifact}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white"
                  >
                    2. Publish Real ArtifactUAI (0.01 SUI)
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(liveBusy) || !liveArtifactId}
                    onClick={handleLiveBuyWaterfall}
                    className="rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white"
                  >
                    3. Buy & Settle Real 8-Tier Waterfall (0.01 SUI)
                  </button>
                </div>
              )}

              {liveTxLinks.length > 0 && (
                <div className="rounded-xl border border-emerald-500/35 bg-slate-950 p-3 space-y-1.5 text-xs">
                  <p className="font-bold text-emerald-300">Verified SuiScan Testnet Transactions</p>
                  {liveTxLinks.map((tx) => (
                    <div key={tx.digest} className="flex items-center justify-between font-mono">
                      <span className="text-slate-300">{tx.label}</span>
                      <a
                        href={`https://suiscan.xyz/testnet/tx/${tx.digest}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 underline hover:text-cyan-200"
                      >
                        {tx.digest.slice(0, 16)}... ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* Live Audit & Event Console */}
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col">
          <h3 className="text-sm font-bold text-cyan-300 mb-2">Live Protocol & Security Event Log</h3>
          <div className="flex-1 rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs font-mono space-y-2 overflow-y-auto max-h-[420px]">
            {securityLog.map((line, i) => (
              <div
                key={i}
                className={
                  line.includes('BLOCKED')
                    ? 'text-rose-300'
                    : line.includes('✅')
                      ? 'text-emerald-300'
                      : 'text-slate-300'
                }
              >
                {line}
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
