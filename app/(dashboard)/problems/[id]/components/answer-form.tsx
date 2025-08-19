'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, GripVertical } from 'lucide-react';

interface Problem {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: number | string | string[];
  explanation?: string;
  format?: string;
  requiredCount?: number;
  unnecessaryOptions?: string[];
}

interface AnswerFormProps {
  problem: Problem;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}

const AnswerForm: React.FC<AnswerFormProps> = ({ problem, onSubmit, disabled = false }) => {
  const [answer, setAnswer] = useState<any>('');
  const [fillInAnswers, setFillInAnswers] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState<number | null>(null);

  // 問題タイプに応じて初期化
  useEffect(() => {
    if (!problem) return;

    switch (problem.type) {
      case 'solution_sequence':
      case 'sentence_sequence':
      case 'event_sequence':
        // 正解の数をチェックして選択式かどうか判定
        if (typeof problem.correctAnswer === 'string' && problem.correctAnswer.includes(',')) {
          const correctLabels = problem.correctAnswer.split(',').map(s => s.trim());
          const totalOptions = problem.options?.length || 0;
          
          // 正解の数が選択肢の総数より少ない場合は選択式
          if (correctLabels.length < totalOptions) {
            setSelectedItems([]); // 選択式は空から始める
          } else {
            // 通常の並び替え（全部使う）
            const labels = problem.options?.map((_, index) => 
              String.fromCharCode(65 + index)
            ) || [];
            setSelectedItems(labels);
          }
        } else {
          // 通常の並び替え
          const labels = problem.options?.map((_, index) => 
            String.fromCharCode(65 + index)
          ) || [];
          setSelectedItems(labels);
        }
        break;
      
      case 'fill_in_blank':
        const blanks = (problem.question.match(/\(\)/g) || []).length;
        setFillInAnswers(new Array(blanks).fill(''));
        break;
      
      default:
        setAnswer('');
    }
  }, [problem]);

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let submitAnswer;
    switch (problem.type) {
      case 'solution_sequence':
      case 'sentence_sequence':
      case 'event_sequence':
        submitAnswer = selectedItems.join(', ');
        break;
      
      case 'fill_in_blank':
        submitAnswer = fillInAnswers;
        break;
      
      default:
        submitAnswer = answer;
    }
    
    onSubmit(submitAnswer);
  };

  // 回答入力部分のレンダリング
  const renderAnswerInput = () => {
    switch (problem.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {problem.options?.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                  answer === index
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={index}
                  checked={answer === index}
                  onChange={() => setAnswer(index)}
                  disabled={disabled}
                  className="mr-3 w-5 h-5 text-blue-600"
                />
                <span className="text-lg flex-1">{option}</span>
                {answer === index && (
                  <CheckCircle className="text-blue-500 animate-scale-in" size={20} />
                )}
              </label>
            ))}
          </div>
        );

      case 'fill_in_blank':
        const questionParts = problem.question.split('()');
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <p className="text-lg leading-relaxed">
                {questionParts.map((part, index) => (
                  <React.Fragment key={index}>
                    {part}
                    {index < questionParts.length - 1 && (
                      <span className="inline-block mx-1">
                        <input
                          type="text"
                          value={fillInAnswers[index] || ''}
                          onChange={(e) => {
                            const newAnswers = [...fillInAnswers];
                            newAnswers[index] = e.target.value;
                            setFillInAnswers(newAnswers);
                          }}
                          disabled={disabled}
                          className="inline-block w-32 px-3 py-1 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none text-center font-medium bg-white transition-colors"
                          placeholder={`(${index + 1})`}
                        />
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </p>
            </div>
            <div className="text-sm text-gray-600">
              {fillInAnswers.filter(a => a).length} / {fillInAnswers.length} 個入力済み
            </div>
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-3">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={disabled}
              rows={8}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg resize-none transition-colors bg-white"
              placeholder="論述解答を入力してください（200-400字程度）"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>推奨: 200-400字</span>
              <span className={answer.length > 400 ? 'text-orange-500' : ''}>{answer.length}文字</span>
            </div>
          </div>
        );

      case 'solution_sequence':
      case 'sentence_sequence':
      case 'event_sequence':
        if (!problem.options || problem.options.length === 0) {
          return (
            <div style={{ padding: '24px', backgroundColor: '#fef3c7', border: '2px solid #fbbf24', borderRadius: '12px' }}>
              <p style={{ color: '#92400e', fontWeight: 'bold' }}>選択肢が設定されていません</p>
            </div>
          );
        }
        
        // 選択式かどうかを判定
        const allLabels = problem.options.map((_, i) => String.fromCharCode(65 + i));
        let isSelective = false;
        let requiredCount = allLabels.length;
        
        if (typeof problem.correctAnswer === 'string' && problem.correctAnswer.includes(',')) {
          const correctLabels = problem.correctAnswer.split(',').map(s => s.trim());
          if (correctLabels.length < allLabels.length) {
            isSelective = true;
            requiredCount = correctLabels.length;
          }
        }
        
        // 選択式並び替え
        if (isSelective) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 説明 */}
              <div style={{
                background: 'linear-gradient(to right, #fef3c7, #fde68a)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #fbbf24'
              }}>
                <p style={{ color: '#92400e', fontSize: '14px', margin: 0, fontWeight: '600', textAlign: 'center' }}>
                  以下の選択肢から必要な<span style={{ fontSize: '18px', fontWeight: 'bold' }}> {requiredCount}個 </span>を選んで、正しい順序に並べてください
                </p>
              </div>

              {/* 選択肢リスト */}
              <div>
                <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '12px' }}>
                  選択肢（ドラッグして解答エリアへ）
                </h5>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  {allLabels.map((label, index) => {
                    const isUsed = selectedItems.includes(label);
                    return (
                      <div
                        key={label}
                        draggable={!isUsed && !disabled}
                        onDragStart={(e) => {
                          if (!isUsed) {
                            setDraggedItem(label);
                            setDraggedFromIndex(-1);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          backgroundColor: isUsed ? '#f3f4f6' : 'white',
                          border: `1px solid ${isUsed ? '#e5e7eb' : '#d1d5db'}`,
                          borderRadius: '8px',
                          cursor: isUsed ? 'default' : 'grab',
                          opacity: isUsed ? '0.5' : '1',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: isUsed ? '#e5e7eb' : '#6366f1',
                          color: 'white',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}>
                          {label}
                        </div>
                        <span style={{
                          flex: 1,
                          fontSize: '14px',
                          color: isUsed ? '#9ca3af' : '#374151'
                        }}>
                          {problem.options[index]}
                        </span>
                        {isUsed && (
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            fontStyle: 'italic'
                          }}>
                            使用済み
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 解答エリア */}
              <div>
                <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '12px' }}>
                  解答エリア（{selectedItems.length} / {requiredCount}個）
                </h5>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '24px',
                  background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
                  borderRadius: '12px',
                  minHeight: '100px',
                  border: '2px solid #93c5fd'
                }}>
                  {Array.from({ length: requiredCount }).map((_, slotIndex) => {
                    const item = selectedItems[slotIndex];
                    return (
                      <React.Fragment key={slotIndex}>
                        <div
                          onDragOver={e => {
                            e.preventDefault();
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onDragLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          onDrop={e => {
                            e.preventDefault();
                            e.currentTarget.style.transform = 'scale(1)';
                            
                            if (draggedItem) {
                              const newItems = [...selectedItems];
                              
                              if (draggedFromIndex === -1) {
                                // 選択肢リストから新規追加
                                if (slotIndex < newItems.length) {
                                  newItems.splice(slotIndex, 0, draggedItem);
                                } else {
                                  newItems.push(draggedItem);
                                }
                                // 最大数を超えないように調整
                                if (newItems.length > requiredCount) {
                                  newItems.length = requiredCount;
                                }
                              } else {
                                // 解答エリア内での移動
                                const [removed] = newItems.splice(draggedFromIndex, 1);
                                newItems.splice(slotIndex, 0, removed);
                              }
                              
                              setSelectedItems(newItems);
                              setDraggedItem(null);
                              setDraggedFromIndex(null);
                            }
                          }}
                          style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: item ? 'white' : '#f1f5f9',
                            border: item ? '3px solid #3b82f6' : '3px dashed #cbd5e1',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 0.2s'
                          }}
                        >
                          {item ? (
                            <>
                              <div
                                draggable={!disabled}
                                onDragStart={() => {
                                  setDraggedItem(item);
                                  setDraggedFromIndex(slotIndex);
                                }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'grab'
                                }}
                              >
                                <span style={{
                                  fontSize: '32px',
                                  fontWeight: 'bold',
                                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text',
                                  color: '#3b82f6'
                                }}>{item}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItems(selectedItems.filter((_, i) => i !== slotIndex));
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '-8px',
                                  right: '-8px',
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  fontSize: '14px',
                                  cursor: 'pointer'
                                }}
                              >✕</button>
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '14px' }}>{slotIndex + 1}</span>
                          )}
                        </div>
                        {slotIndex < requiredCount - 1 && (
                          <span style={{ color: '#6b7280', fontSize: '20px' }}>→</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#4b5563', margin: '0' }}>
                  現在の順序: <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                    {selectedItems.length > 0 ? selectedItems.join(' → ') : '未選択'}
                  </span>
                </p>
              </div>
            </div>
          );
        }
        
        // 通常の並び替え（すべて使用）
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #93c5fd'
            }}>
              <p style={{ color: '#1e40af', fontSize: '14px', textAlign: 'center', margin: '0' }}>
                ドラッグ&ドロップで選択肢を正しい順序に並び替えてください
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              flexWrap: 'wrap'
            }}>
              {selectedItems.map((item, index) => (
                <React.Fragment key={item}>
                  <div
                    draggable={!disabled}
                    onDragStart={() => {
                      setDraggedItem(item);
                      setDraggedFromIndex(index);
                    }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      if (draggedItem && draggedFromIndex !== null && draggedFromIndex !== index) {
                        const newItems = [...selectedItems];
                        newItems.splice(draggedFromIndex, 1);
                        newItems.splice(index, 0, draggedItem);
                        setSelectedItems(newItems);
                        setDraggedItem(null);
                        setDraggedFromIndex(null);
                      }
                    }}
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: 'white',
                      border: draggedItem === item ? '3px solid #60a5fa' : '3px solid #d1d5db',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: disabled ? 'not-allowed' : 'grab',
                      opacity: draggedItem === item ? '0.5' : '1',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{
                      fontSize: '30px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      color: '#6366f1'
                    }}>{item}</span>
                  </div>
                  {index < selectedItems.length - 1 && (
                    <span style={{ color: '#9ca3af', fontSize: '24px' }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: '0' }}>
                現在の順序: <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                  {selectedItems.join(' → ')}
                </span>
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            この問題形式には対応していません
          </div>
        );
    }
  };

  // 回答完了の判定
  const isAnswerComplete = () => {
    switch (problem.type) {
      case 'multiple_choice':
        return answer !== '';
      case 'fill_in_blank':
        return fillInAnswers.every(a => a.trim() !== '');
      case 'essay':
        return answer.trim().length >= 50;
      case 'solution_sequence':
      case 'sentence_sequence':
      case 'event_sequence':
        // 選択式の場合は必要数に達しているか
        if (typeof problem.correctAnswer === 'string' && problem.correctAnswer.includes(',')) {
          const correctLabels = problem.correctAnswer.split(',').map(s => s.trim());
          const totalOptions = problem.options?.length || 0;
          if (correctLabels.length < totalOptions) {
            return selectedItems.length === correctLabels.length;
          }
        }
        return selectedItems.length > 0;
      default:
        return false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          解答
        </h3>
        {renderAnswerInput()}
      </div>

      <button
        type="submit"
        disabled={disabled || !isAnswerComplete()}
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform ${
          disabled || !isAnswerComplete()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        解答を提出
      </button>
    </form>
  );
};

export default AnswerForm;