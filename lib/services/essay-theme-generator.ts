// lib/services/essay-theme-generator.ts - 修正版
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EssayTheme } from '@/lib/firebase/types';
import { essayService } from '@/lib/firebase/services/essay-service';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export class EssayThemeGenerator {
  private flash: any;
  private pro: any;

  constructor() {
    this.flash = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.pro = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  // グラフ読み取り問題の生成（サンプルデータ付き）
  async generateGraphAnalysisThemesWithData(count: number = 3): Promise<Partial<EssayTheme>[]> {
    const themes: Partial<EssayTheme>[] = [];
    
    // サンプルテーマ1: 医療費と高齢化
    themes.push({
      title: '日本の医療費増加と高齢化社会の関係性',
      description: `以下のグラフは、2010年から2023年までの日本の医療費総額と65歳以上人口の推移を示しています。このデータから読み取れる傾向を分析し、今後の日本の医療制度が直面する課題と、持続可能な医療制度の構築に向けた提言を800字以内で論じなさい。

【分析の観点】
1. 医療費の増加率と高齢者人口の増加率の関係
2. 一人当たり医療費の推移
3. 2020年（コロナ禍）の特異的な変化
4. 今後10年間の予測される傾向
5. 諸外国との比較の必要性`,
      category: 'society',
      faculties: ['all'],
      difficulty: 4,
      timeLimit: 60,
      wordLimit: 800,
      type: 'graph-analysis',
      hasGraph: true,
      keywords: ['高齢化社会', '医療費', '社会保障', '持続可能性', '医療制度改革'],
      requirements: {
        minWords: 640,
        maxWords: 800,
        timeLimit: 60
      },
      graphData: {
        type: 'line_chart',
        title: '日本の医療費と高齢者人口の推移',
        xLabel: '年度',
        yLabel: '医療費（兆円）/ 65歳以上人口（万人）',
        data: {
          years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
          medical_costs: [37.4, 38.6, 39.2, 40.1, 40.8, 42.4, 42.1, 42.2, 42.6, 43.6, 42.9, 44.2, 45.3, 46.8],
          elderly_population: [2948, 2975, 3074, 3190, 3300, 3387, 3459, 3515, 3558, 3589, 3619, 3640, 3653, 3661]
        }
      },
      createdByAI: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // サンプルテーマ2: 再生可能エネルギー
    themes.push({
      title: '各国の再生可能エネルギー導入状況の比較分析',
      description: `以下の棒グラフは、主要国における再生可能エネルギーの導入率（総発電量に占める割合）を示しています。このデータを基に、日本のエネルギー政策の課題を分析し、カーボンニュートラル実現に向けた具体的な施策について論じなさい。

【分析の観点】
1. 日本と他国の導入率の差の要因
2. 地理的・気候的条件の影響
3. 政策的支援の違い
4. 経済的コストと便益
5. 2050年目標達成の実現可能性`,
      category: 'environment',
      faculties: ['all'],
      difficulty: 4,
      timeLimit: 50,
      wordLimit: 700,
      type: 'graph-analysis',
      hasGraph: true,
      keywords: ['再生可能エネルギー', 'カーボンニュートラル', 'エネルギー政策', '環境問題', '持続可能性'],
      requirements: {
        minWords: 560,
        maxWords: 700,
        timeLimit: 50
      },
      graphData: {
        type: 'bar_chart',
        title: '各国の再生可能エネルギー導入率（2023年）',
        xLabel: '国名',
        yLabel: '導入率（%）',
        data: {
          labels: ['ノルウェー', 'ブラジル', 'カナダ', 'スウェーデン', 'ドイツ', 'スペイン', '中国', 'フランス', '英国', '米国', '日本', 'インド'],
          values: [98.5, 83.4, 66.3, 63.1, 46.2, 42.8, 31.9, 28.1, 26.8, 21.5, 22.9, 17.3]
        }
      },
      createdByAI: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // サンプルテーマ3: 世界のCO2排出量
    themes.push({
      title: '世界のCO2排出量の構成と削減戦略',
      description: `以下の円グラフは、2023年における世界のCO2排出量の国別内訳を示しています。このデータを踏まえ、地球温暖化対策における国際協力の重要性と、各国が取るべき責任について論じなさい。

【分析の観点】
1. 排出量上位国の特徴と責任
2. 一人当たり排出量の視点
3. 経済発展と排出量の関係
4. 国際的な枠組みの必要性
5. 技術移転と資金支援の役割`,
      category: 'environment',
      faculties: ['all'],
      difficulty: 5,
      timeLimit: 60,
      wordLimit: 800,
      type: 'graph-analysis',
      hasGraph: true,
      keywords: ['CO2排出量', '地球温暖化', '国際協力', 'パリ協定', '気候変動'],
      requirements: {
        minWords: 640,
        maxWords: 800,
        timeLimit: 60
      },
      graphData: {
        type: 'pie_chart',
        title: '世界のCO2排出量の内訳（2023年）',
        data: {
          labels: ['中国', '米国', 'インド', 'ロシア', '日本', 'ドイツ', 'イラン', '韓国', 'サウジアラビア', 'インドネシア', 'その他'],
          values: [30.9, 13.5, 7.3, 4.7, 3.2, 1.8, 1.7, 1.6, 1.5, 1.4, 32.4]
        }
      },
      createdByAI: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return themes.slice(0, count);
  }

  // Firebaseに保存（graphDataも含める）
  async saveThemesToFirebase(themes: Partial<EssayTheme>[]): Promise<void> {
    console.log(`${themes.length}個のテーマをFirebaseに保存中...`);
    
    for (const theme of themes) {
      try {
        // 必須フィールドの検証
        if (!theme.title || !theme.description || !theme.category || !theme.faculties || 
            theme.difficulty === undefined || theme.timeLimit === undefined || theme.wordLimit === undefined) {
          console.error('必須フィールドが不足しています:', theme);
          continue;
        }

        // EssayTheme型に必要なフィールドを追加（graphDataを含む）
        const completeTheme: Omit<EssayTheme, 'id' | 'createdAt' | 'updatedAt'> = {
          title: theme.title,
          description: theme.description,
          category: theme.category,
          faculties: theme.faculties,
          difficulty: theme.difficulty,
          timeLimit: theme.timeLimit,
          wordLimit: theme.wordLimit,
          type: theme.type || 'common',
          hasGraph: theme.hasGraph || false,
          graphData: theme.graphData, // ここが重要！
          keywords: theme.keywords || [],
          requirements: theme.requirements || {
            minWords: Math.floor(theme.wordLimit * 0.8),
            maxWords: theme.wordLimit,
            timeLimit: theme.timeLimit
          },
          createdByAI: true
        };

        const savedId = await essayService.saveTheme(completeTheme);
        console.log(`テーマを保存しました: ${theme.title} (ID: ${savedId})`);
        
        // 保存後の確認
        if (theme.graphData) {
          console.log(`グラフデータも保存されました:`, theme.graphData.type);
        }
      } catch (error) {
        console.error(`テーマの保存に失敗しました: ${theme.title}`, error);
      }
    }
  }

  // テスト用：サンプルグラフテーマを1つ生成して保存
  async createSampleGraphTheme(): Promise<string> {
    const themes = await this.generateGraphAnalysisThemesWithData(1);
    if (themes.length > 0) {
      await this.saveThemesToFirebase(themes);
      return 'サンプルグラフテーマを作成しました';
    }
    return 'テーマの作成に失敗しました';
  }
}

// 使用例（コンソールで実行）
// const generator = new EssayThemeGenerator();
// await generator.createSampleGraphTheme();