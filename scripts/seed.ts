import { neon } from '@neondatabase/serverless';
import seed from '../data/seed.json';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  for (const r of seed as any[]) {
    await sql`INSERT INTO resources (name, type, address, area, phone, hours, website, source_url, description) VALUES (${r.name}, ${r.type}, ${r.address}, ${r.area}, ${r.phone}, ${r.hours}, ${r.website}, ${r.source_url}, ${r.description}) ON CONFLICT (name, source_url) DO NOTHING`;
  }
  console.log(`Seeded ${seed.length} resources`);
}
main();
