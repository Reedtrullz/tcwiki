import { NextRequest, NextResponse } from 'next/server';

function randomNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://gateway.liquify.com https://midgard.thorchain.network https://thornode.thorchain.network",
    "frame-ancestors 'none'",
    "report-uri /api/csp-report",
  ].join('; ');
}

export function proxy(request: NextRequest) {
  const nonce = randomNonce();
  const header = process.env.CSP_ENFORCE === '1'
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only';
  const policy = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(header, policy);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(header, policy);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
