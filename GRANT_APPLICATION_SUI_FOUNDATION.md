# MarketCraft OS Lite — Sui Foundation & Walrus Grant Application Pack

**Genesis Attribution:** `"AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block"`  
**Applicant / Genesis Architect:** Hubert Silaa (`AetherMites`)  
**Target Programs:** Sui Foundation Builder Grants & Walrus Ecosystem Grants  

---

## 1. Copy-Paste Application Answers

### Project Title
**MarketCraft OS — Atomic Multi-Tier Royalty Waterfall & `.mcraft` Asset Lineage Protocol on Sui + Walrus**

### One-Line Elevator Pitch
An open-source, gasless creator economy operating system on Sui that embeds cryptographic asset lineage directly into Blender, Godot, and ArtCraft—automatically splitting every downstream sale across original 3D artists, game developers, open-source tools, and Walrus storage in one atomic Move transaction.

### Problem Statement
Today's digital creator and indie game supply chains are broken by three structural failures:
1. **Broken Upstream Attribution:** When a 3D artist sells a sword or rig for $5, and an indie game developer uses it to sell $500,000 of games, the 3D artist earns $0 in downstream royalties—and open-source tools like Blender or Godot earn $0 from the commercial value they power.
2. **Upfront Storage & Gas Paywalls:** Emerging-market and indie creators cannot afford upfront cloud hosting, Web3 gas tokens, or 30% Web2 app store fees before making their first sale.
3. **Unchecked Asset Piracy & Plagiarism:** Downloaded 3D/CAD source files are trivially re-uploaded under different accounts without cryptographic entitlement checks or on-chain hash deduplication.

### Our Solution (Why Sui + Walrus Are Uniquely Required)
MarketCraft OS solves this using Sui's object-centric Move 2024 architecture and Walrus decentralized storage:
- **Physical Multi-Package Security (`marketcraft_core` + Satellite Departments):** An immutable Supreme Founder Kernel (`marketcraft_core`) holds the `10,000 bps` Two-Pass 8-Tier Waterfall math, `ProtocolTreasuryUSD<T>`, `PayloadHashRegistry`, and `CreatorUID`. Future vertical departments (`dept_genge`, `dept_playcraft`, etc.) deploy as isolated satellite packages with independent `UpgradeCap`s that can never mutate core waterfall math (`Abort 1129`).
- **Atomic Zero-Dust 8-Tier Waterfall:** On every downstream purchase (`buy_artifact_and_settle_waterfall`), a single Sui transaction atomically routes:
  - **Tier 0 (1.50%):** Genesis Protocol Treasury
  - **Tier 2 (6.00%):** Retroactive Open-Source Tool Vault (e.g., Blender Foundation, Godot, ArtCraft)
  - **Tier 3A (≤ 2.00% `C_cap`) & Tier 3B (Pro-Rata):** Upstream 3D/code asset authors automatically inherited from `.mcraft` composite files
  - **Tier 4 (40%–91.50% Protected Floor + Elastic Rollback):** Master Creator / Game Developer with zero mathematical dust
  - **Tier 7 (0.15% Paymaster + 0.85% CloudCraft/Walrus):** `$0` upfront gasless onboarding & Pay-After-Sales Walrus blob storage
- **Real Native Tool Plugins (Blender 5.3 Live Today):** The MarketCraft Blender add-on auto-syncs the creator's Sui wallet ID (zero copy-pasting), enforces Ground-Up Genesis Proof (`Code 1005`), seals `.mcraft` assets with cryptographic Sign-In & `EntitlementReceipt` gates (`Code 1069 / 1070 / 1066`), and locks inherited Tier-3B royalty owners into composite exports.

### Live Sui Testnet Proof (Verifiable Today on SuiScan)
- **Package ID (`aethermites_marketcraft_core`):** `0x850f67f853eaf9832469302acebb68b734693138f3d1dfb35aaba0860aa21cfe`
- **Genesis Publish Tx:** `https://suiscan.xyz/testnet/tx/FaYwELwaeyV5iRUX53gTG4SuNzEjnT4gMDvzpPkNrvsw`
- **Live `ProtocolTreasuryUSD<SUI>` Vault:** `https://suiscan.xyz/testnet/object/0x45f2f7c8314a6d5a97e9ded5c862f0d33f6eadf56fc1f98bb937396f1bc33e7e`
- **Live `PayloadHashRegistry` (Anti-Plagiarism):** `https://suiscan.xyz/testnet/object/0x1ed5fcb719b814e61e5bea245471056cc6094e6bb8ab65e83877df1697ed0183`
- **Live `DepartmentRegistry`:** `https://suiscan.xyz/testnet/object/0xc06f31b6db6576914dd287f2f342cad619f41f3182df12e61fe33502f6787f0d`
- **Automated Test Verification:** `110/110` Move unit tests (`0` warnings), `28/28` Rust sidecar tests, `7/7` Blender 5.3 add-on self-tests, and `SuiGrpcClient` (`@mysten/sui/grpc`) live Testnet integration.

---

## 2. Suggested Milestone-Based Grant Budget ($45,000 Total — 16 Weeks)

