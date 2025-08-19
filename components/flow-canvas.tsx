"use client"

import { useState } from "react"
import { FlowchartVisualizer } from "@/components/flowchart-visualizer"
import { Inspector } from "@/components/inspector"
import type { AppConfig } from "@/lib/types"

interface FlowCanvasProps {
  config: AppConfig
}

export function FlowCanvas({ config }: FlowCanvasProps) {
  const [selectedElement, setSelectedElement] = useState<any>(null)
  const [showInspector, setShowInspector] = useState(false)

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <FlowchartVisualizer
        config={config}
        onElementSelect={(element) => {
          setSelectedElement(element)
          setShowInspector(true)
        }}
      />

      {showInspector && (
        <div className="absolute lg:relative z-10 right-0 top-0 h-full w-full lg:w-80">
          <Inspector element={selectedElement} config={config} onClose={() => setShowInspector(false)} />
        </div>
      )}
    </div>
  )
}



