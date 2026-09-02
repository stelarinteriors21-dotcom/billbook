import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      businessId: string
      roleId: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    businessId?: string
    roleId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    businessId?: string
    roleId?: string
  }
}
