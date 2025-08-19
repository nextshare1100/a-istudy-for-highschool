// lib/services/smart-graph-decision.ts

export class SmartGraphDecision {
  // グラフが必要かどうかを判定
  static shouldHaveGraph(theme: any): boolean {
    const text = `${theme.title} ${theme.description}`.toLowerCase();
    
    // 1. 明示的にグラフが必要な表現
    const explicitGraphPhrases = [
      '以下のグラフ',
      '以下の図',
      '以下の表',
      '以下のデータ',
      '次のグラフ',
      '次の図表',
      '提示された資料',
      '示されたデータ'
    ];
    
    if (explicitGraphPhrases.some(phrase => text.includes(phrase))) {
      return true;
    }
    
    // 2. グラフがあった方が良いケース
    const graphBeneficialKeywords = [
      '推移', '変化', '増加', '減少', '比較',
      '統計', '調査結果', 'アンケート結果',
      '割合', 'パーセント', '%', '相関',
      '傾向', '分析', 'データ'
    ];
    
    const keywordCount = graphBeneficialKeywords.filter(keyword => 
      text.includes(keyword)
    ).length;
    
    // 3つ以上のキーワードが含まれる場合
    if (keywordCount >= 3) {
      return true;
    }
    
    // 3. グラフが不要なケース
    const noGraphKeywords = [
      '自由に論じなさい',
      'あなたの考えを述べなさい',
      '意見を述べよ',
      '哲学的',
      '倫理的考察',
      '文学的',
      '創造的'
    ];
    
    if (noGraphKeywords.some(keyword => text.includes(keyword))) {
      return false;
    }
    
    // 4. カテゴリベースの判定
    const graphCategories = ['economy', 'science', 'environment'];
    const noGraphCategories = ['ethics', 'philosophy', 'literature'];
    
    if (graphCategories.includes(theme.category)) {
      return keywordCount >= 1; // 1つでもキーワードがあれば
    }
    
    if (noGraphCategories.includes(theme.category)) {
      return false;
    }
    
    // デフォルトはfalse
    return false;
  }
  
  // グラフタイプを推奨
  static recommendGraphType(theme: any): string {
    const text = `${theme.title} ${theme.description}`.toLowerCase();
    
    // 時系列データ
    if (text.includes('推移') || text.includes('変化') || text.includes('年')) {
      return 'line_chart';
    }
    
    // 比較データ
    if (text.includes('比較') || text.includes('各国') || text.includes('都道府県')) {
      return 'bar_chart';
    }
    
    // 構成比
    if (text.includes('割合') || text.includes('構成') || text.includes('内訳')) {
      return 'pie_chart';
    }
    
    // 相関関係
    if (text.includes('相関') || text.includes('関係性')) {
      return 'scatter_plot';
    }
    
    // デフォルト
    return 'bar_chart';
  }
}

// 使用例
export function enhanceThemeIntelligently(theme: any): any {
  // hasGraphフラグを上書き
  const shouldHaveGraph = SmartGraphDecision.shouldHaveGraph(theme);
  
  if (shouldHaveGraph && !theme.graphData) {
    console.log(`グラフが必要と判定: ${theme.title}`);
    // グラフ生成処理...
  } else if (!shouldHaveGraph && theme.hasGraph) {
    console.log(`グラフは不要と判定: ${theme.title}`);
    return {
      ...theme,
      hasGraph: false,
      graphData: null
    };
  }
  
  return theme;
}