"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Menu } from "lucide-react"
import { type AppConfig, roles } from "@/lib/types"

interface HeaderProps {
  config: AppConfig
  onConfigChange: (config: AppConfig) => void
  selectedRoleA: string
  selectedRoleB: string
  onRoleAChange: (role: string) => void
  onRoleBChange: (role: string) => void
  diffMode: boolean
  onDiffModeChange: (enabled: boolean) => void
  onReset: () => void
  onExport: () => void
  onToggleConfig?: () => void
  showConfigPanel?: boolean
}

export function Header({
  config,
  onConfigChange,
  selectedRoleA,
  selectedRoleB,
  onRoleAChange,
  onRoleBChange,
  diffMode,
  onDiffModeChange,
  onReset,
  onExport,
  onToggleConfig,
  showConfigPanel,
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
            onValueChange={(value: "card" | "payment" | "currency") =>
              onConfigChange({ ...config, transactionType: value })
            }
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
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs lg:text-sm text-gray-600">Role A:</span>
            <Select value={selectedRoleA} onValueChange={onRoleAChange}>
              <SelectTrigger className="w-24 lg:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs lg:text-sm text-gray-600">Role B:</span>
            <Select value={selectedRoleB} onValueChange={onRoleBChange}>
              <SelectTrigger className="w-24 lg:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs lg:text-sm text-gray-600">Diff:</span>
            <Switch checked={diffMode} onCheckedChange={onDiffModeChange} />
          </div>

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

      <div className="sm:hidden mt-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-gray-600">A:</span>
          <Select value={selectedRoleA} onValueChange={onRoleAChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-gray-600">B:</span>
          <Select value={selectedRoleB} onValueChange={onRoleBChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600">Diff:</span>
          <Switch checked={diffMode} onCheckedChange={onDiffModeChange} />
        </div>
      </div>
    </header>
  )
}
