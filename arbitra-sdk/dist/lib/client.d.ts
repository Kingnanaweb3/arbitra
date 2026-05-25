import { ArbitraClientConfig, PolicyConfig, DeployedPolicy, ActionRequest, ActionResult, PolicyStatusResult, RiskScoreResult } from "../types/index.js";
export declare class ArbitraClient {
    private client;
    private keypair;
    private packageId;
    private network;
    constructor(config: ArbitraClientConfig);
    getAddress(): string;
    createPolicy(config: PolicyConfig): Promise<DeployedPolicy>;
    validateAction(policyId: string, request: ActionRequest): Promise<ActionResult>;
    revokePolicy(policyId: string, capId: string): Promise<string>;
    pausePolicy(policyId: string, riskScore: number): Promise<string>;
    resumePolicy(policyId: string, riskScore: number): Promise<string>;
    updateRiskParams(policyId: string, newRiskCeiling: number, newSlippageBps: number, newMaxTx: number): Promise<string>;
    getPolicyStatus(policyId: string): Promise<PolicyStatusResult>;
    getActivityLog(logId: string): Promise<{
        logId: string;
        policyId: any;
        totalEntries: number;
        approvedCount: number;
        rejectedCount: number;
        pausedCount: number;
        isSealed: boolean;
        entries: any;
    }>;
    getPolicyEvents(policyId: string): Promise<import("@mysten/sui/jsonRpc").SuiEvent[]>;
    activateStressTest(riskParamsId: string, injectedScore: number): Promise<string>;
    deactivateStressTest(riskParamsId: string): Promise<string>;
    updateRiskScore(riskParamsId: string, volatilityScore: number, oracleScore: number, depthScore: number): Promise<RiskScoreResult>;
    private parseErrorCode;
    getExplorerUrl(txDigest: string): string;
}
//# sourceMappingURL=client.d.ts.map