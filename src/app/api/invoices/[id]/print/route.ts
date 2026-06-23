import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api";
import { procurementData } from "@/lib/procurement-data";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(_request: Request, context: RouteContext<"/api/invoices/[id]/print">) {
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

  // Update printedAt time
  await db.update(invoices).set({ printedAt: new Date() }).where(eq(invoices.id, id));

  return NextResponse.json({ invoice, printUrl: `/api/invoices/${invoice.id}/print` });
}
