"use client";

import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

const FAQPage = () => {
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});
  const [isMobile, setIsMobile] = useState(false);

  // クライアントサイドでのみwindowオブジェクトを使用
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const faqSections = [
    {
      title: "📱 サービス全般について",
      items: [
        {
          id: "general-1",
          question: "A-IStudyとはどんなサービスですか？",
          answer: "A-IStudyは、AIが一人ひとりに最適化された問題を生成する学習アプリです。6教科（国語・数学・英語・理科・社会・情報）に対応し、あなたの学習レベルに合わせた問題で効率的に学習できます。"
        },
        {
          id: "general-2",
          question: "他の学習アプリとの違いは何ですか？",
          answer: "最大の違いは「AI問題生成」です。\n・既存の問題集ではなく、AIがあなた専用の問題を作成\n・苦手分野を自動検出して重点的に出題\n・問題が無限に生成されるので、何度でも練習可能\n・月額980円という圧倒的な低価格"
        },
        {
          id: "general-3",
          question: "無料で試すことはできますか？",
          answer: "キャンペーンコードをお持ちの方は、初月無料でお試しいただけます。学校や塾で配布されているQRコードからご登録いただくと、キャンペーンコードが適用される場合があります。"
        }
      ]
    },
    {
      title: "💰 料金・支払いについて",
      items: [
        {
          id: "payment-1",
          question: "料金はいくらですか？",
          answer: "初回登録料500円 + 月額980円（税込）です。初回のみ登録料500円をいただき、2ヶ月目以降は月額980円のみとなります。"
        },
        {
          id: "payment-2",
          question: "支払い方法は何がありますか？",
          answer: "クレジットカード・デビットカード決済のみ対応しています。（Visa/Mastercard/JCB/American Express）安全な決済システムStripeを使用しています。"
        },
        {
          id: "payment-3",
          question: "未成年ですが契約できますか？",
          answer: "18歳未満の方は保護者の同意が必要です。登録時に保護者のメールアドレスを入力いただき、保護者の方に同意確認メールをお送りします。"
        },
        {
          id: "payment-4",
          question: "解約はいつでもできますか？",
          answer: "はい、いつでも解約可能です。マイページの「プラン管理」から簡単に解約でき、次回更新日まではサービスをご利用いただけます。日割り返金はございません。"
        }
      ]
    },
    {
      title: "📚 学習機能について",
      items: [
        {
          id: "learning-1",
          question: "どんな教科・問題形式に対応していますか？",
          answer: "【対応教科】\n国語、数学、英語、理科、社会、情報の6教科\n\n【問題形式】\n・選択問題\n・記述問題\n・穴埋め問題\n・並び替え問題\n\n【難易度】\n基礎・標準・応用の3段階から選択可能"
        },
        {
          id: "learning-2",
          question: "どのような問題が出題されますか？",
          answer: "教科書の内容に準拠した問題から、応用問題まで幅広く出題されます。あなたの学習履歴を分析し、苦手な分野を重点的に出題するなど、AIが最適な問題を生成します。"
        },
        {
          id: "learning-3",
          question: "間違えた問題の復習はできますか？",
          answer: "もちろんです。\n・間違えた問題は自動的に「復習リスト」に追加\n・エビングハウスの忘却曲線に基づいて最適なタイミングで再出題\n・苦手分野は自動的に出題頻度が上がります"
        },
        {
          id: "learning-4",
          question: "共通テストや二次試験の対策はできますか？",
          answer: "現在開発中で、近日中に実装予定です。実装されましたらアプリ内でお知らせいたします。"
        }
      ]
    },
    {
      title: "🎓 学校・塾との連携について",
      items: [
        {
          id: "school-1",
          question: "学校や塾で配布されたQRコードはどう使いますか？",
          answer: "QRコードを読み取ると、専用の登録ページが開きます。そちらから登録すると、以下のメリットがあります。\n・キャンペーンコードの自動適用（初月無料など）\n・学校や塾の先生との学習連携\n・特別な学習コンテンツへのアクセス"
        },
        {
          id: "school-2",
          question: "学校がA-IStudyと契約している場合の特典は？",
          answer: "学校が法人契約をしている場合、生徒の皆様は月額料金が無料になる場合があります。詳しくは学校の先生にお問い合わせください。"
        }
      ]
    },
    {
      title: "🔧 技術的な質問",
      items: [
        {
          id: "tech-1",
          question: "推奨環境を教えてください",
          answer: "【スマートフォン】\n・iOS 14.0以上 / Android 8.0以上\n・メモリ2GB以上推奨\n\n【パソコン】\n・Chrome, Safari, Edge, Firefox の最新版\n・画面解像度1024×768以上\n\n※インターネット接続が必要です"
        },
        {
          id: "tech-2",
          question: "アプリが重い・落ちる場合は？",
          answer: "以下をお試しください。\n1. アプリを最新版にアップデート\n2. 端末を再起動\n3. キャッシュをクリア\n4. ストレージ空き容量を確保（1GB以上推奨）\n\n解決しない場合はサポートまでご連絡ください。"
        },
        {
          id: "tech-3",
          question: "パスワードを忘れた場合は？",
          answer: "ログイン画面の「パスワードを忘れた方」から登録メールアドレスを入力してください。パスワードリセットのメールをお送りします。"
        }
      ]
    },
    {
      title: "📞 お問い合わせ",
      items: [
        {
          id: "contact-1",
          question: "サポートの対応時間は？",
          answer: "【チャットサポート】\n平日：10:00〜19:00\n土日祝：10:00〜17:00\n\nアプリ内のチャットボタンからお気軽にお問い合わせください。営業時間外のお問い合わせは、翌営業日に順次対応いたします。"
        },
        {
          id: "contact-2",
          question: "退会したい場合は？",
          answer: "マイページの「アカウント設定」→「退会手続き」から退会できます。退会すると学習データも削除されますので、まずは解約（課金停止）をお試しください。"
        },
        {
          id: "contact-3",
          question: "キャンペーンコードはどこで入手できますか？",
          answer: "以下の方法で入手可能です。\n・学校や塾で配布\n・A-IStudy公式SNS\n・期間限定キャンペーン\n\n最新情報は公式サイトをご確認ください。"
        },
        {
          id: "contact-4",
          question: "その他の質問がある場合は？",
          answer: "アプリ内のチャットサポートからお問い合わせください。AIチャットボットが24時間対応しており、複雑なご質問は営業時間内にスタッフが対応いたします。"
        }
      ]
    }
  ];

  // スタイル定義（isMobileの状態に基づいて動的に生成）
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    wrapper: {
      maxWidth: '1024px',
      margin: '0 auto',
      padding: isMobile ? '12px' : '16px',
      paddingTop: isMobile ? '16px' : '32px',
      paddingBottom: isMobile ? '16px' : '32px'
    },
    title: {
      fontSize: isMobile ? '20px' : '30px',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      marginBottom: isMobile ? '4px' : '8px',
      color: '#111827'
    },
    subtitle: {
      fontSize: isMobile ? '14px' : '20px',
      textAlign: 'center' as const,
      color: '#6b7280',
      marginBottom: isMobile ? '16px' : '32px'
    },
    sectionsContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: isMobile ? '16px' : '32px'
    },
    sectionCard: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    },
    sectionHeader: {
      fontSize: isMobile ? '16px' : '20px',
      fontWeight: '600',
      padding: isMobile ? '12px' : '24px',
      paddingBottom: isMobile ? '8px' : '16px',
      borderBottom: '1px solid #e5e7eb',
      color: '#111827'
    },
    itemsContainer: {
      borderTop: '1px solid #e5e7eb'
    },
    itemWrapper: {
      padding: isMobile ? '12px' : '24px',
      borderBottom: '1px solid #e5e7eb'
    },
    questionButton: {
      width: '100%',
      textAlign: 'left' as const,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: isMobile ? '8px' : '16px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      color: '#111827',
      transition: 'color 0.2s'
    },
    questionText: {
      fontWeight: '500',
      fontSize: isMobile ? '14px' : '18px',
      paddingRight: isMobile ? '4px' : '8px',
      lineHeight: 1.5
    },
    chevron: {
      flexShrink: 0,
      width: isMobile ? '16px' : '20px',
      height: isMobile ? '16px' : '20px',
      marginTop: isMobile ? '2px' : '4px',
      transition: 'transform 0.2s'
    },
    chevronRotated: {
      transform: 'rotate(180deg)'
    },
    answerBox: {
      marginTop: isMobile ? '8px' : '16px',
      fontSize: isMobile ? '12px' : '16px',
      color: '#4b5563',
      whiteSpace: 'pre-line' as const,
      backgroundColor: '#f9fafb',
      padding: isMobile ? '8px' : '16px',
      borderRadius: '6px',
      lineHeight: 1.6
    },
    footer: {
      marginTop: isMobile ? '32px' : '48px',
      textAlign: 'center' as const,
      color: '#6b7280',
      fontSize: isMobile ? '12px' : '14px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <h1 style={styles.title}>A-IStudy for High School</h1>
        <p style={styles.subtitle}>FAQ（よくある質問）</p>
        
        <div style={styles.sectionsContainer}>
          {faqSections.map((section) => (
            <div key={section.title} style={styles.sectionCard}>
              <h2 style={styles.sectionHeader}>{section.title}</h2>
              <div>
                {section.items.map((item, index) => (
                  <div 
                    key={item.id} 
                    style={{
                      ...styles.itemWrapper,
                      borderBottom: index === section.items.length - 1 ? 'none' : '1px solid #e5e7eb'
                    }}
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      style={styles.questionButton}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#111827'}
                    >
                      <h3 style={styles.questionText}>{item.question}</h3>
                      <ChevronDown
                        style={{
                          ...styles.chevron,
                          ...(openItems[item.id] ? styles.chevronRotated : {})
                        }}
                      />
                    </button>
                    {openItems[item.id] && (
                      <div style={styles.answerBox}>
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div style={styles.footer}>
          <p>最終更新日：2025年1月</p>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;