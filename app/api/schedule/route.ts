import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Schedule API' })
}

export async function POST() {
  return NextResponse.json({ message: 'Schedule created' })
}
