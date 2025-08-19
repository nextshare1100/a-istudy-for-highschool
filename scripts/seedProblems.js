const admin = require('firebase-admin');

// Firebase Admin SDKの初期化
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 拡張版の問題データ
const allProblems = [
  // ========== 高1数学I ==========
  // 4月：数と式（整式）
  {
    subject: '数学I',
    gradeLevel: 1,
    unit: '数と式（整式）',
    difficulty: 'easy',
    question: '次の式を展開せよ。(x + 5)(x - 3)',
    options: ['x² + 2x - 15', 'x² - 2x - 15', 'x² + 2x + 15', 'x² - 2x + 15'],
    correctAnswer: 0,
    explanation: '(x + 5)(x - 3) = x² - 3x + 5x - 15 = x² + 2x - 15',
    targetDeviation: 40
  },
  {
    subject: '数学I',
    gradeLevel: 1,
    unit: '数と式（整式）',
    difficulty: 'medium',
    question: '次の式を因数分解せよ。x² + 7x + 12',
    options: ['(x + 3)(x + 4)', '(x + 2)(x + 6)', '(x + 1)(x + 12)', '(x - 3)(x - 4)'],
    correctAnswer: 0,
    explanation: '和が7、積が12となる2数は3と4。よって x² + 7x + 12 = (x + 3)(x + 4)',
    targetDeviation: 50
  },
  {
    subject: '数学I',
    gradeLevel: 1,
    unit: '数と式（整式）',
    difficulty: 'hard',
    question: '次の式を因数分解せよ。x³ - 8',
    options: ['(x - 2)(x² + 2x + 4)', '(x - 2)(x² - 2x + 4)', '(x + 2)(x² - 2x + 4)', '(x - 2)³'],
    correctAnswer: 0,
    explanation: 'a³ - b³ = (a - b)(a² + ab + b²) の公式より、x³ - 8 = x³ - 2³ = (x - 2)(x² + 2x + 4)',
    targetDeviation: 60
  },

  // 5月：数と式（実数・絶対値）
  {
    subject: '数学I',
    gradeLevel: 1,
    unit: '数と式（実数・絶対値）',
    difficulty: 'easy',
    question: '|3| + |-5| の値を求めよ。',
    options: ['8', '-2', '2', '-8'],
    correctAnswer: 0,
    explanation: '|3| = 3、|-5| = 5 なので、|3| + |-5| = 3 + 5 = 8',
    targetDeviation: 40
  },
  {
    subject: '数学I',
    gradeLevel: 1,
    unit: '数と式（実数・絶対値）',
    difficulty: 'medium',
    question: '√12 を簡単にせよ。',
    options: ['2√3', '3√2', '4√3', '6'],
    correctAnswer: 0,
    explanation: '√12 = √(4×3) = √4×√3 = 2√3',
    targetDeviation: 50
  },
  {
    subject: '数学I',
    gradeLevel: 1,
    unit: '数と式（1次不等式）',
    difficulty: 'medium',
    question: '不等式 2x - 3 < 5 を解け。',
    options: ['x < 4', 'x < 1', 'x > 4', 'x > 1'],
    correctAnswer: 0,
    explanation: '2x - 3 < 5 ⇒ 2x < 8 ⇒ x < 4',
    targetDeviation: 50
  },

  // 6月：集合と命題
  {
    subject: '数学I',
    gradeLevel: 1,
    unit: '集合と命題',
    difficulty: 'easy',
    question: 'A = {1, 2, 3}、B = {2, 3, 4} のとき、A ∩ B を求めよ。',
    options: ['{2, 3}', '{1, 2, 3, 4}', '{1, 4}', '∅'],
    correctAnswer: 0,
    explanation: 'A ∩ B は A と B の共通部分。よって A ∩ B = {2, 3}',
    targetDeviation: 45
  },
  {
    subject: '数学I',
    gradeLevel: 1,
    unit: '集合と命題',
    difficulty: 'medium',
    question: '命題「x = 2 ならば x² = 4」の逆を述べよ。',
    options: ['x² = 4 ならば x = 2', 'x ≠ 2 ならば x² ≠ 4', 'x² ≠ 4 ならば x ≠ 2', 'x = -2 ならば x² = 4'],
    correctAnswer: 0,
    explanation: '命題「p ならば q」の逆は「q ならば p」',
    targetDeviation: 50
  },

  // 7月：2次関数
  {
    subject: '数学I',
    gradeLevel: 1,
    unit: '2次関数（グラフ・最大最小）',
    difficulty: 'easy',
    question: '2次関数 y = x² - 4x + 3 の軸の方程式を求めよ。',
    options: ['x = 2', 'x = -2', 'x = 4', 'x = -4'],
    correctAnswer: 0,
    explanation: 'y = ax² + bx + c の軸は x = -b/2a。よって x = -(-4)/(2×1) = 2',
    targetDeviation: 45
  },
  {
    subject: '数学I',
    gradeLevel: 1,
    unit: '2次関数（グラフ・最大最小）',
    difficulty: 'hard',
    question: '0 ≤ x ≤ 3 における y = -x² + 2x + 1 の最大値を求めよ。',
    options: ['2', '1', '3', '-2'],
    correctAnswer: 0,
    explanation: '頂点は (1, 2)。0 ≤ x ≤ 3 の範囲に頂点が含まれるので、最大値は 2',
    targetDeviation: 60
  },

  // ========== 高1数学A ==========
  // 9月：場合の数
  {
    subject: '数学A',
    gradeLevel: 1,
    unit: '場合の数',
    difficulty: 'easy',
    question: '5人から3人を選ぶ組合せの数を求めよ。',
    options: ['10', '60', '20', '15'],
    correctAnswer: 0,
    explanation: '₅C₃ = 5!/(3!×2!) = (5×4)/(2×1) = 10',
    targetDeviation: 45
  },
  {
    subject: '数学A',
    gradeLevel: 1,
    unit: '確率',
    difficulty: 'medium',
    question: 'サイコロを2回投げて、出た目の和が7になる確率を求めよ。',
    options: ['1/6', '1/9', '1/12', '5/36'],
    correctAnswer: 0,
    explanation: '和が7になる組合せは (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) の6通り。全体は36通りなので、確率は 6/36 = 1/6',
    targetDeviation: 50
  },

  // ========== 高2数学II ==========
  // 4月：式と証明
  {
    subject: '数学II',
    gradeLevel: 2,
    unit: '式と証明',
    difficulty: 'medium',
    question: '恒等式 ax² + bx + c = 2x² - 3x + 1 が成り立つとき、a + b + c の値を求めよ。',
    options: ['0', '1', '2', '-1'],
    correctAnswer: 0,
    explanation: '係数比較より a = 2, b = -3, c = 1。よって a + b + c = 2 + (-3) + 1 = 0',
    targetDeviation: 50
  },
  {
    subject: '数学II',
    gradeLevel: 2,
    unit: '複素数と方程式',
    difficulty: 'medium',
    question: '複素数 (1 + i)² の値を求めよ。',
    options: ['2i', '-2i', '1 + 2i', '1 - 2i'],
    correctAnswer: 0,
    explanation: '(1 + i)² = 1 + 2i + i² = 1 + 2i - 1 = 2i',
    targetDeviation: 50
  },

  // 7月：三角関数
  {
    subject: '数学II',
    gradeLevel: 2,
    unit: '三角関数',
    difficulty: 'easy',
    question: 'sin 30° の値を求めよ。',
    options: ['1/2', '√3/2', '√2/2', '1'],
    correctAnswer: 0,
    explanation: '30°-60°-90°の直角三角形より、sin 30° = 1/2',
    targetDeviation: 40
  },
  {
    subject: '数学II',
    gradeLevel: 2,
    unit: '三角関数',
    difficulty: 'hard',
    question: 'sin²θ + cos²θ = 1 を用いて、tan²θ + 1 の値を求めよ。',
    options: ['1/cos²θ', '1/sin²θ', 'sin²θ', 'cos²θ'],
    correctAnswer: 0,
    explanation: '両辺を cos²θ で割ると、tan²θ + 1 = 1/cos²θ',
    targetDeviation: 60
  },

  // ========== 高2数学B ==========
  {
    subject: '数学B',
    gradeLevel: 2,
    unit: '数列',
    difficulty: 'easy',
    question: '初項3、公差2の等差数列の第5項を求めよ。',
    options: ['11', '13', '9', '15'],
    correctAnswer: 0,
    explanation: 'aₙ = a₁ + (n-1)d より、a₅ = 3 + (5-1)×2 = 3 + 8 = 11',
    targetDeviation: 45
  },
  {
    subject: '数学B',
    gradeLevel: 2,
    unit: 'ベクトル',
    difficulty: 'medium',
    question: 'ベクトル a = (2, 3)、b = (1, -1) のとき、a + b を求めよ。',
    options: ['(3, 2)', '(3, 4)', '(1, 4)', '(1, 2)'],
    correctAnswer: 0,
    explanation: 'a + b = (2+1, 3+(-1)) = (3, 2)',
    targetDeviation: 50
  },

  // ========== 高3数学III ==========
  {
    subject: '数学III',
    gradeLevel: 3,
    unit: '極限',
    difficulty: 'medium',
    question: 'lim[x→∞] (1/x) の値を求めよ。',
    options: ['0', '1', '∞', '存在しない'],
    correctAnswer: 0,
    explanation: 'x が無限大に近づくとき、1/x は 0 に収束する',
    targetDeviation: 50
  },
  {
    subject: '数学III',
    gradeLevel: 3,
    unit: '微分法',
    difficulty: 'easy',
    question: 'f(x) = x³ のとき、f\'(x) を求めよ。',
    options: ['3x²', '3x', 'x²', 'x³/3'],
    correctAnswer: 0,
    explanation: 'xⁿ の微分は nxⁿ⁻¹ なので、f\'(x) = 3x²',
    targetDeviation: 45
  },
  {
    subject: '数学III',
    gradeLevel: 3,
    unit: '積分法',
    difficulty: 'medium',
    question: '∫x² dx を求めよ。',
    options: ['x³/3 + C', 'x³ + C', '2x + C', '3x² + C'],
    correctAnswer: 0,
    explanation: 'xⁿ の積分は xⁿ⁺¹/(n+1) + C なので、∫x² dx = x³/3 + C',
    targetDeviation: 50
  },

  // ========== 高3数学C ==========
  {
    subject: '数学C',
    gradeLevel: 3,
    unit: '平面上の曲線',
    difficulty: 'medium',
    question: '円 x² + y² = 4 の半径を求めよ。',
    options: ['2', '4', '1', '√2'],
    correctAnswer: 0,
    explanation: 'x² + y² = r² の形なので、r² = 4 より r = 2',
    targetDeviation: 50
  },
  {
    subject: '数学C',
    gradeLevel: 3,
    unit: '複素数平面',
    difficulty: 'hard',
    question: '複素数 z = 1 + i の偏角を求めよ。',
    options: ['π/4', 'π/2', 'π/3', 'π/6'],
    correctAnswer: 0,
    explanation: 'tan θ = 1/1 = 1 より、θ = π/4',
    targetDeviation: 60
  }
];

// データ投入関数
async function seedMoreProblems() {
  console.log('拡張版問題データの投入を開始します...');
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const problem of allProblems) {
    try {
      // 既存の問題をチェック（重複を避ける）
      const existingQuery = query(
        collection(db, 'problems'),
        where('question', '==', problem.question)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        skipCount++;
        console.log(`スキップ: 既に存在します - ${problem.question.substring(0, 30)}...`);
        continue;
      }
      
      // 新規問題を追加
      await db.collection('problems').add({
        ...problem,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      successCount++;
      console.log(`✓ 追加成功 (${successCount}): ${problem.subject} - ${problem.unit}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ エラー: ${problem.question.substring(0, 30)}...`, error.message);
    }
  }

  console.log('\n========== 投入結果 ==========');
  console.log(`✓ 成功: ${successCount} 件`);
  console.log(`→ スキップ: ${skipCount} 件（既存）`);
  console.log(`✗ エラー: ${errorCount} 件`);
  console.log(`合計処理: ${allProblems.length} 件`);
  console.log('===============================\n');
}

// インポート用の関数も追加
const { query, where, getDocs } = require('firebase/firestore');

// 実行
seedMoreProblems()
  .then(() => {
    console.log('拡張版問題データの投入が完了しました！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  });