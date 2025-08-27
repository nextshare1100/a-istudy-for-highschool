// lib/subscription/check-subscription.ts
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { SubscriptionStatus } from '@/types/subscription';

export async function checkSubscription(userId: string | null | undefined): Promise<{
  active: boolean;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
}> {
  // userIdがない場合はinactiveを返す
  if (!userId) {
    console.log('[checkSubscription] No userId provided');
    return {
      active: false,
      status: 'inactive'
    };
  }

  try {
    console.log(`[checkSubscription] Checking subscription for user: ${userId}`);
    
    // 1. まずユーザードキュメントを確認
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log('[checkSubscription] User document not found');
      return {
        active: false,
        status: 'inactive'
      };
    }
    
    const userData = userDoc.data();
    console.log('[checkSubscription] User data:', {
      subscriptionStatus: userData.subscriptionStatus,
      subscriptionId: userData.subscriptionId,
      stripeCustomerId: userData.stripeCustomerId
    });
    
    // 法人契約の場合
    if (userData.subscriptionStatus === 'corporate') {
      console.log('[checkSubscription] Corporate subscription detected');
      return {
        active: true,
        status: 'active',
        currentPeriodEnd: undefined // 法人契約に期限なし
      };
    }
    
    // サブスクリプションIDがある場合、subscriptionsコレクションから取得
    if (userData.subscriptionId) {
      try {
        const subDoc = await getDoc(doc(db, 'subscriptions', userData.subscriptionId));
        
        if (subDoc.exists()) {
          const subData = subDoc.data();
          console.log('[checkSubscription] Subscription document found:', {
            status: subData.status,
            currentPeriodEnd: subData.currentPeriodEnd?.toDate ? subData.currentPeriodEnd.toDate() : subData.currentPeriodEnd,
            cancelAtPeriodEnd: subData.cancelAtPeriodEnd
          });
          
          const currentPeriodEnd = subData.currentPeriodEnd?.toDate ? 
            subData.currentPeriodEnd.toDate() : 
            (subData.currentPeriodEnd ? new Date(subData.currentPeriodEnd) : null);
          
          // アクティブかチェック
          const isActive = (subData.status === 'active' || subData.status === 'trialing') && 
                          (!currentPeriodEnd || currentPeriodEnd > new Date());
          
          return {
            active: isActive,
            status: subData.status || 'inactive',
            currentPeriodEnd: currentPeriodEnd || undefined
          };
        } else {
          console.log('[checkSubscription] Subscription document not found for ID:', userData.subscriptionId);
        }
      } catch (error) {
        console.error('[checkSubscription] Error fetching subscription document:', error);
      }
    }
    
    // 2. サブスクリプションIDがない場合、subscriptionsコレクションをuserIdで検索
    console.log('[checkSubscription] Searching subscriptions by userId...');
    try {
      const subsQuery = query(
        collection(db, 'subscriptions'),
        where('userId', '==', userId)
      );
      const subsSnapshot = await getDocs(subsQuery);
      
      if (!subsSnapshot.empty) {
        // 最新のサブスクリプションを取得（複数ある場合）
        let latestSub = null;
        let latestDate = new Date(0);
        
        subsSnapshot.forEach(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          if (createdAt > latestDate) {
            latestDate = createdAt;
            latestSub = { id: doc.id, ...data };
          }
        });
        
        if (latestSub) {
          console.log('[checkSubscription] Found subscription by userId query:', {
            subscriptionId: latestSub.id,
            status: latestSub.status
          });
          
          // ユーザードキュメントにサブスクリプションIDを更新
          try {
            await updateDoc(doc(db, 'users', userId), {
              subscriptionId: latestSub.id,
              subscriptionStatus: latestSub.status === 'active' || latestSub.status === 'trialing' ? 'active' : 'inactive'
            });
          } catch (updateError) {
            console.error('[checkSubscription] Error updating user document:', updateError);
          }
          
          const currentPeriodEnd = latestSub.currentPeriodEnd?.toDate ? 
            latestSub.currentPeriodEnd.toDate() : 
            (latestSub.currentPeriodEnd ? new Date(latestSub.currentPeriodEnd) : null);
          
          const isActive = (latestSub.status === 'active' || latestSub.status === 'trialing') && 
                          (!currentPeriodEnd || currentPeriodEnd > new Date());
          
          return {
            active: isActive,
            status: latestSub.status || 'inactive',
            currentPeriodEnd: currentPeriodEnd || undefined
          };
        }
      }
    } catch (queryError) {
      console.error('[checkSubscription] Error querying subscriptions:', queryError);
    }
    
    // 3. ユーザーのsubscriptionStatusをチェック（簡易チェック）
    if (userData.subscriptionStatus === 'active' || userData.subscriptionStatus === 'premium') {
      console.log('[checkSubscription] User has active/premium status but no subscription document found');
      // サブスクリプションドキュメントが見つからないが、ステータスがアクティブの場合
      // 一時的にアクティブとして扱う（データ整合性の問題の可能性）
      return {
        active: true,
        status: 'active',
        currentPeriodEnd: undefined
      };
    }
    
    // どこにもサブスクリプション情報が見つからない場合
    console.log('[checkSubscription] No active subscription found');
    return {
      active: false,
      status: 'inactive'
    };
    
  } catch (error) {
    console.error('[checkSubscription] Unexpected error:', error);
    return {
      active: false,
      status: 'inactive'
    };
  }
}

export async function hasActiveSubscription(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const { active } = await checkSubscription(userId);
  return active;
}