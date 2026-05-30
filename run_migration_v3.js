const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sqlPath = path.join(__dirname, 'migration_v3.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const password = '9pc8DXxNjqqZHBO2';
const host = 'aws-1-ap-northeast-1.pooler.supabase.com';
const projectRef = "mhullybkbedkojgrwxdx";
const username = `postgres.${projectRef}`;

async function main() {
  console.log(`Connecting to pooler: ${host}...`);
  const client = new Client({
    host,
    port: 6543,
    database: "postgres",
    user: username,
    password,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("✅ Connected successfully to Supabase database!");
    console.log("Running migration SQL...");
    await client.query(sql);
    console.log("✅ Database migration v3 ran successfully!");
    await client.end();
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    try {
      await client.end();
    } catch (e) {}
    process.exit(1);
  }
}

main().catch(console.error);
