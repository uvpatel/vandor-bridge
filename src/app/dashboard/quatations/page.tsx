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
  TrendingUp, 
  Loader2, 
  FileCheck, 
  ShieldAlert 
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
  const [unitPrice, setUnitPrice] = React.useState("");
  const [deliveryDays, setDeliveryDays] = React.useState("");
  const [notes, setNotes] = React.useState("");
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

  // Vendor quotation submission handler
  const handleQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor) {
      toast.error("Your email is not linked to a registered vendor profile");
      return;
    }
    if (!vendorRfqId || !unitPrice || !deliveryDays) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId: vendorRfqId,
          vendorId: currentVendor.id,
          unitPrice: parseFloat(unitPrice),
          deliveryDays: parseInt(deliveryDays),
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Quotation submitted successfully!");
        setUnitPrice("");
        setDeliveryDays("");
        setNotes("");
        setVendorRfqId("");
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
          remarks: "RFQ Shortlisted quotation submitted to Manager for final approval.",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Quotation shortlisted and submitted for Manager approval!");
        
        // Optimistically update status
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

  // --- VENDOR WORKSPACE ---
  if (isVendor) {
    const myQuotations = quotationsList.filter(q => currentVendor && q.vendorId === currentVendor.id);
    
    // Vendor is invited to any RFQ that lists them, or any active RFQ in the system for testing
    const eligibleRfqs = rfqsList.filter(r => !["converted", "approved", "closed"].includes(r.status));

    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quotation Submission</h1>
          <p className="text-slate-500 text-sm">Respond to active RFQs by inputting competitive pricing and delivery logistics.</p>
        </div>

        {!currentVendor ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800 flex items-center gap-2"><ShieldAlert /> Supplier Profile Link Required</CardTitle>
              <CardDescription className="text-amber-700">
                You are registered as a Vendor, but your user email (<span className="font-semibold">{user?.email}</span>) is not linked to any company record in our database.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-amber-700">
              Please ask a Procurement Officer to register your vendor profile with your email address, or register it yourself under the Vendor screen.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            
            {/* Submit Form */}
            <Card className="border-primary/10 shadow-sm md:col-span-1">
              <CardHeader>
                <CardTitle>Submit Bid Pricing</CardTitle>
                <CardDescription>Select an RFQ and input your quotation specifications.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleQuotationSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rfqSelect">Select RFQ *</Label>
                    <select
                      id="rfqSelect"
                      className="flex w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                      value={vendorRfqId}
                      onChange={(e) => setVendorRfqId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose invited RFQ --</option>
                      {eligibleRfqs.map((rfq) => (
                        <option key={rfq.id} value={rfq.id}>
                          {rfq.title} ({rfq.quantity} {rfq.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Unit Price (INR) *</Label>
                    <Input id="price" type="number" step="0.01" min="0.01" placeholder="45.50" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery">Delivery Timeline (Days) *</Label>
                    <Input id="delivery" type="number" min="1" placeholder="5" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes / Scope details</Label>
                    <textarea 
                      id="notes" 
                      rows={3}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                      placeholder="Pricing includes delivery to main warehouse. Standard 5-ply cartons."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                    {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Submitting...</> : <><Send className="mr-2 size-4" /> Submit Quotation</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Submitted Bids List */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-slate-800">My Submitted Quotations</h3>
              {myQuotations.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {myQuotations.map((quote) => {
                    const rfq = rfqsList.find(r => r.id === quote.rfqId);
                    return (
                      <Card key={quote.id} className="border-slate-200 bg-white">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-bold text-slate-800 leading-snug">{rfq?.title || "RFQ details missing"}</CardTitle>
                            <Badge variant={quote.status === "approved" ? "default" : quote.status === "rejected" ? "destructive" : "secondary"}>
                              {quote.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-600 space-y-2">
                          <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span>Unit Price:</span>
                            <span className="font-semibold text-slate-950">Rs. {parseFloat(quote.unitPrice).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span>Total (Est):</span>
                            <span className="font-semibold text-slate-900">
                              Rs. {((rfq?.quantity || 0) * parseFloat(quote.unitPrice)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span>Delivery Logistics:</span>
                            <span className="font-semibold text-slate-900">{quote.deliveryDays} Days</span>
                          </div>
                          {quote.notes && (
                            <p className="mt-2 text-slate-500 italic">“{quote.notes}”</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
                  <Clock className="size-10 mx-auto text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">You haven't submitted any quotations yet.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    );
  }

  // --- OFFICER / MANAGER / ADMIN WORKSPACE (Comparison Screen) ---
  const activeRfqsForCompare = rfqsList.filter(r => !["draft", "closed"].includes(r.status));
  const comparedQuotes = quotationsList.filter(q => q.rfqId === selectedRfqId);
  
  // Calculate lowest price in comparison group
  const prices = comparedQuotes.map(q => parseFloat(q.unitPrice));
  const lowestPriceVal = prices.length > 0 ? Math.min(...prices) : 0;

  const getRfqHeading = () => {
    const matched = rfqsList.find(r => r.id === selectedRfqId);
    return matched ? `${matched.title} (Quantity: ${matched.quantity} ${matched.unit})` : "Select RFQ to Compare";
  };

  return (
    <div className="p-6 space-y-6">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quotation Comparison</h1>
        <p className="text-slate-500 text-sm">Perform side-by-side analysis of bids, identify lowest unit cost, and route to approval.</p>
      </div>

      {/* Select RFQ dropdown bar */}
      <Card className="bg-white border-slate-100">
        <CardContent className="py-4 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div className="flex-1 max-w-md space-y-1">
            <Label htmlFor="compareRfqSelect">Active RFQ Group</Label>
            <select
              id="compareRfqSelect"
              className="flex w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
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
            <Badge variant="outline" className="h-fit py-1.5 px-3 bg-slate-50 border-slate-200 text-slate-700 font-medium">
              Bids Submitted: {comparedQuotes.length}
            </Badge>
          )}
        </CardContent>
      </Card>

      {selectedRfqId ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">{getRfqHeading()}</h3>
          
          {comparedQuotes.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {comparedQuotes.map((quote) => {
                const vendor = vendorsList.find(v => v.id === quote.vendorId);
                const isLowest = parseFloat(quote.unitPrice) === lowestPriceVal;

                return (
                  <Card 
                    key={quote.id} 
                    className={`transition duration-200 flex flex-col justify-between ${
                      isLowest 
                        ? "border-emerald-400 bg-emerald-50/50 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-400" 
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                            {vendor?.name || "Unknown Supplier"}
                          </CardTitle>
                          <CardDescription className="text-xs">GST: {vendor?.gstNumber}</CardDescription>
                        </div>
                        {isLowest ? (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Lowest Price</Badge>
                        ) : (
                          <Badge variant="secondary" className="capitalize">{quote.status}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 py-2 text-sm text-slate-600 border-t border-slate-100/60 pt-3">
                      <div className="flex justify-between items-baseline">
                        <span>Unit Bid Price:</span>
                        <span className="text-xl font-extrabold text-slate-900">
                          Rs. {parseFloat(quote.unitPrice).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Delivery Speed:</span>
                        <span className="font-semibold text-slate-900">{quote.deliveryDays} Days</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span>Vendor Audit Rating:</span>
                        <span className="flex items-center gap-1 font-semibold text-slate-900">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          {vendor?.rating || "4.00"}
                        </span>
                      </div>

                      {quote.notes && (
                        <div className="mt-3 rounded bg-white/60 p-2.5 text-xs border border-slate-100 italic text-slate-500">
                          “{quote.notes}”
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="border-t border-slate-100/60 pt-3 bg-slate-50/40">
                      {quote.status === "submitted" ? (
                        <Button 
                          onClick={() => handleShortlistForApproval(quote.id)}
                          disabled={actioningQuoteId === quote.id}
                          className="w-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold"
                        >
                          {actioningQuoteId === quote.id ? (
                            <><Loader2 className="mr-2 size-3 animate-spin" /> Submitting...</>
                          ) : (
                            <><FileCheck className="mr-1.5 size-3.5" /> Submit to Manager Approval</>
                          )}
                        </Button>
                      ) : (
                        <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 py-1.5">
                          <Check className="size-4 text-emerald-600" /> Shortlisted for Review
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
              <ArrowUpDown className="size-12 mx-auto text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-800">No Bids Submitted</h3>
              <p className="text-slate-500 text-sm mt-1">Vendors have not submitted bid responses for this RFQ yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
          <Building2 className="size-12 mx-auto text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">No RFQ Selected</h3>
          <p className="text-slate-500 text-sm mt-1">Select an active Request for Quotation above to compare supplier bid documents.</p>
        </div>
      )}
    </div>
  );
}
