import { Router, type IRouter } from "express";
import { eq, and, ne } from "drizzle-orm";
import { db, usersTable, productsTable, ordersTable, notificationsTable } from "@workspace/db";
import { requireRole } from "../middlewares/requireAuth";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

// Public seed route for demo purposes
router.post("/admin/seed", async (req, res): Promise<void> => {
  try {
    // 1. Create tables if they don't exist
    const setupSql = [
      `CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" text NOT NULL,
        "password_hash" text NOT NULL,
        "role" text DEFAULT 'buyer' NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "full_name" text,
        "company_name" text,
        "company_address" text,
        "phone" text,
        "business_type" text,
        "cac_number" text,
        "business_license_url" text,
        "contact_person" text,
        "nafdac_license" text,
        "importer_license_url" text,
        "cac_document_url" text,
        "product_categories" text[],
        "rejection_reason" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "users_email_unique" UNIQUE("email")
      )`,
      `CREATE TABLE IF NOT EXISTS "products" (
        "id" serial PRIMARY KEY NOT NULL,
        "vendor_id" integer NOT NULL,
        "name" text NOT NULL,
        "category" text NOT NULL,
        "description" text NOT NULL,
        "image_url" text,
        "coa_url" text,
        "nafdac_number" text,
        "barcode" text,
        "price_per_unit" numeric(12, 2) NOT NULL,
        "quantity_available" integer NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "rejection_reason" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "orders" (
        "id" serial PRIMARY KEY NOT NULL,
        "buyer_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "quantity" integer NOT NULL,
        "total_price" numeric(14, 2) NOT NULL,
        "status" text DEFAULT 'received' NOT NULL,
        "paystack_ref" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "notifications" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "message" text NOT NULL,
        "type" text NOT NULL,
        "read" boolean DEFAULT false NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )`
    ];

    for (const sqlStr of setupSql) {
      await db.execute(sql.raw(sqlStr));
    }

    // 2. Seed data
    const password = "Password123!";
    const passwordHash = await bcrypt.hash(password, 10);
    const adminPasswordHash = await bcrypt.hash("Admin@123!", 10);

    const demoUsers = [
      {
        email: "admin@medsupply.ng",
        passwordHash: adminPasswordHash,
        role: "admin" as const,
        status: "approved" as const,
        fullName: "Platform Admin",
        companyName: "MedSupply Platform",
      },
      {
        email: "buyer@demo.com",
        passwordHash,
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
        passwordHash,
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
        await db.insert(usersTable).values(user);
      }
    }

    res.json({ message: "Database schema initialized and demo data seeded successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function sendNotification(userId: number, message: string, type: string) {
  await db.insert(notificationsTable).values({ userId, message, type, read: false });
}

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

// GET /admin/stats
router.get("/admin/stats", requireRole("admin"), async (req, res): Promise<void> => {
  const allUsers = await db.select({ role: usersTable.role, status: usersTable.status })
    .from(usersTable).where(ne(usersTable.role, "admin"));
  const allProducts = await db.select({ status: productsTable.status }).from(productsTable);
  const allOrders = await db.select({ status: ordersTable.status }).from(ordersTable);

  res.json({
    totalBuyers: allUsers.filter((u) => u.role === "buyer").length,
    totalVendors: allUsers.filter((u) => u.role === "vendor").length,
    pendingUsers: allUsers.filter((u) => u.status === "pending").length,
    totalProducts: allProducts.length,
    pendingProducts: allProducts.filter((p) => p.status === "pending").length,
    verifiedProducts: allProducts.filter((p) => p.status === "verified").length,
    totalOrders: allOrders.length,
    pendingOrders: allOrders.filter((o) => !["fulfilled", "payment_confirmed"].includes(o.status)).length,
    fulfilledOrders: allOrders.filter((o) => o.status === "fulfilled").length,
  });
});

// GET /admin/users
router.get("/admin/users", requireRole("admin"), async (req, res): Promise<void> => {
  const { role, status } = req.query as Record<string, string>;

  let query = db.select().from(usersTable).where(ne(usersTable.role, "admin"));
  const users = await db.select().from(usersTable).where(ne(usersTable.role, "admin"));

  let filtered = users;
  if (role) filtered = filtered.filter((u) => u.role === role);
  if (status) filtered = filtered.filter((u) => u.status === status);

  res.json(filtered.map(userToResponse));
});

// PATCH /admin/users/:id/approve
router.patch("/admin/users/:id/approve", requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [user] = await db.update(usersTable).set({ status: "approved" }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await sendNotification(user.id, `Your ${user.role} account has been approved. Welcome to MedSupply!`, "account_approved");
  res.json(userToResponse(user));
});

// PATCH /admin/users/:id/reject
router.patch("/admin/users/:id/reject", requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const { reason } = req.body;

  if (!reason) { res.status(400).json({ error: "Rejection reason required" }); return; }

  const [user] = await db.update(usersTable)
    .set({ status: "rejected", rejectionReason: reason })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await sendNotification(user.id, `Your account registration was rejected. Reason: ${reason}`, "account_rejected");
  res.json(userToResponse(user));
});

// PATCH /admin/users/:id/suspend
router.patch("/admin/users/:id/suspend", requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [user] = await db.update(usersTable).set({ status: "suspended" }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json(userToResponse(user));
});

// DELETE /admin/users/:id
router.delete("/admin/users/:id", requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

// GET /admin/products
router.get("/admin/products", requireRole("admin"), async (req, res): Promise<void> => {
  const { status } = req.query as Record<string, string>;

  const products = await db.select({
    id: productsTable.id,
    vendorId: productsTable.vendorId,
    vendorName: usersTable.companyName,
    name: productsTable.name,
    category: productsTable.category,
    description: productsTable.description,
    imageUrl: productsTable.imageUrl,
    coaUrl: productsTable.coaUrl,
    nafdacNumber: productsTable.nafdacNumber,
    barcode: productsTable.barcode,
    pricePerUnit: productsTable.pricePerUnit,
    quantityAvailable: productsTable.quantityAvailable,
    status: productsTable.status,
    rejectionReason: productsTable.rejectionReason,
    createdAt: productsTable.createdAt,
  })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.vendorId, usersTable.id));

  const filtered = status ? products.filter((p) => p.status === status) : products;
  res.json(filtered.map((p) => ({ ...p, pricePerUnit: Number(p.pricePerUnit), createdAt: p.createdAt.toISOString() })));
});

// PATCH /admin/products/:id/verify
router.patch("/admin/products/:id/verify", requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const { pricePerUnit } = req.body;

  const updateData: Partial<typeof productsTable.$inferInsert> = { status: "verified", rejectionReason: null };
  if (pricePerUnit !== undefined && pricePerUnit !== null) {
    updateData.pricePerUnit = pricePerUnit.toString();
  }

  const [product] = await db.update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, id))
    .returning();

  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  await sendNotification(product.vendorId, `Your product "${product.name}" has been verified and is now live on the marketplace.`, "product_verified");
  res.json({ ...product, pricePerUnit: Number(product.pricePerUnit), createdAt: product.createdAt.toISOString() });
});

