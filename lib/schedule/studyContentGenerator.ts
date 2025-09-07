// lib/schedule/studyContentGenerator.ts

import { DetailedStudyContent, StudySegment, StudyMethod, UnitStudyPattern } from '@/types/schedule'
import { CalendarEvent } from '@/types/study-plan'
import { HIGH_SCHOOL_UNITS } from '@/lib/high-school-curriculum'

export class StudyContentGenerator {
  // 単元別の学習パターン定義
  private unitPatterns: Map<string, UnitStudyPattern> = new Map()
  
  constructor() {
    this.initializeUnitPatterns()
  }
  
  // カレンダーイベントから詳細な学習内容を生成
  async generateDetailedContent(
    event: CalendarEvent,
    userLevel: number,
    weaknessAreas: string[]
  ): Promise<DetailedStudyContent> {
    const { subject, duration } = this.extractEventInfo(event)
    const unit = this.identifyUnit(subject, event.description || '')
    
    // 学習セグメントを生成
    const segments = this.createStudySegments(
      subject,
      unit,
      duration,
      userLevel,
      weaknessAreas
    )
    
    // 学習方法を決定
    const studyMethod = this.determineStudyMethod(subject, unit, userLevel)
    
    // 焦点領域を特定
    const focusAreas = this.identifyFocusAreas(subject, unit, weaknessAreas)
    
    return {
      subject,
      unit,
      date: event.date,
      duration,
      segments,
      focusAreas,
      studyMethod,
      expectedOutcome: this.generateExpectedOutcome(subject, unit, segments)
    }
  }
  
  private createStudySegments(
    subject: string,
    unit: string,
    totalMinutes: number,
    userLevel: number,
    weaknessAreas: string[]
  ): StudySegment[] {
    const segments: StudySegment[] = []
    const pattern = this.unitPatterns.get(`${subject}-${unit}`)
    
    if (!pattern) {
      // デフォルトパターン
      return this.createDefaultSegments(subject, totalMinutes)
    }
    
    let currentTime = 0
    let order = 1
    
    // 復習セグメント（15-20%）
    if (userLevel < 60) {
      const reviewTime = Math.floor(totalMinutes * 0.2)
      segments.push({
        order: order++,
        duration: reviewTime,
        topic: `${unit}の基礎確認`,
        activityType: 'review',
        description: this.getReviewDescription(subject, unit),
        difficulty: 'basic'
      })
      currentTime += reviewTime
    }
    
    // メイン学習セグメント（50-60%）
    const mainTime = Math.floor(totalMinutes * 0.5)
    segments.push({
      order: order++,
      duration: mainTime,
      topic: this.getMainTopic(subject, unit, weaknessAreas),
      activityType: 'learn',
      description: this.getMainDescription(subject, unit, userLevel),
      difficulty: userLevel < 50 ? 'basic' : userLevel < 70 ? 'standard' : 'advanced'
    })
    currentTime += mainTime
    
    // 演習セグメント（30-35%）
    const practiceTime = totalMinutes - currentTime
    segments.push({
      order: order++,
      duration: practiceTime,
      topic: `${unit}の問題演習`,
      activityType: 'practice',
      description: this.getPracticeDescription(subject, unit, userLevel),
      difficulty: userLevel < 60 ? 'standard' : 'advanced'
    })
    
    return segments
  }
  
  private determineStudyMethod(
    subject: string,
    unit: string,
    userLevel: number
  ): StudyMethod {
    // 科目と単元の特性に基づいて学習方法を決定
    const conceptSubjects = ['数学', '物理', '化学']
    const practiceSubjects = ['英語', '古文', '漢文']
    
    if (conceptSubjects.includes(subject)) {
      return {
        approach: userLevel < 50 ? 'concept-first' : 'mixed',
        techniques: [
          '定義・公式の確認',
          '例題での理解',
          '類題演習',
          'パターン認識'
        ],
        paceRecommendation: userLevel < 60 ? 'slow' : 'normal'
      }
    } else if (practiceSubjects.includes(subject)) {
      return {
        approach: 'practice-heavy',
        techniques: [
          '基本文法の確認',
          '例文暗記',
          '読解演習',
          '語彙強化'
        ],
        paceRecommendation: 'normal'
      }
    }
    
    // デフォルト
    return {
      approach: 'mixed',
      techniques: ['理解', '暗記', '演習', '復習'],
      paceRecommendation: 'normal'
    }
  }
  
