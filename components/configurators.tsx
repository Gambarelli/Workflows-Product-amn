"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Menu } from "lucide-react"
import { type AppConfig } from "@/lib/types"

// Consolidated Header and ConfigPanel in one file

interface HeaderProps {
  config: AppConfig
  onConfigChange: (config: AppConfig) => void
  onReset: () => void
  onExport: () => void
  onToggleConfig?: () => void
  showConfigPanel?: boolean
}

export function Header({
  config,
  onConfigChange,
  onReset,
  onExport,
  onToggleConfig,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 lg:gap-4 min-w-0">
          {onToggleConfig && (
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={onToggleConfig}>
              <Menu className="h-4 w-4" />
            </Button>
          )}

          <h1 className="text-lg lg:text-xl font-semibold truncate">Flowchart Config Visualizer</h1>

          <Select
            value={config.transactionType}
            onValueChange={(value: "card" | "payment" | "currency") => onConfigChange({ ...config, transactionType: value })}
          >
            <SelectTrigger className="w-40 lg:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">Card Transaction</SelectItem>
              <SelectItem value="payment">Payment Transaction</SelectItem>
              <SelectItem value="currency">Currency Exchange</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 flex-wrap">

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onReset} className="hidden sm:inline-flex bg-transparent">
              Reset
            </Button>

            <Button size="sm" onClick={onExport}>
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="sm:hidden mt-3 flex items-center gap-4 text-sm"></div>
    </header>
  )
}

interface ConfigPanelProps {
  config: AppConfig
  onConfigChange: (config: AppConfig) => void
  onClose?: () => void
}

export function ConfigPanel({ config, onConfigChange, onClose }: ConfigPanelProps) {
  const updateConfig = (updates: Partial<AppConfig>) => {
    onConfigChange({ ...config, ...updates })
  }

  type NestedSection =
    | "spacing"
    | "expenseManagement"
    | "approvals"
    | "payment"
    | "preAccounting"
    | "compliance"
    | "fxConversion"
    | "reconciliation"

  const updateNestedConfig = <K extends NestedSection>(section: K, updates: Partial<AppConfig[K]>) => {
    onConfigChange({
      ...config,
      [section]: { ...(config[section] as AppConfig[K]), ...updates } as AppConfig[K],
    } as AppConfig)
  }

  return (
    <div className="w-full lg:w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Configuration</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Workflows</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.transactionType === "card" && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Expense Management</CardTitle>
                      <Switch
                        checked={config.expenseManagement.enabled}
                        onCheckedChange={(checked) => updateNestedConfig("expenseManagement", { enabled: checked })}
                      />
                    </div>
                  </CardHeader>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Approvals</CardTitle>
                    <Switch
                      checked={config.approvals.enabled}
                      onCheckedChange={(checked) => updateNestedConfig("approvals", { enabled: checked })}
                    />
                  </div>
                </CardHeader>
              </Card>

              {config.transactionType === "payment" && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">4 Eyes Verification</CardTitle>
                      <Switch
                        checked={config.payment.requireSignOff}
                        onCheckedChange={(checked) => updateNestedConfig("payment", { requireSignOff: checked })}
                      />
                    </div>
                  </CardHeader>
                </Card>
              )}

              {config.transactionType === "payment" && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Show PEER actions</CardTitle>
                      <Switch
                        checked={!!config.payment.showPeerActions}
                        onCheckedChange={(checked) =>
                          updateNestedConfig("payment", {
                            showPeerActions: checked,
                            // Also set a simple counterparty flag so gating can work without extra UI
                            counterpartyType: checked ? "PEER" : "BANK",
                          })
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Hide regular actions</CardTitle>
                      <Switch
                        checked={!!config.payment.hideRegularActions}
                        onCheckedChange={(checked) =>
                          updateNestedConfig("payment", {
                            hideRegularActions: checked,
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {(config.transactionType === "payment" || config.transactionType === "currency") && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Pre-Accounting Management</CardTitle>
                      <Switch
                        checked={config.preAccounting.required}
                        onCheckedChange={(checked) => updateNestedConfig("preAccounting", { required: checked })}
                      />
                    </div>
                  </CardHeader>
                  {config.preAccounting.required && (
                    <CardContent className="space-y-3 pt-0">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs flex-1">Show as parallel workflow</Label>
                        <Switch
                          checked={config.preAccounting.notSequential}
                          onCheckedChange={(checked) => updateNestedConfig("preAccounting", { notSequential: checked })}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {config.transactionType === "payment" && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Verification Document Compliance</CardTitle>
                      <Switch
                        checked={config.compliance.holdEnabled}
                        onCheckedChange={(checked) => updateNestedConfig("compliance", { holdEnabled: checked })}
                      />
                    </div>
                  </CardHeader>
                  {config.compliance.holdEnabled && (
                    <CardContent className="space-y-3 pt-0">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs flex-1">Show as parallel workflow</Label>
                        <Switch
                          checked={config.compliance.notSequential}
                          onCheckedChange={(checked) => updateNestedConfig("compliance", { notSequential: checked })}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-xs">Node Spacing</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={config.spacing.nodeSpacing}
                  onChange={(e) => updateNestedConfig("spacing", { nodeSpacing: Number.parseInt(e.target.value) || 300 })}
                  placeholder="300"
                  min="150"
                  max="400"
                />
                <p className="text-xs text-gray-500 mt-1">Distance between states (150-400px)</p>
              </div>
              <div className="mt-4">
                <Label className="text-xs">Zoom</Label>
                <Input
                  type="number"
                  step="0.1"
                  className="mt-1"
                  value={config.spacing.zoom ?? 1}
                  onChange={(e) =>
                    updateNestedConfig("spacing", {
                      zoom: Math.min(2, Math.max(0.5, Number.parseFloat(e.target.value) || 1)),
                    })
                  }
                  placeholder="1"
                  min="0.5"
                  max="2"
                />
                <p className="text-xs text-gray-500 mt-1">Zoom level (0.5x - 2x)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


