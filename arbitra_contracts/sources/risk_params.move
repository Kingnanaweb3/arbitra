#[allow(duplicate_alias, unused_const)]
module aegis_contracts::risk_params {

    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::clock::{Self, Clock};

    // ── Errors ───────────────────────────────────────────
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVALID_WEIGHT: u64 = 2;
    const E_INVALID_THRESHOLD: u64 = 3;

    // ── Risk score bounds ────────────────────────────────
    const MAX_RISK_SCORE: u64 = 100;
    const MIN_RISK_SCORE: u64 = 0;

    // ── Default weights (must sum to 100) ────────────────
    const DEFAULT_VOLATILITY_WEIGHT: u64 = 40;
    const DEFAULT_ORACLE_WEIGHT: u64 = 30;
    const DEFAULT_DEPTH_WEIGHT: u64 = 30;

    // ── RiskParams struct ────────────────────────────────
    public struct RiskParams has key, store {
        id: UID,
        policy_id: address,
        owner: address,
        dao_override: address,

        // Risk ceiling — agent pauses above this
        risk_ceiling: u64,

        // Sub-score weights (must sum to 100)
        volatility_weight: u64,
        oracle_confidence_weight: u64,
        orderbook_depth_weight: u64,

        // Thresholds for each sub-score
        volatility_threshold: u64,
        oracle_confidence_threshold: u64,
        orderbook_depth_threshold: u64,

        // Stress test state
        stress_test_active: bool,
        stress_test_score: u64,

        // Current live scores
        current_risk_score: u64,
        current_volatility_score: u64,
        current_oracle_score: u64,
        current_depth_score: u64,

        // Metadata
        last_updated_ms: u64,
        update_count: u64,
        version: u64,
    }

    // ── Events ───────────────────────────────────────────
    public struct RiskScoreUpdated has copy, drop {
        params_id: address,
        policy_id: address,
        risk_score: u64,
        volatility_score: u64,
        oracle_score: u64,
        depth_score: u64,
        timestamp_ms: u64,
        is_stress_test: bool,
    }

    public struct RiskParamsUpdated has copy, drop {
        params_id: address,
        policy_id: address,
        old_ceiling: u64,
        new_ceiling: u64,
        new_volatility_weight: u64,
        new_oracle_weight: u64,
        new_depth_weight: u64,
        timestamp_ms: u64,
        version: u64,
    }

    public struct StressTestActivated has copy, drop {
        params_id: address,
        policy_id: address,
        injected_score: u64,
        timestamp_ms: u64,
    }

    public struct StressTestDeactivated has copy, drop {
        params_id: address,
        policy_id: address,
        timestamp_ms: u64,
    }

    // ── Create risk params ───────────────────────────────
    public fun create_risk_params(
        policy_id: address,
        risk_ceiling: u64,
        dao_override: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ): address {
        assert!(risk_ceiling <= MAX_RISK_SCORE, E_INVALID_THRESHOLD);

        let owner = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock);

        let params = RiskParams {
            id: object::new(ctx),
            policy_id,
            owner,
            dao_override,
            risk_ceiling,
            volatility_weight: DEFAULT_VOLATILITY_WEIGHT,
            oracle_confidence_weight: DEFAULT_ORACLE_WEIGHT,
            orderbook_depth_weight: DEFAULT_DEPTH_WEIGHT,
            volatility_threshold: 70,
            oracle_confidence_threshold: 60,
            orderbook_depth_threshold: 50,
            stress_test_active: false,
            stress_test_score: 0,
            current_risk_score: 0,
            current_volatility_score: 0,
            current_oracle_score: 0,
            current_depth_score: 0,
            last_updated_ms: now,
            update_count: 0,
            version: 1,
        };

