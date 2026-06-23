import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJson, requireSession } from "@/lib/api";
import { procurementData } from "@/lib/procurement-data";

const invoiceSchema = z.object({
  purchaseOrderId: z.string().min(1),
});

export async function GET() {
  const { response } = await requireSession();

  if (response) {
    return response;
  }

  const list = await procurementData.invoices.list();
  return NextResponse.json({ invoices: list });
}

export async function POST(request: Request) {
  const { response } = await requireSession(["admin", "procurement_officer"]);

  if (response) {
    return response;
  }

  const parsed = await parseJson(request, invoiceSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const created = await procurementData.invoices.create(parsed.data.purchaseOrderId);
  return NextResponse.json({ invoice: created }, { status: 201 });
}
