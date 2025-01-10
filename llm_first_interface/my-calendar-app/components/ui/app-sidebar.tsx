"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"

export function AppSidebar({ children, ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <TooltipProvider delayDuration={1500}>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          {/* Empty header */}
        </SidebarHeader>
        <SidebarContent>
          {children}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  )
}
