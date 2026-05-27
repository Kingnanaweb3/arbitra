export interface AgentPolicyConfig {
  budgetLabel: string;
  maxTxLabel: string;
  scopeLabel: string;
  showTradingPair: boolean;
  showSlippage: boolean;
  showDeepbookToggle: boolean;
  showVendorAddress: boolean;
  showSplitAddresses: boolean;
  showWeeklyReset: boolean;
  showRecipientWhitelist: boolean;
  showPaymentSchedule: boolean;
  showSubscription: boolean;
  showMarketplaceAddress: boolean;
  showBeneficiary: boolean;
  daoOverrideRequired: boolean;
  defaultScope: "deepbook" | "custom";
  streamComingSoon: boolean;
}

export const agentPolicyConfig: Record<string, AgentPolicyConfig> = {
  trading: {
    budgetLabel: "Budget",
    maxTxLabel: "Max Single Transaction",
    scopeLabel: "Scope",
    showTradingPair: true,
    showSlippage: true,
    showDeepbookToggle: true,
    showVendorAddress: false,
    showSplitAddresses: false,
    showWeeklyReset: false,
    showRecipientWhitelist: false,
    showPaymentSchedule: false,
    showSubscription: false,
    showMarketplaceAddress: false,
    showBeneficiary: true, // Treasury address
    daoOverrideRequired: false,
    defaultScope: "deepbook",
    streamComingSoon: false,
  },
  ecommerce: {
    budgetLabel: "Weekly Budget",
    maxTxLabel: "Max Single Purchase",
    scopeLabel: "Approved Vendor",
    showTradingPair: false,
    showSlippage: false,
    showDeepbookToggle: false,
    showVendorAddress: true,
    showSplitAddresses: true,
    showWeeklyReset: true,
    showRecipientWhitelist: false,
    showPaymentSchedule: false,
    showSubscription: false,
    showMarketplaceAddress: false,
    showBeneficiary: true, // Treasury address
    daoOverrideRequired: false,
    defaultScope: "custom",
    streamComingSoon: true,
  },
  treasury: {
    budgetLabel: "Monthly Allocation",
    maxTxLabel: "Max Single Grant",
    scopeLabel: "Recipient Whitelist",
    showTradingPair: false,
    showSlippage: false,
    showDeepbookToggle: false,
    showVendorAddress: false,
    showSplitAddresses: true,
    showWeeklyReset: false,
    showRecipientWhitelist: true,
    showPaymentSchedule: true,
    showSubscription: false,
    showMarketplaceAddress: false,
    showBeneficiary: false,
    daoOverrideRequired: true,
    defaultScope: "custom",
    streamComingSoon: true,
  },
  payments: {
    budgetLabel: "Budget",
    maxTxLabel: "Max Single Payment",
    scopeLabel: "Approved Payees",
    showTradingPair: false,
    showSlippage: false,
    showDeepbookToggle: false,
    showVendorAddress: false,
    showSplitAddresses: true,
    showWeeklyReset: false,
    showRecipientWhitelist: true,
    showPaymentSchedule: true,
    showSubscription: true,
    showMarketplaceAddress: false,
    showBeneficiary: true, // Treasury address
    daoOverrideRequired: false,
    defaultScope: "custom",
    streamComingSoon: true,
  },
  gaming: {
    budgetLabel: "Budget",
    maxTxLabel: "Max Single Bid",
    scopeLabel: "Approved Marketplace",
    showTradingPair: false,
    showSlippage: false,
    showDeepbookToggle: false,
    showVendorAddress: false,
    showSplitAddresses: false,
    showWeeklyReset: false,
    showRecipientWhitelist: false,
    showPaymentSchedule: false,
    showSubscription: false,
    showMarketplaceAddress: true,
    showBeneficiary: false,
    daoOverrideRequired: false,
    defaultScope: "custom",
    streamComingSoon: false,
  },
  custom: {
    budgetLabel: "Budget",
    maxTxLabel: "Max Single Transaction",
    scopeLabel: "Scope Address",
    showTradingPair: false,
    showSlippage: false,
    showDeepbookToggle: true,
    showVendorAddress: false,
    showSplitAddresses: true,
    showWeeklyReset: false,
    showRecipientWhitelist: false,
    showPaymentSchedule: false,
    showSubscription: true,
    showMarketplaceAddress: false,
    showBeneficiary: true, // Treasury address
    daoOverrideRequired: false,
    defaultScope: "custom",
    streamComingSoon: true,
  },
};

export const paymentScheduleOptions = [
  { label: "On-demand", value: "on-demand" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Bi-weekly", value: "biweekly" },
  { label: "Monthly", value: "monthly" },
];

export const subscriptionIntervalOptions = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Custom", value: "custom" },
];
