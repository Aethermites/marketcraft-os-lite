// AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block
// License: Apache-2.0 / AGPLv3 Attribution-Preserving Specification
//
// Physical Package #1: `marketcraft_core` (Immutable Supreme Founder Kernel)
// This package is deployed separately from all departmental satellites (`dept_genge`,
// `dept_streamcraft`, `dept_playcraft`, etc.). No satellite package UpgradeCap can
// ever upgrade, mutate, or redirect the Founder address (`0x9329...c0a7`), the
// 10,000 bps 8-Tier Waterfall math, or `ProtocolTreasuryUSD<T>`.

module marketcraft_core::core {
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::table::{Self, Table};

    // =========================================================================
    // MANDATORY GENESIS ATTRIBUTION & CONSTITUTIONAL CONSTANTS
    // =========================================================================
    const GENESIS_ATTRIBUTION: vector<u8> =
        b"AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block";

    /// Permanent Genesis Founder address (Hubert Silaa) — immutable across all upgrades.
    const GENESIS_FOUNDER: address =
        @0x93292808389b92e73100284f931f7e027e003fafc2d3cbfbfbc520da6098c0a7;

    /// Constitutional Basis Points Denominator (100.00%).
    const BASIS_POINTS_DENOMINATOR: u64 = 10_000;

    /// Tier 0 — Genesis Treasury (1.50% / 150 bps) — permanently routed to Founder.
    const GENESIS_TREASURY_BPS: u64 = 150;
    /// Tier 7A — Gasless Paymaster Pool (0.15% / 15 bps).
    const PAYMASTER_POOL_BPS: u64 = 15;
    /// Tier 7B — CloudCraft / Walrus Storage Pool (0.85% / 85 bps).
    const CLOUDCRAFT_WALRUS_BPS: u64 = 85;
    /// Tier 2 — Retroactive Open-Source Tool Vault (6.00% / 600 bps, e.g. github.com/storytold).
    const RETROACTIVE_TOOL_VAULT_BPS: u64 = 600;
    /// Tier 5 + 6 — Storefront & Nomad Affiliate Discovery Pool (4.50% / 450 bps).
    const STOREFRONT_AFFILIATE_BPS: u64 = 450;
    /// Tier 3A — Micro-Asset Combined Cap (2.00% / 200 bps C_cap in Pass 1).
    const TIER1_MICRO_CAP_BPS: u64 = 200;

    /// 48-hour on-chain timelock for Top-Level Ascended Council chartering new departments.
    const TOP_COUNCIL_TIMELOCK_MS: u64 = 172_800_000;

    // =========================================================================
    // ERROR CODES
    // =========================================================================
    const EZeroPayment: u64 = 1001;
    const EVectorLengthMismatch: u64 = 1002;
    const EInvalidMasterBps: u64 = 1003;
    const EUnauthorizedFounderAction: u64 = 1004;
    const EPlagiarizedPayloadHash: u64 = 1065;
    const EUnauthorizedArtifactModification: u64 = 1066;
    const EIncorrectPurchasePrice: u64 = 1067;
    const ECreatorUidOwnershipMismatch: u64 = 1068;
    const EDepartmentAlreadyRegistered: u64 = 1120;
    const ENotCouncilMember: u64 = 1121;
    const EInvalidCouncilThreshold: u64 = 1122;
    const EProposalAlreadyExecuted: u64 = 1124;
    const EQuorumNotReached: u64 = 1125;
    const ETimelockNotElapsed: u64 = 1126;
    const EDepartmentScopeMismatch: u64 = 1128;
    const ECoreGenesisMutationForbidden: u64 = 1129;

    // =========================================================================
    // CORE OBJECTS
    // =========================================================================

    /// Held strictly by the Genesis Founder (`0x9329...c0a7`). Cannot be minted by satellites.
    public struct GenesisAdminCap has key, store {
        id: UID,
        founder: address,
        attribution: vector<u8>,
    }

    /// Constitutional Protocol Treasury holding the immutable Tier 0, 2, 5/6, and 7 pools.
    public struct ProtocolTreasuryUSD<phantom T> has key {
        id: UID,
        attribution: vector<u8>,
        genesis_founder: address,
        genesis_balance: Balance<T>,
        paymaster_balance: Balance<T>,
        cloudcraft_walrus_balance: Balance<T>,
        retroactive_tool_vault_balance: Balance<T>,
        storefront_affiliate_balance: Balance<T>,
        total_settled_volume: u64,
    }

