import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import { essayAnalyzer } from '@/lib/essay/essayAnalyzer';

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // トークン検証（Firebaseの場合）
    try {
      await auth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { error: '無効な認証トークンです' },
        { status: 401 }
      );
    }

    // リクエストボディの取得
    const body = await request.json();
    const { theme, content, submissionId } = body;

    if (!theme || !content || !submissionId) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    // 小論文の評価を実行
    const submission = {
      id: submissionId,
      themeId: theme.id,
      content: content,
      wordCount: content.length
    };

    const evaluation = await essayAnalyzer.analyzeEssay(submission, theme);

    // 評価結果を整形
    const formattedEvaluation = {
      totalScore: evaluation.overallScore,
      criteria: {
        logic: {
          score: evaluation.scores.logic.score,
          maxScore: 10,
          comment: evaluation.scores.logic.feedback
        },
        concreteness: {
          score: evaluation.scores.specificity.score,
          maxScore: 10,
          comment: evaluation.scores.specificity.feedback
        },
        originality: {
          score: evaluation.scores.relevance.score,
          maxScore: 10,
          comment: evaluation.scores.relevance.feedback
        },
        structure: {
          score: evaluation.scores.structure.score,
          maxScore: 10,
          comment: evaluation.scores.structure.feedback
        }
      },
      strengths: evaluation.feedback.strengths,
      improvements: evaluation.feedback.improvements,
      overallComment: evaluation.feedback.suggestions.join(' '),
      wordCount: {
        actual: content.length,
        limit: theme.wordLimit || theme.maxLength,
        withinLimit: content.length <= (theme.wordLimit || theme.maxLength)
      }
    };

    return NextResponse.json({
      success: true,
      evaluation: formattedEvaluation
    });

  } catch (error) {
    console.error('Essay evaluation error:', error);
    return NextResponse.json(
      { error: '評価中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
