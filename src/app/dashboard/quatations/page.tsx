"use client";

import * as React from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpDown, 
  Check, 
  Send, 
  Building2, 
  Calendar, 
  Clock, 
  Star, 
  Loader2, 
  FileCheck, 
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  name: string;
  category: string;
  gstNumber: string;
  contactEmail: string;
  rating: string;
}

interface RFQ {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  deadline: string;
  status: string;
}

interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  unitPrice: string;
  taxRate: string;
  deliveryDays: number;
  notes: string | null;
  status: "draft" | "submitted" | "shortlisted" | "approved" | "rejected";
  submittedAt: string;
}

interface LineItem {
  item: string;
  qty: number;
  unit: string;
}

interface QuoteLineInput {
  item: string;
  qty: number;
  unitPrice: number;
  deliveryDays: number;
}

function getRfqLineItems(rfq: RFQ): LineItem[] {
  try {
    const parsed = JSON.parse(rfq.description);
    if (parsed && Array.isArray(parsed.lineItems)) {
      return parsed.lineItems;
    }
  } catch (e) {}
  return [{ item: rfq.title, qty: rfq.quantity, unit: rfq.unit }];
}

function parseQuotationDetails(quote: Quotation, rfq: RFQ | undefined) {
  try {
    const parsed = JSON.parse(quote.notes || "");
    if (parsed && Array.isArray(parsed.lineItems)) {
      const lineItems = parsed.lineItems as { item: string; qty: number; unitPrice: number; deliveryDays: number }[];
      const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
      const gst = subtotal * 0.18;
      const grandTotal = subtotal + gst;
      const maxDelivery = Math.max(...lineItems.map(item => item.deliveryDays), quote.deliveryDays);
      return {
        lineItems,
        subtotal,
        gst,
        grandTotal,
        deliveryDays: maxDelivery,
        paymentTerms: parsed.paymentTerms || "Standard terms",
      };
    }
  } catch (e) {}
  
  const qty = rfq?.quantity || 1;
  const subtotal = qty * parseFloat(quote.unitPrice);
  const gst = subtotal * parseFloat(quote.taxRate || "18.00") / 100;
  const grandTotal = subtotal + gst;
  return {
    lineItems: [{ item: rfq?.title || "Item", qty, unitPrice: parseFloat(quote.unitPrice), deliveryDays: quote.deliveryDays }],
    subtotal,
    gst,
    grandTotal,
    deliveryDays: quote.deliveryDays,
    paymentTerms: quote.notes || "Standard 30 days",
  };
}

