export type Network = "testnet" | "mainnet" | "devnet" | "localnet";
export type AgentType = "trading" | "ecommerce" | "treasury" | "payments" | "gaming" | "custom";
export type Scope = "deepbook" | "custom";
export type PolicyStatus = "active" | "paused" | "revoked" | "expired";
export interface PolicyConfig {
    agentName: string;
    agentType: AgentType;
    budget: number;
    token: string;
    scope: Scope;
    customScopeAddress?: string;
    expiryMs: number;
    riskCeiling: number;
    slippageGuardBps: number;
    maxSingleTx: number;
    beneficiary?: string;
    daoOverride?: string;
}
export interface DeployedPolicy {
    policyId: string;
    activityLogId: string;
    riskParamsId: string;
    packageId: string;
    owner: string;
    config: PolicyConfig;
    deployedAt: number;
    txDigest: string;
}
export interface ActionRequest {
    type: string;
    amount: number;
    scope: Scope;
    riskScore: number;
    slippageBps: number;
    ptbDigest?: string;
}
export interface ActionResult {
    approved: boolean;
    txDigest?: string;
    reason?: string;
    budgetRemaining: number;
    riskScore: number;
    policyVersion: number;
    timestamp: number;
}
export interface PolicyStatusResult {
    policyId: string;
    status: PolicyStatus;
    budgetTotal: number;
    budgetRemaining: number;
    budgetUsedPercent: number;
    riskCeiling: number;
    currentRiskScore: number;
    slippageGuardBps: number;
    maxSingleTx: number;
    totalActions: number;
    totalApproved: number;
    totalRejected: number;
    policyVersion: number;
    expiryMs: number;
    expiryRemainingMs: number;
    owner: string;
    isActive: boolean;
    isPaused: boolean;
    isRevoked: boolean;
}
export interface RiskScoreResult {
    aggregate: number;
    volatilityScore: number;
    oracleScore: number;
    depthScore: number;
    shouldPause: boolean;
    isStressTestActive: boolean;
    timestamp: number;
}
export interface LogEntry {
    entryType: number;
    actionLabel: string;
    amount: number;
    riskScore: number;
    slippageBps: number;
    rejectionReason: number;
    policyVersion: number;
    timestampMs: number;
    actor: string;
}
export interface ArbitraClientConfig {
    network: Network;
    packageId: string;
    privateKey?: string;
    rpcUrl?: string;
}
export declare enum ArbitraErrorCode {
    BUDGET_EXCEEDED = 1,
    SCOPE_VIOLATION = 2,
    POLICY_EXPIRED = 3,
    RISK_CEILING_BREACHED = 4,
    NOT_OWNER = 5,
    POLICY_REVOKED = 6,
    SLIPPAGE_EXCEEDED = 7,
    TX_LIMIT_EXCEEDED = 8,
    NOT_AUTHORIZED = 1,
    INVALID_WEIGHT = 2,
    INVALID_THRESHOLD = 3
}
export declare const ArbitraErrorMessages: Record<number, string>;
//# sourceMappingURL=index.d.ts.map