    /// 1-Human-1-Account Creator UID issued by MarketCraft Core.
    public struct CreatorUID has key, store {
        id: UID,
        owner: address,
        handle: vector<u8>,
        verified_human: bool,
    }

    /// Global Anti-Plagiarism Registry mapping SHA-256 `.mcraft` payload hashes to their
    /// original creator address. Blocks unauthorized re-publishing (`Abort 1065`).
    public struct PayloadHashRegistry has key {
        id: UID,
        attribution: vector<u8>,
        hashes: Table<vector<u8>, address>,
    }

    /// Published `.mcraft` Digital Asset or Game on MarketCraft Core with embedded
    /// Tier-3A / Tier-3B royalty lineage and SHA-256 integrity hash.
    public struct ArtifactUAI has key {
        id: UID,
        attribution: vector<u8>,
        title: vector<u8>,
        asset_kind: vector<u8>, // e.g. b"3d_asset" or b"game"
        creator: address,
        creator_uid_id: address,
        payload_hash: vector<u8>,
        price_usdc: u64,
        master_bps: u64,
        tier1_micro_recipients: vector<address>,
        tier1_micro_bps: vector<u64>,
        tier2_core_recipients: vector<address>,
        tier2_core_weights: vector<u64>,
        include_oss_tool_vault: bool,
        include_storefront_affiliate: bool,
        sales_count: u64,
        version: u64,
    }

    /// Cryptographic On-Chain Entitlement NFT minted on publish (creator: `can_edit_source = true`)
    /// or purchase (buyer: `can_edit_source = false`). Verified by `sidecar-mcp` + Blender before
    /// decrypting any `.mcraft` asset.
    public struct EntitlementReceipt has key, store {
        id: UID,
        artifact_id: address,
        holder: address,
        creator: address,
        can_edit_source: bool,
    }

    /// Ascended Top-Level Executive Council (can replace operational CEO & charter new
    /// satellite departments with a 48h timelock, NEVER mutate `GENESIS_FOUNDER` or `150 bps`).
    public struct MarketCraftTopCouncil has key {
        id: UID,
        members: vector<address>,
        threshold: u64,
        genesis_founder_protected: address,
        next_proposal_id: u64,
    }

    /// Proposal for Top Council to charter a future satellite department.
    public struct NewDepartmentProposal has key {
        id: UID,
        proposal_id: u64,
        department_code: vector<u8>,
        satellite_package_id: address,
        initial_wallet: address,
        approvals: vector<address>,
        created_at_ms: u64,
        executed: bool,
    }

    /// Dual-Key Registry of all chartered satellite departments (`dept_genge`, `dept_streamcraft`, etc.).
    public struct DepartmentRegistry has key {
        id: UID,
        attribution: vector<u8>,
        genesis_founder: address,
        departments: Table<vector<u8>, address>,
        total_departments: u64,
    }

    /// Scoped Upgrade/Governance Capability for ONE satellite department.
    /// `can_mutate_core_genesis` is hardcoded `false` — enforced by both Move type boundaries
    /// and runtime scope checks (`Abort 1129`).
    public struct DepartmentUpgradeCap has key, store {
        id: UID,
        department_code: vector<u8>,
        satellite_package_id: address,
        department_wallet: address,
        is_ascended_multisig: bool,
        can_mutate_core_genesis: bool,
    }

    // =========================================================================
    // EVENTS
    // =========================================================================
    public struct ConstitutionalDeductionEvent has copy, drop {
        source_department: vector<u8>,
        gross_amount: u64,
        genesis_fee: u64,
        paymaster_fee: u64,
        cloudcraft_fee: u64,
    }

    public struct WaterfallSettledEvent has copy, drop {
        gross_amount: u64,
        master_creator: address,
        master_payout: u64,
        tier1_micro_total: u64,
        tier2_core_total: u64,
        oss_tool_vault_amount: u64,
        storefront_affiliate_amount: u64,
    }

    public struct DepartmentCharteredEvent has copy, drop {
        department_code: vector<u8>,
        satellite_package_id: address,
        department_wallet: address,
        chartered_by_founder: bool,
    }

    public struct DepartmentHandoverEvent has copy, drop {
        department_code: vector<u8>,
        new_multisig_wallet: address,
    }

    public struct ArtifactPublishedEvent has copy, drop {
        artifact_id: address,
        creator: address,
        title: vector<u8>,
        asset_kind: vector<u8>,
        payload_hash: vector<u8>,
        price_usdc: u64,
    }

