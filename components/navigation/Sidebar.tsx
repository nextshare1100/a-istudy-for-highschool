"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icons } from "@/components/ui/icons"
import { useAuth } from "@/hooks/use-auth"
import { Share2 } from "lucide-react"

const navItems = [
  {
    title: "ホーム",
    href: "/home",
    icon: Icons.logo,
  },
  {
    title: "学習",
    href: "/study",
    icon: Icons.bookOpen,
  },
  {
    title: "進捗",
    href: "/progress",
    icon: Icons.trendingUp,
  },
  {
    title: "スケジュール",
    href: "/schedule",
    icon: Icons.calendar,
  },
  {
    title: "設定",
    href: "/settings",
    icon: Icons.settings,
  },
]

// 設定のサブメニュー
const settingsSubItems = [
  {
    title: "共有設定",
    href: "/settings/sharing",
    icon: Share2,
    description: "教師への成績共有"
  }
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { userProfile, studyStreak, todaysTasks } = useAuth()
  const [showSettingsSubMenu, setShowSettingsSubMenu] = React.useState(false)

  React.useEffect(() => {
    // 設定関連のページにいる場合はサブメニューを表示
    setShowSettingsSubMenu(pathname.startsWith('/settings'))
  }, [pathname])

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            A-IStudy
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href === "/settings" && pathname.startsWith("/settings"))
              
              return (
                <div key={item.href}>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        if (item.href === "/settings") {
                          setShowSettingsSubMenu(!showSettingsSubMenu)
                        }
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.title}
                      {item.href === "/schedule" && todaysTasks.length > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {todaysTasks.length}
                        </span>
                      )}
                    </Button>
                  </Link>
                  
                  {/* 設定のサブメニュー */}
                  {item.href === "/settings" && showSettingsSubMenu && (
                    <div className="ml-4 mt-1 space-y-1">
                      {settingsSubItems.map((subItem) => {
                        const SubIcon = subItem.icon
                        const isSubActive = pathname === subItem.href
                        
                        return (
                          <Link key={subItem.href} href={subItem.href}>
                            <Button
                              variant={isSubActive ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-xs"
                            >
                              <SubIcon className="mr-2 h-3 w-3" />
                              {subItem.title}
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* 進捗サマリー */}
        <div className="px-3 py-2">
          <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">今日の進捗</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">連続学習日数</span>
                <span className="font-medium">
                  {studyStreak}日
                  {studyStreak >= 7 && " 🔥"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">今日のタスク</span>
                <span className="font-medium">
                  {todaysTasks.filter(t => t.completed).length}/{todaysTasks.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ユーザー情報 */}
        {userProfile && (
          <div className="px-3 py-2">
            <div className="flex items-center space-x-4 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icons.user className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userProfile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userProfile.grade === "high1" && "高校1年生"}
                  {userProfile.grade === "high2" && "高校2年生"}
                  {userProfile.grade === "high3" && "高校3年生"}
                  {userProfile.grade === "ronin" && "浪人生"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}