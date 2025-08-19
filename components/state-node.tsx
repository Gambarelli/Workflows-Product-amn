import { Handle, Position } from "reactflow"
import { Badge } from "@/components/ui/badge"

interface StateNodeProps {
  data: {
    label: string
    badges: string[]
  }
}

export function StateNodeComponent({ data }: StateNodeProps) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-3 min-w-[120px] shadow-sm flex items-center justify-center">
      <Handle type="target" position={Position.Left} />

      <div className="text-center">
        <div className="font-medium text-sm text-gray-900 mb-2">{data.label}</div>

        {data.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {data.badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}
