import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, chars = 6): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
}

export function formatUsdc(amount: number): string {
  return `${amount.toLocaleString()} USDC`;
}

export function formatMs(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  return `${hours}h ${minutes}m remaining`;
}

export function getRiskColor(score: number): string {
  if (score <= 50) return "#60a5fa";
  if (score <= 74) return "#f59e0b";
  return "#ef4444";
}

export function getRiskLabel(score: number): string {
  if (score <= 50) return "Low";
  if (score <= 74) return "Elevated";
  return "Critical";
}
