import { NextResponse } from "next/server";

import { parseJson, requireSession } from "@/lib/api";
import { procurementData, quotationSchema } from "@/lib/procurement-data";

export async function GET() {
  const { response } = await requireSession();

  if (response) {
    return response;
  }

  const list = await procurementData.quotations.list();
  return NextResponse.json({ quotations: list });
}

export async function POST(request: Request) {
  const { response } = await requireSession(["admin", "vendor"]);

  if (response) {
    return response;
  }

  const parsed = await parseJson(request, quotationSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const created = await procurementData.quotations.create(parsed.data);
  return NextResponse.json({ quotation: created }, { status: 201 });
}
