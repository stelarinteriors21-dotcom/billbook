"use client"

import { LogOut, User } from "lucide-react"
import { signOut } from "next-auth/react"

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center">
        {/* Placeholder for breadcrumbs or page title context */}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <span className="font-medium hidden sm:block">{user.name || user.email}</span>
        </div>
        <button
          onClick={() => signOut()}
          className="text-gray-500 hover:text-gray-700"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
