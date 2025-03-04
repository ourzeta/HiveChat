import NextAuth from "next-auth";
import { ZodError } from "zod";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "@/app/lib/zod";
import { verifyPassword } from "@/app/utils/password";
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import Feishu from "@/app/auth/providers/feishu";
import { eq } from 'drizzle-orm';

let feishuAuth: any[] = [];
if (process.env.FEISHU_AUTH_STATUS === 'ON') {
  feishuAuth = [Feishu({
    clientId: process.env.FEISHU_CLIENT_ID!,
    clientSecret: process.env.FEISHU_CLIENT_SECRET!,
  })]
}
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    ...feishuAuth,
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials);
          const user = await db.query.users
            .findFirst({
              where: eq(users.email, email)
            })
          if (!user || !user.password) {
            return null;
          }
          const passwordMatch = await verifyPassword(password, user.password);
          if (passwordMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              isAdmin: user.isAdmin || false,
            };
          } else {
            return null;
          }
        } catch (error) {
          if (error instanceof ZodError) {
            // 如果验证失败，返回 null 表示凭据无效
            return null;
          }
          // 处理其他错误
          throw error;
        }
      },
    }),

  ],
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      // 处理飞书登录的情况
      if (account?.provider === "feishu" && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.feishuUserId, account.providerAccountId)
        });
        
        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user, // 保留已有的属性
          id: String(token.id),
          isAdmin: Boolean(token.isAdmin), // 添加 isAdmin
        };
      }
      return session;
    },
  },
})