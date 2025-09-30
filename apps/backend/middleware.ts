import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // CORS 헤더를 설정합니다
  const response = NextResponse.next();

  const origin = request.headers.get('origin');
  console.log(process.env.CORS_ORIGIN);
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:2000';

  // origin이 허용된 origin과 일치하는지 확인
  if (origin === allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // OPTIONS 요청 (preflight)에 대한 처리
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
