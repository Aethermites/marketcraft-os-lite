// AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block
// License: Apache-2.0 / AGPLv3 Attribution-Preserving Specification

#[test_only]
module marketcraft_core::core_tests {
    use sui::clock;
    use sui::coin;
    use sui::test_scenario;
    use marketcraft_core::core::{
        Self,
        ArtifactUAI,
        CreatorUID,
        DepartmentRegistry,
        DepartmentUpgradeCap,
        EntitlementReceipt,
        GenesisAdminCap,
        MarketCraftTopCouncil,
        NewDepartmentProposal,
        PayloadHashRegistry,
        ProtocolTreasuryUSD,
    };

    public struct MOCK_USDC has drop {}

    const FOUNDER: address = @0x93292808389b92e73100284f931f7e027e003fafc2d3cbfbfbc520da6098c0a7;
    const EXEC_1: address = @0xE1;
    const EXEC_2: address = @0xE2;
    const EXEC_3: address = @0xE3;
    const MASTER_CREATOR: address = @0xA1;
    const MICRO_1: address = @0xB1;
    const MICRO_2: address = @0xB2;
    const CORE_1: address = @0xC1;
    const CORE_2: address = @0xC2;
    const GENGE_MULTISIG: address = @0x9E9E;

    #[test]
    fun test_two_pass_waterfall_zero_dust_and_founder_withdrawal() {
        let mut scenario = test_scenario::begin(FOUNDER);
        {
            core::initialize_core_kernel<MOCK_USDC>(scenario.ctx());
        };

        // Settle $100.00 (100_000_000 micro-USDC) with 2 micro assets (exceeding 200 bps cap)
        // and 2 core contributors (weights 300 and 700), plus OSS Tool Vault + Storefront
        scenario.next_tx(MASTER_CREATOR);
        {
            let mut treasury = scenario.take_shared<ProtocolTreasuryUSD<MOCK_USDC>>();
            let payment = coin::mint_for_testing<MOCK_USDC>(100_000_000, scenario.ctx());

            core::settle_two_pass_waterfall<MOCK_USDC>(
                &mut treasury,
                payment,
                MASTER_CREATOR,
                4_000, // 40.00% protected floor
                vector[MICRO_1, MICRO_2],
                vector[300, 300], // 600 bps requested -> capped to 200 bps (2_000_000)
                vector[CORE_1, CORE_2],
                vector[300, 700],
                true,  // 600 bps OSS Tool Vault
                true,  // 450 bps Storefront/Affiliate
                scenario.ctx(),
            );

            assert!(core::treasury_genesis_balance(&treasury) == 1_500_000, 0);
            assert!(core::treasury_paymaster_balance(&treasury) == 150_000, 1);
            assert!(core::treasury_cloudcraft_balance(&treasury) == 850_000, 2);
            assert!(core::treasury_oss_vault_balance(&treasury) == 6_000_000, 3);
            assert!(core::treasury_storefront_balance(&treasury) == 4_500_000, 4);
            assert!(core::treasury_total_volume(&treasury) == 100_000_000, 5);
            test_scenario::return_shared(treasury);
        };

        // Verify Micro-Assets were capped to 1_000_000 each (200 bps total)
        scenario.next_tx(MICRO_1);
        {
            let c = scenario.take_from_sender<coin::Coin<MOCK_USDC>>();
            assert!(coin::value(&c) == 1_000_000, 6);
            scenario.return_to_sender(c);
        };

        // Verify Founder can withdraw Genesis 1.50% stream
        scenario.next_tx(FOUNDER);
        {
            let admin = scenario.take_from_sender<GenesisAdminCap>();
            let mut treasury = scenario.take_shared<ProtocolTreasuryUSD<MOCK_USDC>>();
            core::withdraw_genesis_treasury(&admin, &mut treasury, 1_500_000, scenario.ctx());
            assert!(core::treasury_genesis_balance(&treasury) == 0, 7);
            test_scenario::return_shared(treasury);
            scenario.return_to_sender(admin);
        };

        scenario.end();
    }

