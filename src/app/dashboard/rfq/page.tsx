"use client";

import * as React from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Users,
  Clock,
  Briefcase,
  CheckSquare,
  Loader2,
  FileMinus,
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

export default function RfqPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const canCreate = user?.role === "procurement_officer" || user?.role === "admin";

  const [rfqsList, setRfqsList] = React.useState<RFQ[]>([]);
  const [vendorsList, setVendorsList] = React.useState<Vendor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddForm, setShowAddForm] = React.useState(false);

  // Form states
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [unit, setUnit] = React.useState("units");
  const [deadline, setDeadline] = React.useState("");
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

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

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !quantity || !deadline) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          quantity: parseInt(quantity),
          unit,
          deadline,
          vendorIds: selectedVendors,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("RFQ created successfully!");
        setShowAddForm(false);
        // Clear form
        setTitle("");
        setDescription("");
        setQuantity("");
        setUnit("units");
        setDeadline("");
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

  const getStatusBadge = (status: string) => {
    const tones: Record<string, string> = {
      draft: "bg-slate-100 text-slate-700 hover:bg-slate-100",
      invited: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
      receiving_quotes: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50",
      comparison: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50",
      approval: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
      rejected: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50",
      converted: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50",
      closed: "bg-neutral-100 text-neutral-600 hover:bg-neutral-100",
    };

    return (
      <Badge variant="outline" className={`${tones[status] || "bg-slate-100"} capitalize`}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">RFQ Workspace</h1>
          <p className="text-slate-500 text-sm">Create Request for Quotations, set delivery deadlines, and invite vendor bids.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-slate-950 text-white hover:bg-slate-800">
            {showAddForm ? "View Active RFQs" : <><Plus className="mr-2 size-4" /> Create RFQ</>}
          </Button>
        )}
      </div>

      {showAddForm ? (
        /* RFQ Creation Form */
        <Card className="max-w-3xl border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle>Create Request for Quotation</CardTitle>
            <CardDescription>Fill out item details, quantities, deadlines, and assign vendor invitations.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rfqTitle">RFQ Title / Subject *</Label>
                  <Input id="rfqTitle" placeholder="Corrugated export cartons" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Submission Deadline *</Label>
                  <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Product / Service Specification *</Label>
                <textarea 
                  id="description" 
                  rows={3}
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="5-ply corrugated cardboard boxes, dimensions 40x30x25cm, printed with standard export marks." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required 
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Required Quantity *</Label>
                  <Input id="quantity" type="number" min="1" placeholder="12000" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measure</Label>
                  <Input id="unit" placeholder="units / pieces / kilograms" value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>

              {/* Vendor Assignment Checkbox List */}
              <div className="border-t border-slate-100 my-4 pt-4">
                <Label className="text-sm font-semibold text-slate-800 block mb-2">Invite Vendors *</Label>
                <p className="text-xs text-slate-500 mb-3">Select which registered suppliers will be notified to submit quotations.</p>
                {vendorsList.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto border border-slate-100 rounded-md p-3 bg-slate-50">
                    {vendorsList.map((vendor) => (
                      <div key={vendor.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`vendor-${vendor.id}`} 
                          checked={selectedVendors.includes(vendor.id)}
                          onCheckedChange={() => handleVendorToggle(vendor.id)}
                        />
                        <Label htmlFor={`vendor-${vendor.id}`} className="text-xs font-normal cursor-pointer select-none">
                          <span className="font-semibold text-slate-800">{vendor.name}</span>
                          <span className="text-slate-400 block text-[10px]">{vendor.category} | {vendor.contactName}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-rose-500">No active vendors found. Please register vendors first.</p>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 text-white hover:bg-emerald-500">
                  {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating...</> : "Create & Send Invitations"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* RFQs Table/List View */
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100">
              <Loader2 className="size-8 animate-spin text-slate-500" />
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
                      <th className="p-4">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {rfqsList.map((rfq) => (
                      <tr key={rfq.id} className="hover:bg-slate-50/80 transition duration-150">
                        <td className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex size-9 items-center justify-center rounded bg-slate-100 text-slate-500">
                              <FileText className="size-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-snug">{rfq.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{rfq.description}</p>
                              <p className="text-[10px] font-semibold font-mono text-slate-400 mt-1 uppercase">{rfq.id}</p>
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
                        <td className="p-4">{getStatusBadge(rfq.status)}</td>
                        <td className="p-4 text-xs text-slate-400">
                          {new Date(rfq.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
              <FileMinus className="size-12 mx-auto text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-800">No RFQs Available</h3>
              <p className="text-slate-500 text-sm mt-1">Generate a new Request for Quotation to start inviting vendor bidding.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
