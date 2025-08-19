"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Icons } from "@/components/ui/icons"
import { useAuth } from "@/hooks/use-auth"

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

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const { userProfile, studyStreak, todaysTasks } = useAuth()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Icons.menu className="h-5 w-5" />
          <span className="sr-only">メニューを開く</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="flex items-center">
          <Icons.logo className="mr-2 h-5 w-5" />
          <span className="font-bold">A-IStudy</span>
        </div>
        <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <div
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      isActive ? "bg-accent text-accent-foreground" : "transparent"
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                    {item.href === "/schedule" && todaysTasks.length > 0 && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {todaysTasks.length}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
          
          {/* 進捗サマリー */}
          <div className="mt-8">
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
            <div className="mt-4">
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
      </SheetContent>
    </Sheet>
  )
}