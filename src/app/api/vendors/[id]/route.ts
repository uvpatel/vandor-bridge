import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJson, requireSession } from "@/lib/api";
import { db } from "@/db";
import { vendors, activities } from "@/db/schema";
import { eq } from "drizzle-orm";

const patchSchema = z.object({
  status: z.enum(["active", "review", "suspended", "inactive"]),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/vendors/[id]">
) {
  const { response } = await requireSession(["admin", "procurement_officer"]);
  if (response) return response;

  const { id } = await context.params;

  // Check vendor exists
  const existing = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const parsed = await parseJson(request, patchSchema);
  if (parsed.response) return parsed.response;

  const updated = await db
    .update(vendors)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(vendors.id, id))
    .returning();

  await db.insert(activities).values({
    id: `act_${Math.random().toString(36).substring(2, 11)}`,
    entityType: "vendor",
    entityId: id,
    action: "status_updated",
    message: `Vendor "${existing[0].name}" status updated to ${parsed.data.status}.`,
  });

  return NextResponse.json({ vendor: updated[0] });
}
