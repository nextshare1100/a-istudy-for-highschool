// lib/services/auto-graph-injector.ts
import { UniversalGraphGenerator } from './universal-graph-generator';

export class AutoGraphInjector {
  private generator: UniversalGraphGenerator;

  constructor() {
    this.generator = new UniversalGraphGenerator();
  }

  // テーマに基づいて適切なグラフを自動注入
  async injectGraphData(theme: any): Promise<any> {
    // すでにグラフデータがある場合はそのまま返す
    if (theme.graphData) {
      return theme;
    }

    // hasGraphがfalseの場合もそのまま返す
    if (theme.hasGraph === false) {
      return theme;
    }

    // グラフが必要な場合（hasGraphがtrueまたは特定のキーワードを含む場合）
    if (theme.hasGraph || this.shouldHaveGraph(theme)) {
      try {
        // 問題文の内容に基づいて動的にグラフを生成
        const dynamicGraph = await this.generateDynamicGraph(theme);
        
        if (dynamicGraph) {
          console.log(`動的グラフを生成: ${theme.title}`);
          return {
            ...theme,
            graphData: dynamicGraph,
            hasGraph: true
          };
        }

        // 動的生成に失敗した場合はGeminiで生成
        console.log(`Geminiでグラフを生成: ${theme.title}`);
        const generatedGraph = await this.generator.generateGraphForTheme(theme);
        
        if (generatedGraph) {
          return {
            ...theme,
            graphData: generatedGraph,
            hasGraph: true
          };
        }
      } catch (error) {
        console.error('グラフ生成エラー:', error);
      }
    }

    return theme;
  }

  // グラフが必要かどうかを判定
  private shouldHaveGraph(theme: any): boolean {
    const graphKeywords = [
      'データ', 'グラフ', '推移', '比較', '統計', '調査結果',
      '増加', '減少', '変化', '傾向', '分析', '相関',
      'アンケート', '割合', 'パーセント', '%', '件数',
      '以下の図', '以下の表', '以下のグラフ', '資料'
    ];

    const text = `${theme.title} ${theme.description} ${theme.keywords?.join(' ') || ''}`.toLowerCase();
    
    return graphKeywords.some(keyword => text.includes(keyword));
  }

  // 問題文の内容に基づいて動的にグラフを生成
  private async generateDynamicGraph(theme: any): Promise<any> {
    try {
      // 問題文から重要な要素を抽出
      const analysis = this.analyzeThemeContent(theme);
      
      // グラフタイプを決定
      const graphType = this.determineGraphType(analysis);
      
      // グラフデータを生成
      const graphData = this.generateGraphData(analysis, graphType);
      
      return {
        type: graphType,
        title: this.generateGraphTitle(analysis),
        ...graphData,
        description: `${analysis.mainTopic}に関するデータを示すグラフ`,
        relevanceExplanation: `このグラフは${analysis.mainTopic}について論じる際の根拠として活用できます`,
        keyInsights: this.generateInsights(analysis, graphType)
      };
    } catch (error) {
      console.error('動的グラフ生成エラー:', error);
      return null;
    }
  }

  // 問題文の内容を分析
  private analyzeThemeContent(theme: any): any {
    const description = theme.description || '';
    const title = theme.title || '';
    const keywords = theme.keywords || [];
    
    // 主要な名詞句を抽出（簡易的な方法）
    const nouns = this.extractNouns(description + ' ' + title);
    
    // データの種類を判定
    const dataType = this.detectDataType(description);
    
    // 測定対象を特定
    const measurementTarget = this.detectMeasurementTarget(description);
    
    return {
      mainTopic: nouns[0] || keywords[0] || 'データ',
      subTopics: nouns.slice(1, 6),
      dataType: dataType,
      measurementTarget: measurementTarget,
      hasComparison: description.includes('比較') || description.includes('対比'),
      hasTrend: description.includes('推移') || description.includes('変化'),
      hasPercentage: description.includes('%') || description.includes('割合'),
      hasSurvey: description.includes('アンケート') || description.includes('調査'),
      description: description // タイトル生成で使用するため追加
    };
  }

