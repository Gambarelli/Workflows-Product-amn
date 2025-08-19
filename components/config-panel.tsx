"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { AppConfig } from "@/lib/types"

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
                        <Label className="text-xs flex-1">Included in first step</Label>
                        <Switch
                          checked={config.preAccounting.includedInFirstStep}
                          onCheckedChange={(checked) => {
                            updateNestedConfig("preAccounting", {
                              includedInFirstStep: checked,
                              notSequential: checked ? false : config.preAccounting.notSequential,
                            })
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs flex-1">Show as parallel workflow</Label>
                        <Switch
                          checked={config.preAccounting.notSequential}
                          disabled={config.preAccounting.includedInFirstStep}
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
                  onChange={(e) =>
                    updateNestedConfig("spacing", { nodeSpacing: Number.parseInt(e.target.value) || 300 })
                  }
                  placeholder="300"
                  min="150"
                  max="400"
                />
                <p className="text-xs text-gray-500 mt-1">Distance between states (150-400px)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
