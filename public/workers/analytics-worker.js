// Analytics Web Worker - Production Ready
'use strict';

// エラーハンドリング用のラッパー
function safeExecute(operation, data) {
  try {
    switch (operation) {
      case 'aggregateWeekly':
        return aggregateByWeek(data);
      
      case 'calculateTrends':
        return calculateTrends(data);
      
      case 'generateHeatmap':
        return generateHeatmapData(data);
      
      case 'analyzeWeakness':
        return analyzeWeaknessPatterns(data);
      
      case 'predictScores':
        return predictScores(data);
      
      case 'batchProcess':
        return batchProcessData(data);
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    throw {
      error: error.message || 'Processing failed',
      operation,
      stack: error.stack
    };
  }
}

// メインメッセージハンドラー
self.addEventListener('message', function(e) {
  const { data, operation, id } = e.data;
  
  // リクエストIDを使用してレスポンスを追跡
  const requestId = id || `${operation}-${Date.now()}`;
  
  try {
    // 入力検証
    if (!operation) {
      throw new Error('Operation is required');
    }
    
    if (!data) {
      throw new Error('Data is required');
    }
    
    // 処理実行
    const result = safeExecute(operation, data);
    
    // 成功レスポンス
    self.postMessage({
      id: requestId,
      success: true,
      result,
      operation
    });
    
  } catch (error) {
    // エラーレスポンス
    self.postMessage({
      id: requestId,
      success: false,
      error: error.error || error.message || 'Unknown error',
      operation,
      stack: error.stack
    });
  }
});

// 週次集計（最適化版）
function aggregateByWeek(data) {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  const weeks = new Map();
  
  for (const item of data) {
    // 入力検証
    if (!item.date || !item.time || item.score === undefined) {
      continue; // 不正なデータはスキップ
    }
    
    const week = getWeekNumber(new Date(item.date));
    
    if (!weeks.has(week)) {
      weeks.set(week, {
        totalTime: 0,
        totalScore: 0,
        count: 0,
        subjects: new Map()
      });
    }
    
    const weekData = weeks.get(week);
    weekData.totalTime += item.time;
    weekData.totalScore += item.score;
    weekData.count++;
    
    // 科目別集計
    if (item.subject) {
      if (!weekData.subjects.has(item.subject)) {
        weekData.subjects.set(item.subject, {
          time: 0,
          score: 0,
          count: 0
        });
      }
      
      const subjectData = weekData.subjects.get(item.subject);
      subjectData.time += item.time;
      subjectData.score += item.score;
      subjectData.count++;
    }
  }
  
  // 結果を配列に変換
  const result = [];
  
  for (const [week, data] of weeks) {
    const subjects = [];
    
    for (const [subject, subData] of data.subjects) {
      subjects.push({
        subject,
        avgTime: subData.count > 0 ? subData.time / subData.count : 0,
        avgScore: subData.count > 0 ? subData.score / subData.count : 0,
        totalTime: subData.time,
        totalScore: subData.score,
        count: subData.count
      });
    }
    
    result.push({
      week,
      avgTime: data.count > 0 ? data.totalTime / data.count : 0,
      avgScore: data.count > 0 ? data.totalScore / data.count : 0,
      totalTime: data.totalTime,
      totalScore: data.totalScore,
      count: data.count,
      subjects: subjects.sort((a, b) => b.totalTime - a.totalTime)
    });
  }
  
  return result.sort((a, b) => a.week - b.week);
}

// トレンド計算（高精度版）
function calculateTrends(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { subjects: {}, overall: null };
  }
  
  // 科目別にグループ化
  const subjects = new Map();
  
  for (const item of data) {
    if (!item.subject || !item.date || item.score === undefined) {
      continue;
    }
    
    if (!subjects.has(item.subject)) {
      subjects.set(item.subject, []);
    }
    
    subjects.get(item.subject).push({
      date: new Date(item.date).getTime(),
      score: item.score,
      time: item.time || 0
    });
  }
  
  // 各科目のトレンドを計算
  const trends = {};
  
  for (const [subject, points] of subjects) {
    // 日付でソート
    points.sort((a, b) => a.date - b.date);
    
    if (points.length < 2) {
      trends[subject] = {
        trend: 'insufficient_data',
        slope: 0,
        intercept: 0,
        r2: 0,
        avgScore: points[0]?.score || 0,
        lastScore: points[0]?.score || 0,
        improvement: 0,
        studyTimeCorrelation: 0
      };
      continue;
    }
    
    // 線形回帰（最小二乗法）
    const regression = calculateLinearRegression(points);
    
    // 学習時間との相関を計算
    const timeCorrelation = calculateCorrelation(
      points.map(p => p.time),
      points.map(p => p.score)
    );
    
    trends[subject] = {
      ...regression,
      avgScore: points.reduce((sum, p) => sum + p.score, 0) / points.length,
      lastScore: points[points.length - 1].score,
      improvement: ((points[points.length - 1].score - points[0].score) / points[0].score) * 100,
      studyTimeCorrelation: timeCorrelation,
      dataPoints: points.length
    };
  }
  
  // 全体トレンドの計算
  const allPoints = [];
  for (const [, points] of subjects) {
    allPoints.push(...points);
  }
  
  let overallTrend = null;
  if (allPoints.length >= 2) {
    allPoints.sort((a, b) => a.date - b.date);
    overallTrend = calculateLinearRegression(allPoints);
  }
  
  return { subjects: trends, overall: overallTrend };
}