// PATCH /admin/products/:id/reject
router.patch("/admin/products/:id/reject", requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const { reason } = req.body;

  if (!reason) { res.status(400).json({ error: "Rejection reason required" }); return; }

  const [product] = await db.update(productsTable)
    .set({ status: "rejected", rejectionReason: reason })
    .where(eq(productsTable.id, id))
    .returning();

  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  await sendNotification(product.vendorId, `Your product "${product.name}" was rejected. Reason: ${reason}`, "product_rejected");
  res.json({ ...product, pricePerUnit: Number(product.pricePerUnit), createdAt: product.createdAt.toISOString() });
});

// GET /admin/orders
router.get("/admin/orders", requireRole("admin"), async (req, res): Promise<void> => {
  const { status } = req.query as Record<string, string>;

  const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);

  const enriched = await Promise.all(
    orders.map(async (order) => {
      const [product] = await db.select({ name: productsTable.name, vendorName: usersTable.companyName })
        .from(productsTable)
        .leftJoin(usersTable, eq(productsTable.vendorId, usersTable.id))
        .where(eq(productsTable.id, order.productId));

      const [buyer] = await db.select({ fullName: usersTable.fullName, companyName: usersTable.companyName })
        .from(usersTable).where(eq(usersTable.id, order.buyerId));

      return {
        id: order.id,
        buyerId: order.buyerId,
        buyerName: buyer?.fullName ?? null,
        buyerCompany: buyer?.companyName ?? null,
        productId: order.productId,
        productName: product?.name ?? null,
        vendorName: product?.vendorName ?? null,
        quantity: order.quantity,
        totalPrice: Number(order.totalPrice),
        status: order.status,
        paystackRef: order.paystackRef,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };
    })
  );

  const filtered = status ? enriched.filter((o) => o.status === status) : enriched;
  res.json(filtered.reverse());
});

