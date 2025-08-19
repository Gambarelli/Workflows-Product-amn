export type Lifecycle = "transactions" | "workflows"

export type TransactionType = "card" | "payment" | "currency"

export type AppConfig = {
  lifecycle: Lifecycle
  transactionType: TransactionType
  spacing: {
    nodeSpacing: number
    zoom?: number
  }
  expenseManagement: {
    enabled: boolean
  }
  approvals: {
    enabled: boolean
  }
  payment: {
    requireSignOff: boolean
    multiPayerSign?: boolean
  }
  preAccounting: {
    required: boolean
    aiReceiptScan: boolean
    includedInFirstStep: boolean
    notSequential: boolean
  }
  compliance: {
    holdEnabled: boolean
    notSequential: boolean
  }
  fundsPolicy: "strict" | "lenient"
  fxConversion: {
    enabled: boolean
  }
  reconciliation: {
    autoReconcile: boolean
  }
}

export type Action = {
  key: string
  label: string
  visible: (ctx: ActionContext) => boolean
  enabled: (ctx: ActionContext) => boolean
  tooltip?: string
}

export type ActionContext = {
  config: AppConfig
  lifecycle: Lifecycle
  state: string
  role: string
}

export type StateNode = {
  id: string
  label: string
  position: { x: number; y: number }
  badges?: string[]
}

export type FlowEdge = {
  id: string
  source: string
  target: string
  label?: string
  style: "solid" | "dashed" | "red"
  guard?: string
}

export const defaultConfig: AppConfig = {
  lifecycle: "transactions",
  transactionType: "payment",
  spacing: {
    nodeSpacing: 300,
    zoom: 1,
  },
  expenseManagement: {
    enabled: true,
  },
  approvals: {
    enabled: true,
  },
  payment: {
    requireSignOff: true,
    multiPayerSign: false,
  },
  preAccounting: {
    required: true,
    aiReceiptScan: true,
    includedInFirstStep: false,
    notSequential: false,
  },
  compliance: {
    holdEnabled: false,
    notSequential: false,
  },
  fundsPolicy: "strict",
  fxConversion: {
    enabled: false,
  },
  reconciliation: {
    autoReconcile: true,
  },
}

export const roles = [
  "Requester",
  "Accountant",
  "ApproverL1",
  "ApproverL2",
  "ApproverL3",
  "Payer",
  "Compliance",
  "Admin",
]
