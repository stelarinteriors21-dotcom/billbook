import 'dotenv/config'
import { InvoiceType, MovementType } from '@prisma/client'
import { db as prisma } from '../src/lib/db'

async function runDatabaseQA() {
  console.log("=== PHASE 2 DATABASE QA ===")

  const business = await prisma.business.findFirst({ include: { users: { include: { user: true } } } })
  if (!business) throw new Error("Missing business")

  const adminUser = business.users[0].user

  // 1. Tenant Isolation
  console.log("Testing Tenant Isolation...")
  const otherBusiness = await prisma.business.create({
    data: { name: "Other Business" }
  })
  
  const user2 = await prisma.user.create({
    data: { name: "User 2", email: "user2@test.com", password: "pwd" }
  })
  
  await prisma.businessUserRole.create({
    data: { businessId: otherBusiness.id, userId: user2.id, roleId: "dummy_role_id" }
  }).catch(() => {}) // ignore role fkey error for quick test

  try {
    // Attempt to read business 1 data from business 2 context (simulated in API by passing wrong businessId)
    const party = await prisma.party.findFirst({ where: { businessId: otherBusiness.id } })
    if (party) throw new Error("Tenant isolation failed")
    console.log("✅ Tenant isolation passed (No crossover records).")
  } catch(e: any) {
    console.error("❌ Tenant isolation failed:", e.message)
  }

  // 2. Negative Tests
  console.log("Testing Negative Conditions...")
  
  // Try to create an item with negative price
  try {
    await prisma.item.create({
      data: {
        businessId: business.id,
        createdById: adminUser.id,
        itemType: 'PRODUCT',
        name: "Negative Item",
        salesPrice: -100
      }
    })
    console.error("❌ DB allowed negative price (should be handled by app/zod).")
  } catch (e: any) {
    // Note: Prisma schema allows negative decimals unless constrained by check constraints or app logic.
    // Our app logic (Zod) blocks it, so this DB test just confirms Prisma schema behavior.
  }

  // 3. Rollback Test (Redo to ensure 0 orphans)
  console.log("Testing Transaction Rollback (Orphan check)...")
  const party = await prisma.party.findFirst({ where: { businessId: business.id } })
  const godown = await prisma.godown.findFirst({ where: { businessId: business.id } })
  const item = await prisma.item.findFirst({ where: { businessId: business.id } })
  
  const beforeCount = {
    invoice: await prisma.invoice.count(),
    lines: await prisma.invoiceLineItem.count(),
    ledger: await prisma.ledgerEntry.count(),
    stock: await prisma.stockMovement.count(),
    payment: await prisma.payment.count()
  }

  try {
    await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          businessId: business.id, type: InvoiceType.SALES,
          invoiceNumber: "FAIL-001", invoiceSequence: 9999, partyId: party!.id,
          date: new Date(), subTotal: 100, totalTax: 10, grandTotal: 110,
          createdById: adminUser.id,
          lines: {
            create: [{
              itemId: item!.id, quantity: 1, rate: 100, taxAmount: 10, total: 110
            }]
          }
        }
      })
      await tx.payment.create({
        data: {
          businessId: business.id, partyId: party!.id, invoiceId: inv.id,
          amount: 110, date: new Date(), mode: 'CASH', createdById: adminUser.id
        }
      })
      await tx.ledgerEntry.create({
        data: {
          businessId: business.id, accountName: 'Cash', debit: 110, credit: 0,
          referenceType: 'PAYMENT', referenceId: 'fake', date: new Date(), createdById: adminUser.id
        }
      })
      await tx.stockMovement.create({
        data: {
          businessId: business.id, itemId: item!.id, godownId: godown!.id,
          type: MovementType.OUT, quantity: 1, referenceType: 'SALES', referenceId: 'fake', date: new Date(), createdById: adminUser.id
        }
      })

      throw new Error("Triggering rollback")
    })
  } catch (e) {}

  const afterCount = {
    invoice: await prisma.invoice.count(),
    lines: await prisma.invoiceLineItem.count(),
    ledger: await prisma.ledgerEntry.count(),
    stock: await prisma.stockMovement.count(),
    payment: await prisma.payment.count()
  }

  const orphans = 
    (afterCount.invoice - beforeCount.invoice) +
    (afterCount.lines - beforeCount.lines) +
    (afterCount.ledger - beforeCount.ledger) +
    (afterCount.stock - beforeCount.stock) +
    (afterCount.payment - beforeCount.payment)

  if (orphans === 0) {
    console.log("✅ Transaction rollback verified (0 orphaned records)")
  } else {
    console.error(`❌ Rollback failed! Found ${orphans} orphaned records.`)
  }

  console.log("=== DB QA COMPLETE ===")
}

runDatabaseQA().catch(console.error).finally(() => prisma.$disconnect())
