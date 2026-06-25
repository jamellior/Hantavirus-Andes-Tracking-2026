import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "",
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER || "",
          pass: process.env.EMAIL_SERVER_PASSWORD || "",
        },
      },
      from: process.env.EMAIL_FROM || "noreply@remoteradar.com",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ token, session }) {
      if (token && session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "user";
      } else {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
        })
        if (dbUser) {
          token.role = dbUser.role
        }
      }
      return token
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
}