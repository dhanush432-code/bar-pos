// Forcing a clean build on Vercel - a trivial change to invalidate the cache
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/admin/:path*'],
};