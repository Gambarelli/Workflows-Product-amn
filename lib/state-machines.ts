import type { AppConfig, StateNode, FlowEdge } from "./types"
import { FLOW_TEMPLATES, type StateNodeTemplate, type Column } from "./flows"

export function generateWorkflowStates(
  config: AppConfig,
): { nodes: StateNode[]; edges: FlowEdge[]; columnsByLabel: Record<string, Column[]> } {
  const nodes: StateNode[] = []
  const edges: FlowEdge[] = []
  let xPosition = 0
  const spacing = 200

  // 1) Select template for transaction type
  const template = FLOW_TEMPLATES[config.transactionType]

  // 1a) If all workflow configs are off, hide the entire workflow lifecycle
  const workflowEnabled = (() => {
    if (config.transactionType === "card") {
      return config.expenseManagement.enabled || config.approvals.enabled
    }
    if (config.transactionType === "currency") {
      return config.preAccounting.required || config.approvals.enabled
    }
    // payment
    return (
      config.preAccounting.required ||
      config.compliance.holdEnabled ||
      config.approvals.enabled ||
      config.payment.requireSignOff
    )
  })()

  if (!workflowEnabled) {
    return { nodes: [], edges: [], columnsByLabel: {} }
  }

  // 2) Filter nodes according to config flags
  const filtered: StateNodeTemplate[] = template.nodes.filter((t) => {
    // Expense management only for card
    if (t.category === "expenseManagement") return config.expenseManagement.enabled

    // Pre-accounting depends on type and flags
    if (t.category === "preAccounting") {
      if (config.transactionType === "payment") {
        // Skip if included in first step (handled in first label) or shown as parallel
        if (config.preAccounting.includedInFirstStep) return false
        if (config.preAccounting.notSequential) return false
        return config.preAccounting.required
      }
      if (config.transactionType === "currency") {
        // Currency never includes first step, skip if parallel
        if (config.preAccounting.notSequential) return false
        return config.preAccounting.required
      }
    }

    // Compliance depends on holdEnabled and whether it's parallel
    if (t.category === "compliance") {
      if (!config.compliance.holdEnabled) return false
      if (config.compliance.notSequential) return false
      return true
    }

    // Approvals
    if (t.category === "approvals") return config.approvals.enabled

    // Sign off
    if (t.category === "signOff") return config.payment.requireSignOff

    // Otherwise keep
    return true
  })

  // 3) Adjust first node label for payment when pre-accounting is included in first step
  const adjusted = filtered.map((t) => {
    if (
      (config.transactionType === "payment" || config.transactionType === "currency") &&
      t.category === "core" &&
      config.preAccounting.required &&
      // Treat "included in first step" as on by default when pre-accounting is required
      !config.preAccounting.notSequential
    ) {
      return { ...t, label: `${t.label} + pre-accounting step` }
    }
    return t
  })

  // 4) Build nodes in sequence
  adjusted.forEach((t) => {
    nodes.push({ id: t.label, label: t.label, position: { x: xPosition, y: 0 }, badges: t.badges })
    xPosition += spacing
  })

  // 5) Build edges defined in template, but only if both endpoints survived filtering/adjustment
  const allowedIds = new Map(adjusted.map((t) => [t.id, t.label]))
  const edgeKeys = new Set<string>()
  template.edges.forEach((e) => {
    if (allowedIds.has(e.source) && allowedIds.has(e.target)) {
      const source = allowedIds.get(e.source) as string
      const target = allowedIds.get(e.target) as string
      const key = `${source}->${target}`
      if (edgeKeys.has(key)) return
      edgeKeys.add(key)
      edges.push({
        id: `${source}-${target}`,
        source,
        target,
        label: e.label ?? "",
        style: e.style ?? "solid",
        guard: e.guard ?? "",
      })
    }
  })

  // 5b) Add fall-through sequential edges to bridge over filtered-out nodes
  for (let i = 0; i < adjusted.length - 1; i++) {
    const source = adjusted[i].label
    const target = adjusted[i + 1].label
    const key = `${source}->${target}`
    if (edgeKeys.has(key)) continue
    edgeKeys.add(key)
    edges.push({ id: `${source}-${target}`, source, target, label: "", style: "solid", guard: "" })
  }

  // 6) Expose columns mapping by final labels
  const columnsByLabel: Record<string, Column[]> = {}
  adjusted.forEach((t) => {
    columnsByLabel[t.label] = t.columns
  })

  return { nodes, edges, columnsByLabel }
}

export function generateTransactionStates(config: AppConfig): { nodes: StateNode[]; edges: FlowEdge[] } {
  const nodes: StateNode[] = []
  const edges: FlowEdge[] = []
  let xPosition = 0
  const spacing = 200

  const baseStates = ["Pending", "Executed", "Rejected"]

  // Create nodes
  baseStates.forEach((state, index) => {
    const badges: string[] = []

    nodes.push({
      id: state,
      label: state,
      position: { x: xPosition, y: 0 },
      badges,
    })

    xPosition += spacing
  })

  // Create edges - Pending can go to either Executed or Rejected
  edges.push({
    id: `${baseStates[0]}-Executed`,
    source: baseStates[0],
    target: "Executed",
    style: "solid",
    guard: "",
  })

  edges.push({
    id: `${baseStates[0]}-Rejected`,
    source: baseStates[0],
    target: "Rejected",
    style: "red",
    label: "Failed",
  })

  return { nodes, edges }
}
