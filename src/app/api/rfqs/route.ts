import { NextResponse } from "next/server";

import { parseJson, requireSession } from "@/lib/api";
import { procurementData, rfqSchema } from "@/lib/procurement-data";

export async function GET() {
  const { response } = await requireSession();

  if (response) {
    return response;
  }

  const list = await procurementData.rfqs.list();
  return NextResponse.json({ rfqs: list });
}

export async function POST(request: Request) {
  const { response, user } = await requireSession(["admin", "procurement_officer"]);

  if (response) {
    return response;
  }

  const parsed = await parseJson(request, rfqSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const created = await procurementData.rfqs.create(parsed.data, user!.id);
  return NextResponse.json({ rfq: created }, { status: 201 });
}
