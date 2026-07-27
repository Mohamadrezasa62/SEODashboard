'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3, FolderOpen, Search, MessageSquare,
  Bell, FileText, Target, Brain, Settings,
  Users, Shield, Database, Activity,
  ChevronRight, LayoutDashboard, PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ROLES } from '@/lib/constants'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
  badge?: number
}

const navItems: NavItem[] = [
  { label: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
  { label: 'پروژه‌ها', href: '/projects', icon: FolderOpen },
  { label: 'SEO Analytics', href: '/seo', icon: Search },
  { label: 'فیدبک', href: '/feedback', icon: MessageSquare },
  { label: 'اعلان‌ها', href: '/notifications', icon: Bell },
  { label: 'گزارشات', href: '/reports', icon: FileText },
  { label: 'KPI', href: '/kpi', icon: Target },
  { label: 'هوش مصنوعی', href: '/ai', icon: Brain },
]

const managerItems: NavItem[] = [
  { label: 'مدیریت کاربران', href: '/users', icon: Users, roles: [ROLES.DEVELOPER, ROLES.COMPANY_MANAGER] },
]

const devItems: NavItem[] = [
  { label: 'دسترسی‌ها', href: '/rbac', icon: Shield, roles: [ROLES.DEVELOPER] },
  { label: 'مانیتورینگ', href: '/monitoring', icon: Activity, roles: [ROLES.DEVELOPER] },
  { label: 'پشتیبان‌گیری', href: '/backup', icon: Database, roles: [ROLES.DEVELOPER] },
]

const bottomItems: NavItem[] = [
  { label: 'تنظیمات', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const canSee = (roles?: string[]) => {
    if (!roles || !user) return true
    return roles.includes(user.role)
  }

  const allItems = [
    ...navItems,
    ...managerItems.filter((i) => canSee(i.roles)),
    ...devItems.filter((i) => canSee(i.roles)),
  ]

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed top-0 right-0 h-full bg-sidebar border-l border-sidebar-border',
          'flex flex-col transition-all duration-300 z-40',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-sidebar-primary-foreground" />
              </div>
              <span className="font-bold text-sidebar-foreground text-sm">SEO Dashboard</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center mx-auto">
              <BarChart3 className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
          )}
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
              onClick={toggleSidebarCollapsed}
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          )}
        </div>

        {sidebarCollapsed && (
          <div className="flex justify-center p-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
              onClick={toggleSidebarCollapsed}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {allItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-lg mx-auto',
                        'transition-colors duration-150',
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
                  'transition-colors duration-150',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-sidebar-border space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-lg mx-auto',
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg bg-sidebar-accent/50">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                {user.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user.full_name}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}