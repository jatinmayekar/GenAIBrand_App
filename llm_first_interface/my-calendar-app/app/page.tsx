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

  return (
      <SidebarProvider>
        <AppSidebar>
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
          {/* Header with trigger */}

          {/* Main calendar content with background */}
          <div 
            ref={calendarRef}
            className= "calendar-print relative flex-1 flex flex-col items-center"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
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

            {/* Calendar with scaling */}
            <div
              className="relative z-10"
              style={{
                transform: `scale(${calendarScale})`,
                transformOrigin: 'center top',
              }}
            >
            {/* Main content */}
              {/* Calendar Container */}
              <div className="w-full flex justify-center">
                <div 
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className="w-full " /*max-w-lg*/
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => handleDateSelect(date)}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    className="rounded-md"
                    showOutsideDays={false}
                    disableNavigation={true}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-8 w-full", // Increased spacing from 4 to 8
                      caption: "flex justify-center pt-1 relative items-center mb-4", // Added margin bottom
                      caption_label: "text-2xl font-medium", // Increased text size
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "calendar-head-cell text-sm w-9 font-normal text-[0.8rem] flex-1",
                      row: "flex w-full",
                      cell: "calendar-cell text-center text-sm relative focus-within:relative focus-within:z-20 flex-1 p-0", // Removed the accent bg classes
                      day: "day h-24 w-32 p-0 font-normal aria-selected:opacity-100 rounded-md flex items-center justify-center mx-auto",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
              </div>
            </div>

          {/* Watermark for print */}
          <div className="watermark hidden print:block">
            <p className="text-xs inline-block mr-2 align-top">Calie</p>
            <QRCodeSVG
              value="https://calie.app"
              size={40}
              className="inline-block align-top"
            />
          </div>

          </div>

          {/* Bottom Controls */}
          <div className="border-t bg-background p-4">
            <div className="mx-auto max-w-lg space-y-4">
              {/* Chat Interface */}
              <div className="flex gap-2">
                <SidebarTrigger className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                  <PanelRightClose className="h-4 w-4" />
                </SidebarTrigger>

                <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handlePreviousMonth}
                    className='bg-background'
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleNextMonth}
                    className='bg-background'
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                <Input 
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />

                <Button variant="outline" size="icon">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
};

export default CalendarApp;