"use client";

import * as React from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardCheck, 
  Check, 
  X, 
  User, 
  Star, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  FileText, 
  MessageSquare 
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
  quantity: number;
  unit: string;
}

interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  unitPrice: string;
  deliveryDays: number;
  notes: string | null;
  status: string;
}

interface Approval {
  id: string;
  quotationId: string;
  approverId: string;
  status: "pending" | "approved" | "rejected";
  remarks: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const isManager = user?.role === "manager" || user?.role === "admin";

  const [approvalsList, setApprovalsList] = React.useState<Approval[]>([]);
  const [quotationsList, setQuotationsList] = React.useState<Quotation[]>([]);
  const [vendorsList, setVendorsList] = React.useState<Vendor[]>([]);
  const [rfqsList, setRfqsList] = React.useState<RFQ[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Decision states
  const [remarks, setRemarks] = React.useState<Record<string, string>>({});
  const [actioningId, setActioningId] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [appRes, qRes, vRes, rfqRes] = await Promise.all([
        fetch("/api/approvals"),
        fetch("/api/quotations"),
        fetch("/api/vendors"),
        fetch("/api/rfqs"),
      ]);

      if (appRes.ok && qRes.ok && vRes.ok && rfqRes.ok) {
        const appData = await appRes.json();
        const qData = await qRes.json();
        const vData = await vRes.json();
        const rfqData = await rfqRes.json();

        setApprovalsList(appData.approvals || []);
        setQuotationsList(qData.quotations || []);
        setVendorsList(vData.vendors || []);
        setRfqsList(rfqData.rfqs || []);
      } else {
        toast.error("Failed to load approvals workflow data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error loading page data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDecision = async (quotationId: string, status: "approved" | "rejected") => {
    if (!isManager) {
      toast.error("You do not have Manager permissions to decide on approvals");
      return;
    }

    try {
      setActioningId(quotationId);
      const decisionRemarks = remarks[quotationId] || "";

      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId,
          status,
          remarks: decisionRemarks,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Quotation successfully ${status}!`);
        // Clear remarks for this ID
        setRemarks(prev => {
          const updated = { ...prev };
          delete updated[quotationId];
          return updated;
        });
        fetchData();
      } else {
        toast.error(data.error || "Failed to submit decision");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error submitting decision");
    } finally {
      setActioningId(null);
    }
  };

  const handleRemarkChange = (quotationId: string, value: string) => {
    setRemarks((prev) => ({ ...prev, [quotationId]: value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100 m-6">
        <Loader2 className="size-8 animate-spin text-slate-500" />
        <p className="mt-2 text-sm text-slate-500">Loading approvals workflow...</p>
      </div>
    );
  }

  const pendingApprovals = approvalsList.filter(a => a.status === "pending");
  const completedApprovals = approvalsList.filter(a => a.status !== "pending");

  return (
    <div className="p-6 space-y-6">
      
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Procurement Approvals</h1>
        <p className="text-slate-500 text-sm">Review shortlisted supplier quotations, sign off approvals, and provide audit feedback.</p>
      </div>

      {!isManager && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2"><AlertTriangle /> Manager Access Only</CardTitle>
            <CardDescription className="text-amber-700">
              Your account role is registered as <span className="font-semibold">{user?.role}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-amber-700">
            Only users assigned the **Manager / Approver** or **Admin** roles can approve or reject procurement requests.
          </CardContent>
        </Card>
      )}

      {/* Main Grid */}
      <div className="space-y-8">
        
        {/* Pending approvals queue */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Pending Queue <Badge variant="secondary">{pendingApprovals.length}</Badge>
          </h3>
          
          {pendingApprovals.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {pendingApprovals.map((app) => {
                const quote = quotationsList.find(q => q.id === app.quotationId);
                const vendor = vendorsList.find(v => v.id === quote?.vendorId);
                const rfq = rfqsList.find(r => r.id === quote?.rfqId);

                if (!quote) return null;

                const quantity = rfq?.quantity || 0;
                const unitPrice = parseFloat(quote.unitPrice);
                const totalEstimated = quantity * unitPrice;

                return (
                  <Card key={app.id} className="border-slate-200 bg-white flex flex-col justify-between hover:shadow-md transition">
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base font-bold text-slate-900">{rfq?.title || "RFQ details missing"}</CardTitle>
                          <CardDescription className="text-xs">Supplier Company: {vendor?.name || "Unknown Vendor"}</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 font-semibold">Pending</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-4 text-sm text-slate-600">
                      
                      {/* Bid Logistics */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                          <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[9px]">Unit Bid Price</span>
                          <span className="text-sm font-bold text-slate-900">Rs. {unitPrice.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                          <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[9px]">Total Order Price</span>
                          <span className="text-sm font-bold text-slate-900">Rs. {totalEstimated.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                          <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[9px]">Delivery Timeline</span>
                          <span className="text-sm font-semibold text-slate-900">{quote.deliveryDays} Days</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                          <span className="text-slate-400 font-bold block mb-0.5 uppercase text-[9px]">Supplier Rating</span>
                          <span className="text-sm font-semibold text-slate-900 flex items-center gap-0.5">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" /> {vendor?.rating || "4.00"}
                          </span>
                        </div>
                      </div>

                      {quote.notes && (
                        <div className="rounded bg-slate-50 p-2.5 text-xs text-slate-500 italic border border-slate-100">
                          Supplier Notes: “{quote.notes}”
                        </div>
                      )}

                      {/* Decision input remarks */}
                      {isManager && (
                        <div className="space-y-1.5 pt-2">
                          <Label htmlFor={`remarks-${app.quotationId}`} className="text-xs font-semibold text-slate-700">Review Remarks / Audits</Label>
                          <div className="relative">
                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                            <Input
                              id={`remarks-${app.quotationId}`}
                              className="pl-9 text-xs bg-white"
                              placeholder="Add approval comments or rejection reasons..."
                              value={remarks[app.quotationId] || ""}
                              onChange={(e) => handleRemarkChange(app.quotationId, e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                    </CardContent>

                    <CardFooter className="border-t border-slate-100/60 pt-3 bg-slate-50/20 gap-2">
                      {isManager ? (
                        <>
                          <Button 
                            disabled={actioningId === app.quotationId} 
                            onClick={() => handleDecision(app.quotationId, "rejected")} 
                            variant="outline" 
                            className="flex-1 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            <X className="mr-1.5 size-4" /> Reject Order
                          </Button>
                          <Button 
                            disabled={actioningId === app.quotationId} 
                            onClick={() => handleDecision(app.quotationId, "approved")} 
                            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <Check className="mr-1.5 size-4" /> Approve & Sign PO
                          </Button>
                        </>
                      ) : (
                        <div className="text-center w-full text-xs text-slate-400 italic py-2">
                          Awaiting Manager Decision
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
              <ClipboardCheck className="size-12 mx-auto text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-800">Clear Approvals Queue</h3>
              <p className="text-slate-500 text-sm mt-1">No shortlisted quotations are currently waiting for approval.</p>
            </div>
          )}
        </div>

        {/* History approvals timeline */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Decision History Timeline</h3>
          {completedApprovals.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">RFQ / Subject</th>
                      <th className="p-4">Supplier</th>
                      <th className="p-4">Remarks</th>
                      <th className="p-4">Decision</th>
                      <th className="p-4">Date Decided</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {completedApprovals.map((app) => {
                      const quote = quotationsList.find(q => q.id === app.quotationId);
                      const vendor = vendorsList.find(v => v.id === quote?.vendorId);
                      const rfq = rfqsList.find(r => r.id === quote?.rfqId);

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-slate-900">{rfq?.title || "RFQ details missing"}</td>
                          <td className="p-4 font-medium text-slate-700">{vendor?.name || "Unknown Supplier"}</td>
                          <td className="p-4 italic text-slate-500">“{app.remarks || "no comments"}”</td>
                          <td className="p-4">
                            <Badge className={app.status === "approved" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}>
                              {app.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-xs text-slate-400">
                            {app.decidedAt ? new Date(app.decidedAt).toLocaleString() : "..."}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No past approval decisions recorded yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}
