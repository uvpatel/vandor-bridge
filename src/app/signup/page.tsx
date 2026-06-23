import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";

import { SignupForm } from "@/components/signup-form";
import { auth } from "@/lib/auth";

export default async function SignupPage() {
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
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="hidden border-l bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-300">Role-aware onboarding</p>
          <h2 className="mt-4 max-w-md text-4xl font-semibold">Create accounts for officers, vendors, managers, and admins.</h2>
        </div>
        <div className="grid gap-3 text-sm text-slate-300">
          <span>Procurement Officer: create RFQs and invoices</span>
          <span>Vendor: submit quotations and track POs</span>
          <span>Manager: approve or reject requests</span>
        </div>
      </div>
    </div>
  );
}
