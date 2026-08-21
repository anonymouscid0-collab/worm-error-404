import { NextRequest, NextResponse } from 'next/server';

const BACKEND = 'https://worm-error-404.onrender.com';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization');
    const res = await fetch(`${BACKEND}/api/chat/conversations`, {
      headers: token ? { 'Authorization': token } : {},
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization');
    const res = await fetch(`${BACKEND}/api/chat/conversations`, {
      method: 'POST',
      headers: token ? { 'Authorization': token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
