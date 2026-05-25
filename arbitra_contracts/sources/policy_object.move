#[allow(duplicate_alias, unused_const, unused_field, unused_variable)]
module aegis_contracts::policy_object {

    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::clock::{Self, Clock};

    // ── Errors ──────────────────────────────────────────
    const E_BUDGET_EXCEEDED: u64 = 1;
    const E_SCOPE_VIOLATION: u64 = 2;
    const E_POLICY_EXPIRED: u64 = 3;
    const E_RISK_CEILING_BREACHED: u64 = 4;
    const E_NOT_OWNER: u64 = 5;
    const E_POLICY_REVOKED: u64 = 6;
    const E_SLIPPAGE_EXCEEDED: u64 = 7;
    const E_TX_LIMIT_EXCEEDED: u64 = 8;

    // ── Scope constants ──────────────────────────────────
    const SCOPE_DEEPBOOK: u8 = 1;
    const SCOPE_CUSTOM: u8 = 2;

    // ── Status constants ─────────────────────────────────
    const STATUS_ACTIVE: u8 = 1;
    const STATUS_PAUSED: u8 = 2;
    const STATUS_REVOKED: u8 = 3;
    const STATUS_EXPIRED: u8 = 4;

    // ── Core struct ──────────────────────────────────────
    public struct PolicyObject has key, store {
        id: UID,
        owner: address,
        agent_name: vector<u8>,
        agent_type: vector<u8>,
        budget_total: u64,
        budget_remaining: u64,
        token: vector<u8>,
        scope: u8,
        custom_scope_address: address,
        expiry_ms: u64,
        risk_ceiling: u64,
        slippage_guard_bps: u64,
        max_single_tx: u64,
        beneficiary: address,
        dao_override: address,
        status: u8,
        policy_version: u64,
        created_at_ms: u64,
        total_actions: u64,
        total_approved: u64,
        total_rejected: u64,
    }

    // ── Capability for owner control ─────────────────────
    public struct PolicyCap has key, store {
        id: UID,
        policy_id: address,
        owner: address,
    }

    // ── Events ───────────────────────────────────────────
    public struct PolicyDeployed has copy, drop {
        policy_id: address,
        owner: address,
        budget: u64,
        scope: u8,
        expiry_ms: u64,
        risk_ceiling: u64,
        version: u64,
    }

    public struct PolicyRevoked has copy, drop {
        policy_id: address,
        owner: address,
        revoked_at_ms: u64,
        budget_remaining: u64,
    }

    public struct ActionApproved has copy, drop {
        policy_id: address,
        action_type: vector<u8>,
        amount: u64,
        risk_score: u64,
        timestamp_ms: u64,
    }

    public struct ActionRejected has copy, drop {
        policy_id: address,
        action_type: vector<u8>,
        amount: u64,
        reason: u64,
        timestamp_ms: u64,
    }

    public struct PolicyPaused has copy, drop {
        policy_id: address,
        risk_score: u64,
        ceiling: u64,
        timestamp_ms: u64,
    }

    public struct PolicyResumed has copy, drop {
        policy_id: address,
        risk_score: u64,
        timestamp_ms: u64,
    }

    public struct ParamsUpdated has copy, drop {
        policy_id: address,
        old_version: u64,
        new_version: u64,
        new_risk_ceiling: u64,
        new_slippage_bps: u64,
        new_max_tx: u64,
        timestamp_ms: u64,
    }

    // ── Create policy ────────────────────────────────────
    public fun create_policy(
        agent_name: vector<u8>,
        agent_type: vector<u8>,
        budget: u64,
        token: vector<u8>,
        scope: u8,
        custom_scope_address: address,
        expiry_ms: u64,
        risk_ceiling: u64,
        slippage_guard_bps: u64,
        max_single_tx: u64,
        beneficiary: address,
        dao_override: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ): PolicyCap {
        let owner = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock);

        let policy = PolicyObject {
            id: object::new(ctx),
            owner,
            agent_name,
            agent_type,
            budget_total: budget,
            budget_remaining: budget,
            token,
            scope,
            custom_scope_address,
            expiry_ms: now + expiry_ms,
            risk_ceiling,
            slippage_guard_bps,
            max_single_tx,
            beneficiary,
            dao_override,
            status: STATUS_ACTIVE,
            policy_version: 1,
            created_at_ms: now,
            total_actions: 0,
            total_approved: 0,
            total_rejected: 0,
        };

        let policy_id = object::uid_to_address(&policy.id);

        sui::event::emit(PolicyDeployed {
            policy_id,
            owner,
            budget,
            scope,
            expiry_ms: now + expiry_ms,
            risk_ceiling,
            version: 1,
        });

        let cap = PolicyCap {
            id: object::new(ctx),
            policy_id,
            owner,
        };

        transfer::share_object(policy);
        cap
    }

    // ── Validate action before execution ─────────────────
    public fun validate_action(
        policy: &mut PolicyObject,
        action_type: vector<u8>,
        amount: u64,
        scope_check: u8,
        risk_score: u64,
        slippage_bps: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let now = clock::timestamp_ms(clock);
        let policy_id = object::uid_to_address(&policy.id);

        policy.total_actions = policy.total_actions + 1;

        // Check revoked
        assert!(policy.status != STATUS_REVOKED, E_POLICY_REVOKED);

        // Check expiry
        assert!(now < policy.expiry_ms, E_POLICY_EXPIRED);

        // Check scope
        assert!(policy.scope == scope_check, E_SCOPE_VIOLATION);

        // Check risk ceiling
        assert!(risk_score <= policy.risk_ceiling, E_RISK_CEILING_BREACHED);

        // Check slippage
        assert!(slippage_bps <= policy.slippage_guard_bps, E_SLIPPAGE_EXCEEDED);

        // Check max single transaction
        assert!(amount <= policy.max_single_tx, E_TX_LIMIT_EXCEEDED);

        // Check budget
        assert!(amount <= policy.budget_remaining, E_BUDGET_EXCEEDED);

        // Deduct budget
        policy.budget_remaining = policy.budget_remaining - amount;
        policy.total_approved = policy.total_approved + 1;

        sui::event::emit(ActionApproved {
            policy_id,
            action_type,
            amount,
            risk_score,
            timestamp_ms: now,
        });
    }

    // ── Pause agent (risk ceiling breached) ───────────────
    public fun pause_policy(
        policy: &mut PolicyObject,
        risk_score: u64,
        clock: &Clock,
        _ctx: &mut TxContext,
    ) {
        assert!(policy.status == STATUS_ACTIVE, E_POLICY_REVOKED);
        policy.status = STATUS_PAUSED;

        sui::event::emit(PolicyPaused {
            policy_id: object::uid_to_address(&policy.id),
            risk_score,
            ceiling: policy.risk_ceiling,
            timestamp_ms: clock::timestamp_ms(clock),
        });
    }

    // ── Resume agent ──────────────────────────────────────
    public fun resume_policy(
        policy: &mut PolicyObject,
        risk_score: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(
            sender == policy.owner || sender == policy.dao_override,
            E_NOT_OWNER
        );
        assert!(policy.status == STATUS_PAUSED, E_POLICY_REVOKED);
        policy.status = STATUS_ACTIVE;

        sui::event::emit(PolicyResumed {
            policy_id: object::uid_to_address(&policy.id),
            risk_score,
            timestamp_ms: clock::timestamp_ms(clock),
        });
    }

    // ── Revoke policy ─────────────────────────────────────
    public fun revoke_policy(
        policy: &mut PolicyObject,
        cap: &PolicyCap,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == policy.owner || sender == policy.dao_override, E_NOT_OWNER);
        assert!(cap.policy_id == object::uid_to_address(&policy.id), E_NOT_OWNER);

        policy.status = STATUS_REVOKED;

        sui::event::emit(PolicyRevoked {
            policy_id: object::uid_to_address(&policy.id),
            owner: sender,
            revoked_at_ms: clock::timestamp_ms(clock),
            budget_remaining: policy.budget_remaining,
        });
    }

    // ── Update risk params (no redeploy needed) ───────────
    public fun update_risk_params(
        policy: &mut PolicyObject,
        new_risk_ceiling: u64,
        new_slippage_bps: u64,
        new_max_single_tx: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == policy.owner || sender == policy.dao_override, E_NOT_OWNER);
        assert!(policy.status != STATUS_REVOKED, E_POLICY_REVOKED);

        let old_version = policy.policy_version;
        policy.policy_version = policy.policy_version + 1;
        policy.risk_ceiling = new_risk_ceiling;
        policy.slippage_guard_bps = new_slippage_bps;
        policy.max_single_tx = new_max_single_tx;

        sui::event::emit(ParamsUpdated {
            policy_id: object::uid_to_address(&policy.id),
            old_version,
            new_version: policy.policy_version,
            new_risk_ceiling,
            new_slippage_bps,
            new_max_tx: new_max_single_tx,
            timestamp_ms: clock::timestamp_ms(clock),
        });
    }

    // ── Read functions ────────────────────────────────────
    public fun budget_remaining(policy: &PolicyObject): u64 { policy.budget_remaining }
    public fun budget_total(policy: &PolicyObject): u64 { policy.budget_total }
    public fun risk_ceiling(policy: &PolicyObject): u64 { policy.risk_ceiling }
    public fun status(policy: &PolicyObject): u8 { policy.status }
    public fun owner(policy: &PolicyObject): address { policy.owner }
    public fun expiry_ms(policy: &PolicyObject): u64 { policy.expiry_ms }
    public fun policy_version(policy: &PolicyObject): u64 { policy.policy_version }
    public fun total_actions(policy: &PolicyObject): u64 { policy.total_actions }
    public fun total_approved(policy: &PolicyObject): u64 { policy.total_approved }
    public fun total_rejected(policy: &PolicyObject): u64 { policy.total_rejected }
    public fun is_active(policy: &PolicyObject): bool { policy.status == STATUS_ACTIVE }
    public fun is_paused(policy: &PolicyObject): bool { policy.status == STATUS_PAUSED }
    public fun is_revoked(policy: &PolicyObject): bool { policy.status == STATUS_REVOKED }
    public fun scope_deepbook(): u8 { SCOPE_DEEPBOOK }
    public fun scope_custom(): u8 { SCOPE_CUSTOM }
}
