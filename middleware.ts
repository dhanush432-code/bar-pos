// middleware.ts
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/admin/:path*'], // Protect all routes that start with /admin
};