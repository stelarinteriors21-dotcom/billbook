import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

async function main() {
  console.log("Connecting to local db...")
  const localPool = new pg.Pool({ connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable" })
  const localDb = new PrismaClient({ adapter: new PrismaPg(localPool) })

  console.log("Connecting to remote db...")
  const remotePool = new pg.Pool({ connectionString: "postgresql://postgres.seyopfjkmhxzkdjpadie:UFBgcBp5nPkxe1QZ@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" })
  const remoteDb = new PrismaClient({ adapter: new PrismaPg(remotePool) })

  // 1. Push schema. Wait, we cant push schema here easily. Let's do it via CLI first.
  
  console.log("Reading data...")
  const users = await localDb.user.findMany()
  const businesses = await localDb.business.findMany()
  const roles = await localDb.role.findMany()
  const businessUserRoles = await localDb.businessUserRole.findMany()
  const parties = await localDb.party.findMany()
  const items = await localDb.item.findMany()
  const categories = await localDb.category.findMany()
  const units = await localDb.unit.findMany()
  const taxRates = await localDb.taxRate.findMany()
  const invoices = await localDb.invoice.findMany()
  const invoiceLines = await localDb.invoiceLineItem.findMany()

  console.log("Writing to remote...")
  // Insert in order of dependencies
  if (businesses.length) await remoteDb.business.createMany({ data: businesses })
  if (users.length) await remoteDb.user.createMany({ data: users })
  if (roles.length) await remoteDb.role.createMany({ data: roles })
  if (businessUserRoles.length) await remoteDb.businessUserRole.createMany({ data: businessUserRoles })
  
  if (categories.length) await remoteDb.category.createMany({ data: categories })
  if (units.length) await remoteDb.unit.createMany({ data: units })
  if (taxRates.length) await remoteDb.taxRate.createMany({ data: taxRates })
  
  if (parties.length) await remoteDb.party.createMany({ data: parties })
  if (items.length) await remoteDb.item.createMany({ data: items })
  
  if (invoices.length) await remoteDb.invoice.createMany({ data: invoices })
  if (invoiceLines.length) await remoteDb.invoiceLineItem.createMany({ data: invoiceLines })

  console.log("Done migrating data!")
}

main().catch(console.error)

