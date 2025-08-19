// lib/services/universal-graph-generator.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface GraphData {
  type: 'line_chart' | 'bar_chart' | 'pie_chart' | 'scatter_plot';
  title: string;
  xLabel?: string;
  yLabel?: string;
  data: any;
}

export class UniversalGraphGenerator {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  // テーマの内容から適切なグラフデータを生成
  async generateGraphForTheme(theme: {
    title: string;
    description: string;
    category: string;
    keywords?: string[];
  }): Promise<GraphData | null> {
    try {
      const prompt = `
以下の小論文テーマに最適なグラフデータを生成してください。

テーマ: ${theme.title}
説明: ${theme.description}
カテゴリ: ${theme.category}
キーワード: ${theme.keywords?.join(', ') || 'なし'}

以下の形式でJSONとして出力してください：
{
  "type": "グラフタイプ（line_chart/bar_chart/pie_chart/scatter_plot）",
  "title": "グラフのタイトル",
  "xLabel": "X軸ラベル（line_chart/bar_chart/scatter_plotの場合）",
  "yLabel": "Y軸ラベル（line_chart/bar_chart/scatter_plotの場合）",
  "data": {
    // line_chartの場合
    "years": [年度の配列] または "labels": [ラベルの配列],
    "values": [数値の配列] または複数系列の場合は各系列名: [数値配列]
    
    // bar_chartの場合
    "labels": [カテゴリ名の配列],
    "values": [数値の配列]
    
    // pie_chartの場合
    "labels": [項目名の配列],
    "values": [数値の配列]
    
    // scatter_plotの場合
    "points": [{"x": x値, "y": y値}, ...]
  }
}

重要な指示：
1. テーマに関連する現実的で教育的なデータを生成すること
2. 数値は妥当で、論述の材料となるような傾向を持たせること
3. 5-10個程度のデータポイントを含めること
4. 小論文の議論に役立つ、分析しやすいデータにすること
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // JSONを抽出
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const graphData = JSON.parse(jsonMatch[0]);
        return this.validateAndNormalizeGraphData(graphData);
      }

      return null;
    } catch (error) {
      console.error('グラフ生成エラー:', error);
      return this.getFallbackGraphData(theme);
    }
  }

  // グラフデータの検証と正規化
  private validateAndNormalizeGraphData(data: any): GraphData {
    // 基本的な検証
    if (!data.type || !data.title || !data.data) {
      throw new Error('必須フィールドが不足しています');
    }

    // グラフタイプに応じた検証
    switch (data.type) {
      case 'line_chart':
        if (!data.data.years && !data.data.labels) {
          data.data.labels = Array.from({ length: 6 }, (_, i) => `項目${i + 1}`);
        }
        break;
      case 'bar_chart':
        if (!data.data.labels || !data.data.values) {
          throw new Error('bar_chartにはlabelsとvaluesが必要です');
        }
        break;
      case 'pie_chart':
        if (!data.data.labels || !data.data.values) {
          throw new Error('pie_chartにはlabelsとvaluesが必要です');
        }
        break;
      case 'scatter_plot':
        if (!data.data.points) {
          throw new Error('scatter_plotにはpointsが必要です');
        }
        break;
    }

    return data as GraphData;
  }

  // フォールバック用のグラフデータ生成
  private getFallbackGraphData(theme: any): GraphData {
    const category = theme.category || 'general';
    
    // カテゴリ別のデフォルトグラフ
    const categoryGraphs: { [key: string]: GraphData } = {
      society: {
        type: 'line_chart',
        title: '社会指標の推移',
        xLabel: '年度',
        yLabel: '指数',
        data: {
          years: [2019, 2020, 2021, 2022, 2023, 2024],
          values: [100, 95, 88, 92, 98, 103]
        }
      },
      economy: {
        type: 'bar_chart',
        title: '経済指標の比較',
        xLabel: '項目',
        yLabel: '成長率（%）',
        data: {
          labels: ['GDP', '消費', '投資', '輸出', '輸入'],
          values: [2.1, 1.8, 3.2, 4.5, 3.8]
        }
      },
      environment: {
        type: 'pie_chart',
        title: 'エネルギー源の構成比',
        data: {
          labels: ['化石燃料', '原子力', '水力', '太陽光', '風力', 'その他'],
          values: [60.5, 15.2, 10.3, 6.8, 4.2, 3.0]
        }
      },
      education: {
        type: 'line_chart',
        title: '教育関連指標の推移',
        xLabel: '年度',
        yLabel: '割合（%）',
        data: {
          years: [2019, 2020, 2021, 2022, 2023],
          進学率: [58.1, 58.6, 59.0, 59.7, 60.1],
          就職率: [97.6, 96.0, 96.8, 97.4, 98.0]
        }
      },
      science: {
        type: 'scatter_plot',
        title: '研究投資と成果の相関',
        xLabel: '研究開発費（億円）',
        yLabel: '論文数',
        data: {
          points: [
            { x: 100, y: 120 },
            { x: 150, y: 180 },
            { x: 200, y: 210 },
            { x: 250, y: 280 },
            { x: 300, y: 320 },
            { x: 350, y: 380 }
          ]
        }
      },
      medical: {
        type: 'bar_chart',
        title: '医療関連データ',
        xLabel: '項目',
        yLabel: '件数・率',
        data: {
          labels: ['病床利用率(%)', '平均在院日数', '医師数(千人)', '看護師数(千人)'],
          values: [75.3, 28.5, 32.7, 128.9]
        }
      }
    };

    return categoryGraphs[category] || categoryGraphs.society;
  }

  // バッチ処理：複数テーマのグラフを一度に生成
  async generateGraphsForThemes(themes: any[]): Promise<Map<string, GraphData>> {
    const results = new Map<string, GraphData>();
    
    for (const theme of themes) {
      try {
        const graphData = await this.generateGraphForTheme(theme);
        if (graphData) {
          results.set(theme.id, graphData);
        }
      } catch (error) {
        console.error(`テーマ ${theme.id} のグラフ生成に失敗:`, error);
      }
      
      // API制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }
}

// 学部・学科別の専門的なグラフテンプレート
export const facultySpecificGraphTemplates = {
  法学部: {
    type: 'bar_chart' as const,
    title: '法制度に関する国際比較',
    xLabel: '国名',
    yLabel: '指数',
    data: {
      labels: ['日本', '米国', '英国', 'ドイツ', 'フランス', '韓国'],
      values: [78, 82, 85, 83, 79, 75]
    }
  },
  経済学部: {
    type: 'line_chart' as const,
    title: '経済指標の推移',
    xLabel: '年度',
    yLabel: '成長率（%）',
    data: {
      years: [2020, 2021, 2022, 2023, 2024],
      GDP成長率: [-4.5, 2.1, 1.3, 1.9, 2.2],
      インフレ率: [-0.5, -0.2, 2.5, 3.2, 2.8]
    }
  },
  文学部: {
    type: 'pie_chart' as const,
    title: '言語使用の分布',
    data: {
      labels: ['日本語', '英語', '中国語', 'スペイン語', 'フランス語', 'その他'],
      values: [126, 379, 918, 460, 280, 837]
    }
  },
  理学部: {
    type: 'scatter_plot' as const,
    title: '実験データの相関関係',
    xLabel: '変数X',
    yLabel: '変数Y',
    data: {
      points: Array.from({ length: 20 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100 + Math.random() * 50
      }))
    }
  },
  工学部: {
    type: 'line_chart' as const,
    title: '技術効率の改善推移',
    xLabel: '世代',
    yLabel: '効率（%）',
    data: {
      labels: ['第1世代', '第2世代', '第3世代', '第4世代', '第5世代'],
      values: [45, 58, 72, 85, 94]
    }
  },
  医学部: {
    type: 'bar_chart' as const,
    title: '疾患別患者数の推移',
    xLabel: '疾患',
    yLabel: '患者数（千人）',
    data: {
      labels: ['糖尿病', '高血圧', '心疾患', 'がん', '認知症'],
      values: [328, 439, 205, 378, 162]
    }
  },
  薬学部: {
    type: 'line_chart' as const,
    title: '薬剤使用量の推移',
    xLabel: '年度',
    yLabel: '処方量（百万件）',
    data: {
      years: [2020, 2021, 2022, 2023, 2024],
      ジェネリック: [120, 145, 178, 205, 232],
      先発品: [280, 265, 242, 218, 195]
    }
  },
  農学部: {
    type: 'bar_chart' as const,
    title: '作物別収穫量',
    xLabel: '作物',
    yLabel: '収穫量（万トン）',
    data: {
      labels: ['米', '小麦', '大豆', 'とうもろこし', '野菜類'],
      values: [765, 95, 24, 0.2, 1158]
    }
  },
  教育学部: {
    type: 'line_chart' as const,
    title: '教育成果の推移',
    xLabel: '年度',
    yLabel: '達成率（%）',
    data: {
      years: [2020, 2021, 2022, 2023, 2024],
      基礎学力: [72, 70, 74, 76, 78],
      応用力: [65, 63, 68, 71, 73]
    }
  },
  // 柔道整復関連
  柔道整復: {
    type: 'bar_chart' as const,
    title: '柔道整復師と他職種との連携状況',
    xLabel: '連携先',
    yLabel: '連携実施率（%）',
    data: {
      labels: ['整形外科医', '理学療法士', '鍼灸師', '看護師', 'ケアマネジャー'],
      values: [82.5, 67.3, 71.8, 45.2, 38.9]
    }
  }
};