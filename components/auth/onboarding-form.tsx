"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Icons } from "@/components/ui/icons"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

const subjects = [
  { id: "japanese", label: "国語" },
  { id: "math", label: "数学" },
  { id: "english", label: "英語" },
  { id: "science", label: "理科" },
  { id: "social", label: "社会" },
  { id: "physics", label: "物理" },
  { id: "chemistry", label: "化学" },
  { id: "biology", label: "生物" },
  { id: "earth_science", label: "地学" },
  { id: "japanese_history", label: "日本史" },
  { id: "world_history", label: "世界史" },
  { id: "geography", label: "地理" },
  { id: "civics", label: "公民" },
] as const

const formSchema = z.object({
  subjects: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "少なくとも1つの科目を選択してください",
  }),
  studyGoal: z.string().min(10, {
    message: "学習目標は10文字以上で入力してください",
  }),
  targetUniversity: z.string().optional(),
  weeklyStudyHours: z.string().min(1, {
    message: "週の学習時間を入力してください",
  }),
})

interface OnboardingFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function OnboardingForm({ className, ...props }: OnboardingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [currentStep, setCurrentStep] = React.useState(1)
  const totalSteps = 3

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjects: [],
      studyGoal: "",
      targetUniversity: "",
      weeklyStudyHours: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // TODO: Firestoreにオンボーディングデータを保存
      // await userService.updateProfile(user.uid, {
      //   subjects: values.subjects,
      //   studyGoal: values.studyGoal,
      //   targetUniversity: values.targetUniversity,
      //   weeklyStudyHours: parseInt(values.weeklyStudyHours),
      //   onboardingCompleted: true,
      // })

      toast({
        title: "設定完了",
        description: "初期設定が完了しました。学習を始めましょう！",
      })
      
      router.push("/home")
    } catch (error) {
      toast({
        title: "エラー",
        description: "設定の保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          学習プロファイルの設定
        </h1>
        <p className="text-sm text-muted-foreground">
          あなたに最適な学習プランを提供するために、
          <br />
          いくつか質問にお答えください。
        </p>
      </div>

      <Progress value={(currentStep / totalSteps) * 100} className="h-2" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="subjects"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">学習したい科目</FormLabel>
                      <FormDescription>
                        学習したい科目を全て選択してください（複数選択可）
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {subjects.map((subject) => (
                        <FormField
                          key={subject.id}
                          control={form.control}
                          name="subjects"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={subject.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(subject.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, subject.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== subject.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {subject.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                onClick={nextStep}
                className="w-full"
                disabled={form.watch("subjects").length === 0}
              >
                次へ
                <Icons.chevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="studyGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>学習目標</FormLabel>
                    <FormDescription>
                      どのような目標を持って学習したいですか？
                    </FormDescription>
                    <FormControl>
                      <textarea
                        placeholder="例：志望大学に合格するために、数学と英語の基礎を固めたい"
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetUniversity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>志望大学（任意）</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例：東京大学"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="w-full"
                >
                  <Icons.chevronLeft className="mr-2 h-4 w-4" />
                  戻る
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className="w-full"
                  disabled={form.watch("studyGoal").length < 10}
                >
                  次へ
                  <Icons.chevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="weeklyStudyHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>週の学習時間（目標）</FormLabel>
                    <FormDescription>
                      1週間に何時間程度学習したいですか？
                    </FormDescription>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="20"
                          {...field}
                        />
                        <span className="text-sm">時間</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="w-full"
                >
                  <Icons.chevronLeft className="mr-2 h-4 w-4" />
                  戻る
                </Button>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || form.watch("weeklyStudyHours").length === 0}
                >
                  {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  設定を完了
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}