    public struct ArtifactPurchasedEvent has copy, drop {
        artifact_id: address,
        buyer: address,
        price_usdc: u64,
        sales_count: u64,
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /// Bootstraps `marketcraft_core`: creates `ProtocolTreasuryUSD<T>`, `DepartmentRegistry`,
    /// and transfers `GenesisAdminCap` to the transaction sender (Founder).
    #[allow(lint(self_transfer))]
    public fun initialize_core_kernel<T>(ctx: &mut TxContext) {
        let sender = ctx.sender();
        let cap = GenesisAdminCap {
            id: object::new(ctx),
            founder: GENESIS_FOUNDER,
            attribution: GENESIS_ATTRIBUTION,
        };
        let treasury = ProtocolTreasuryUSD<T> {
            id: object::new(ctx),
            attribution: GENESIS_ATTRIBUTION,
            genesis_founder: GENESIS_FOUNDER,
            genesis_balance: balance::zero<T>(),
            paymaster_balance: balance::zero<T>(),
            cloudcraft_walrus_balance: balance::zero<T>(),
            retroactive_tool_vault_balance: balance::zero<T>(),
            storefront_affiliate_balance: balance::zero<T>(),
            total_settled_volume: 0,
        };
        let registry = DepartmentRegistry {
            id: object::new(ctx),
            attribution: GENESIS_ATTRIBUTION,
            genesis_founder: GENESIS_FOUNDER,
            departments: table::new<vector<u8>, address>(ctx),
            total_departments: 0,
        };
        let hash_registry = PayloadHashRegistry {
            id: object::new(ctx),
            attribution: GENESIS_ATTRIBUTION,
            hashes: table::new<vector<u8>, address>(ctx),
        };
        transfer::public_transfer(cap, sender);
        transfer::share_object(treasury);
        transfer::share_object(registry);
        transfer::share_object(hash_registry);
    }

    /// Permissionless self-onboarding for Testnet / zkLogin users to mint their `CreatorUID`.
    #[allow(lint(self_transfer))]
    public fun mint_self_creator_uid(
        handle: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        let uid = CreatorUID {
            id: object::new(ctx),
            owner: sender,
            handle,
            verified_human: true,
        };
        transfer::public_transfer(uid, sender);
    }

    /// Publishes a sealed `.mcraft` asset or game on-chain.
    /// - Enforces `creator_uid.owner == ctx.sender()` (`Abort 1068`).
    /// - Enforces anti-plagiarism on `payload_hash` (`Abort 1065` if hash already exists).
    /// - Shares `ArtifactUAI` and mints a `can_edit_source = true` `EntitlementReceipt` to the creator.
    #[allow(lint(self_transfer))]
    public fun publish_artifact_uai(
        hash_registry: &mut PayloadHashRegistry,
        creator_uid: &CreatorUID,
        title: vector<u8>,
        asset_kind: vector<u8>,
        payload_hash: vector<u8>,
        price_usdc: u64,
        master_bps: u64,
        tier1_micro_recipients: vector<address>,
        tier1_micro_bps: vector<u64>,
        tier2_core_recipients: vector<address>,
        tier2_core_weights: vector<u64>,
        include_oss_tool_vault: bool,
        include_storefront_affiliate: bool,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert!(creator_uid.owner == sender, ECreatorUidOwnershipMismatch);
        assert!(master_bps >= 4_000 && master_bps <= 9_750, EInvalidMasterBps);
        assert!(vector::length(&tier1_micro_recipients) == vector::length(&tier1_micro_bps), EVectorLengthMismatch);
        assert!(vector::length(&tier2_core_recipients) == vector::length(&tier2_core_weights), EVectorLengthMismatch);
        assert!(!table::contains(&hash_registry.hashes, payload_hash), EPlagiarizedPayloadHash);

        table::add(&mut hash_registry.hashes, payload_hash, sender);

        let artifact_uid = object::new(ctx);
        let artifact_id = object::uid_to_address(&artifact_uid);
        let artifact = ArtifactUAI {
            id: artifact_uid,
            attribution: GENESIS_ATTRIBUTION,
            title,
            asset_kind,
            creator: sender,
            creator_uid_id: object::uid_to_address(&creator_uid.id),
            payload_hash,
            price_usdc,
            master_bps,
            tier1_micro_recipients,
            tier1_micro_bps,
            tier2_core_recipients,
            tier2_core_weights,
            include_oss_tool_vault,
            include_storefront_affiliate,
            sales_count: 0,
            version: 1,
        };

        let owner_receipt = EntitlementReceipt {
            id: object::new(ctx),
            artifact_id,
            holder: sender,
            creator: sender,
            can_edit_source: true,
        };

        event::emit(ArtifactPublishedEvent {
            artifact_id,
            creator: sender,
            title: artifact.title,
            asset_kind: artifact.asset_kind,
            payload_hash: artifact.payload_hash,
            price_usdc,
        });

        transfer::share_object(artifact);
        transfer::public_transfer(owner_receipt, sender);
    }

