import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  Building2,
  FileText,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Users2,
  ClipboardList,
  PackageCheck,
  Zap,
  Globe2,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Users2,
    title: "Vendor Management",
    description: "Register vendors with GST details, track status, set categories, and maintain contact directories.",
    color: "from-violet-500 to-indigo-600",
    bg: "bg-violet-50",
  },
  {
    icon: ClipboardList,
    title: "RFQ Workflows",
    description: "Create Requests for Quotation, set deadlines, attach specs, and invite multiple vendors to bid.",
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-50",
  },
  {
    icon: BarChart3,
    title: "Quotation Comparison",
    description: "Compare bids side-by-side with price, delivery, and vendor ratings. Instantly identify the best offer.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
  },
  {
    icon: ShieldCheck,
    title: "Approval Workflows",
    description: "Route shortlisted quotations to managers for formal approval with remarks and audit trails.",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
  },
  {
    icon: PackageCheck,
    title: "Purchase Orders",
    description: "Auto-generate numbered PO contracts from approved bids with GST tax calculations.",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
  },
  {
    icon: FileText,
    title: "Invoice Management",
    description: "Generate invoices, print or email them to vendors, and track billing status end-to-end.",
    color: "from-indigo-500 to-purple-600",
    bg: "bg-indigo-50",
  },
];

const workflow = [
  { step: "01", title: "Create RFQ", desc: "Officer defines specifications and invites vendors" },
  { step: "02", title: "Collect Quotes", desc: "Vendors respond with competitive pricing and timelines" },
  { step: "03", title: "Compare & Select", desc: "Side-by-side analysis highlights the best bid" },
  { step: "04", title: "Manager Approval", desc: "Structured sign-off with remarks and audit trail" },
  { step: "05", title: "Issue PO", desc: "Auto-numbered purchase order contract generated" },
  { step: "06", title: "Invoice & Close", desc: "Invoice sent to vendor, payment tracked and logged" },
];

const roles = [
  { role: "Procurement Officer", icon: "🏗️", perks: ["Create RFQs", "Compare Quotations", "Issue POs & Invoices"] },
  { role: "Vendor", icon: "🏢", perks: ["Respond to RFQs", "Track PO status", "View issued invoices"] },
  { role: "Manager / Approver", icon: "✅", perks: ["Approve or reject bids", "Add review remarks", "Monitor workflows"] },
  { role: "Admin", icon: "⚙️", perks: ["Manage all users", "Configure vendors", "Full analytics access"] },
];

const stats = [
  { value: "10×", label: "Faster procurement cycle" },
  { value: "100%", label: "Digital audit trail" },
  { value: "4 roles", label: "Role-based access control" },
  { value: "18% GST", label: "Auto tax calculations" },
];

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <Building2 className="size-4" />
            </div>
            <span className="text-base font-bold text-slate-900">VendorBridge</span>
            <span className="hidden rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 sm:block">
              ERP
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-20 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
          <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-violet-100/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-emerald-100/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 animate-fade-in">
            <Zap className="size-3.5 fill-indigo-500 text-indigo-500" />
            Procurement &amp; Vendor Management ERP
          </div>

          <h1 className="mt-2 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl animate-fade-in-up">
            Procurement,{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 bg-clip-text text-transparent">
              simplified.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500 animate-fade-in-up animate-stagger-1">
            VendorBridge centralizes your entire procurement workflow — from Request for Quotations to vendor selection, approvals, purchase orders, and invoice management — in one powerful platform.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up animate-stagger-2">
            <Link
              href="/signup"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:opacity-90 hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98]"
            >
              Start for free
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md"
            >
              Sign in to dashboard
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4 animate-fade-in-up animate-stagger-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-black text-indigo-600">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-500">Platform modules</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Everything procurement needs</h2>
            <p className="mt-3 text-lg text-slate-500">
              A complete ERP module suite covering the full vendor-to-invoice lifecycle.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`group rounded-2xl border border-slate-100 ${f.bg} p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-sm`}>
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-500">How it works</p>
            <h2 className="text-4xl font-extrabold text-slate-900">End-to-end procurement workflow</h2>
            <p className="mt-3 text-lg text-slate-500">
              A structured, auditable path from request to payment.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflow.map((w) => (
              <div key={w.step} className="relative rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-6 transition hover:border-indigo-200 hover:shadow-md">
                <div className="mb-3 text-3xl font-black text-indigo-200">{w.step}</div>
                <h3 className="text-base font-bold text-slate-900">{w.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-slate-950 px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-400">Role-based access</p>
            <h2 className="text-4xl font-extrabold text-white">Built for every stakeholder</h2>
            <p className="mt-3 text-lg text-slate-400">
              Each user role gets a tailored workspace with exactly the right permissions.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <div key={r.role} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:bg-white/10">
                <div className="mb-3 text-3xl">{r.icon}</div>
                <h3 className="text-base font-bold text-white">{r.role}</h3>
                <ul className="mt-3 space-y-2">
                  {r.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lock className="size-4 text-indigo-400" />
              Role-based security
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe2 className="size-4 text-indigo-400" />
              GST tax compliance
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="size-4 text-indigo-400" />
              Real-time audit logs
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-indigo-400" />
              OAuth + email auth
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-12 text-center shadow-xl shadow-indigo-100">
          <h2 className="text-4xl font-extrabold text-slate-900">
            Ready to streamline your procurement?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-500">
            Create your account in seconds. Choose your role, complete registration, and access your personalized procurement workspace.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:opacity-90 hover:shadow-xl active:scale-[0.98]"
            >
              Create free account
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:shadow-md"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Building2 className="size-3.5" />
            </div>
            <span className="text-sm font-semibold text-slate-700">VendorBridge ERP</span>
          </div>
          <p className="text-xs text-slate-400">
            Procurement &amp; Vendor Management Platform · Built for Odoo Hackathon 2026
          </p>
        </div>
      </footer>
    </main>
  );
}
