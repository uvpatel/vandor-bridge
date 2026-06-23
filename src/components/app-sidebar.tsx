"use client"

import * as React from "react"
import { useSession } from "@/lib/auth-client"

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
import { 
  LayoutDashboardIcon, 
  ListIcon, 
  ChartBarIcon, 
  FolderIcon, 
  UsersIcon, 
  Settings2Icon, 
  CircleHelpIcon, 
  SearchIcon, 
  DatabaseIcon, 
  FileChartColumnIcon, 
  FileIcon, 
  CommandIcon 
} from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const user = session?.user
  const role = user?.role ?? "procurement_officer"

  // Dynamically tailor main nav list by role
  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
  ]

  if (role === "procurement_officer" || role === "admin") {
    navMain.push({
      title: "Vendor Management",
      url: "/dashboard/vendor",
      icon: <UsersIcon />,
    })
  }

  if (role === "procurement_officer" || role === "manager" || role === "admin") {
    navMain.push({
      title: "RFQs Workspace",
      url: "/dashboard/rfq",
      icon: <FolderIcon />,
    })
  }

  if (role === "vendor" || role === "procurement_officer") {
    navMain.push({
      title: "Quotation Submission",
      url: "/dashboard/quatations",
      icon: <ListIcon />,
    })
  }

  if (role === "manager" || role === "admin") {
    navMain.push({
      title: "Approvals Workflow",
      url: "/dashboard/approvals",
      icon: <FileIcon />,
    })
  }

  if (role === "procurement_officer" || role === "vendor" || role === "admin") {
    navMain.push({
      title: "PO & Invoices",
      url: "/dashboard/invoices",
      icon: <FileChartColumnIcon />,
    })
  }

  const documents = [
    {
      name: "Activity Logs",
      url: "/dashboard/logs",
      icon: <DatabaseIcon />,
    },
    {
      name: "Reports & Analytics",
      url: "/dashboard/reports",
      icon: <ChartBarIcon />,
    },
  ]

  const navSecondary = [
    {
      title: "Search",
      url: "/dashboard",
      icon: <SearchIcon />,
    },
    {
      title: "Get Help",
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
              <a href="/dashboard">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">VendorBridge</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
