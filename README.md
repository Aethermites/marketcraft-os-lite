# MarketCraft OS — Free to Create · Pay Upon Sale · Local to Fulfill

**Genesis Attribution:** `"AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block"`  
**Organization:** AetherMites Labs (`@aethermites`) · **Genesis Architect:** Hubert Silaa  
**License:** Apache-2.0 / AGPLv3 Attribution-Preserving Specification

---

## Why the World Needs MarketCraft (What Is Missing in Today's Economy)

The world is changing. With the rise of Large Language Models (LLMs) and open-source creative software, the technical barrier between imagination and production has collapsed. Today, the bottleneck is no longer the ability to build video games, software, 3D assets, ergonomic CAD designs, or 3D BIM structures—the bottleneck is **capital and ownership at the entry level for everyday creators**.

In the legacy digital economy, a solo indie developer or 3D designer faces three structural walls before earning their first dollar:
1. **Upfront Capital Roadblocks:** Paying hundreds or thousands of dollars upfront for 3D assets, software subscriptions, cloud storage, app-store developer accounts, and blockchain gas fees—before a single customer has bought anything.
2. **Broken Attribution & Zero Downstream Royalties:** A 3D artist sells a sword or rig once for $5, and if an indie game studio uses it in a hit game that earns $500,000, the original artist earns $0—and the open-source tools (like Blender or Godot) that made it possible earn $0.
3. **Uncontrolled Piracy & File-Sharing Leakage:** Once a `.blend`, `.glb`, or `.stl` 3D-printable CAD file is downloaded, the creator loses all visibility and control. Buyers can copy, re-upload, or mass-manufacture thousands of physical units without the designer ever seeing another cent.

Inspired by the open-source spirit of **ArtCraft** and built under **AetherMites Labs**, **MarketCraft OS** pushes this movement into a new horizon built on **Three Pillars**:

> ### **1. Free to Create** — Zero upfront software paywalls, zero upfront storage bills, zero upfront gas fees (sponsored Paymaster + Pay-After-Sales Walrus/CloudCraft storage).  
> ### **2. Pay Upon Sale** — Every tool, 3D asset, code module, and storage tier is compensated automatically *only after* a real sale occurs, via an immutable, zero-dust **8-Tier On-Chain Waterfall** on Sui.  
> ### **3. Local to Fulfill** — Digital designs travel globally at the speed of light, while physical 3D-printed goods are manufactured locally on-demand—returning recurring royalties to the original designer on every verified print.

What if you could pay **$0 at entry** and only pay when you make a sale? What if your digital designs could be composed and printed anywhere on Earth while you cryptographically retain your authorship and recurring royalties? What if we could suffocate casual piracy by binding files to verified on-chain entitlements rather than broken Web2 DRM?

---

## Real-World Scenarios Powered by MarketCraft Protocol

### Scenario 1: The Indie Video Game Supply Chain (Live in Our 6-Act Sui Testnet Demo)
1. **3D Artist (`Artist_A`) in Blender:** Designs a stylized **Cyber Sword** in Blender 5.3 using the MarketCraft add-on. Their Sui Wallet ID auto-syncs with zero copy-pasting. One click seals the mesh into a tamper-evident **`.mcraft`** file stamped with their `CreatorUID`, Ground-Up Genesis Proof, and SHA-256 fingerprint, and publishes it to the MarketCraft Marketplace.
2. **Indie Game Developer (`Dev_B`) Composes Without Stealing:** `Dev_B` searches MarketCraft, licenses **`cyber_sword_v1.mcraft`**, and imports it Read-Only into their own project alongside their **Dummy Armor** and game logic. `Dev_B` **cannot** overwrite `Artist_A`'s source file (`Code 1066`) and **cannot** re-publish the sword alone (`Abort 1065` on-chain plagiarism block). Instead, the MarketCraft plugin **automatically locks `Artist_A`'s UAI into the combined game's Tier-3B royalty lineage**.
3. **Player (`Player_C`) Buys the Game → Atomic 8-Tier Waterfall on Sui:** The instant `Player_C` purchases the game, a **single atomic Sui Move transaction** settles `100.00%` with zero mathematical dust:
   - **Tier 0 (`1.50%`):** Genesis Protocol Treasury (`0x9329...c0a7`)
   - **Tier 2 (`6.00%`):** Retroactive Open-Source Tool Vault (Blender Foundation / Godot / ArtCraft)
   - **Tier 3B (`21.50%`):** `Artist_A` (automatic downstream royalty on every single game copy sold!)
   - **Tier 4 (`70.00%`):** `Dev_B` (protected Master Creator floor)
   - **Tier 7 (`0.15%` Paymaster + `0.85%` CloudCraft/Walrus):** Gasless infrastructure & Pay-After-Sales decentralized storage
