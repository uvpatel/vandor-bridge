import { z } from "zod";
import { db } from "@/db";
import {
  vendors,
  rfqs,
  rfqVendors,
  quotations,
  approvals,
  purchaseOrders,
  invoices,
  activities,
  users,
} from "@/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";

export const procurementRoles = ["admin", "procurement_officer", "manager", "vendor"] as const;

export const vendorSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  gstNumber: z.string().min(8),
  contactName: z.string().min(2),
  contactEmail: z.email(),
  contactPhone: z.string().optional(),
});

export const rfqSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  quantity: z.coerce.number().int().positive(),
  unit: z.string().default("units"),
  deadline: z.string().min(8),
  vendorIds: z.array(z.string()).default([]),
});

export const quotationSchema = z.object({
  rfqId: z.string().min(1),
  vendorId: z.string().min(1),
  unitPrice: z.coerce.number().positive(),
  deliveryDays: z.coerce.number().int().positive(),
  notes: z.string().optional(),
});

export const approvalSchema = z.object({
  quotationId: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
  remarks: z.string().optional(),
});

export type ProcurementRole = (typeof procurementRoles)[number];

function nextId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

// Seed initial data if DB is empty
async function seedInitialDataIfNeeded() {
  const existingVendors = await db.select().from(vendors).limit(1);
  if (existingVendors.length === 0) {
    console.log("Seeding initial vendors...");
    await db.insert(vendors).values([
      {
        id: "ven_orion",
        name: "Orion Industrial Supplies",
        category: "Packaging",
        gstNumber: "27AAECO5421F1Z5",
        contactName: "Meera Shah",
        contactEmail: "meera@orion.example",
        contactPhone: "+91 98765 43210",
        status: "active",
        rating: "4.80",
      },
      {
        id: "ven_northline",
        name: "Northline Components",
        category: "Electronics",
        gstNumber: "24AACCN1198B1Z2",
        contactName: "Rohan Mehta",
        contactEmail: "rohan@northline.example",
        status: "review",
        rating: "4.40",
      },
      {
        id: "ven_prism",
        name: "Prism Facility Partners",
        category: "Services",
        gstNumber: "29AAGCP7622K1Z9",
        contactName: "Anika Rao",
        contactEmail: "anika@prism.example",
        status: "active",
        rating: "4.60",
      },
    ]);
  }
}

