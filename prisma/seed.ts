import 'dotenv/config'
import { PrismaClient, PartyType, ItemType, MovementType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting seed...')

  console.log('Clearing existing data...')
  await prisma.stockMovement.deleteMany()
  await prisma.invoiceLineItem.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.item.deleteMany()
  await prisma.party.deleteMany()
  await prisma.taxRate.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.category.deleteMany()
  await prisma.godown.deleteMany()
  await prisma.businessUserRole.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  await prisma.business.deleteMany()

  // 1. Create Business
  const business = await prisma.business.create({
    data: {
      name: 'STELAR INTERIORS PVT LTD',
      gstin: '32ABGCS4458L1Z0',
      phone: '0773613733',
      email: 'info@stelar.in',
      address: 'Vattavila, kunathukal PO, Trivandrum , Kerala, 695504',
    },
  })
  console.log('Business created:', business.id)

  // 2. Create Roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      permissions: ['*'],
    },
  })

  // 3. Create Admin User
  const hashedPassword = await bcrypt.hash('password123', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@supermart.com',
      password: hashedPassword,
      businesses: {
        create: {
          businessId: business.id,
          roleId: adminRole.id,
        },
      },
    },
  })
  console.log('Admin created:', admin.email)

  // 4. Create Godown (Warehouse)
  const godown = await prisma.godown.create({
    data: {
      businessId: business.id,
      name: 'Main Store',
      isDefault: true,
    },
  })

  // 5. Create Categories
  const catElectronics = await prisma.category.create({ data: { businessId: business.id, name: 'Electronics' } })
  const catGroceries = await prisma.category.create({ data: { businessId: business.id, name: 'Groceries' } })

  // 6. Create Units
  const unitPcs = await prisma.unit.create({ data: { businessId: business.id, name: 'Pieces', shortName: 'PCS' } })
  const unitKg = await prisma.unit.create({ data: { businessId: business.id, name: 'Kilograms', shortName: 'KG' } })

  // 7. Create Tax Rates
  const tax18 = await prisma.taxRate.create({ data: { businessId: business.id, name: 'GST 18%', rate: 18.00 } })
  const tax5 = await prisma.taxRate.create({ data: { businessId: business.id, name: 'GST 5%', rate: 5.00 } })
  const tax0 = await prisma.taxRate.create({ data: { businessId: business.id, name: 'GST 0%', rate: 0.00 } })

  // 8. Create Parties (Customers)
  const customers = []
  for (let i = 1; i <= 10; i++) {
    customers.push(
      await prisma.party.create({
        data: {
          businessId: business.id,
          partyType: PartyType.CUSTOMER,
          name: `Customer ${i} Traders`,
          mobileNumber: `980000000${i}`,
          billingAddress: `Billing Address ${i}`,
          createdById: admin.id,
        },
      })
    )
  }

  // Create Parties (Suppliers)
  const suppliers = []
  for (let i = 1; i <= 5; i++) {
    suppliers.push(
      await prisma.party.create({
        data: {
          businessId: business.id,
          partyType: PartyType.SUPPLIER,
          name: `Supplier ${i} Distributors`,
          mobileNumber: `970000000${i}`,
          createdById: admin.id,
        },
      })
    )
  }
  console.log('Parties created')

  // 9. Create Items
  const items = []
  // Electronics
  for (let i = 1; i <= 10; i++) {
    items.push(
      await prisma.item.create({
        data: {
          businessId: business.id,
          itemType: ItemType.PRODUCT,
          name: `Smart Item X-${i}00`,
          salesPrice: 1000 + i * 100,
          purchasePrice: 800 + i * 80,
          categoryId: catElectronics.id,
          unitId: unitPcs.id,
          taxRateId: tax18.id,
          createdById: admin.id,
          hsnSac: `8543${i}000`,
        },
      })
    )
  }
  // Groceries
  for (let i = 1; i <= 10; i++) {
    items.push(
      await prisma.item.create({
        data: {
          businessId: business.id,
          itemType: ItemType.PRODUCT,
          name: `Premium Quality Grain ${i}`,
          salesPrice: 50 + i * 10,
          purchasePrice: 40 + i * 5,
          categoryId: catGroceries.id,
          unitId: unitKg.id,
          taxRateId: tax5.id,
          createdById: admin.id,
          hsnSac: `1006${i}000`,
        },
      })
    )
  }
  console.log('Items created')

  // 10. Initial Stock Movements (Opening Balance)
  for (const item of items) {
    await prisma.stockMovement.create({
      data: {
        businessId: business.id,
        itemId: item.id,
        godownId: godown.id,
        type: MovementType.IN,
        quantity: 100,
        referenceType: 'OPENING_BALANCE',
        referenceId: 'INITIAL_SEED',
        date: new Date(),
        createdById: admin.id,
      },
    })
  }
  console.log('Initial stock recorded')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
