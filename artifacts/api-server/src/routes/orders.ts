import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, productsTable, usersTable } from "@workspace/db";
import { requireRole, requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function enrichOrder(order: typeof ordersTable.$inferSelect) {
  const [product] = await db.select({
    name: productsTable.name,
    vendorId: productsTable.vendorId,
    vendorName: usersTable.companyName,
  })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.vendorId, usersTable.id))
    .where(eq(productsTable.id, order.productId));

  const [buyer] = await db.select({ fullName: usersTable.fullName, companyName: usersTable.companyName })
    .from(usersTable)
    .where(eq(usersTable.id, order.buyerId));

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
}

// GET /orders — buyer's orders
router.get("/orders", requireRole("buyer"), async (req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.buyerId, req.session.userId!))
    .orderBy(ordersTable.createdAt);

  const enriched = await Promise.all(orders.map(enrichOrder));
  res.json(enriched);
});

// POST /orders
router.post("/orders", requireRole("buyer"), async (req, res): Promise<void> => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity < 1) {
    res.status(400).json({ error: "Invalid order data" });
    return;
  }

  const [product] = await db.select().from(productsTable)
    .where(eq(productsTable.id, parseInt(productId, 10)));

  if (!product || product.status !== "verified") {
    res.status(400).json({ error: "Product not available" });
    return;
  }

  const totalPrice = (Number(product.pricePerUnit) * quantity).toFixed(2);

  const [order] = await db.insert(ordersTable).values({
    buyerId: req.session.userId!,
    productId: parseInt(productId, 10),
    quantity: parseInt(quantity, 10),
    totalPrice,
    status: "received",
  }).returning();

  res.status(201).json(await enrichOrder(order));
});

// GET /orders/:id
router.get("/orders/:id", requireRole("buyer"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [order] = await db.select().from(ordersTable)
    .where(eq(ordersTable.id, id));

  if (!order || order.buyerId !== req.session.userId!) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(await enrichOrder(order));
});

// POST /orders/:id/payment-confirm — buyer confirms they want to pay
router.post("/orders/:id/payment-confirm", requireRole("buyer"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order || order.buyerId !== req.session.userId!) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.status !== "proceed_to_pay") {
    res.status(400).json({ error: "Order is not ready for payment" });
    return;
  }

  // In sandbox/demo mode — simulate payment confirmation directly
  const reference = `MS-${Date.now()}-${id}`;

  await db.update(ordersTable)
    .set({ paystackRef: reference, status: "payment_confirmed" })
    .where(eq(ordersTable.id, id));

  const [updated] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));

  res.json({ 
    status: "success", 
    reference,
    message: "Payment confirmed (demo mode)",
    order: updated ? await enrichOrder(updated) : null,
  });
});

export default router;
