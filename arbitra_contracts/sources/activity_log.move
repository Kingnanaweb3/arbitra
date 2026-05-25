#[allow(duplicate_alias, unused_const, unused_field)]
module aegis_contracts::activity_log {

    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::clock::{Self, Clock};

    // ── Entry type constants ─────────────────────────────
    const ENTRY_ACTION_APPROVED: u8 = 1;
    const ENTRY_ACTION_REJECTED: u8 = 2;
    const ENTRY_RISK_CHECK: u8 = 3;
    const ENTRY_PAUSED: u8 = 4;
    const ENTRY_RESUMED: u8 = 5;
    const ENTRY_REVOKED: u8 = 6;
    const ENTRY_SKIPPED: u8 = 7;
    const ENTRY_INITIALIZED: u8 = 8;
    const ENTRY_PARAMS_UPDATED: u8 = 9;
    const ENTRY_DAO_OVERRIDE: u8 = 10;

    // ── Errors ───────────────────────────────────────────
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_LOG_SEALED: u64 = 2;

    // ── A single log entry ───────────────────────────────
    public struct LogEntry has store, copy, drop {
        entry_type: u8,
        action_label: vector<u8>,
        amount: u64,
        risk_score: u64,
        slippage_bps: u64,
        rejection_reason: u64,
        policy_version: u64,
        timestamp_ms: u64,
        actor: address,
        ptb_digest: vector<u8>,
    }

    // ── The append-only activity log ─────────────────────
    public struct ActivityLog has key, store {
        id: UID,
        policy_id: address,
        owner: address,
        entries: vector<LogEntry>,
        total_entries: u64,
        approved_count: u64,
        rejected_count: u64,
        paused_count: u64,
        is_sealed: bool,
        created_at_ms: u64,
    }

    // ── Events ───────────────────────────────────────────
    public struct EntryWritten has copy, drop {
        log_id: address,
        policy_id: address,
        entry_type: u8,
        action_label: vector<u8>,
        amount: u64,
        risk_score: u64,
        policy_version: u64,
        timestamp_ms: u64,
        total_entries: u64,
    }

    public struct LogSealed has copy, drop {
        log_id: address,
        policy_id: address,
        total_entries: u64,
        sealed_at_ms: u64,
    }

    // ── Create activity log ──────────────────────────────
    public fun create_log(
        policy_id: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ): address {
        let owner = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock);

        let log = ActivityLog {
            id: object::new(ctx),
            policy_id,
            owner,
            entries: vector[],
            total_entries: 0,
            approved_count: 0,
            rejected_count: 0,
            paused_count: 0,
            is_sealed: false,
            created_at_ms: now,
        };

        // Write initialization entry
        let init_entry = LogEntry {
            entry_type: ENTRY_INITIALIZED,
            action_label: b"Agent initialized. Policy loaded.",
            amount: 0,
            risk_score: 0,
            slippage_bps: 0,
            rejection_reason: 0,
            policy_version: 1,
            timestamp_ms: now,
            actor: owner,
            ptb_digest: vector[],
        };

        let log_id = object::uid_to_address(&log.id);

        sui::event::emit(EntryWritten {
            log_id,
            policy_id,
            entry_type: ENTRY_INITIALIZED,
            action_label: b"Agent initialized. Policy loaded.",
            amount: 0,
            risk_score: 0,
            policy_version: 1,
            timestamp_ms: now,
            total_entries: 1,
        });

        let mut log = log;
        vector::push_back(&mut log.entries, init_entry);
        log.total_entries = 1;

