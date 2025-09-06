import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { db } from '../firebase';
import { Timestamp } from 'firebase-admin/firestore';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

const endpointSecret = functions.config().stripe.webhook_secret;

// 処理済みイベントを追跡（Firestore使用）
async function isEventProcessed(eventId: string): Promise<boolean> {
  const doc = await db.collection('processedWebhookEvents').doc(eventId).get();
  return doc.exists;
}

async function markEventAsProcessed(eventId: string): Promise<void> {
  await db.collection('processedWebhookEvents').doc(eventId).set({
    processedAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
  });
}

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  
  const sig = req.headers['stripe-signature'] as string;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  
  // 冪等性チェック
  if (await isEventProcessed(event.id)) {
    console.log(`Event ${event.id} already processed`);
    res.json({ received: true, duplicate: true });
    return;
  }
  
  try {
    // イベントタイプごとの処理
    switch (event.type) {
      // 重要: checkout.session.completedイベントの処理を追加
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // イベントを処理済みとしてマーク
    await markEventAsProcessed(event.id);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// 新規追加: チェックアウトセッション完了時の処理
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);
  
  // 支払いが成功している場合のみ処理
  if (session.payment_status !== 'paid') {
    console.log('Session payment not completed:', session.payment_status);
    return;
  }
  
  const userId = session.metadata?.firebaseUserId;
  
  if (!userId) {
    console.error('No user ID in session metadata for session:', session.id);
    return;
  }
  
  console.log(`Activating subscription for user ${userId} from checkout session`);
  
  try {
    // 即座にユーザーステータスを更新
    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'active',
      stripeCustomerId: session.customer as string,
      lastPaymentSessionId: session.id,
      updatedAt: Timestamp.now(),
    });
    
    console.log(`User ${userId} subscription activated successfully`);
    
    // 通知を作成（オプション）
    await db.collection('notifications').add({
      userId,
      type: 'subscription_activated',
      title: 'プレミアムプランへようこそ！',
      message: 'すべての機能がご利用いただけるようになりました。',
      read: false,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Failed to update user status from checkout session:', error);
    throw error;
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.firebaseUserId;
  
  if (!userId) {
    console.error('No user ID in subscription metadata');
    return;
  }
  
  const subscriptionData = {
    userId,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0].price.id,
    status: subscription.status,
    currentPeriodStart: Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at 
      ? Timestamp.fromMillis(subscription.canceled_at * 1000) 
      : null,
    updatedAt: Timestamp.now(),
  };
  
  // トランザクションで更新
  await db.runTransaction(async (transaction) => {
    // サブスクリプションドキュメントを更新
    transaction.set(
      db.collection('subscriptions').doc(subscription.id),
      subscriptionData,
      { merge: true }
    );
    
    // ユーザードキュメントを更新
    transaction.update(db.collection('users').doc(userId), {
      subscriptionStatus: mapStripeStatusToAppStatus(subscription.status),
      subscriptionId: subscription.id,
      updatedAt: Timestamp.now(),
    });
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.firebaseUserId;
  
  if (!userId) {
    console.error('No user ID in subscription metadata');
    return;
  }
  
  await db.runTransaction(async (transaction) => {
    // ユーザーステータスを更新
    transaction.update(db.collection('users').doc(userId), {
      subscriptionStatus: 'free',
      subscriptionId: null,
      updatedAt: Timestamp.now(),
    });
    
    // サブスクリプションドキュメントを更新
    transaction.update(db.collection('subscriptions').doc(subscription.id), {
      status: 'canceled',
      canceledAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    // 通知を作成
    transaction.create(db.collection('notifications').doc(), {
      userId,
      type: 'subscription_canceled',
      title: 'プレミアムプランが終了しました',
      message: 'フリープランに戻りました。いつでも再登録できます。',
      read: false,
      createdAt: Timestamp.now(),
    });
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    return;
  }
  
  await db.collection('subscriptions').doc(subscriptionId).update({
    lastPaymentAmount: invoice.amount_paid,
    lastPaymentDate: Timestamp.fromMillis(invoice.created * 1000),
    nextPaymentDate: invoice.next_payment_attempt 
      ? Timestamp.fromMillis(invoice.next_payment_attempt * 1000)
      : null,
    updatedAt: Timestamp.now(),
  });
  
  // 請求書レコードを作成
  await db.collection('invoices').doc(invoice.id).set({
    subscriptionId,
    customerId: invoice.customer as string,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status,
    pdfUrl: invoice.invoice_pdf,
    created: Timestamp.fromMillis(invoice.created * 1000),
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const userId = subscription.metadata.firebaseUserId;
  
  if (!userId) {
    return;
  }
  
  // 支払い失敗通知を作成
  await db.collection('notifications').add({
    userId,
    type: 'payment_failed',
    title: '支払いに失敗しました',
    message: '登録されているカードでの支払いができませんでした。支払い方法を更新してください。',
    priority: 'high',
    read: false,
    createdAt: Timestamp.now(),
  });
  
  // TODO: メール通知を送信
}

function mapStripeStatusToAppStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'trialing':
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'cancelled';
    default:
      return 'free';
  }
}

// 古い処理済みイベントを定期的にクリーンアップ
export const cleanupProcessedEvents = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const now = Timestamp.now();
    const expiredEvents = await db
      .collection('processedWebhookEvents')
      .where('expiresAt', '<', now)
      .get();
    
    const batch = db.batch();
    expiredEvents.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleaned up ${expiredEvents.size} expired webhook events`);
  });