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
  Star, 
  User, 
  Mail, 
  Phone, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2 
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
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [showAddForm, setShowAddForm] = React.useState(false);

  // Form states
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [gstNumber, setGstNumber] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

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
        // Clear form
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

  const filteredVendors = vendorsList.filter((vendor) => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.contactName.toLowerCase().includes(search.toLowerCase()) ||
      vendor.gstNumber.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === "all" || vendor.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(vendorsList.map((v) => v.category.toLowerCase())))];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white flex gap-1 items-center w-fit"><CheckCircle2 className="size-3" /> Active</Badge>;
      case "review":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex gap-1 items-center w-fit"><AlertTriangle className="size-3" /> In Review</Badge>;
      case "suspended":
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white flex gap-1 items-center w-fit"><XCircle className="size-3" /> Suspended</Badge>;
      default:
        return <Badge variant="secondary" className="flex gap-1 items-center w-fit">Inactive</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vendor Management</h1>
          <p className="text-slate-500 text-sm">Register new suppliers, audit profiles, and view contact details.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-slate-950 text-white hover:bg-slate-800">
            {showAddForm ? "View Vendors List" : <><Plus className="mr-2 size-4" /> Register Vendor</>}
          </Button>
        )}
      </div>

      {showAddForm ? (
        /* Registration Form */
        <Card className="max-w-2xl border-primary/10 shadow-sm">
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
                <Button type="submit" disabled={submitting} className="bg-emerald-600 text-white hover:bg-emerald-500">
                  {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Registering...</> : "Register Vendor Company"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Vendors List & Search/Filters */
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input 
                className="pl-9 bg-white" 
                placeholder="Search vendor name, GST, or contact..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-slate-500" />
              <select 
                className="rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-sm focus:outline-none"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100">
              <Loader2 className="size-8 animate-spin text-slate-500" />
              <p className="mt-2 text-sm text-slate-500">Loading vendors database...</p>
            </div>
          ) : filteredVendors.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-md transition duration-200 border-slate-200/60 bg-white">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-900 leading-tight">{vendor.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">Category: {vendor.category}</CardDescription>
                      </div>
                      {getStatusBadge(vendor.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2 text-sm text-slate-600 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-slate-900">{vendor.rating} Rating</span>
                    </div>

                    <div className="rounded-md bg-slate-50 p-2 text-xs border border-slate-100">
                      <Label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Tax Registration (GST)</Label>
                      <span className="font-mono text-slate-800 font-semibold">{vendor.gstNumber}</span>
                    </div>

                    <div className="space-y-1 pt-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <User className="size-3.5 text-slate-400" />
                        {vendor.contactName}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="size-3.5 text-slate-400" />
                        {vendor.contactEmail}
                      </div>
                      {vendor.contactPhone && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="size-3.5 text-slate-400" />
                          {vendor.contactPhone}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-100">
              <Building2 className="size-12 mx-auto text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-800">No Vendors Found</h3>
              <p className="text-slate-500 text-sm mt-1">Try updating your filters or register a new vendor company.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
