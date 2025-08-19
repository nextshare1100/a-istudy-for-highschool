import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// Webhookハンドラー
export async function POST(req: NextRequest) {
  console.log('=== Stripe Webhook Received ===');
  
  try {
    // リクエストボディを取得
    const body = await req.text();
    
    // Stripe署名の検証
    const signature = headers().get('stripe-signature');
    
    if (!signature) {
      console.error('No stripe signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }
    
    // Webhook シークレットの確認
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    let event: Stripe.Event;
    
    try {
      // イベントの検証と構築
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }
    
    console.log(`Processing webhook event: ${event.type}`);
    console.log('Event ID:', event.id);
    
    // 重複処理を防ぐため、イベントIDを記録
    const eventRef = adminFirestore.collection('webhookEvents').doc(event.id);
    const eventDoc = await eventRef.get();
    
    if (eventDoc.exists) {
      console.log('Event already processed:', event.id);
      return NextResponse.json({ received: true });
    }
    
    // イベント処理開始を記録
    await eventRef.set({
      eventId: event.id,
      type: event.type,
      createdAt: new Date(),
      processed: false
    });
    
    try {
      // イベントタイプに応じた処理
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log('Checkout completed:', session.id);
          
          // セッションの詳細情報を取得（subscription を含む）
          const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['subscription', 'customer', 'line_items']
          });
          
          const firebaseUserId = fullSession.metadata?.firebaseUserId || 
                                fullSession.subscription?.metadata?.firebaseUserId;
          
          if (!firebaseUserId) {
            console.error('No Firebase user ID found in session metadata');
            break;
          }
          
          // サブスクリプション情報を取得
          const subscription = fullSession.subscription as Stripe.Subscription;
          
          if (!subscription) {
            console.error('No subscription found in session');
            break;
          }
          
          // カスタマー情報
          const customer = fullSession.customer as Stripe.Customer;
          
          // サブスクリプションデータを準備
          const subscriptionData = {
            subscriptionId: subscription.id,
            customerId: subscription.customer,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            createdAt: new Date(subscription.created * 1000),
            updatedAt: new Date(),
            
            // キャンペーンコード情報
            campaignCode: fullSession.metadata?.campaignCode || subscription.metadata?.campaignCode || null,
            
            // トライアル情報
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            isTrialPeriod: subscription.trial_end ? subscription.trial_end > Date.now() / 1000 : false,
            
            // 価格情報
            priceId: subscription.items.data[0]?.price.id,
            amount: subscription.items.data[0]?.price.unit_amount,
            currency: subscription.items.data[0]?.price.currency,
            interval: subscription.items.data[0]?.price.recurring?.interval,
            
            // ユーザー情報
            userId: firebaseUserId,
            customerEmail: customer?.email || null,
          };
          
          // Firestoreにサブスクリプション情報を保存
          await adminFirestore
            .collection('subscriptions')
            .doc(subscription.id)
            .set(subscriptionData, { merge: true });
          
          // ユーザードキュメントを更新
          const userUpdateData: any = {
            subscriptionStatus: 'active',
            subscriptionId: subscription.id,
            stripeCustomerId: subscription.customer,
            updatedAt: new Date(),
          };
          
          // AISTUDYTRIAL キャンペーンを使用した場合の記録
          if (fullSession.metadata?.campaignCode === 'AISTUDYTRIAL') {
            userUpdateData.usedCampaigns = admin.firestore.FieldValue.arrayUnion('AISTUDYTRIAL');
            userUpdateData.aistudyTrialUsedAt = new Date();
          }
          
          await adminFirestore
            .collection('users')
            .doc(firebaseUserId)
            .update(userUpdateData);
          
          // AISTUDYTRIAL使用履歴を記録（重複使用防止用）
          if (fullSession.metadata?.campaignCode === 'AISTUDYTRIAL') {
            await adminFirestore
              .collection('campaignUsage')
              .doc(`${firebaseUserId}_AISTUDYTRIAL`)
              .set({
                userId: firebaseUserId,
                campaignCode: 'AISTUDYTRIAL',
                subscriptionId: subscription.id,
                usedAt: new Date(),
                email: customer?.email || null,
                customerId: customer?.id || null,
              });
          }
          
          // 支払い履歴を記録
          await adminFirestore
            .collection('users')
            .doc(firebaseUserId)
            .collection('payments')
            .doc(session.id)
            .set({
              sessionId: session.id,
              subscriptionId: subscription.id,
              amount: fullSession.amount_total,
              currency: fullSession.currency,
              status: 'completed',
              type: 'subscription_creation',
              createdAt: new Date(),
              metadata: fullSession.metadata || {},
            });
          
          console.log(`Subscription ${subscription.id} created for user ${firebaseUserId}`);
          break;
        }
        
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`Subscription ${event.type}:`, subscription.id);
          
          const firebaseUserId = subscription.metadata?.firebaseUserId;
          
          if (!firebaseUserId) {
            console.error('No Firebase user ID found in subscription metadata');
            break;
          }
          
          // サブスクリプション情報を更新
          const subscriptionData = {
            subscriptionId: subscription.id,
            customerId: subscription.customer,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            updatedAt: new Date(),
            
            // トライアル情報
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            isTrialPeriod: subscription.trial_end ? subscription.trial_end > Date.now() / 1000 : false,
            
            // 価格情報
            priceId: subscription.items.data[0]?.price.id,
            amount: subscription.items.data[0]?.price.unit_amount,
            currency: subscription.items.data[0]?.price.currency,
            interval: subscription.items.data[0]?.price.recurring?.interval,
          };
          
          await adminFirestore
            .collection('subscriptions')
            .doc(subscription.id)
            .set(subscriptionData, { merge: true });
          
          // ユーザーのサブスクリプションステータスを更新
          let userStatus = 'active';
          if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            userStatus = 'inactive';
          } else if (subscription.status === 'past_due') {
            userStatus = 'past_due';
          } else if (subscription.status === 'trialing') {
            userStatus = 'trialing';
          }
          
          await adminFirestore
            .collection('users')
            .doc(firebaseUserId)
            .update({
              subscriptionStatus: userStatus,
              subscriptionUpdatedAt: new Date(),
            });
          
          console.log(`Updated subscription ${subscription.id} for user ${firebaseUserId}`);
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('Subscription deleted:', subscription.id);
          
          const firebaseUserId = subscription.metadata?.firebaseUserId;
          
          if (!firebaseUserId) {
            console.error('No Firebase user ID found in subscription metadata');
            break;
          }
          
          // サブスクリプション情報を更新（削除済みとしてマーク）
          await adminFirestore
            .collection('subscriptions')
            .doc(subscription.id)
            .update({
              status: 'canceled',
              deletedAt: new Date(),
              updatedAt: new Date(),
            });
          
          // ユーザーのサブスクリプションステータスを更新
          await adminFirestore
            .collection('users')
            .doc(firebaseUserId)
            .update({
              subscriptionStatus: 'inactive',
              subscriptionEndedAt: new Date(),
              subscriptionId: null,
            });
          
          console.log(`Deleted subscription ${subscription.id} for user ${firebaseUserId}`);
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log('Invoice payment succeeded:', invoice.id);
          
          // サブスクリプションIDから関連情報を取得
          const subscriptionId = invoice.subscription as string;
          
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const firebaseUserId = subscription.metadata?.firebaseUserId;
            
            if (firebaseUserId) {
              // 支払い履歴を記録
              await adminFirestore
                .collection('users')
                .doc(firebaseUserId)
                .collection('payments')
                .doc(invoice.id)
                .set({
                  invoiceId: invoice.id,
                  subscriptionId: subscriptionId,
                  amount: invoice.amount_paid,
                  currency: invoice.currency,
                  status: 'paid',
                  type: 'subscription_renewal',
                  periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
                  periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
                  createdAt: new Date(),
                  paidAt: new Date(),
                });
              
              console.log(`Recorded payment for user ${firebaseUserId}`);
            }
          }
          break;
        }
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log('Invoice payment failed:', invoice.id);
          
          const subscriptionId = invoice.subscription as string;
          
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const firebaseUserId = subscription.metadata?.firebaseUserId;
            
            if (firebaseUserId) {
              // 支払い失敗を記録
              await adminFirestore
                .collection('users')
                .doc(firebaseUserId)
                .collection('payments')
                .doc(invoice.id)
                .set({
                  invoiceId: invoice.id,
                  subscriptionId: subscriptionId,
                  amount: invoice.amount_due,
                  currency: invoice.currency,
                  status: 'failed',
                  type: 'subscription_renewal',
                  attemptCount: invoice.attempt_count,
                  nextPaymentAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null,
                  createdAt: new Date(),
                  failedAt: new Date(),
                });
              
              // ユーザーステータスを更新
              await adminFirestore
                .collection('users')
                .doc(firebaseUserId)
                .update({
                  subscriptionStatus: 'past_due',
                  lastPaymentFailedAt: new Date(),
                });
              
              console.log(`Payment failed for user ${firebaseUserId}`);
            }
          }
          break;
        }
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      // イベント処理完了を記録
      await eventRef.update({
        processed: true,
        processedAt: new Date(),
      });
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      
      // エラーを記録
      await eventRef.update({
        processed: true,
        processedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // エラーでも200を返す（Stripeが再送信しないように）
      return NextResponse.json({ received: true });
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Stripeの要求に応じてGETメソッドも実装（ヘルスチェック用）
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}