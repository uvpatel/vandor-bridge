import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJson, requireSession } from "@/lib/api";
import { db } from "@/db";
import { rfqs, activities } from "@/db/schema";
import { eq } from "drizzle-orm";

const patchSchema = z.object({
  status: z.enum(["draft", "invited", "receiving_quotes", "comparison", "approval", "approved", "rejected", "converted", "closed"]),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/rfqs/[id]">
) {
  const { response } = await requireSession(["admin", "procurement_officer", "manager"]);
  if (response) return response;

  const { id } = await context.params;

  const existing = await db.select().from(rfqs).where(eq(rfqs.id, id)).limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
  }

  const parsed = await parseJson(request, patchSchema);
  if (parsed.response) return parsed.response;

  const updated = await db
    .update(rfqs)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(rfqs.id, id))
    .returning();

  await db.insert(activities).values({
    id: `act_${Math.random().toString(36).substring(2, 11)}`,
    entityType: "rfq",
    entityId: id,
    action: "status_updated",
    message: `RFQ "${existing[0].title}" status moved to ${parsed.data.status}.`,
  });

  return NextResponse.json({ rfq: updated[0] });
}
