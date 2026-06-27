import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  coaUrl: text("coa_url"),
  nafdacNumber: text("nafdac_number"),
  barcode: text("barcode"),
  pricePerUnit: numeric("price_per_unit", { precision: 12, scale: 2 }).notNull(),
  vendorPrice: numeric("vendor_price", { precision: 12, scale: 2 }),
  quantityAvailable: integer("quantity_available").notNull(),
  status: text("status").notNull().default("pending"), // pending | verified | rejected
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
