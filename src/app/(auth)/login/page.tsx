import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Building2, CheckCircle2 } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";

const highlights = [
  "End-to-end procurement workflow",
  "Role-based access for officers, vendors & managers",
  "Real-time approval tracking with audit logs",
  "Auto-generated POs and GST invoices",
];

export default async function LoginPage() {
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
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-2xl" />
          {/* Grid pattern */}
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
            Procurement & Vendor Management
          </div>
          <h2 className="max-w-sm text-4xl font-extrabold leading-tight text-white">
            Secure workflows for smarter procurement.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-indigo-200">
            From RFQs to invoices — manage your entire supply chain with confidence.
          </p>

          <ul className="mt-8 space-y-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-sm text-indigo-100">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom testimonial card */}
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-sm italic text-indigo-100">
            "VendorBridge cut our procurement approval cycle from 5 days to under 2 — with full GST compliance built in."
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-[10px] font-bold text-white">
              MS
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Meera Shah</p>
              <p className="text-[10px] text-indigo-400">Head of Procurement, Orion Industrial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-col bg-gradient-to-b from-white to-indigo-50/30">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 lg:border-0">
          <a href="/" className="flex items-center gap-2 font-semibold lg:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Building2 className="size-3.5" />
            </div>
            VendorBridge
          </a>
          <p className="ml-auto text-sm text-slate-500">
            New user?{" "}
            <a href="/signup" className="font-semibold text-indigo-600 hover:underline">
              Sign up
            </a>
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
