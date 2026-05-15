import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function resetVendor() {
  const email = "vendor@demo.com";
  const password = "Vendor@123!";
  const hash = await bcrypt.hash(password, 10);

  await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.email, email));
  console.log(`✅ Password for ${email} reset to ${password}`);
  process.exit(0);
}

resetVendor().catch(err => {
  console.error(err);
  process.exit(1);
});
