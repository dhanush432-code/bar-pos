// middleware.ts (in the root directory)
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/admin/:path*'], // Protect all routes under /admin
};