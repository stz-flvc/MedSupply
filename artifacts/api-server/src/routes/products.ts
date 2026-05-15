import { Router, type IRouter } from "express";
import { eq, and, ilike, or } from "drizzle-orm";
import { db, productsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

// GET /products — verified products marketplace
router.get("/products", async (req, res): Promise<void> => {
  const { search, category, vendorId } = req.query as Record<string, string>;

  const allProducts = await db
    .select({
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
    .leftJoin(usersTable, eq(productsTable.vendorId, usersTable.id))
    .where(eq(productsTable.status, "verified"));

  let filtered = allProducts;

  if (search) {
    const lower = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower) ||
        (p.vendorName || "").toLowerCase().includes(lower)
    );
  }

  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (vendorId) {
    const vid = parseInt(vendorId, 10);
    filtered = filtered.filter((p) => p.vendorId === vid);
  }

  res.json(filtered.map((p) => ({
    ...p,
    pricePerUnit: Number(p.pricePerUnit),
    createdAt: p.createdAt.toISOString(),
  })));
});

// GET /products/:id
router.get("/products/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [product] = await db
    .select({
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
    .leftJoin(usersTable, eq(productsTable.vendorId, usersTable.id))
    .where(and(eq(productsTable.id, id), eq(productsTable.status, "verified")));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ ...product, pricePerUnit: Number(product.pricePerUnit), createdAt: product.createdAt.toISOString() });
});

export default router;
