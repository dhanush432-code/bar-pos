// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // This is a simplified auth. In a real app, you'd query a users DB.
        const adminUser = process.env.ADMIN_USERNAME;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (!adminUser || !adminPass) {
          console.error("Admin credentials are not set in .env.local");
          return null;
        }

        // For this example, we compare with env vars.
        // A real app should hash the password on setup and store it.
        // Let's pretend the env var is the plaintext password and compare directly.
        // For security, you would normally do: `const isMatch = await bcrypt.compare(credentials.password, user.passwordHash)`
        if (credentials?.username === adminUser && credentials?.password === adminPass) {
          return { id: '1', name: 'Admin', email: 'admin@example.com' };
        }
        
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login', // Redirect to custom login page
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };