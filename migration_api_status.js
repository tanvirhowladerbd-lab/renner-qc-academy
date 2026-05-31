const { Client } = require('pg');

const password = '9pc8DXxNjqqZHBO2';
const host = 'aws-1-ap-northeast-1.pooler.supabase.com';
const projectRef = "mhullybkbedkojgrwxdx";
const username = `postgres.${projectRef}`;

const sql = `
CREATE TABLE IF NOT EXISTS api_status (
  id INTEGER PRIMARY KEY DEFAULT 1,
  active_api TEXT DEFAULT 'anthropic',
  anthropic_failed_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  status TEXT DEFAULT 'healthy',
  error_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO api_status (id, active_api, status)
VALUES (1, 'anthropic', 'healthy')
ON CONFLICT (id) DO NOTHING;
`;

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
    console.log("Running API Status Table migration...");
    await client.query(sql);
    console.log("✅ API Status Table migration ran successfully!");
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
