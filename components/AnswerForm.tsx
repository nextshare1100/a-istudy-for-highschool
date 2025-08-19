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
  // デバッグログを追加
  console.log('=== AnswerForm Debug ===');
  console.log('problem:', problem);
  console.log('problem.type:', problem?.type);
  console.log('problem.question:', problem?.question);
  console.log('========================');
  
  const [answer, setAnswer] = useState<any>('');
  const [fillInAnswers, setFillInAnswers] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // ドラッグ&ドロップとタッチ操作用の状態
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState<number | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{x: number, y: number} | null>(null);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  
  // 分数入力用の状態管理
  const [fractionInputs, setFractionInputs] = useState<{[key: number]: {numerator: string, denominator: string}}>({});

  // ドラッグ中のスクロール防止
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (draggedElement) {
        e.preventDefault();
      }
    };

    if (draggedElement) {
      document.addEventListener('touchmove', preventScroll, { passive: false });
    }

    return () => {
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [draggedElement]);

  // タッチイベントのハンドラー
  const handleTouchStart = (e: React.TouchEvent, item: string, fromIndex: number) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggedItem(item);
    setDraggedFromIndex(fromIndex);
    
    // ドラッグ中の要素のクローンを作成
    const element = e.currentTarget as HTMLElement;
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.zIndex = '1000';
    clone.style.opacity = '0.8';
    clone.style.pointerEvents = 'none';
    clone.style.left = `${touch.clientX - element.offsetWidth / 2}px`;
    clone.style.top = `${touch.clientY - element.offsetHeight / 2}px`;
    clone.style.transform = 'scale(1.1)';
    clone.style.transition = 'none';
    document.body.appendChild(clone);
    setDraggedElement(clone);
    
    // 元の要素を半透明に
    element.style.opacity = '0.5';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedElement || !touchStartPos) return;
    
    const touch = e.touches[0];
    draggedElement.style.left = `${touch.clientX - draggedElement.offsetWidth / 2}px`;
    draggedElement.style.top = `${touch.clientY - draggedElement.offsetHeight / 2}px`;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggedElement || !draggedItem) return;
    
    const touch = e.changedTouches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    // 元の要素の透明度を戻す
    const originalElement = e.currentTarget as HTMLElement;
    if (originalElement) {
      originalElement.style.opacity = '1';
    }
    
    // ドロップ先を探す
    const dropTarget = elements.find(el => 
      el.hasAttribute('data-drop-zone') || el.hasAttribute('data-drop-slot')
    );
    
    if (dropTarget) {
      const slotIndex = parseInt(dropTarget.getAttribute('data-slot-index') || '-1');
      if (slotIndex >= 0) {
        handleDrop(slotIndex);
      }
    }
    
    // クリーンアップ
    draggedElement.remove();
    setDraggedElement(null);
    setDraggedItem(null);
    setDraggedFromIndex(null);
    setTouchStartPos(null);
  };

  // ドロップ処理の共通化
  const handleDrop = (slotIndex: number) => {
    if (!draggedItem) return;
    
    const newItems = [...selectedItems];
    
    if (draggedFromIndex === -1) {
      // 選択肢リストから新規追加
      if (slotIndex < newItems.length) {
        newItems.splice(slotIndex, 0, draggedItem);
      } else {
        newItems.push(draggedItem);
      }
      // 最大数を超えないように調整（選択式の場合）
      const allLabels = problem.options?.map((_, i) => String.fromCharCode(65 + i)) || [];
      let requiredCount = allLabels.length;
      
      if (typeof problem.correctAnswer === 'string' && problem.correctAnswer.includes(',')) {
        const correctLabels = problem.correctAnswer.split(',').map(s => s.trim());
        if (correctLabels.length < allLabels.length) {
          requiredCount = correctLabels.length;
          if (newItems.length > requiredCount) {
            newItems.length = requiredCount;
          }
        }
      }
    } else {
      // 解答エリア内での移動
      const [removed] = newItems.splice(draggedFromIndex, 1);
      newItems.splice(slotIndex, 0, removed);
    }
    
    setSelectedItems(newItems);
  };

  // 問題タイプに応じて初期化
  useEffect(() => {
    if (!problem) return;

    switch (problem.type) {
      case 'solution_sequence':
      case 'sentence_sequence':
      case 'event_sequence':
        // 初期状態は空にする（ユーザーがドラッグして配置）
        setSelectedItems([]);
        break;
      
      case 'fill_in_blank':
        // ()の数を数える（従来の方法）
        let blanks = (problem.question.match(/\(\)/g) || []).length;
        // ____や□の数も数える（新しい公式穴埋め対応）
        const underscoreBlanks = (problem.question.match(/____/g) || []).length;
        const squareBlanks = (problem.question.match(/□/g) || []).length;
        // 最大値を採用
        blanks = Math.max(blanks, underscoreBlanks, squareBlanks);
        
        console.log('Fill in blank - blanks count:', blanks);
        setFillInAnswers(new Array(blanks).fill(''));
        
        // 分数入力の初期化
        setFractionInputs({});
        
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

  // 各空欄が分数形式かどうかを判定（正解データから）
  const isFractionAnswer = (index: number): boolean => {
    if (problem.correctAnswer && Array.isArray(problem.correctAnswer)) {
      const answer = problem.correctAnswer[index];
      return typeof answer === 'string' && answer.includes('/');
    }
    return false;
  };

  // 並び替え問題のスロットをレンダリング
  const renderSequenceSlot = (slotIndex: number, item: string | undefined, requiredCount: number) => {
    // 5個以下の場合はさらにコンパクトなサイズに
    const isCompact = requiredCount <= 5;
    const slotSize = isCompact ? '32px' : '40px';
    const fontSize = isCompact ? '12px' : '14px';
    const deleteButtonSize = '14px';
    const deleteButtonOffset = '-4px';
    
    return (
      <React.Fragment key={slotIndex}>
        <div
          data-drop-slot="true"
          data-slot-index={slotIndex.toString()}
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
            handleDrop(slotIndex);
            setDraggedItem(null);
            setDraggedFromIndex(null);
          }}
          style={{
            width: slotSize,
            height: slotSize,
            minWidth: slotSize,
            backgroundColor: item ? 'white' : '#f1f5f9',
            border: item ? '2px solid #3b82f6' : '2px dashed #cbd5e1',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.2s',
            flexShrink: 0
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
                onTouchStart={(e) => {
                  if (!disabled) {
                    handleTouchStart(e, item, slotIndex);
                  }
                }}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                <span style={{
                  fontSize: fontSize,
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: '#3b82f6',
                  pointerEvents: 'none'
                }}>{item}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItems(selectedItems.filter((_, i) => i !== slotIndex));
                }}
                style={{
                  position: 'absolute',
                  top: deleteButtonOffset,
                  right: deleteButtonOffset,
                  width: deleteButtonSize,
                  height: deleteButtonSize,
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  fontSize: '8px',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
              >✕</button>
            </>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '9px', pointerEvents: 'none' }}>{slotIndex + 1}</span>
          )}
        </div>
      </React.Fragment>
    );
  };

  // 回答入力部分のレンダリング
  const renderAnswerInput = () => {
    console.log('renderAnswerInput - problem.type:', problem.type);
    
    switch (problem.type) {
      case 'multiple_choice':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {problem.options?.map((option, index) => (
              <label
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: answer === index ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  backgroundColor: answer === index 
                    ? 'linear-gradient(to right, #eff6ff, #f5f3ff)' 
                    : '#ffffff',
                  background: answer === index 
                    ? 'linear-gradient(to right, #eff6ff, #f5f3ff)' 
                    : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: answer === index ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: answer === index 
                    ? '0 2px 8px rgba(59, 130, 246, 0.15)' 
                    : '0 1px 2px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (answer !== index) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (answer !== index) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                onTouchStart={(e) => {
                  if (answer !== index) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }
                }}
                onTouchEnd={(e) => {
                  setTimeout(() => {
                    if (answer !== index) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }, 100);
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: answer === index ? '#3b82f6' : '#f3f4f6',
                  color: answer === index ? '#ffffff' : '#6b7280',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  marginRight: '10px',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}>
                  {String.fromCharCode(12450 + index)}
                </div>
                <input
                  type="radio"
                  name="answer"
                  value={index}
                  checked={answer === index}
                  onChange={() => setAnswer(index)}
                  disabled={disabled}
                  style={{ display: 'none' }}
                />
                <span style={{
                  fontSize: '13px',
                  color: '#1f2937',
                  flex: 1,
                  lineHeight: '1.4'
                }}>{option}</span>
                {answer === index && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '8px'
                  }}>
                    <CheckCircle size={18} color="#3b82f6" />
                  </div>
                )}
              </label>
            ))}
          </div>
        );

      case 'fill_in_blank':
        // デバッグログ
        console.log('Fill in blank - problem question:', problem.question);
        console.log('Fill in blank - fillInAnswers:', fillInAnswers);
        
        // 複数のパターンに対応（(), ____, □）
        const questionText = problem.question;
        
        // すべての空欄パターンを統一的に処理
        const blankPatterns = [
          { pattern: /\(\)/g, replacement: '[[BLANK]]' },
          { pattern: /____/g, replacement: '[[BLANK]]' },
          { pattern: /□/g, replacement: '[[BLANK]]' }
        ];
        
        // 問題文を一時的に統一フォーマットに変換
        let unifiedQuestion = questionText;
        blankPatterns.forEach(({ pattern, replacement }) => {
          unifiedQuestion = unifiedQuestion.replace(pattern, replacement);
        });
        
        console.log('Unified question:', unifiedQuestion);
        
        // 空欄の数を数える
        const blankCount = (unifiedQuestion.match(/\[\[BLANK\]\]/g) || []).length;
        console.log('Blank count:', blankCount);
        
        // 問題文を空欄で分割
        const questionParts = unifiedQuestion.split('[[BLANK]]');
        console.log('Question parts:', questionParts);
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
              borderRadius: '10px',
              border: '1px solid #c7d2fe'
            }}>
              <div style={{
                fontSize: '14px',
                lineHeight: '2',
                color: '#1e293b'
              }}>
                {questionParts.map((part, index) => (
                  <React.Fragment key={index}>
                    <span>{part}</span>
                    {index < questionParts.length - 1 && (
                      <span style={{
                        display: 'inline-flex',
                        margin: '0 4px',
                        verticalAlign: 'middle'
                      }}>
                        {isFractionAnswer(index) ? (
                          // 分数入力フォーム
                          <span style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '2px',
                            backgroundColor: '#ffffff',
                            borderRadius: '4px',
                            border: '2px solid #6366f1'
                          }}>
                            <input
                              type="text"
                              inputMode="text"
                              value={fractionInputs[index]?.numerator || ''}
                              onChange={(e) => {
                                const newFractionInputs = {...fractionInputs};
                                if (!newFractionInputs[index]) {
                                  newFractionInputs[index] = {numerator: '', denominator: ''};
                                }
                                newFractionInputs[index].numerator = e.target.value;
                                setFractionInputs(newFractionInputs);
                                
                                // fillInAnswersも更新
                                const newAnswers = [...fillInAnswers];
                                const num = newFractionInputs[index].numerator;
                                const den = newFractionInputs[index].denominator;
                                newAnswers[index] = den ? `${num}/${den}` : num;
                                setFillInAnswers(newAnswers);
                              }}
                              disabled={disabled}
                              style={{
                                width: '50px',
                                padding: '2px 4px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '2px',
                                fontSize: '12px',
                                fontWeight: '500',
                                textAlign: 'center',
                                backgroundColor: '#ffffff',
                                color: '#1e293b',
                                outline: 'none',
                                WebkitAppearance: 'none'
                              }}
                              placeholder="分子"
                            />
                            <span style={{
                              width: '100%',
                              height: '1px',
                              backgroundColor: '#1e293b',
                              margin: '2px 0',
                              display: 'block'
                            }} />
                            <input
                              type="text"
                              inputMode="text"
                              value={fractionInputs[index]?.denominator || ''}
                              onChange={(e) => {
                                const newFractionInputs = {...fractionInputs};
                                if (!newFractionInputs[index]) {
                                  newFractionInputs[index] = {numerator: '', denominator: ''};
                                }
                                newFractionInputs[index].denominator = e.target.value;
                                setFractionInputs(newFractionInputs);
                                
                                // fillInAnswersも更新
                                const newAnswers = [...fillInAnswers];
                                const num = newFractionInputs[index].numerator;
                                const den = newFractionInputs[index].denominator;
                                newAnswers[index] = den ? `${num}/${den}` : num;
                                setFillInAnswers(newAnswers);
                              }}
                              disabled={disabled}
                              style={{
                                width: '50px',
                                padding: '2px 4px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '2px',
                                fontSize: '12px',
                                fontWeight: '500',
                                textAlign: 'center',
                                backgroundColor: '#ffffff',
                                color: '#1e293b',
                                outline: 'none',
                                WebkitAppearance: 'none'
                              }}
                              placeholder="分母"
                            />
                          </span>
                        ) : (
                          // 通常の入力フォーム
                          <input
                            type="text"
                            inputMode="text"
                            value={fillInAnswers[index] || ''}
                            onChange={(e) => {
                              const newAnswers = [...fillInAnswers];
                              newAnswers[index] = e.target.value;
                              setFillInAnswers(newAnswers);
                            }}
                            disabled={disabled}
                            style={{
                              display: 'inline-block',
                              minWidth: '80px',
                              padding: '3px 6px',
                              border: '2px solid #6366f1',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              textAlign: 'center',
                              backgroundColor: '#ffffff',
                              color: '#1e293b',
                              outline: 'none',
                              transition: 'all 0.2s ease',
                              WebkitAppearance: 'none'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#4f46e5';
                              e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#6366f1';
                              e.target.style.boxShadow = 'none';
                            }}
                            placeholder={`空欄${index + 1}`}
                          />
                        )}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            {/* 答えを見るボタンとヒント */}
            {problem.correctAnswer && Array.isArray(problem.correctAnswer) && (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '8px'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      // 現在の入力内容で解答を提出（空欄でも）
                      onSubmit(fillInAnswers);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.backgroundColor = '#b91c1c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 3.5a5.5 5.5 0 00-5.5 5.5c0 .425.049.84.142 1.235l7.593-7.593A5.473 5.473 0 008 3.5zM13.5 9c0-.425-.049-.84-.142-1.235l-7.593 7.593A5.473 5.473 0 008 12.5 5.5 5.5 0 0013.5 9z"/>
                      <path d="M8 5.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM5.5 9a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"/>
                    </svg>
                    答えを見る（解答確定）
                  </button>
                </div>
                
                <div style={{
                  padding: '8px',
                  backgroundColor: '#fee2e2',
                  borderRadius: '6px',
                  border: '1px solid #fca5a5',
                  fontSize: '11px',
                  color: '#991b1b',
                  textAlign: 'center'
                }}>
                  <strong>⚠️ 注意：</strong>「答えを見る」を押すと、現在の入力内容で解答が確定されます
                </div>
                
                <div style={{
                  padding: '10px',
                  backgroundColor: '#fefce8',
                  borderRadius: '8px',
                  border: '1px solid #fde047'
                }}>
                  <p style={{
                    fontSize: '11px',
                    color: '#713f12',
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    💡 ヒント: 各空欄には数式や値を入力してください
                  </p>
                </div>
              </>
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 4px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: fillInAnswers.filter(a => a).length === blankCount ? '#10b981' : '#d1d5db'
                }} />
                <span style={{
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  {fillInAnswers.filter(a => a).length} / {blankCount} 個入力済み
                </span>
              </div>
              {fillInAnswers.filter(a => a).length === blankCount && (
                <CheckCircle size={14} color="#10b981" />
              )}
            </div>
          </div>
        );

      case 'essay':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={disabled}
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  minHeight: '120px',
                  backgroundColor: '#ffffff',
                  color: '#1f2937',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  WebkitAppearance: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="論述解答を入力してください（最低50字以上）"
              />
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                padding: '3px 8px',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: answer.length < 50 ? '#f59e0b' : answer.length > 400 ? '#3b82f6' : '#10b981'
                }}>
                  {answer.length}文字
                </span>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px'
            }}>
              <span style={{ color: '#6b7280' }}>推奨: 200-400字</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {answer.length < 50 && (
                  <span style={{
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 5zm0 6a1 1 0 100-2 1 1 0 000 2z"/>
                    </svg>
                    最低50字以上必要
                  </span>
                )}
                {answer.length >= 50 && answer.length <= 400 && (
                  <span style={{
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <CheckCircle size={12} />
                    適切な文字数
                  </span>
                )}
                {answer.length > 400 && (
                  <span style={{
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    充実した解答
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 'solution_sequence':
      case 'sentence_sequence':
      case 'event_sequence':
        if (!problem.options || problem.options.length === 0) {
          return (
            <div style={{ padding: '16px', backgroundColor: '#fef3c7', border: '2px solid #fbbf24', borderRadius: '8px' }}>
              <p style={{ color: '#92400e', fontWeight: 'bold', fontSize: '12px', margin: 0 }}>選択肢が設定されていません</p>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 説明 */}
              <div style={{
                background: 'linear-gradient(to right, #fef3c7, #fde68a)',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #fbbf24'
              }}>
                <p style={{ color: '#92400e', fontSize: '11px', margin: 0, fontWeight: '600', textAlign: 'center' }}>
                  以下の選択肢から必要な<span style={{ fontSize: '13px', fontWeight: 'bold' }}> {requiredCount}個 </span>を選んで、正しい順序に並べてください
                </p>
              </div>

              {/* 選択肢リスト */}
              <div>
                <h5 style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>
                  選択肢（ドラッグして解答エリアへ）
                </h5>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  padding: '8px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  justifyContent: 'center'
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
                        onTouchStart={(e) => {
                          if (!isUsed && !disabled) {
                            handleTouchStart(e, label, -1);
                          }
                        }}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          backgroundColor: isUsed ? '#f3f4f6' : 'white',
                          border: `2px solid ${isUsed ? '#e5e7eb' : '#6366f1'}`,
                          borderRadius: '6px',
                          cursor: isUsed ? 'default' : 'grab',
                          opacity: isUsed ? '0.5' : '1',
                          transition: 'all 0.2s',
                          margin: '2px',
                          touchAction: 'none',
                          WebkitTouchCallout: 'none',
                          WebkitUserSelect: 'none',
                          userSelect: 'none'
                        }}
                      >
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: isUsed ? '#9ca3af' : '#6366f1',
                          pointerEvents: 'none'
                        }}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 解答エリア */}
              <div>
                <h5 style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>
                  解答エリア（{selectedItems.length} / {requiredCount}個）
                </h5>
                <div style={{
                  display: 'flex',
                  flexDirection: requiredCount <= 5 ? 'row' : 'column',
                  alignItems: requiredCount <= 5 ? 'center' : 'stretch',
                  gap: requiredCount <= 5 ? '6px' : '8px',
                  padding: '10px',
                  background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
                  borderRadius: '8px',
                  minHeight: '50px',
                  border: '2px solid #93c5fd'
                }}>
                  {requiredCount <= 5 ? (
                    // 5個以下の場合: 横一列
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      flexWrap: 'nowrap',
                      justifyContent: 'center',
                      width: '100%'
                    }}>
                      {Array.from({ length: requiredCount }).map((_, slotIndex) => (
                        <React.Fragment key={slotIndex}>
                          {renderSequenceSlot(slotIndex, selectedItems[slotIndex], requiredCount)}
                          {slotIndex < requiredCount - 1 && (
                            <span style={{ color: '#6b7280', fontSize: '10px', flexShrink: 0, margin: '0 1px' }}>→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    // 6個以上の場合: 2列
                    <>
                      {/* 上段 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        justifyContent: 'center'
                      }}>
                        {Array.from({ length: Math.ceil(requiredCount / 2) }).map((_, slotIndex) => (
                          <React.Fragment key={slotIndex}>
                            {renderSequenceSlot(slotIndex, selectedItems[slotIndex], requiredCount)}
                            {slotIndex < Math.ceil(requiredCount / 2) - 1 && (
                              <span style={{ color: '#6b7280', fontSize: '12px' }}>→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      
                      {/* 折り返し矢印 */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        paddingRight: '15px'
                      }}>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>↓</span>
                      </div>
                      
                      {/* 下段 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        justifyContent: 'center',
                        flexDirection: 'row-reverse'
                      }}>
                        {Array.from({ length: Math.floor(requiredCount / 2) }).map((_, index) => {
                          const slotIndex = Math.ceil(requiredCount / 2) + index;
                          return (
                            <React.Fragment key={slotIndex}>
                              {renderSequenceSlot(slotIndex, selectedItems[slotIndex], requiredCount)}
                              {index > 0 && (
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>←</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#4b5563', margin: '0' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #93c5fd'
            }}>
              <p style={{ color: '#1e40af', fontSize: '11px', textAlign: 'center', margin: '0' }}>
                すべての選択肢を使って、正しい順序に並び替えてください
              </p>
            </div>
            
            {/* 選択肢リスト */}
            <div>
              <h5 style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>
                選択肢（ドラッグして解答エリアへ）
              </h5>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                padding: '8px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                justifyContent: 'center',
                minHeight: '45px'
              }}>
                {allLabels.map((label) => {
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
                      onTouchStart={(e) => {
                        if (!isUsed && !disabled) {
                          handleTouchStart(e, label, -1);
                        }
                      }}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      style={{
                        display: isUsed ? 'none' : 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        backgroundColor: 'white',
                        border: '2px solid #6366f1',
                        borderRadius: '6px',
                        cursor: 'grab',
                        transition: 'all 0.2s',
                        margin: '2px',
                        touchAction: 'none',
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#6366f1',
                        pointerEvents: 'none'
                      }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 解答エリア */}
            <div>
              <h5 style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>
                解答エリア（{selectedItems.length} / {allLabels.length}個）
              </h5>
              <div style={{
                display: 'flex',
                flexDirection: allLabels.length <= 5 ? 'row' : 'column',
                alignItems: allLabels.length <= 5 ? 'center' : 'stretch',
                gap: allLabels.length <= 5 ? '6px' : '8px',
                padding: '10px',
                background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
                borderRadius: '8px',
                minHeight: '50px',
                border: '2px solid #93c5fd'
              }}>
                {allLabels.length <= 5 ? (
                  // 5個以下の場合: 横一列
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    flexWrap: 'nowrap',
                    justifyContent: 'center',
                    width: '100%'
                  }}>
                    {allLabels.map((_, slotIndex) => (
                      <React.Fragment key={slotIndex}>
                        {renderSequenceSlot(slotIndex, selectedItems[slotIndex], allLabels.length)}
                        {slotIndex < allLabels.length - 1 && (
                          <span style={{ color: '#6b7280', fontSize: '10px', flexShrink: 0, margin: '0 1px' }}>→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  // 6個以上の場合: 2列
                  <>
                    {/* 上段 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: 'center'
                    }}>
                      {Array.from({ length: Math.ceil(allLabels.length / 2) }).map((_, slotIndex) => (
                        <React.Fragment key={slotIndex}>
                          {renderSequenceSlot(slotIndex, selectedItems[slotIndex], allLabels.length)}
                          {slotIndex < Math.ceil(allLabels.length / 2) - 1 && (
                            <span style={{ color: '#6b7280', fontSize: '12px' }}>→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    
                    {/* 折り返し矢印 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      paddingRight: '15px'
                    }}>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>↓</span>
                    </div>
                    
                    {/* 下段 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: 'center',
                      flexDirection: 'row-reverse'
                    }}>
                      {Array.from({ length: Math.floor(allLabels.length / 2) }).map((_, index) => {
                        const slotIndex = Math.ceil(allLabels.length / 2) + index;
                        return (
                          <React.Fragment key={slotIndex}>
                            {renderSequenceSlot(slotIndex, selectedItems[slotIndex], allLabels.length)}
                            {index > 0 && (
                              <span style={{ color: '#6b7280', fontSize: '12px' }}>←</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#4b5563', margin: '0' }}>
                現在の順序: <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                  {selectedItems.length > 0 ? selectedItems.join(' → ') : '未選択'}
                </span>
              </p>
            </div>
          </div>
        );

      default:
        console.log('Unknown problem type:', problem.type);
        return (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '16px 0' }}>
            この問題形式には対応していません（タイプ: {problem.type || '未定義'}）
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '12px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #f3f4f6'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: '#3b82f6'
        }}>
          解答
        </h3>
        {renderAnswerInput()}
      </div>

      <button
        type="submit"
        disabled={disabled || !isAnswerComplete()}
        style={{
          width: '100%',
          padding: '10px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '14px',
          border: 'none',
          cursor: disabled || !isAnswerComplete() ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          transform: disabled || !isAnswerComplete() ? 'scale(1)' : 'scale(1)',
          backgroundColor: disabled || !isAnswerComplete() ? '#d1d5db' : '#3b82f6',
          background: disabled || !isAnswerComplete() 
            ? '#d1d5db' 
            : 'linear-gradient(to right, #3b82f6, #8b5cf6)',
          color: disabled || !isAnswerComplete() ? '#6b7280' : '#ffffff',
          boxShadow: disabled || !isAnswerComplete() 
            ? 'none' 
            : '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!disabled && isAnswerComplete()) {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && isAnswerComplete()) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)';
          }
        }}
        onTouchStart={(e) => {
          if (!disabled && isAnswerComplete()) {
            e.currentTarget.style.transform = 'scale(0.98)';
          }
        }}
        onTouchEnd={(e) => {
          if (!disabled && isAnswerComplete()) {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        解答を提出
      </button>

      {/* 答えを見るボタン（全問題タイプ共通） */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginTop: '4px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            type="button"
            onClick={() => {
              // 現在の入力内容で強制的に解答を提出
              let forceSubmitAnswer;
              switch (problem.type) {
                case 'solution_sequence':
                case 'sentence_sequence':
                case 'event_sequence':
                  forceSubmitAnswer = selectedItems.join(', ');
                  break;
                case 'fill_in_blank':
                  forceSubmitAnswer = fillInAnswers;
                  break;
                default:
                  forceSubmitAnswer = answer;
              }
              onSubmit(forceSubmitAnswer);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.backgroundColor = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3.5a5.5 5.5 0 00-5.5 5.5c0 .425.049.84.142 1.235l7.593-7.593A5.473 5.473 0 008 3.5zM13.5 9c0-.425-.049-.84-.142-1.235l-7.593 7.593A5.473 5.473 0 008 12.5 5.5 5.5 0 0013.5 9z"/>
              <path d="M8 5.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM5.5 9a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"/>
            </svg>
            答えを見る（解答確定）
          </button>
        </div>
        
        <div style={{
          padding: '6px',
          backgroundColor: '#fee2e2',
          borderRadius: '4px',
          border: '1px solid #fca5a5',
          fontSize: '10px',
          color: '#991b1b',
          textAlign: 'center'
        }}>
          <strong>⚠️ 注意：</strong>「答えを見る」を押すと解答が確定されます
        </div>
      </div>
    </form>
  );
};

export default AnswerForm;