// 線形回帰計算
function calculateLinearRegression(points) {
  const n = points.length;
  
  // 正規化（数値の安定性のため）
  const minDate = Math.min(...points.map(p => p.date));
  const dateRange = Math.max(...points.map(p => p.date)) - minDate;
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  
  for (const point of points) {
    const x = (point.date - minDate) / (dateRange || 1); // 0-1に正規化
    const y = point.score;
    
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }
  
  const denominator = n * sumX2 - sumX * sumX;
  
  if (Math.abs(denominator) < 1e-10) {
    // 分母が0に近い場合（すべての点が同じx座標）
    return {
      slope: 0,
      intercept: sumY / n,
      r2: 0,
      trend: 'stable'
    };
  }
  
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  
  // 決定係数（R²）の計算
  const yMean = sumY / n;
  const ssTotal = sumY2 - n * yMean * yMean;
  const ssResidual = points.reduce((sum, point, i) => {
    const x = (point.date - minDate) / (dateRange || 1);
    const yPred = slope * x + intercept;
    const residual = point.score - yPred;
    return sum + residual * residual;
  }, 0);
  
  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
  
  // トレンドの判定（正規化されたスロープを元に戻す）
  const actualSlope = slope * (dateRange > 0 ? 1 / dateRange : 0) * 1000 * 60 * 60 * 24; // 1日あたりの変化
  
  let trend;
  if (Math.abs(actualSlope) < 0.1) {
    trend = 'stable';
  } else if (actualSlope > 0) {
    trend = actualSlope > 0.5 ? 'improving_fast' : 'improving';
  } else {
    trend = actualSlope < -0.5 ? 'declining_fast' : 'declining';
  }
  
  return {
    slope: actualSlope,
    intercept,
    r2: Math.max(0, Math.min(1, r2)),
    trend
  };
}

// 相関係数計算
function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length < 2) {
    return 0;
  }
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

