// ── Error Codes ───────────────────────────────────────────
export var ArbitraErrorCode;
(function (ArbitraErrorCode) {
    ArbitraErrorCode[ArbitraErrorCode["BUDGET_EXCEEDED"] = 1] = "BUDGET_EXCEEDED";
    ArbitraErrorCode[ArbitraErrorCode["SCOPE_VIOLATION"] = 2] = "SCOPE_VIOLATION";
    ArbitraErrorCode[ArbitraErrorCode["POLICY_EXPIRED"] = 3] = "POLICY_EXPIRED";
    ArbitraErrorCode[ArbitraErrorCode["RISK_CEILING_BREACHED"] = 4] = "RISK_CEILING_BREACHED";
    ArbitraErrorCode[ArbitraErrorCode["NOT_OWNER"] = 5] = "NOT_OWNER";
    ArbitraErrorCode[ArbitraErrorCode["POLICY_REVOKED"] = 6] = "POLICY_REVOKED";
    ArbitraErrorCode[ArbitraErrorCode["SLIPPAGE_EXCEEDED"] = 7] = "SLIPPAGE_EXCEEDED";
    ArbitraErrorCode[ArbitraErrorCode["TX_LIMIT_EXCEEDED"] = 8] = "TX_LIMIT_EXCEEDED";
    ArbitraErrorCode[ArbitraErrorCode["NOT_AUTHORIZED"] = 1] = "NOT_AUTHORIZED";
    ArbitraErrorCode[ArbitraErrorCode["INVALID_WEIGHT"] = 2] = "INVALID_WEIGHT";
    ArbitraErrorCode[ArbitraErrorCode["INVALID_THRESHOLD"] = 3] = "INVALID_THRESHOLD";
})(ArbitraErrorCode || (ArbitraErrorCode = {}));
// ── Error Messages ────────────────────────────────────────
export const ArbitraErrorMessages = {
    1: "Budget exceeded — agent cannot spend more than the policy allows",
    2: "Scope violation — agent attempted to act outside its defined scope",
    3: "Policy expired — the policy has passed its expiry time",
    4: "Risk ceiling breached — market conditions too dangerous to act",
    5: "Not owner — only the policy owner or DAO can perform this action",
    6: "Policy revoked — this policy has been permanently terminated",
    7: "Slippage exceeded — trade skipped due to excessive slippage",
    8: "Transaction limit exceeded — amount exceeds max single transaction",
};
//# sourceMappingURL=index.js.map