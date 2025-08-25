"use client"

import { useMemo } from "react"
import type { AppConfig } from "@/lib/types"
import { generateTransactionStates, generateWorkflowStates } from "@/lib/state-machines"
import { FLOW_TEMPLATES } from "@/lib/flows"

interface FlowchartVisualizerProps {
  config: AppConfig
  onElementSelect: (element: any) => void
}

export function FlowchartVisualizer({
  config,
  onElementSelect,
}: FlowchartVisualizerProps) {
  const { nodes: transactionNodes, edges: transactionEdges } = useMemo(() => {
    return generateTransactionStates(config)
  }, [config])

  const { nodes: workflowNodes, edges: workflowEdges, columnsByLabel } = useMemo(() => {
    return generateWorkflowStates(config)
  }, [config])

  const parallelWorkflows = useMemo(() => {
    const result: { id: string; label: string; nodes: { id: string; label: string }[] }[] = []
    const base = FLOW_TEMPLATES[config.transactionType].parallel.workflows
    base.forEach((wf) => {
      if (
        (wf.id.includes("preaccounting") && config.preAccounting.required && config.preAccounting.notSequential &&
          (config.transactionType === "payment" || config.transactionType === "currency")) ||
        (wf.id.includes("compliance") && config.compliance.holdEnabled && config.compliance.notSequential &&
          config.transactionType === "payment")
      ) {
        result.push({ id: wf.id, label: wf.label, nodes: wf.nodes })
      }
    })
    return result
  }, [config])

  // Gating + helpers for PEER pills (top-level in component scope)
  const peerEligible =
    config.transactionType === "payment" &&
    !!config.payment?.showPeerActions &&
    config.payment?.counterpartyType === "PEER"
  const hideRegularActions = config.transactionType === "payment" && !!config.payment?.hideRegularActions

  const zoom = config.spacing.zoom ?? 1
  const nodeWidth = 180 * zoom
  const labelColumnWidth = 150 * zoom
  const nodeSpacing = config.spacing.nodeSpacing * zoom

  // Extra transaction lifecycle columns for card transactions
  const extraTransactionColumns = useMemo(() => {
    if (config.transactionType !== "card") return [] as { id: string; label: string }[]
    return [
      { id: "transaction-verification", label: "Verification" },
      { id: "transaction-reverted", label: "Reverted/Refunded" },
      { id: "transaction-error", label: "Error" },
    ]
  }, [config.transactionType])

  const extraTransactionWidth = extraTransactionColumns.length > 0 ? extraTransactionColumns.length * (nodeWidth + 30) : 0

  const parallelWorkflowNodes = useMemo(() => {
    const parallelNodes: { id: string; label: string }[] = []
    parallelWorkflows.forEach((wf) => {
      parallelNodes.push(...wf.nodes)
    })
    return parallelNodes
  }, [parallelWorkflows])

  const workflowColumns = useMemo(() => {
    const columns: { [key: string]: any[] } = {
      pending: [],
      executed: [],
      rejected: [],
    }

    workflowNodes.forEach((node) => {
      const cols = columnsByLabel[node.label] || ["pending"]
      cols.forEach((col) => {
        if (col === "pending") {
          columns.pending.push(node)
        } else if (col === "executed") {
          columns.executed.push({ ...node, id: `${node.id}-executed` })
        } else if (col === "rejected") {
          columns.rejected.push({ ...node, id: `${node.id}-rejected` })
        }
      })
    })

    return columns
  }, [workflowNodes, columnsByLabel])

  const columnWidths = useMemo(() => {
    const pendingWidth = Math.max(nodeWidth, workflowColumns.pending.length * nodeSpacing)
    const executedWidth = Math.max(nodeWidth, workflowColumns.executed.length * nodeSpacing)
    const rejectedWidth = Math.max(nodeWidth, workflowColumns.rejected.length * nodeSpacing)

    return {
      pending: pendingWidth,
      executed: executedWidth,
      rejected: rejectedWidth,
    }
  }, [workflowColumns, nodeSpacing])

  const hasSquareRouting = [...transactionEdges, ...workflowEdges].some((edge) => {
    const sourceNodes = edge.source.includes("transaction") ? transactionNodes : workflowNodes
    const targetNodes = edge.target.includes("transaction") ? transactionNodes : workflowNodes
    const sourceIndex = sourceNodes.findIndex((n) => n.id === edge.source)
    const targetIndex = targetNodes.findIndex((n) => n.id === edge.target)
    return Math.abs(targetIndex - sourceIndex) > 1
  })

  const rowHeight = hasSquareRouting ? 160 : 80
  const hasParallelWorkflows = parallelWorkflows.length > 0
  const parallelRowsCount = parallelWorkflows.length
  const totalColumnsWidth = columnWidths.pending + columnWidths.executed + columnWidths.rejected
  const svgWidth = Math.max(900 * zoom, totalColumnsWidth + labelColumnWidth + 120 * zoom + extraTransactionWidth)
  const svgHeight = hasParallelWorkflows
    ? hasSquareRouting
      ? (800 + parallelRowsCount * 160) * zoom
      : (480 + parallelRowsCount * 80) * zoom
    : hasSquareRouting
      ? 800 * zoom
      : 480 * zoom

  const wrapText = (text: string, maxWidth: number) => {
    const words = text.split(" ")
    const lines = []
    let currentLine = ""

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (testLine.length * 6 <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) lines.push(currentLine)
    return lines
  }

  const calculateSquarePath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    sourceIndex: number,
    targetIndex: number,
    rowType: "transaction" | "workflow",
    offsetIndex = 0,
  ) => {
    const nodeCount = Math.abs(targetIndex - sourceIndex)

    if (nodeCount > 1) {
      const base = rowType === "transaction" ? -60 : 60
      const step = 40
      const verticalOffset = offsetIndex === 0 ? base : base + (rowType === "transaction" ? -1 : 1) * step * offsetIndex
      const midY = y1 + verticalOffset

      return `M ${x1} ${y1} L ${x1 + 20} ${y1} L ${x1 + 20} ${midY} L ${x2 - 20} ${midY} L ${x2 - 20} ${y2} L ${x2 - 6} ${y2}`
    }

    return `M ${x1} ${y1} L ${x2 - 6} ${y2}`
  }

  const getPathCenter = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    sourceIndex: number,
    targetIndex: number,
    rowType: "transaction" | "workflow",
    offsetIndex = 0,
  ) => {
    const nodeCount = Math.abs(targetIndex - sourceIndex)

    if (nodeCount > 1) {
      const base = rowType === "transaction" ? -60 : 60
      const step = 40
      const verticalOffset = offsetIndex === 0 ? base : base + (rowType === "transaction" ? -1 : 1) * step * offsetIndex
      const midY = y1 + verticalOffset
      return { x: (x1 + x2) / 2, y: midY }
    }

    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
  }

  // Helpers: compute actions for each user category (restricted per request)
  type ColumnType = "pending" | "executed" | "rejected"

  // Build PEER action labels per spec
  const peerActionsFor = (column: ColumnType, labelLower: string): string[] => {
    const out: string[] = []
    if (!peerEligible) return out
    if (column === "executed") {
      out.push("Can Copy", "Can Download PDF")
      return out
    }
    if (column === "pending") {
      if (
        labelLower.includes("pending verification document") ||
        labelLower.includes("workflow complete") ||
        labelLower.includes("awaiting signatures")
      ) {
        out.push("Can Copy")
      } else if (
        labelLower.includes("payment created/scheduled") ||
        labelLower.includes("awaiting approval")
      ) {
        out.push("Can Delete", "Can Copy")
      }
    }
    return out
  }

  // Helper to layout pills within a max width (wrap to next line when needed)
  const renderPills = (
    actions: string[],
    startX: number,
    startY: number,
    maxWidth: number,
    style: { fill: string; stroke: string; textFill: string },
  ) => {
    const pillHeight = 22
    const pillPaddingX = 10
    const gap = 8
    let cursorX = startX
    let cursorY = startY
    const elements: JSX.Element[] = []

    actions.forEach((a, idx) => {
      const approxTextWidth = Math.max(40, a.length * 6)
      const pillWidth = approxTextWidth + pillPaddingX * 2
      if (cursorX + pillWidth > startX + maxWidth) {
        // Wrap
        cursorX = startX
        cursorY += pillHeight + 6
      }
      const rectX = cursorX
      const rectY = cursorY
      elements.push(
        <g key={`pill-${a}-${idx}`}>
          <rect x={rectX} y={rectY} width={pillWidth} height={pillHeight} rx={11} fill={style.fill} stroke={style.stroke} />
          <text
            x={rectX + pillWidth / 2}
            y={rectY + pillHeight / 2 + 1}
            className="text-xs font-medium"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="system-ui"
            fill={style.textFill}
          >
            {a}
          </text>
        </g>,
      )
      cursorX += pillWidth + gap
    })

    return elements
  }

  // Styles and renderer for mixed normal + PEER pills (with badge + tooltip)
  const PEER_PILL_STYLE = {
    fill: "#dbeafe", // Peer Blue background
    stroke: "#60a5fa", // Peer Blue border
    textFill: "#1d4ed8", // Peer Blue text
    badgeFill: "#1d4ed8",
    badgeText: "#ffffff",
  }

  type PillItem = { label: string; kind?: "normal" | "peer" }

  const renderMixedPills = (
    items: PillItem[],
    startX: number,
    startY: number,
    maxWidth: number,
    styles: { normal: { fill: string; stroke: string; textFill: string }; peer: typeof PEER_PILL_STYLE },
  ) => {
    const pillHeight = 22
    const pillPaddingX = 10
    const gap = 8
    const badgeRadius = 7
    const badgeExtra = badgeRadius * 2 + 6 // circle + small spacing
    let cursorX = startX
    let cursorY = startY
    const elements: JSX.Element[] = []

    items.forEach((item, idx) => {
      const approxTextWidth = Math.max(40, item.label.length * 6)
      const extra = item.kind === "peer" ? badgeExtra : 0
      const pillWidth = approxTextWidth + pillPaddingX * 2 + extra
      if (cursorX + pillWidth > startX + maxWidth) {
        // Wrap
        cursorX = startX
        cursorY += pillHeight + 6
      }
      const rectX = cursorX
      const rectY = cursorY
      const style = item.kind === "peer" ? styles.peer : styles.normal
      elements.push(
        <g key={`mixed-pill-${item.kind ?? "normal"}-${item.label}-${idx}`} className="cursor-default">
          <rect x={rectX} y={rectY} width={pillWidth} height={pillHeight} rx={11} fill={style.fill} stroke={style.stroke} />
          {item.kind === "peer" && (
            <>
              <circle cx={rectX + 11} cy={rectY + pillHeight / 2} r={badgeRadius} fill={PEER_PILL_STYLE.badgeFill} />
              <text
                x={rectX + 11}
                y={rectY + pillHeight / 2 + 0.5}
                className="text-[10px] font-bold"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="system-ui"
                fill={PEER_PILL_STYLE.badgeText}
              >
                P
              </text>
              <title>PEER contact action</title>
            </>
          )}
          <text
            x={rectX + pillWidth / 2}
            y={rectY + pillHeight / 2 + 1}
            className="text-xs font-medium"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="system-ui"
            fill={style.textFill}
          >
            {item.label}
          </text>
        </g>,
      )
      cursorX += pillWidth + gap
    })

    return elements
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="flex-1 p-3 lg:p-6 overflow-auto max-h-[60vh] lg:max-h-[70vh]">
        <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-6 min-w-max">
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="block w-full h-auto min-w-[700px]"
            preserveAspectRatio="xMinYMin meet"
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1" />
              </pattern>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" stroke="#9ca3af" strokeWidth="1" />
              </marker>
              <marker
                id="arrowhead-red"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#ef4444" stroke="#ef4444" strokeWidth="1" />
              </marker>
              <marker
                id="arrowhead-dashed"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" stroke="#9ca3af" strokeWidth="1" />
              </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <line
              x1={labelColumnWidth + columnWidths.pending}
              y1="0"
              x2={labelColumnWidth + columnWidths.pending}
              y2={svgHeight}
              stroke="#e5e7eb"
              strokeWidth="2"
              strokeDasharray="10,5"
            />
            <line
              x1={labelColumnWidth + columnWidths.pending + columnWidths.executed}
              y1="0"
              x2={labelColumnWidth + columnWidths.pending + columnWidths.executed}
              y2={svgHeight}
              stroke="#e5e7eb"
              strokeWidth="2"
              strokeDasharray="10,5"
            />
            {config.transactionType === "card" && extraTransactionColumns.length > 0 && (
              (() => {
                const baseX =
                  labelColumnWidth + columnWidths.pending + columnWidths.executed + columnWidths.rejected + 30
                return Array.from({ length: extraTransactionColumns.length + 1 }).map((_, i) => (
                  <line
                    key={`transaction-sep-${i}`}
                    x1={baseX + i * (nodeWidth + 30)}
                    y1="0"
                    x2={baseX + i * (nodeWidth + 30)}
                    y2={svgHeight}
                    stroke="#e5e7eb"
                    strokeWidth="2"
                    strokeDasharray="10,5"
                  />
                ))
              })()
            )}

            {parallelWorkflows.map((_, index) => (
              <line
                key={`parallel-separator-${index}`}
                x1="0"
                y1={rowHeight * (2.5 + index)}
                x2={svgWidth}
                y2={rowHeight * (2.5 + index)}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            ))}

            <line
              x1="0"
              y1={rowHeight * (2.5 + parallelRowsCount)}
              x2={svgWidth}
              y2={rowHeight * (2.5 + parallelRowsCount)}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
            <line
              x1="0"
              y1={rowHeight * (3.5 + parallelRowsCount)}
              x2={svgWidth}
              y2={rowHeight * (3.5 + parallelRowsCount)}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
            <line
              x1="0"
              y1={rowHeight * (4.5 + parallelRowsCount)}
              x2={svgWidth}
              y2={rowHeight * (4.5 + parallelRowsCount)}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
            <line
              x1="0"
              y1={rowHeight * (5.5 + parallelRowsCount)}
              x2={svgWidth}
              y2={rowHeight * (5.5 + parallelRowsCount)}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="5,5"
            />

            <text x={10 * zoom} y={40 * zoom} className="text-sm fill-gray-700 font-medium" fontFamily="system-ui">
              Transaction Lifecycle
            </text>
            <text x={10 * zoom} y={rowHeight + 40 * zoom} className="text-sm fill-gray-700 font-medium" fontFamily="system-ui">
              Workflow Lifecycle
            </text>
            {parallelWorkflows.map((workflow, index) => (
              <text
                key={`parallel-label-${index}`}
                x="10"
                y={rowHeight * (2.5 + index) + 40}
                className="text-sm fill-gray-700 font-medium"
                fontFamily="system-ui"
              >
                {workflow.label}
              </text>
            ))}
            <text
              x="10"
              y={rowHeight * (2.5 + parallelRowsCount) + 40}
              className="text-sm fill-gray-700 font-medium"
              fontFamily="system-ui"
            >
              User with special rights
            </text>
            <text
              x="10"
              y={rowHeight * (3.5 + parallelRowsCount) + 40}
              className="text-sm fill-gray-700 font-medium"
              fontFamily="system-ui"
            >
              User with no special rights
            </text>

            {/* Actions row: User with special rights */}
            {(() => {
              const specialRowTop = rowHeight * (2.5 + parallelRowsCount)
              const baseY = specialRowTop + Math.max(18, rowHeight * 0.25)
              return Object.entries(workflowColumns).map(([columnType, nodes]) => {
                let columnStartX = labelColumnWidth + 30
                if (columnType === "executed") columnStartX = labelColumnWidth + columnWidths.pending + 30
                else if (columnType === "rejected") columnStartX = labelColumnWidth + columnWidths.pending + columnWidths.executed + 30

                return nodes.map((node, index) => {
                  const x = columnStartX + index * nodeSpacing
                  const cellMaxWidth = nodeSpacing - 20
                  const l = node.label.toLowerCase()
                  let actions: string[] = []
                  if (l.includes("awaiting signatures")) actions = ["Can sign payment"]
                  else if (l.includes("awaiting approval"))
                    actions = config.transactionType === "card" ? ["Can Approve"] : ["Can Approve", "Can reject"]
                  // Card-specific actions for special rights
                  if (config.transactionType === "card") {
                    if (l.includes("expense incomplete")) {
                      actions.push("Add missing expense details", "Mark as complete")
                    }
                    if (l.includes("expense complete")) {
                      actions.push("Mark as incomplete")
                    }
                    if (l.includes("awaiting approval")) {
                      actions.push("Mark as incomplete")
                    }
                  }
                  // Special rights row (payment): remove Copy/Share and Download PDF normal actions entirely
                  const normalAdds: string[] = []
                  if (config.transactionType === "payment") {
                    // no-op: do not add any normal actions for payment special-rights row
                  }
                  const uniqueActions = Array.from(new Set([...actions, ...normalAdds]))
                  const items: PillItem[] = uniqueActions.map((a) => ({ label: a, kind: "normal" }))
                  return (
                    <g key={`special-actions-${columnType}-${node.id}`}>
                      {renderMixedPills(items, x, baseY, cellMaxWidth, {
                        normal: { fill: "#ecfeff", stroke: "#67e8f9", textFill: "#0e7490" },
                        peer: PEER_PILL_STYLE,
                      })}
                    </g>
                  )
                })
              })
            })()}

            {/* Currency: extra note directly under the no-special-rights label */}
            {config.transactionType === "currency" && (() => {
              const basicRowTop = rowHeight * (3.5 + parallelRowsCount)
              const labelY = basicRowTop + 40 // baseline of label text
              const x = 10 // align with the label text inside the label cell
              // place directly below the label text inside the label cell
              const y = labelY + 12
              const maxWidth = Math.max(160, labelColumnWidth - 20)
              const items: PillItem[] = [{ label: "Pending discussion about actions", kind: "normal" }]
              return (
                <g key="currency-pending-discussions">
                  {renderMixedPills(items, x, y, maxWidth, {
                    normal: { fill: "#fef9c3", stroke: "#fde047", textFill: "#854d0e" }, // yellow pill
                    peer: PEER_PILL_STYLE,
                  })}
                </g>
              )
            })()}

            {/* Actions row: User with no special rights */}
            {(() => {
              const basicRowTop = rowHeight * (3.5 + parallelRowsCount)
              // Helpers to measure pill layout so we can vertically center per cell
              const pillHeight = 22
              const pillPaddingX = 10
              const horizontalGap = 8
              const verticalGap = 6
              const measurePillLines = (labels: string[], maxWidth: number) => {
                if (labels.length === 0) return 0
                let lines = 1
                let currentLineWidth = 0
                for (const a of labels) {
                  const approxTextWidth = Math.max(40, a.length * 6)
                  const pillWidth = approxTextWidth + pillPaddingX * 2
                  if (currentLineWidth === 0) {
                    // first pill on a new line
                    if (pillWidth > maxWidth) {
                      // still count as one line; it will overflow gracefully
                      currentLineWidth = pillWidth
                    } else {
                      currentLineWidth = pillWidth
                    }
                  } else if (currentLineWidth + horizontalGap + pillWidth > maxWidth) {
                    // wrap to next line
                    lines += 1
                    currentLineWidth = pillWidth
                  } else {
                    currentLineWidth += horizontalGap + pillWidth
                  }
                }
                return lines
              }
              const measureMixedPillLines = (items: PillItem[], maxWidth: number) => {
                if (items.length === 0) return 0
                let lines = 1
                let currentLineWidth = 0
                const badgeExtra = 14 + 6 // diameter ~14 + spacing
                for (const it of items) {
                  const approxTextWidth = Math.max(40, it.label.length * 6)
                  const pillWidth = approxTextWidth + pillPaddingX * 2 + (it.kind === "peer" ? badgeExtra : 0)
                  if (currentLineWidth === 0) {
                    if (pillWidth > maxWidth) {
                      currentLineWidth = pillWidth
                    } else {
                      currentLineWidth = pillWidth
                    }
                  } else if (currentLineWidth + horizontalGap + pillWidth > maxWidth) {
                    lines += 1
                    currentLineWidth = pillWidth
                  } else {
                    currentLineWidth += horizontalGap + pillWidth
                  }
                }
                return lines
              }
              // Map any parallel "Pending verification document" nodes to their aligned pending-column indices
              const pendingVerificationParallelIndices = (() => {
                const indices = new Set<number>()
                parallelWorkflows.forEach((workflow) => {
                  const pvIndex = workflow.nodes.findIndex((n) =>
                    n.label.toLowerCase().includes("pending verification document"),
                  )
                  if (pvIndex >= 0) {
                    const pendingColumnNodes = workflowColumns.pending.length
                    const workflowCompleteIndex = workflowColumns.pending.findIndex(
                      (n) => n.label === "Workflow Complete",
                    )
                    // Position parallel nodes starting from 2 positions before Workflow Complete (same logic as render)
                    const startOffset =
                      workflowCompleteIndex > 0
                        ? Math.max(workflowCompleteIndex - 2, 0)
                        : Math.max(pendingColumnNodes - 2, 0)
                    indices.add(startOffset + pvIndex)
                  }
                })
                return indices
              })()
              // Map any parallel "Pending accounting details" nodes to their aligned pending-column indices
              const pendingAccountingParallelIndices = (() => {
                const indices = new Set<number>()
                parallelWorkflows.forEach((workflow) => {
                  const paIndex = workflow.nodes.findIndex((n) =>
                    n.label.toLowerCase().includes("pending accounting details"),
                  )
                  if (paIndex >= 0) {
                    const pendingColumnNodes = workflowColumns.pending.length
                    const workflowCompleteIndex = workflowColumns.pending.findIndex(
                      (n) => n.label === "Workflow Complete",
                    )
                    const startOffset =
                      workflowCompleteIndex > 0
                        ? Math.max(workflowCompleteIndex - 2, 0)
                        : Math.max(pendingColumnNodes - 2, 0)
                    indices.add(startOffset + paIndex)
                  }
                })
                return indices
              })()
              return Object.entries(workflowColumns).map(([columnType, nodes]) => {
                let columnStartX = labelColumnWidth + 30
                if (columnType === "executed") columnStartX = labelColumnWidth + columnWidths.pending + 30
                else if (columnType === "rejected") columnStartX = labelColumnWidth + columnWidths.pending + columnWidths.executed + 30

                return nodes.map((node, index) => {
                  const x = columnStartX + index * nodeSpacing
                  const cellMaxWidth = nodeSpacing - 20
                  const l = node.label.toLowerCase()
                  const awaiting = l.includes("awaiting approval")
                  const currencyAwaiting = awaiting && config.transactionType === "currency"
                  const suppressAllForAwaiting = false
                  const actions: string[] = []
                  if (l.includes("pending verification document")) actions.push("Can upload document")
                  if ((columnType as ColumnType) === "pending" && pendingVerificationParallelIndices.has(index)) {
                    actions.push("Can upload document")
                  }
                  // Payment created/scheduled -> base set of actions
                  if (l.includes("payment created/scheduled")) {
                    actions.push("Can Delete", "Can copy", "Can Edit", "Can share")
                  }
                  // Awaiting approvals -> same as previous + reminder
                  if (l.includes("awaiting approval")) {
                    if (config.transactionType === "card") {
                      // Card: only reminder for no special rights
                      actions.push("Can Send approval reminders")
                    } else {
                      actions.push(
                        "Can Delete",
                        "Can copy",
                        "Can Edit",
                        "Can share",
                        "Can Send approval reminders",
                      )
                    }
                  }
                  // Card: Expense Incomplete -> both users can add missing details
                  if (config.transactionType === "card" && l.includes("expense incomplete")) {
                    actions.push("Add missing expense details")
                  }
                  // Parallel: Pending accounting details -> add missing field details (aligned to pending indices)
                  if ((columnType as ColumnType) === "pending" && pendingAccountingParallelIndices.has(index)) {
                    actions.push("Can add missing accounting field details")
                  }
                  // Add normal action pills per spec (payment)
                  const normalAdds: string[] = []
                  if (config.transactionType === "payment") {
                    if ((columnType as ColumnType) === "executed") {
                      normalAdds.push("Copy", "share", "Download PDF")
                    } else if ((columnType as ColumnType) === "pending") {
                      if (
                        l.includes("awaiting signatures") ||
                        l.includes("pending verification document") ||
                        l.includes("workflow complete")
                      ) {
                        normalAdds.push("Copy", "share")
                      }
                    }
                  }
                  let uniqueActions: string[] = []
                  if (suppressAllForAwaiting) {
                    uniqueActions = []
                  } else if (currencyAwaiting) {
                    // Only keep reminder for currency awaiting approval
                    uniqueActions = ["Can Send approval reminders"]
                  } else {
                    uniqueActions = Array.from(new Set([...actions, ...normalAdds]))
                  }
                  let items: PillItem[] = hideRegularActions
                    ? []
                    : uniqueActions.map((a) => ({ label: a, kind: "normal" }))
                  // Add PEER action pills per spec (skip entirely if suppressing)
                  if (!suppressAllForAwaiting && !currencyAwaiting) {
                    peerActionsFor(columnType as ColumnType, l).forEach((pa) =>
                      items.push({ label: pa, kind: "peer" }),
                    )
                  }
                  // Compute vertical centering for this cell based on number of pill lines
                  const lines = measureMixedPillLines(items, cellMaxWidth)
                  const totalHeight = lines > 0 ? lines * pillHeight + (lines - 1) * verticalGap : 0
                  const startY = lines > 0 ? basicRowTop + (rowHeight - totalHeight) / 2 : basicRowTop + rowHeight / 2 - pillHeight / 2
                  return (
                    <g key={`basic-actions-${columnType}-${node.id}`}>
                      {renderMixedPills(items, x, startY, cellMaxWidth, {
                        normal: { fill: "#f3f4f6", stroke: "#e5e7eb", textFill: "#374151" },
                        peer: PEER_PILL_STYLE,
                      })}
                    </g>
                  )
                })
              })
            })()}

            {transactionNodes.map((node, index) => {
              const labelLines = wrapText(node.label, nodeWidth - 20)
              const rawBadges = node.badges ?? []
              const badgesToMove = ["Verification", "Reverted/Refunded", "Error"]
              const displayBadges = config.transactionType === "card" ? rawBadges.filter((b) => !badgesToMove.includes(b)) : rawBadges
              const badgeText = displayBadges.join(", ")
              const badgeLines = badgeText ? wrapText(badgeText, nodeWidth - 20) : []

              let x = labelColumnWidth + 30
              let width = nodeWidth

              if (index === 0) {
                // Pending
                width = columnWidths.pending - 60
              } else if (index === 1) {
                // Executed
                x = labelColumnWidth + columnWidths.pending + 30
                width = columnWidths.executed - 60
              } else if (index === 2) {
                // Rejected
                x = labelColumnWidth + columnWidths.pending + columnWidths.executed + 30
                width = columnWidths.rejected - 60
              }

              const rectY = 20
              const rectHeight = 50
              const totalTextHeight = labelLines.length * 12 + badgeLines.length * 10
              const startY = rectY + (rectHeight - totalTextHeight) / 2 + 12

              return (
                <g
                  key={`transaction-${node.id}`}
                  className="cursor-pointer"
                  onClick={() => onElementSelect({ type: "transaction-state", ...node })}
                >
                  <rect
                    x={x}
                    y={rectY}
                    width={width}
                    height={rectHeight}
                    fill="white"
                    stroke="#d1d5db"
                    strokeWidth="2"
                    rx="8"
                    className="hover:stroke-blue-500 transition-colors"
                  />
                  {labelLines.map((line, lineIndex) => (
                    <text
                      key={`transaction-label-${lineIndex}`}
                      x={x + width / 2}
                      y={startY + lineIndex * 12}
                      className="text-xs lg:text-sm fill-gray-900 font-medium"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="system-ui"
                    >
                      {line}
                    </text>
                  ))}
                  {badgeLines.map((line, lineIndex) => (
                    <text
                      key={`transaction-badge-${lineIndex}`}
                      x={x + width / 2}
                      y={startY + labelLines.length * 12 + lineIndex * 10}
                      className="text-xs fill-gray-600"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="system-ui"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              )
            })}

            {config.transactionType === "card" &&
              extraTransactionColumns.map((node, idx) => {
                const labelLines = wrapText(node.label, nodeWidth - 20)

                // Position extra transaction columns to the right of the three main columns
                const x =
                  labelColumnWidth +
                  columnWidths.pending +
                  columnWidths.executed +
                  columnWidths.rejected +
                  30 +
                  idx * (nodeWidth + 30)

                const rectY = 20
                const rectHeight = 50
                const totalTextHeight = labelLines.length * 12
                const startY = rectY + (rectHeight - totalTextHeight) / 2 + 12

                return (
                  <g
                    key={`transaction-extra-${node.id}`}
                    className="cursor-pointer"
                    onClick={() => onElementSelect({ type: "transaction-state", ...node })}
                  >
                    <rect
                      x={x}
                      y={rectY}
                      width={nodeWidth}
                      height={rectHeight}
                      fill="white"
                      stroke="#d1d5db"
                      strokeWidth="2"
                      rx="8"
                      className="hover:stroke-blue-500 transition-colors"
                    />
                    {labelLines.map((line, lineIndex) => (
                      <text
                        key={`transaction-extra-label-${lineIndex}`}
                        x={x + nodeWidth / 2}
                        y={startY + lineIndex * 12}
                        className="text-xs lg:text-sm fill-gray-900 font-medium"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily="system-ui"
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                )
              })}

            {Object.entries(workflowColumns).map(([columnType, nodes]) => {
              let columnStartX = labelColumnWidth + 30

              if (columnType === "executed") {
                columnStartX = labelColumnWidth + columnWidths.pending + 30
              } else if (columnType === "rejected") {
                columnStartX = labelColumnWidth + columnWidths.pending + columnWidths.executed + 30
              }

              return nodes.map((node, index) => {
                const labelLines = wrapText(node.label, nodeWidth - 20)
                const badgeText = node.badges?.join(", ") || ""
                const badgeLines = badgeText ? wrapText(badgeText, nodeWidth - 20) : []
                const x = columnStartX + index * nodeSpacing

                const rectY = rowHeight + 20
                const rectHeight = 50
                const totalTextHeight = labelLines.length * 12 + badgeLines.length * 10
                const startY = rectY + (rectHeight - totalTextHeight) / 2 + 12

                return (
                  <g
                    key={`workflow-${node.id}-${columnType}`}
                    className="cursor-pointer"
                    onClick={() => onElementSelect({ type: "workflow-state", ...node })}
                  >
                    <rect
                      x={x}
                      y={rectY}
                      width={nodeWidth}
                      height={rectHeight}
                      fill="#f0f9ff"
                      stroke="#0ea5e9"
                      strokeWidth="2"
                      rx="8"
                      className="hover:stroke-blue-600 transition-colors"
                    />
                    {labelLines.map((line, lineIndex) => (
                      <text
                        key={`workflow-label-${lineIndex}`}
                        x={x + nodeWidth / 2}
                        y={startY + lineIndex * 12}
                        className="text-xs lg:text-sm fill-sky-900 font-medium"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily="system-ui"
                      >
                        {line}
                      </text>
                    ))}
                    {badgeLines.map((line, lineIndex) => (
                      <text
                        key={`workflow-badge-${lineIndex}`}
                        x={x + nodeWidth / 2}
                        y={startY + labelLines.length * 12 + lineIndex * 10}
                        className="text-xs fill-sky-700"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily="system-ui"
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                )
              })
            })}

            {workflowEdges.map((edge, edgeIndex) => {
              let sourceColumnType = "pending"
              let targetColumnType = "pending"
              let sourceIndexInColumn = -1
              let targetIndexInColumn = -1
              let sourceX = labelColumnWidth + 30
              let targetX = labelColumnWidth + 30

              const arrows = []

              if (config.transactionType === "card") {
                // Create arrows for pending column
                const pendingSourceIndex = workflowColumns.pending.findIndex((n) => n.id === edge.source)
                const pendingTargetIndex = workflowColumns.pending.findIndex((n) => n.id === edge.target)

                // Create arrows for executed column
                const executedSourceIndex = workflowColumns.executed.findIndex(
                  (n) => n.id === `${edge.source}-executed`,
                )
                const executedTargetIndex = workflowColumns.executed.findIndex(
                  (n) => n.id === `${edge.target}-executed`,
                )

                // Add arrow for pending column if both nodes exist
                if (pendingSourceIndex !== -1 && pendingTargetIndex !== -1) {
                  arrows.push({
                    sourceIndex: pendingSourceIndex,
                    targetIndex: pendingTargetIndex,
                    sourceX: labelColumnWidth + 30,
                    targetX: labelColumnWidth + 30,
                    columnType: "pending",
                  })
                }

                // Add arrow for executed column if both nodes exist
                if (executedSourceIndex !== -1 && executedTargetIndex !== -1) {
                  arrows.push({
                    sourceIndex: executedSourceIndex,
                    targetIndex: executedTargetIndex,
                    sourceX: labelColumnWidth + columnWidths.pending + 30,
                    targetX: labelColumnWidth + columnWidths.pending + 30,
                    columnType: "executed",
                  })
                }
              } else {
                // Original logic for payment and currency exchange transactions
                // Find source node column and index
                Object.entries(workflowColumns).forEach(([columnType, nodes]) => {
                  const nodeIndex = nodes.findIndex((n) => n.id === edge.source)
                  if (nodeIndex !== -1) {
                    sourceColumnType = columnType
                    sourceIndexInColumn = nodeIndex
                    if (columnType === "executed") {
                      sourceX = labelColumnWidth + columnWidths.pending + 30
                    } else if (columnType === "rejected") {
                      sourceX = labelColumnWidth + columnWidths.pending + columnWidths.executed + 30
                    }
                  }
                })

                // Find target node column and index
                Object.entries(workflowColumns).forEach(([columnType, nodes]) => {
                  const nodeIndex = nodes.findIndex((n) => n.id === edge.target)
                  if (nodeIndex !== -1) {
                    targetColumnType = columnType
                    targetIndexInColumn = nodeIndex
                    if (columnType === "executed") {
                      targetX = labelColumnWidth + columnWidths.pending + 30
                    } else if (columnType === "rejected") {
                      targetX = labelColumnWidth + columnWidths.pending + columnWidths.executed + 30
                    }
                  }
                })

                if (sourceIndexInColumn !== -1 && targetIndexInColumn !== -1) {
                  arrows.push({
                    sourceIndex: sourceIndexInColumn,
                    targetIndex: targetIndexInColumn,
                    sourceX: sourceX,
                    targetX: targetX,
                    columnType: sourceColumnType,
                  })
                }
              }

              // Group arrows by source to offset multi-target connections
              const arrowsBySource: Record<string, typeof arrows> = {}
              arrows.forEach((a) => {
                const key = `${a.columnType}:${a.sourceIndex}`
                if (!arrowsBySource[key]) arrowsBySource[key] = []
                arrowsBySource[key].push(a)
              })

              const expandedArrows: Array<typeof arrows[number] & { offsetIndex: number }> = []
              Object.values(arrowsBySource).forEach((group) => {
                group.forEach((a, idx) => expandedArrows.push({ ...a, offsetIndex: idx }))
              })

              return expandedArrows.map((arrow, arrowIndex) => {
                const x1 = arrow.sourceX + arrow.sourceIndex * nodeSpacing + nodeWidth
                const y1 = rowHeight + 45
                const x2 = arrow.targetX + arrow.targetIndex * nodeSpacing
                const y2 = rowHeight + 45

                const strokeColor = edge.style === "red" ? "#ef4444" : "#9ca3af"
                const strokeDasharray = edge.style === "dashed" ? "6,3" : undefined
                const markerEnd =
                  edge.style === "red"
                    ? "url(#arrowhead-red)"
                    : edge.style === "dashed"
                      ? "url(#arrowhead-dashed)"
                      : "url(#arrowhead)"

                const pathData = calculateSquarePath(
                  x1,
                  y1,
                  x2,
                  y2,
                  arrow.sourceIndex,
                  arrow.targetIndex,
                  "workflow",
                  arrow.offsetIndex,
                )
                const pathCenter = getPathCenter(
                  x1,
                  y1,
                  x2,
                  y2,
                  arrow.sourceIndex,
                  arrow.targetIndex,
                  "workflow",
                  arrow.offsetIndex,
                )

                return (
                  <g key={`${edge.id}-${arrow.columnType}-${arrowIndex}`}>
                    <path
                      d={pathData}
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      strokeDasharray={strokeDasharray}
                      markerEnd={markerEnd}
                      fill="none"
                      className="cursor-pointer hover:stroke-blue-500 transition-colors"
                      onClick={() => onElementSelect({ type: "edge", ...edge })}
                    />
                    {edge.label && (
                      <g>
                        <rect
                          x={pathCenter.x - Math.max(30, edge.label.length * 4)}
                          y={pathCenter.y - 10}
                          width={Math.max(60, edge.label.length * 8)}
                          height="18"
                          fill="white"
                          stroke="#e5e7eb"
                          strokeWidth="1"
                          rx="4"
                        />
                        <text
                          x={pathCenter.x}
                          y={pathCenter.y}
                          className="text-xs fill-gray-700 font-medium"
                          textAnchor="middle"
                          fontFamily="system-ui"
                        >
                          {edge.label}
                        </text>
                      </g>
                    )}
                    {edge.guard && (
                      <g>
                        <rect
                          x={pathCenter.x - Math.max(35, edge.guard.length * 5)}
                          y={pathCenter.y + 8}
                          width={Math.max(70, edge.guard.length * 10)}
                          height="22"
                          fill="#fef3c7"
                          stroke="#f59e0b"
                          strokeWidth="1"
                          rx="11"
                          className="cursor-pointer"
                        />
                        <text
                          x={pathCenter.x}
                          y={pathCenter.y + 22}
                          className="text-xs fill-white font-medium"
                          textAnchor="middle"
                          fontFamily="system-ui"
                        >
                          {edge.guard}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })
            })}

            {/* Add arrows from last main workflow node to Workflow Complete */}
            {(() => {
              // Find the last node in the pending column (excluding Workflow Complete)
              const pendingNodes = workflowColumns.pending.filter(n => n.label !== "Workflow Complete")
              if (pendingNodes.length === 0) return null
              
              const lastPendingNode = pendingNodes[pendingNodes.length - 1]
              const lastPendingIndex = workflowColumns.pending.findIndex(n => n.id === lastPendingNode.id)
              const workflowCompleteIndex = workflowColumns.pending.findIndex(n => n.label === "Workflow Complete")
              
              if (lastPendingIndex === -1 || workflowCompleteIndex === -1) return null
              
              const x1 = labelColumnWidth + 30 + lastPendingIndex * nodeSpacing + nodeWidth
              const y1 = rowHeight + 45
              const x2 = labelColumnWidth + 30 + workflowCompleteIndex * nodeSpacing
              const y2 = rowHeight + 45
              
              return (
                <g key="last-to-complete">
                  <path
                    d={`M ${x1} ${y1} L ${x2} ${y2}`}
                    stroke="#0ea5e9"
                    strokeWidth="1.5"
                    markerEnd="url(#arrowhead)"
                    fill="none"
                    className="cursor-pointer hover:stroke-blue-600 transition-colors"
                  />
                </g>
              )
            })()}

            {parallelWorkflows.map((workflow, workflowIndex) => (
              <g key={`parallel-workflow-${workflowIndex}`}>
                {workflow.nodes.map((node, nodeIndex) => {
                  const labelLines = wrapText(node.label, nodeWidth - 20)
                  // Position nodes one step before Workflow Complete
                  const pendingColumnNodes = workflowColumns.pending.length
                  const workflowCompleteIndex = workflowColumns.pending.findIndex(n => n.label === "Workflow Complete")
                  // Position parallel nodes starting from 2 positions before Workflow Complete
                  const startOffset = workflowCompleteIndex > 0 ? Math.max(workflowCompleteIndex - 2, 0) : Math.max(pendingColumnNodes - 2, 0)
                  const x = labelColumnWidth + 30 + (startOffset + nodeIndex) * nodeSpacing

                  const rectY = rowHeight * (2.5 + workflowIndex) + 20
                  const rectHeight = 50
                  const totalTextHeight = labelLines.length * 12
                  const startY = rectY + (rectHeight - totalTextHeight) / 2 + 12

                  return (
                    <g
                      key={`parallel-${node.id}`}
                      className="cursor-pointer"
                      onClick={() => onElementSelect({ type: "parallel-workflow-state", ...node })}
                    >
                      <rect
                        x={x}
                        y={rectY}
                        width={nodeWidth}
                        height={rectHeight}
                        fill="#fef3c7"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        rx="8"
                        className="hover:stroke-amber-600 transition-colors"
                      />
                      {labelLines.map((line, lineIndex) => (
                        <text
                          key={`parallel-label-${lineIndex}`}
                          x={x + nodeWidth / 2}
                          y={startY + lineIndex * 12}
                          className="text-xs lg:text-sm fill-amber-900 font-medium"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontFamily="system-ui"
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  )
                })}

                {workflow.nodes.length >= 2 && (
                  <g>
                    {FLOW_TEMPLATES[config.transactionType].parallel.workflows
                      .find((w) => w.id === workflow.id)?.edges.map((e, pairIndex) => {
                      const sourceIndex = workflow.nodes.findIndex((n) => n.id === e.source)
                      const targetIndex = workflow.nodes.findIndex((n) => n.id === e.target)
                      if (sourceIndex === -1 || targetIndex === -1) return null
                      const workflowCompleteIndex = workflowColumns.pending.findIndex(n => n.label === "Workflow Complete")
                      // Position parallel arrows starting from 2 positions before Workflow Complete
                      const startOffset = workflowCompleteIndex > 0 ? Math.max(workflowCompleteIndex - 2, 0) : Math.max(workflowColumns.pending.length - 2, 0)

                      const x1 = labelColumnWidth + 30 + (startOffset + sourceIndex) * nodeSpacing + nodeWidth
                      const y1 = rowHeight * (2.5 + workflowIndex) + 45
                      const x2 = labelColumnWidth + 30 + (startOffset + targetIndex) * nodeSpacing
                      const y2 = rowHeight * (2.5 + workflowIndex) + 45

                      return (
                        <path
                          key={`parallel-arrow-${pairIndex}`}
                          d={`M ${x1} ${y1} L ${x2 - 6} ${y2}`}
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          markerEnd="url(#arrowhead)"
                          fill="none"
                          className="cursor-pointer hover:stroke-amber-600 transition-colors"
                        />
                      )
                    })}
                  </g>
                )}

                {/* Connect final parallel workflow nodes to Workflow Complete */}
                {workflow.nodes.length > 0 && (
                  <g>
                    {FLOW_TEMPLATES[config.transactionType].parallel.workflows
                      .find((w) => w.id === workflow.id)?.endConnectors?.map((c, idx) => {
                      const workflowCompleteIndex = workflowColumns.pending.findIndex(n => n.label === "Workflow Complete")
                      const startOffset = workflowCompleteIndex > 0 ? Math.max(workflowCompleteIndex - 2, 0) : Math.max(workflowColumns.pending.length - 2, 0)
                      const sourceIndex = workflow.nodes.findIndex((n) => n.id === c.source)
                      if (sourceIndex === -1) return null
                      const x1 = labelColumnWidth + 30 + (startOffset + sourceIndex) * nodeSpacing + nodeWidth
                      const y1 = rowHeight * (2.5 + workflowIndex) + 45
                      const x2 = labelColumnWidth + 30 + workflowCompleteIndex * nodeSpacing
                      const y2 = rowHeight + 45
                      const dash = c.style === "dotted" ? "3,3" : c.style === "dashed" ? "5,5" : undefined
                      return (
                        <path
                          key={`parallel-to-complete-${workflowIndex}-${idx}`}
                          d={`M ${x1} ${y1} L ${x1 + 20} ${y1} L ${x1 + 20} ${(y1 + y2) / 2} L ${x2 - 20} ${(y1 + y2) / 2} L ${x2 - 20} ${y2} L ${x2} ${y2}`}
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          markerEnd="url(#arrowhead)"
                          fill="none"
                          className="cursor-pointer hover:stroke-amber-600 transition-colors"
                          strokeDasharray={dash}
                        />
                      )
                    })}
                  </g>
                )}

                {/* Connect "Payment created/scheduled" to parallel workflows */}
                {workflow.nodes.length > 0 && (
                  <g>
                    {FLOW_TEMPLATES[config.transactionType].parallel.workflows
                      .find((w) => w.id === workflow.id)?.startConnectors?.map((c, idx) => {
                      // Determine source index: for payment, anchor at payment-created label; otherwise, first pending node
                      let sourceIndex = -1
                      if (config.transactionType === "payment") {
                        sourceIndex = workflowColumns.pending.findIndex(n => 
                          n.label === "Payment created/scheduled" || n.label === "Payment created/scheduled + pre-accounting step"
                        )
                      }
                      if (sourceIndex === -1) {
                        const firstPending = workflowColumns.pending.findIndex(n => n.label !== "Workflow Complete")
                        sourceIndex = firstPending
                      }
                      if (sourceIndex === -1) return null
                      const workflowCompleteIndex = workflowColumns.pending.findIndex(n => n.label === "Workflow Complete")
                      const startOffset = workflowCompleteIndex > 0 ? Math.max(workflowCompleteIndex - 2, 0) : Math.max(workflowColumns.pending.length - 2, 0)
                      const targetIndex = workflow.nodes.findIndex((n) => n.id === c.target)
                      if (targetIndex === -1) return null
                      const x1 = labelColumnWidth + 30 + sourceIndex * nodeSpacing + nodeWidth
                      const y1 = rowHeight + 45
                      const x2 = labelColumnWidth + 30 + (startOffset + targetIndex) * nodeSpacing
                      const y2 = rowHeight * (2.5 + workflowIndex) + 45
                      const dash = c.style === "dotted" ? "3,3" : c.style === "dashed" ? "5,5" : undefined
                      return (
                        <path
                          key={`payment-to-parallel-${workflowIndex}-${idx}`}
                          d={`M ${x1} ${y1} L ${x1 + 20} ${y1} L ${x1 + 20} ${(y1 + y2) / 2} L ${x2 - 20} ${(y1 + y2) / 2} L ${x2 - 20} ${y2} L ${x2} ${y2}`}
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          markerEnd="url(#arrowhead)"
                          fill="none"
                          className="cursor-pointer hover:stroke-amber-600 transition-colors"
                          strokeDasharray={dash}
                        />
                      )
                    })}
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  )
}
