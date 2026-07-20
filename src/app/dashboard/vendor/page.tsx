"use client";

import * as React from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Eye,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  name: string;
  category: string;
  gstNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  rating: string;
  status: "active" | "review" | "suspended" | "inactive";
  createdAt: string;
}

export default function VendorPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const canCreate = user?.role === "admin" || user?.role === "procurement_officer";

  const [vendorsList, setVendorsList] = React.useState<Vendor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "review" | "suspended">("all");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(null);

  // Form states
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [gstNumber, setGstNumber] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [updatingStatusId, setUpdatingStatusId] = React.useState<string | null>(null);

  const fetchVendors = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vendors");
      const data = await res.json();
      if (res.ok) {
        setVendorsList(data.vendors || []);
      } else {
        toast.error(data.error || "Failed to load vendors");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error loading vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !gstNumber || !contactName || !contactEmail) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          gstNumber,
          contactName,
          contactEmail,
          contactPhone: contactPhone || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Vendor registered successfully!");
        setShowAddForm(false);
        setName("");
        setCategory("");
        setGstNumber("");
        setContactName("");
        setContactEmail("");
        setContactPhone("");
        fetchVendors();
      } else {
        toast.error(data.error || "Failed to register vendor");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error registering vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (vendorId: string, newStatus: "active" | "review" | "suspended" | "inactive") => {
    try {
      setUpdatingStatusId(vendorId);
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Vendor status updated to ${newStatus}`);
        fetchVendors();
        if (selectedVendor && selectedVendor.id === vendorId) {
          setSelectedVendor({ ...selectedVendor, status: newStatus });
        }
      } else {
        toast.error(data.error || "Failed to update vendor status");
      }
    } catch (err) {
      toast.error("Network error updating vendor status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Status mapping matching Excalidraw mockup tabs
  const activeCount = vendorsList.filter(v => v.status === "active").length;
  const pendingCount = vendorsList.filter(v => v.status === "review").length;
  const blockedCount = vendorsList.filter(v => v.status === "suspended" || v.status === "inactive").length;

  const filteredVendors = vendorsList.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.contactName.toLowerCase().includes(search.toLowerCase()) ||
      vendor.gstNumber.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "active") return matchesSearch && vendor.status === "active";
    if (statusFilter === "review") return matchesSearch && vendor.status === "review";
    if (statusFilter === "suspended") return matchesSearch && (vendor.status === "suspended" || vendor.status === "inactive");
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white flex gap-1 items-center w-fit"><CheckCircle2 className="size-3" /> Active</Badge>;
      case "review":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex gap-1 items-center w-fit"><AlertTriangle className="size-3" /> Pending</Badge>;
      case "suspended":
      case "inactive":
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white flex gap-1 items-center w-fit"><XCircle className="size-3" /> Blocked</Badge>;
      default:
        return <Badge variant="secondary" className="flex gap-1 items-center w-fit">Inactive</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header section matching Excalidraw */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vendors</h1>
          <p className="text-slate-500 text-sm">Manage supplier profiles and registrations</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 shadow-md shadow-indigo-100"
          >
            {showAddForm ? "View Vendors List" : <><Plus className="mr-2 size-4" /> Add Vendor</>}
          </Button>
        )}
      </div>

      {showAddForm ? (
        /* Registration Form */
        <Card className="max-w-2xl border-slate-200/80 shadow-md">
          <CardHeader>
            <CardTitle>Register New Vendor</CardTitle>
            <CardDescription>Enter tax registration, category, and primary contact coordinates.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vendorName">Vendor Company Name *</Label>
                  <Input id="vendorName" placeholder="Orion Industrial Ltd" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input id="category" placeholder="Packaging / Electronics / Services" value={category} onChange={(e) => setCategory(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst">GST Number (Tax ID) *</Label>
                <Input id="gst" placeholder="27AAECO5421F1Z5" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} required />
              </div>

              <div className="border-t border-slate-100 my-4 pt-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Primary Contact Details</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Full Name *</Label>
                    <Input id="contactName" placeholder="Meera Shah" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input id="contactEmail" type="email" placeholder="meera@orion.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input id="contactPhone" placeholder="+91 98765 43210" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90">
                  {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Registering...</> : "Register Vendor Company"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Vendors List & Search/Filters matching Screen 4 Mockup */
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            {/* Search Input matching mockup placeholder */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                className="pl-9 bg-white"
                placeholder="Search bar ...... search by name, gst number, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Tabs matching mockup exactly: All (28), active (21), Pending (4), Blocked (3) */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="text-xs font-semibold rounded-lg"
              >
                All ({vendorsList.length})
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
                className="text-xs font-semibold rounded-lg"
              >
                active ({activeCount})
              </Button>
              <Button
                variant={statusFilter === "review" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("review")}
                className="text-xs font-semibold rounded-lg"
              >
                Pending ({pendingCount})
              </Button>
              <Button
                variant={statusFilter === "suspended" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("suspended")}
                className="text-xs font-semibold rounded-lg"
              >
                Blocked ({blockedCount})
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100">
              <Loader2 className="size-8 animate-spin text-indigo-500" />
              <p className="mt-2 text-sm text-slate-500">Loading vendors database...</p>
            </div>
          ) : filteredVendors.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Vendor Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">GST no.</th>
                      <th className="p-4">contact no.</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-bold text-slate-900">{vendor.name}</td>
                        <td className="p-4">{vendor.category}</td>
                        <td className="p-4 font-mono text-xs">{vendor.gstNumber}</td>
                        <td className="p-4">{vendor.contactPhone || "XYZ Number"}</td>
                        <td className="p-4">{getStatusBadge(vendor.status)}</td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedVendor(vendor)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Eye className="size-3" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
              <Building2 className="size-12 mx-auto text-slate-200" />
              <h3 className="mt-4 text-lg font-semibold text-slate-800">No Vendors Found</h3>
              <p className="text-slate-400 text-sm mt-1">Try updating your filters or register a new vendor company.</p>
            </div>
          )}
        </div>
      )}

      {/* Vendor Profile Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl relative">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">{selectedVendor.name}</CardTitle>
                  <CardDescription>Category: {selectedVendor.category}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-fit py-1" onClick={() => setSelectedVendor(null)}>Close</Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">GST Number</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedVendor.gstNumber}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Audit Rating</span>
                  <span className="font-semibold text-slate-800">⭐ {selectedVendor.rating}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider text-slate-400">Contact Details</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5"><User className="size-3.5 text-slate-400" /> {selectedVendor.contactName}</div>
                  <div className="flex items-center gap-1.5"><Mail className="size-3.5 text-slate-400" /> {selectedVendor.contactEmail}</div>
                  <div className="flex items-center gap-1.5"><Phone className="size-3.5 text-slate-400" /> {selectedVendor.contactPhone || "None"}</div>
                </div>
              </div>

              {canCreate && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider text-slate-400">Update Status Action</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingStatusId === selectedVendor.id}
                      onClick={() => handleStatusUpdate(selectedVendor.id, "active")}
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs"
                    >
                      Set Active
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingStatusId === selectedVendor.id}
                      onClick={() => handleStatusUpdate(selectedVendor.id, "review")}
                      className="border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
                    >
                      Set Review/Pending
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingStatusId === selectedVendor.id}
                      onClick={() => handleStatusUpdate(selectedVendor.id, "suspended")}
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs"
                    >
                      Block/Suspend
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