// ヒートマップデータ生成（メモリ効率版）
function generateHeatmapData(data) {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  // ユニークな科目と単元を収集
  const subjectsSet = new Set();
  const unitsSet = new Set();
  const matrix = new Map();
  
  // データを処理
  for (const item of data) {
    if (!item.subject || !item.unit || item.accuracy === undefined) {
      continue;
    }
    
    subjectsSet.add(item.subject);
    unitsSet.add(item.unit);
    
    const key = `${item.subject}|${item.unit}`;
    
    if (!matrix.has(key)) {
      matrix.set(key, {
        accuracies: [],
        count: 0,
        totalTime: 0
      });
    }
    
    const cell = matrix.get(key);
    cell.accuracies.push(item.accuracy);
    cell.count++;
    cell.totalTime += item.time || 0;
  }
  
  // 配列に変換
  const subjects = Array.from(subjectsSet).sort();
  const units = Array.from(unitsSet).sort();
  
  // マトリックスデータを生成
  const matrixData = [];
  
  for (const [key, cell] of matrix) {
    const [subject, unit] = key.split('|');
    const avgAccuracy = cell.accuracies.reduce((a, b) => a + b, 0) / cell.accuracies.length;
    
    // 標準偏差を計算
    const variance = cell.accuracies.reduce((sum, acc) => {
      const diff = acc - avgAccuracy;
      return sum + diff * diff;
    }, 0) / cell.accuracies.length;
    const stdDev = Math.sqrt(variance);
    
    matrixData.push({
      subject,
      unit,
      accuracy: avgAccuracy,
      count: cell.count,
      totalTime: cell.totalTime,
      avgTime: cell.totalTime / cell.count,
      stdDev,
      trend: calculateItemTrend(cell.accuracies),
      confidence: calculateConfidence(cell.count, stdDev)
    });
  }
  
  return { 
    subjects, 
    units, 
    matrix: matrixData,
    stats: {
      totalDataPoints: data.length,
      avgAccuracy: matrixData.reduce((sum, item) => sum + item.accuracy, 0) / matrixData.length,
      coverage: (matrixData.length / (subjects.length * units.length)) * 100
    }
  };
}

