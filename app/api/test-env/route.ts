import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasKey: !!process.env.GEMINI_API_KEY,
    firstChars: process.env.GEMINI_API_KEY?.substring(0, 10),
    length: process.env.GEMINI_API_KEY?.length
  });
}
