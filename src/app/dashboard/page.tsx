import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, vendors, rfqs, quotations, approvals, purchaseOrders, invoices } from "@/db/schema";
import { eq, desc, sql, not } from "drizzle-orm";
import { procurementData } from "@/lib/procurement-data";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardCheck,
  FileInput,
  PackageCheck,
  FileText,
  Activity,
  Plus,
  Building,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?callbackURL=/dashboard");
  }

  const user = session.user;

  // Handle social login role cookie
  const cookieStore = await cookies();
  const pendingRole = cookieStore.get("pending_role")?.value;
  if (pendingRole && user.role === "procurement_officer" && pendingRole !== "procurement_officer") {
    await db.update(users).set({ role: pendingRole as any }).where(eq(users.id, user.id));
    (await cookies()).set({ name: "pending_role", value: "", maxAge: 0, path: "/" });
    redirect("/dashboard");
  }

  // Load stats
  const dashboardStats = await procurementData.dashboard(user.role ?? undefined, user.id);
  
  // Calculate sum of POs this month
  const poSumResult = await db
    .select({ sum: sql<string>`sum(total)` })
    .from(purchaseOrders);
  const totalPoAmount = parseFloat(poSumResult[0]?.sum || "0");
  
  // Format as Lakhs if above 100k, else standard formatting
  let formattedPoSum = `Rs. ${(totalPoAmount / 100000).toFixed(1)}L`;
  if (totalPoAmount < 100000) {
    formattedPoSum = `Rs. ${(totalPoAmount / 1000).toFixed(0)}K`;
  }

  // Count of overdue invoices (not paid and created over 7 days ago, or just all unpaid invoices for simulation)
  const unpaidInvoices = await db
    .select()
    .from(invoices)
    .where(not(eq(invoices.status, "paid")));
  const overdueCount = unpaidInvoices.length;

  // Fetch recent POs with vendor name
  const recentPOs = await db
    .select({
      poNumber: purchaseOrders.poNumber,
      total: purchaseOrders.total,
      status: purchaseOrders.status,
      vendorName: vendors.name,
    })
    .from(purchaseOrders)
    .leftJoin(quotations, eq(purchaseOrders.quotationId, quotations.id))
    .leftJoin(vendors, eq(quotations.vendorId, vendors.id))
    .orderBy(desc(purchaseOrders.issuedAt))
    .limit(5);

  const activeRoleName = (user.role ?? "procurement_officer").replace("_", " ").toUpperCase();

  return (
    <div className="flex flex-1 flex-col p-6 space-y-6 animate-fade-in">
      {/* Header section matching style of excalidraw */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm">
          Welcome back, {user.name} ({activeRoleName}) — Today's Overview
        </p>
      </div>

      {/* Grid Cards matching Excalidraw names exactly */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Active RFQs */}
        <Card className="border border-slate-200/80 shadow-sm transition hover:shadow-md animate-fade-in-up">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-extrabold text-slate-900">{dashboardStats.metrics.activeRfqs}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">Active RFQ's</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileInput className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pending Approvals */}
        <Card className="border border-slate-200/80 shadow-sm transition hover:shadow-md animate-fade-in-up animate-stagger-1">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-extrabold text-slate-900">{dashboardStats.metrics.pendingApprovals}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">Pending Approvals</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ClipboardCheck className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: POs this month */}
        <Card className="border border-slate-200/80 shadow-sm transition hover:shadow-md animate-fade-in-up animate-stagger-2">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-extrabold text-slate-900">{formattedPoSum}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">PO's this month</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <PackageCheck className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Overdue Invoices */}
        <Card className="border border-slate-200/80 shadow-sm transition hover:shadow-md animate-fade-in-up animate-stagger-3">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-extrabold text-slate-900">{overdueCount}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">overdue invoices</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid: Recent Purchase Orders & Spending Trends */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Purchase Orders Table */}
        <div className="lg:col-span-2">
          <Card className="h-full border border-slate-200/85 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Recent Purchase Orders</CardTitle>
              <CardDescription>Track status of recently generated PO documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="pb-3">PO#</th>
                      <th className="pb-3">Vendor</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {recentPOs.length > 0 ? (
                      recentPOs.map((po) => (
                        <tr key={po.poNumber} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 font-semibold text-slate-900">{po.poNumber}</td>
                          <td className="py-3">{po.vendorName || "Unknown Vendor"}</td>
                          <td className="py-3 font-medium">Rs. {parseFloat(po.total || "0").toLocaleString()}</td>
                          <td className="py-3">
                           <Badge
  variant="outline"
  className={
    po.status === "paid"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : po.status === "draft"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : po.status === "sent"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-slate-50 text-slate-700 border-slate-200"
  }
>
  {po.status}
</Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                          No recent purchase orders.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spending Trends Chart */}
        <div>
          <Card className="h-full border border-slate-200/85 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Spending Trends last 6 months</CardTitle>
              <CardDescription>Procurement spent breakdown.</CardDescription>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ChartAreaInteractive />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Action buttons matching mockup exactly */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button asChild variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm">
          <Link href="/dashboard/rfq">
            <Plus className="mr-2 size-4" /> + new RFQ
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm">
          <Link href="/dashboard/vendor">
            <Building className="mr-2 size-4" /> Add Vendor
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm">
          <Link href="/dashboard/invoices">
            <FileText className="mr-2 size-4" /> View Invoices
          </Link>
        </Button>
      </div>
    </div>
  );
}
