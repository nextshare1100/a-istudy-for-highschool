'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Mail, Loader2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { useToast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ReportGeneratorProps {
  stats: any
}

export default function ReportGenerator({ stats }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generatePDFReport = async () => {
    setIsGenerating(true)
    
    try {
      const pdf = new jsPDF()
      
      // タイトル
      pdf.setFontSize(20)
      pdf.text('学習分析レポート', 20, 20)
      
      // 日付
      pdf.setFontSize(12)
      pdf.text(`作成日: ${new Date().toLocaleDateString('ja-JP')}`, 20, 30)
      
      // 統計情報
      pdf.setFontSize(14)
      pdf.text('学習統計', 20, 50)
      pdf.setFontSize(12)
      pdf.text(`本日の学習時間: ${Math.floor(stats.todayStudyTime / 60)}時間${stats.todayStudyTime % 60}分`, 30, 60)
      pdf.text(`連続学習日数: ${stats.studyStreak}日`, 30, 70)
      pdf.text(`目標達成率: ${Math.round(stats.targetAchievement)}%`, 30, 80)
      
      // グラフをキャプチャ（存在する場合）
      const chartElements = document.querySelectorAll('[data-chart]')
      let yPosition = 100
      
      for (const element of chartElements) {
        if (element instanceof HTMLElement) {
          try {
            const canvas = await html2canvas(element, {
              backgroundColor: '#ffffff',
              scale: 2
            })
            const imgData = canvas.toDataURL('image/png')
            
            // ページの残りスペースを確認
            if (yPosition + 100 > 280) {
              pdf.addPage()
              yPosition = 20
            }
            
            pdf.addImage(imgData, 'PNG', 20, yPosition, 170, 80)
            yPosition += 90
          } catch (error) {
            console.error('Chart capture error:', error)
          }
        }
      }
      
      // 新しいページを追加
      pdf.addPage()
      
      // 弱点分析
      pdf.setFontSize(14)
      pdf.text('弱点トップ5', 20, 20)
      pdf.setFontSize(12)
      
      stats.topWeaknesses.forEach((weakness: any, index: number) => {
        pdf.text(
          `${index + 1}. ${weakness.subject} - ${weakness.unit}: ${weakness.accuracy}%`,
          30,
          30 + (index * 10)
        )
      })
      
      // PDFを保存
      pdf.save(`study-report-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: 'レポート生成完了',
        description: 'PDFファイルがダウンロードされました',
      })
    } catch (error) {
      console.error('PDF生成エラー:', error)
      toast({
        title: 'エラー',
        description: 'レポートの生成に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCSVReport = () => {
    try {
      // CSVデータを作成
      const csvContent = [
        ['学習分析レポート'],
        ['作成日', new Date().toLocaleDateString('ja-JP')],
        [],
        ['本日の学習時間', `${Math.floor(stats.todayStudyTime / 60)}時間${stats.todayStudyTime % 60}分`],
        ['連続学習日数', `${stats.studyStreak}日`],
        ['目標達成率', `${Math.round(stats.targetAchievement)}%`],
        [],
        ['弱点分析'],
        ['科目', '単元', '正答率'],
        ...stats.topWeaknesses.map((w: any) => [w.subject, w.unit, `${w.accuracy}%`])
      ]
      
      // BOMを追加（Excel対応）
      const BOM = '\uFEFF'
      const csv = BOM + csvContent.map(row => row.join(',')).join('\n')
      
      // ダウンロード
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `study-report-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      toast({
        title: 'CSVエクスポート完了',
        description: 'CSVファイルがダウンロードされました',
      })
    } catch (error) {
      console.error('CSV生成エラー:', error)
      toast({
        title: 'エラー',
        description: 'CSVの生成に失敗しました',
        variant: 'destructive',
      })
    }
  }

  const sendEmailReport = async () => {
    try {
      // メール送信用のデータを準備
      const subject = `学習レポート - ${new Date().toLocaleDateString('ja-JP')}`
      const body = `
学習分析レポート

作成日: ${new Date().toLocaleDateString('ja-JP')}

【学習統計】
本日の学習時間: ${Math.floor(stats.todayStudyTime / 60)}時間${stats.todayStudyTime % 60}分
連続学習日数: ${stats.studyStreak}日
目標達成率: ${Math.round(stats.targetAchievement)}%

【弱点トップ5】
${stats.topWeaknesses.map((w: any, i: number) => 
  `${i + 1}. ${w.subject} - ${w.unit}: ${w.accuracy}%`
).join('\n')}

このメールは自動生成されました。
      `.trim()

      // メールクライアントを開く
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      toast({
        title: 'メール作成',
        description: 'メールクライアントが開きます',
      })
    } catch (error) {
      console.error('メール作成エラー:', error)
      toast({
        title: 'エラー',
        description: 'メールの作成に失敗しました',
        variant: 'destructive',
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 mr-2" />
          )}
          レポート出力
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={generatePDFReport}>
          <FileDown className="w-4 h-4 mr-2" />
          PDF形式でダウンロード
        </DropdownMenuItem>
        <DropdownMenuItem onClick={generateCSVReport}>
          <FileDown className="w-4 h-4 mr-2" />
          CSV形式でダウンロード
        </DropdownMenuItem>
        <DropdownMenuItem onClick={sendEmailReport}>
          <Mail className="w-4 h-4 mr-2" />
          メールで送信
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}