  // 科目別の説明生成メソッド
  private getReviewDescription(subject: string, unit: string): string {
    const reviewTemplates: { [key: string]: string } = {
      '数学': `前回学習した${unit}の公式・定理を確認。特に基本となる概念を整理`,
      '英語': `${unit}の基本文法事項を復習。重要構文をチェック`,
      '物理': `${unit}の基本法則と公式を確認。単位と次元も含めて整理`,
      '化学': `${unit}の基本反応式と概念を復習。特に暗記事項を確認`,
      '国語': `${unit}の重要語句と読解ポイントを確認`
    }
    
    return reviewTemplates[subject] || `${unit}の基礎事項を復習`
  }
  
  private getMainDescription(subject: string, unit: string, level: number): string {
    if (subject === '数学') {
      return level < 50 
        ? `${unit}の基本概念を例題を通じて理解。公式の導出過程も確認`
        : `${unit}の標準〜応用問題に取り組む。解法パターンの習得に重点`
    } else if (subject === '英語') {
      return `${unit}の文法事項を例文とともに学習。実際の文章での使用例も確認`
    } else if (subject === '物理' || subject === '化学') {
      return `${unit}の現象・反応を理解。計算問題への応用方法も学習`
    }
    
    return `${unit}の重要事項を体系的に学習`
  }
  
  private getPracticeDescription(subject: string, unit: string, level: number): string {
    const difficulty = level < 60 ? '基礎〜標準' : '標準〜応用'
    
    return `${difficulty}レベルの問題演習。間違えた問題は解説を確認して再挑戦`
  }
  
  // その他のヘルパーメソッド
  private extractEventInfo(event: CalendarEvent): { subject: string; duration: number } {
    return {
      subject: event.subject || '',
      duration: this.calculateDuration(event.startTime, event.endTime)
    }
  }
  
  private calculateDuration(start: string, end: string): number {
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    return (endHour * 60 + endMin) - (startHour * 60 + startMin)
  }
  
  private identifyUnit(subject: string, description: string): string {
    // 説明文から単元を特定するロジック
    const units = HIGH_SCHOOL_UNITS[subject] || []
    for (const unitData of units) {
      if (description.includes(unitData.unit)) {
        return unitData.unit
      }
    }
    return '総合'
  }
  
  private identifyFocusAreas(subject: string, unit: string, weaknesses: string[]): string[] {
    const unitData = HIGH_SCHOOL_UNITS[subject]?.find(u => u.unit === unit)
    if (!unitData) return []
    
    return unitData.topics.filter(topic => 
      weaknesses.some(w => topic.includes(w) || w.includes(topic))
    )
  }
  
  private generateExpectedOutcome(subject: string, unit: string, segments: StudySegment[]): string {
    const practiceSegment = segments.find(s => s.activityType === 'practice')
    const difficulty = practiceSegment?.difficulty || 'standard'
    
    return `${unit}の${difficulty}レベルの問題を解けるようになる`
  }
  
  private createDefaultSegments(subject: string, totalMinutes: number): StudySegment[] {
    return [{
      order: 1,
      duration: totalMinutes,
      topic: `${subject}の学習`,
      activityType: 'mixed' as any,
      description: '総合的な学習',
      difficulty: 'standard'
    }]
  }
  
  private initializeUnitPatterns() {
    // 数学の二次関数の例
    this.unitPatterns.set('数学-二次関数', {
      subject: '数学',
      unit: '二次関数',
      recommendedSegments: {
        review: { percentage: 15, activityType: 'review', description: '基本形と平行移動の復習' },
        concept: { percentage: 30, activityType: 'learn', description: '最大最小の求め方' },
        practice: { percentage: 40, activityType: 'practice', description: '文章題への応用' },
        check: { percentage: 15, activityType: 'test', description: '理解度チェック' }
      },
      commonMistakes: [
        '定義域の見落とし',
        '場合分けの不足',
        '軸の位置の考慮漏れ'
      ],
      keyPoints: [
        '頂点の座標を正確に求める',
        '定義域における最大最小',
        'グラフの概形を描く習慣'
      ]
    })
    
    // 他の単元パターンも追加...
  }
  
  private getMainTopic(subject: string, unit: string, weaknesses: string[]): string {
    // 弱点領域を優先的にトピックとして選択
    const pattern = this.unitPatterns.get(`${subject}-${unit}`)
    if (pattern && weaknesses.length > 0) {
      const relevantWeakness = weaknesses.find(w => 
        pattern.keyPoints.some(kp => kp.includes(w) || w.includes(kp))
      )
      if (relevantWeakness) {
        return `${unit} - ${relevantWeakness}の克服`
      }
    }
    
    return `${unit}の重要事項`
  }
}

export default new StudyContentGenerator()
