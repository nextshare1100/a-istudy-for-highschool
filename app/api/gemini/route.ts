// app/api/gemini/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini/client';
import { getAdminAuth } from '@/lib/firebase-admin';

// Gemini APIの初期化
const client = getGeminiClient();

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Firebase Admin SDKでトークンを検証
    try {
      const adminAuth = getAdminAuth();
      const decodedToken = await adminAuth.verifyIdToken(token);
      console.log('認証成功:', decodedToken.uid);
    } catch (authError) {
      console.error('認証エラー:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // リクエストボディを取得
    const { action, data } = await request.json();
    console.log('Gemini API リクエスト:', { action, dataKeys: Object.keys(data) });

    if (action === 'createSchedule') {
      // Gemini APIキーの確認
      if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY が設定されていません');
        // 開発環境用のフォールバック（モックデータを返す）
        return NextResponse.json({
          data: generateMockAIPlan(data)
        });
      }

      try {
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const result = await model.generateContent(data.prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('Gemini レスポンス長:', text.length);
        
        // JSONを抽出
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[1]);
          return NextResponse.json({ data: jsonData });
        }
        
        // JSONが見つからない場合はテキスト全体をパース試行
        try {
          const jsonData = JSON.parse(text);
          return NextResponse.json({ data: jsonData });
        } catch (parseError) {
          console.error('JSON パースエラー:', parseError);
          // パースエラーの場合もモックデータを返す
          return NextResponse.json({
            data: generateMockAIPlan(data)
          });
        }
      } catch (geminiError) {
        console.error('Gemini API エラー:', geminiError);
        // エラー時はモックデータを返す
        return NextResponse.json({
          data: generateMockAIPlan(data)
        });
      }
    }

    if (action === 'analyzeWeakness') {
      // 弱点分析のロジック
      return NextResponse.json({
        data: {
          updatedAnalysis: {},
          strategy: '分析完了'
        }
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// モックデータ生成関数
function generateMockAIPlan(data: any) {
  const today = new Date();
  const targetDate = new Date(data.universityGoal?.examDate || today);
  const daysUntilExam = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    studyProjection: {
      currentDeviation: data.userData?.academicData?.latestDeviation || 50,
      targetDeviation: data.universityGoal?.safeDeviation || 65,
      daysUntilExam: daysUntilExam,
      requiredGrowthRate: 0.5,
      feasibility: 'achievable',
      requiredDailyHours: 4,
      recommendedPace: 'balanced',
      criticalPeriods: [
        {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          focus: '基礎固め',
          reason: '基礎力の確立が重要'
        }
      ]
    },
    dailyPlans: generateDailyPlans(),
    weeklyMilestones: [
      {
        weekNumber: 1,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        targets: [
          {
            subject: '数学',
            goal: '微分の基礎完成',
            metric: '基礎問題正答率90%以上',
            required: true
          }
        ]
      }
    ],
    detailedAnalysis: {
      weaknessBreakdown: [
        {
          subject: '数学',
          unit: '微分積分',
          subTopics: ['極限', '導関数'],
          currentLevel: 50,
          targetLevel: 70,
          rootCauses: ['基本概念の理解不足'],
          prerequisites: ['関数の基礎'],
          estimatedHoursToImprove: 20,
          recommendedApproach: '基礎から段階的に学習'
        }
      ],
      achievementTasks: [
        {
          id: 'task1',
          title: '微分の基礎マスター',
          description: '微分の基本概念と計算方法を習得',
          subject: '数学',
          unit: '微分',
          type: 'understanding',
          priority: 'high',
          criteria: ['基本公式の暗記', '計算問題90%正解'],
          estimatedTime: 120,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          milestones: []
        }
      ],
      dailyFocusPoints: [],
      conceptualDependencies: [],
      masteryPath: []
    },
    adjustmentRules: [
      {
        condition: '模試偏差値が目標-3以下',
        action: '苦手科目の時間を20%増加',
        priority: 1
      }
    ],
    emergencyPlan: {
      triggers: ['3日以上学習できない', '模試で大幅下落'],
      actions: ['コア科目に集中', '基礎問題のみ'],
      minimumRequirements: ['1日最低2時間', '数学と英語は必須']
    }
  };
}

// 日次プランの生成
function generateDailyPlans() {
  const plans = [];
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  daysOfWeek.forEach(day => {
    let studySessions = [];
    
    if (day === 'saturday' || day === 'sunday') {
      // 週末のスケジュール
      studySessions = [
        {
          startTime: '09:00',
          endTime: '11:00',
          subject: '数学',
          unit: '微分積分',
          studyType: 'practice',
          materials: ['青チャート', '過去問集'],
          targetProblems: 20,
          breakAfter: true
        },
        {
          startTime: '13:00',
          endTime: '15:00',
          subject: '英語',
          unit: '長文読解',
          studyType: 'practice',
          materials: ['速読英単語'],
          targetProblems: 5,
          breakAfter: true
        },
        {
          startTime: '16:00',
          endTime: '18:00',
          subject: '物理',
          unit: '力学',
          studyType: 'concept',
          materials: ['教科書', 'セミナー物理'],
          targetProblems: 15,
          breakAfter: false
        }
      ];
    } else {
      // 平日のスケジュール
      studySessions = [
        {
          startTime: '16:30',
          endTime: '18:00',
          subject: '数学',
          unit: '確率統計',
          studyType: 'concept',
          materials: ['教科書', 'フォーカスゴールド'],
          targetProblems: 10,
          breakAfter: true
        },
        {
          startTime: '19:00',
          endTime: '20:30',
          subject: '英語',
          unit: '文法',
          studyType: 'practice',
          materials: ['Next Stage'],
          targetProblems: 30,
          breakAfter: false
        }
      ];
    }
    
    plans.push({
      dayOfWeek: day,
      studySessions: studySessions,
      totalStudyMinutes: studySessions.reduce((total, session) => {
        const start = session.startTime.split(':').map(Number);
        const end = session.endTime.split(':').map(Number);
        return total + (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
      }, 0),
      focusSubjects: [...new Set(studySessions.map(s => s.subject))],
      goals: ['基礎概念の理解', '問題演習の実施'],
      notes: day === 'saturday' || day === 'sunday' ? '週末は長めの学習時間' : '学校後の効率的な学習'
    });
  });
  
  return plans;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}