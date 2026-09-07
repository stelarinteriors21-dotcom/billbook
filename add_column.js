require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  try {
    await pool.query('ALTER TABLE "Invoice" ADD COLUMN "shippingName" TEXT;');
    console.log('Added to Invoice');
  } catch (e) {
    console.error('Invoice:', e.message);
  }
  try {
    await pool.query('ALTER TABLE "Party" ADD COLUMN "shippingName" TEXT;');
    console.log('Added to Party');
  } catch (e) {
    console.error('Party:', e.message);
  }
  process.exit(0);
}
run();
