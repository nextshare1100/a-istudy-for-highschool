import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { campaignService } from '@/lib/services/campaign-service';
import { PRICE_PLANS } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { campaignCode } = await request.json();
    
    // キャンペーンコードの検証
    const validation = await campaignService.validateCode(campaignCode);
    
    if (!validation.isValid || !validation.campaign) {
      return NextResponse.json(
        { error: validation.error || 'Invalid campaign code' },
        { status: 400 }
      );
    }
    
    // チェックアウトセッション作成（完全無料）
    const checkoutSession = await campaignService.createFreeCheckoutSession(
      session.user.id,
      session.user.email!,
      PRICE_PLANS.MONTHLY.id,
      validation.campaign
    );
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Campaign checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}