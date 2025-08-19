// app/settings/sharing/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getSharingSettings, saveSharingSettings } from '@/lib/firebase/sharing-functions'
import { Shield, Info, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SharingSettingsPage() {
  const { user } = useAuth()
  const [studentId, setStudentId] = useState('')
  const [pin, setPin] = useState('')
  const [sharingEnabled, setSharingEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (user) {
      loadCurrentSettings()
    }
  }, [user])

  const loadCurrentSettings = async () => {
    try {
      const settings = await getSharingSettings(user!.uid)
      if (settings) {
        setStudentId(settings.studentId || '')
        setSharingEnabled(settings.sharingEnabled || false)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage(null)

    const result = await saveSharingSettings(user.uid, studentId, pin, sharingEnabled)
    
    if (result.success) {
      setMessage({ type: 'success', text: '設定を保存しました' })
      setPin('') // セキュリティのためPINをクリア
    } else {
      setMessage({ type: 'error', text: result.error || 'エラーが発生しました' })
    }
    
    setLoading(false)
  }

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">教師への成績共有設定</h1>
        <p className="text-muted-foreground mt-2">
          教師や保護者に成績情報を共有するための設定です
        </p>
      </div>

      {/* プライバシー情報 */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>プライバシー保護について</strong><br />
          成績情報（点数、正答率、科目別スコア）のみが共有されます。
          学習時間帯、学習頻度、生活リズムなどの個人的な情報は共有されません。
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>共有認証情報</CardTitle>
            <CardDescription>
              教師があなたの成績情報にアクセスするための認証情報です
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">生徒ID（英数字のみ）</Label>
              <Input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                pattern="[a-zA-Z0-9]+"
                placeholder="例: taro2024"
                required
              />
              <p className="text-sm text-muted-foreground">
                教師に伝えるIDです。覚えやすいものを設定してください。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">PIN（4〜6桁の数字）</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                pattern="[0-9]{4,6}"
                minLength={4}
                maxLength={6}
                placeholder="4〜6桁の数字"
                required
              />
              <p className="text-sm text-muted-foreground">
                セキュリティのためのPINコードです。教師と共有してください。
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="space-y-0.5">
                <Label htmlFor="sharing-enabled" className="text-base cursor-pointer">
                  教師への成績共有を有効にする
                </Label>
                <p className="text-sm text-muted-foreground">
                  この設定をONにすると、生徒IDとPINを知っている教師が成績情報を閲覧できます
                </p>
              </div>
              <Switch
                id="sharing-enabled"
                checked={sharingEnabled}
                onCheckedChange={setSharingEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* 共有される情報の詳細 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              共有される情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-700 mb-3">✓ 共有される情報</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>各科目の成績・点数</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>正答率・平均点</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>模試の結果</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>カテゴリ別の得意・不得意</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-red-700 mb-3">✗ 共有されない情報</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>学習した時間帯</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>学習頻度・パターン</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>生活リズム</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>その他の個人情報</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            '設定を保存'
          )}
        </Button>
      </form>

      {/* 使い方の説明 */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">教師への共有方法</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li>1. 上記で生徒IDとPINを設定します</li>
            <li>2. 「教師への成績共有を有効にする」をONにします</li>
            <li>3. 設定した生徒IDとPINを教師に伝えます</li>
            <li>4. 教師は専用アプリから成績情報を確認できます</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}