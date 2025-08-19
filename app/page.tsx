"use client"

import { useState } from "react"
import { Header, ConfigPanel } from "@/components/configurators"
import { FlowCanvas } from "@/components/flow-canvas"
import { type AppConfig, defaultConfig } from "@/lib/types"

export default function Home() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig)
  const [showConfigPanel, setShowConfigPanel] = useState(false)

  const handleConfigChange = (newConfig: AppConfig) => {
    setConfig(newConfig)
  }

  const handleReset = () => {
    setConfig(defaultConfig)
  }

  const handleExport = () => {
    const exportData = {
      config,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "flowchart-config.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        config={config}
        onConfigChange={handleConfigChange}
        onReset={handleReset}
        onExport={handleExport}
        onToggleConfig={() => setShowConfigPanel(!showConfigPanel)}
        showConfigPanel={showConfigPanel}
      />

      <div className="flex-1 flex flex-col lg:flex-row relative">
        <div
          className={`
          ${showConfigPanel ? "block" : "hidden"} lg:block
          absolute lg:relative z-20 lg:z-auto
          w-full lg:w-80 h-full lg:h-auto
          bg-white lg:bg-transparent
        `}
        >
          <ConfigPanel config={config} onConfigChange={handleConfigChange} onClose={() => setShowConfigPanel(false)} />
        </div>

        <FlowCanvas config={config} />
      </div>
    </div>
  )
}
