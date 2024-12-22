"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Sun,
  Moon,
} from "lucide-react"

import { NavUser } from "@/components/ui/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from '@/components/ui/button';
import { useSettings } from '@/store/settings';

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ children, ...props }: React.ComponentProps<typeof Sidebar>) {
    const { 
        gesturesEnabled, 
        themeColor, 
        themeMode,
        setGesturesEnabled, 
        setThemeColor,
        setThemeMode 
  } = useSettings();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="text-center mb-8 w-full max-w-lg">
          <h1 className="text-4xl font-bold text-primary mb-2">Calie</h1>
          <p className="text-gray-600 italic">A smart AI calendar assistant for you</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="space-y-6 p-4">
            {/* Gesture Controls */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Gesture Controls</span>
              <Switch
                checked={gesturesEnabled}
                onCheckedChange={setGesturesEnabled}
              />
            </div>

            {/* Theme Color */}
            <div className="space-y-2">
              <span className="text-sm">Theme Color</span>
              <Select
                value={themeColor}
                onValueChange={setThemeColor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zinc">Zinc</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="rose">Rose</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="violet">Violet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme Mode */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Theme Mode</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
              >
                {themeMode === 'light' ? 
                  <Sun className="h-4 w-4" /> : 
                  <Moon className="h-4 w-4" />
                }
              </Button>
            </div>
          </div>
        </SidebarGroup>

        {children}

      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
