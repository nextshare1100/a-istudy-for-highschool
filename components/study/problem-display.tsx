import React from 'react';

// MathDisplayの代替実装
const MathDisplay = ({ children }: { children: React.ReactNode }) => {
  return <div className="math-display">{children}</div>;
};

// 元のproblem-displayコンポーネントのコードをここに配置
// 一時的にシンプルなコンポーネントを使用
export function ProblemDisplay({ problem }: { problem: any }) {
  return (
    <div className="problem-display">
      <h3>{problem?.title || 'Problem'}</h3>
      <div>{problem?.content || 'No content'}</div>
      {problem?.hasMath && <MathDisplay>{problem.mathContent}</MathDisplay>}
    </div>
  );
}
