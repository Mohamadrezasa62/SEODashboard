import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex justify-center">
          <div className="p-6 rounded-full bg-muted">
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">اتصال اینترنت قطع است</h1>
          <p className="text-muted-foreground text-sm">
            لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید.
          </p>
        </div>
        <Button onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          تلاش مجدد
        </Button>
      </div>
    </div>
  )
}