"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Icons } from "@/components/ui/icons"
import { useAuth } from "@/hooks/use-auth"
import { MobileNav } from "./mobile-nav"
import { useToast } from "@/hooks/use-toast"

export function Header() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, userProfile, subscriptionStatus, logout } = useAuth()
  const { toast } = useToast()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "ログアウトしました",
        description: "またのご利用をお待ちしています",
      })
      router.push("/login")
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MobileNav />
        <div className="mr-4 hidden md:flex">
          <Link href="/home" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              A-IStudy
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* 検索バーなどを追加する場合はここに */}
          </div>
          <nav className="flex items-center space-x-2">
            {/* サブスクリプションステータス */}
            {subscriptionStatus === 'active' && (
              <div className="mr-2 hidden items-center space-x-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary md:flex">
                <Icons.zap className="h-3 w-3" />
                <span>プレミアム</span>
              </div>
            )}
            
            {/* テーマ切り替え */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              disabled={!mounted}
            >
              {mounted && theme === "light" ? (
                <Icons.moon className="h-5 w-5" />
              ) : (
                <Icons.sun className="h-5 w-5" />
              )}
              <span className="sr-only">テーマを切り替える</span>
            </Button>

            {/* ユーザーメニュー */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user?.photoURL || undefined} 
                      alt={userProfile?.name || "ユーザー"} 
                    />
                    <AvatarFallback>
                      {userProfile?.name ? getInitials(userProfile.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.name || "ユーザー"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Icons.user className="mr-2 h-4 w-4" />
                    <span>プロフィール</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={subscriptionStatus === 'active' ? '/account/subscription' : '/subscription/register'}>
                    <Icons.creditCard className="mr-2 h-4 w-4" />
                    <span>{subscriptionStatus === 'active' ? 'サブスクリプション管理' : 'プランに登録'}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Icons.settings className="mr-2 h-4 w-4" />
                    <span>設定</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <Icons.logOut className="mr-2 h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  )
}