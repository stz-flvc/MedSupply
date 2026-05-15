import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("buyer"), // buyer | vendor | admin
  status: text("status").notNull().default("pending"), // pending | approved | rejected | suspended
  // Buyer fields
  fullName: text("full_name"),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  phone: text("phone"),
  businessType: text("business_type"), // wholesaler | hospital | pharmacy
  cacNumber: text("cac_number"),
  businessLicenseUrl: text("business_license_url"),
  // Vendor fields
  contactPerson: text("contact_person"),
  nafdacLicense: text("nafdac_license"),
  importerLicenseUrl: text("importer_license_url"),
  cacDocumentUrl: text("cac_document_url"),
  productCategories: text("product_categories").array(),
  // Admin/system
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
