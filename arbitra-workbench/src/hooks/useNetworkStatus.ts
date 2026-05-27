"use client";

import { useEffect, useState } from "react";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

interface NetworkStatus {
  blockNumber: string;
  latencyMs: number;
  isLive: boolean;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    blockNumber: "...",
    latencyMs: 0,
    isLive: false,
  });

  useEffect(() => {
    const client = new SuiJsonRpcClient({
      url: "https://fullnode.testnet.sui.io",
      network: "testnet",
    });

    const fetch = async () => {
      try {
        const start = Date.now();
        const state = await client.getLatestSuiSystemState();
        const latency = Date.now() - start;
        setStatus({
          blockNumber: Number(state.epoch).toLocaleString(),
          latencyMs: latency,
          isLive: true,
        });
      } catch {
        setStatus(prev => ({ ...prev, isLive: false }));
      }
    };

    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
