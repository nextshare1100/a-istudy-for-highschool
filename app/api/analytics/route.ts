// app/api/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { 
  getStudyTimeStats,
  getWeaknessAnalysis,
  getEfficiencyAnalysis,
  getPerformancePrediction,
  getUserLevel
} from '@/lib/firebase/improved-analytics';

// トークン検証（既存のものを使用）
async function verifyToken(token: string | null): Promise<{ valid: boolean; userId?: string }> {
  if (!token) {
    return { valid: false };
  }

  if (token.startsWith('Bearer ')) {
    const actualToken = token.substring(7);
    if (actualToken) {
      // 本番環境では Firebase Admin SDK を使用
      // const decodedToken = await adminAuth.verifyIdToken(actualToken);
      // return { valid: true, userId: decodedToken.uid };
      
      // 開発環境用
      return { valid: true, userId: 'mock-user-id' };
    }
  }

  return { valid: false };
}

// 日付範囲に基づいてデータをフィルタリング（既存のものを維持）
function getDateRange(range: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return {
        start: today,
        end: now
      };
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);
      return {
        start: weekStart,
        end: now
      };
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: monthStart,
        end: now
      };
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return {
        start: yearStart,
        end: now
      };
    default:
      const defaultStart = new Date(today);
      defaultStart.setDate(today.getDate() - 6);
      return {
        start: defaultStart,
        end: now
      };
  }
}

// 既存のモックデータ生成関数（フォールバック用に維持）
function generateMockData(range: string) {
  const days = ['月', '火', '水', '木', '金', '土', '日'];
  const baseStudyTime = 240;
  
  const weeklyTrend = days.map((day, index) => ({
    date: day,
    hours: Number((baseStudyTime / 60 + Math.random() * 2 - 1).toFixed(1))
  }));

  const topWeaknesses = [
    { subject: '英語', unit: '長文読解', accuracy: 45 },
    { subject: '数学', unit: '微分積分', accuracy: 52 },
    { subject: '物理', unit: '電磁気学', accuracy: 38 },
    { subject: '化学', unit: '有機化学', accuracy: 61 },
    { subject: '国語', unit: '古文読解', accuracy: 55 },
  ];

  let todayStudyTime = 0;
  if (range === 'today') {
    const now = new Date();
    const hours = now.getHours();
    todayStudyTime = Math.floor((hours / 24) * baseStudyTime + Math.random() * 60);
  } else {
    todayStudyTime = baseStudyTime + Math.floor(Math.random() * 60 - 30);
  }

  return {
    todayStudyTime,
    targetAchievement: Math.round((todayStudyTime / 360) * 100),
    weeklyTrend,
    recentExamScore: 58,
    topWeaknesses,
    studyStreak: 12,
    totalStudyTime: weeklyTrend.reduce((sum, day) => sum + day.hours * 60, 0),
    avgDailyStudyTime: Math.round(weeklyTrend.reduce((sum, day) => sum + day.hours, 0) / 7 * 60),
    mostProductiveDay: weeklyTrend.reduce((max, day) => day.hours > max.hours ? day : max).date,
    leastProductiveDay: weeklyTrend.reduce((min, day) => day.hours < min.hours ? day : min).date,
    improvementRate: Math.floor(Math.random() * 20 - 5),
    subjectDistribution: {
      '英語': 25,
      '数学': 30,
      '物理': 20,
      '化学': 15,
      '国語': 10
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { valid, userId } = await verifyToken(authorization);

    if (!valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // URLパラメータ取得
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || 'week';
    const type = searchParams.get('type') || 'overview';
    const useFirebase = searchParams.get('useFirebase') === 'true';

    // Firebase統合が有効な場合
    if (useFirebase) {
      try {
        let data: any = {};

        switch (type) {
          case 'studyTime':
            data = await getStudyTimeStats(userId, range as any);
            break;
            
          case 'weakness':
            data = await getWeaknessAnalysis(userId);
            break;
            
          case 'efficiency':
            data = await getEfficiencyAnalysis(userId, range);
            break;
            
          case 'prediction':
            data = await getPerformancePrediction(userId);
            break;
            
          case 'userLevel':
            data = { level: await getUserLevel(userId) };
            break;
            
          case 'all':
            const [studyTime, weakness, efficiency, prediction, level] = await Promise.all([
              getStudyTimeStats(userId, range as any),
              getWeaknessAnalysis(userId),
              getEfficiencyAnalysis(userId, range),
              getPerformancePrediction(userId),
              getUserLevel(userId)
            ]);
            
            data = {
              studyTime,
              weakness,
              efficiency,
              prediction,
              userLevel: level
            };
            break;
            
          case 'overview':
          default:
            // 既存のoverview形式のデータ
            const stats = await getStudyTimeStats(userId, range as any);
            const weaknessData = await getWeaknessAnalysis(userId);
            
            data = {
              todayStudyTime: stats.todayTime,
              targetAchievement: Math.round((stats.todayTime / 360) * 100),
              weeklyTrend: stats.weeklyTrend,
              recentExamScore: null, // 別途取得が必要
              topWeaknesses: weaknessData.slice(0, 5).map(w => ({
                subject: w.subject,
                unit: w.unit,
                accuracy: Math.round(w.accuracy)
              })),
              studyStreak: 0, // 別途計算が必要
              totalStudyTime: stats.weeklyTotal * 60,
              avgDailyStudyTime: (stats.weeklyTotal * 60) / 7,
              subjectDistribution: stats.subjectDistribution.reduce((acc, s) => {
                acc[s.subject] = Math.round(s.percentage);
                return acc;
              }, {} as any)
            };
        }

        return NextResponse.json({
          success: true,
          data,
          range,
          type,
          source: 'firebase',
          generatedAt: new Date().toISOString()
        });

      } catch (firebaseError) {
        console.error('Firebase error, falling back to mock data:', firebaseError);
        // Firebaseエラー時はモックデータにフォールバック
      }
    }

    // モックデータを返す（既存の動作を維持）
    const mockData = generateMockData(range);

    return NextResponse.json({
      success: true,
      data: mockData,
      range,
      type: 'overview',
      source: 'mock',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// エクスポート機能を追加
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { valid, userId } = await verifyToken(authorization);

    if (!valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, format = 'json', dateRange = 'month' } = body;

    if (action === 'export') {
      // データエクスポート処理
      const [studyTime, weakness, efficiency, prediction] = await Promise.all([
        getStudyTimeStats(userId, dateRange as any),
        getWeaknessAnalysis(userId),
        getEfficiencyAnalysis(userId, dateRange),
        getPerformancePrediction(userId)
      ]);

      const exportData = {
        userId,
        exportDate: new Date().toISOString(),
        dateRange,
        analytics: {
          studyTime,
          weakness,
          efficiency,
          prediction
        }
      };

      if (format === 'csv') {
        // CSV変換ロジック（簡略化）
        const csv = Object.entries(exportData.analytics)
          .map(([key, value]) => `${key},${JSON.stringify(value)}`)
          .join('\n');
        
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename=analytics_${dateRange}.csv`
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: exportData
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in POST analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}