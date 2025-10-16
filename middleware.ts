import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  // Log the path for debugging. You can check this in your Vercel logs.
  console.log('Middleware is running on path:', req.nextUrl.pathname);

  // Define your public and protected paths
  const publicPaths = ['/login'];
  const protectedPaths = ['/admin'];
  const pathname = req.nextUrl.pathname;

  // If the path is public, let the request through
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Check if the path is one of the protected routes
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected) {
    // Get the session token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // If there is no token, redirect to the login page
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      // Add a callbackUrl so the user is redirected back after logging in
      url.search = `callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  // If the path is not protected or if the user has a token, proceed
  return NextResponse.next();
}

// This config ensures the middleware runs on all paths EXCEPT static assets and API routes.
// This is a different approach than before, but it's more explicit.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};