    /// Updates an existing `ArtifactUAI`'s `.mcraft` payload hash.
    /// Strictly aborts with `Abort 1066` if any user other than the original creator attempts edits.
    public fun update_artifact_uai_source(
        hash_registry: &mut PayloadHashRegistry,
        artifact: &mut ArtifactUAI,
        creator_uid: &CreatorUID,
        new_payload_hash: vector<u8>,
        ctx: &TxContext,
    ) {
        let sender = ctx.sender();
        assert!(sender == artifact.creator && creator_uid.owner == artifact.creator, EUnauthorizedArtifactModification);
        assert!(!table::contains(&hash_registry.hashes, new_payload_hash), EPlagiarizedPayloadHash);
        table::add(&mut hash_registry.hashes, new_payload_hash, sender);
        artifact.payload_hash = new_payload_hash;
        artifact.version = artifact.version + 1;
    }

    /// Purchases an `ArtifactUAI`, atomically executes the Two-Pass 8-Tier Waterfall
    /// (Founder 1.50% + Paymaster 0.15% + CloudCraft 0.85% + OSS Tool Vault 6.00% +
    /// Tier-3A/3B contributors + Tier-4 Master Creator), and mints an `EntitlementReceipt`
    /// (`can_edit_source = false`) to the buyer so Blender/sidecar-mcp can unlock `.mcraft`.
    #[allow(lint(self_transfer))]
    public fun buy_artifact_and_settle_waterfall<T>(
        treasury: &mut ProtocolTreasuryUSD<T>,
        artifact: &mut ArtifactUAI,
        payment: Coin<T>,
        ctx: &mut TxContext,
    ) {
        let buyer = ctx.sender();
        assert!(coin::value(&payment) == artifact.price_usdc, EIncorrectPurchasePrice);

        settle_two_pass_waterfall<T>(
            treasury,
            payment,
            artifact.creator,
            artifact.master_bps,
            artifact.tier1_micro_recipients,
            artifact.tier1_micro_bps,
            artifact.tier2_core_recipients,
            artifact.tier2_core_weights,
            artifact.include_oss_tool_vault,
            artifact.include_storefront_affiliate,
            ctx,
        );

        artifact.sales_count = artifact.sales_count + 1;
        let artifact_id = object::uid_to_address(&artifact.id);
        let receipt = EntitlementReceipt {
            id: object::new(ctx),
            artifact_id,
            holder: buyer,
            creator: artifact.creator,
            can_edit_source: false,
        };

        event::emit(ArtifactPurchasedEvent {
            artifact_id,
            buyer,
            price_usdc: artifact.price_usdc,
            sales_count: artifact.sales_count,
        });

        transfer::public_transfer(receipt, buyer);
    }

    /// Mints a verified 1-Human-1-Account `CreatorUID`.
    public fun mint_creator_uid(
        admin: &GenesisAdminCap,
        recipient: address,
        handle: vector<u8>,
        ctx: &mut TxContext,
    ) {
        assert!(admin.founder == GENESIS_FOUNDER, EUnauthorizedFounderAction);
        let uid = CreatorUID {
            id: object::new(ctx),
            owner: recipient,
            handle,
            verified_human: true,
        };
        transfer::public_transfer(uid, recipient);
    }

    // =========================================================================
    // CONSTITUTIONAL DEDUCTIONS & TWO-PASS 8-TIER WATERFALL (ZERO-DUST)
    // =========================================================================

