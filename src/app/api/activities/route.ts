import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api";
import { procurementData } from "@/lib/procurement-data";

export async function GET() {
  const { response } = await requireSession();

  if (response) {
    return response;
  }

  const list = await procurementData.activities.list();
  return NextResponse.json({ activities: list });
}
