"use client";

const indicators = [
  { label: "Sui Testnet", color: "bg-blue-light" },
  { label: "Pyth: Live", color: "bg-green-active" },
  { label: "Walrus: Synced", color: "bg-green-active" },
  { label: "Deepbook: Connected", color: "bg-green-active" },
];

export default function StatusBar() {
  return (
    <footer className="h-[34px] bg-bg-secondary border-t border-border-primary flex items-center px-5 gap-5 shrink-0 z-10 relative">
      {indicators.map((item, i) => (
        <div key={item.label} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-text-hint mr-3">·</span>
          )}
          <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
          <span className="text-[11px] text-text-muted">{item.label}</span>
        </div>
      ))}
    </footer>
  );
}
