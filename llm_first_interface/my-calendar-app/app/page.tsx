"use client"
import React, { useState, useRef } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mic,
  ChevronLeft, 
  ChevronRight, 
  PanelRightClose
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
  Sun,
  Moon,
} from "lucide-react"

const CalendarApp: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [message, setMessage] = useState<string>('');
  const gesturesEnabled = useSettings((state) => state.gesturesEnabled);
  const touchStartX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;
  const { 
    calendarScale, 
    backgroundImage, 
    backgroundOpacity,
    setCalendarScale,
    setBackgroundImage,
    setBackgroundOpacity,
    themeColor, 
    themeMode,
    textColor,
    setTextColor,
    setGesturesEnabled, 
    setThemeColor,
    setThemeMode 
  } = useSettings();

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
    if (!gesturesEnabled) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!gesturesEnabled || !touchStartX.current) return;
    
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
        <SidebarGroup>
          <div className="space-y-6 p-4 relative z-50 bg-background/80 backdrop-blur-sm h-full">
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

            {/* Calendar Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Calendar Size</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">(1.3 for print)</span>
                <span className="text-xs text-gray-500">({calendarScale.toFixed(2)})</span>
              </div>
              <Slider
                value={[calendarScale]}
                onValueChange={(values: number[]) => setCalendarScale(values[0])}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Background Image */}
            <div className="space-y-2">
              <span className="text-sm">Background Image</span>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <Button 
                variant="outline"
                onClick={() => setBackgroundImage(null)}
              >
                Reset Background
              </Button>
            </div>

            {/* Background Opacity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
              <span className="text-sm">Background Opacity</span>
              <span className="text-xs text-gray-500">({backgroundOpacity.toFixed(2)})</span>
              </div>
              <Slider
                value={[backgroundOpacity]}
                onValueChange={(value) => setBackgroundOpacity(value[0])}
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            {/* Add Text Color selector after Theme Color */}
            <div className="space-y-2">
              <span className="text-sm">Text Color</span>
              <Select
                value={textColor}
                onValueChange={setTextColor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select text color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="black">Black</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Print Button */}
            <Button 
              variant="outline"
              onClick={() => reactToPrintFn()}  // Wrap in arrow function
            >
              Print Calendar
            </Button>
          </div>
        </SidebarGroup>
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
