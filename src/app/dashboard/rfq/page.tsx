"use client";

import * as React from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Calendar,
  Loader2,
  FileMinus,
  ArrowRight,
  ArrowLeft,
  X,
  Upload,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  name: string;
  category: string;
  gstNumber: string;
  contactName: string;
}

interface RFQ {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  deadline: string;
  status: "draft" | "invited" | "receiving_quotes" | "comparison" | "approval" | "approved" | "rejected" | "converted" | "closed";
  createdAt: string;
}

interface LineItem {
  item: string;
  qty: number;
  unit: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
  invited: { label: "Invited", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  receiving_quotes: { label: "Receiving Quotes", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  comparison: { label: "In Comparison", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  approval: { label: "Awaiting Approval", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  converted: { label: "Converted to PO", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  closed: { label: "Closed", cls: "bg-neutral-100 text-neutral-500" },
};

export default function RfqPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const canCreate = user?.role === "procurement_officer" || user?.role === "admin";

  const [rfqsList, setRfqsList] = React.useState<RFQ[]>([]);
  const [vendorsList, setVendorsList] = React.useState<Vendor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddForm, setShowAddForm] = React.useState(false);

  // Stepper / Wizard State
  const [formStep, setFormStep] = React.useState<1 | 2 | 3>(1);

  // Form states
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [description, setDescription] = React.useState("");
  
  // Step 2: Line items table
  const [lineItems, setLineItems] = React.useState<LineItem[]>([
    { item: "Ergonomic chair", qty: 25, unit: "NOS" },
    { item: "Standing desks", qty: 10, unit: "NOS" },
  ]);

  // Step 3: Selected vendors
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [updatingRfqId, setUpdatingRfqId] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [rfqRes, vendorRes] = await Promise.all([
        fetch("/api/rfqs"),
        fetch("/api/vendors"),
      ]);

      if (rfqRes.ok && vendorRes.ok) {
        const rfqData = await rfqRes.json();
        const vendorData = await vendorRes.json();
        setRfqsList(rfqData.rfqs || []);
        setVendorsList(vendorData.vendors || []);
      } else {
        toast.error("Failed to load RFQ workspace data");
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

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { item: "", qty: 1, unit: "units" }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    if (field === "qty") {
      updated[index][field] = parseInt(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setLineItems(updated);
  };

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  const handleCreateRfq = async (status: "draft" | "receiving_quotes") => {
    if (!title || !deadline || lineItems.length === 0) {
      toast.error("Please fill all required fields and add at least one line item");
      return;
    }

    // Format lineItems and specifications inside description column as JSON
    const packedDescription = JSON.stringify({
      specifications: description || "Office furniture procurement",
      lineItems,
    });

    const totalQty = lineItems.reduce((sum, item) => sum + item.qty, 0);

    try {
      setSubmitting(true);
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: packedDescription,
          quantity: totalQty,
          unit: lineItems[0]?.unit || "units",
          deadline,
          vendorIds: selectedVendors,
          status,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(status === "draft" ? "RFQ saved as draft!" : "RFQ created & sent to vendors!");
        setShowAddForm(false);
        setFormStep(1);
        setTitle(""); setCategory(""); setDeadline(""); setDescription("");
        setLineItems([
          { item: "Ergonomic chair", qty: 25, unit: "NOS" },
          { item: "Standing desks", qty: 10, unit: "NOS" },
        ]);
        setSelectedVendors([]);
        fetchData();
      } else {
        toast.error(data.error || "Failed to create RFQ");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error creating RFQ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveToComparison = async (rfqId: string) => {
    try {
      setUpdatingRfqId(rfqId);
      const res = await fetch(`/api/rfqs/${rfqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "comparison" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("RFQ status updated to In Comparison!");
        fetchData();
      } else {
        toast.error(data.error || "Failed to update RFQ status");
      }
    } catch (err) {
      toast.error("Network error updating status");
    } finally {
      setUpdatingRfqId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">RFQ Workspace</h1>
          <p className="text-slate-500 text-sm mt-1">Create requests for quotations, add line items, invite vendors.</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setFormStep(1);
            }}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 shadow-md shadow-indigo-100"
          >
            {showAddForm ? "View Active RFQs" : <><Plus className="mr-2 size-4" /> Create RFQ</>}
          </Button>
        )}
      </div>

      {showAddForm ? (
        /* Stepper Multi-step Form matching Screen 5 */
        <Card className="max-w-4xl border-indigo-100 shadow-md shadow-indigo-50/50">
          <CardHeader className="border-b border-slate-100 pb-5">
            {/* Multi-step Stepper Indicator */}
            <div className="flex items-center justify-center max-w-lg mx-auto mb-6">
              <div className="flex items-center w-full">
                <div className={`flex size-9 items-center justify-center rounded-full text-xs font-bold transition duration-300 ${formStep >= 1 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  1
                </div>
                <div className={`flex-1 h-0.5 mx-2 transition duration-300 ${formStep >= 2 ? "bg-indigo-600" : "bg-slate-200"}`} />
                <div className={`flex size-9 items-center justify-center rounded-full text-xs font-bold transition duration-300 ${formStep >= 2 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  2
                </div>
                <div className={`flex-1 h-0.5 mx-2 transition duration-300 ${formStep >= 3 ? "bg-indigo-600" : "bg-slate-200"}`} />
                <div className={`flex size-9 items-center justify-center rounded-full text-xs font-bold transition duration-300 ${formStep >= 3 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  3
                </div>
              </div>
            </div>

            <CardTitle>
              {formStep === 1 && "Step 1: RFQ Details"}
              {formStep === 2 && "Step 2: Add Line Items"}
              {formStep === 3 && "Step 3: Assign Vendors & Attachments"}
            </CardTitle>
            <CardDescription>
              {formStep === 1 && "Enter the RFQ details, categories and deadline parameters."}
              {formStep === 2 && "Configure quotation line items table."}
              {formStep === 3 && "Choose vendors and upload documentation."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            
            {/* Step 1: RFQ Details */}
            {formStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rfqTitle">RFQ's title*</Label>
                    <Input
                      id="rfqTitle"
                      placeholder="Office Furniture procurement Q2"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="Furniture / IT / Cleaning"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline*</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    placeholder="Ergonomic chairs and standing desks for 3rd floor..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      if (!title || !deadline) {
                        toast.error("Please fill in the title and deadline.");
                        return;
                      }
                      setFormStep(2);
                    }}
                    className="bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    Next Step <ArrowRight className="ml-1.5 size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Line Items */}
            {formStep === 2 && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="p-3">Item</th>
                        <th className="p-3 w-28">Qty</th>
                        <th className="p-3 w-32">Unit</th>
                        <th className="p-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {lineItems.map((item, index) => (
                        <tr key={index}>
                          <td className="p-2">
                            <Input
                              placeholder="e.g. Ergonomic chair"
                              value={item.item}
                              onChange={(e) => handleLineItemChange(index, "item", e.target.value)}
                              required
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleLineItemChange(index, "qty", e.target.value)}
                              required
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              placeholder="NOS"
                              value={item.unit}
                              onChange={(e) => handleLineItemChange(index, "unit", e.target.value)}
                              required
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveLineItem(index)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <X className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddLineItem}
                  className="w-full border-dashed border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <Plus className="mr-1.5 size-4" /> + add line item
                </Button>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setFormStep(1)}>
                    <ArrowLeft className="mr-1.5 size-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const emptyItems = lineItems.filter(item => !item.item);
                      if (emptyItems.length > 0) {
                        toast.error("Please specify a description name for all items.");
                        return;
                      }
                      if (lineItems.length === 0) {
                        toast.error("Please add at least one line item.");
                        return;
                      }
                      setFormStep(3);
                    }}
                    className="bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    Next Step <ArrowRight className="ml-1.5 size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Assign Vendors & Attachments */}
            {formStep === 3 && (
              <div className="space-y-5">
                {/* Invited list boxes */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Assign Vendors</Label>
                  <div className="grid gap-2 sm:grid-cols-2 max-h-40 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50">
                    {vendorsList.map((vendor) => {
                      const isInvited = selectedVendors.includes(vendor.id);
                      return (
                        <label key={vendor.id} className={`flex items-center gap-3 cursor-pointer rounded-lg border p-2.5 transition ${isInvited ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"}`}>
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 accent-indigo-600"
                            checked={isInvited}
                            onChange={() => handleVendorToggle(vendor.id)}
                          />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{vendor.name}</p>
                            <p className="text-[10px] text-slate-400">{vendor.category} · GST: {vendor.gstNumber}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Show explicitly invited list with crosses to delete */}
                {selectedVendors.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400 uppercase">Assigned Vendors</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedVendors.map((vendorId) => {
                        const vObj = vendorsList.find(v => v.id === vendorId);
                        return (
                          <Badge key={vendorId} variant="secondary" className="flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-100">
                            {vObj ? vObj.name : "Vendor"}
                            <X className="size-3 cursor-pointer ml-1" onClick={() => handleVendorToggle(vendorId)} />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Attachments drag & drop matching screen 5 */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Attachments</Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50 cursor-pointer hover:bg-slate-100/50 hover:border-indigo-300 transition duration-150">
                    <Upload className="size-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">Drag &amp; drop files or click to upload</p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, ZIP up to 10MB</p>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setFormStep(2)}>
                    <ArrowLeft className="mr-1.5 size-4" /> Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCreateRfq("draft")}
                      disabled={submitting}
                      className="border-slate-200 hover:bg-slate-50"
                    >
                      {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save as Draft"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleCreateRfq("receiving_quotes")}
                      disabled={submitting}
                      className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 shadow-md shadow-indigo-100"
                    >
                      {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save & Send to Vendors"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      ) : (
        /* Active RFQs List */
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100">
              <Loader2 className="size-8 animate-spin text-indigo-400" />
              <p className="mt-2 text-sm text-slate-500">Loading RFQs database...</p>
            </div>
          ) : rfqsList.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">RFQ Details</th>
                      <th className="p-4">Quantity</th>
                      <th className="p-4">Deadline</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Created</th>
                      {canCreate && <th className="p-4">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {rfqsList.map((rfq) => {
                      const sc = statusConfig[rfq.status] ?? { label: rfq.status, cls: "bg-slate-100 text-slate-600" };
                      
                      // Check if description is JSON line items or plaintext
                      let specifications = rfq.description;
                      try {
                        const parsed = JSON.parse(rfq.description);
                        if (parsed && parsed.specifications) {
                          specifications = parsed.specifications;
                        }
                      } catch (e) {}

                      return (
                        <tr key={rfq.id} className="hover:bg-indigo-50/20 transition duration-150">
                          <td className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600">
                                <FileText className="size-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-snug">{rfq.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{specifications}</p>
                                <p className="text-[10px] font-mono text-slate-300 mt-0.5">{rfq.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-800">{rfq.quantity.toLocaleString()}</span>{" "}
                            <span className="text-slate-400 text-xs">{rfq.unit}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <Calendar className="size-3.5 text-slate-400" />
                              {new Date(rfq.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={`${sc.cls} capitalize text-xs`}>
                              {sc.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-xs text-slate-400">
                            {new Date(rfq.createdAt).toLocaleDateString()}
                          </td>
                          {canCreate && (
                            <td className="p-4">
                              {rfq.status === "receiving_quotes" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMoveToComparison(rfq.id)}
                                  disabled={updatingRfqId === rfq.id}
                                  className="text-xs text-violet-700 border-violet-200 hover:bg-violet-50"
                                >
                                  {updatingRfqId === rfq.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <>Move to Comparison <ArrowRight className="ml-1 size-3" /></>
                                  )}
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
              <FileMinus className="size-12 mx-auto text-slate-200" />
              <h3 className="mt-4 text-lg font-semibold text-slate-800">No RFQs Available</h3>
              <p className="text-slate-400 text-sm mt-1">Generate a new Request for Quotation to start inviting vendor bidding.</p>
              {canCreate && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
                >
                  <Plus className="mr-2 size-4" /> Create First RFQ
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
