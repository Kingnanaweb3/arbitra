"use client";

import { AgentType, agentTypeConfig } from "@/lib/wizardState";

interface Step1Props {
  selected: AgentType | null;
  onSelect: (type: AgentType) => void;
  onContinue: () => void;
}

const agentTypes: AgentType[] = ["trading", "ecommerce", "treasury", "payments", "gaming", "custom"];

export default function Step1AgentType({ selected, onSelect, onContinue }: Step1Props) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 40px 32px", overflowY: "auto" }}>

      <div style={{ width: "100%", maxWidth: 720 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f1f5f9", marginBottom: 8 }}>
            What will your agent do?
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            Choose a category. Arbitra adapts the policy controls and monitoring to match your use case.
            <br />The enforcement layer is identical underneath.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
          {agentTypes.map((type) => {
            const config = agentTypeConfig[type];
            const isSelected = selected === type;
            return (
              <div
                key={type}
                onClick={() => onSelect(type)}
                style={{
                  background: isSelected ? "#0f1e36" : "#0e1623",
                  border: `1px solid ${isSelected ? config.borderColor : "#1e2d45"}`,
                  borderRadius: 12,
                  padding: "20px 16px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "flex-end", height: 18 }}>
                  {isSelected && (
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: config.borderColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="ti ti-check" style={{ fontSize: 11, color: "#fff" }} />
                    </span>
                  )}
                </div>
                <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                  <i className={`ti ${config.icon}`} style={{ fontSize: 28, color: config.color }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 6 }}>
                    {config.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.55 }}>
                    {config.desc}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(type); }}
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    padding: "5px 0",
                    width: "100%",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: isSelected ? config.borderColor : "transparent",
                    border: `1px solid ${isSelected ? config.borderColor : "#1e2d45"}`,
                    color: isSelected ? "#fff" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  {isSelected ? (
                    <><i className="ti ti-check" style={{ fontSize: 11 }} /> Selected</>
                  ) : (
                    <>Select <i className="ti ti-arrow-right" style={{ fontSize: 11 }} /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: "#334155" }}>
            Not sure which to pick? All agent types use the same on-chain enforcement.
            You can always create another later.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onContinue}
            disabled={!selected}
            style={{
              background: selected ? "#2563eb" : "#1e2837",
              color: selected ? "#fff" : "#475569",
              border: "none",
              padding: "10px 28px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: selected ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
          >
            Continue
            <i className="ti ti-arrow-right" style={{ fontSize: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
