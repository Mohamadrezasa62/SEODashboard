// 'use client'

// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ThemeProvider } from 'next-themes'
// import { Toaster } from 'react-hot-toast'
// import { useState } from 'react'

// export function Providers({ children }: { children: React.ReactNode }) {
//   const [queryClient] = useState(
//     () =>
//       new QueryClient({
//         defaultOptions: {
//           queries: {
//             staleTime: 60 * 1000,
//             retry: 1,
//             refetchOnWindowFocus: false,
//           },
//         },
//       })
//   )

//   return (
//     <QueryClientProvider client={queryClient}>
//       <ThemeProvider
//         attribute="class"
//         defaultTheme="dark"
//         enableSystem
//         disableTransitionOnChange
//       >
//         {children}
//         <Toaster
//           position="top-center"
//           toastOptions={{
//             duration: 4000,
//             style: {
//               background: 'hsl(var(--card))',
//               color: 'hsl(var(--card-foreground))',
//               border: '1px solid hsl(var(--border))',
//             },
//           }}
//         />
//       </ThemeProvider>
//     </QueryClientProvider>
//   )
// }
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import { useRealTimeNotifications } from '@/lib/hooks/useRealTimeNotifications'
import { usePWA } from '@/lib/hooks/usePWA'
import { WifiOff } from 'lucide-react'

function InnerProviders({ children }: { children: React.ReactNode }) {
  useRealTimeNotifications()
  const { isOffline, isInstallable, install } = usePWA()

  return (
    <>
      {children}
      {isOffline && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm shadow-lg">
          <WifiOff className="w-4 h-4" />
          اتصال اینترنت قطع است
        </div>
      )}
      {isInstallable && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={install}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm shadow-lg hover:bg-primary/90 transition-colors"
          >
            نصب اپلیکیشن
          </button>
        </div>
      )}
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <InnerProviders>
          {children}
        </InnerProviders>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  )
}