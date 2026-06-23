"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { 
  Download, 
  BarChart4, 
  TrendingUp, 
  DollarSign, 
  Star, 
  Clock, 
  Building2, 
  CheckCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: string;
}

interface RFQ {
  id: string;
  title: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  quotationId: string;
  total: string;
  issuedAt: string;
}

export default function ReportsPage() {
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [poList, setPoList] = React.useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [vRes, poRes] = await Promise.all([
        fetch("/api/vendors"),
        fetch("/api/purchase-orders"),
      ]);

      if (vRes.ok && poRes.ok) {
        const vData = await vRes.json();
        const poData = await poRes.json();
        setVendors(vData.vendors || []);
        setPoList(poData.purchaseOrders || []);
      } else {
        toast.error("Failed to load reports metrics");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export analytics summary report to .txt file
  const handleExportReport = () => {
    const totalSpent = poList.reduce((sum, po) => sum + parseFloat(po.total), 0);
    const avgRating = vendors.length > 0 
      ? (vendors.reduce((sum, v) => sum + parseFloat(v.rating), 0) / vendors.length).toFixed(2)
      : "4.00";

    const reportContent = `
=============================================
         VENDORBRIDGE ERP PROCUREMENT REPORT
=============================================
Generated Date:    ${new Date().toLocaleString()}
Active Supplier count: ${vendors.length}
Total Issued Contracts: ${poList.length}

Procurement Spent Metrics:
---------------------------------------------
Accumulated PO Spent: Rs. ${totalSpent.toLocaleString()}
Average Supplier Rating: ${avgRating} / 5.00
Average Approval speed: 1.8 Days
On-time Delivery Rate: 94.2%

Supplier Audit Log:
---------------------------------------------
${vendors.map(v => `- ${v.name} (${v.category}) Rating: ${v.rating}`).join("\n")}

=============================================
End of Report. Confidential.
    `;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Procurement_Spent_Report_${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Procurement Spent Report exported successfully!");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100 m-6">
        <Loader2 className="size-8 animate-spin text-slate-500" />
        <p className="mt-2 text-sm text-slate-500">Loading procurement report metrics...</p>
      </div>
    );
  }

  const totalSpentVal = poList.reduce((sum, po) => sum + parseFloat(po.total), 0);
  const averageSupplierRatingVal = vendors.length > 0 
    ? (vendors.reduce((sum, v) => sum + parseFloat(v.rating), 0) / vendors.length).toFixed(2)
    : "4.00";

  return (
    <div className="p-6 space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm">Review spent analytics, monthly procurement trends, and supplier delivery scores.</p>
        </div>
        <Button onClick={handleExportReport} className="bg-slate-950 text-white hover:bg-slate-800">
          <Download className="mr-2 size-4" /> Export Report (TXT)
        </Button>
      </div>

      {/* Analytics widgets row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Spent (PO)</CardTitle>
            <DollarSign className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalSpentVal.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-0.5"><TrendingUp className="size-3 text-emerald-500" /> +12.5% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Avg Vendor Rating</CardTitle>
            <Star className="size-4 text-amber-500 fill-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSupplierRatingVal} / 5.00</div>
            <p className="text-xs text-slate-400 mt-1">Audit score across {vendors.length} vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Avg Approval Speed</CardTitle>
            <Clock className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.8 Days</div>
            <p className="text-xs text-slate-400 mt-1">From shortlisting to manager sign-off</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">On-Time delivery</CardTitle>
            <CheckCircle className="size-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-slate-400 mt-1">Vendor compliance rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Interactive Spend Categories chart */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart4 className="size-4 text-slate-500" /> Spending Allocation & Monthly Trends
              </CardTitle>
              <CardDescription>Interactive view showing monthly distribution.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartAreaInteractive />
            </CardContent>
          </Card>
        </div>

        {/* Vendor Leaderboard */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="size-4 text-slate-500" /> Supplier Audit Rankings
              </CardTitle>
              <CardDescription>Vendors ordered by quality audit scores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendors.length > 0 ? (
                vendors.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 5).map((v, index) => (
                  <div key={v.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                    <div className="flex gap-2.5 items-center">
                      <span className="flex size-5 items-center justify-center rounded bg-slate-900 text-white font-bold text-[10px]">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800 leading-tight">{v.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{v.category}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold flex gap-0.5 items-center">
                      <Star className="size-3 fill-amber-400 text-amber-400" /> {v.rating}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm italic">No suppliers registered.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
