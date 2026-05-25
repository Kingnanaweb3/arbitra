import { ArbitraClient } from "./lib/client.js";
export { ArbitraClient };
export type { ArbitraClientConfig, PolicyConfig, DeployedPolicy, ActionRequest, ActionResult, PolicyStatusResult, RiskScoreResult, LogEntry, Network, AgentType, Scope, PolicyStatus, } from "./types/index.js";
export { ArbitraErrorCode, ArbitraErrorMessages, } from "./types/index.js";
export declare const ARBITRA_PACKAGE_ID = "0x8d2d740caccc02db4643f6ebccada30e0b029fb6274fdb9ffed04fed3ad3e53c";
export declare const ARBITRA_TESTNET_CONFIG: {
    network: "testnet";
    packageId: string;
};
export declare function createArbitraClient(privateKey: string): ArbitraClient;
//# sourceMappingURL=index.d.ts.map