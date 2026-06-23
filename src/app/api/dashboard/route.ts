import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api";
import { procurementData } from "@/lib/procurement-data";

export async function GET() {
  const { response, user } = await requireSession();

  if (response) {
    return response;
  }

  const data = await procurementData.dashboard(user?.role, user?.id);
  return NextResponse.json(data);
}
