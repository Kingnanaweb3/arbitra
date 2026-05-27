"use client";

const demoAgents = [
  {
    icon: "ti-trending-up",
    color: "text-blue-light",
    borderColor: "border-blue-primary",
    btnColor: "text-blue-light border-blue-primary hover:bg-[#0d1f35]",
    title: "Trading Agent",
    desc: "DCA strategy on Deepbook with live risk guardian.",
  },
  {
    icon: "ti-shopping-cart",
    color: "text-amber-light",
    borderColor: "border-amber-primary",
    btnColor: "text-amber-light border-amber-primary hover:bg-[#1a1200]",
    title: "E-Commerce Agent",
    desc: "Purchases from approved vendors within a weekly budget.",
  },
  {
    icon: "ti-building-bank",
    color: "text-blue-light",
    borderColor: "border-blue-primary",
    btnColor: "text-blue-light border-blue-primary hover:bg-[#0d1f35]",
    title: "DAO Treasury Agent",
    desc: "Recurring grants within a monthly allocation.",
  },
];

const trustItems = [
  { icon: "ti-lock", label: "Trustless", desc: "Rules enforced at the VM level.", color: "text-blue-light" },
  { icon: "ti-file-check", label: "Auditable", desc: "Every action logged on-chain.", color: "text-amber-light" },
  { icon: "ti-shield-check", label: "In Control", desc: "Revoke any agent instantly.", color: "text-blue-light" },
];

interface EmptyStateProps {
  onCreateAgent?: () => void;
  onLaunchDemo?: (type: string) => void;
}

export default function EmptyState({ onCreateAgent, onLaunchDemo }: EmptyStateProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-8">
      <div className="relative z-10 text-center max-w-2xl w-full">

        <p className="text-[11px] text-text-hint uppercase tracking-widest mb-5">
          No agents deployed
        </p>

        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 -m-3 rounded-full bg-blue-glow" />
          <div className="w-16 h-16 bg-[linear-gradient(135deg,#1a2d4a,#0f1e36)] border border-[#2a4a7a] rounded-2xl flex items-center justify-center">
            <i className="ti ti-shield-bolt text-blue-light text-3xl" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-[28px] font-semibold text-text-primary leading-snug mb-3">
          Give your AI agent a policy.<br />
          <span className="text-blue-light">Not a leash.</span>
        </h1>

        <p className="text-text-secondary text-sm leading-relaxed mb-7 max-w-sm mx-auto">
          Connect any AI agent and deploy on-chain spending rules it cannot override — in minutes.
        </p>

        <button
          onClick={onCreateAgent}
          className="inline-flex items-center gap-2 bg-blue-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1d4ed8] transition-colors mb-7"
        >
          <i className="ti ti-plus text-sm" aria-hidden="true" />
          Create Your First Agent
        </button>

        <div className="flex items-center gap-3 mb-6 text-text-hint text-xs">
          <div className="flex-1 h-px bg-border-primary" />
          or try a live demo
          <div className="flex-1 h-px bg-border-primary" />
        </div>

        <div className="flex gap-3 justify-center mb-8">
          {demoAgents.map((agent) => (
            <div
              key={agent.title}
              className="bg-bg-card border border-border-card hover:border-border-hover rounded-xl p-4 w-[148px] text-center cursor-pointer transition-all duration-150 group"
            >
              <div className={`text-2xl mb-2.5 ${agent.color}`}>
                <i className={`ti ${agent.icon}`} aria-hidden="true" />
              </div>
              <div className="text-sm font-semibold text-text-primary mb-1.5">
                {agent.title}
              </div>
              <div className="text-[11px] text-text-muted leading-relaxed mb-3">
                {agent.desc}
              </div>
              <button
                onClick={() => onLaunchDemo?.(agent.title)}
                className={`text-[11px] w-full py-1.5 rounded-md border bg-transparent transition-colors ${agent.btnColor}`}
              >
                Launch Demo
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-10">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <i className={`ti ${item.icon} text-base ${item.color}`} aria-hidden="true" />
              <div className="text-left">
                <div className={`text-xs font-medium ${item.color}`}>{item.label}</div>
                <div className="text-[11px] text-text-muted">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