  // 重要な名詞を抽出
  private extractNouns(text: string): string[] {
    // 日本語の重要そうな名詞パターン（2文字以上の漢字、カタカナの連続）
    const patterns = [
      /[一-龯]{2,}/g,
      /[ァ-ヶー]{3,}/g,
      /[a-zA-Z]{4,}/gi
    ];
    
    let nouns: string[] = [];
    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      nouns = nouns.concat(matches);
    });
    
    // 一般的すぎる単語や不要な修飾語を除外
    const excludeWords = [
      'こと', 'もの', 'ため', 'それ', 'これ', 'データ', 'グラフ', 
      '以下', '問題', '論じ', '資料', '図表', '考察', '説明',
      '必要', '重要', '場合', '状況', '結果', '内容', '方法'
    ];
    nouns = nouns.filter(noun => !excludeWords.includes(noun));
    
    // 職種や専門用語を優先的に抽出
    const priorityPatterns = [
      /[一-龯]+師/g,  // 〜師（医師、薬剤師など）
      /[一-龯]+士/g,  // 〜士（理学療法士など）
      /[一-龯]+員/g,  // 〜員（職員など）
      /[一-龯]+家/g,  // 〜家（専門家など）
    ];
    
    let priorityNouns: string[] = [];
    priorityPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      priorityNouns = priorityNouns.concat(matches);
    });
    
    // 優先名詞を先頭に配置
    const allNouns = [...new Set([...priorityNouns, ...nouns])];
    
    // 不要な前後の文字を削除
    return allNouns.map(noun => this.cleanupNoun(noun));
  }

  // 名詞のクリーンアップ
  private cleanupNoun(noun: string): string {
    // 不要な接頭辞・接尾辞を除去
    return noun
      .replace(/^(この|その|あの|どの|各|全|新|旧|大|小|高|低)/g, '')
      .replace(/(など|のみ|だけ|ほど|ばかり|まで|から|より)$/g, '')
      .trim();
  }

  // データの種類を検出
  private detectDataType(text: string): string {
    if (text.includes('推移') || text.includes('変化') || text.includes('経年')) return 'trend';
    if (text.includes('比較') || text.includes('対比')) return 'comparison';
    if (text.includes('割合') || text.includes('構成') || text.includes('内訳')) return 'composition';
    if (text.includes('相関') || text.includes('関係')) return 'correlation';
    if (text.includes('分布') || text.includes('ばらつき')) return 'distribution';
    return 'general';
  }

  // 測定対象を検出
  private detectMeasurementTarget(text: string): string {
    const measurementPatterns = [
      { pattern: /(\S+?)(率|割合)/, extract: (m: RegExpMatchArray) => m[0] },
      { pattern: /(\S+?)(数|件数)/, extract: (m: RegExpMatchArray) => m[0] },
      { pattern: /(\S+?)(量|額)/, extract: (m: RegExpMatchArray) => m[0] },
      { pattern: /(\S+?)(度|レベル)/, extract: (m: RegExpMatchArray) => m[0] },
      { pattern: /(満足度|関心度|重要度|達成度|実施率|参加率)/, extract: (m: RegExpMatchArray) => m[0] },
    ];
    
    for (const { pattern, extract } of measurementPatterns) {
      const match = text.match(pattern);
      if (match) {
        const result = extract(match);
        // クリーンアップ
        return result.replace(/の|に関する|について/g, '').trim();
      }
    }
    
    // パーセント記号がある場合
    if (text.includes('%') || text.includes('パーセント')) {
      return '割合（%）';
    }
    
    return '数値';
  }

  // グラフタイプを決定
  private determineGraphType(analysis: any): string {
    if (analysis.dataType === 'trend' || analysis.hasTrend) {
      return 'line_chart';
    }
    if (analysis.dataType === 'composition' || analysis.hasPercentage) {
      return 'pie_chart';
    }
    if (analysis.dataType === 'correlation') {
      return 'scatter_plot';
    }
    // デフォルトは棒グラフ
    return 'bar_chart';
  }

  // グラフデータを生成
  private generateGraphData(analysis: any, graphType: string): any {
    switch (graphType) {
      case 'line_chart':
        return this.generateLineChartData(analysis);
      case 'bar_chart':
        return this.generateBarChartData(analysis);
      case 'pie_chart':
        return this.generatePieChartData(analysis);
      case 'scatter_plot':
        return this.generateScatterPlotData(analysis);
      default:
        return this.generateBarChartData(analysis);
    }
  }

  // 折れ線グラフのデータ生成
  private generateLineChartData(analysis: any): any {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 4; i >= 0; i--) {
      years.push(currentYear - i);
    }
    
    // ランダムだが現実的な傾向を持つデータを生成
    const baseValue = 50 + Math.random() * 50;
    const trend = Math.random() > 0.5 ? 1 : -1; // 上昇または下降傾向
    const values = years.map((_, index) => {
      const trendValue = baseValue + (trend * index * (5 + Math.random() * 5));
      const noise = (Math.random() - 0.5) * 10;
      return Math.round((trendValue + noise) * 10) / 10;
    });
    
    return {
      xLabel: '年',
      yLabel: analysis.measurementTarget,
      data: {
        years: years,
        values: values
      }
    };
  }

  // 棒グラフのデータ生成
  private generateBarChartData(analysis: any): any {
    let labels = analysis.subTopics.slice(0, 5);
    
    // ラベルのクリーンアップと検証
    labels = this.cleanupLabels(labels);
    
    // ラベルが不足している場合の補完
    if (labels.length === 0) {
      labels.push('項目A', '項目B', '項目C', '項目D', '項目E');
    } else if (labels.length < 3) {
      // 最低3つは必要
      const genericLabels = ['その他', '未分類', '該当なし'];
      while (labels.length < 3) {
        labels.push(genericLabels[labels.length - 1] || `項目${labels.length + 1}`);
      }
    }
    
    // ランダムだが差がある値を生成
    const values = labels.map(() => Math.round((30 + Math.random() * 60) * 10) / 10);
    
    return {
      xLabel: this.determineXLabel(analysis),
      yLabel: analysis.measurementTarget || '数値',
      data: {
        labels: labels,
        values: values
      }
    };
  }

  // ラベルのクリーンアップ
  private cleanupLabels(labels: string[]): string[] {
    return labels
      .filter(label => label && label.length > 0)
      .map(label => {
        // 不要な修飾語を除去
        return label
          .replace(/^(下の|上の|次の|各|全|新|旧)/g, '')
          .replace(/に関する|について|における|での|から|まで/g, '')
          .replace(/\s+/g, '')
          .trim();
      })
      .filter(label => label.length > 0);
  }

  // X軸ラベルを決定
  private determineXLabel(analysis: any): string {
    // 職種が含まれる場合
    if (analysis.subTopics.some(topic => topic.includes('師') || topic.includes('士'))) {
      return '職種';
    }
    // 時期が含まれる場合
    if (analysis.subTopics.some(topic => topic.includes('年') || topic.includes('月'))) {
      return '時期';
    }
    // デフォルト
    return '項目';
  }

  // 円グラフのデータ生成
  private generatePieChartData(analysis: any): any {
    let labels = analysis.subTopics.slice(0, 4);
    
    // ラベルのクリーンアップ
    labels = this.cleanupLabels(labels);
    
    // ラベルが不足している場合の補完
    if (labels.length === 0) {
      labels.push('タイプA', 'タイプB', 'タイプC', 'その他');
    } else if (labels.length < 3) {
      labels.push('その他');
    }
    
    // 合計が100になるような値を生成
    let values = labels.map(() => Math.random());
    const sum = values.reduce((a, b) => a + b, 0);
    values = values.map(v => Math.round((v / sum * 100) * 10) / 10);
    
    // 合計が100になるように調整
    const total = values.reduce((a, b) => a + b, 0);
    if (total !== 100) {
      values[values.length - 1] = Math.round((values[values.length - 1] + (100 - total)) * 10) / 10;
    }
    
    return {
      data: {
        labels: labels,
        values: values
      }
    };
  }

  // 散布図のデータ生成
  private generateScatterPlotData(analysis: any): any {
    const points = [];
    for (let i = 0; i < 30; i++) {
      points.push({
        x: Math.round(Math.random() * 100),
        y: Math.round(Math.random() * 100)
      });
    }
    
    return {
      xLabel: analysis.subTopics[0] || 'X軸',
      yLabel: analysis.subTopics[1] || 'Y軸',
      data: {
        points: points
      }
    };
  }

  // グラフタイトルを生成
  private generateGraphTitle(analysis: any): string {
    const { mainTopic, subTopics, dataType, hasSurvey } = analysis;
    
    // 職種に関する内容の場合
    const professionKeywords = ['師', '士', '員', '家'];
    const hasProfession = subTopics.some(topic => 
      professionKeywords.some(keyword => topic.includes(keyword))
    );
    
    if (hasProfession && subTopics.length > 1) {
      // 連携に関する内容の場合
      if (analysis.description?.includes('連携') || analysis.description?.includes('協力')) {
        return `${mainTopic}と他職種との連携状況`;
      }
      // 比較の場合
      if (dataType === 'comparison') {
        return `各職種における${this.extractMeasurementTarget(analysis.description || '')}の比較`;
      }
      // その他の職種関連
      return `${mainTopic}に関する職種別データ`;
    }
    
    // アンケート・調査の場合
    if (hasSurvey) {
      return `${mainTopic}に関する調査結果`;
    }
    
    // データタイプ別のタイトル生成
    switch (dataType) {
      case 'trend':
        return `${mainTopic}の推移`;
      case 'comparison':
        return `${mainTopic}の比較データ`;
      case 'composition':
        return `${mainTopic}の構成割合`;
      case 'correlation':
        return `${mainTopic}の相関関係`;
      default:
        // 測定対象がある場合
        const measurementTarget = this.extractMeasurementTarget(analysis.description || '');
        if (measurementTarget && measurementTarget !== '数値') {
          return `${mainTopic}の${measurementTarget}`;
        }
        return `${mainTopic}に関するデータ`;
    }
  }

  // 洞察を生成
  private generateInsights(analysis: any, graphType: string): string[] {
    const insights = [];
    const { mainTopic, subTopics } = analysis;
    
    // 職種に関する内容の場合の特別な洞察
    const hasProfession = subTopics.some(topic => 
      ['師', '士', '員', '家'].some(keyword => topic.includes(keyword))
    );
    
    if (hasProfession) {
      insights.push('各職種の特徴や役割の違いが明確に示されている');
      if (analysis.description?.includes('連携')) {
        insights.push('多職種連携の現状と課題が数値で可視化されている');
      }
    }
    
    // グラフタイプ別の洞察
    switch (graphType) {
      case 'line_chart':
        insights.push('時系列での変化の傾向が明確に示されている');
        insights.push('将来の予測や対策を考える上での重要なデータ');
        break;
      case 'bar_chart':
        insights.push('各項目間の比較が視覚的に理解しやすい');
        insights.push('優先順位や重点項目の判断に活用できる');
        break;
      case 'pie_chart':
        insights.push('全体に占める各要素の割合が一目で把握できる');
        insights.push('構成比のバランスから課題や改善点が見えてくる');
        break;
      case 'scatter_plot':
        insights.push('2つの変数間の相関関係が視覚的に理解できる');
        insights.push('外れ値や特異なパターンの発見が可能');
        break;
    }
    
    // 共通の洞察
    insights.push(`${mainTopic}に関する議論の客観的な根拠として活用できる`);
    
    return insights;
  }
}

// 使用例：小論文作成ページで使用
export async function enhanceThemeWithGraph(theme: any): Promise<any> {
  const injector = new AutoGraphInjector();
  return await injector.injectGraphData(theme);
}