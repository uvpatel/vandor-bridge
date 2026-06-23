import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="size-4" />
            </div>
            VendorBridge
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="hidden border-l bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-300">Procurement & Vendor Management ERP</p>
          <h2 className="mt-4 max-w-md text-4xl font-semibold">Secure workflows for RFQs, approvals, POs, and invoices.</h2>
        </div>
        <div className="grid gap-3 text-sm text-slate-300">
          <span>Role-based sessions</span>
          <span>Vendor quotation tracking</span>
          <span>Invoice email and print flow</span>
        </div>
      </div>
    </div>
  );
}
