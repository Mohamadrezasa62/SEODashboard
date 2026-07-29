'use client'

import { useRouter } from 'next/navigation'
import { Bell, Moon, Sun, LogOut, User, ChevronDown, Download } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { usePWA } from '@/lib/hooks/usePWA'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/store/authStore'
import { ROLE_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'
import { NotificationPanel } from '@/components/shared/NotificationPanel'
import { useState } from 'react'

export function Header() {
  const router = useRouter()
  const { user } = useAuth()
  const { logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const { unreadCount } = useNotifications()
  const { isInstallable, install } = usePWA()
  const [notifOpen, setNotifOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      logout()
      router.push('/login')
      toast.success('با موفقیت خارج شدید')
    }
  }

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30 flex items-center px-6 gap-4">
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {isInstallable && (
          <Button
            variant="outline"
            size="sm"
            onClick={install}
            className="hidden sm:flex items-center gap-2 h-8 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            نصب اپ
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9"
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="w-4 h-4 absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-4 text-xs px-1 flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-3">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {user.full_name.charAt(0)}
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium leading-none">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <User className="w-4 h-4 ml-2" />
                پروفایل و تنظیمات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 ml-2" />
                خروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}