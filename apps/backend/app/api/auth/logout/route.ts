import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Clear the session cookie
    cookieStore.delete('session');

    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Clear the session cookie
    cookieStore.delete('session');

    // Redirect to frontend
    return NextResponse.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}?error=logout_failed`
    );
  }
}