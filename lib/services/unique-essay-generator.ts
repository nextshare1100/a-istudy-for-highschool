// lib/services/unique-essay-generator.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { collection, query, where, getDocs, limit, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import crypto from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// テーマの履歴を管理するインターフェース
interface ThemeHistory {
  themeHash: string;
  title: string;
  category: string;
  createdAt: Date;
  graphDataHash?: string;
}

export class UniqueEssayGenerator {
  private model: any;
  private recentThemes: Set<string> = new Set();
  private usedTopics: Map<string, number> = new Map();
  private themeHashHistory: Map<string, ThemeHistory> = new Map();
  private similarityThreshold = 0.7; // 類似度の閾値

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.9, // 多様性を高める
        topP: 0.95,
        topK: 40,
      }
    });
  }

  // 最近生成されたテーマを取得（ハッシュ値も含む）
  async loadRecentThemes(userId?: string) {
    try {
      // 最近のテーマを取得
      const themesQuery = query(
        collection(db, 'essay_themes'),
        where('createdByAI', '==', true),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      
      const snapshot = await getDocs(themesQuery);
      snapshot.forEach(doc => {
        const data = doc.data();
        this.recentThemes.add(data.title);
        
        // トピックの使用回数をカウント
        const topic = this.extractTopic(data.title);
        this.usedTopics.set(topic, (this.usedTopics.get(topic) || 0) + 1);
        
        // ハッシュ履歴に追加
        if (data.themeHash) {
          this.themeHashHistory.set(data.themeHash, {
            themeHash: data.themeHash,
            title: data.title,
            category: data.category,
            createdAt: data.createdAt.toDate(),
            graphDataHash: data.graphDataHash
          });
        }
      });

      // ハッシュ履歴コレクションからも取得
      const hashQuery = query(
        collection(db, 'theme_hashes'),
        orderBy('createdAt', 'desc'),
        limit(1000)
      );
      
      const hashSnapshot = await getDocs(hashQuery);
      hashSnapshot.forEach(doc => {
        const data = doc.data();
        this.themeHashHistory.set(doc.id, data as ThemeHistory);
      });

      console.log(`読み込み完了: ${this.recentThemes.size}個のテーマ, ${this.themeHashHistory.size}個のハッシュ`);
    } catch (error) {
      console.error('最近のテーマ取得エラー:', error);
    }
  }

  // テーマのハッシュ値を生成
  private generateThemeHash(theme: any): string {
    const normalizedTitle = theme.title.toLowerCase().replace(/\s+/g, '');
    const normalizedCategory = theme.category || '';
    const key = `${normalizedTitle}_${normalizedCategory}`;
    
    // Node.js環境の場合
    if (typeof window === 'undefined') {
      return crypto.createHash('md5').update(key).digest('hex');
    } else {
      // ブラウザ環境の場合（簡易ハッシュ）
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    }
  }

  // グラフデータのハッシュ値を生成
  private generateGraphDataHash(graphData: any): string {
    if (!graphData) return '';
    
    const dataString = JSON.stringify(graphData.data || {});
    const key = `${graphData.type}_${graphData.title}_${dataString}`;
    
    if (typeof window === 'undefined') {
      return crypto.createHash('md5').update(key).digest('hex');
    } else {
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    }
  }

  // トピックを抽出（改良版）
  private extractTopic(title: string): string {
    const topicPatterns = [
      { pattern: /高齢|老後|シニア/i, topic: '高齢化' },
      { pattern: /少子|出生|子育て/i, topic: '少子化' },
      { pattern: /環境|エコ|温暖化|気候/i, topic: '環境問題' },
      { pattern: /AI|人工知能|機械学習/i, topic: 'AI' },
      { pattern: /SDG|持続可能/i, topic: 'SDGs' },
      { pattern: /格差|貧困|不平等/i, topic: '格差社会' },
      { pattern: /グローバル|国際化|多文化/i, topic: 'グローバル化' },
      { pattern: /教育|学習|学校/i, topic: '教育' },
      { pattern: /医療|健康|病院/i, topic: '医療' },
      { pattern: /エネルギー|電力|原子力/i, topic: 'エネルギー' },
      { pattern: /働き方|労働|雇用/i, topic: '働き方' },
      { pattern: /ジェンダー|男女|性/i, topic: 'ジェンダー' },
      { pattern: /地方|地域|過疎/i, topic: '地方創生' },
      { pattern: /デジタル|IT|DX/i, topic: 'デジタル化' },
      { pattern: /食|フード|農業/i, topic: '食料問題' },
    ];
    
    for (const { pattern, topic } of topicPatterns) {
      if (pattern.test(title)) {
        return topic;
      }
    }
    
    return 'その他';
  }

  // ユニークな問題を生成（強化版）
  async generateUniqueEssayTheme(options: {
    field?: string;
    avoidTopics?: string[];
    preferNewTopics?: boolean;
    maxAttempts?: number;
  } = {}): Promise<any> {
    const { 
      field = '社会問題', 
      avoidTopics = [], 
      preferNewTopics = true,
      maxAttempts = 5 
    } = options;
    
    // 最大試行回数まで生成を試みる
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`生成試行 ${attempt}/${maxAttempts}`);
      
      // 使用頻度の低いトピックを優先
      const underusedTopics = this.getUnderusedTopics();
      
      // 現在の時事トピックを追加
      const currentTopics = this.getCurrentTopics();
      
      // ランダム要素を追加
      const randomSeed = Math.random().toString(36).substring(7);
      
      const prompt = `
あなたは大学入試の小論文問題作成者です。
以下の条件で、他と重複しない独自性の高い問題を作成してください。

【重要】この問題のシード値: ${randomSeed}

【条件】
- 分野: ${field}
- 避けるべきトピック: ${Array.from(this.usedTopics.keys()).filter(t => (this.usedTopics.get(t) || 0) > 5).join(', ')}
- 推奨トピック: ${underusedTopics.join(', ')}, ${currentTopics.join(', ')}
- 生成試行回数: ${attempt}回目

【独自性を高めるための指示】
1. 複数の視点を組み合わせる（3つ以上の要素を掛け合わせる）
2. 具体的な事例や2024年以降の最新動向を含める
3. 従来とは異なる切り口でアプローチする
4. 予想外の相関関係や逆説的な視点を取り入れる
5. 学際的な視点を含める（複数の学問分野をまたぐ）

【既存のテーマパターン（これらと異なるものを作成）】
${Array.from(this.recentThemes).slice(0, 10).map(t => `- ${t}`).join('\n')}

【グラフデータに関する重要な要件】
1. グラフは問題文で議論される内容と直接的に関連していること
2. 受験生がグラフから読み取った情報を論述に活用できる設計にすること
3. グラフのデータは以下のいずれかの役割を果たすこと：
   - 問題文で提起される課題の現状を示す
   - 論点の根拠となる傾向や変化を表す
   - 複数の要因の相関関係を可視化する
   - 議論の出発点となる意外な事実を提示する
4. 問題文中で必ずグラフに言及し、それを踏まえた論述を求めること

【グラフと問題文の統合例】
- 「グラフ1が示す〇〇の推移を踏まえて...」
- 「資料として示したデータから読み取れる...」
- 「図表の相関関係を分析した上で...」

【グラフ内容の整合性チェック】
- グラフのタイトルは問題文の主要テーマを反映すること
- グラフの軸ラベルやデータは問題文で言及される要素と一致すること
- 問題文で「スポーツ人口」について論じる場合、グラフも「スポーツ人口」のデータを含むこと
- 問題文とグラフで使用する用語や概念を統一すること

出力形式は以下のJSON：
{
  "title": "独自性の高いタイトル（他と重複しない）",
  "description": "問題文（400字以上、必ずグラフデータに言及し、そのデータを論述に活用することを明確に指示する）",
  "category": "society/culture/science/environment/education/economy/politics/ethics から選択",
  "keywords": ["キーワード1", "キーワード2", "キーワード3", "キーワード4"],
  "difficulty": 3,
  "timeLimit": 60,
  "wordLimit": 800,
  "uniqueAspects": ["独自性ポイント1", "独自性ポイント2", "独自性ポイント3"],
  "graphData": {
    "type": "line_chart/bar_chart/pie_chart/scatter_plot から選択",
    "title": "問題文のテーマと直接関連するグラフタイトル（問題文の主要キーワードを含む）",
    "description": "このグラフが示す内容と問題文との関連性の説明",
    "xLabel": "X軸ラベル（問題文の要素と一致）",
    "yLabel": "Y軸ラベル（問題文の要素と一致）",
    "data": {
      // 問題文で議論される内容を裏付ける具体的なデータ
      // 必ず問題文の論点と関連するデータを使用すること
      // 例：問題文が「スポーツ人口と怪我」なら、グラフも「スポーツ種目別の怪我発生率」など
    },
    "relevanceExplanation": "このグラフデータをどのように論述に活用すべきかの説明",
    "keyInsights": ["グラフから読み取れる重要な洞察1", "洞察2", "洞察3"],
    "dataLabels": ["問題文に登場する要素1", "要素2", "要素3"] // データのラベルも問題文と一致
  }
}

【重要】
- グラフデータは問題文の内容と密接に関連し、受験生の論述に不可欠な資料となるように設計してください。
- 問題文とグラフで扱うテーマ・用語・概念は必ず一致させること。
- グラフのタイトルには問題文の主要キーワードを含めること。`;

      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('JSON抽出失敗');
          continue;
        }
        
        const generated = JSON.parse(jsonMatch[0]);
        
        // グラフと問題文の関連性を検証（より厳格に）
        if (!this.validateGraphRelevance(generated)) {
          console.log('グラフと問題文の関連性が不十分です。再生成します...');
          continue;
        }
        
        // グラフ内容の一致性を検証
        if (!this.validateGraphContentMatch(generated)) {
          console.log('グラフ内容と問題文のテーマが一致しません。再生成します...');
          continue;
        }
        
        // ハッシュ値を生成
        const themeHash = this.generateThemeHash(generated);
        const graphDataHash = this.generateGraphDataHash(generated.graphData);
        
        // 重複チェック（強化版）
        if (this.isDuplicateStrict(generated, themeHash, graphDataHash)) {
          console.log(`重複検出（ハッシュ: ${themeHash}）、再生成します...`);
          continue;
        }
        
        // 成功した場合、ハッシュを保存
        await this.saveThemeHash(themeHash, generated, graphDataHash);
        
        // 生成されたテーマにハッシュ情報を追加
        return {
          ...generated,
          themeHash,
          graphDataHash,
          generatedAt: new Date(),
          attemptCount: attempt
        };
        
      } catch (error) {
        console.error(`生成エラー（試行${attempt}）:`, error);
        continue;
      }
    }
    
    // すべての試行が失敗した場合
    throw new Error(`${maxAttempts}回の試行後も、ユニークなテーマを生成できませんでした`);
  }

  // グラフと問題文の関連性を検証
  private validateGraphRelevance(theme: any): boolean {
    if (!theme.graphData || !theme.description) {
      return false;
    }

    const description = theme.description.toLowerCase();
    const graphTitle = theme.graphData.title?.toLowerCase() || '';
    
    // 問題文がグラフに言及しているか確認
    const graphMentions = ['グラフ', '図表', '資料', 'データ', '推移', '変化', '統計'];
    const hasGraphMention = graphMentions.some(mention => description.includes(mention));
    
    if (!hasGraphMention) {
      console.log('問題文にグラフへの言及がありません');
      return false;
    }

    // グラフのrelevanceExplanationが存在するか確認
    if (!theme.graphData.relevanceExplanation || !theme.graphData.keyInsights) {
      console.log('グラフの関連性説明が不足しています');
      return false;
    }

    return true;
  }

  // グラフ内容と問題文のテーマ一致を検証
  private validateGraphContentMatch(theme: any): boolean {
    if (!theme.graphData || !theme.description) {
      return false;
    }

    // 問題文からキーワードを抽出
    const problemKeywords = this.extractKeywords(theme.description);
    
    // グラフ関連のテキストからキーワードを抽出
    const graphText = [
      theme.graphData.title || '',
      theme.graphData.description || '',
      theme.graphData.xLabel || '',
      theme.graphData.yLabel || '',
      ...(theme.graphData.dataLabels || []),
      ...(theme.graphData.keyInsights || [])
    ].join(' ');
    
    const graphKeywords = this.extractKeywords(graphText);
    
    // キーワードの重複をチェック
    const commonKeywords = problemKeywords.filter(keyword => 
      graphKeywords.includes(keyword)
    );
    
    // 最低でも3つ以上の共通キーワードが必要
    if (commonKeywords.length < 3) {
      console.log(`共通キーワードが不足: ${commonKeywords.length}個`);
      console.log('問題文キーワード:', problemKeywords);
      console.log('グラフキーワード:', graphKeywords);
      return false;
    }

    // 問題文の主要テーマがグラフタイトルに含まれているか
    const mainTopics = this.extractMainTopics(theme.description);
    const graphTitleLower = theme.graphData.title?.toLowerCase() || '';
    const hasMainTopic = mainTopics.some(topic => 
      graphTitleLower.includes(topic.toLowerCase())
    );
    
    if (!hasMainTopic) {
      console.log('グラフタイトルに主要テーマが含まれていません');
      return false;
    }

    return true;
  }

  // キーワード抽出（日本語対応強化版）
  private extractKeywords(text: string): string[] {
    // 重要な名詞を抽出するパターン
    const patterns = [
      /[一-龯ぁ-んァ-ヶー]{2,}/g, // 日本語の単語
      /[A-Za-z]{3,}/g, // 英単語
      /[0-9]+年/g, // 年
      /\d+[％%]/g, // パーセンテージ
    ];
    
    let keywords: string[] = [];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords = keywords.concat(matches);
      }
    });
    
    // 一般的すぎる単語を除外
    const stopWords = ['こと', 'もの', 'ため', 'よう', 'とき', 'それ', 'これ', 'あれ', 'どれ'];
    keywords = keywords.filter(word => 
      !stopWords.includes(word) && word.length > 1
    );
    
    // 重複を除去して小文字化
    return [...new Set(keywords.map(k => k.toLowerCase()))];
  }

  // 主要トピックを抽出
  private extractMainTopics(text: string): string[] {
    // より具体的なトピックパターン
    const topicPatterns = [
      { pattern: /スポーツ[人口|振興|普及|参加]/g, extract: (m: string) => m },
      { pattern: /[一-龯]+人口/g, extract: (m: string) => m },
      { pattern: /[一-龯]+問題/g, extract: (m: string) => m },
      { pattern: /[一-龯]+社会/g, extract: (m: string) => m },
      { pattern: /[一-龯]+化/g, extract: (m: string) => m },
      { pattern: /[一-龯]+率/g, extract: (m: string) => m },
      { pattern: /AI|IoT|DX|SDGs/g, extract: (m: string) => m },
    ];
    
    let topics: string[] = [];
    
    topicPatterns.forEach(({ pattern, extract }) => {
      const matches = text.match(pattern);
      if (matches) {
        topics = topics.concat(matches.map(extract));
      }
    });
    
    // タイトルからも主要語を抽出
    const titleMatch = text.match(/「([^」]+)」/);
    if (titleMatch) {
      topics.push(titleMatch[1]);
    }
    
    return [...new Set(topics)];
  }

  // 厳格な重複チェック
  private isDuplicateStrict(theme: any, themeHash: string, graphDataHash: string): boolean {
    // 1. ハッシュによる完全一致チェック
    if (this.themeHashHistory.has(themeHash)) {
      console.log('ハッシュ完全一致を検出');
      return true;
    }
    
    // 2. タイトルの完全一致チェック
    if (this.recentThemes.has(theme.title)) {
      console.log('タイトル完全一致を検出');
      return true;
    }
    
    // 3. 類似度チェック（強化版）
    const titleWords = this.tokenize(theme.title);
    for (const existingTitle of this.recentThemes) {
      const similarity = this.calculateSimilarity(titleWords, this.tokenize(existingTitle));
      if (similarity > this.similarityThreshold) {
        console.log(`高い類似度を検出: ${similarity} - "${existingTitle}"`);
        return true;
      }
    }
    
    // 4. グラフデータの類似性チェック
    if (graphDataHash) {
      for (const [hash, history] of this.themeHashHistory.entries()) {
        if (history.graphDataHash === graphDataHash) {
          console.log('グラフデータの一致を検出');
          return true;
        }
      }
    }
    
    return false;
  }

  // テキストをトークン化
  private tokenize(text: string): Set<string> {
    // 日本語の形態素解析の簡易版
    const words = text
      .toLowerCase()
      .replace(/[、。！？\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 1);
    
    return new Set(words);
  }

  // 類似度計算（Jaccard係数）
  private calculateSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // ハッシュ情報をFirebaseに保存
  private async saveThemeHash(themeHash: string, theme: any, graphDataHash: string) {
    try {
      const hashData: ThemeHistory = {
        themeHash,
        title: theme.title,
        category: theme.category,
        createdAt: new Date(),
        graphDataHash
      };
      
      // ハッシュコレクションに保存
      await setDoc(doc(db, 'theme_hashes', themeHash), hashData);
      
      // ローカルマップにも追加
      this.themeHashHistory.set(themeHash, hashData);
      this.recentThemes.add(theme.title);
      
      console.log(`ハッシュ保存完了: ${themeHash}`);
    } catch (error) {
      console.error('ハッシュ保存エラー:', error);
    }
  }

  // 使用頻度の低いトピックを取得（拡張版）
  private getUnderusedTopics(): string[] {
    const allTopics = [
      // 新技術
      'カーボンニュートラル', 'メタバース', '量子コンピュータ',
      'ブロックチェーン', 'サーキュラーエコノミー', 'ウェルビーイング',
      'インクルーシブデザイン', 'リスキリング', 'デジタルツイン',
      'バイオエコノミー', 'スマートシティ', 'フードテック',
      
      // 社会課題
      'デジタルデバイド', 'フェイクニュース', 'プライバシー保護',
      'サイバーセキュリティ', 'ユニバーサルデザイン', 'ソーシャルビジネス',
      
      // 新しい概念
      'Web3', 'NFT', 'DAO', 'ESG投資', 'インパクト投資',
      'グリーンウォッシング', 'カーボンプライシング', 'ネイチャーポジティブ',
      
      // 学際的トピック
      'ニューロダイバーシティ', 'トランスヒューマニズム', 'シンギュラリティ',
      'バイオハッキング', 'ナッジ理論', '行動経済学'
    ];
    
    // 使用回数でフィルタリング
    return allTopics.filter(topic => 
      (this.usedTopics.get(topic) || 0) < 2
    ).sort(() => Math.random() - 0.5).slice(0, 5); // ランダムに5個選択
  }

  // 現在の時事トピックを取得（拡張版）
  private getCurrentTopics(): string[] {
    const currentDate = new Date();
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    // 基本的な時事トピック
    const baseTopics = [
      '生成AI規制', 'カーボンプライシング', 'リモートワーク定着',
      'インフレ対策', 'エネルギー安全保障', 'サプライチェーン強靭化'
    ];
    
    // 季節や時期に応じたトピック
    const seasonalTopics: { [key: number]: string[] } = {
      0: ['新年の目標設定', '成人の社会参加', 'デジタルデトックス'],
      1: ['確定申告とAI', '春節と国際経済'],
      2: ['卒業と新生活', '年度末決算'],
      3: ['新年度政策', '教育改革', '桜と観光'],
      4: ['GWと働き方', '5月病とメンタルヘルス'],
      5: ['梅雨と防災', '株主総会シーズン'],
      6: ['夏の省エネ', '観光振興', '熱中症対策'],
      7: ['夏休みと教育格差', 'お盆と伝統'],
      8: ['防災月間', '秋の新製品'],
      9: ['食欲の秋と食品ロス', 'スポーツと健康'],
      10: ['読書週間', '年末商戦'],
      11: ['年末振り返り', 'SDGs達成度']
    };
    
    const topics = [...baseTopics];
    if (seasonalTopics[month]) {
      topics.push(...seasonalTopics[month]);
    }
    
    // ランダムに並び替えて返す
    return topics.sort(() => Math.random() - 0.5).slice(0, 3);
  }

  // バリエーション生成機能（改良版）
  async generateVariations(baseTheme: any, count: number = 3): Promise<any[]> {
    const variations = [];
    const perspectives = [
      { view: '個人の視点', focus: '個人の選択と責任' },
      { view: '地域社会の視点', focus: '地域コミュニティへの影響' },
      { view: '国家政策の視点', focus: '政府の役割と政策' },
      { view: '国際協調の視点', focus: 'グローバルな連携' },
      { view: '将来世代の視点', focus: '持続可能性と未来' },
      { view: '経済効率の視点', focus: 'コストと便益' },
      { view: '倫理・道徳の視点', focus: '正義と公平性' },
      { view: 'テクノロジーの視点', focus: '技術による解決' },
      { view: '歴史的視点', focus: '過去からの教訓' },
      { view: '文化多様性の視点', focus: '多文化共生' }
    ];
    
    // ランダムに視点を選択
    const selectedPerspectives = perspectives
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
    
    for (let i = 0; i < count; i++) {
      const perspective = selectedPerspectives[i];
      const variedTheme = {
        ...baseTheme,
        title: `${baseTheme.title} - ${perspective.view}から考える`,
        description: this.modifyDescription(baseTheme.description, perspective),
        keywords: [...baseTheme.keywords, perspective.view],
        uniqueAspects: [
          ...baseTheme.uniqueAspects,
          `${perspective.focus}に焦点を当てた分析`
        ]
      };
      
      // 新しいハッシュを生成
      variedTheme.themeHash = this.generateThemeHash(variedTheme);
      
      // グラフデータも少し変更
      if (variedTheme.graphData) {
        variedTheme.graphData = this.varyGraphData(variedTheme.graphData, i);
        variedTheme.graphDataHash = this.generateGraphDataHash(variedTheme.graphData);
      }
      
      variations.push(variedTheme);
    }
    
    return variations;
  }

  // 問題文を視点に応じて修正
  private modifyDescription(description: string, perspective: any): string {
    // グラフへの言及を保持しながら視点を追加
    const graphReference = description.match(/グラフ|図表|資料|データ|統計/g);
    if (!graphReference) {
      // グラフへの言及がない場合は追加
      return `${description}\n\n提示されたグラフデータを分析した上で、特に「${perspective.view}」から、${perspective.focus}を重視してこの問題を考察し、具体的な提案を含めて論じなさい。`;
    }
    
    return `${description}\n\n【視点の指定】\n特に「${perspective.view}」から、${perspective.focus}を重視してこの問題を考察し、グラフから読み取れる情報を活用しながら具体的な提案を含めて論じなさい。`;
  }

  // グラフデータにバリエーションを加える
  private varyGraphData(originalData: any, variationIndex: number): any {
    const varied = { ...originalData };
    
    // タイトルを変更
    varied.title = `${varied.title}（視点${variationIndex + 1}）`;
    
    // 関連性説明を視点に応じて更新
    if (varied.relevanceExplanation) {
      varied.relevanceExplanation = `${varied.relevanceExplanation} この視点から特に注目すべき点を分析してください。`;
    }
    
    // データに小さな変動を加える
    if (varied.data) {
      const varyValue = (value: number) => {
        const variation = 0.9 + Math.random() * 0.2; // 90%〜110%の範囲
        return Math.round(value * variation * 10) / 10;
      };
      
      // 数値データに変動を適用
      if (Array.isArray(varied.data.values)) {
        varied.data.values = varied.data.values.map(varyValue);
      }
      
      // 他の数値配列にも適用
      for (const key in varied.data) {
        if (Array.isArray(varied.data[key]) && typeof varied.data[key][0] === 'number') {
          varied.data[key] = varied.data[key].map(varyValue);
        }
      }
    }
    
    return varied;
  }

  // 統計情報を取得
  getStatistics(): any {
    return {
      totalThemes: this.recentThemes.size,
      totalHashes: this.themeHashHistory.size,
      topicUsage: Object.fromEntries(this.usedTopics),
      underusedTopics: this.getUnderusedTopics(),
      duplicatesPrevented: this.themeHashHistory.size // 概算
    };
  }
}