export const procurementData = {
  async dashboard(userRole?: string, userId?: string) {
    await seedInitialDataIfNeeded();

    // Query counters
    const allApprovals = await db.select().from(approvals);
    const pendingApprovalsCount = allApprovals.filter(a => a.status === "pending").length;

    const allRfqs = await db.select().from(rfqs);
    const activeRfqsCount = allRfqs.filter(r => !["converted", "approved", "closed"].includes(r.status)).length;

    const allPOs = await db.select().from(purchaseOrders);
    const allInvoices = await db.select().from(invoices);

    // Spend analysis calculations
    const categoriesMap: Record<string, number> = {};
    let totalSpend = 0;
    const pos = await db.select().from(purchaseOrders);
    
    // Join POs with Quotations and RFQs to calculate category-based spending
    const poDetails = await db
      .select({
        total: purchaseOrders.total,
        rfqId: quotations.rfqId,
      })
      .from(purchaseOrders)
      .leftJoin(quotations, eq(purchaseOrders.quotationId, quotations.id));

    for (const po of poDetails) {
      if (po.rfqId) {
        const rfqDetail = allRfqs.find(r => r.id === po.rfqId);
        if (rfqDetail) {
          const category = rfqDetail.title.toLowerCase().includes("carton") || rfqDetail.title.toLowerCase().includes("pack") 
            ? "Packaging" 
            : rfqDetail.title.toLowerCase().includes("sensor") || rfqDetail.title.toLowerCase().includes("elect") 
            ? "Electronics" 
            : "Services";
          const val = parseFloat(po.total || "0");
          categoriesMap[category] = (categoriesMap[category] || 0) + val;
          totalSpend += val;
        }
      }
    }

    const spendByCategory = Object.keys(categoriesMap).map(category => ({
      category,
      value: totalSpend > 0 ? Math.round((categoriesMap[category] / totalSpend) * 100) : 0,
    }));

    if (spendByCategory.length === 0) {
      spendByCategory.push(
        { category: "Packaging", value: 42 },
        { category: "Electronics", value: 31 },
        { category: "Services", value: 27 }
      );
    }

    const recentRfqs = await db.select().from(rfqs).orderBy(desc(rfqs.createdAt)).limit(5);
    const recentInvoices = await db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(5);
    const recentActivities = await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(8);

    return {
      metrics: {
        pendingApprovals: pendingApprovalsCount,
        activeRfqs: activeRfqsCount,
        purchaseOrders: allPOs.length,
        invoices: allInvoices.length,
      },
      recentRfqs,
      recentInvoices,
      activities: recentActivities,
      spendByCategory,
    };
  },

  vendors: {
    async list() {
      await seedInitialDataIfNeeded();
      return db.select().from(vendors).orderBy(desc(vendors.createdAt));
    },
    async create(input: z.infer<typeof vendorSchema>) {
      const id = nextId("ven");
      const result = await db.insert(vendors).values({
        id,
        name: input.name,
        category: input.category,
        gstNumber: input.gstNumber,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone ?? null,
        status: "active",
        rating: "4.00",
      }).returning();

      await db.insert(activities).values({
        id: nextId("act"),
        entityType: "vendor",
        entityId: id,
        action: "created",
        message: `Registered new vendor: ${input.name} (GST: ${input.gstNumber})`,
      });

      return result[0];
    },
  },

  rfqs: {
    async list() {
      await seedInitialDataIfNeeded();
      return db.select().from(rfqs).orderBy(desc(rfqs.createdAt));
    },
    async create(input: z.infer<typeof rfqSchema>, createdById: string) {
      const id = nextId("rfq");
      const deadlineDate = new Date(input.deadline);

      const result = await db.insert(rfqs).values({
        id,
        title: input.title,
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        deadline: deadlineDate,
        status: input.vendorIds.length ? "invited" : "draft",
        attachments: [],
        createdById,
      }).returning();

      // Invite vendors
      if (input.vendorIds.length > 0) {
        for (const vendorId of input.vendorIds) {
          await db.insert(rfqVendors).values({
            id: nextId("rfqv"),
            rfqId: id,
            vendorId,
          });
        }

        await db.insert(activities).values({
          id: nextId("act"),
          entityType: "rfq",
          entityId: id,
          action: "invited",
          message: `RFQ "${input.title}" created. Invited ${input.vendorIds.length} vendors.`,
        });
      } else {
        await db.insert(activities).values({
          id: nextId("act"),
          entityType: "rfq",
          entityId: id,
          action: "created",
          message: `RFQ "${input.title}" created as draft.`,
        });
      }

      return result[0];
    },
  },

  quotations: {
    async list() {
      return db.select().from(quotations).orderBy(desc(quotations.submittedAt));
    },
    async create(input: z.infer<typeof quotationSchema>) {
      const id = nextId("quo");
      const result = await db.insert(quotations).values({
        id,
        rfqId: input.rfqId,
        vendorId: input.vendorId,
        unitPrice: input.unitPrice.toString(),
        taxRate: "18.00",
        deliveryDays: input.deliveryDays,
        notes: input.notes ?? null,
        status: "submitted",
      }).returning();

      const rfqDetail = await db.select().from(rfqs).where(eq(rfqs.id, input.rfqId)).limit(1);
      const vendorDetail = await db.select().from(vendors).where(eq(vendors.id, input.vendorId)).limit(1);

      await db.insert(activities).values({
        id: nextId("act"),
        entityType: "quotation",
        entityId: id,
        action: "submitted",
        message: `${vendorDetail[0]?.name || "Vendor"} submitted quotation for RFQ: "${rfqDetail[0]?.title || input.rfqId}"`,
      });

      // Update RFQ status to receiving_quotes if it was invited
      if (rfqDetail[0] && rfqDetail[0].status === "invited") {
        await db.update(rfqs).set({ status: "receiving_quotes" }).where(eq(rfqs.id, input.rfqId));
      }

      return result[0];
    },
  },

  approvals: {
    async list() {
      return db.select().from(approvals).orderBy(desc(approvals.createdAt));
    },
    async decide(input: z.infer<typeof approvalSchema>, approverId: string) {
      // Find existing approval
      const existing = await db
        .select()
        .from(approvals)
        .where(eq(approvals.quotationId, input.quotationId))
        .limit(1);

      let result;
      const decDate = new Date();

      if (existing.length > 0) {
        result = await db
          .update(approvals)
          .set({
            status: input.status,
            remarks: input.remarks ?? null,
            decidedAt: decDate,
            approverId,
          })
          .where(eq(approvals.id, existing[0].id))
          .returning();
      } else {
        const id = nextId("apr");
        result = await db
          .insert(approvals)
          .values({
            id,
            quotationId: input.quotationId,
            approverId,
            status: input.status,
            remarks: input.remarks ?? null,
            decidedAt: decDate,
          })
          .returning();
      }

      // Update Quotation Status
      await db
        .update(quotations)
        .set({ status: input.status === "approved" ? "approved" : "rejected" })
        .where(eq(quotations.id, input.quotationId));

      const quote = await db.select().from(quotations).where(eq(quotations.id, input.quotationId)).limit(1);
      if (quote[0]) {
        // Update RFQ Status to approved/rejected
        await db.update(rfqs).set({ status: input.status === "approved" ? "approved" : "rejected" }).where(eq(rfqs.id, quote[0].rfqId));

        const rfqDetail = await db.select().from(rfqs).where(eq(rfqs.id, quote[0].rfqId)).limit(1);
        const vendorDetail = await db.select().from(vendors).where(eq(vendors.id, quote[0].vendorId)).limit(1);

        await db.insert(activities).values({
          id: nextId("act"),
          entityType: "approval",
          entityId: result[0].id,
          action: input.status,
          message: `Quotation from ${vendorDetail[0]?.name || "vendor"} for RFQ "${rfqDetail[0]?.title || quote[0].rfqId}" was ${input.status} by Manager. Remarks: ${input.remarks || "none"}`,
        });
      }

      return result[0];
    },
  },

  purchaseOrders: {
    async list() {
      return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.issuedAt));
    },
    async create(quotationId: string) {
      const quote = await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);
      if (!quote[0]) throw new Error("Quotation not found");

      const rfqDetail = await db.select().from(rfqs).where(eq(rfqs.id, quote[0].rfqId)).limit(1);
      if (!rfqDetail[0]) throw new Error("RFQ not found");

      const subtotal = parseFloat(quote[0].unitPrice) * rfqDetail[0].quantity;
      const taxRate = parseFloat(quote[0].taxRate);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      const allPOs = await db.select().from(purchaseOrders);
      const poNumber = `PO-${1000 + allPOs.length + 1}`;

      const id = nextId("po");
      const result = await db.insert(purchaseOrders).values({
        id,
        poNumber,
        quotationId,
        status: "issued",
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
      }).returning();

      // Update RFQ status to converted
      await db.update(rfqs).set({ status: "converted" }).where(eq(rfqs.id, quote[0].rfqId));

      await db.insert(activities).values({
        id: nextId("act"),
        entityType: "purchase_order",
        entityId: id,
        action: "created",
        message: `Generated Purchase Order ${poNumber} for approved quotation. Total: Rs. ${total.toLocaleString()}`,
      });

      return result[0];
    },
  },

  invoices: {
    async list() {
      return db.select().from(invoices).orderBy(desc(invoices.createdAt));
    },
    async create(purchaseOrderId: string) {
      const po = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, purchaseOrderId)).limit(1);
      if (!po[0]) throw new Error("Purchase Order not found");

      const allInvoices = await db.select().from(invoices);
      const invoiceNumber = `INV-${778 + allInvoices.length + 1}`;

      const id = nextId("inv");
      const result = await db.insert(invoices).values({
        id,
        invoiceNumber,
        purchaseOrderId,
        status: "draft",
        subtotal: po[0].subtotal,
        taxAmount: po[0].taxAmount,
        total: po[0].total,
      }).returning();

      await db.insert(activities).values({
        id: nextId("act"),
        entityType: "invoice",
        entityId: id,
        action: "created",
        message: `Generated Invoice ${invoiceNumber} from Purchase Order ${po[0].poNumber}.`,
      });

      return result[0];
    },
  },

  activities: {
    async list() {
      return db.select().from(activities).orderBy(desc(activities.createdAt));
    },
  },
};