| Milestone | Timeline | Concrete On-Chain & Open-Source Deliverables | Requested Grant |
| :--- | :--- | :--- | :--- |
| **M1 — Security Audit & Mainnet `marketcraft_core`** | Weeks 1–5 | External Move security review of `marketcraft_core`, zkLogin + Sponsored Gasless Paymaster integration, Mainnet deployment with verified `ProtocolTreasuryUSD<USDC>` and `TaxCraft` VAT/CSV export. | **$15,000** |
| **M2 — Walrus Pay-After-Sales Storage & Blender/Godot SDK v1.0** | Weeks 6–11 | Live Walrus blob storage & encrypted `.mcraft` streaming inside `sidecar-mcp`, production Blender 4.x/5.x + Godot 4.x plugins with one-click Marketplace import/publish and automated Tier-3B lineage inheritance. | **$15,000** |
| **M3 — Public Creator Beta & Open-Source Tool Vault Launch** | Weeks 12–16 | Onboard 100+ verified 3D/indie creators (`CreatorUID`), publish 250+ composite `.mcraft` assets/games on Sui Mainnet, release full open-source SDK docs & Retroactive OSS Tool Vault GitHub OAuth claim flow. | **$15,000** |

---

## 3. Exact 3-Minute Demo Video Shot List (Voiceover Script)

*Use `Win + Alt + R` (or OBS) at 1080p. Keep Blender 5.3 and `MarketCraft OS Lite` side by side.*

- **0:00 – 0:25 | Intro & Live Sui Testnet Wallet (Act 1)**
  - *Show:* `MarketCraft OS Lite` Act 1 with your persistent Sui Testnet wallet showing live `1.0000 SUI` balance (Sui gRPC) and clickable SuiScan Testnet package link (`0x850f67...1cfe`).
  - *Say:* "Hi, I'm Hubert Silaa, founder of MarketCraft OS. Today I'll prove how a 3D artist in real Blender, an indie game developer, and a player settle multi-tier royalties atomically on Sui Testnet—with cryptographic anti-piracy."
- **0:25 – 0:55 | Real Blender 5.3: Artist Creates & Publishes Sword (Act 2)**
  - *Show:* Real Blender 5.3 with the emerald 3D Cyber Sword. Click `Sign In with MarketCraft (Auto-Sync Sui ID)` (point out zero copy-pasting!), then click `Seal & Publish Protected .mcraft to Marketplace`.
  - *Say:* "As Artist A in real Blender 5.3, my Sui ID auto-syncs from MarketCraft. One click seals this Cyber Sword into an encrypted `.mcraft` file stamped with its SHA-256 hash and publishes it for 0.005 SUI."
- **0:55 – 1:40 | Dev_B Buys, Imports Read-Only into Blender, Adds Dummy Armor & Publishes Composite (Act 3)**
  - *Show:* In MarketCraft OS Lite Act 3, switch to `Dev_B`, buy Cyber Sword (`0.005 SUI`), switch to Blender 5.3, click `Sign In` (now `Dev_B`), click `Open Protected .mcraft` (imports Read-Only and locks `Artist_A` into Tier-3B lineage), click `Add Dummy Armor`, point to the `100.00%` Asset Lineage box (`1.5%` Founder, `6%` Blender, `21.5%` Artist A, `70%` Dev B), and click `Seal & Publish`.
  - *Say:* "Now Dev B buys a Read-Only license, opens the sword inside Blender, adds Dummy Armor, and notice the lineage panel automatically locks Artist A at 21.5%—Dev B cannot strip them out."
- **1:40 – 2:25 | Real Sui Testnet Purchase & SuiScan Waterfall Proof (Act 4)**
  - *Show:* In Act 4, click `⛓️ Buy on REAL Sui Testnet (0.01 SUI) & Witness on SuiScan`. Show the unlocked 3D game, the `Live On-Chain ProtocolTreasuryUSD<SUI> Vault Balances` incrementing live via Sui gRPC, and click `View Tx on SuiScan ↗` → open the `Events` tab (`WaterfallSettledEvent`) and `ProtocolTreasuryUSD` `Fields`.
  - *Say:* "When a player buys the combined game for 0.01 SUI, one atomic Sui transaction pays Artist A, Dev B, Blender's OSS Vault, Paymaster, CloudCraft/Walrus, and the Genesis Treasury with zero dust—all verifiable live on SuiScan."
- **2:25 – 3:00 | Real Blender Anti-Piracy Proof (Acts 5 & 6)**
  - *Show:* Back in real Blender 5.3, click `Sign Out` → click `Open Protected .mcraft` → red **`Code 1069: Sign-In Required`** popup. Switch MarketCraft to `Attacker_X` → click `Open Protected .mcraft` in Blender → red **`Code 1070: EntitlementReceiptMissing`** popup.
  - *Say:* "Finally, if anyone signs out or logs in with an unauthorized Sui ID like Attacker X, real Blender blocks opening the `.mcraft` file—and our on-chain `PayloadHashRegistry` blocks plagiarism with Abort 1065. Thank you!"