    /// Called by satellite packages (e.g. `dept_genge`) on every commercial settlement.
    /// Atomically carves out the immutable 2.50% constitutional floor:
    ///   - 1.50% (150 bps) -> Genesis Founder Treasury (`0x9329...c0a7`)
    ///   - 0.15% (15 bps)  -> Gasless Paymaster Pool
    ///   - 0.85% (85 bps)  -> CloudCraft / Walrus Storage Pool
    /// Leaves the remaining 97.50% inside `payment` for satellite-specific distribution.
    public fun route_constitutional_deductions<T>(
        treasury: &mut ProtocolTreasuryUSD<T>,
        dept_cap: &DepartmentUpgradeCap,
        payment: &mut Coin<T>,
        ctx: &mut TxContext,
    ): (u64, u64, u64) {
        assert!(!dept_cap.can_mutate_core_genesis, ECoreGenesisMutationForbidden);
        let gross = coin::value(payment);
        assert!(gross > 0, EZeroPayment);

        let genesis_fee = ((gross as u128) * (GENESIS_TREASURY_BPS as u128) / (BASIS_POINTS_DENOMINATOR as u128)) as u64;
        let paymaster_fee = ((gross as u128) * (PAYMASTER_POOL_BPS as u128) / (BASIS_POINTS_DENOMINATOR as u128)) as u64;
        let cloudcraft_fee = ((gross as u128) * (CLOUDCRAFT_WALRUS_BPS as u128) / (BASIS_POINTS_DENOMINATOR as u128)) as u64;

        if (genesis_fee > 0) {
            let c = coin::split(payment, genesis_fee, ctx);
            balance::join(&mut treasury.genesis_balance, coin::into_balance(c));
        };
        if (paymaster_fee > 0) {
            let c = coin::split(payment, paymaster_fee, ctx);
            balance::join(&mut treasury.paymaster_balance, coin::into_balance(c));
        };
        if (cloudcraft_fee > 0) {
            let c = coin::split(payment, cloudcraft_fee, ctx);
            balance::join(&mut treasury.cloudcraft_walrus_balance, coin::into_balance(c));
        };

        treasury.total_settled_volume = treasury.total_settled_volume + gross;

        event::emit(ConstitutionalDeductionEvent {
            source_department: dept_cap.department_code,
            gross_amount: gross,
            genesis_fee,
            paymaster_fee,
            cloudcraft_fee,
        });

        (genesis_fee, paymaster_fee, cloudcraft_fee)
    }

