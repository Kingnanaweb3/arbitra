"use client";

interface NavbarProps {
  connected?: boolean;
  address?: string;
}

export default function Navbar({ connected, address }: NavbarProps) {
  return (
    <header className="h-[52px] bg-bg-primary border-b border-border-primary flex items-center px-5 gap-3 shrink-0 z-10 relative">
      <div className="flex items-center gap-2">
        <i className="ti ti-shield-bolt text-blue-light text-xl" aria-hidden="true" />
        <span className="font-semibold text-[15px] text-text-primary">Arbitra</span>
      </div>

      <span className="text-text-muted text-sm">Workbench</span>

      <span className="text-[10px] text-text-muted bg-[#151d2e] border border-border-card px-2 py-0.5 rounded">
        Beta
      </span>

      <div className="ml-auto flex items-center gap-2.5">
        <button className="flex items-center gap-1.5 border border-amber-primary text-amber-light bg-transparent px-3.5 py-1.5 rounded-lg text-xs hover:bg-[#1a1500] transition-colors">
          <i className="ti ti-wallet text-xs" aria-hidden="true" />
          {connected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet"}
        </button>

        <button className="flex items-center gap-1.5 bg-blue-primary text-white border-none px-3.5 py-1.5 rounded-lg text-xs hover:bg-blue-glow transition-colors">
          <i className="ti ti-brand-google text-xs" aria-hidden="true" />
          Sign in with Google
        </button>
      </div>
    </header>
  );
}
