// components/MathText.tsx
import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathTextProps {
  text: string;
  block?: boolean;
}

const MathText: React.FC<MathTextProps> = ({ text, block = false }) => {
  // LaTeX形式を抽出して変換
  const renderMathText = () => {
    // インライン数式: $...$ または \(...\)
    // ブロック数式: $$...$$ または \[...\]
    
    if (block) {
      const cleanText = text
        .replace(/^\$\$/, '')
        .replace(/\$\$$/, '')
        .replace(/^\\\[/, '')
        .replace(/\\\]$/, '');
      return <BlockMath math={cleanText} />;
    }
    
    const cleanText = text
      .replace(/^\$/, '')
      .replace(/\$$/, '')
      .replace(/^\\\(/, '')
      .replace(/\\\)$/, '');
    return <InlineMath math={cleanText} />;
  };

  return renderMathText();
};

export default MathText;