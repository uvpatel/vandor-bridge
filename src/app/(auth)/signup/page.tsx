import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Building2, CheckCircle2 } from "lucide-react";

import { SignupForm } from "@/components/signup-form";
import { auth } from "@/lib/auth";

const roles = [
  { icon: "🏗️", name: "Procurement Officer", desc: "Create RFQs, compare bids, generate POs & invoices" },
  { icon: "🏢", name: "Vendor", desc: "Submit quotations, track PO status & view invoices" },
  { icon: "✅", name: "Manager", desc: "Approve/reject bids, add remarks, monitor workflows" },
  { icon: "⚙️", name: "Admin", desc: "Full platform control — users, vendors, analytics" },
];

export default async function SignupPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left: Branding Panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-lg shadow-indigo-900/30">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">VendorBridge</p>
            <p className="text-xs text-indigo-300">Procurement ERP</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative">
          <div className="mb-4 inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
            Role-aware onboarding
          </div>
          <h2 className="max-w-sm text-4xl font-extrabold leading-tight text-white">
            Choose your role, get instant access.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-indigo-200">
            VendorBridge adapts to your procurement role with a tailored workspace.
          </p>

          <div className="mt-8 space-y-3">
            {roles.map((r) => (
              <div key={r.name} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                <span className="text-xl">{r.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-indigo-300 mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <CheckCircle2 className="size-4 text-emerald-400" />
            Free to use · No credit card required
          </div>
        </div>
      </div>

      {/* Right: Signup Form */}
      <div className="flex flex-col bg-gradient-to-b from-white to-indigo-50/30">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 lg:border-0">
          <a href="/" className="flex items-center gap-2 font-semibold lg:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Building2 className="size-3.5" />
            </div>
            VendorBridge
          </a>
          <p className="ml-auto text-sm text-slate-500">
            Have an account?{" "}
            <a href="/login" className="font-semibold text-indigo-600 hover:underline">
              Sign in
            </a>
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
