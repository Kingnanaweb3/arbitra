import { MockLogEntry } from "./dashboardConfig";

export async function fetchOnchainLogs(policyId: string, token: string): Promise<MockLogEntry[]> {
  try {
    const response = await fetch(`/api/logs?policyId=${policyId}&token=${token}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.logs ?? [];
  } catch {
    return [];
  }
}

export async function fetchOnchainStats(policyId: string, token: string, budget: number) {
  try {
    const response = await fetch(`/api/logs?policyId=${policyId}&token=${token}&budget=${budget}&statsOnly=true`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.stats ?? null;
  } catch {
    return null;
  }
}
