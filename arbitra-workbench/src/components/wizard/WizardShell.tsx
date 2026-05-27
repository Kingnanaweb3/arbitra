"use client";

import { useState } from "react";
import { WizardState, defaultWizardState, AgentType, templateConfigs } from "@/lib/wizardState";
import Step1AgentType from "./Step1AgentType";
import { agentActionDefaults } from "@/lib/wizardState";
import Step2Identity from "./Step2Identity";
import Step3Connect from "./Step3Connect";
import Step4Policy from "./Step4Policy";
import Step5Deploy from "./Step5Deploy";

const steps = [
  { id: 1, label: "Agent Type" },
  { id: 2, label: "Identity" },
  { id: 3, label: "Connect" },
  { id: 4, label: "Policy" },
  { id: 5, label: "Deploy" },
];

interface WizardShellProps {
  onExit: () => void;
}

export default function WizardShell({ onExit }: WizardShellProps) {
  const [state, setState] = useState<WizardState>(defaultWizardState);

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const goToStep = (step: number) => {
    updateState({ step: step as WizardState["step"] });
  };

  const goNext = () => {
    if (state.step < 5) goToStep(state.step + 1);
  };

  const goBack = () => {
    if (state.step > 1) goToStep(state.step - 1);
    else onExit();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <div style={{ padding: "12px 32px 0", borderBottom: "1px solid #1a2234", background: "#0b0f18", flexShrink: 0 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569", marginBottom: 16 }}>
          <button onClick={onExit} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 12, padding: 0 }}>
            Dashboard
          </button>
          <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
          <span style={{ color: "#94a3b8" }}>New Agent</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 0, overflowX: "auto", paddingBottom: 0 }}>
          {steps.map((step, index) => {
            const isCompleted = state.step > step.id;
            const isActive = state.step === step.id;
            return (
              <div key={step.id} style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 0",
                    borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
                    cursor: isCompleted ? "pointer" : "default",
                  }}
                  onClick={() => isCompleted && goToStep(step.id)}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: isCompleted ? "#2563eb" : isActive ? "#1a2d4a" : "#0e1623",
                    border: `1px solid ${isCompleted ? "#2563eb" : isActive ? "#2563eb" : "#1e2d45"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {isCompleted ? (
                      <i className="ti ti-check" style={{ fontSize: 11, color: "#fff" }} />
                    ) : (
                      <span style={{ fontSize: 11, color: isActive ? "#60a5fa" : "#475569", fontWeight: 500 }}>
                        {step.id}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: isActive ? "#f1f5f9" : isCompleted ? "#94a3b8" : "#475569", whiteSpace: "nowrap" }}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div style={{ width: 40, height: 1, background: isCompleted ? "#2563eb" : "#1e2d45", margin: "0 8px", flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {state.step === 1 && (
        <Step1AgentType
          selected={state.agentType}
          onSelect={(type: AgentType) => updateState({ agentType: type, actionMappings: agentActionDefaults[type] ?? agentActionDefaults.custom, scope: type === "trading" ? "deepbook" : "custom", splitAddresses: [{ address: "", amount: 0 }], recipientWhitelist: [""] })}
          onContinue={goNext}
        />
      )}

      {state.step === 2 && (
        <Step2Identity
          state={state}
          onChange={updateState}
          onContinue={goNext}
          onBack={goBack}
        />
      )}

      {state.step === 3 && (
        <Step3Connect
          state={state}
          onChange={updateState}
          onContinue={goNext}
          onBack={goBack}
        />
      )}

      {state.step === 4 && (
        <Step4Policy
          state={state}
          onChange={updateState}
          onContinue={goNext}
          onBack={goBack}
        />
      )}

      {state.step === 5 && (
        <Step5Deploy
          state={state}
          onBack={goBack}
        />
      )}
    </div>
  );
}
