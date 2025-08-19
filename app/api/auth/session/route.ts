import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('=== Session API Called ===');
  
  try {
    const body = await request.json();
    console.log('Request body:', { hasToken: !!body.idToken });
    
    const { idToken } = body;
    
    if (!idToken) {
      console.log('No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    // セッションクッキーを設定
    console.log('Setting session cookie...');
    const cookieStore = await cookies();
    cookieStore.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5日間
      path: '/',
    });

    console.log('Session cookie set successfully');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
