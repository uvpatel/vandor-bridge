import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import { auth } from "@/lib/auth";
import type { ProcurementRole } from "@/lib/procurement-data";

type SessionUser = {
  id: string;
  role?: ProcurementRole;
};

export async function requireSession(allowedRoles?: ProcurementRole[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }

  const user = session.user as SessionUser;

  if (allowedRoles?.length && (!user.role || !allowedRoles.includes(user.role))) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      user: null,
    };
  }

  return { response: null, user };
}

export async function parseJson<T>(request: Request, schema: ZodType<T>) {
  try {
    const body = await request.json();
    return { data: schema.parse(body), response: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        data: null,
        response: NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 422 }),
      };
    }

    return {
      data: null,
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}
