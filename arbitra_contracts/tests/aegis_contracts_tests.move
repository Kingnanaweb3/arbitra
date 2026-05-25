#[allow(unused_use, duplicate_alias, untyped_literal)]
#[test_only]
module aegis_contracts::aegis_tests {

    use sui::test_scenario::{Self as ts, Scenario};
    use sui::clock;
    use aegis_contracts::policy_object::{Self, PolicyObject, PolicyCap};
    use aegis_contracts::activity_log::{Self, ActivityLog};
    use aegis_contracts::risk_params::{Self, RiskParams};

    // ── Test addresses ────────────────────────────────────
    const OWNER: address = @0xAAAA;
    const ATTACKER: address = @0xBBBB;
    const DAO: address = @0xCCCC;
    const BENEFICIARY: address = @0xDDDD;

    // ── Test constants ────────────────────────────────────
    const BUDGET: u64 = 1000;
    const RISK_CEILING: u64 = 75;
    const SLIPPAGE_BPS: u64 = 250;
    const MAX_TX: u64 = 100;
    const EXPIRY_MS: u64 = 86400000;

    // ═══════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════

    fun setup_policy(scenario: &mut Scenario) {
        ts::next_tx(scenario, OWNER);
        {
            let clock = clock::create_for_testing(ts::ctx(scenario));
            let cap = policy_object::create_policy(
                b"Test Agent",
                b"trading",
                BUDGET,
                b"USDC",
                policy_object::scope_deepbook(),
                @0x0,
                EXPIRY_MS,
                RISK_CEILING,
                SLIPPAGE_BPS,
                MAX_TX,
                BENEFICIARY,
                DAO,
                &clock,
                ts::ctx(scenario),
            );
            transfer::public_transfer(cap, OWNER);
            clock::destroy_for_testing(clock);
        }
    }

    fun setup_activity_log(scenario: &mut Scenario, policy_id: address) {
        ts::next_tx(scenario, OWNER);
        {
            let clock = clock::create_for_testing(ts::ctx(scenario));
            activity_log::create_log(policy_id, &clock, ts::ctx(scenario));
            clock::destroy_for_testing(clock);
        }
    }

    fun setup_risk_params(scenario: &mut Scenario, policy_id: address) {
        ts::next_tx(scenario, OWNER);
        {
            let clock = clock::create_for_testing(ts::ctx(scenario));
            risk_params::create_risk_params(policy_id, RISK_CEILING, DAO, &clock, ts::ctx(scenario));
            clock::destroy_for_testing(clock);
        }
    }


