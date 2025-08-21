// app/api/subscription/verify/route.ts
export async function POST(request: Request) {
  const { platform, receipt, userId } = await request.json();

  try {
    let isValid = false;
    let subscriptionData = {};

    switch (platform) {
      case 'ios':
        // App Store Receipt検証
        const appleResponse = await fetch(
          'https://buy.itunes.apple.com/verifyReceipt',
          {
            method: 'POST',
            body: JSON.stringify({
              'receipt-data': receipt,
              password: process.env.APP_STORE_SHARED_SECRET
            })
          }
        );
        const appleData = await appleResponse.json();
        isValid = appleData.status === 0;
        break;

      case 'android':
        // Google Play購入検証
        // Google Play Developer APIを使用
        break;

      case 'web':
        // Stripe検証（既存の実装）
        break;
    }

    // Firestoreに保存
    if (isValid) {
      await updateUserSubscription(userId, {
        platform,
        status: 'active',
        ...subscriptionData
      });
    }

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}