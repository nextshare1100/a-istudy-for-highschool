'use client';

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Lightbulb,
  Award,
  Target,
  ChevronRight
} from 'lucide-react';

interface EvaluationResultProps {
  evaluation: any;
  essay: string;
}

export function EvaluationResult({ evaluation, essay }: EvaluationResultProps) {
  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const criteriaLabels = {
    structure: '論理構成',
    argument: '論証力',
    expression: '表現力',
    originality: '独創性'
  };

  return (
    <div className="evaluation-result">
      {/* 総合スコア */}
      <div className="score-summary">
        <div className="total-score">
          <div className="score-circle">
            <svg width="120" height="120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={getScoreColor(evaluation.totalScore, 100)}
                strokeWidth="10"
                strokeDasharray={`${(evaluation.totalScore / 100) * 314} 314`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="score-text">
              <div className="score-value">{evaluation.totalScore}</div>
              <div className="score-label">/ 100</div>
            </div>
          </div>
        </div>
        
        <div className="score-breakdown">
          {Object.entries(evaluation.scores).map(([key, score]) => (
            <div key={key} className="criteria-score">
              <div className="criteria-header">
                <span className="criteria-label">{criteriaLabels[key as keyof typeof criteriaLabels]}</span>
                <span className="criteria-value">{score as number}/25</span>
              </div>
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ 
                    width: `${((score as number) / 25) * 100}%`,
                    backgroundColor: getScoreColor(score as number, 25)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 総評 */}
      <div className="evaluation-section">
        <h3 className="section-title">
          <MessageSquare size={18} />
          総評
        </h3>
        <p className="summary-text">{evaluation.summary}</p>
      </div>

      {/* 良い点 */}
      <div className="evaluation-section">
        <h3 className="section-title">
          <Award size={18} />
          優れている点
        </h3>
        <ul className="feedback-list strengths">
          {evaluation.strengths.map((strength: string, index: number) => (
            <li key={index}>
              <ChevronRight size={14} />
              {strength}
            </li>
          ))}
        </ul>
      </div>

      {/* 改善点 */}
      <div className="evaluation-section">
        <h3 className="section-title">
          <Target size={18} />
          改善できる点
        </h3>
        <ul className="feedback-list improvements">
          {evaluation.improvements.map((improvement: string, index: number) => (
            <li key={index}>
              <ChevronRight size={14} />
              {improvement}
            </li>
          ))}
        </ul>
      </div>

      {/* 詳細フィードバック */}
      <div className="detailed-feedback">
        <h3 className="section-title">
          <BarChart3 size={18} />
          詳細な評価
        </h3>
        <div className="feedback-tabs">
          {Object.entries(evaluation.detailedFeedback).map(([key, feedback]) => (
            <details key={key} className="feedback-detail">
              <summary>{criteriaLabels[key as keyof typeof criteriaLabels]}</summary>
              <p>{feedback as string}</p>
            </details>
          ))}
        </div>
      </div>

      {/* 次回への提案 */}
      <div className="evaluation-section">
        <h3 className="section-title">
          <Lightbulb size={18} />
          次回への提案
        </h3>
        <div className="next-steps">
          {evaluation.nextSteps.map((step: string, index: number) => (
            <div key={index} className="step-card">
              <div className="step-number">{index + 1}</div>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .evaluation-result {
          max-width: 800px;
          margin: 0 auto;
        }

        .score-summary {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 24px;
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 20px;
        }

        .total-score {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .score-circle {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .score-text {
          position: absolute;
          text-align: center;
        }

        .score-value {
          font-size: 36px;
          font-weight: 700;
          color: #2d3436;
        }

        .score-label {
          font-size: 14px;
          color: #636e72;
        }

        .score-breakdown {
          display: grid;
          gap: 16px;
        }

        .criteria-score {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .criteria-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .criteria-label {
          font-size: 14px;
          font-weight: 500;
          color: #2d3436;
        }

        .criteria-value {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
        }

        .score-bar {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          transition: width 0.5s ease;
        }

        .evaluation-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 16px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 16px;
        }

        .summary-text {
          color: #636e72;
          line-height: 1.6;
        }

        .feedback-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feedback-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 0;
          color: #636e72;
          line-height: 1.5;
        }

        .feedback-list.strengths li {
          color: #22c55e;
        }

        .feedback-list.improvements li {
          color: #f59e0b;
        }

        .detailed-feedback {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 16px;
        }

        .feedback-tabs {
          display: grid;
          gap: 12px;
        }

        .feedback-detail {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
        }

        .feedback-detail summary {
          padding: 12px 16px;
          background: #f8f9fa;
          cursor: pointer;
          font-weight: 500;
          color: #2d3436;
        }

        .feedback-detail[open] summary {
          border-bottom: 1px solid #e0e0e0;
        }

        .feedback-detail p {
          padding: 16px;
          margin: 0;
          color: #636e72;
          line-height: 1.6;
        }

        .next-steps {
          display: grid;
          gap: 12px;
        }

        .step-card {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          align-items: flex-start;
        }

        .step-number {
          width: 24px;
          height: 24px;
          background: #667eea;
          color: white;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .step-card p {
          margin: 0;
          color: #636e72;
          line-height: 1.5;
          flex: 1;
        }

        @media (max-width: 640px) {
          .score-summary {
            grid-template-columns: 1fr;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
