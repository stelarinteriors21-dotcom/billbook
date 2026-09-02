import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Ensure user has an active business context
  if (!session.user.businessId) {
    // If we had a business selector page, we would redirect there.
    // For MVP, if they somehow have no business, it's an error state.
    return <div>No business context available.</div>
  }

  return (
    <div className="flex h-screen w-full bg-[#f4f5f8] text-gray-900 font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
