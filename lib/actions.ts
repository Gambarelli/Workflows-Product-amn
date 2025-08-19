import type { Action, ActionContext } from "./types"

export const actionCatalog: Record<string, Action> = {
  // Requester actions
  submit: {
    key: "submit",
    label: "Submit",
    visible: (ctx) => ctx.role === "Requester" && ["Draft", "Imported/Initiated"].includes(ctx.state),
    enabled: (ctx) => true,
  },
  attachReceipt: {
    key: "attachReceipt",
    label: "Attach Receipt",
    visible: (ctx) => ctx.role === "Requester",
    enabled: (ctx) => true,
  },
  editDetails: {
    key: "editDetails",
    label: "Edit Details",
    visible: (ctx) => ctx.role === "Requester" && !["Paid", "Reconciled", "Archived", "Completed"].includes(ctx.state),
    enabled: (ctx) => true,
  },
  withdraw: {
    key: "withdraw",
    label: "Withdraw",
    visible: (ctx) => ctx.role === "Requester" && !["Paid", "Reconciled", "Archived", "Completed"].includes(ctx.state),
    enabled: (ctx) => true,
  },

  // Accountant actions
  reviewAIExtract: {
    key: "reviewAIExtract",
    label: "Review AI Extract",
    visible: (ctx) =>
      ctx.role === "Accountant" && ctx.state === "Pre-Accounting" && ctx.config.preAccounting.aiReceiptScan,
    enabled: (ctx) => true,
  },
  overrideFields: {
    key: "overrideFields",
    label: "Override Fields",
    visible: (ctx) => ctx.role === "Accountant" && ctx.state === "Pre-Accounting",
    enabled: (ctx) => true,
  },
  markAsPreAccounted: {
    key: "markAsPreAccounted",
    label: "Mark Pre-Accounted",
    visible: (ctx) => ctx.role === "Accountant" && ctx.state === "Pre-Accounting",
    enabled: (ctx) => true,
  },
  schedulePayment: {
    key: "schedulePayment",
    label: "Schedule Payment",
    visible: (ctx) => ctx.role === "Accountant" && ctx.state === "Payment Scheduled",
    enabled: (ctx) => ctx.config.fundsPolicy === "lenient" || true, // Mock FundsOK=true
    tooltip: (ctx) => (ctx.config.fundsPolicy === "strict" ? "Requires funds verification" : undefined),
  },

  // Approval actions
  approve: {
    key: "approve",
    label: "Approve",
    visible: (ctx) => {
      const approvalStates = [
        "Awaiting Approval L1",
        "Awaiting Approval L2",
        "Awaiting Approval L3",
        "Approval L1",
        "Approval L2",
        "Approval L3",
      ]
      const roleLevel = ctx.role.replace("ApproverL", "")
      return approvalStates.some((state) => ctx.state === state && state.includes(roleLevel))
    },
    enabled: (ctx) => true,
  },
  reject: {
    key: "reject",
    label: "Reject",
    visible: (ctx) => {
      const approvalStates = [
        "Awaiting Approval L1",
        "Awaiting Approval L2",
        "Awaiting Approval L3",
        "Approval L1",
        "Approval L2",
        "Approval L3",
      ]
      const roleLevel = ctx.role.replace("ApproverL", "")
      return approvalStates.some((state) => ctx.state === state && state.includes(roleLevel))
    },
    enabled: (ctx) => true,
  },
  requestChanges: {
    key: "requestChanges",
    label: "Request Changes",
    visible: (ctx) => {
      const approvalStates = [
        "Awaiting Approval L1",
        "Awaiting Approval L2",
        "Awaiting Approval L3",
        "Approval L1",
        "Approval L2",
        "Approval L3",
      ]
      const roleLevel = ctx.role.replace("ApproverL", "")
      return approvalStates.some((state) => ctx.state === state && state.includes(roleLevel))
    },
    enabled: (ctx) => true,
  },

  // Compliance actions
  approveCompliance: {
    key: "approveCompliance",
    label: "Approve Compliance",
    visible: (ctx) =>
      ctx.role === "Compliance" && ctx.state === "Compliance Review" && ctx.config.compliance.holdEnabled,
    enabled: (ctx) => true,
  },
  rejectCompliance: {
    key: "rejectCompliance",
    label: "Reject Compliance",
    visible: (ctx) =>
      ctx.role === "Compliance" && ctx.state === "Compliance Review" && ctx.config.compliance.holdEnabled,
    enabled: (ctx) => true,
  },

  // Payer actions
  signPayment: {
    key: "signPayment",
    label: "Sign Payment",
    visible: (ctx) => ctx.role === "Payer" && ctx.state === "Payment Sign-off" && ctx.config.payment.requireSignOff,
    enabled: (ctx) => true,
  },
  executePayment: {
    key: "executePayment",
    label: "Execute Payment",
    visible: (ctx) => ctx.role === "Payer" && ["Payment Scheduled", "Payment Sign-off"].includes(ctx.state),
    enabled: (ctx) => true,
  },

  // Admin actions
  forceAdvance: {
    key: "forceAdvance",
    label: "Force Advance",
    visible: (ctx) => ctx.role === "Admin",
    enabled: (ctx) => true,
  },
  toggleBypass: {
    key: "toggleBypass",
    label: "Toggle Bypass",
    visible: (ctx) => ctx.role === "Admin",
    enabled: (ctx) => true,
  },
}

export function getActionsForState(state: string, role: string, config: any, lifecycle: string): Action[] {
  const context: ActionContext = { config, lifecycle, state, role }

  return Object.values(actionCatalog).filter((action) => action.visible(context))
}
