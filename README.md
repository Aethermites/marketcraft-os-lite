# MarketCraft OS Lite — Sui Foundation & Walrus Grant Showcase

**Genesis Attribution:** `"AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block"`  
**Author:** Hubert Silaa (`AetherMites`)  
**License:** Apache-2.0 / AGPLv3 Attribution-Preserving Specification

MarketCraft OS Lite is a lean, verifiable showcase of the **MarketCraft Protocol (`contracts/marketcraft_core`)** running live on **Sui Testnet** via **Sui gRPC (`@mysten/sui/grpc`)** and integrated with a real **Blender 4.x / 5.x** add-on.

## Live Sui Testnet Proof (SuiScan)
- **Immutable Core Package (`aethermites_marketcraft_core`):** [`0x850f67f853eaf9832469302acebb68b734693138f3d1dfb35aaba0860aa21cfe`](https://suiscan.xyz/testnet/object/0x850f67f853eaf9832469302acebb68b734693138f3d1dfb35aaba0860aa21cfe)
- **Genesis Publish Tx:** [`FaYwELwaeyV5iRUX53gTG4SuNzEjnT4gMDvzpPkNrvsw`](https://suiscan.xyz/testnet/tx/FaYwELwaeyV5iRUX53gTG4SuNzEjnT4gMDvzpPkNrvsw)
- **Live `ProtocolTreasuryUSD<SUI>` Vault:** [`0x45f2f7c8314a6d5a97e9ded5c862f0d33f6eadf56fc1f98bb937396f1bc33e7e`](https://suiscan.xyz/testnet/object/0x45f2f7c8314a6d5a97e9ded5c862f0d33f6eadf56fc1f98bb937396f1bc33e7e)
- **Live `PayloadHashRegistry` (Anti-Plagiarism):** [`0x1ed5fcb719b814e61e5bea245471056cc6094e6bb8ab65e83877df1697ed0183`](https://suiscan.xyz/testnet/object/0x1ed5fcb719b814e61e5bea245471056cc6094e6bb8ab65e83877df1697ed0183)
- **Live `DepartmentRegistry`:** [`0xc06f31b6db6576914dd287f2f342cad619f41f3182df12e61fe33502f6787f0d`](https://suiscan.xyz/testnet/object/0xc06f31b6db6576914dd287f2f342cad619f41f3182df12e61fe33502f6787f0d)

## Repository Structure
- `contracts/marketcraft_core/` — Lean Sui Move 2024 package (`CreatorUID`, `ArtifactUAI`, `EntitlementReceipt`, `PayloadHashRegistry`, Zero-Dust Two-Pass 8-Tier Waterfall, Dual-Key `DepartmentRegistry`).
- `plugin-sdk/blender-addon/` — Real Blender 4.x/5.x add-on (`marketcraft_blender.py`) with auto-synced Sui ID login, `.mcraft` cryptographic Sign-In & Entitlement Gate (`Code 1069 / 1070 / 1066`), and automatic Tier-3B lineage inheritance.
- `marketcraft-lite/` — Vite + React + TypeScript frontend powered by `@mysten/sui/grpc` (`SuiGrpcClient`), ready for 1-click Vercel/Netlify deployment.

## Verify Everything in 60 Seconds
```bash
# 1. Sui Move unit tests (6/6 pass, 0 warnings)
sui move test --path contracts/marketcraft_core

# 2. Blender add-on cryptographic self-tests (7/7 pass)
python plugin-sdk/blender-addon/marketcraft_blender.py

# 3. Run MarketCraft OS Lite locally
cd marketcraft-lite
npm install
npm run dev
# Open http://localhost:1425
```
