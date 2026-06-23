import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "procurement_officer",
  "manager",
  "vendor",
]);

export const vendorStatusEnum = pgEnum("vendor_status", [
  "active",
  "review",
  "suspended",
  "inactive",
]);

export const rfqStatusEnum = pgEnum("rfq_status", [
  "draft",
  "invited",
  "receiving_quotes",
  "comparison",
  "approval",
  "approved",
  "rejected",
  "converted",
  "closed",
]);

export const quotationStatusEnum = pgEnum("quotation_status", [
  "draft",
  "submitted",
  "shortlisted",
  "approved",
  "rejected",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "issued",
  "sent",
  "paid",
  "cancelled",
]);

export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: userRoleEnum("role").notNull().default("procurement_officer"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("user_email_idx").on(table.email)],
);

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vendors = pgTable("vendor", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  gstNumber: varchar("gst_number", { length: 32 }).notNull().unique(),
  contactName: varchar("contact_name", { length: 120 }).notNull(),
  contactEmail: varchar("contact_email", { length: 180 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 32 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("4.00"),
  status: vendorStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rfqs = pgTable("rfq", {
  id: text("id").primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unit: varchar("unit", { length: 32 }).notNull().default("units"),
  deadline: timestamp("deadline").notNull(),
  status: rfqStatusEnum("status").notNull().default("draft"),
  attachments: jsonb("attachments").$type<string[]>().notNull().default([]),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rfqVendors = pgTable("rfq_vendor", {
  id: text("id").primaryKey(),
  rfqId: text("rfq_id")
    .notNull()
    .references(() => rfqs.id, { onDelete: "cascade" }),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
});

export const quotations = pgTable("quotation", {
  id: text("id").primaryKey(),
  rfqId: text("rfq_id")
    .notNull()
    .references(() => rfqs.id, { onDelete: "cascade" }),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("18.00"),
  deliveryDays: integer("delivery_days").notNull(),
  notes: text("notes"),
  status: quotationStatusEnum("status").notNull().default("submitted"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const approvals = pgTable("approval", {
  id: text("id").primaryKey(),
  quotationId: text("quotation_id")
    .notNull()
    .references(() => quotations.id, { onDelete: "cascade" }),
  approverId: text("approver_id")
    .notNull()
    .references(() => users.id),
  status: approvalStatusEnum("status").notNull().default("pending"),
  remarks: text("remarks"),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const purchaseOrders = pgTable("purchase_order", {
  id: text("id").primaryKey(),
  poNumber: varchar("po_number", { length: 40 }).notNull().unique(),
  quotationId: text("quotation_id")
    .notNull()
    .references(() => quotations.id),
  status: documentStatusEnum("status").notNull().default("issued"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoice", {
  id: text("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 40 }).notNull().unique(),
  purchaseOrderId: text("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  status: documentStatusEnum("status").notNull().default("draft"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  emailedAt: timestamp("emailed_at"),
  printedAt: timestamp("printed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activities = pgTable("activity", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => users.id),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: text("entity_id").notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  rfqs: many(rfqs),
  approvals: many(approvals),
  activities: many(activities),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  rfqInvites: many(rfqVendors),
  quotations: many(quotations),
}));

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [rfqs.createdById],
    references: [users.id],
  }),
  invitedVendors: many(rfqVendors),
  quotations: many(quotations),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  rfq: one(rfqs, {
    fields: [quotations.rfqId],
    references: [rfqs.id],
  }),
  vendor: one(vendors, {
    fields: [quotations.vendorId],
    references: [vendors.id],
  }),
  approvals: many(approvals),
  purchaseOrders: many(purchaseOrders),
}));
