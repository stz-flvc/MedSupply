import { Router, type IRouter } from "express";
import { eq, and, count, sql } from "drizzle-orm";
import { db, productsTable, usersTable } from "@workspace/db";
import { requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

function productToResponse(p: typeof productsTable.$inferSelect & { vendorName?: string | null }) {
  return {
    id: p.id,
    vendorId: p.vendorId,
    vendorName: p.vendorName ?? null,
    name: p.name,
    category: p.category,
    description: p.description,
    imageUrl: p.imageUrl,
    coaUrl: p.coaUrl,
    nafdacNumber: p.nafdacNumber,
    barcode: p.barcode,
    pricePerUnit: Number(p.pricePerUnit),
    quantityAvailable: p.quantityAvailable,
    status: p.status,
    rejectionReason: p.rejectionReason,
    createdAt: p.createdAt.toISOString(),
  };
}

// GET /vendor/products
router.get("/vendor/products", requireRole("vendor"), async (req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.vendorId, req.session.userId!))
    .orderBy(productsTable.createdAt);

  res.json(products.map((p) => productToResponse({ ...p, vendorName: null })));
});

// POST /vendor/products
router.post("/vendor/products", requireRole("vendor"), async (req, res): Promise<void> => {
  const { name, category, description, imageUrl, coaUrl, nafdacNumber, barcode, pricePerUnit, quantityAvailable } = req.body;

  if (!name || !category || !description || !imageUrl || !coaUrl || !nafdacNumber || !barcode || pricePerUnit == null || quantityAvailable == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [product] = await db.insert(productsTable).values({
    vendorId: req.session.userId!,
    name, category, description,
    imageUrl: imageUrl || null,
    coaUrl: coaUrl || null,
    nafdacNumber: nafdacNumber || null,
    barcode: barcode || null,
    pricePerUnit: pricePerUnit.toString(),
    quantityAvailable: parseInt(quantityAvailable, 10),
    status: "pending",
  }).returning();

  res.status(201).json(productToResponse({ ...product, vendorName: null }));
});

// PATCH /vendor/products/:id
router.patch("/vendor/products/:id", requireRole("vendor"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [existing] = await db.select({ id: productsTable.id }).from(productsTable)
    .where(and(eq(productsTable.id, id), eq(productsTable.vendorId, req.session.userId!)));

  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const { name, category, description, imageUrl, coaUrl, nafdacNumber, barcode, pricePerUnit, quantityAvailable } = req.body;
  const updates: Partial<typeof productsTable.$inferInsert> = {};
  if (name) updates.name = name;
  if (category) updates.category = category;
  if (description) updates.description = description;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (coaUrl !== undefined) updates.coaUrl = coaUrl;
  if (nafdacNumber !== undefined) updates.nafdacNumber = nafdacNumber;
  if (barcode !== undefined) updates.barcode = barcode;
  if (pricePerUnit != null) updates.pricePerUnit = pricePerUnit.toString();
  if (quantityAvailable != null) updates.quantityAvailable = parseInt(quantityAvailable, 10);

  const [updated] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  res.json(productToResponse({ ...updated, vendorName: null }));
});

// DELETE /vendor/products/:id
router.delete("/vendor/products/:id", requireRole("vendor"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [existing] = await db.select({ id: productsTable.id }).from(productsTable)
    .where(and(eq(productsTable.id, id), eq(productsTable.vendorId, req.session.userId!)));

  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.sendStatus(204);
});

// GET /vendor/stats
router.get("/vendor/stats", requireRole("vendor"), async (req, res): Promise<void> => {
  const products = await db.select({ status: productsTable.status })
    .from(productsTable)
    .where(eq(productsTable.vendorId, req.session.userId!));

  const stats = {
    totalProducts: products.length,
    pendingProducts: products.filter((p) => p.status === "pending").length,
    verifiedProducts: products.filter((p) => p.status === "verified").length,
    rejectedProducts: products.filter((p) => p.status === "rejected").length,
  };

  res.json(stats);
});

export default router;
