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
      <Sidebar 
        collapsible="icon" 
        className="w-[3.5rem]"
        style={{
          "--sidebar-width": "3.5rem",
          "--sidebar-width-mobile": "3.5rem",
        } as React.CSSProperties}
        {...props}
      >
        <SidebarHeader className="h-[10vh]">
          {/* Empty header */}
        </SidebarHeader>
        <SidebarContent className="flex flex-col items-center h-screen">
          <div className="mt-auto mb-[0.5rem]">
            {children}
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  )
}
