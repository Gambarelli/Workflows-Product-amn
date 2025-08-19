import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function Legend() {
  return (
    <footer className="bg-white border-t border-gray-200 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-medium mb-2">Edge Styles</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-gray-800"></div>
                  <span>Required path</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-gray-500 border-dashed border-t"></div>
                  <span>Bypass/fast-track</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-red-500"></div>
                  <span>Error/reject</span>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-2">State Badges</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    AI
                  </Badge>
                  <span>AI processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    KYC
                  </Badge>
                  <span>Compliance check</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Funds
                  </Badge>
                  <span>Funds verification</span>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-2">Action Pills</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Available action</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded opacity-50"></div>
                  <span>Disabled action</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </footer>
  )
}
