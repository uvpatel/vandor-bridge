"use client"

import * as React from "react"
import { useSession } from "@/lib/auth-client"
import { usePathname } from "next/navigation"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboardIcon, 
  ListIcon, 
  ChartBarIcon, 
  FolderIcon, 
  UsersIcon, 
  CircleHelpIcon, 
  SearchIcon, 
  DatabaseIcon, 
  FileChartColumnIcon, 
  FileIcon, 
  Building2Icon,
  ShieldCheckIcon,
} from "lucide-react"

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  procurement_officer: "bg-indigo-100 text-indigo-700",
  manager: "bg-amber-100 text-amber-700",
  vendor: "bg-emerald-100 text-emerald-700",
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  procurement_officer: "Officer",
  manager: "Manager",
  vendor: "Vendor",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const user = session?.user
  const role = user?.role ?? "procurement_officer"

  // Tailor main nav list by role to match the mockup names and single-list structure
  const navItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
  ];

  if (role === "procurement_officer" || role === "admin") {
    navItems.push({
      title: "Vendors",
      url: "/dashboard/vendor",
      icon: <UsersIcon />,
    });
  }

  if (role === "procurement_officer" || role === "manager" || role === "admin") {
    navItems.push({
      title: "RFQ's",
      url: "/dashboard/rfq",
      icon: <FolderIcon />,
    });
  }

  if (role === "vendor" || role === "procurement_officer" || role === "admin") {
    navItems.push({
      title: "Quotations",
      url: "/dashboard/quotations",
      icon: <ListIcon />,
    });
  }

  if (role === "manager" || role === "admin") {
    navItems.push({
      title: "Approvals",
      url: "/dashboard/approvals",
      icon: <FileIcon />,
    });
  }

  if (role === "procurement_officer" || role === "vendor" || role === "admin") {
    navItems.push({
      title: "Purchase orders",
      url: "/dashboard/invoices?tab=pos",
      icon: <FileChartColumnIcon />,
    });
    navItems.push({
      title: "Invoices",
      url: "/dashboard/invoices?tab=invoices",
      icon: <FileChartColumnIcon />,
    });
  }

  navItems.push({
    title: "Reports",
    url: "/dashboard/reports",
    icon: <ChartBarIcon />,
  });

  navItems.push({
    title: "Activity",
    url: "/dashboard/logs",
    icon: <DatabaseIcon />,
  });

  const navSecondary = [
    {
      title: "Search",
      url: "/dashboard",
      icon: <SearchIcon />,
    },
    {
      title: "Help & Support",
      url: "#",
      icon: <CircleHelpIcon />,
    },
  ]

  const sidebarUser = {
    name: user?.name ?? "Guest User",
    email: user?.email ?? "Not logged in",
    avatar: user?.image ?? "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard" className="group">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm transition group-hover:shadow-md">
                  <Building2Icon className="size-4!" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-none text-slate-900">VendorBridge</span>
                  <span className="text-[10px] text-slate-400 leading-none mt-0.5">Procurement ERP</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Role Badge */}
        {user && (
          <div className="px-2 pb-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="size-3 text-slate-400" />
              <Badge
                variant="secondary"
                className={`text-[10px] font-semibold px-2 py-0.5 ${roleColors[role] ?? "bg-slate-100 text-slate-600"}`}
              >
                {roleLabels[role] ?? role}
              </Badge>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