// 弱点パターン分析（詳細版）
function analyzeWeaknessPatterns(data) {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  const grouped = new Map();
  
  // データをグループ化
  for (const item of data) {
    if (!item.subject || !item.unit) {
      continue;
    }
    
    const key = `${item.subject}|${item.unit}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, {
        subject: item.subject,
        unit: item.unit,
        correct: 0,
        incorrect: 0,
        patterns: new Map(),
        timeSpent: 0,
        timestamps: [],
        difficulties: []
      });
    }
    
    const group = grouped.get(key);
    
    if (item.isCorrect) {
      group.correct++;
    } else {
      group.incorrect++;
      
      // エラーパターンを記録
      if (item.errorType) {
        const count = group.patterns.get(item.errorType) || 0;
        group.patterns.set(item.errorType, count + 1);
      }
    }
    
    group.timeSpent += item.timeSpent || 0;
    group.timestamps.push(new Date(item.timestamp || Date.now()).getTime());
    
    if (item.difficulty !== undefined) {
      group.difficulties.push(item.difficulty);
    }
  }
  
  // 弱点スコアを計算
  const weaknesses = [];
  
  for (const [key, item] of grouped) {
    const total = item.correct + item.incorrect;
    
    if (total === 0) continue;
    
    const accuracy = (item.correct / total) * 100;
    const avgTime = item.timeSpent / total;
    
    // エラーパターンをソート
    const topPatterns = Array.from(item.patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({
        pattern,
        count,
        percentage: (count / item.incorrect) * 100
      }));
    
    // 時系列分析
    const timeAnalysis = analyzeTimeProgression(item.timestamps, accuracy);
    
    // 難易度分析
    const avgDifficulty = item.difficulties.length > 0
      ? item.difficulties.reduce((a, b) => a + b, 0) / item.difficulties.length
      : 0;
    
    weaknesses.push({
      subject: item.subject,
      unit: item.unit,
      accuracy,
      totalQuestions: total,
      correctCount: item.correct,
      incorrectCount: item.incorrect,
      avgTimePerQuestion: avgTime,
      weaknessScore: calculateAdvancedWeaknessScore(accuracy, total, timeAnalysis, avgDifficulty),
      topErrorPatterns: topPatterns,
      timeProgression: timeAnalysis,
      avgDifficulty,
      confidenceLevel: calculateStatisticalConfidence(total, accuracy)
    });
  }
  
  // 弱点スコアでソート（降順）
  return weaknesses.sort((a, b) => b.weaknessScore - a.weaknessScore);
}

// 高度な弱点スコア計算
function calculateAdvancedWeaknessScore(accuracy, totalQuestions, timeAnalysis, avgDifficulty) {
  // 基本スコア（正答率の逆数）
  let score = 100 - accuracy;
  
  // 問題数による重み（少なすぎる場合はペナルティ）
  if (totalQuestions < 10) {
    score *= 0.7;
  } else if (totalQuestions < 20) {
    score *= 0.85;
  }
  
  // 時系列トレンドによる調整
  if (timeAnalysis.trend === 'improving') {
    score *= 0.8;
  } else if (timeAnalysis.trend === 'declining') {
    score *= 1.2;
  }
  
  // 難易度による調整
  if (avgDifficulty > 4) {
    score *= 0.9; // 難しい問題なら弱点スコアを下げる
  } else if (avgDifficulty < 2) {
    score *= 1.1; // 簡単な問題なら弱点スコアを上げる
  }
  
  return Math.max(0, Math.min(100, score));
}

// スコア予測（機械学習風）
function predictScores(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      currentAvg: 0,
      predictions: {},
      confidence: 'low',
      recommendations: []
    };
  }
  
  // 日付別にデータを集計
  const dailyScores = new Map();
  
  for (const item of data) {
    if (!item.date || item.score === undefined) {
      continue;
    }
    
    const date = item.date.split('T')[0];
    
    if (!dailyScores.has(date)) {
      dailyScores.set(date, {
        scores: [],
        studyTime: 0,
        subjects: new Set()
      });
    }
    
    const daily = dailyScores.get(date);
    daily.scores.push(item.score);
    daily.studyTime += item.duration || 0;
    
    if (item.subject) {
      daily.subjects.add(item.subject);
    }
  }
  
  // 配列に変換してソート
  const scoreData = Array.from(dailyScores.entries())
    .map(([date, data]) => ({
      date,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      studyTime: data.studyTime,
      subjectCount: data.subjects.size
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (scoreData.length < 7) {
    return {
      currentAvg: scoreData[scoreData.length - 1]?.avgScore || 0,
      predictions: {},
      confidence: 'low',
      recommendations: ['より多くのデータが必要です（最低7日間）']
    };
  }
  
  // 移動平均を計算
  const movingAvg7 = calculateMovingAverage(scoreData.map(d => d.avgScore), 7);
  const movingAvg30 = calculateMovingAverage(scoreData.map(d => d.avgScore), 30);
  
  // トレンド分析
  const recentData = scoreData.slice(-30);
  const trend = calculateLinearRegression(
    recentData.map((d, i) => ({
      date: i,
      score: d.avgScore
    }))
  );
  
  // 学習時間との相関
  const timeCorrelation = calculateCorrelation(
    recentData.map(d => d.studyTime),
    recentData.map(d => d.avgScore)
  );
  
  // 予測を生成
  const currentAvg = movingAvg7[movingAvg7.length - 1];
  const predictions = {};
  
  // 1週間後の予測
  predictions.oneWeek = Math.max(0, Math.min(100, currentAvg + trend.slope * 7));
  
  // 1ヶ月後の予測
  predictions.oneMonth = Math.max(0, Math.min(100, currentAvg + trend.slope * 30));
  
  // 3ヶ月後の予測（減衰を考慮）
  const decayFactor = 0.9; // 長期予測の減衰
  predictions.threeMonths = Math.max(0, Math.min(100, 
    currentAvg + trend.slope * 90 * decayFactor
  ));
  
  // 信頼度の計算
  let confidence;
  if (trend.r2 > 0.7 && scoreData.length > 30) {
    confidence = 'high';
  } else if (trend.r2 > 0.4 || scoreData.length > 14) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  // 推奨事項の生成
  const recommendations = generateRecommendations(
    currentAvg,
    trend,
    timeCorrelation,
    recentData
  );
  
  return {
    currentAvg,
    weeklyTrend: trend.slope * 7,
    monthlyAvg: movingAvg30[movingAvg30.length - 1] || currentAvg,
    predictions,
    confidence,
    studyTimeCorrelation: timeCorrelation,
    recommendations,
    analysisDetails: {
      dataPoints: scoreData.length,
      trendR2: trend.r2,
      volatility: calculateVolatility(scoreData.map(d => d.avgScore))
    }
  };
}

// バッチ処理（大量データ用）
function batchProcessData(data) {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  const batchSize = 1000;
  const results = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    // バッチごとに処理
    const batchResult = {
      startIndex: i,
      endIndex: Math.min(i + batchSize, data.length),
      processedCount: batch.length,
      summary: processBatch(batch)
    };
    
    results.push(batchResult);
  }
  
  return {
    totalProcessed: data.length,
    batches: results,
    overallSummary: mergeResults(results)
  };
}

// ヘルパー関数群

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function calculateItemTrend(values) {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const diff = secondAvg - firstAvg;
  
  if (Math.abs(diff) < 5) return 'stable';
  return diff > 0 ? 'improving' : 'declining';
}

function calculateMovingAverage(data, window) {
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const subset = data.slice(start, i + 1);
    const avg = subset.reduce((sum, val) => sum + val, 0) / subset.length;
    result.push(avg);
  }
  
  return result;
}

function calculateConfidence(sampleSize, stdDev) {
  if (sampleSize < 5) return 'very_low';
  if (sampleSize < 10) return 'low';
  if (sampleSize < 30) return 'medium';
  
  // 標準偏差も考慮
  if (stdDev > 20) return 'medium';
  
  return 'high';
}

function calculateStatisticalConfidence(sampleSize, accuracy) {
  // 二項分布の信頼区間を簡易計算
  const z = 1.96; // 95%信頼区間
  const p = accuracy / 100;
  const margin = z * Math.sqrt((p * (1 - p)) / sampleSize);
  
  return {
    lower: Math.max(0, (p - margin) * 100),
    upper: Math.min(100, (p + margin) * 100),
    margin: margin * 100
  };
}

function analyzeTimeProgression(timestamps, currentAccuracy) {
  if (timestamps.length < 2) {
    return { trend: 'insufficient_data', improvement: 0 };
  }
  
  // タイムスタンプをソート
  timestamps.sort((a, b) => a - b);
  
  // 期間を3分割して傾向を分析
  const third = Math.floor(timestamps.length / 3);
  const periods = [
    timestamps.slice(0, third),
    timestamps.slice(third, third * 2),
    timestamps.slice(third * 2)
  ];
  
  // 各期間の密度を計算（学習頻度）
  const densities = periods.map(period => {
    if (period.length < 2) return 0;
    const duration = period[period.length - 1] - period[0];
    return duration > 0 ? period.length / duration : 0;
  });
  
  // トレンドを判定
  let trend = 'stable';
  if (densities[2] > densities[0] * 1.2) {
    trend = 'increasing_activity';
  } else if (densities[2] < densities[0] * 0.8) {
    trend = 'decreasing_activity';
  }
  
  return {
    trend,
    densities,
    totalDuration: timestamps[timestamps.length - 1] - timestamps[0],
    avgInterval: (timestamps[timestamps.length - 1] - timestamps[0]) / (timestamps.length - 1)
  };
}

function calculateVolatility(values) {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => {
    const diff = val - mean;
    return sum + diff * diff;
  }, 0) / values.length;
  
  return Math.sqrt(variance);
}

function generateRecommendations(currentAvg, trend, timeCorrelation, recentData) {
  const recommendations = [];
  
  // スコアベースの推奨
  if (currentAvg < 60) {
    recommendations.push('基礎的な内容の復習を強化することをお勧めします');
  } else if (currentAvg > 80) {
    recommendations.push('応用問題にチャレンジして、さらなる向上を目指しましょう');
  }
  
  // トレンドベースの推奨
  if (trend.trend === 'declining' || trend.trend === 'declining_fast') {
    recommendations.push('最近パフォーマンスが低下しています。休憩を取るか、学習方法を見直してみてください');
  } else if (trend.trend === 'improving_fast') {
    recommendations.push('素晴らしい改善が見られます！この調子を維持しましょう');
  }
  
  // 学習時間相関ベースの推奨
  if (Math.abs(timeCorrelation) < 0.3) {
    recommendations.push('学習時間とスコアの相関が低いです。学習の質を向上させることに焦点を当てましょう');
  } else if (timeCorrelation > 0.7) {
    recommendations.push('学習時間がスコアに良い影響を与えています。計画的な学習を続けてください');
  }
  
  // 学習パターンベースの推奨
  const avgStudyTime = recentData.reduce((sum, d) => sum + d.studyTime, 0) / recentData.length;
  if (avgStudyTime < 30) {
    recommendations.push('1日の学習時間を増やすことで、より良い結果が期待できます');
  } else if (avgStudyTime > 300) {
    recommendations.push('長時間の学習が続いています。適度な休憩を取ることも大切です');
  }
  
  return recommendations;
}

function processBatch(batch) {
  // バッチの要約統計を計算
  const summary = {
    count: batch.length,
    avgScore: 0,
    minScore: Infinity,
    maxScore: -Infinity,
    subjects: new Set()
  };
  
  let totalScore = 0;
  
  for (const item of batch) {
    if (item.score !== undefined) {
      totalScore += item.score;
      summary.minScore = Math.min(summary.minScore, item.score);
      summary.maxScore = Math.max(summary.maxScore, item.score);
    }
    
    if (item.subject) {
      summary.subjects.add(item.subject);
    }
  }
  
  summary.avgScore = batch.length > 0 ? totalScore / batch.length : 0;
  summary.subjectCount = summary.subjects.size;
  summary.subjects = Array.from(summary.subjects);
  
  return summary;
}

function mergeResults(results) {
  // 全バッチの結果をマージ
  const merged = {
    totalCount: 0,
    overallAvgScore: 0,
    globalMinScore: Infinity,
    globalMaxScore: -Infinity,
    allSubjects: new Set()
  };
  
  let weightedScoreSum = 0;
  
  for (const result of results) {
    const summary = result.summary;
    merged.totalCount += summary.count;
    weightedScoreSum += summary.avgScore * summary.count;
    merged.globalMinScore = Math.min(merged.globalMinScore, summary.minScore);
    merged.globalMaxScore = Math.max(merged.globalMaxScore, summary.maxScore);
    
    for (const subject of summary.subjects) {
      merged.allSubjects.add(subject);
    }
  }
  
  merged.overallAvgScore = merged.totalCount > 0 ? weightedScoreSum / merged.totalCount : 0;
  merged.uniqueSubjects = Array.from(merged.allSubjects);
  merged.subjectCount = merged.uniqueSubjects.length;
  
  return merged;
}

// エラーハンドリングとロギング
self.addEventListener('error', function(e) {
  console.error('Worker error:', e);
  self.postMessage({
    error: 'Worker encountered an error',
    details: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno
  });
});

self.addEventListener('unhandledrejection', function(e) {
  console.error('Worker unhandled rejection:', e);
  self.postMessage({
    error: 'Worker unhandled promise rejection',
    reason: e.reason
  });
});