    /// Full Zero-Dust Two-Pass 8-Tier Waterfall with Elastic Rollback to Tier 4 Master Creator.
    /// - Constitutional Floor (250 bps): Genesis (150) + Paymaster (15) + CloudCraft (85)
    /// - Optional Tier 2 OSS Tool Vault (600 bps) & Tier 5/6 Storefront/Affiliate (450 bps)
    /// - Pass 1: Caps Tier-3A Micro-Assets at `<= 200 bps` (`C_cap`)
    /// - Pass 2: Pays Tier-4 Master Creator (`master_bps`) + Tier-3B Core Contributors pro-rata
    ///   by complexity weight (`w_i * a_i * u_i`), rolling 100% of unused bps & rounding dust
    ///   back to `master_creator` (zero mathematical dust).
    public fun settle_two_pass_waterfall<T>(
        treasury: &mut ProtocolTreasuryUSD<T>,
        mut payment: Coin<T>,
        master_creator: address,
        master_bps: u64,
        tier1_micro_recipients: vector<address>,
        tier1_micro_bps: vector<u64>,
        tier2_core_recipients: vector<address>,
        tier2_core_weights: vector<u64>,
        include_oss_tool_vault: bool,
        include_storefront_affiliate: bool,
        ctx: &mut TxContext,
    ) {
        let gross = coin::value(&payment);
        assert!(gross > 0, EZeroPayment);
        assert!(vector::length(&tier1_micro_recipients) == vector::length(&tier1_micro_bps), EVectorLengthMismatch);
        assert!(vector::length(&tier2_core_recipients) == vector::length(&tier2_core_weights), EVectorLengthMismatch);
        assert!(master_bps >= 4_000 && master_bps <= 9_750, EInvalidMasterBps);

        // 1. Constitutional Deductions (250 bps)
        let genesis_fee = ((gross as u128) * (GENESIS_TREASURY_BPS as u128) / (BASIS_POINTS_DENOMINATOR as u128)) as u64;
        let paymaster_fee = ((gross as u128) * (PAYMASTER_POOL_BPS as u128) / (BASIS_POINTS_DENOMINATOR as u128)) as u64;
        let cloudcraft_fee = ((gross as u128) * (CLOUDCRAFT_WALRUS_BPS as u128) / (BASIS_POINTS_DENOMINATOR as u128)) as u64;

        if (genesis_fee > 0) {
            balance::join(&mut treasury.genesis_balance, coin::into_balance(coin::split(&mut payment, genesis_fee, ctx)));
        };
        if (paymaster_fee > 0) {
            balance::join(&mut treasury.paymaster_balance, coin::into_balance(coin::split(&mut payment, paymaster_fee, ctx)));
        };
        if (cloudcraft_fee > 0) {
            balance::join(&mut treasury.cloudcraft_walrus_balance, coin::into_balance(coin::split(&mut payment, cloudcraft_fee, ctx)));
        };

        // 2. Optional Tier 2 OSS Tool Vault (600 bps) & Tier 5/6 Storefront/Affiliate (450 bps)
        let oss_amount = if (include_oss_tool_vault) {
            let amt = ((gross as u128) * (RETROACTIVE_TOOL_VAULT_BPS as u128) / (BASIS_POINTS_DENOMINATOR as u128)) as u64;
            if (amt > 0) {
                balance::join(&mut treasury.retroactive_tool_vault_balance, coin::into_balance(coin::split(&mut payment, amt, ctx)));
            };
            amt
        } else {
            0
        };

        let storefront_amount = if (include_storefront_affiliate) {
            let amt = ((gross as u128) * (STOREFRONT_AFFILIATE_BPS as u128) / (BASIS_POINTS_DENOMINATOR as u128)) as u64;
            if (amt > 0) {
                balance::join(&mut treasury.storefront_affiliate_balance, coin::into_balance(coin::split(&mut payment, amt, ctx)));
            };
            amt
        } else {
            0
        };

        // 3. Pass 1: Tier-3A Micro-Assets capped at C_cap = 200 bps
        let micro_len = vector::length(&tier1_micro_recipients);
        let mut raw_micro_bps_sum: u64 = 0;
        let mut i = 0;
        while (i < micro_len) {
            raw_micro_bps_sum = raw_micro_bps_sum + *vector::borrow(&tier1_micro_bps, i);
            i = i + 1;
        };

        let effective_micro_cap_bps = if (raw_micro_bps_sum > TIER1_MICRO_CAP_BPS) {
            TIER1_MICRO_CAP_BPS
        } else {
            raw_micro_bps_sum
        };
        let micro_pool_amount = ((gross as u128) * (effective_micro_cap_bps as u128) / (BASIS_POINTS_DENOMINATOR as u128)) as u64;

        let mut tier1_micro_paid: u64 = 0;
        if (micro_len > 0 && raw_micro_bps_sum > 0 && micro_pool_amount > 0) {
            let mut j = 0;
            while (j < micro_len) {
                let recip = *vector::borrow(&tier1_micro_recipients, j);
                let bps_j = *vector::borrow(&tier1_micro_bps, j);
                let share = ((micro_pool_amount as u128) * (bps_j as u128) / (raw_micro_bps_sum as u128)) as u64;
                if (share > 0 && coin::value(&payment) >= share) {
                    let c = coin::split(&mut payment, share, ctx);
                    transfer::public_transfer(c, recip);
                    tier1_micro_paid = tier1_micro_paid + share;
                };
                j = j + 1;
            };
        };

        // 4. Pass 2: Tier-3B Core Contributors pro-rata from remaining above Master floor
        let core_len = vector::length(&tier2_core_recipients);
        let mut total_core_weight: u64 = 0;
        let mut k = 0;
        while (k < core_len) {
            total_core_weight = total_core_weight + *vector::borrow(&tier2_core_weights, k);
            k = k + 1;
        };

        let master_floor_amount = ((gross as u128) * (master_bps as u128) / (BASIS_POINTS_DENOMINATOR as u128)) as u64;
        let mut tier2_core_paid: u64 = 0;
        if (core_len > 0 && total_core_weight > 0 && coin::value(&payment) > master_floor_amount) {
            let core_pool = coin::value(&payment) - master_floor_amount;
            let mut m = 0;
            while (m < core_len) {
                let recip = *vector::borrow(&tier2_core_recipients, m);
                let w_m = *vector::borrow(&tier2_core_weights, m);
                let share = ((core_pool as u128) * (w_m as u128) / (total_core_weight as u128)) as u64;
                if (share > 0 && coin::value(&payment) >= share) {
                    let c = coin::split(&mut payment, share, ctx);
                    transfer::public_transfer(c, recip);
                    tier2_core_paid = tier2_core_paid + share;
                };
                m = m + 1;
            };
        };

        // 5. Tier 4 Master Creator receives protected floor + 100% elastic rollback + zero dust
        let master_payout = coin::value(&payment);
        transfer::public_transfer(payment, master_creator);
        treasury.total_settled_volume = treasury.total_settled_volume + gross;

        event::emit(WaterfallSettledEvent {
            gross_amount: gross,
            master_creator,
            master_payout,
            tier1_micro_total: tier1_micro_paid,
            tier2_core_total: tier2_core_paid,
            oss_tool_vault_amount: oss_amount,
            storefront_affiliate_amount: storefront_amount,
        });
    }

