import {
  Activity,
  ArrowDownUp,
  BadgeCheck,
  Bell,
  Building2,
  CalendarClock,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileInput,
  FileText,
  Filter,
  Gauge,
  Inbox,
  PackageCheck,
  Plus,
  Printer,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Upload,
  Users2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const navigation = [
  { label: "Home", icon: Gauge, active: true },
  { label: "Vendors", icon: Building2 },
  { label: "RFQs", icon: FileInput },
  { label: "Quotations", icon: ArrowDownUp },
  { label: "Approvals", icon: ClipboardCheck },
  { label: "PO & invoices", icon: FileCheck2 },
  { label: "Logs", icon: Activity },
  { label: "Reports", icon: CircleDollarSign },
];

const roles = ["Procurement Officer", "Vendor", "Manager", "Admin"];

const metrics = [
  { label: "Pending approvals", value: "14", change: "+3 today", icon: ClipboardCheck },
  { label: "Active RFQs", value: "28", change: "11 due this week", icon: FileInput },
  { label: "Purchase orders", value: "43", change: "Rs. 18.4L open", icon: PackageCheck },
  { label: "Invoices ready", value: "19", change: "7 awaiting email", icon: FileText },
];

const vendors = [
  {
    name: "Orion Industrial Supplies",
    category: "Packaging",
    gst: "27AAECO5421F1Z5",
    contact: "Meera Shah",
    status: "Active",
    rating: "4.8",
  },
  {
    name: "Northline Components",
    category: "Electronics",
    gst: "24AACCN1198B1Z2",
    contact: "Rohan Mehta",
    status: "Review",
    rating: "4.4",
  },
  {
    name: "Prism Facility Partners",
    category: "Services",
    gst: "29AAGCP7622K1Z9",
    contact: "Anika Rao",
    status: "Active",
    rating: "4.6",
  },
];

const rfqItems = [
  { id: "RFQ-2048", title: "Corrugated export cartons", vendors: 18, deadline: "26 Jun", status: "Receiving quotes" },
  { id: "RFQ-2051", title: "Assembly line sensors", vendors: 9, deadline: "28 Jun", status: "Draft" },
  { id: "RFQ-2056", title: "Warehouse cleaning contract", vendors: 6, deadline: "30 Jun", status: "Invited" },
];

const quotations = [
  { vendor: "Orion", price: "Rs. 4,82,000", delivery: "5 days", rating: "4.8", note: "Lowest price", best: true },
  { vendor: "Northline", price: "Rs. 5,10,000", delivery: "4 days", rating: "4.4", note: "Fastest delivery" },
  { vendor: "Prism", price: "Rs. 5,28,500", delivery: "7 days", rating: "4.6", note: "Extended warranty" },
];

const approvalSteps = [
  { label: "RFQ created", detail: "Procurement Officer", done: true },
  { label: "Quotation selected", detail: "Orion Industrial", done: true },
  { label: "Manager review", detail: "Awaiting remarks", done: false },
  { label: "PO generation", detail: "Blocked until approval", done: false },
];

const activity = [
  "RFQ-2048 invitation sent to 18 vendors.",
  "Orion submitted revised quotation with GST breakdown.",
  "Manager Priya opened approval request APR-1182.",
  "Invoice INV-778 was printed and emailed to finance.",
];

const spendBars = [
  { label: "Packaging", value: "42%", width: "w-[42%]", color: "bg-teal-600" },
  { label: "Electronics", value: "31%", width: "w-[31%]", color: "bg-sky-600" },
  { label: "Services", value: "18%", width: "w-[18%]", color: "bg-amber-500" },
  { label: "Maintenance", value: "9%", width: "w-[9%]", color: "bg-rose-500" },
];

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "green" | "amber" | "blue" | "neutral" }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return <span className={`inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f7f9] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold">VendorBridge</p>
                  <p className="text-xs text-slate-500">Procurement ERP</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map(({ label, icon: Icon, active }) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`}
                  className={`flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                    active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </a>
              ))}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">SIGNED IN AS</p>
                <p className="mt-1 text-sm font-semibold">Procurement Officer</p>
                <p className="text-xs text-slate-500">po@vendorbridge.app</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Tuesday, 23 Jun</p>
                <h1 className="text-xl font-semibold sm:text-2xl">Procurement command center</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-500 md:flex">
                  <Search className="size-4" />
                  Search vendors, RFQs, invoices
                </div>
                <Button variant="outline" size="icon" aria-label="Notifications">
                  <Bell className="size-4" />
                </Button>
                <Button className="bg-slate-950 text-white hover:bg-slate-800">
                  <Plus className="size-4" />
                  New RFQ
                </Button>
              </div>
            </div>
          </header>

          <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <section id="home" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map(({ label, value, change, icon: Icon }) => (
                  <article key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500">{label}</p>
                        <p className="mt-2 text-3xl font-semibold">{value}</p>
                      </div>
                      <div className="flex size-9 items-center justify-center rounded-md bg-slate-100">
                        <Icon className="size-4 text-slate-700" />
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-medium text-slate-500">{change}</p>
                  </article>
                ))}
              </section>

              <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div id="rfqs" className="rounded-lg border border-slate-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                    <div>
                      <h2 className="font-semibold">RFQ creation workspace</h2>
                      <p className="text-sm text-slate-500">Product details, quantity, vendors, deadline, attachments</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="size-4" />
                      Attach
                    </Button>
                  </div>
                  <div className="grid gap-3 p-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm font-medium">
                      RFQ title
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-normal text-slate-600">Corrugated export cartons</div>
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                      Deadline
                      <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-normal text-slate-600">
                        26 Jun 2026 <CalendarClock className="size-4" />
                      </div>
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                      Product / service
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-normal text-slate-600">5-ply cartons, 40 x 30 x 25 cm</div>
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                      Quantity
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-normal text-slate-600">12,000 units</div>
                    </label>
                  </div>
                  <div className="border-t border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">Active RFQs</p>
                      <Button variant="ghost" size="sm">
                        <Filter className="size-4" />
                        Filter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {rfqItems.map((rfq) => (
                        <div key={rfq.id} className="grid gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-[90px_1fr_auto] sm:items-center">
                          <p className="text-sm font-semibold">{rfq.id}</p>
                          <div>
                            <p className="text-sm font-medium">{rfq.title}</p>
                            <p className="text-xs text-slate-500">{rfq.vendors} vendors assigned - due {rfq.deadline}</p>
                          </div>
                          <StatusPill tone={rfq.status === "Draft" ? "amber" : "blue"}>{rfq.status}</StatusPill>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div id="vendors" className="rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 p-4">
                    <div>
                      <h2 className="font-semibold">Vendor management</h2>
                      <p className="text-sm text-slate-500">GST, categories, contacts, status</p>
                    </div>
                    <Button variant="outline" size="icon" aria-label="Vendor filters">
                      <SlidersHorizontal className="size-4" />
                    </Button>
                  </div>
                  <div className="space-y-3 p-4">
                    {vendors.map((vendor) => (
                      <article key={vendor.name} className="rounded-md border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{vendor.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{vendor.category} - GST {vendor.gst}</p>
                          </div>
                          <StatusPill tone={vendor.status === "Active" ? "green" : "amber"}>{vendor.status}</StatusPill>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users2 className="size-3.5" />
                            {vendor.contact}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            {vendor.rating}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <section id="quotations" className="rounded-lg border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                  <div>
                    <h2 className="font-semibold">Quotation comparison</h2>
                    <p className="text-sm text-slate-500">Side-by-side price, delivery, rating, and vendor notes</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <ArrowDownUp className="size-4" />
                    Sort
                  </Button>
                </div>
                <div className="grid gap-3 p-4 lg:grid-cols-3">
                  {quotations.map((quote) => (
                    <article key={quote.vendor} className={`rounded-lg border p-4 ${quote.best ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{quote.vendor}</p>
                        {quote.best ? <StatusPill tone="green">Lowest</StatusPill> : <StatusPill>{quote.note}</StatusPill>}
                      </div>
                      <p className="mt-4 text-2xl font-semibold">{quote.price}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-md bg-white/70 p-2">
                          <p className="text-xs text-slate-500">Delivery</p>
                          <p className="font-medium">{quote.delivery}</p>
                        </div>
                        <div className="rounded-md bg-white/70 p-2">
                          <p className="text-xs text-slate-500">Rating</p>
                          <p className="font-medium">{quote.rating}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section id="approvals" className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 p-4">
                    <h2 className="font-semibold">Approval workflow</h2>
                    <p className="text-sm text-slate-500">Approve, reject, remark, and track state transitions</p>
                  </div>
                  <div className="space-y-3 p-4">
                    {approvalSteps.map((step) => (
                      <div key={step.label} className="flex gap-3">
                        <div className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-full ${step.done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                          {step.done ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{step.label}</p>
                          <p className="text-xs text-slate-500">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 border-t border-slate-200 p-4">
                    <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                      <Check className="size-4" />
                      Approve
                    </Button>
                    <Button variant="destructive">
                      <X className="size-4" />
                      Reject
                    </Button>
                  </div>
                </div>

                <div id="po-and-invoices" className="rounded-lg border border-slate-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                    <div>
                      <h2 className="font-semibold">Purchase order & invoice</h2>
                      <p className="text-sm text-slate-500">Auto numbers, taxes, PDF, print, and email</p>
                    </div>
                    <StatusPill tone="green">PO-1094 generated</StatusPill>
                  </div>
                  <div className="p-4">
                    <div className="rounded-lg border border-slate-200">
                      <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-slate-500">Invoice</p>
                          <p className="font-semibold">INV-778</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Subtotal</p>
                          <p className="font-semibold">Rs. 4,82,000</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">GST 18%</p>
                          <p className="font-semibold">Rs. 86,760</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div>
                          <p className="text-xs text-slate-500">Grand total</p>
                          <p className="text-2xl font-semibold">Rs. 5,68,760</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="size-4" />
                            PDF
                          </Button>
                          <Button variant="outline" size="sm">
                            <Printer className="size-4" />
                            Print
                          </Button>
                          <Button size="sm" className="bg-slate-950 text-white hover:bg-slate-800">
                            <Send className="size-4" />
                            Email
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-4">
                  <h2 className="font-semibold">Login & access</h2>
                  <p className="text-sm text-slate-500">Role-based authentication states</p>
                </div>
                <div className="space-y-3 p-4">
                  <div className="rounded-md border border-slate-200 p-3">
                    <label className="text-xs font-semibold text-slate-500">Email</label>
                    <p className="mt-1 text-sm">po@vendorbridge.app</p>
                  </div>
                  <div className="rounded-md border border-slate-200 p-3">
                    <label className="text-xs font-semibold text-slate-500">Password</label>
                    <p className="mt-1 text-sm">••••••••••••</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((role) => (
                      <StatusPill key={role} tone={role === "Procurement Officer" ? "blue" : "neutral"}>
                        {role}
                      </StatusPill>
                    ))}
                  </div>
                  <Button className="w-full bg-slate-950 text-white hover:bg-slate-800">
                    <ShieldCheck className="size-4" />
                    Validate session
                  </Button>
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Signup enabled</span>
                    <span>Forgot password</span>
                  </div>
                </div>
              </section>

              <section id="logs" className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 p-4">
                  <div>
                    <h2 className="font-semibold">Activity logs</h2>
                    <p className="text-sm text-slate-500">Notifications and audit trail</p>
                  </div>
                  <Inbox className="size-5 text-slate-500" />
                </div>
                <div className="space-y-3 p-4">
                  {activity.map((item, index) => (
                    <div key={item} className="flex gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold">{index + 1}</div>
                      <p className="text-sm leading-6 text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="reports" className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 p-4">
                  <div>
                    <h2 className="font-semibold">Reports & analytics</h2>
                    <p className="text-sm text-slate-500">Spend and vendor performance</p>
                  </div>
                  <Button variant="outline" size="icon" aria-label="Export reports">
                    <Download className="size-4" />
                  </Button>
                </div>
                <div className="space-y-4 p-4">
                  {spendBars.map((bar) => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{bar.label}</span>
                        <span className="text-slate-500">{bar.value}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${bar.width} ${bar.color}`} />
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Avg approval</p>
                      <p className="mt-1 text-xl font-semibold">1.8d</p>
                    </div>
                    <div className="rounded-md border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">On-time vendors</p>
                      <p className="mt-1 text-xl font-semibold">92%</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="size-5 text-emerald-300" />
                  <div>
                    <p className="font-semibold">ERP workflow covered</p>
                    <p className="text-sm text-slate-300">RFQ to invoice with auditability</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <span className="rounded-md bg-white/10 px-2 py-2">PDF invoices</span>
                  <span className="rounded-md bg-white/10 px-2 py-2">Email sending</span>
                  <span className="rounded-md bg-white/10 px-2 py-2">Approvals</span>
                  <span className="rounded-md bg-white/10 px-2 py-2">Audit logs</span>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
