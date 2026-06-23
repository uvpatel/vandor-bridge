import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api";
import { procurementData } from "@/lib/procurement-data";
import { db } from "@/db";
import { invoices, activities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(_request: Request, context: RouteContext<"/api/invoices/[id]/email">) {
  const { response } = await requireSession(["admin", "procurement_officer"]);

  if (response) {
    return response;
  }

  const { id } = await context.params;
  const list = await procurementData.invoices.list();
  const invoice = list.find((item) => item.id === id);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Update in DB
  const decDate = new Date();
  await db
    .update(invoices)
    .set({ status: "sent", emailedAt: decDate })
    .where(eq(invoices.id, id));

  // Log activity
  await db.insert(activities).values({
    id: `act_${Math.random().toString(36).substring(2, 11)}`,
    entityType: "invoice",
    entityId: id,
    action: "emailed",
    message: `Emailed invoice ${invoice.invoiceNumber} to vendor.`,
  });

  const updatedInvoice = { ...invoice, status: "sent" as any, emailedAt: decDate };

  return NextResponse.json({ invoice: updatedInvoice, message: "Invoice queued for email delivery." });
}
