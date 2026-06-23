import { NextResponse } from "next/server";

import { parseJson, requireSession } from "@/lib/api";
import { approvalSchema, procurementData } from "@/lib/procurement-data";

export async function GET() {
  const { response } = await requireSession(["admin", "manager", "procurement_officer"]);

  if (response) {
    return response;
  }

  const list = await procurementData.approvals.list();
  return NextResponse.json({ approvals: list });
}

export async function POST(request: Request) {
  const { response, user } = await requireSession(["admin", "manager"]);

  if (response) {
    return response;
  }

  const parsed = await parseJson(request, approvalSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const result = await procurementData.approvals.decide(parsed.data, user!.id);
  return NextResponse.json({ approval: result });
}
