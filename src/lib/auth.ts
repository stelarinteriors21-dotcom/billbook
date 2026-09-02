import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
// For NextAuth in App Router, we usually instantiate a global Prisma client
import { db } from "./db"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { businesses: true }
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) return null

        // For MVP, we auto-select the first business they belong to
        const primaryBusiness = user.businesses[0]

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          businessId: primaryBusiness?.businessId,
          roleId: primaryBusiness?.roleId
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.businessId = user.businessId
        token.roleId = user.roleId
      }
      
      // Allow updating active business from client
      if (trigger === "update" && session?.businessId) {
        token.businessId = session.businessId
        token.roleId = session.roleId
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.businessId = token.businessId as string
        session.user.roleId = token.roleId as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}