4. **Suffocating Piracy:** If an unauthenticated user tries to open `cyber_sword_v1.mcraft` in Blender without signing into MarketCraft (`Code 1069`), or if an unauthorized user (`Attacker_X`) tries to open it without an on-chain `EntitlementReceipt` (`Code 1070`), Blender refuses to decrypt the asset.

### Scenario 2: 3D-Printable Ergonomic CAD Shoes — Global Design, Local Fulfillment, Pay-Per-Print Royalties
Imagine a footwear engineer designing **ultra-comfortable, 3D-printable lattice shoes** in FreeCAD or Blender—featuring a unique internal cushioning geometry that feels plush and supportive regardless of the TPU/PLA filament used.
- **In the Legacy Economy:** If the designer sells the `.stl` file for $10, a buyer can print 500 pairs for friends and local shops while the designer earns $0 beyond that first $10. So designers refuse to release their best CAD files, and local 3D printers sit underutilized.
- **With MarketCraft Protocol:**
  1. The designer publishes the shoe as a **`.mcraft` metered CAD asset** on MarketCraft Marketplace (paying **$0 upfront** for hosting or listing).
  2. A buyer across the world purchases a **1-Print Entitlement** and prints the pair on their home or neighborhood 3D printer. They love how comfortable the shoes feel.
  3. Their friends immediately ask for pairs too. Instead of pirating the file, the buyer simply taps **Print Another Pair**—because the `.mcraft` CAD file is cryptographically metered and verified by the printer bridge/slicer (`EntitlementReceipt` print-counter check), **every single physical pair printed triggers a micro-royalty payout on Sui** straight back to the original shoe designer, the CAD tool vault, and Walrus storage!
  4. **Result:** Global R&D meets **Local Fulfillment**—zero overseas shipping containers, zero factory minimums, zero inventory waste, and permanent recurring income for the original CAD designer.

### Scenario 3: Modular 3D BIM & Zero-Capital Digital Components
An architect designs a parametric solar-passive roof truss or a developer builds a reusable shader/physics crate. Hundreds of studios and builders worldwide embed those `.mcraft` modules into finished buildings, simulations, and apps with **$0 upfront licensing cost**—paying the original engineers automatically via the on-chain waterfall every time a finished project sells.

---

## Live Sui Testnet Proof (Verifiable Today on SuiScan)
- **Immutable Core Package (`aethermites_marketcraft_core`):** [`0x850f67f853eaf9832469302acebb68b734693138f3d1dfb35aaba0860aa21cfe`](https://suiscan.xyz/testnet/object/0x850f67f853eaf9832469302acebb68b734693138f3d1dfb35aaba0860aa21cfe)
- **Genesis Publish Tx:** [`FaYwELwaeyV5iRUX53gTG4SuNzEjnT4gMDvzpPkNrvsw`](https://suiscan.xyz/testnet/tx/FaYwELwaeyV5iRUX53gTG4SuNzEjnT4gMDvzpPkNrvsw)
- **Live `ProtocolTreasuryUSD<SUI>` Vault:** [`0x45f2f7c8314a6d5a97e9ded5c862f0d33f6eadf56fc1f98bb937396f1bc33e7e`](https://suiscan.xyz/testnet/object/0x45f2f7c8314a6d5a97e9ded5c862f0d33f6eadf56fc1f98bb937396f1bc33e7e)
- **Live `PayloadHashRegistry` (Anti-Plagiarism):** [`0x1ed5fcb719b814e61e5bea245471056cc6094e6bb8ab65e83877df1697ed0183`](https://suiscan.xyz/testnet/object/0x1ed5fcb719b814e61e5bea245471056cc6094e6bb8ab65e83877df1697ed0183)
- **Live `DepartmentRegistry`:** [`0xc06f31b6db6576914dd287f2f342cad619f41f3182df12e61fe33502f6787f0d`](https://suiscan.xyz/testnet/object/0xc06f31b6db6576914dd287f2f342cad619f41f3182df12e61fe33502f6787f0d)

## Quick Start for Grant Reviewers (Verify in 60 Seconds)
```bash
# 1. Run Sui Move unit tests (6/6 pass, 0 warnings)
sui move test --path contracts/marketcraft_core

# 2. Run Blender 5.3 add-on cryptographic self-tests (7/7 pass)
python plugin-sdk/blender-addon/marketcraft_blender.py

# 3. Run MarketCraft OS Lite locally (connects live via Sui gRPC)
cd marketcraft-lite
npm install
npm run dev
# Open http://localhost:1425
```
