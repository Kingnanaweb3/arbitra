"use client";

import { cn } from "@/lib/utils";

const navItems = [
  { icon: "ti-layout-dashboard", label: "Dashboard", id: "dashboard" },
  { icon: "ti-robot", label: "My Agents", id: "agents" },
  { icon: "ti-plus", label: "New Agent", id: "new" },
  { icon: "ti-library", label: "Policy Library", id: "library" },
  { icon: "ti-chart-bar", label: "Analytics", id: "analytics" },
  { icon: "ti-settings", label: "Settings", id: "settings" },
  { icon: "ti-file-text", label: "Docs", id: "docs" },
];

interface SidebarProps {
  active?: string;
  onNavigate?: (id: string) => void;
}

export default function Sidebar({ active = "dashboard", onNavigate }: SidebarProps) {
  return (
    <aside className="w-[200px] bg-bg-secondary border-r border-border-primary flex flex-col py-3 shrink-0">
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 w-full text-left",
              active === item.id
                ? "bg-[#1a2d4a] text-blue-light"
                : "text-text-muted hover:text-text-secondary hover:bg-[#111827]"
            )}
          >
            <i className={cn("ti", item.icon, "text-base")} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-border-primary flex items-center gap-2 text-text-muted text-xs">
        <i className="ti ti-wallet text-base" aria-hidden="true" />
        Connect Wallet
      </div>
    </aside>
  );
}
