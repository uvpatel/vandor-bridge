"use client";

import * as React from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileCheck2, 
  Plus, 
  Printer, 
  Send, 
  Download, 
  Building2, 
  FileText, 
  DollarSign,
  Loader2,
  ChevronRight,
  Receipt
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  unitPrice: string;
  status: string;
}

interface Vendor {
  id: string;
  name: string;
  gstNumber: string;
  contactEmail: string;
}

interface RFQ {
  id: string;
  title: string;
  quantity: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  quotationId: string;
  status: "issued" | "sent" | "cancelled";
  subtotal: string;
  taxAmount: string;
  total: string;
  issuedAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  purchaseOrderId: string;
  status: "draft" | "issued" | "sent" | "paid";
  subtotal: string;
  taxAmount: string;
  total: string;
  emailedAt: string | null;
  printedAt: string | null;
  createdAt: string;
}

export default function InvoicesPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const canGenerate = user?.role === "procurement_officer" || user?.role === "admin";

  const [poList, setPoList] = React.useState<PurchaseOrder[]>([]);
  const [invoiceList, setInvoiceList] = React.useState<Invoice[]>([]);
  const [approvedQuotes, setApprovedQuotes] = React.useState<Quotation[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [rfqs, setRfqs] = React.useState<RFQ[]>([]);
  
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("pos");

  // Selection state for generation
  const [selectedQuoteId, setSelectedQuoteId] = React.useState("");
  const [selectedPoId, setSelectedPoId] = React.useState("");
  const [generatingPo, setGeneratingPo] = React.useState(false);
  const [generatingInv, setGeneratingInv] = React.useState(false);

  // Active document preview state
  const [viewInvoice, setViewInvoice] = React.useState<Invoice | null>(null);
  const [actioningDocId, setActioningDocId] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [poRes, invRes, qRes, vRes, rfqRes] = await Promise.all([
        fetch("/api/purchase-orders"),
        fetch("/api/invoices"),
        fetch("/api/quotations"),
        fetch("/api/vendors"),
        fetch("/api/rfqs"),
      ]);

      if (poRes.ok && invRes.ok && qRes.ok && vRes.ok && rfqRes.ok) {
        const poData = await poRes.json();
        const invData = await invRes.json();
        const qData = await qRes.json();
        const vData = await vRes.json();
        const rfqData = await rfqRes.json();

        setPoList(poData.purchaseOrders || []);
        setInvoiceList(invData.invoices || []);
        setVendors(vData.vendors || []);
        setRfqs(rfqData.rfqs || []);

        // Filter approved quotations that do NOT have a PO yet
        const posQuoteIds = (poData.purchaseOrders || []).map((po: PurchaseOrder) => po.quotationId);
        const approved = (qData.quotations || []).filter(
          (q: Quotation) => q.status === "approved" && !posQuoteIds.includes(q.id)
        );
        setApprovedQuotes(approved);
      } else {
        toast.error("Failed to load documents workspace");
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

  // Convert Approved Quotation -> PO
  const handleGeneratePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteId) return;

    try {
      setGeneratingPo(true);
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId: selectedQuoteId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Purchase Order generated successfully!`);
        setSelectedQuoteId("");
        fetchData();
      } else {
        toast.error(data.error || "Failed to generate PO");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error generating Purchase Order");
    } finally {
      setGeneratingPo(false);
    }
  };

  // Convert PO -> Invoice
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) return;

    try {
      setGeneratingInv(true);
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseOrderId: selectedPoId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Invoice generated successfully!`);
        setSelectedPoId("");
        fetchData();
      } else {
        toast.error(data.error || "Failed to generate invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error generating invoice");
    } finally {
      setGeneratingInv(false);
    }
  };

  // Email invoice
  const handleEmailInvoice = async (invoiceId: string) => {
    try {
      setActioningDocId(invoiceId);
      const res = await fetch(`/api/invoices/${invoiceId}/email`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Invoice successfully emailed to vendor contact!");
        fetchData();
        if (viewInvoice && viewInvoice.id === invoiceId) {
          setViewInvoice({ ...viewInvoice, status: "sent" });
        }
      } else {
        toast.error(data.error || "Failed to email invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error emailing invoice");
    } finally {
      setActioningDocId(null);
    }
  };

  // Print invoice
  const handlePrintInvoice = async (invoiceId: string) => {
    try {
      setActioningDocId(invoiceId);
      // Trigger print API
      await fetch(`/api/invoices/${invoiceId}/print`, {
        method: "POST",
      });
      toast.info("Opening system print dialog...");
      fetchData();
      window.print();
    } catch (err) {
      console.error(err);
      toast.error("Error opening print dialog");
    } finally {
      setActioningDocId(null);
    }
  };

  // Download mock PDF
  const handleDownloadPDF = (invoice: Invoice) => {
    const rfqTitle = getInvoiceRfqTitle(invoice);
    const vendorName = getInvoiceVendorName(invoice);
    const invoiceContent = `
=============================================
             VENDORBRIDGE ERP INVOICE
=============================================
Invoice Number: ${invoice.invoiceNumber}
Date Generated: ${new Date(invoice.createdAt).toLocaleDateString()}
Vendor Company: ${vendorName}
Project/RFQ:    ${rfqTitle}

Billing Breakdown:
---------------------------------------------
Subtotal:       Rs. ${parseFloat(invoice.subtotal).toLocaleString()}
GST (18%):      Rs. ${parseFloat(invoice.taxAmount).toLocaleString()}
---------------------------------------------
GRAND TOTAL:    Rs. ${parseFloat(invoice.total).toLocaleString()}
=============================================
Thank you for your business.
    `;

    const blob = new Blob([invoiceContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice document downloaded successfully!");
  };

  const getInvoiceRfqTitle = (invoice: Invoice) => {
    const po = poList.find(p => p.id === invoice.purchaseOrderId);
    const quote = approvedQuotes.find(q => q.id === po?.quotationId) || { rfqId: "" };
    const rfq = rfqs.find(r => r.id === quote.rfqId);
    return rfq?.title || "Product logistics";
  };

  const getInvoiceVendorName = (invoice: Invoice) => {
    const po = poList.find(p => p.id === invoice.purchaseOrderId);
    const quote = approvedQuotes.find(q => q.id === po?.quotationId) || { vendorId: "" };
    const vendor = vendors.find(v => v.id === quote.vendorId);
    return vendor?.name || "Orion Supplies";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100 m-6">
        <Loader2 className="size-8 animate-spin text-slate-500" />
        <p className="mt-2 text-sm text-slate-500">Loading documents workspace...</p>
      </div>
    );
  }

  // Filter POs that do NOT have an invoice yet
  const invoicedPoIds = invoiceList.map(inv => inv.purchaseOrderId);
  const eligiblePosForInvoice = poList.filter(po => !invoicedPoIds.includes(po.id));

  return (
    <div className="p-6 space-y-6">
      
      {/* Print Hide Utilities */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible;
          }
          #print-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Header section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Purchase Orders & Invoices</h1>
        <p className="text-slate-500 text-sm">Issue PO contracts, convert approvals, compile invoices, and process delivery receipts.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        
        {/* Document Actions Form Column */}
        <div className="lg:col-span-1 space-y-6">
          {canGenerate && (
            <>
              {/* Generate PO from approved Quotation */}
              <Card className="border-primary/10 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold">Issue Purchase Order</CardTitle>
                  <CardDescription className="text-xs">Select approved quotation to generate binding contract.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGeneratePO} className="space-y-3">
                    <select
                      className="flex w-full rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                      value={selectedQuoteId}
                      onChange={(e) => setSelectedQuoteId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Approved Bid --</option>
                      {approvedQuotes.map((q) => {
                        const vendor = vendors.find(v => v.id === q.vendorId);
                        const rfq = rfqs.find(r => r.id === q.rfqId);
                        return (
                          <option key={q.id} value={q.id}>
                            {vendor?.name} - {rfq?.title}
                          </option>
                        );
                      })}
                    </select>
                    <Button 
                      type="submit" 
                      disabled={generatingPo || !selectedQuoteId} 
                      className="w-full text-xs bg-slate-950 hover:bg-slate-800 text-white"
                    >
                      {generatingPo ? <Loader2 className="size-3 animate-spin mr-1" /> : <Plus className="size-3.5 mr-1" />}
                      Generate PO Number
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Generate Invoice from PO */}
              <Card className="border-primary/10 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold">Compile Invoice</CardTitle>
                  <CardDescription className="text-xs">Select issued Purchase Order to compile invoice document.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerateInvoice} className="space-y-3">
                    <select
                      className="flex w-full rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                      value={selectedPoId}
                      onChange={(e) => setSelectedPoId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Purchase Order --</option>
                      {eligiblePosForInvoice.map((po) => (
                        <option key={po.id} value={po.id}>
                          {po.poNumber} (Total: Rs. {parseFloat(po.total).toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <Button 
                      type="submit" 
                      disabled={generatingInv || !selectedPoId} 
                      className="w-full text-xs bg-slate-950 hover:bg-slate-800 text-white"
                    >
                      {generatingInv ? <Loader2 className="size-3 animate-spin mr-1" /> : <Plus className="size-3.5 mr-1" />}
                      Generate Invoice Number
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {/* Quick Stats */}
          <Card className="bg-slate-50 border-slate-100">
            <CardContent className="pt-4 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tax Allocation Rate:</span>
                <span className="font-bold text-slate-800">18.00% GST</span>
              </div>
              <div className="flex justify-between">
                <span>Pending PO Billings:</span>
                <span className="font-bold text-slate-800">{eligiblePosForInvoice.length} Orders</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents Lists Column */}
        <div className="lg:col-span-3 space-y-6">
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100 p-1 border border-slate-200 rounded-lg">
              <TabsTrigger value="pos" className="rounded-md">Purchase Orders</TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-md">Invoices Database</TabsTrigger>
            </TabsList>

            {/* Purchase Orders tab */}
            <TabsContent value="pos" className="mt-4">
              {poList.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">PO Number</th>
                          <th className="p-4">Subtotal</th>
                          <th className="p-4">Tax (GST)</th>
                          <th className="p-4">Grand Total</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Date Issued</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                        {poList.map((po) => (
                          <tr key={po.id} className="hover:bg-slate-50/50">
                            <td className="p-4 font-bold text-slate-900 flex items-center gap-1.5">
                              <Receipt className="size-4 text-slate-400" /> {po.poNumber}
                            </td>
                            <td className="p-4">Rs. {parseFloat(po.subtotal).toLocaleString()}</td>
                            <td className="p-4 text-xs text-slate-400">Rs. {parseFloat(po.taxAmount).toLocaleString()}</td>
                            <td className="p-4 font-semibold text-slate-900">Rs. {parseFloat(po.total).toLocaleString()}</td>
                            <td className="p-4">
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline">{po.status}</Badge>
                            </td>
                            <td className="p-4 text-xs text-slate-400">{new Date(po.issuedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
                  <FileCheck2 className="size-12 mx-auto text-slate-300" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-800">No Purchase Orders Issued</h3>
                  <p className="text-slate-500 text-sm mt-1">Convert approved vendor bids to PO contracts to list them here.</p>
                </div>
              )}
            </TabsContent>

            {/* Invoices tab */}
            <TabsContent value="invoices" className="mt-4">
              {invoiceList.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Invoice Number</th>
                          <th className="p-4">Company & Item</th>
                          <th className="p-4">Total Amount</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Audit Logs</th>
                          <th className="p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                        {invoiceList.map((inv) => {
                          const rfqTitle = getInvoiceRfqTitle(inv);
                          const vendorName = getInvoiceVendorName(inv);
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-900 flex items-center gap-1.5">
                                <FileText className="size-4 text-slate-400" /> {inv.invoiceNumber}
                              </td>
                              <td className="p-4">
                                <p className="font-semibold text-slate-800 leading-tight">{vendorName}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{rfqTitle}</p>
                              </td>
                              <td className="p-4 font-semibold text-slate-950">Rs. {parseFloat(inv.total).toLocaleString()}</td>
                              <td className="p-4">
                                <Badge variant={inv.status === "sent" ? "default" : "secondary"}>
                                  {inv.status}
                                </Badge>
                              </td>
                              <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                                {inv.emailedAt && <p className="text-emerald-600">Emailed: {new Date(inv.emailedAt).toLocaleDateString()}</p>}
                                {inv.printedAt && <p className="text-blue-600">Printed: {new Date(inv.printedAt).toLocaleDateString()}</p>}
                                {!inv.emailedAt && !inv.printedAt && <p className="italic">no actions</p>}
                              </td>
                              <td className="p-4">
                                <div className="flex gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => handlePrintInvoice(inv.id)} 
                                    disabled={actioningDocId === inv.id}
                                    title="Print Invoice"
                                  >
                                    <Printer className="size-3.5" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => handleEmailInvoice(inv.id)} 
                                    disabled={actioningDocId === inv.id}
                                    title="Email Invoice"
                                  >
                                    {actioningDocId === inv.id ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3.5" />}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => handleDownloadPDF(inv)}
                                    title="Download Document"
                                  >
                                    <Download className="size-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    className="text-xs text-slate-500 font-semibold flex items-center px-1"
                                    onClick={() => setViewInvoice(inv)}
                                  >
                                    View <ChevronRight className="size-3 ml-0.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
                  <FileText className="size-12 mx-auto text-slate-300" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-800">No Invoices Compiled</h3>
                  <p className="text-slate-500 text-sm mt-1">Select an active PO contract above and generate a billing invoice.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

        </div>

      </div>

      {/* Invoice Viewer Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl bg-white border-slate-200 shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <CardHeader className="border-b border-slate-100 flex flex-row justify-between items-center bg-slate-50/50 rounded-t-xl">
              <div>
                <CardTitle className="text-lg font-bold">Document Preview</CardTitle>
                <CardDescription>Verify invoice line details and tax allocations.</CardDescription>
              </div>
              <Button variant="ghost" className="text-slate-500 font-bold" onClick={() => setViewInvoice(null)}>Close View</Button>
            </CardHeader>

            {/* Print Area content */}
            <CardContent id="print-invoice-area" className="flex-1 overflow-y-auto p-8 space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
              
              {/* Header Letterhead */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded bg-slate-950 text-white">
                      <Building2 className="size-4" />
                    </div>
                    <span className="text-lg font-bold text-slate-950">VendorBridge ERP</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Procurement Billing Services</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-600 text-white select-none capitalize mb-1">{viewInvoice.status}</Badge>
                  <p className="text-sm font-bold text-slate-900 font-mono">{viewInvoice.invoiceNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Date: {new Date(viewInvoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Vendor Info Section */}
              <div className="grid gap-6 sm:grid-cols-2 text-xs">
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Supplier Company</Label>
                  <p className="font-bold text-slate-800 text-sm">{getInvoiceVendorName(viewInvoice)}</p>
                  <p className="text-slate-500 mt-1">GST Tax ID: {vendors.find(v => v.name === getInvoiceVendorName(viewInvoice))?.gstNumber || "Tax ID Details"}</p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Billing Reference</Label>
                  <p className="font-semibold text-slate-800 text-sm">Purchase Order: {poList.find(p => p.id === viewInvoice.purchaseOrderId)?.poNumber || "PO Ref"}</p>
                  <p className="text-slate-500 mt-1">RFQ Topic: {getInvoiceRfqTitle(viewInvoice)}</p>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="border border-slate-100 rounded-lg overflow-hidden mt-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-500 uppercase">
                      <th className="p-3">Line Item Description</th>
                      <th className="p-3 text-right">Tax Class</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600">
                    <tr>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{getInvoiceRfqTitle(viewInvoice)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Procurement supply bid contract</p>
                      </td>
                      <td className="p-3 text-right text-slate-500">18.00% GST</td>
                      <td className="p-3 text-right font-semibold text-slate-900">Rs. {parseFloat(viewInvoice.subtotal).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Billing Totals */}
              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-semibold text-slate-900">Rs. {parseFloat(viewInvoice.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Taxes (GST 18.00%):</span>
                    <span className="font-semibold text-slate-900">Rs. {parseFloat(viewInvoice.taxAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-sm font-bold text-slate-800">Grand Total:</span>
                    <span className="text-lg font-black text-slate-950">Rs. {parseFloat(viewInvoice.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </CardContent>

            {/* Modal Actions */}
            <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4 justify-end gap-2 rounded-b-xl">
              <Button variant="outline" size="sm" onClick={() => handlePrintInvoice(viewInvoice.id)}>
                <Printer className="size-3.5 mr-1" /> Print Layout
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleEmailInvoice(viewInvoice.id)} disabled={actioningDocId === viewInvoice.id}>
                {actioningDocId === viewInvoice.id ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Send className="size-3.5 mr-1" />}
                Email to Supplier
              </Button>
              <Button size="sm" className="bg-slate-950 text-white hover:bg-slate-800" onClick={() => handleDownloadPDF(viewInvoice)}>
                <Download className="size-3.5 mr-1" /> Download Invoice
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

    </div>
  );
}