// PATCH /admin/orders/:id/status
router.patch("/admin/orders/:id/status", requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const { status } = req.body;

  const validStatuses = ["received", "confirmed", "proceed_to_pay", "payment_confirmed", "fulfilled"];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const [existingOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!existingOrder) { res.status(404).json({ error: "Order not found" }); return; }

  // Adjust product stock if status changes to/from fulfilled
  if (existingOrder.status !== "fulfilled" && status === "fulfilled") {
    const [product] = await db.select({ quantityAvailable: productsTable.quantityAvailable }).from(productsTable).where(eq(productsTable.id, existingOrder.productId));
    if (product) {
      await db.update(productsTable)
        .set({ quantityAvailable: Math.max(0, product.quantityAvailable - existingOrder.quantity) })
        .where(eq(productsTable.id, existingOrder.productId));
    }
  } else if (existingOrder.status === "fulfilled" && status !== "fulfilled") {
    const [product] = await db.select({ quantityAvailable: productsTable.quantityAvailable }).from(productsTable).where(eq(productsTable.id, existingOrder.productId));
    if (product) {
      await db.update(productsTable)
        .set({ quantityAvailable: product.quantityAvailable + existingOrder.quantity })
        .where(eq(productsTable.id, existingOrder.productId));
    }
  }

  const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  // Send notification to buyer
  const statusMessages: Record<string, string> = {
    confirmed: "Your order has been confirmed by the admin.",
    proceed_to_pay: "Your order has been confirmed! Please proceed to payment.",
    payment_confirmed: "Your payment has been confirmed.",
    fulfilled: "Your order has been fulfilled and delivered.",
  };

  const notifType = status === "proceed_to_pay" ? "payment_required" : "order_status";
  if (statusMessages[status]) {
    await sendNotification(order.buyerId, statusMessages[status], notifType);
  }

  const [product] = await db.select({ name: productsTable.name, vendorName: usersTable.companyName })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.vendorId, usersTable.id))
    .where(eq(productsTable.id, order.productId));

  const [buyer] = await db.select({ fullName: usersTable.fullName, companyName: usersTable.companyName })
    .from(usersTable).where(eq(usersTable.id, order.buyerId));

  res.json({
    id: order.id,
    buyerId: order.buyerId,
    buyerName: buyer?.fullName ?? null,
    buyerCompany: buyer?.companyName ?? null,
    productId: order.productId,
    productName: product?.name ?? null,
    vendorName: product?.vendorName ?? null,
    quantity: order.quantity,
    totalPrice: Number(order.totalPrice),
    status: order.status,
    paystackRef: order.paystackRef,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  });
});

export default router;
