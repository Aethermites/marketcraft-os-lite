# MarketCraft OS Lite — 6-Act Live Sui Testnet Showcase

**Genesis Attribution:** `"AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block"`

A lean, verifiable showcase of **MarketCraft Core** (`contracts/marketcraft_core`) running live on **Sui Testnet** via **Sui gRPC (`@mysten/sui/grpc`)**, demonstrating:
1. **Persistent Sui Testnet Wallet & 4-Role Switcher** (`Artist_A`, `Dev_B`, `Player_C`, `Attacker_X`)
2. **Real Blender 5.3 `.mcraft` Sealing & Composite Lineage Inheritance** (`plugin-sdk/blender-addon/marketcraft_blender.py`)
3. **Atomic Zero-Dust 8-Tier Royalty Waterfall** (`1.50%` Tier-0 Genesis, `6.00%` Tier-2 OSS Tool Vault, `0.15%` Paymaster, `0.85%` CloudCraft/Walrus, `21.50%` Tier-3B Artist, `70.00%` Tier-4 Composite Creator)
4. **Live On-Chain `ProtocolTreasuryUSD<SUI>` Vault Readout** + **Anti-Piracy & Anti-Plagiarism Guards** (`Code 1069`, `Code 1070`, `Code 1066`, `Abort 1065`)

## Live Sui Testnet Deployment
- **Package ID (`aethermites_marketcraft_core`):** [`0x850f67f853eaf9832469302acebb68b734693138f3d1dfb35aaba0860aa21cfe`](https://suiscan.xyz/testnet/object/0x850f67f853eaf9832469302acebb68b734693138f3d1dfb35aaba0860aa21cfe)
- **Genesis Publish Tx:** [`FaYwELwaeyV5iRUX53gTG4SuNzEjnT4gMDvzpPkNrvsw`](https://suiscan.xyz/testnet/tx/FaYwELwaeyV5iRUX53gTG4SuNzEjnT4gMDvzpPkNrvsw)
- **`ProtocolTreasuryUSD<SUI>`:** [`0x45f2f7c8314a6d5a97e9ded5c862f0d33f6eadf56fc1f98bb937396f1bc33e7e`](https://suiscan.xyz/testnet/object/0x45f2f7c8314a6d5a97e9ded5c862f0d33f6eadf56fc1f98bb937396f1bc33e7e)
- **`PayloadHashRegistry`:** [`0x1ed5fcb719b814e61e5bea245471056cc6094e6bb8ab65e83877df1697ed0183`](https://suiscan.xyz/testnet/object/0x1ed5fcb719b814e61e5bea245471056cc6094e6bb8ab65e83877df1697ed0183)

## Quick Start for Grant Reviewers
```bash
# 1. Run Sui Move unit tests (6/6 pass, 0 warnings)
sui move test --path ../contracts/marketcraft_core

# 2. Run Blender add-on cryptographic self-tests (7/7 pass)
python ../plugin-sdk/blender-addon/marketcraft_blender.py

# 3. Run MarketCraft OS Lite locally
npm install
npm run dev
# Opens on http://localhost:1425
```
