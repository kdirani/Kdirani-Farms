import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createClient } from '@/lib/supabase/server';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const supabase = await createClient();

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          if (error || !data.user) {
            return null;
          }

          // Get user profile with role
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError || !profile) {
            return null;
          }

          return {
            id: data.user.id,
            email: data.user.email!,
            name: profile.fname,
            role: profile.user_role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'admin' | 'sub_admin' | 'farmer';
        session.user.name = token.name as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnFarmer = nextUrl.pathname.startsWith('/farmer');
      const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

      if (isOnAuth) {
        if (isLoggedIn) {
          // Redirect authenticated users away from auth pages
          if (auth.user.role === 'admin' || auth.user.role === 'sub_admin') {
            return Response.redirect(new URL('/admin', nextUrl));
          } else {
            return Response.redirect(new URL('/farmer', nextUrl));
          }
        }
        return true;
      }

      if (isOnDashboard || isOnAdmin || isOnFarmer) {
        if (!isLoggedIn) {
          return false; // Redirect to login
        }

        // Role-based access control
        if (isOnAdmin && auth.user.role === 'farmer') {
          return Response.redirect(new URL('/farmer', nextUrl));
        }

        if (isOnFarmer && (auth.user.role === 'admin' || auth.user.role === 'sub_admin')) {
          return Response.redirect(new URL('/admin', nextUrl));
        }

        return true;
      }

      return true;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
} satisfies NextAuthConfig;