        transfer::share_object(log);
        log_id
    }

    // ── Write approved action ────────────────────────────
    public fun write_approved(
        log: &mut ActivityLog,
        action_label: vector<u8>,
        amount: u64,
        risk_score: u64,
        slippage_bps: u64,
        policy_version: u64,
        ptb_digest: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(!log.is_sealed, E_LOG_SEALED);
        let now = clock::timestamp_ms(clock);
        let actor = tx_context::sender(ctx);

        let entry = LogEntry {
            entry_type: ENTRY_ACTION_APPROVED,
            action_label,
            amount,
            risk_score,
            slippage_bps,
            rejection_reason: 0,
            policy_version,
            timestamp_ms: now,
            actor,
            ptb_digest,
        };

        vector::push_back(&mut log.entries, entry);
        log.total_entries = log.total_entries + 1;
        log.approved_count = log.approved_count + 1;

        sui::event::emit(EntryWritten {
            log_id: object::uid_to_address(&log.id),
            policy_id: log.policy_id,
            entry_type: ENTRY_ACTION_APPROVED,
            action_label,
            amount,
            risk_score,
            policy_version,
            timestamp_ms: now,
            total_entries: log.total_entries,
        });
    }

    // ── Write rejected action ────────────────────────────
    public fun write_rejected(
        log: &mut ActivityLog,
        action_label: vector<u8>,
        amount: u64,
        risk_score: u64,
        rejection_reason: u64,
        policy_version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(!log.is_sealed, E_LOG_SEALED);
        let now = clock::timestamp_ms(clock);
        let actor = tx_context::sender(ctx);

        let entry = LogEntry {
            entry_type: ENTRY_ACTION_REJECTED,
            action_label,
            amount,
            risk_score,
            slippage_bps: 0,
            rejection_reason,
            policy_version,
            timestamp_ms: now,
            actor,
            ptb_digest: vector[],
        };

        vector::push_back(&mut log.entries, entry);
        log.total_entries = log.total_entries + 1;
        log.rejected_count = log.rejected_count + 1;

        sui::event::emit(EntryWritten {
            log_id: object::uid_to_address(&log.id),
            policy_id: log.policy_id,
            entry_type: ENTRY_ACTION_REJECTED,
            action_label,
            amount,
            risk_score,
            policy_version,
            timestamp_ms: now,
            total_entries: log.total_entries,
        });
    }

    // ── Write risk check ─────────────────────────────────
    public fun write_risk_check(
        log: &mut ActivityLog,
        risk_score: u64,
        policy_version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(!log.is_sealed, E_LOG_SEALED);
        let now = clock::timestamp_ms(clock);
        let actor = tx_context::sender(ctx);

        let entry = LogEntry {
            entry_type: ENTRY_RISK_CHECK,
            action_label: b"Risk check. Monitoring.",
            amount: 0,
            risk_score,
            slippage_bps: 0,
            rejection_reason: 0,
            policy_version,
            timestamp_ms: now,
            actor,
            ptb_digest: vector[],
        };

        vector::push_back(&mut log.entries, entry);
        log.total_entries = log.total_entries + 1;

        sui::event::emit(EntryWritten {
            log_id: object::uid_to_address(&log.id),
            policy_id: log.policy_id,
            entry_type: ENTRY_RISK_CHECK,
            action_label: b"Risk check. Monitoring.",
            amount: 0,
            risk_score,
            policy_version,
            timestamp_ms: now,
            total_entries: log.total_entries,
        });
    }

    // ── Write paused ─────────────────────────────────────
    public fun write_paused(
        log: &mut ActivityLog,
        risk_score: u64,
        risk_ceiling: u64,
        policy_version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(!log.is_sealed, E_LOG_SEALED);
        let now = clock::timestamp_ms(clock);
        let actor = tx_context::sender(ctx);

        let entry = LogEntry {
            entry_type: ENTRY_PAUSED,
            action_label: b"PAUSED. Risk ceiling breached. Policy triggered.",
            amount: 0,
            risk_score,
            slippage_bps: 0,
            rejection_reason: risk_ceiling,
            policy_version,
            timestamp_ms: now,
            actor,
            ptb_digest: vector[],
        };

        vector::push_back(&mut log.entries, entry);
        log.total_entries = log.total_entries + 1;
        log.paused_count = log.paused_count + 1;

        sui::event::emit(EntryWritten {
            log_id: object::uid_to_address(&log.id),
            policy_id: log.policy_id,
            entry_type: ENTRY_PAUSED,
            action_label: b"PAUSED. Risk ceiling breached. Policy triggered.",
            amount: 0,
            risk_score,
            policy_version,
            timestamp_ms: now,
            total_entries: log.total_entries,
        });
    }

    // ── Write resumed ────────────────────────────────────
    public fun write_resumed(
        log: &mut ActivityLog,
        risk_score: u64,
        policy_version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(!log.is_sealed, E_LOG_SEALED);
        let now = clock::timestamp_ms(clock);
        let actor = tx_context::sender(ctx);

        let entry = LogEntry {
            entry_type: ENTRY_RESUMED,
            action_label: b"Conditions normalized. Resuming automatically.",
            amount: 0,
            risk_score,
            slippage_bps: 0,
            rejection_reason: 0,
            policy_version,
            timestamp_ms: now,
            actor,
            ptb_digest: vector[],
        };

        vector::push_back(&mut log.entries, entry);
        log.total_entries = log.total_entries + 1;

        sui::event::emit(EntryWritten {
            log_id: object::uid_to_address(&log.id),
            policy_id: log.policy_id,
            entry_type: ENTRY_RESUMED,
            action_label: b"Conditions normalized. Resuming automatically.",
            amount: 0,
            risk_score,
            policy_version,
            timestamp_ms: now,
            total_entries: log.total_entries,
        });
    }

    // ── Write revoked ────────────────────────────────────
    public fun write_revoked(
        log: &mut ActivityLog,
        policy_version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(!log.is_sealed, E_LOG_SEALED);
        let now = clock::timestamp_ms(clock);
        let actor = tx_context::sender(ctx);

        let entry = LogEntry {
            entry_type: ENTRY_REVOKED,
            action_label: b"REVOKED. Agent terminated by owner. Logged on-chain.",
            amount: 0,
            risk_score: 0,
            slippage_bps: 0,
            rejection_reason: 0,
            policy_version,
            timestamp_ms: now,
            actor,
            ptb_digest: vector[],
        };

        vector::push_back(&mut log.entries, entry);
        log.total_entries = log.total_entries + 1;
        log.is_sealed = true;

        sui::event::emit(EntryWritten {
            log_id: object::uid_to_address(&log.id),
            policy_id: log.policy_id,
            entry_type: ENTRY_REVOKED,
            action_label: b"REVOKED. Agent terminated by owner. Logged on-chain.",
            amount: 0,
            risk_score: 0,
            policy_version,
            timestamp_ms: now,
            total_entries: log.total_entries,
        });

        sui::event::emit(LogSealed {
            log_id: object::uid_to_address(&log.id),
            policy_id: log.policy_id,
            total_entries: log.total_entries,
            sealed_at_ms: now,
        });
    }

    // ── Write skipped ────────────────────────────────────
    public fun write_skipped(
        log: &mut ActivityLog,
        action_label: vector<u8>,
        amount: u64,
        slippage_bps: u64,
        policy_version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(!log.is_sealed, E_LOG_SEALED);
        let now = clock::timestamp_ms(clock);
        let actor = tx_context::sender(ctx);

        let entry = LogEntry {
            entry_type: ENTRY_SKIPPED,
            action_label,
            amount,
            risk_score: 0,
            slippage_bps,
            rejection_reason: 0,
            policy_version,
            timestamp_ms: now,
            actor,
            ptb_digest: vector[],
        };

        vector::push_back(&mut log.entries, entry);
        log.total_entries = log.total_entries + 1;
        log.rejected_count = log.rejected_count + 1;

        sui::event::emit(EntryWritten {
            log_id: object::uid_to_address(&log.id),
            policy_id: log.policy_id,
            entry_type: ENTRY_SKIPPED,
            action_label,
            amount,
            risk_score: 0,
            policy_version,
            timestamp_ms: now,
            total_entries: log.total_entries,
        });
    }

    // ── Read functions ────────────────────────────────────
    public fun total_entries(log: &ActivityLog): u64 { log.total_entries }
    public fun approved_count(log: &ActivityLog): u64 { log.approved_count }
    public fun rejected_count(log: &ActivityLog): u64 { log.rejected_count }
    public fun paused_count(log: &ActivityLog): u64 { log.paused_count }
    public fun is_sealed(log: &ActivityLog): bool { log.is_sealed }
    public fun policy_id(log: &ActivityLog): address { log.policy_id }
    public fun owner(log: &ActivityLog): address { log.owner }
}
