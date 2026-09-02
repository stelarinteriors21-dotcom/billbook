import 'dotenv/config'
import { InvoiceType, MovementType } from '@prisma/client'
import { db as prisma } from '../src/lib/db'

async function seedQA() {
  const business = await prisma.business.findFirst({ include: { users: { include: { user: true } } } })
  if (!business) throw new Error("Missing business")
  const adminUser = business.users[0].user

  const party = await prisma.party.findFirst({ where: { businessId: business.id } })
  const godown = await prisma.godown.findFirst({ where: { businessId: business.id } })
  const item = await prisma.item.findFirst({ where: { businessId: business.id } })
  
  if (!party || !godown || !item) {
    console.log("Seeding failed, missing requirements")
    return
  }

  const inv = await prisma.invoice.create({
    data: {
      businessId: business.id, type: InvoiceType.SALES,
      invoiceNumber: "INV-QA-001", invoiceSequence: 1000, partyId: party.id,
      date: new Date(), subTotal: 200, totalDiscount: 10, totalTax: 10, grandTotal: 200, amountPaid: 50,
      status: 'PARTIAL',
      createdById: adminUser.id,
      lines: {
        create: [{
          itemId: item.id, quantity: 2, rate: 100, taxAmount: 10, discountAmount: 10, total: 200
        }]
      }
    }
  })
  
  await prisma.payment.create({
    data: {
      businessId: business.id, partyId: party.id, invoiceId: inv.id,
      amount: 50, date: new Date(), mode: 'CASH', createdById: adminUser.id
    }
  })
  
  console.log("Seeded Invoice ID:", inv.id)
}
seedQA().catch(console.error).finally(() => prisma.$disconnect())
