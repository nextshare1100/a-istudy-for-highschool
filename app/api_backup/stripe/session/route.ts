import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Stripe からセッション情報を取得
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    // セキュリティのため、必要な情報のみを返す
    const response = {
      id: session.id,
      customer: session.customer,
      subscription: session.subscription,
      metadata: session.metadata,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      status: session.status,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error retrieving session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}