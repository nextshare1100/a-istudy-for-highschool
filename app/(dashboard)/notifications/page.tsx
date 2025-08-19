'use client';

import React, { useState, useEffect } from 'react';
import { Bell, School, CheckCircle2, Info, Calendar, AlertTriangle, Server, CreditCard, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth-store';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, getDocs, where } from 'firebase/firestore';

interface Notification {
  id: string;
  type: 'migration' | 'system' | 'achievement' | 'reminder' | 'update' | 'warning' | 'subscription';
  title: string;
  message: string;
  timestamp: any;
  read: boolean;
  actionRequired?: boolean;
}

type TabType = 'all' | 'achievement' | 'system' | 'important';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // タブの定義
  const tabs = [
    { id: 'all', label: 'すべて', icon: Bell },
    { id: 'achievement', label: '達成', icon: CheckCircle2 },
    { id: 'system', label: 'お知らせ', icon: Info },
    { id: 'important', label: '重要', icon: AlertTriangle }
  ];

  // タブに基づいて通知をフィルタリング（メモ化して再レンダリングを防ぐ）
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter(notification => {
      if (activeTab === 'all') return true;
      if (activeTab === 'achievement') return notification.type === 'achievement';
      if (activeTab === 'system') return ['system', 'update', 'reminder'].includes(notification.type);
      if (activeTab === 'important') return ['warning', 'migration', 'subscription'].includes(notification.type);
      return true;
    });
  }, [notifications, activeTab]);

  // CSSアニメーションを追加
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes fadeIn {
        from { 
          opacity: 0;
          transform: translateY(10px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      .notification-card {
        animation: fadeIn 0.3s ease-out;
      }
      
      .notification-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .unread-dot {
        animation: pulse 2s ease-in-out infinite;
      }
      
      .tab-button {
        transition: all 0.2s ease;
      }
      
      .tab-button:hover {
        background-color: rgba(59, 130, 246, 0.05);
      }
      
      .tab-button:active {
        transform: scale(0.98);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const notificationsRef = collection(db, 'notifications', user.uid, 'userNotifications');
      const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(50));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newNotifications: Notification[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          newNotifications.push({
            id: doc.id,
            type: data.type,
            title: data.title,
            message: data.message,
            timestamp: data.timestamp,
            read: data.read || false,
            actionRequired: data.actionRequired || false
          });
        });

        setNotifications(newNotifications);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up listener:', error);
      setLoading(false);
    }
  }, [user]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'migration':
        return <School className="h-4 w-4 text-blue-600" />;
      case 'achievement':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'reminder':
        return <Calendar className="h-4 w-4 text-orange-600" />;
      case 'update':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'system':
        return <Server className="h-4 w-4 text-gray-600" />;
      case 'subscription':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const notificationRef = doc(db, 'notifications', user.uid, 'userNotifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', user.uid, 'userNotifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'たった今';
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}時間前`;
      } else if (diffInHours < 48) {
        return '昨日';
      } else {
        return format(date, 'M/d HH:mm', { locale: ja });
      }
    } catch (error) {
      return '';
    }
  };

  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        padding: '12px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #3B82F6',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '12px', maxWidth: '370px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>通知</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: '#6B7280', fontSize: '12px' }}>
            {unreadCount > 0 ? `${unreadCount}件の未読` : 'すべて既読'}
          </p>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                fontSize: '11px',
                color: '#3B82F6',
                fontWeight: '500',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              すべて既読に
            </button>
          )}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '0',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className="tab-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent',
                color: isActive ? '#3B82F6' : '#6B7280',
                fontWeight: isActive ? '600' : '400',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '-1px',
                borderRadius: '4px 4px 0 0',
                position: 'relative' as const,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Icon style={{ width: '14px', height: '14px' }} />
              {tab.label}
              {tab.id === 'all' && notifications.length > 0 && (
                <span style={{
                  fontSize: '10px',
                  backgroundColor: '#E5E7EB',
                  color: '#6B7280',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  marginLeft: '2px',
                  animation: 'slideIn 0.3s ease-out'
                }}>
                  {notifications.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 通知リスト */}
      {filteredNotifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifications.map((notification, index) => (
            <div
              key={notification.id}
              className="notification-card"
              style={{
                backgroundColor: !notification.read ? 'rgba(219, 234, 254, 0.3)' : 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: !notification.read ? '1px solid #BFDBFE' : '1px solid #E5E7EB',
                padding: '12px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                animationDelay: `${index * 0.05}s`
              }}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ 
                        fontWeight: '600', 
                        color: '#1F2937', 
                        fontSize: '13px',
                        marginBottom: '4px',
                        wordBreak: 'break-word'
                      }}>
                        {notification.title}
                      </h3>
                      <p style={{ 
                        color: '#6B7280', 
                        fontSize: '11px',
                        lineHeight: '1.4',
                        wordBreak: 'break-word'
                      }}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#3B82F6',
                        borderRadius: '50%',
                        marginTop: '4px',
                        flexShrink: 0
                      }} className="unread-dot"></div>
                    )}
                  </div>
                  <p style={{ 
                    fontSize: '10px', 
                    color: '#9CA3AF', 
                    marginTop: '6px' 
                  }}>
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 通知がない時の表示 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.4s ease-out' }}>
          {/* メインカード */}
          <div style={{
            background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              backgroundColor: 'white',
              borderRadius: '50%',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              marginBottom: '12px'
            }}>
              <Bell style={{ width: '24px', height: '24px', color: '#3B82F6' }} />
            </div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1F2937',
              marginBottom: '6px'
            }}>
              通知はありません
            </h3>
            <p style={{ color: '#6B7280', fontSize: '12px' }}>
              新しい通知が届いたらこちらに表示されます
            </p>
          </div>

          {/* サンプル通知カード */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{
              fontSize: '11px',
              color: '#6B7280',
              fontWeight: '500',
              paddingLeft: '4px'
            }}>
              {activeTab === 'achievement' && '達成通知の表示例'}
              {activeTab === 'system' && 'お知らせの表示例'}
              {activeTab === 'important' && '重要な通知の表示例'}
              {activeTab === 'all' && '通知の表示例'}
            </p>
            
            {/* 達成通知のサンプル */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              border: '1px solid #F3F4F6',
              padding: '12px',
              opacity: '0.6'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ marginTop: '2px' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '4px',
                    fontSize: '13px'
                  }}>
                    今日3時間達成！🔥
                  </h3>
                  <p style={{
                    color: '#6B7280',
                    fontSize: '11px',
                    lineHeight: '1.4'
                  }}>
                    集中力が素晴らしいです！適度な休憩も忘れずに！
                  </p>
                  <p style={{
                    fontSize: '10px',
                    color: '#9CA3AF',
                    marginTop: '6px'
                  }}>
                    通知が届くとこのように表示されます
                  </p>
                </div>
              </div>
            </div>

            {/* システム通知のサンプル */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              border: '1px solid #F3F4F6',
              padding: '12px',
              opacity: '0.6'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ marginTop: '2px' }}>
                  <Info style={{ width: '16px', height: '16px', color: '#3B82F6' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '4px',
                    fontSize: '13px'
                  }}>
                    新機能のお知らせ
                  </h3>
                  <p style={{
                    color: '#6B7280',
                    fontSize: '11px',
                    lineHeight: '1.4'
                  }}>
                    重要なお知らせや新機能の情報をお届けします
                  </p>
                  <p style={{
                    fontSize: '10px',
                    color: '#9CA3AF',
                    marginTop: '6px'
                  }}>
                    未読の通知には青い印が付きます
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}