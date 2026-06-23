import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJson, requireSession } from "@/lib/api";
import { procurementData } from "@/lib/procurement-data";

const purchaseOrderSchema = z.object({
  quotationId: z.string().min(1),
});

export async function GET() {
  const { response } = await requireSession();

  if (response) {
    return response;
  }

  const list = await procurementData.purchaseOrders.list();
  return NextResponse.json({ purchaseOrders: list });
}

export async function POST(request: Request) {
  const { response } = await requireSession(["admin", "procurement_officer"]);

  if (response) {
    return response;
  }

  const parsed = await parseJson(request, purchaseOrderSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const created = await procurementData.purchaseOrders.create(parsed.data.quotationId);
  return NextResponse.json({ purchaseOrder: created }, { status: 201 });
}
