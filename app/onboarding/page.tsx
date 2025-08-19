"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { OnboardingForm } from "@/components/auth/onboarding-form"
import { useAuth } from "@/hooks/use-auth"
import { Icons } from "@/components/ui/icons"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, userProfile, loading, initialized } = useAuth()

  React.useEffect(() => {
    // 認証チェック
    if (initialized && !loading) {
      if (!user) {
        router.push("/login")
      } else if (userProfile?.onboardingCompleted) {
        // 既にオンボーディング完了している場合はホームへ
        router.push("/home")
      }
    }
  }, [user, userProfile, loading, initialized, router])

  // ローディング中の表示
  if (!initialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合は何も表示しない（リダイレクト処理中）
  if (!user) {
    return null
  }

  return (
    <div className="container relative min-h-screen flex items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto h-12 w-12" />
          <h1 className="text-2xl font-semibold tracking-tight">
            ようこそ、{userProfile?.name || user.email}さん！
          </h1>
        </div>
        <OnboardingForm />
      </div>
    </div>
  )
}