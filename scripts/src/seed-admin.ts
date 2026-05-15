import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@medi-supply.ng";
  const password = process.env.ADMIN_PASSWORD || "Admin@123!";

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));

  if (existing.length > 0) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(usersTable).values({
    email,
    passwordHash,
    role: "admin",
    status: "approved",
    fullName: "Platform Admin",
    companyName: "MedSupply Platform",
  });

  console.log(`✅ Admin created: ${email} / ${password}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