    /// Founder withdraws accumulated Genesis 1.50% stream strictly to `GENESIS_FOUNDER`.
    public fun withdraw_genesis_treasury<T>(
        admin: &GenesisAdminCap,
        treasury: &mut ProtocolTreasuryUSD<T>,
        amount: u64,
        ctx: &mut TxContext,
    ) {
        assert!(admin.founder == GENESIS_FOUNDER, EUnauthorizedFounderAction);
        let withdrawn = coin::take(&mut treasury.genesis_balance, amount, ctx);
        transfer::public_transfer(withdrawn, treasury.genesis_founder);
    }

    // =========================================================================
    // DUAL-KEY DEPARTMENT REGISTRY & SCOPED SATELLITE CAPS
    // =========================================================================

    /// Founder initializes the Ascended Top-Level Executive Council (M-of-N Multi-Sig).
    public fun initialize_top_council(
        admin: &GenesisAdminCap,
        members: vector<address>,
        threshold: u64,
        ctx: &mut TxContext,
    ) {
        assert!(admin.founder == GENESIS_FOUNDER, EUnauthorizedFounderAction);
        let count = vector::length(&members);
        assert!(threshold > 0 && threshold <= count, EInvalidCouncilThreshold);
        let council = MarketCraftTopCouncil {
            id: object::new(ctx),
            members,
            threshold,
            genesis_founder_protected: GENESIS_FOUNDER,
            next_proposal_id: 1,
        };
        transfer::share_object(council);
    }

    /// Key #1: Founder immediately charters a satellite department (e.g. `b"dept_genge"`).
    /// Mints a scoped `DepartmentUpgradeCap` with `can_mutate_core_genesis = false`.
    public fun charter_department_by_founder(
        admin: &GenesisAdminCap,
        registry: &mut DepartmentRegistry,
        department_code: vector<u8>,
        satellite_package_id: address,
        initial_wallet: address,
        ctx: &mut TxContext,
    ) {
        assert!(admin.founder == GENESIS_FOUNDER, EUnauthorizedFounderAction);
        assert!(!table::contains(&registry.departments, department_code), EDepartmentAlreadyRegistered);
        table::add(&mut registry.departments, department_code, initial_wallet);
        registry.total_departments = registry.total_departments + 1;

        let cap = DepartmentUpgradeCap {
            id: object::new(ctx),
            department_code,
            satellite_package_id,
            department_wallet: initial_wallet,
            is_ascended_multisig: false,
            can_mutate_core_genesis: false,
        };

        event::emit(DepartmentCharteredEvent {
            department_code: cap.department_code,
            satellite_package_id,
            department_wallet: initial_wallet,
            chartered_by_founder: true,
        });

        transfer::public_transfer(cap, initial_wallet);
    }

    /// Key #2 (Step 1): Ascended Top Council proposes a new future satellite department.
    public fun propose_new_department_by_top_council(
        council: &mut MarketCraftTopCouncil,
        registry: &DepartmentRegistry,
        department_code: vector<u8>,
        satellite_package_id: address,
        initial_wallet: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert!(vector::contains(&council.members, &sender), ENotCouncilMember);
        assert!(!table::contains(&registry.departments, department_code), EDepartmentAlreadyRegistered);

        let proposal_id = council.next_proposal_id;
        council.next_proposal_id = proposal_id + 1;

        let mut approvals = vector[];
        vector::push_back(&mut approvals, sender);

        let proposal = NewDepartmentProposal {
            id: object::new(ctx),
            proposal_id,
            department_code,
            satellite_package_id,
            initial_wallet,
            approvals,
            created_at_ms: clock::timestamp_ms(clock),
            executed: false,
        };
        transfer::share_object(proposal);
    }

    /// Key #2 (Step 2): Top Council member approves; once quorum + 48h timelock are met,
    /// charters the new department with `can_mutate_core_genesis = false`.
    public fun approve_and_charter_department_by_top_council(
        council: &MarketCraftTopCouncil,
        registry: &mut DepartmentRegistry,
        proposal: &mut NewDepartmentProposal,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert!(vector::contains(&council.members, &sender), ENotCouncilMember);
        assert!(!proposal.executed, EProposalAlreadyExecuted);

        if (!vector::contains(&proposal.approvals, &sender)) {
            vector::push_back(&mut proposal.approvals, sender);
        };

        assert!(vector::length(&proposal.approvals) >= council.threshold, EQuorumNotReached);
        assert!(
            clock::timestamp_ms(clock) >= proposal.created_at_ms + TOP_COUNCIL_TIMELOCK_MS,
            ETimelockNotElapsed
        );
        assert!(!table::contains(&registry.departments, proposal.department_code), EDepartmentAlreadyRegistered);

        proposal.executed = true;
        table::add(&mut registry.departments, proposal.department_code, proposal.initial_wallet);
        registry.total_departments = registry.total_departments + 1;

        let cap = DepartmentUpgradeCap {
            id: object::new(ctx),
            department_code: proposal.department_code,
            satellite_package_id: proposal.satellite_package_id,
            department_wallet: proposal.initial_wallet,
            is_ascended_multisig: true,
            can_mutate_core_genesis: false,
        };

        event::emit(DepartmentCharteredEvent {
            department_code: cap.department_code,
            satellite_package_id: proposal.satellite_package_id,
            department_wallet: proposal.initial_wallet,
            chartered_by_founder: false,
        });

        transfer::public_transfer(cap, proposal.initial_wallet);
    }

