import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, vendors, rfqs, quotations, approvals, purchaseOrders, invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { procurementData } from "@/lib/procurement-data";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  FileInput,
  PackageCheck,
  FileText,
  Activity,
  Users,
  Building,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
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
    
    // Clear cookie
    (await cookies()).set({
      name: "pending_role",
      value: "",
      maxAge: 0,
      path: "/",
    });
    
    // Redirect to reload the session
    redirect("/dashboard");
  }

  // Load stats
  const dashboardStats = await procurementData.dashboard(user.role, user.id);
  const activeRoleName = user.role.replace("_", " ").toUpperCase();

  // Find linked vendor record if user is a vendor
  let linkedVendor = null;
  if (user.role === "vendor") {
    const list = await db.select().from(vendors).where(eq(vendors.contactEmail, user.email)).limit(1);
    if (list.length > 0) {
      linkedVendor = list[0];
    }
  }

  return (
    <div className="flex flex-1 flex-col p-6">
          
          {/* Welcome Banner */}
          <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-primary/10 bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">{activeRoleName}</Badge>
                {linkedVendor && <Badge variant="outline" className="border-white/20 text-white">Vendor: {linkedVendor.name}</Badge>}
              </div>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">Welcome back, {user.name}!</h2>
              <p className="text-slate-300">Monitor status, execute workflows, and manage procurement relationships in one place.</p>
            </div>
            <div className="flex gap-2">
              {user.role === "procurement_officer" && (
                <Button asChild className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  <Link href="/dashboard/rfq">
                    <FileInput className="mr-2 size-4" /> Create RFQ
                  </Link>
                </Button>
              )}
              {user.role === "vendor" && !linkedVendor && (
                <Button asChild className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  <Link href="/dashboard/vendor">
                    <Building className="mr-2 size-4" /> Register Vendor Profile
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Role-Based Dashboard Content */}
          <div className="space-y-6">
            
            {/* Dashboard Statistics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
                  <ClipboardCheck className="size-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.metrics.pendingApprovals}</div>
                  <p className="text-xs text-muted-foreground">Awaiting manager decision</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active RFQs</CardTitle>
                  <FileInput className="size-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.metrics.activeRfqs}</div>
                  <p className="text-xs text-muted-foreground">Receiving quotation responses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Purchase Orders</CardTitle>
                  <PackageCheck className="size-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.metrics.purchaseOrders}</div>
                  <p className="text-xs text-muted-foreground">PO contracts issued</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Invoices Generated</CardTitle>
                  <FileText className="size-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.metrics.invoices}</div>
                  <p className="text-xs text-muted-foreground">Invoices tracked in system</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Section */}
            <div className="grid gap-6 lg:grid-cols-3">
              
              {/* Analytics Spend Chart or Onboarding Notice */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Spending Trends & Metrics</CardTitle>
                    <CardDescription>Visual stats showing breakdown of category allocations.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {/* Render standard Interactive Chart component */}
                    <ChartAreaInteractive />
                  </CardContent>
                </Card>
              </div>

              {/* Spend summaries list */}
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Allocation by Category</CardTitle>
                    <CardDescription>Procurement category budget percentages.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dashboardStats.spendByCategory.map((bar) => {
                      const color = bar.category === "Packaging" ? "bg-teal-600" : bar.category === "Electronics" ? "bg-sky-600" : "bg-amber-500";
                      return (
                        <div key={bar.category}>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{bar.category}</span>
                            <span className="font-semibold text-slate-900">{bar.value}%</span>
                          </div>
                          <div className="mt-2 h-2.5 rounded-full bg-slate-100">
                            <div style={{ width: `${bar.value}%` }} className={`h-2.5 rounded-full ${color}`} />
                          </div>
                        </div>
                      );
                    })}

                    <div className="mt-6 rounded-lg bg-slate-50 p-4 border border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-800">Analytics Insights</h4>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-md border border-slate-200 bg-white p-2">
                          <p className="text-slate-500">Avg Approval</p>
                          <p className="mt-1 text-lg font-bold text-slate-800">1.8 Days</p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-white p-2">
                          <p className="text-slate-500">On-Time Rate</p>
                          <p className="mt-1 text-lg font-bold text-slate-800">94.2%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom Row - Audits & Timelines */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Activity Audit Logs */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Activity Audit</CardTitle>
                    <CardDescription>Chronological log of ERP actions.</CardDescription>
                  </div>
                  <Activity className="size-4 text-slate-400" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardStats.activities.length > 0 ? (
                    dashboardStats.activities.map((act) => (
                      <div key={act.id} className="flex gap-3 text-sm">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-600">
                          {act.action.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-700">{act.message}</p>
                          <p className="text-xs text-slate-400">{new Date(act.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No activities logged yet.</p>
                  )}
                  <Button variant="ghost" asChild className="w-full text-xs">
                    <Link href="/dashboard/logs">
                      View full audit timeline <ArrowRight className="ml-1 size-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Action Center depends on role */}
              <Card>
                <CardHeader>
                  <CardTitle>Action Center</CardTitle>
                  <CardDescription>Quick access workspace depending on your role.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.role === "procurement_officer" && (
                    <>
                      <p className="text-sm text-slate-600">As a Procurement Officer, you can initiate requests, select quotation lists, and issue orders.</p>
                      <div className="grid gap-2">
                        <Button variant="outline" asChild className="justify-start">
                          <Link href="/dashboard/rfq">Create & Invite Vendors to RFQ</Link>
                        </Button>
                        <Button variant="outline" asChild className="justify-start">
                          <Link href="/dashboard/quatations">Compare Submitted Quotations</Link>
                        </Button>
                        <Button variant="outline" asChild className="justify-start">
                          <Link href="/dashboard/invoices">Generate Invoices from Purchase Orders</Link>
                        </Button>
                      </div>
                    </>
                  )}
                  {user.role === "manager" && (
                    <>
                      <p className="text-sm text-slate-600">As a Manager/Approver, you hold authority to approve or reject quotes and monitor timelines.</p>
                      <div className="grid gap-2">
                        <Button variant="outline" asChild className="justify-start">
                          <Link href="/dashboard/approvals">Go to Pending Approvals Workspace</Link>
                        </Button>
                        <Button variant="outline" asChild className="justify-start">
                          <Link href="/dashboard/reports">View ERP Performance Analytics</Link>
                        </Button>
                      </div>
                    </>
                  )}
                  {user.role === "vendor" && (
                    <>
                      {linkedVendor ? (
                        <>
                          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-emerald-800 text-sm">
                            <p className="font-semibold">Linked Vendor Profile:</p>
                            <p className="mt-1 font-medium">{linkedVendor.name}</p>
                            <p className="text-xs text-emerald-600 mt-1">Category: {linkedVendor.category} | GST: {linkedVendor.gstNumber}</p>
                          </div>
                          <div className="grid gap-2 mt-3">
                            <Button variant="outline" asChild className="justify-start">
                              <Link href="/dashboard/quatations">Submit Quotation Pricing</Link>
                            </Button>
                            <Button variant="outline" asChild className="justify-start">
                              <Link href="/dashboard/invoices">Track Purchase Orders</Link>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg bg-amber-50 border border-amber-100 p-4 text-amber-800 text-sm">
                          <p className="font-semibold">Vendor Profile Required</p>
                          <p className="mt-1">You are logged in as a Vendor user, but your profile has not been registered or linked. Please complete registration to start submitting quotes.</p>
                          <Button asChild className="bg-amber-600 hover:bg-amber-500 text-white mt-3" size="sm">
                            <Link href="/dashboard/vendor">Register Profile Now</Link>
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                  {user.role === "admin" && (
                    <>
                      <p className="text-sm text-slate-600">As a System Administrator, you manage platform configurations and records.</p>
                      <div className="grid gap-2">
                        <Button variant="outline" asChild className="justify-start">
                          <Link href="/dashboard/vendor">Manage Registered Vendor Lists</Link>
                        </Button>
                        <Button variant="outline" asChild className="justify-start">
                          <Link href="/dashboard/logs">View Security Activity Timeline</Link>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
          </div>
    </div>
  );
}
