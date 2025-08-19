import type { StateNode } from "./types"

export type Column = "pending" | "executed" | "rejected"

export type StateNodeTemplate = {
  id: string
  label: string
  badges?: string[]
  category: "core" | "expenseManagement" | "preAccounting" | "compliance" | "approvals" | "signOff" | "complete"
  columns: Column[]
}

export type FlowTemplates = {
  payment: {
    nodes: StateNodeTemplate[]
    edges: { source: string; target: string; style?: "solid" | "dashed" | "red"; label?: string; guard?: string }[]
    parallel: ParallelTemplates
  }
  currency: {
    nodes: StateNodeTemplate[]
    edges: { source: string; target: string; style?: "solid" | "dashed" | "red"; label?: string; guard?: string }[]
    parallel: ParallelTemplates
  }
  card: {
    nodes: StateNodeTemplate[]
    edges: { source: string; target: string; style?: "solid" | "dashed" | "red"; label?: string; guard?: string }[]
    parallel: ParallelTemplates
  }
}

export type ParallelWorkflowNode = { id: string; label: string }
export type ParallelEdge = { source: string; target: string }
export type ConnectorStyle = "solid" | "dashed" | "dotted"
export type ParallelConnector = { source: string; target: string; style?: ConnectorStyle }

export type ParallelWorkflowTemplate = {
  id: string
  label: string
  nodes: ParallelWorkflowNode[]
  edges: ParallelEdge[]
  startConnectors?: ParallelConnector[] // connects from main workflow node ids to parallel start ids
  endConnectors?: ParallelConnector[] // connects from parallel end ids to main workflow node ids
}

export type ParallelTemplates = {
  workflows: ParallelWorkflowTemplate[]
}

// Centralized, easily editable node templates for each transaction type.
// You can rename labels or tweak badges here without touching the logic.
export const FLOW_TEMPLATES: FlowTemplates = {
  payment: {
    nodes: [
      { id: "payment-created", label: "Payment created/scheduled", category: "core", columns: ["pending"] },
      {
        id: "kyc-pending",
        label: "Pending verification document",
        badges: ["KYC"],
        category: "compliance",
        columns: ["pending"],
      },
      { id: "kyc-submitted", label: "Verification document submitted", category: "compliance", columns: ["pending"] },
      { id: "approvals-pending", label: "Awaiting approval(s)", category: "approvals", columns: ["pending"] },
      { id: "approved", label: "Approved", category: "approvals", columns: ["pending"] },
      { id: "awaiting-signatures", label: "Awaiting signatures", category: "signOff", columns: ["pending"] },
      { id: "payment-signed", label: "Payment signed off", category: "signOff", columns: ["pending"] },
      { id: "workflow-complete", label: "Workflow Complete", category: "complete", columns: ["pending", "executed", "rejected"] },
    ],
    edges: [
      { source: "payment-created", target: "pre-accounting" },
      { source: "kyc-pending", target: "kyc-submitted" },
      { source: "kyc-submitted", target: "approvals-pending" },
      { source: "approvals-pending", target: "approved" },
      { source: "approved", target: "awaiting-signatures" },
      { source: "awaiting-signatures", target: "payment-signed" },
      { source: "payment-signed", target: "workflow-complete" },
    ],
    parallel: {
      workflows: [
        {
          id: "parallel-preaccounting",
          label: "Parallel workflow #1",
          nodes: [
            { id: "parallel-pending-accounting", label: "Pending accounting details" },
            { id: "parallel-accounting-complete", label: "Accounting details complete" },
          ],
          edges: [{ source: "parallel-pending-accounting", target: "parallel-accounting-complete" }],
          startConnectors: [{ source: "payment-created", target: "parallel-pending-accounting", style: "dotted" }],
          endConnectors: [{ source: "parallel-accounting-complete", target: "workflow-complete", style: "dashed" }],
        },
        {
          id: "parallel-compliance",
          label: "Parallel workflow #2",
          nodes: [
            { id: "parallel-pending-verification", label: "Pending verification document" },
            { id: "parallel-verification-submitted", label: "Verification document submitted" },
          ],
          edges: [{ source: "parallel-pending-verification", target: "parallel-verification-submitted" }],
          startConnectors: [{ source: "payment-created", target: "parallel-pending-verification", style: "dotted" }],
          endConnectors: [{ source: "parallel-verification-submitted", target: "workflow-complete", style: "dashed" }],
        },
      ],
    },
  },
  currency: {
    nodes: [
      { id: "payment-created", label: "Exchange created/scheduled", category: "core", columns: ["pending"] },
      { id: "approvals-pending", label: "Awaiting approval(s)", category: "approvals", columns: ["pending"] },
      { id: "approved", label: "Approved", category: "approvals", columns: ["pending"] },
      { id: "workflow-complete", label: "Workflow Complete", category: "complete", columns: ["pending", "executed", "rejected"] },
    ],
    edges: [
      { source: "currency-pre-accounting", target: "approvals-pending" },
      { source: "approvals-pending", target: "approved" },
      { source: "approved", target: "workflow-complete" },
    ],
    parallel: {
      workflows: [
        {
          id: "parallel-preaccounting",
          label: "Parallel workflow #1",
          nodes: [
            { id: "parallel-pending-accounting", label: "Pending accounting details" },
            { id: "parallel-accounting-complete", label: "Accounting details complete" },
          ],
          edges: [{ source: "parallel-pending-accounting", target: "parallel-accounting-complete" }],
          startConnectors: [{ source: "payment-created", target: "parallel-pending-accounting", style: "dashed" }],
          endConnectors: [{ source: "parallel-accounting-complete", target: "workflow-complete", style: "dashed" }],
        },
      ],
    },
  },
  card: {
    nodes: [
      { id: "expense-incomplete", label: "Expense Incomplete", category: "expenseManagement", columns: ["pending", "executed"] },
      { id: "expense-complete", label: "Expense Complete", category: "expenseManagement", columns: ["pending", "executed"] },
      { id: "approvals-pending", label: "Awaiting approval(s)", category: "approvals", columns: ["pending", "executed"] },
      { id: "approved", label: "Approved", category: "approvals", columns: ["pending", "executed"] },
      { id: "workflow-complete", label: "Workflow Complete", category: "complete", columns: ["pending", "executed", "rejected"] },
    ],
    edges: [
      { source: "expense-incomplete", target: "expense-complete" },
      { source: "expense-complete", target: "approvals-pending" },
      { source: "approvals-pending", target: "approved" },
      { source: "approved", target: "workflow-complete" },
    ],
    parallel: { workflows: [] },
  },
}
