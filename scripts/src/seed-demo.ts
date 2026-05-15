import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seedDemo() {
  const password = "Password123!";
  const passwordHash = await bcrypt.hash(password, 10);

  const demoUsers = [
    {
      email: "buyer@demo.com",
      role: "buyer" as const,
      fullName: "Demo Buyer",
      companyName: "City Hospital",
      companyAddress: "123 Healthcare Blvd, Lagos",
      businessType: "hospital" as const,
      cacNumber: "RC-1234567",
      status: "approved" as const,
    },
    {
      email: "vendor@demo.com",
      role: "vendor" as const,
      fullName: "Demo Vendor",
      companyName: "Global Pharma Ltd",
      nafdacLicense: "NRN-87654321A",
      status: "approved" as const,
    }
  ];

  for (const user of demoUsers) {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, user.email));
    if (existing.length === 0) {
      await db.insert(usersTable).values({
        ...user,
        passwordHash,
      });
      console.log(`✅ Created ${user.role}: ${user.email} / ${password}`);
    } else {
      console.log(`Skipping ${user.email}, already exists.`);
    }
  }

  process.exit(0);
}

seedDemo().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
