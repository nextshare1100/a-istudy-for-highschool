"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { useToast } from "@/hooks/use-toast"
import { resetPassword } from "@/lib/firebase/auth"

const formSchema = z.object({
  email: z.string().email({
    message: "有効なメールアドレスを入力してください",
  }),
})

interface ResetPasswordFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ResetPasswordForm({ className, ...props }: ResetPasswordFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isSubmitted, setIsSubmitted] = React.useState<boolean>(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const result = await resetPassword(values.email)
      
      if (result.error) {
        let errorMessage = "パスワードリセットメールの送信に失敗しました"
        
        switch (result.error) {
          case "auth/user-not-found":
            errorMessage = "このメールアドレスのアカウントが見つかりません"
            break
          case "auth/invalid-email":
            errorMessage = "メールアドレスの形式が正しくありません"
            break
          case "auth/too-many-requests":
            errorMessage = "リクエストが多すぎます。しばらくしてからお試しください"
            break
          default:
            errorMessage = result.error
        }
        
        toast({
          title: "エラー",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      setIsSubmitted(true)
      toast({
        title: "メール送信完了",
        description: "パスワードリセットメールを送信しました。メールをご確認ください。",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "予期せぬエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className={cn("grid gap-6", className)} {...props}>
        <div className="flex flex-col space-y-2 text-center">
          <Icons.check className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="text-2xl font-semibold">メール送信完了</h2>
          <p className="text-sm text-muted-foreground">
            パスワードリセットメールを送信しました。
            <br />
            メールをご確認の上、記載されたリンクから
            <br />
            パスワードの再設定を行ってください。
          </p>
        </div>
        <div className="grid gap-2">
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            別のメールアドレスで試す
          </Button>
          <Link href="/login">
            <Button className="w-full" variant="default">
              ログインに戻る
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          パスワードをリセット
        </h1>
        <p className="text-sm text-muted-foreground">
          登録時のメールアドレスを入力してください。
          <br />
          パスワードリセット用のリンクをお送りします。
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>メールアドレス</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={isLoading} type="submit" className="w-full">
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            リセットメールを送信
          </Button>
        </form>
      </Form>
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="underline underline-offset-4 hover:text-primary"
        >
          ログインに戻る
        </Link>
      </p>
    </div>
  )
}