// middleware.ts
export { default } from 'next-auth/middleware';

export const config = {
  // This will match everything in /admin/* EXCEPT for /admin/login
  matcher: ['/admin/((?!login).*)'], 
};