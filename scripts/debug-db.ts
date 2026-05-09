import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function debug() {
  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables:', tables.map(t => t.table_name));

    const buckets = await sql`SELECT id, name FROM storage.buckets`;
    console.log('Buckets:', buckets);
    
    const config = await sql`SELECT * FROM school_config`;
    console.log('Config:', config);
  } catch (e) {
    console.error('Debug Error:', e);
  } finally {
    await sql.end();
  }
}

debug();
