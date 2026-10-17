import { BarChart3, BookOpen, Home, PlusCircle, User } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { DemoBanner } from '@/components/DemoBanner'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: '讨论', icon: Home, end: true },
  { to: '/cases', label: '案例库', icon: BookOpen, end: false },
  { to: '/me', label: '我的', icon: User, end: false },
]

export function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 顶栏：手机上只保留标题，桌面端把导航也放进来 */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              矿
            </span>
            <span className="truncate text-base font-semibold sm:text-lg">
              选矿技术论坛
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
            <Link
              to="/stats"
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/stats'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
            >
              数据
            </Link>
            <Link
              to="/new"
              className="ml-2 flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4" />
              提问
            </Link>
          </nav>
        </div>
      </header>

      <DemoBanner />

      {/* 底部留白：给手机的固定底栏让位，含 iPhone 安全区 */}
      <main className="container py-4 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* 手机底栏：发帖按钮居中且突出，因为发帖是本站最重要的动作 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 items-center">
          {NAV.slice(0, 2).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2.5 text-[11px]',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}

          <NavLink to="/new" className="flex flex-col items-center gap-0.5 py-1 text-[11px] text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <PlusCircle className="h-5 w-5" />
            </span>
            提问
          </NavLink>

          <NavLink
            to="/stats"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-2.5 text-[11px]',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <BarChart3 className="h-5 w-5" />
            数据
          </NavLink>

          <NavLink
            to="/me"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-2.5 text-[11px]',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <User className="h-5 w-5" />
            我的
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
