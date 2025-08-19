// app/api/stripe/portal/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { auth } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
  try {
    // 現在のユーザーを取得
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Firestoreからユーザー情報を取得
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();

    // StripeカスタマーIDがない場合は、メールアドレスから検索
    let stripeCustomerId = userData.stripeCustomerId;
    
    if (!stripeCustomerId) {
      // メールアドレスから既存のカスタマーを検索
      const customers = await stripe.customers.list({
        email: userData.email,
        limit: 1
      });

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        
        // FirestoreにカスタマーIDを保存
        await updateDoc(userRef, {
          stripeCustomerId: stripeCustomerId,
          updatedAt: new Date()
        });
      } else {
        // カスタマーが見つからない場合
        return NextResponse.json(
          { error: 'No subscription found. Please subscribe first.' },
          { status: 404 }
        );
      }
    }

    // カスタマーポータルセッションを作成
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
      locale: 'ja',
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}