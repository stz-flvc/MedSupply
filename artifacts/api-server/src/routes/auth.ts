import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function userToResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    fullName: user.fullName,
    companyName: user.companyName,
    companyAddress: user.companyAddress,
    phone: user.phone,
    businessType: user.businessType,
    cacNumber: user.cacNumber,
    businessLicenseUrl: user.businessLicenseUrl,
    contactPerson: user.contactPerson,
    nafdacLicense: user.nafdacLicense,
    importerLicenseUrl: user.importerLicenseUrl,
    cacDocumentUrl: user.cacDocumentUrl,
    productCategories: user.productCategories,
    rejectionReason: user.rejectionReason,
    createdAt: user.createdAt.toISOString(),
  };
}

// POST /auth/signup/buyer
router.post("/auth/signup/buyer", async (req, res): Promise<void> => {
  const {
    fullName, companyName, companyAddress, phone, email, password,
    businessType, cacNumber, businessLicenseUrl,
  } = req.body;

  if (!fullName || !companyName || !companyAddress || !phone || !email || !password || !businessType || !cacNumber) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    email, passwordHash, role: "buyer", status: "pending",
    fullName, companyName, companyAddress, phone,
    businessType, cacNumber, businessLicenseUrl: businessLicenseUrl || null,
  }).returning();

  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.userStatus = user.status;

  res.status(201).json({ user: userToResponse(user), message: "Registration submitted — pending approval" });
});

// POST /auth/signup/vendor
router.post("/auth/signup/vendor", async (req, res): Promise<void> => {
  const {
    companyName, contactPerson, phone, email, password,
    nafdacLicense, importerLicenseUrl, cacDocumentUrl, productCategories,
  } = req.body;

  if (!companyName || !contactPerson || !phone || !email || !password || !nafdacLicense || !productCategories?.length) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    email, passwordHash, role: "vendor", status: "pending",
    companyName, contactPerson, phone, nafdacLicense,
    importerLicenseUrl: importerLicenseUrl || null,
    cacDocumentUrl: cacDocumentUrl || null,
    productCategories: productCategories,
  }).returning();

  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.userStatus = user.status;

  res.status(201).json({ user: userToResponse(user), message: "Registration submitted — pending approval" });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.userStatus = user.status;

  res.json({ user: userToResponse(user), message: "Login successful" });
});

// POST /auth/logout
router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(userToResponse(user));
});

export default router;