    // ═══════════════════════════════════════════════════════
    // TEST 1: POLICY CREATION
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_policy_creation_success() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let policy = ts::take_shared<PolicyObject>(&scenario);
            assert!(policy_object::budget_remaining(&policy) == BUDGET, 0);
            assert!(policy_object::budget_total(&policy) == BUDGET, 1);
            assert!(policy_object::risk_ceiling(&policy) == RISK_CEILING, 2);
            assert!(policy_object::is_active(&policy), 3);
            assert!(policy_object::owner(&policy) == OWNER, 4);
            assert!(policy_object::policy_version(&policy) == 1, 5);
            assert!(policy_object::total_actions(&policy) == 0, 6);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 2: VALID ACTION APPROVED
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_valid_action_approved() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));

            policy_object::validate_action(
                &mut policy, b"BUY", 50,
                policy_object::scope_deepbook(), 60, 200,
                &clock, ts::ctx(&mut scenario),
            );

            assert!(policy_object::budget_remaining(&policy) == BUDGET - 50, 0);
            assert!(policy_object::total_approved(&policy) == 1, 1);
            assert!(policy_object::total_actions(&policy) == 1, 2);
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 3: BUDGET EXCEEDED — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::policy_object::E_BUDGET_EXCEEDED)]
    fun test_budget_exceeded_blocked() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let mut i: u64 = 0;
            while (i < 10) {
                policy_object::validate_action(
                    &mut policy, b"BUY", 95,
                    policy_object::scope_deepbook(), 60, 200,
                    &clock, ts::ctx(&mut scenario),
                );
                i = i + 1;
            };
            policy_object::validate_action(
                &mut policy, b"BUY", 95,
                policy_object::scope_deepbook(), 60, 200,
                &clock, ts::ctx(&mut scenario),
            );
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 4: BUDGET DRAINS CORRECTLY
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_budget_drains_correctly() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let mut i: u64 = 0;
            while (i < 9) {
                policy_object::validate_action(
                    &mut policy, b"BUY", 100,
                    policy_object::scope_deepbook(), 60, 200,
                    &clock, ts::ctx(&mut scenario),
                );
                i = i + 1;
            };
            assert!(policy_object::budget_remaining(&policy) == 100, 0);
            assert!(policy_object::total_approved(&policy) == 9, 1);
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 5: SCOPE VIOLATION — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::policy_object::E_SCOPE_VIOLATION)]
    fun test_scope_violation_blocked() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::validate_action(
                &mut policy, b"BUY", 50,
                policy_object::scope_custom(), 60, 200,
                &clock, ts::ctx(&mut scenario),
            );
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 6: RISK CEILING BREACHED — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::policy_object::E_RISK_CEILING_BREACHED)]
    fun test_risk_ceiling_breached_blocked() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::validate_action(
                &mut policy, b"BUY", 50,
                policy_object::scope_deepbook(), 76, 200,
                &clock, ts::ctx(&mut scenario),
            );
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 7: SLIPPAGE EXCEEDED — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::policy_object::E_SLIPPAGE_EXCEEDED)]
    fun test_slippage_exceeded_blocked() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::validate_action(
                &mut policy, b"BUY", 50,
                policy_object::scope_deepbook(), 60, 300,
                &clock, ts::ctx(&mut scenario),
            );
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 8: MAX TX EXCEEDED — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::policy_object::E_TX_LIMIT_EXCEEDED)]
    fun test_max_tx_exceeded_blocked() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::validate_action(
                &mut policy, b"BUY", 101,
                policy_object::scope_deepbook(), 60, 200,
                &clock, ts::ctx(&mut scenario),
            );
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 9: POLICY EXPIRED — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::policy_object::E_POLICY_EXPIRED)]
    fun test_expired_policy_blocked() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
            clock::set_for_testing(&mut clock, EXPIRY_MS + 1000);
            policy_object::validate_action(
                &mut policy, b"BUY", 50,
                policy_object::scope_deepbook(), 60, 200,
                &clock, ts::ctx(&mut scenario),
            );
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 10: REVOKE POLICY
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_revoke_policy_success() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let cap = ts::take_from_sender<PolicyCap>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::revoke_policy(&mut policy, &cap, &clock, ts::ctx(&mut scenario));
            assert!(policy_object::is_revoked(&policy), 0);
            assert!(!policy_object::is_active(&policy), 1);
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
            ts::return_to_sender(&scenario, cap);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 11: ACTION AFTER REVOCATION — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::policy_object::E_POLICY_REVOKED)]
    fun test_action_after_revocation_blocked() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let cap = ts::take_from_sender<PolicyCap>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::revoke_policy(&mut policy, &cap, &clock, ts::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
            ts::return_to_sender(&scenario, cap);
        };

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::validate_action(
                &mut policy, b"BUY", 50,
                policy_object::scope_deepbook(), 60, 200,
                &clock, ts::ctx(&mut scenario),
            );
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 12: PAUSE AND RESUME
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_pause_and_resume() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::pause_policy(&mut policy, 80, &clock, ts::ctx(&mut scenario));
            assert!(policy_object::is_paused(&policy), 0);
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::resume_policy(&mut policy, 60, &clock, ts::ctx(&mut scenario));
            assert!(policy_object::is_active(&policy), 1);
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 13: UPDATE RISK PARAMS
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_update_risk_params_success() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::update_risk_params(&mut policy, 85, 300, 150, &clock, ts::ctx(&mut scenario));
            assert!(policy_object::risk_ceiling(&policy) == 85, 0);
            assert!(policy_object::policy_version(&policy) == 2, 1);
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 14: ATTACKER CANNOT UPDATE PARAMS — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::policy_object::E_NOT_OWNER)]
    fun test_attacker_cannot_update_params() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, ATTACKER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::update_risk_params(&mut policy, 10, 100, 500, &clock, ts::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 15: ACTIVITY LOG CREATION
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_activity_log_creation() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);
        setup_activity_log(&mut scenario, @0x1234);

        ts::next_tx(&mut scenario, OWNER);
        {
            let log = ts::take_shared<ActivityLog>(&scenario);
            assert!(activity_log::total_entries(&log) == 1, 0);
            assert!(activity_log::approved_count(&log) == 0, 1);
            assert!(activity_log::rejected_count(&log) == 0, 2);
            assert!(!activity_log::is_sealed(&log), 3);
            ts::return_shared(log);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 16: ACTIVITY LOG WRITES ALL ENTRY TYPES
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_activity_log_writes() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);
        setup_activity_log(&mut scenario, @0x1234);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut log = ts::take_shared<ActivityLog>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));

            activity_log::write_approved(&mut log, b"BUY", 50, 60, 200, 1, b"ptb", &clock, ts::ctx(&mut scenario));
            activity_log::write_approved(&mut log, b"BUY", 50, 55, 180, 1, b"ptb", &clock, ts::ctx(&mut scenario));
            activity_log::write_rejected(&mut log, b"BUY", 200, 60, 1, 1, &clock, ts::ctx(&mut scenario));
            activity_log::write_risk_check(&mut log, 68, 1, &clock, ts::ctx(&mut scenario));
            activity_log::write_paused(&mut log, 80, 75, 1, &clock, ts::ctx(&mut scenario));
            activity_log::write_resumed(&mut log, 60, 1, &clock, ts::ctx(&mut scenario));
            activity_log::write_skipped(&mut log, b"BUY", 50, 300, 1, &clock, ts::ctx(&mut scenario));

            assert!(activity_log::total_entries(&log) == 8, 0);
            assert!(activity_log::approved_count(&log) == 2, 1);
            assert!(activity_log::rejected_count(&log) == 2, 2);
            assert!(activity_log::paused_count(&log) == 1, 3);

            clock::destroy_for_testing(clock);
            ts::return_shared(log);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 17: LOG SEALED AFTER REVOCATION — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::activity_log::E_LOG_SEALED)]
    fun test_log_sealed_after_revocation() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);
        setup_activity_log(&mut scenario, @0x1234);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut log = ts::take_shared<ActivityLog>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            activity_log::write_revoked(&mut log, 1, &clock, ts::ctx(&mut scenario));
            assert!(activity_log::is_sealed(&log), 0);
            clock::destroy_for_testing(clock);
            ts::return_shared(log);
        };

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut log = ts::take_shared<ActivityLog>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            activity_log::write_approved(&mut log, b"BUY", 50, 60, 200, 1, b"ptb", &clock, ts::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
            ts::return_shared(log);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 18: RISK PARAMS CREATION
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_risk_params_creation() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);
        setup_risk_params(&mut scenario, @0x1234);

        ts::next_tx(&mut scenario, OWNER);
        {
            let params = ts::take_shared<RiskParams>(&scenario);
            assert!(risk_params::risk_ceiling(&params) == RISK_CEILING, 0);
            assert!(risk_params::current_risk_score(&params) == 0, 1);
            assert!(!risk_params::is_stress_test_active(&params), 2);
            assert!(risk_params::version(&params) == 1, 3);
            assert!(risk_params::volatility_weight(&params) == 40, 4);
            assert!(risk_params::oracle_weight(&params) == 30, 5);
            assert!(risk_params::depth_weight(&params) == 30, 6);
            ts::return_shared(params);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 19: RISK SCORE CALCULATION
    // (80*40 + 60*30 + 40*30) / 100 = 62
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_risk_score_calculation() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);
        setup_risk_params(&mut scenario, @0x1234);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut params = ts::take_shared<RiskParams>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let score = risk_params::update_risk_score(&mut params, 80, 60, 40, &clock, ts::ctx(&mut scenario));
            assert!(score == 62, 0);
            assert!(risk_params::current_risk_score(&params) == 62, 1);
            clock::destroy_for_testing(clock);
            ts::return_shared(params);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 20: SHOULD PAUSE LOGIC
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_should_pause_logic() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);
        setup_risk_params(&mut scenario, @0x1234);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut params = ts::take_shared<RiskParams>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            risk_params::update_risk_score(&mut params, 50, 50, 50, &clock, ts::ctx(&mut scenario));
            assert!(!risk_params::should_pause(&params), 0);
            risk_params::update_risk_score(&mut params, 100, 100, 100, &clock, ts::ctx(&mut scenario));
            assert!(risk_params::should_pause(&params), 1);
            clock::destroy_for_testing(clock);
            ts::return_shared(params);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 21: STRESS TEST ACTIVATION
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_stress_test_activation() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);
        setup_risk_params(&mut scenario, @0x1234);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut params = ts::take_shared<RiskParams>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            risk_params::activate_stress_test(&mut params, 90, &clock, ts::ctx(&mut scenario));
            assert!(risk_params::is_stress_test_active(&params), 0);
            assert!(risk_params::current_risk_score(&params) == 90, 1);
            assert!(risk_params::should_pause(&params), 2);
            let score = risk_params::update_risk_score(&mut params, 10, 10, 10, &clock, ts::ctx(&mut scenario));
            assert!(score == 90, 3);
            clock::destroy_for_testing(clock);
            ts::return_shared(params);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 22: STRESS TEST DEACTIVATION
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_stress_test_deactivation() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);
        setup_risk_params(&mut scenario, @0x1234);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut params = ts::take_shared<RiskParams>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            risk_params::activate_stress_test(&mut params, 90, &clock, ts::ctx(&mut scenario));
            risk_params::deactivate_stress_test(&mut params, &clock, ts::ctx(&mut scenario));
            assert!(!risk_params::is_stress_test_active(&params), 0);
            let score = risk_params::update_risk_score(&mut params, 20, 20, 20, &clock, ts::ctx(&mut scenario));
            assert!(score == 20, 1);
            assert!(!risk_params::should_pause(&params), 2);
            clock::destroy_for_testing(clock);
            ts::return_shared(params);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 23: ATTACKER CANNOT UPDATE RISK PARAMS — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::risk_params::E_NOT_AUTHORIZED)]
    fun test_attacker_cannot_update_risk_params() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);
        setup_risk_params(&mut scenario, @0x1234);

        ts::next_tx(&mut scenario, ATTACKER);
        {
            let mut params = ts::take_shared<RiskParams>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            risk_params::update_params(&mut params, 10, 40, 30, 30, &clock, ts::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
            ts::return_shared(params);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 24: INVALID WEIGHT SUM — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::risk_params::E_INVALID_WEIGHT)]
    fun test_invalid_weight_sum_blocked() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);
        setup_risk_params(&mut scenario, @0x1234);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut params = ts::take_shared<RiskParams>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            risk_params::update_params(&mut params, 75, 50, 50, 50, &clock, ts::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
            ts::return_shared(params);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 25: DAO CAN RESUME
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_dao_can_resume() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::pause_policy(&mut policy, 80, &clock, ts::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };

        ts::next_tx(&mut scenario, DAO);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::resume_policy(&mut policy, 60, &clock, ts::ctx(&mut scenario));
            assert!(policy_object::is_active(&policy), 0);
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 26: ATTACKER CANNOT RESUME — CRITICAL
    // ═══════════════════════════════════════════════════════
    #[test]
    #[expected_failure(abort_code = aegis_contracts::policy_object::E_NOT_OWNER)]
    fun test_attacker_cannot_resume() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::pause_policy(&mut policy, 80, &clock, ts::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };

        ts::next_tx(&mut scenario, ATTACKER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::resume_policy(&mut policy, 60, &clock, ts::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 27: ZERO AMOUNT EDGE CASE
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_zero_amount_action() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            policy_object::validate_action(
                &mut policy, b"CHECK", 0,
                policy_object::scope_deepbook(), 60, 200,
                &clock, ts::ctx(&mut scenario),
            );
            assert!(policy_object::budget_remaining(&policy) == BUDGET, 0);
            assert!(policy_object::total_approved(&policy) == 1, 1);
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 28: EXACT BUDGET BOUNDARY EDGE CASE
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_exact_budget_boundary() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let mut i: u64 = 0;
            while (i < 10) {
                policy_object::validate_action(
                    &mut policy, b"BUY", 100,
                    policy_object::scope_deepbook(), 60, 200,
                    &clock, ts::ctx(&mut scenario),
                );
                i = i + 1;
            };
            assert!(policy_object::budget_remaining(&policy) == 0, 0);
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 29: EXACT RISK CEILING BOUNDARY
    // Score exactly at ceiling should still pass
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_exact_risk_ceiling_boundary() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            // Risk score exactly AT ceiling (75) should pass
            policy_object::validate_action(
                &mut policy, b"BUY", 50,
                policy_object::scope_deepbook(), 75, 200,
                &clock, ts::ctx(&mut scenario),
            );
            assert!(policy_object::total_approved(&policy) == 1, 0);
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }

    // ═══════════════════════════════════════════════════════
    // TEST 30: VERSION INCREMENTS ON PARAM UPDATE
    // ═══════════════════════════════════════════════════════
    #[test]
    fun test_version_increments_on_update() {
        let mut scenario = ts::begin(OWNER);
        setup_policy(&mut scenario);

        ts::next_tx(&mut scenario, OWNER);
        {
            let mut policy = ts::take_shared<PolicyObject>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            assert!(policy_object::policy_version(&policy) == 1, 0);
            policy_object::update_risk_params(&mut policy, 80, 300, 120, &clock, ts::ctx(&mut scenario));
            assert!(policy_object::policy_version(&policy) == 2, 1);
            policy_object::update_risk_params(&mut policy, 85, 350, 130, &clock, ts::ctx(&mut scenario));
            assert!(policy_object::policy_version(&policy) == 3, 2);
            clock::destroy_for_testing(clock);
            ts::return_shared(policy);
        };
        ts::end(scenario);
    }
}