        let params_id = object::uid_to_address(&params.id);
        transfer::share_object(params);
        params_id
    }

    // ── Update live risk score from off-chain engine ──────
    public fun update_risk_score(
        params: &mut RiskParams,
        volatility_score: u64,
        oracle_score: u64,
        depth_score: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): u64 {
        let sender = tx_context::sender(ctx);
        assert!(
            sender == params.owner || sender == params.dao_override,
            E_NOT_AUTHORIZED
        );

        // If stress test active return injected score
        if (params.stress_test_active) {
            return params.stress_test_score
        };

        // Weighted aggregate score
        let aggregate =
            (volatility_score * params.volatility_weight) +
            (oracle_score * params.oracle_confidence_weight) +
            (depth_score * params.orderbook_depth_weight);

        let risk_score = aggregate / 100;

        params.current_risk_score = risk_score;
        params.current_volatility_score = volatility_score;
        params.current_oracle_score = oracle_score;
        params.current_depth_score = depth_score;
        params.last_updated_ms = clock::timestamp_ms(clock);
        params.update_count = params.update_count + 1;

        sui::event::emit(RiskScoreUpdated {
            params_id: object::uid_to_address(&params.id),
            policy_id: params.policy_id,
            risk_score,
            volatility_score,
            oracle_score,
            depth_score,
            timestamp_ms: clock::timestamp_ms(clock),
            is_stress_test: false,
        });

        risk_score
    }

    // ── Stress test — inject spike ────────────────────────
    public fun activate_stress_test(
        params: &mut RiskParams,
        injected_score: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(
            sender == params.owner || sender == params.dao_override,
            E_NOT_AUTHORIZED
        );
        assert!(injected_score <= MAX_RISK_SCORE, E_INVALID_THRESHOLD);

        params.stress_test_active = true;
        params.stress_test_score = injected_score;
        params.current_risk_score = injected_score;

        sui::event::emit(StressTestActivated {
            params_id: object::uid_to_address(&params.id),
            policy_id: params.policy_id,
            injected_score,
            timestamp_ms: clock::timestamp_ms(clock),
        });
    }

    // ── Stress test — deactivate ──────────────────────────
    public fun deactivate_stress_test(
        params: &mut RiskParams,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(
            sender == params.owner || sender == params.dao_override,
            E_NOT_AUTHORIZED
        );

        params.stress_test_active = false;
        params.stress_test_score = 0;

        sui::event::emit(StressTestDeactivated {
            params_id: object::uid_to_address(&params.id),
            policy_id: params.policy_id,
            timestamp_ms: clock::timestamp_ms(clock),
        });
    }

    // ── Update params — no redeploy needed ────────────────
    public fun update_params(
        params: &mut RiskParams,
        new_risk_ceiling: u64,
        new_volatility_weight: u64,
        new_oracle_weight: u64,
        new_depth_weight: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(
            sender == params.owner || sender == params.dao_override,
            E_NOT_AUTHORIZED
        );
        assert!(new_risk_ceiling <= MAX_RISK_SCORE, E_INVALID_THRESHOLD);
        assert!(
            new_volatility_weight + new_oracle_weight + new_depth_weight == 100,
            E_INVALID_WEIGHT
        );

        let old_ceiling = params.risk_ceiling;
        params.risk_ceiling = new_risk_ceiling;
        params.volatility_weight = new_volatility_weight;
        params.oracle_confidence_weight = new_oracle_weight;
        params.orderbook_depth_weight = new_depth_weight;
        params.version = params.version + 1;
        params.last_updated_ms = clock::timestamp_ms(clock);

        sui::event::emit(RiskParamsUpdated {
            params_id: object::uid_to_address(&params.id),
            policy_id: params.policy_id,
            old_ceiling,
            new_ceiling: new_risk_ceiling,
            new_volatility_weight,
            new_oracle_weight,
            new_depth_weight,
            timestamp_ms: clock::timestamp_ms(clock),
            version: params.version,
        });
    }

    // ── Check if agent should pause ───────────────────────
    public fun should_pause(params: &RiskParams): bool {
        params.current_risk_score > params.risk_ceiling
    }

    // ── Read functions ────────────────────────────────────
    public fun current_risk_score(params: &RiskParams): u64 { params.current_risk_score }
    public fun current_volatility_score(params: &RiskParams): u64 { params.current_volatility_score }
    public fun current_oracle_score(params: &RiskParams): u64 { params.current_oracle_score }
    public fun current_depth_score(params: &RiskParams): u64 { params.current_depth_score }
    public fun risk_ceiling(params: &RiskParams): u64 { params.risk_ceiling }
    public fun is_stress_test_active(params: &RiskParams): bool { params.stress_test_active }
    public fun version(params: &RiskParams): u64 { params.version }
    public fun update_count(params: &RiskParams): u64 { params.update_count }
    public fun last_updated_ms(params: &RiskParams): u64 { params.last_updated_ms }
    public fun volatility_weight(params: &RiskParams): u64 { params.volatility_weight }
    public fun oracle_weight(params: &RiskParams): u64 { params.oracle_confidence_weight }
    public fun depth_weight(params: &RiskParams): u64 { params.orderbook_depth_weight }
}
