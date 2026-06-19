import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Standard setup placeholder
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
}