    /// Transfers a department's `DepartmentUpgradeCap` from the Founder's initial wallet
    /// to an Ascended 5-Seat Departmental Council Multi-Sig wallet.
    public fun handover_department_cap_to_ascended_org(
        registry: &mut DepartmentRegistry,
        mut cap: DepartmentUpgradeCap,
        new_multisig_wallet: address,
        ctx: &TxContext,
    ) {
        assert!(ctx.sender() == cap.department_wallet, EUnauthorizedFounderAction);
        assert!(!cap.can_mutate_core_genesis, ECoreGenesisMutationForbidden);

        cap.department_wallet = new_multisig_wallet;
        cap.is_ascended_multisig = true;

        if (table::contains(&registry.departments, cap.department_code)) {
            let slot = table::borrow_mut(&mut registry.departments, cap.department_code);
            *slot = new_multisig_wallet;
        };

        event::emit(DepartmentHandoverEvent {
            department_code: cap.department_code,
            new_multisig_wallet,
        });

        transfer::public_transfer(cap, new_multisig_wallet);
    }

    /// Runtime security guard called by satellite packages before executing upgrades or governance.
    /// Hard-aborts with `1129` (`ECoreGenesisMutationForbidden`) if any caller tries to touch core genesis.
    public fun verify_department_upgrade_scope(
        cap: &DepartmentUpgradeCap,
        expected_department_code: vector<u8>,
        target_is_core_genesis: bool,
    ) {
        assert!(!target_is_core_genesis && !cap.can_mutate_core_genesis, ECoreGenesisMutationForbidden);
        assert!(cap.department_code == expected_department_code, EDepartmentScopeMismatch);
    }

    // =========================================================================
    // READ-ONLY ACCESSORS (SAFE FOR SATELLITE PACKAGES)
    // =========================================================================
    public fun genesis_founder(): address { GENESIS_FOUNDER }
    public fun genesis_attribution(): vector<u8> { GENESIS_ATTRIBUTION }
    public fun treasury_genesis_balance<T>(t: &ProtocolTreasuryUSD<T>): u64 { balance::value(&t.genesis_balance) }
    public fun treasury_paymaster_balance<T>(t: &ProtocolTreasuryUSD<T>): u64 { balance::value(&t.paymaster_balance) }
    public fun treasury_cloudcraft_balance<T>(t: &ProtocolTreasuryUSD<T>): u64 { balance::value(&t.cloudcraft_walrus_balance) }
    public fun treasury_oss_vault_balance<T>(t: &ProtocolTreasuryUSD<T>): u64 { balance::value(&t.retroactive_tool_vault_balance) }
    public fun treasury_storefront_balance<T>(t: &ProtocolTreasuryUSD<T>): u64 { balance::value(&t.storefront_affiliate_balance) }
    public fun treasury_total_volume<T>(t: &ProtocolTreasuryUSD<T>): u64 { t.total_settled_volume }
    public fun department_code(cap: &DepartmentUpgradeCap): vector<u8> { cap.department_code }
    public fun department_wallet(cap: &DepartmentUpgradeCap): address { cap.department_wallet }
    public fun department_can_mutate_core(cap: &DepartmentUpgradeCap): bool { cap.can_mutate_core_genesis }
    public fun registry_total_departments(r: &DepartmentRegistry): u64 { r.total_departments }
    public fun artifact_creator(a: &ArtifactUAI): address { a.creator }
    public fun artifact_sales_count(a: &ArtifactUAI): u64 { a.sales_count }
    public fun artifact_version(a: &ArtifactUAI): u64 { a.version }
    public fun entitlement_can_edit(r: &EntitlementReceipt): bool { r.can_edit_source }
    public fun entitlement_holder(r: &EntitlementReceipt): address { r.holder }
}
