import { NextResponse } from "next/server";

import { parseJson, requireSession } from "@/lib/api";
import { procurementData, vendorSchema } from "@/lib/procurement-data";

export async function GET() {
  const { response } = await requireSession();

  if (response) {
    return response;
  }

  const list = await procurementData.vendors.list();
  return NextResponse.json({ vendors: list });
}

export async function POST(request: Request) {
  const { response } = await requireSession(["admin", "procurement_officer"]);

  if (response) {
    return response;
  }

  const parsed = await parseJson(request, vendorSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const created = await procurementData.vendors.create(parsed.data);
  return NextResponse.json({ vendor: created }, { status: 201 });
}