    #[test]
    fun test_dual_key_department_chartering_and_handover() {
        let mut scenario = test_scenario::begin(FOUNDER);
        let mut clk = clock::create_for_testing(scenario.ctx());
        clock::set_for_testing(&mut clk, 1_000_000);

        {
            core::initialize_core_kernel<MOCK_USDC>(scenario.ctx());
        };

        // Founder initializes Top Council (2-of-3) and charters `dept_genge` immediately
        scenario.next_tx(FOUNDER);
        {
            let admin = scenario.take_from_sender<GenesisAdminCap>();
            let mut registry = scenario.take_shared<DepartmentRegistry>();
            core::initialize_top_council(&admin, vector[EXEC_1, EXEC_2, EXEC_3], 2, scenario.ctx());
            core::charter_department_by_founder(
                &admin,
                &mut registry,
                b"dept_genge",
                @0xDE01,
                FOUNDER,
                scenario.ctx(),
            );
            assert!(core::registry_total_departments(&registry) == 1, 0);
            test_scenario::return_shared(registry);
            scenario.return_to_sender(admin);
        };

        // Founder hands over `dept_genge` cap to Ascended 5-Seat Genge Multi-Sig
        scenario.next_tx(FOUNDER);
        {
            let mut registry = scenario.take_shared<DepartmentRegistry>();
            let cap = scenario.take_from_sender<DepartmentUpgradeCap>();
            core::verify_department_upgrade_scope(&cap, b"dept_genge", false);
            core::handover_department_cap_to_ascended_org(&mut registry, cap, GENGE_MULTISIG, scenario.ctx());
            test_scenario::return_shared(registry);
        };

        // Top Council proposes a brand-new future department `dept_agri` without Founder
        scenario.next_tx(EXEC_1);
        {
            let mut council = scenario.take_shared<MarketCraftTopCouncil>();
            let registry = scenario.take_shared<DepartmentRegistry>();
            core::propose_new_department_by_top_council(
                &mut council,
                &registry,
                b"dept_agri",
                @0xDE02,
                @0xA6A1,
                &clk,
                scenario.ctx(),
            );
            test_scenario::return_shared(council);
            test_scenario::return_shared(registry);
        };

        // Advance clock past 48h timelock and approve with EXEC_2 (quorum 2-of-3)
        clock::increment_for_testing(&mut clk, 172_800_001);
        scenario.next_tx(EXEC_2);
        {
            let council = scenario.take_shared<MarketCraftTopCouncil>();
            let mut registry = scenario.take_shared<DepartmentRegistry>();
            let mut proposal = scenario.take_shared<NewDepartmentProposal>();
            core::approve_and_charter_department_by_top_council(
                &council,
                &mut registry,
                &mut proposal,
                &clk,
                scenario.ctx(),
            );
            assert!(core::registry_total_departments(&registry) == 2, 1);
            test_scenario::return_shared(council);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(proposal);
        };

        clock::destroy_for_testing(clk);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = 1129)]
    fun test_satellite_department_cannot_mutate_core_genesis() {
        let mut scenario = test_scenario::begin(FOUNDER);
        {
            core::initialize_core_kernel<MOCK_USDC>(scenario.ctx());
        };
        scenario.next_tx(FOUNDER);
        {
            let admin = scenario.take_from_sender<GenesisAdminCap>();
            let mut registry = scenario.take_shared<DepartmentRegistry>();
            core::charter_department_by_founder(&admin, &mut registry, b"dept_genge", @0xDE01, GENGE_MULTISIG, scenario.ctx());
            test_scenario::return_shared(registry);
            scenario.return_to_sender(admin);
        };
        scenario.next_tx(GENGE_MULTISIG);
        {
            let cap = scenario.take_from_sender<DepartmentUpgradeCap>();
            // Attempting to target core genesis MUST abort with 1129!
            core::verify_department_upgrade_scope(&cap, b"dept_genge", true);
            scenario.return_to_sender(cap);
        };
        scenario.end();
    }

    #[test]
    fun test_6_act_blender_asset_to_dummy_game_waterfall_and_entitlements() {
        let artist_a = @0xA771;
        let dev_b = @0xDE7B;
        let player_c = @0x91A7;
        let mut scenario = test_scenario::begin(FOUNDER);
        {
            core::initialize_core_kernel<MOCK_USDC>(scenario.ctx());
        };

        // Act 1: Artist_A and Dev_B mint their own CreatorUIDs on Sui
        scenario.next_tx(artist_a);
        {
            core::mint_self_creator_uid(b"artist_a_blender", scenario.ctx());
        };
        scenario.next_tx(dev_b);
        {
            core::mint_self_creator_uid(b"dev_b_godot", scenario.ctx());
        };

        // Act 2: Artist_A publishes "Cyber Sword (.mcraft)" from Blender for $5.00
        scenario.next_tx(artist_a);
        {
            let mut hash_reg = scenario.take_shared<PayloadHashRegistry>();
            let uid = scenario.take_from_sender<CreatorUID>();
            core::publish_artifact_uai(
                &mut hash_reg,
                &uid,
                b"Cyber Sword 3D",
                b"3d_asset",
                b"sha256_cyber_sword_v1",
                5_000_000, // $5.00
                9_150,     // 91.50% (after 2.50% constitutional + 6.00% Blender OSS Tool Vault)
                vector[],
                vector[],
                vector[],
                vector[],
                true,      // 6.00% Retroactive OSS Tool Vault (Blender/ArtCraft)
                false,
                scenario.ctx(),
            );
            scenario.return_to_sender(uid);
            test_scenario::return_shared(hash_reg);
        };

        // Act 3: Dev_B buys "Cyber Sword" ($5.00), receives EntitlementReceipt (can_edit = false),
        //        and publishes "Dummy Game v1" ($10.00) linking Artist_A as Tier-3B Core Contributor!
        scenario.next_tx(dev_b);
        {
            let mut treasury = scenario.take_shared<ProtocolTreasuryUSD<MOCK_USDC>>();
            let mut sword = scenario.take_shared<ArtifactUAI>();
            let pay = coin::mint_for_testing<MOCK_USDC>(5_000_000, scenario.ctx());
            core::buy_artifact_and_settle_waterfall<MOCK_USDC>(&mut treasury, &mut sword, pay, scenario.ctx());
            assert!(core::artifact_sales_count(&sword) == 1, 0);
            test_scenario::return_shared(sword);
            test_scenario::return_shared(treasury);
        };
        scenario.next_tx(dev_b);
        {
            let receipt = scenario.take_from_sender<EntitlementReceipt>();
            assert!(core::entitlement_holder(&receipt) == dev_b, 1);
            assert!(!core::entitlement_can_edit(&receipt), 2);
            scenario.return_to_sender(receipt);

            let mut hash_reg = scenario.take_shared<PayloadHashRegistry>();
            let dev_uid = scenario.take_from_sender<CreatorUID>();
            core::publish_artifact_uai(
                &mut hash_reg,
                &dev_uid,
                b"Dummy Game v1",
                b"game",
                b"sha256_dummy_game_v1",
                10_000_000, // $10.00
                7_000,      // 70.00% Dev_B floor; remaining 21.50% -> Tier-3B Artist_A!
                vector[],
                vector[],
                vector[artist_a],
                vector[100],
                true,       // 6.00% OSS Tool Vault (Blender + Godot)
                false,
                scenario.ctx(),
            );
            scenario.return_to_sender(dev_uid);
            test_scenario::return_shared(hash_reg);
        };

        // Act 4: Player_C buys "Dummy Game v1" ($10.00) -> Atomic 8-Tier Waterfall!
        scenario.next_tx(player_c);
        {
            let mut treasury = scenario.take_shared<ProtocolTreasuryUSD<MOCK_USDC>>();
            let mut art1 = scenario.take_shared<ArtifactUAI>();
            if (core::artifact_creator(&art1) == dev_b) {
                let pay = coin::mint_for_testing<MOCK_USDC>(10_000_000, scenario.ctx());
                core::buy_artifact_and_settle_waterfall<MOCK_USDC>(&mut treasury, &mut art1, pay, scenario.ctx());
            } else {
                let mut art2 = scenario.take_shared<ArtifactUAI>();
                let pay = coin::mint_for_testing<MOCK_USDC>(10_000_000, scenario.ctx());
                core::buy_artifact_and_settle_waterfall<MOCK_USDC>(&mut treasury, &mut art2, pay, scenario.ctx());
                test_scenario::return_shared(art2);
            };
            // Total volume = $5 (sword) + $10 (game) = $15.00
            // Genesis 1.50% = $0.225 (225_000), OSS Tool Vault 6.00% = $0.90 (900_000)
            assert!(core::treasury_total_volume(&treasury) == 15_000_000, 3);
            assert!(core::treasury_genesis_balance(&treasury) == 225_000, 4);
            assert!(core::treasury_oss_vault_balance(&treasury) == 900_000, 5);
            test_scenario::return_shared(art1);
            test_scenario::return_shared(treasury);
        };

        // Verify Artist_A automatically received Tier-3B royalty ($2.15 = 2_150_000) from Player_C's game purchase!
        scenario.next_tx(artist_a);
        {
            let c1 = scenario.take_from_sender<coin::Coin<MOCK_USDC>>();
            let c2 = scenario.take_from_sender<coin::Coin<MOCK_USDC>>();
            let total_artist = coin::value(&c1) + coin::value(&c2);
            // $4.575 from sword sale + $2.150 from game waterfall = $6.725 (6_725_000)
            assert!(total_artist == 6_725_000, 6);
            scenario.return_to_sender(c1);
            scenario.return_to_sender(c2);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = 1065)]
    fun test_act_6_attacker_blocked_from_republishing_copied_payload_hash() {
        let artist_a = @0xA771;
        let attacker_x = @0xBAD1;
        let mut scenario = test_scenario::begin(FOUNDER);
        {
            core::initialize_core_kernel<MOCK_USDC>(scenario.ctx());
        };
        scenario.next_tx(artist_a);
        {
            core::mint_self_creator_uid(b"artist_a", scenario.ctx());
        };
        scenario.next_tx(attacker_x);
        {
            core::mint_self_creator_uid(b"attacker_x", scenario.ctx());
        };
        scenario.next_tx(artist_a);
        {
            let mut hash_reg = scenario.take_shared<PayloadHashRegistry>();
            let uid = scenario.take_from_sender<CreatorUID>();
            core::publish_artifact_uai(
                &mut hash_reg, &uid, b"Cyber Sword", b"3d_asset", b"sha256_unique_mesh",
                5_000_000, 9_000, vector[], vector[], vector[], vector[], true, false, scenario.ctx(),
            );
            scenario.return_to_sender(uid);
            test_scenario::return_shared(hash_reg);
        };
        // Attacker_X tries to re-publish the exact copied mesh bytes -> MUST abort 1065!
        scenario.next_tx(attacker_x);
        {
            let mut hash_reg = scenario.take_shared<PayloadHashRegistry>();
            let uid = scenario.take_from_sender<CreatorUID>();
            core::publish_artifact_uai(
                &mut hash_reg, &uid, b"Stolen Sword", b"3d_asset", b"sha256_unique_mesh",
                1_000_000, 9_000, vector[], vector[], vector[], vector[], true, false, scenario.ctx(),
            );
            scenario.return_to_sender(uid);
            test_scenario::return_shared(hash_reg);
        };
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = 1066)]
    fun test_act_6_attacker_blocked_from_modifying_artist_asset() {
        let artist_a = @0xA771;
        let attacker_x = @0xBAD1;
        let mut scenario = test_scenario::begin(FOUNDER);
        {
            core::initialize_core_kernel<MOCK_USDC>(scenario.ctx());
        };
        scenario.next_tx(artist_a);
        {
            core::mint_self_creator_uid(b"artist_a", scenario.ctx());
        };
        scenario.next_tx(attacker_x);
        {
            core::mint_self_creator_uid(b"attacker_x", scenario.ctx());
        };
        scenario.next_tx(artist_a);
        {
            let mut hash_reg = scenario.take_shared<PayloadHashRegistry>();
            let uid = scenario.take_from_sender<CreatorUID>();
            core::publish_artifact_uai(
                &mut hash_reg, &uid, b"Cyber Sword", b"3d_asset", b"sha256_original",
                5_000_000, 9_000, vector[], vector[], vector[], vector[], true, false, scenario.ctx(),
            );
            scenario.return_to_sender(uid);
            test_scenario::return_shared(hash_reg);
        };
        // Attacker_X tries to overwrite Artist_A's ArtifactUAI -> MUST abort 1066!
        scenario.next_tx(attacker_x);
        {
            let mut hash_reg = scenario.take_shared<PayloadHashRegistry>();
            let mut art = scenario.take_shared<ArtifactUAI>();
            let uid = scenario.take_from_sender<CreatorUID>();
            core::update_artifact_uai_source(&mut hash_reg, &mut art, &uid, b"sha256_tampered", scenario.ctx());
            scenario.return_to_sender(uid);
            test_scenario::return_shared(art);
            test_scenario::return_shared(hash_reg);
        };
        scenario.end();
    }
}
