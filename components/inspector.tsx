"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { AppConfig } from "@/lib/types"

interface InspectorProps {
  element: any
  config: AppConfig
  onClose: () => void
}

export function Inspector({ element, config, onClose }: InspectorProps) {
  if (!element) return null

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Inspector</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {element.type === "state" ? "State" : "Edge"}: {element.label || element.id}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Type</div>
              <div className="text-sm capitalize">{element.type}</div>
            </div>

            {element.badges && element.badges.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Guards</div>
                <div className="flex flex-wrap gap-1">
                  {element.badges.map((badge: string) => (
                    <Badge key={badge} variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {element.source && element.target && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Flow</div>
                <div className="text-sm">
                  {element.source} → {element.target}
                </div>
              </div>
            )}

            {element.style && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Style</div>
                <div className="text-sm">
                  {element.style === "dashed" && "Bypass/Fast-track"}
                  {element.style === "red" && "Error/Rejection"}
                  {element.style === "solid" && "Required Path"}
                </div>
              </div>
            )}

            {element.guard && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Guard Condition</div>
                <Badge variant="outline" className="text-xs">
                  {element.guard}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configuration Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {element.type === "state" && (
                <div className="space-y-2">
                  <p>This state is part of the {config.lifecycle} lifecycle.</p>
                  {element.badges?.includes("AI") && <p>• AI processing enabled via preAccounting.aiReceiptScan</p>}
                  {element.badges?.includes("KYC") && <p>• Compliance review enabled via compliance.holdEnabled</p>}
                  {element.badges?.includes("Funds") && <p>• Strict funds policy requires verification</p>}
                </div>
              )}
              {element.type === "edge" && (
                <div className="space-y-2">
                  <p>
                    This transition connects {element.source} to {element.target}.
                  </p>
                  {element.style === "dashed" && <p>• Bypass edge for whitelisted vendors under threshold</p>}
                  {element.style === "red" && <p>• Rejection path returns to earlier state</p>}
                  {element.guard && <p>• Requires {element.guard} condition to proceed</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
