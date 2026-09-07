require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL + '?sslmode=require' });
async function run() {
  try {
    await pool.query('ALTER TABLE "Party" ADD COLUMN "panNumber" TEXT;');
    console.log('Added to Party');
  } catch (e) {
    console.error('Party:', e.message);
  }
  process.exit(0);
}
run();
