import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsView } from "./settings-view"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const business = await db.business.findUnique({
    where: { id: session.user.businessId },
    include: {
      users: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          role: true,
        },
      },
      godowns: true,
      taxRates: true,
      units: true,
    },
  })

  if (!business) {
    redirect("/login")
  }

  const serializedBusiness = {
    id: business.id,
    name: business.name,
    gstin: business.gstin || "",
    phone: business.phone || "",
    email: business.email || "",
    address: business.address || "",
    users: business.users.map((u) => ({
      id: u.id,
      name: u.user.name,
      email: u.user.email,
      role: u.role.name,
    })),
    godowns: business.godowns.map((g) => ({
      id: g.id,
      name: g.name,
      isDefault: g.isDefault,
    })),
    taxRates: business.taxRates.map((t) => ({
      id: t.id,
      name: t.name,
      rate: Number(t.rate),
    })),
    units: business.units.map((u) => ({
      id: u.id,
      name: u.name,
      shortName: u.shortName,
    })),
  }

  return <SettingsView business={serializedBusiness} />
}
