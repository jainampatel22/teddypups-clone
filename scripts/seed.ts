// Usage: node scripts/seed.ts            (creates + seeds data/teddypups.db if empty)
//        node scripts/seed.ts --reset    (wipes content tables and re-seeds; keeps enquiries + admin users)
import { getDb, resetDb, syncSections } from "../lib/db.ts";
getDb();
if (process.argv.includes("--reset")) resetDb();
if (process.argv.includes("--sections")) console.log("sections added", syncSections());
const db = getDb();
for (const t of ["puppies", "media", "happy_photos", "faqs", "sections", "breeds"]) console.log(t, (db.prepare(`SELECT COUNT(*) n FROM ${t}`).get() as any).n);
