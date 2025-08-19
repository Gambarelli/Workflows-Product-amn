"use client"

import { getActionsForState } from "@/lib/actions"
import type { AppConfig } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ActionRowProps {
  title: string
  states: string[]
  role: string
  config: AppConfig
  className?: string
}

export function ActionRow({ title, states, role, config, className }: ActionRowProps) {
  return (
    <div className={`p-4 ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-3">{title}</div>
      <div className="flex gap-6 overflow-x-auto">
        {states.map((state, index) => {
          const actions = getActionsForState(state, role, config, config.lifecycle)

          return (
            <div key={state} className="min-w-[120px] flex-shrink-0">
              <div className="text-xs text-gray-500 mb-2 text-center">
                {state.length > 12 ? `${state.substring(0, 12)}...` : state}
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                {actions.length === 0 ? (
                  <div className="text-xs text-gray-400 italic">No actions</div>
                ) : (
                  actions.map((action) => {
                    const context = { config, lifecycle: config.lifecycle, state, role }
                    const isEnabled = action.enabled(context)
                    const tooltip = action.tooltip?.(context)

                    const button = (
                      <Button
                        key={action.key}
                        variant={isEnabled ? "default" : "secondary"}
                        size="sm"
                        className={`text-xs h-6 px-2 ${!isEnabled ? "opacity-50" : ""}`}
                        disabled={!isEnabled}
                        onClick={() => {
                          console.log(`[v0] Action clicked: ${action.key} for ${role} at ${state}`)
                        }}
                      >
                        {action.label}
                      </Button>
                    )

                    if (tooltip || !isEnabled) {
                      return (
                        <TooltipProvider key={action.key}>
                          <Tooltip>
                            <TooltipTrigger asChild>{button}</TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-48">
                                {tooltip || `Action not available for ${role} at ${state}`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    }

                    return button
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