export default function QuotationsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const isVendor = user?.role === "vendor";

  const [vendorsList, setVendorsList] = React.useState<Vendor[]>([]);
  const [rfqsList, setRfqsList] = React.useState<RFQ[]>([]);
  const [quotationsList, setQuotationsList] = React.useState<Quotation[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Vendor state
  const [currentVendor, setCurrentVendor] = React.useState<Vendor | null>(null);
  const [vendorRfqId, setVendorRfqId] = React.useState("");
  
  // Multi-item quotation inputs (Screen 6)
  const [quoteLineInputs, setQuoteLineInputs] = React.useState<QuoteLineInput[]>([]);
  const [taxRate, setTaxRate] = React.useState(18);
  const [paymentTerms, setPaymentTerms] = React.useState("Payment terms: 20 days net...");
  const [submitting, setSubmitting] = React.useState(false);

  // Officer state
  const [selectedRfqId, setSelectedRfqId] = React.useState("");
  const [actioningQuoteId, setActioningQuoteId] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [vRes, rfqRes, qRes] = await Promise.all([
        fetch("/api/vendors"),
        fetch("/api/rfqs"),
        fetch("/api/quotations"),
      ]);

      if (vRes.ok && rfqRes.ok && qRes.ok) {
        const vData = await vRes.json();
        const rfqData = await rfqRes.json();
        const qData = await qRes.json();

        setVendorsList(vData.vendors || []);
        setRfqsList(rfqData.rfqs || []);
        setQuotationsList(qData.quotations || []);

        // Resolve vendor
        if (isVendor && user) {
          const matched = (vData.vendors || []).find((v: Vendor) => v.contactEmail === user.email);
          if (matched) {
            setCurrentVendor(matched);
          }
        }
      } else {
        toast.error("Failed to load quotations data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error loading page data");
    } finally {
      setLoading(false);
    }
  }, [isVendor, user]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When selected RFQ in vendor form changes, prepopulate line item pricing inputs
  React.useEffect(() => {
    if (!vendorRfqId) {
      setQuoteLineInputs([]);
      return;
    }
    const rfq = rfqsList.find(r => r.id === vendorRfqId);
    if (rfq) {
      const items = getRfqLineItems(rfq);
      setQuoteLineInputs(items.map(item => ({
        item: item.item,
        qty: item.qty,
        unitPrice: 0,
        deliveryDays: 7,
      })));
    }
  }, [vendorRfqId, rfqsList]);

  const handleLinePriceChange = (index: number, field: "unitPrice" | "deliveryDays", value: any) => {
    const updated = [...quoteLineInputs];
    if (field === "unitPrice") {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = parseInt(value) || 0;
    }
    setQuoteLineInputs(updated);
  };

  // Calculations for Screen 6 Submission
  const calculatedSubtotal = quoteLineInputs.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const calculatedGst = calculatedSubtotal * (taxRate / 100);
  const calculatedGrandTotal = calculatedSubtotal + calculatedGst;

  // Vendor quotation submission handler
  const handleQuotationSubmit = async (e: React.FormEvent, status: "draft" | "submitted" = "submitted") => {
    e.preventDefault();
    if (!currentVendor) {
      toast.error("Your email is not linked to a registered vendor profile");
      return;
    }
    if (!vendorRfqId || quoteLineInputs.length === 0) {
      toast.error("Please fill all required fields");
      return;
    }

    // Packing line item bids + terms inside notes JSON
    const packedNotes = JSON.stringify({
      lineItems: quoteLineInputs,
      paymentTerms,
    });

    const averageUnitPrice = calculatedSubtotal / (quoteLineInputs.reduce((sum, item) => sum + item.qty, 0) || 1);
    const maxDeliveryDays = Math.max(...quoteLineInputs.map(item => item.deliveryDays), 1);

    try {
      setSubmitting(true);
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId: vendorRfqId,
          vendorId: currentVendor.id,
          unitPrice: averageUnitPrice,
          deliveryDays: maxDeliveryDays,
          notes: packedNotes,
          status,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(status === "draft" ? "Draft saved successfully!" : "Quotation submitted successfully!");
        setVendorRfqId("");
        setQuoteLineInputs([]);
        fetchData();
      } else {
        toast.error(data.error || "Failed to submit quotation");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error submitting quotation");
    } finally {
      setSubmitting(false);
    }
  };

  // Officer submission for approval handler
  const handleShortlistForApproval = async (quotationId: string) => {
    try {
      setActioningQuoteId(quotationId);
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId,
          status: "pending",
          remarks: "Quotation selected. RFQ Shortlisted and routed to Manager for final approval.",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Quotation selected! Routed to approvals workflow.");
        setQuotationsList(prev => prev.map(q => q.id === quotationId ? { ...q, status: "shortlisted" } : q));
        fetchData();
      } else {
        toast.error(data.error || "Failed to submit approval request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error submitting approval request");
    } finally {
      setActioningQuoteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100 m-6">
        <Loader2 className="size-8 animate-spin text-slate-500" />
        <p className="mt-2 text-sm text-slate-500">Loading quotations workspace...</p>
      </div>
    );
  }

  // --- VENDOR WORKSPACE (Screen 6 Submission) ---
  if (isVendor) {
    const myQuotations = quotationsList.filter(q => currentVendor && q.vendorId === currentVendor.id);
    const eligibleRfqs = rfqsList.filter(r => !["draft", "converted", "approved", "closed"].includes(r.status));

    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Quotation Submission</h1>
          <p className="text-slate-500 text-sm">Respond to active RFQs by inputting competitive pricing and delivery logistics.</p>
        </div>

        {!currentVendor ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800 flex items-center gap-2"><ShieldAlert /> Supplier Profile Link Required</CardTitle>
              <CardDescription className="text-amber-700">
                Your email (<span className="font-semibold">{user?.email}</span>) is not linked to any registered vendor company in our database.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-amber-700">
              Please register your company under the Vendors screen.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-indigo-100 shadow-md">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Submit Quotations</CardTitle>
                {vendorRfqId ? (
                  <CardDescription className="text-indigo-600 font-medium">
                    RFQ: {rfqsList.find(r => r.id === vendorRfqId)?.title}
                  </CardDescription>
                ) : (
                  <CardDescription>Select an active RFQ to see lines and provide quotation details.</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={(e) => handleQuotationSubmit(e)} className="space-y-6">
                  {/* Select RFQ */}
                  <div className="max-w-md space-y-2">
                    <Label htmlFor="rfqSelect" className="font-semibold text-slate-800">Select RFQ *</Label>
                    <select
                      id="rfqSelect"
                      className="flex w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={vendorRfqId}
                      onChange={(e) => setVendorRfqId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose active RFQ to bid --</option>
                      {eligibleRfqs.map((rfq) => (
                        <option key={rfq.id} value={rfq.id}>
                          {rfq.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {vendorRfqId && (
                    <>
                      {/* RFQ Summary Box */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700">
                        <p className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-1">RFQ Summary</p>
                        <p className="font-medium text-slate-800">
                          {quoteLineInputs.map(item => `${item.item} * ${item.qty}`).join(", ")}
                        </p>
                      </div>

                      {/* Items pricing table matching Screen 6 mockup */}
                      <div className="space-y-3">
                        <Label className="font-semibold text-slate-800 text-sm">Your Quotation</Label>
                        <div className="overflow-hidden rounded-xl border border-slate-200">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="p-3">Item</th>
                                <th className="p-3 w-24">Qty</th>
                                <th className="p-3 w-40">Unit price</th>
                                <th className="p-3 w-40">Total</th>
                                <th className="p-3 w-40">Delivery (days)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {quoteLineInputs.map((line, index) => (
                                <tr key={index}>
                                  <td className="p-3 font-semibold">{line.item}</td>
                                  <td className="p-3">{line.qty}</td>
                                  <td className="p-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      placeholder="0.00"
                                      value={line.unitPrice || ""}
                                      onChange={(e) => handleLinePriceChange(index, "unitPrice", e.target.value)}
                                      required
                                    />
                                  </td>
                                  <td className="p-3 font-mono font-bold text-slate-900">
                                    Rs. {(line.qty * line.unitPrice).toLocaleString()}
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={line.deliveryDays}
                                      onChange={(e) => handleLinePriceChange(index, "deliveryDays", e.target.value)}
                                      required
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Notes/Terms, Tax Rates and Totals Summary Grid */}
                      <div className="grid gap-6 md:grid-cols-2 pt-2">
                        {/* Note / terms & Tax */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="taxRate">tax / GST %</Label>
                            <Input
                              id="taxRate"
                              type="number"
                              min="0"
                              max="100"
                              value={taxRate}
                              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="paymentTerms">Note / terms</Label>
                            <textarea
                              id="paymentTerms"
                              rows={3}
                              className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                              placeholder="Payment terms..."
                              value={paymentTerms}
                              onChange={(e) => setPaymentTerms(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Totals card */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-sm text-slate-600 space-y-3.5 h-fit">
                          <div className="flex justify-between font-medium">
                            <span>Subtotal</span>
                            <span className="text-slate-900 font-mono">Rs. {calculatedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>GST ({taxRate}%)</span>
                            <span className="text-slate-900 font-mono">Rs. {calculatedGst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="border-t border-slate-200 pt-3 flex justify-between font-extrabold text-base text-slate-900">
                            <span>Grand total</span>
                            <span className="text-indigo-600 font-mono">Rs. {calculatedGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Buttons */}
                      <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(e) => handleQuotationSubmit(e, "draft")}
                          disabled={submitting}
                        >
                          Save Draft
                        </Button>
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-100"
                        >
                          {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                          Submit Quotation
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Submitted bids dashboard logs */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">My Submitted Quotations</h3>
              {myQuotations.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {myQuotations.map((quote) => {
                    const rfq = rfqsList.find(r => r.id === quote.rfqId);
                    const details = parseQuotationDetails(quote, rfq);
                    return (
                      <Card key={quote.id} className="border-slate-200 shadow-sm bg-white hover:shadow-md transition">
                        <CardHeader className="pb-2 border-b border-slate-50 bg-slate-50/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-sm font-bold text-slate-800 leading-snug">{rfq?.title || "RFQ details missing"}</CardTitle>
                              <CardDescription className="text-[10px] mt-0.5 font-mono">{quote.id}</CardDescription>
                            </div>
                            <Badge variant={quote.status === "approved" ? "default" : quote.status === "rejected" ? "destructive" : "secondary"}>
                              {quote.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-600 space-y-2.5 pt-4">
                          <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span>Subtotal:</span>
                            <span className="font-semibold text-slate-800">Rs. {details.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span>GST (18%):</span>
                            <span className="font-semibold text-slate-800">Rs. {details.gst.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50 pb-1 font-bold text-slate-900">
                            <span>Grand Total:</span>
                            <span className="text-indigo-600">Rs. {details.grandTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span>Max Delivery Timeline:</span>
                            <span className="font-semibold text-slate-800">{details.deliveryDays} Days</span>
                          </div>
                          {details.paymentTerms && (
                            <p className="mt-2 text-slate-500 italic text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                              “{details.paymentTerms}”
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
                  <Clock className="size-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">You haven't submitted any quotations yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- OFFICER / MANAGER / ADMIN WORKSPACE (Screen 7 Comparison Screen) ---
  const activeRfqsForCompare = rfqsList.filter(r => !["draft", "closed"].includes(r.status));
  const comparedQuotes = quotationsList.filter(q => q.rfqId === selectedRfqId);
  const selectedRfq = rfqsList.find(r => r.id === selectedRfqId);
  
  // Calculate details for each quote, identify lowest grand total
  const quotesWithDetails = comparedQuotes.map(q => {
    const details = parseQuotationDetails(q, selectedRfq);
    return {
      quote: q,
      details,
    };
  });

  const lowestGrandTotal = quotesWithDetails.length > 0
    ? Math.min(...quotesWithDetails.map(q => q.details.grandTotal))
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Quotation Comparison</h1>
        <p className="text-slate-500 text-sm mt-1">Compare prices, delivery logs, ratings. Selecting initiates approvals workflow.</p>
      </div>

      {/* Select RFQ bar */}
      <Card className="bg-white border-slate-200/80 shadow-sm">
        <CardContent className="py-4 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div className="flex-1 max-w-md space-y-1.5">
            <Label htmlFor="compareRfqSelect" className="font-semibold text-slate-800">Active RFQ Group</Label>
            <select
              id="compareRfqSelect"
              className="flex w-full rounded-md border border-slate-200 bg-white p-2.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedRfqId}
              onChange={(e) => setSelectedRfqId(e.target.value)}
            >
              <option value="">-- Choose RFQ to compare bids --</option>
              {activeRfqsForCompare.map((rfq) => (
                <option key={rfq.id} value={rfq.id}>
                  {rfq.title} ({rfq.status})
                </option>
              ))}
            </select>
          </div>
          {selectedRfqId && (
            <Badge variant="secondary" className="h-fit py-1.5 px-3 bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
              Quotations Received: {comparedQuotes.length}
            </Badge>
          )}
        </CardContent>
      </Card>

      {selectedRfqId ? (
        <div className="space-y-4">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-slate-900">Quotation Comparison</h3>
            <p className="text-xs text-slate-500 mt-0.5">RFQ: {selectedRfq?.title} — {comparedQuotes.length} quotations received</p>
          </div>
          
          {quotesWithDetails.length > 0 ? (
            <div className="space-y-6">
              {/* Matrix Layout matching Screen 7 exactly */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-800">
                        <th className="p-4 font-bold text-slate-900 w-48 border-r border-slate-100">Criteria</th>
                        {quotesWithDetails.map((qd) => {
                          const vendor = vendorsList.find(v => v.id === qd.quote.vendorId);
                          const isLowest = qd.details.grandTotal === lowestGrandTotal;
                          return (
                            <th
                              key={qd.quote.id}
                              className={`p-4 font-bold border-r border-slate-100 text-center transition ${
                                isLowest ? "bg-emerald-50 text-emerald-800" : "text-slate-800"
                              }`}
                            >
                              {vendor?.name} {isLowest && <span className="text-[10px] bg-emerald-600 text-white font-semibold px-1.5 py-0.5 rounded-full ml-1 select-none">Lowest</span>}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {/* Grand Total */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold border-r border-slate-100">Grand Total</td>
                        {quotesWithDetails.map((qd) => {
                          const isLowest = qd.details.grandTotal === lowestGrandTotal;
                          return (
                            <td
                              key={qd.quote.id}
                              className={`p-4 text-center font-mono font-extrabold text-sm border-r border-slate-100 ${
                                isLowest ? "bg-emerald-50/50 text-emerald-700" : "text-slate-900"
                              }`}
                            >
                              Rs. {qd.details.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          );
                        })}
                      </tr>

                      {/* GST % */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-4 font-semibold border-r border-slate-100 text-slate-500">GST %</td>
                        {quotesWithDetails.map((qd) => {
                          const isLowest = qd.details.grandTotal === lowestGrandTotal;
                          return (
                            <td
                              key={qd.quote.id}
                              className={`p-4 text-center border-r border-slate-100 ${
                                isLowest ? "bg-emerald-50/30" : ""
                              }`}
                            >
                              18%
                            </td>
                          );
                        })}
                      </tr>

                      {/* Delivery (days) */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-4 font-semibold border-r border-slate-100 text-slate-500">Delivery (days)</td>
                        {quotesWithDetails.map((qd) => {
                          const isLowest = qd.details.grandTotal === lowestGrandTotal;
                          return (
                            <td
                              key={qd.quote.id}
                              className={`p-4 text-center font-medium border-r border-slate-100 ${
                                isLowest ? "bg-emerald-50/30" : ""
                              }`}
                            >
                              {qd.details.deliveryDays} days
                            </td>
                          );
                        })}
                      </tr>

                      {/* Vendor rating */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-4 font-semibold border-r border-slate-100 text-slate-500">Vendor rating</td>
                        {quotesWithDetails.map((qd) => {
                          const vendor = vendorsList.find(v => v.id === qd.quote.vendorId);
                          const isLowest = qd.details.grandTotal === lowestGrandTotal;
                          return (
                            <td
                              key={qd.quote.id}
                              className={`p-4 text-center font-medium border-r border-slate-100 ${
                                isLowest ? "bg-emerald-50/30" : ""
                              }`}
                            >
                              <span className="inline-flex items-center gap-1">
                                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                {vendor?.rating || "4.0"}/5
                              </span>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Payment terms */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-4 font-semibold border-r border-slate-100 text-slate-500">Payment terms</td>
                        {quotesWithDetails.map((qd) => {
                          const isLowest = qd.details.grandTotal === lowestGrandTotal;
                          return (
                            <td
                              key={qd.quote.id}
                              className={`p-4 text-center text-xs italic text-slate-500 border-r border-slate-100 max-w-xs ${
                                isLowest ? "bg-emerald-50/30" : ""
                              }`}
                            >
                              {qd.details.paymentTerms}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Selection Actions row */}
                      <tr className="bg-slate-50/50">
                        <td className="p-4 font-bold border-r border-slate-100">Actions</td>
                        {quotesWithDetails.map((qd) => {
                          const isLowest = qd.details.grandTotal === lowestGrandTotal;
                          const showButton = qd.quote.status === "submitted";
                          return (
                            <td
                              key={qd.quote.id}
                              className={`p-4 text-center border-r border-slate-100 ${
                                isLowest ? "bg-emerald-50/40" : ""
                              }`}
                            >
                              {showButton ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleShortlistForApproval(qd.quote.id)}
                                  disabled={actioningQuoteId === qd.quote.id}
                                  className={
                                    isLowest
                                      ? "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm"
                                      : "bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                                  }
                                >
                                  {actioningQuoteId === qd.quote.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    isLowest ? "Select & Approve" : "Select"
                                  )}
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                                  <Check className="size-3.5" /> Routed to Approvals
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-rose-500 font-medium">* Green = lowest price, selecting vendor initiates the approval workflow.</p>
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
              <ArrowUpDown className="size-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No quotation bids submitted yet for this RFQ.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
          <Building2 className="size-12 mx-auto text-slate-300 mb-2" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">No RFQ Selected</h3>
          <p className="text-slate-500 text-sm mt-1">Select an active Request for Quotation above to compare vendor bid details.</p>
        </div>
      )}
    </div>
  );
}
