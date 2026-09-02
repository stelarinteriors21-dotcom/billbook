import 'dotenv/config'
import { InvoiceType } from '@prisma/client'
import { db as prisma } from './db'

async function testTransactionRollback() {
  console.log('Testing transaction rollback...')
  
  // Find a business
  const business = await prisma.business.findFirst()
  if (!business) throw new Error("No business found")
  
  const party = await prisma.party.findFirst({ where: { businessId: business.id } })
  if (!party) throw new Error("No party found")
  
  const initialInvoiceCount = await prisma.invoice.count()
  
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create invoice
      await tx.invoice.create({
        data: {
          businessId: business.id,
          type: InvoiceType.SALES,
          invoiceNumber: 'TEST-ROLLBACK-001',
          invoiceSequence: 999,
          partyId: party.id,
          date: new Date(),
          subTotal: 100,
          totalTax: 18,
          grandTotal: 118,
          amountPaid: 0,
          createdById: party.createdById
        }
      })
      
      // 2. Simulate an error (e.g. out of stock or validation error)
      throw new Error("Simulated failure during transaction")
    })
  } catch (error: any) {
    console.log("Transaction failed as expected with error:", error.message)
  }
  
  const finalInvoiceCount = await prisma.invoice.count()
  
  if (initialInvoiceCount !== finalInvoiceCount) {
    console.error(`❌ Rollback failed! Initial: ${initialInvoiceCount}, Final: ${finalInvoiceCount}`)
    process.exit(1)
  } else {
    console.log(`✅ Rollback successful. Invoice count remained ${initialInvoiceCount}`)
  }
}

testTransactionRollback()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
