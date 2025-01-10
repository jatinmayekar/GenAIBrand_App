"use client"
import React, { useState, useRef } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mic,
  ChevronLeft, 
  ChevronRight, 
  PanelRightClose,
  Sun,
  Moon,
  Image as ImageIcon,
  RotateCcw,
  Printer,
  Type,
  Palette,
  Square,
  Check
} from 'lucide-react';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { useSettings } from '@/store/settings';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';  // Change to direct import
import { Slider } from "@/components/ui/slider"
import {
  SidebarGroup,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

const CalendarApp: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [message, setMessage] = useState<string>('');
  const { 
    backgroundImage, 
    backgroundOpacity,
    setBackgroundImage,
    setBackgroundOpacity,
    themeColor, 
    themeMode,
    textColor,
    setTextColor,
    setThemeColor,
    setThemeMode 
  } = useSettings();
  const touchStartX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchEndX - touchStartX.current;

    if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
      if (swipeDistance > 0) {
        handlePreviousMonth();
      } else {
        handleNextMonth();
      }
    }
    touchStartX.current = null;
  };

  const calendarRef = useRef<HTMLDivElement>(null);

  const reactToPrintFn = useReactToPrint({
    // Assert that it's acceptable as Element | Text
    contentRef: calendarRef as React.RefObject<Element>,
    // To print - to right size use 1.3 scale
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add events data
  const events = {
    "2025-01-10": [
      { title: "Team Meeting", time: "10:00 AM" },
      { title: "Project Review", time: "2:00 PM" },
      { title: "Client Call", time: "4:00 PM" },
    ],
    "2025-01-15": [
      { title: "Product Launch", time: "11:00 AM" },
      { title: "Marketing Sync", time: "1:00 PM" },
      { title: "Sprint Planning", time: "3:00 PM" },
    ],
    "2025-01-20": [
      { title: "Budget Review", time: "9:00 AM" },
      { title: "Team Training", time: "2:00 PM" },
      { title: "Weekly Wrap-up", time: "4:30 PM" },
    ],
    "2025-01-05": [
      { title: "Monthly Planning", time: "9:30 AM" },
      { title: "Team Breakfast", time: "8:00 AM" },
      { title: "Code Review", time: "2:00 PM" },
    ],
    "2025-01-25": [
      { title: "Tech Talk", time: "1:00 PM" },
      { title: "Design Review", time: "3:00 PM" },
      { title: "Team Social", time: "5:00 PM" },
    ]
  }

  // Add double click handler
  const handleDoubleClick = (date: Date) => {
    setSelectedDate(date);
  };

  return (
      <SidebarProvider>
        <AppSidebar>
          <div className="space-y-4 p-4 relative z-50">
            {/* Theme Controls Row */}
            <div className="flex items-center space-x-4 h-10">
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-10 h-10 p-0 hover:bg-transparent"
                      >
                        <Palette className="h-4 w-4" />
                        <span className="sr-only">Change theme color</span>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Change theme color</TooltipContent>
                </Tooltip>
                <DropdownMenuContent className="min-w-0 w-[120px] p-1">
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { value: "zinc", color: "bg-zinc-500" },
                      { value: "red", color: "bg-red-500" },
                      { value: "rose", color: "bg-rose-500" },
                      { value: "orange", color: "bg-orange-500" },
                      { value: "green", color: "bg-green-500" },
                      { value: "blue", color: "bg-blue-500" },
                      { value: "yellow", color: "bg-yellow-500" },
                      { value: "violet", color: "bg-violet-500" },
                    ].map((item) => (
                      <DropdownMenuItem
                        key={item.value}
                        className="p-0 m-0 h-6 w-6 focus:bg-transparent relative"
                        onClick={() => setThemeColor(item.value as any)}
                      >
                        <div className={`w-6 h-6 rounded-sm ${item.color} hover:opacity-80 transition-opacity flex items-center justify-center`}>
                          {themeColor === item.value && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
                    className="h-10 w-10"
                  >
                    {themeMode === 'light' ? 
                      <Sun className="h-4 w-4" /> : 
                      <Moon className="h-4 w-4" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme mode</TooltipContent>
              </Tooltip>
            </div>



            {/* Background Controls */}
            <div className="flex items-center space-x-4 h-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <ImageIcon className="h-4 w-4" />
                  </label>
                </TooltipTrigger>
                <TooltipContent>Upload background image</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => setBackgroundImage(null)}
                    className="h-10 w-10"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset background</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger className="flex-1">
                  <Slider
                    value={[backgroundOpacity]}
                    onValueChange={(value) => setBackgroundOpacity(value[0])}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </TooltipTrigger>
                <TooltipContent>Adjust background opacity</TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground w-12 text-right">
                {(backgroundOpacity * 100).toFixed(0)}%
              </span>
            </div>

            {/* Text Controls and Print */}
            <div className="flex items-center space-x-4 h-10">
              <Select value={textColor} onValueChange={setTextColor}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectTrigger className="w-[120px] border-0 bg-transparent">
                      <Type className="h-4 w-4 mr-2" />
                      <SelectValue>
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: textColor }} />
                      </SelectValue>
                    </SelectTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Change text color</TooltipContent>
                </Tooltip>
                <SelectContent>
                  <SelectItem value="black">
                    <div className="w-4 h-4 rounded-sm bg-black" />
                  </SelectItem>
                  <SelectItem value="white">
                    <div className="w-4 h-4 rounded-sm bg-white border border-gray-200" />
                  </SelectItem>
                  <SelectItem value="gray">
                    <div className="w-4 h-4 rounded-sm bg-gray-500" />
                  </SelectItem>
                  <SelectItem value="red">
                    <div className="w-4 h-4 rounded-sm bg-red-500" />
                  </SelectItem>
                  <SelectItem value="blue">
                    <div className="w-4 h-4 rounded-sm bg-blue-500" />
                  </SelectItem>
                  <SelectItem value="green">
                    <div className="w-4 h-4 rounded-sm bg-green-500" />
                  </SelectItem>
                  <SelectItem value="yellow">
                    <div className="w-4 h-4 rounded-sm bg-yellow-500" />
                  </SelectItem>
                  <SelectItem value="purple">
                    <div className="w-4 h-4 rounded-sm bg-purple-500" />
                  </SelectItem>
                </SelectContent>
              </Select>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => reactToPrintFn()}
                    className="h-10 w-10 ml-auto"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print calendar</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </AppSidebar>

        <SidebarInset>
          <div 
            ref={calendarRef}
            className="calendar-print relative flex-1 flex flex-col items-center min-h-screen"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              color: textColor
            }}>
            {/* Background overlay */}
            {backgroundImage && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: 'black',
                  opacity: backgroundOpacity,
                }}
              />
            )}

            {/* Calendar content */}
            <div className="relative z-10 w-full flex-1">
              {/* Calendar Container */}
              <div className="w-full flex justify-center">
                <div 
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className="w-full"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    className="rounded-md"
                    showOutsideDays={false}
                    disableNavigation={true}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center mb-4",
                      caption_label: "text-xl font-bold",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex-1 text-left pl-2",
                      row: "flex w-full mt-2",
                      cell: "h-24 w-32 relative p-0 text-left text-sm flex-1",
                      day: "h-full w-full p-2 flex flex-col hover:bg-accent/10 rounded-lg transition-colors",
                      day_selected: "bg-primary/15 hover:bg-primary/20 transition-colors",
                      day_today: "bg-accent/20 ring-2 ring-primary",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_hidden: "invisible",
                    }}
                    components={{
                      Day: ({ date, ...props }) => (
                        <div 
                          {...props} 
                          className={`h-full w-full p-2 rounded-lg transition-colors ${
                            date?.toDateString() === selectedDate?.toDateString() 
                              ? 'bg-primary/15 hover:bg-primary/20' 
                              : 'hover:bg-accent/10'
                          } ${
                            date?.toDateString() === new Date().toDateString() 
                              ? 'ring-2 ring-primary' 
                              : ''
                          }`}
                          onDoubleClick={() => date && handleDoubleClick(date)}
                        >
                          <div className={`text-left font-medium pl-1 ${
                            date?.toDateString() === new Date().toDateString() 
                              ? 'text-primary font-bold' 
                              : ''
                          }`}>
                            {date?.getDate()}
                          </div>
                          {date && events[date.toISOString().split('T')[0]]?.map((event, idx) => (
                            <div 
                              key={idx}
                              className="text-xs rounded px-1 py-0.5 mb-0.5 truncate hover:bg-accent/10 transition-colors"
                              title={`${event.title} - ${event.time}`}
                            >
                              {event.time.split(' ')[0]} {event.title}
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Controls - Updated styling */}
            <div className="relative z-10 w-full">
              <div className="p-4">
                <div className="mx-auto max-w-lg space-y-4">
                  <div className="flex gap-2">
                    <SidebarTrigger className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent/50 hover:text-accent-foreground backdrop-blur-sm">
                      <PanelRightClose className="h-4 w-4" />
                    </SidebarTrigger>

                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handlePreviousMonth}
                      className="bg-background/50 backdrop-blur-sm hover:bg-accent/50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleNextMonth}
                      className="bg-background/50 backdrop-blur-sm hover:bg-accent/50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Input 
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 bg-background/50 backdrop-blur-sm"
                    />

                    <Button 
                      variant="outline" 
                      size="icon"
                      className="bg-background/50 backdrop-blur-sm hover:bg-accent/50"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Watermark remains the same */}
            <div className="watermark hidden print:block">
              <p className="text-xs inline-block mr-2 align-top">Calie</p>
              <QRCodeSVG
                value="https://calie.app"
                size={40}
                className="inline-block align-top"
              />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
};

export default CalendarApp;
