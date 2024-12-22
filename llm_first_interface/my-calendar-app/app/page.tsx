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
import { Slider } from "@/components/ui/slider";

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
    setBackgroundOpacity 
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
    <>
      <SidebarProvider>
        <AppSidebar>
          <div className="p-4 space-y-4">
          <h3 className="text-sm font-medium">Customization</h3>
          
          {/* Calendar Size */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Calendar Size</span>
            <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Calendar Size (1..3 for print)</span>
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
            <span className="text-sm text-muted-foreground">Background Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full"
            />
            <Button 
              variant="outline"
              onClick={() => setBackgroundImage(null)}
              className="w-full"
            >
              Reset Background
            </Button>
          </div>

          {/* Background Opacity */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Background Opacity</span>
            <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Background Opacity</span>
            <span className="text-xs text-gray-500">({backgroundOpacity.toFixed(2)})</span>
            </div>
            <Slider
              value={[backgroundOpacity]}
              onValueChange={(value) => setBackgroundOpacity(value[0])}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Print Button */}
          <Button 
            variant="outline"
            onClick={() => reactToPrintFn()}  // Wrap in arrow function
            className="w-full"
          >
            Print Calendar
          </Button>
          </div>
        </AppSidebar>

        <SidebarInset>
          {/* Header with trigger */}

          {/* Main calendar content with background */}
          <div 
            ref={calendarRef}
            className= "relative flex-1 flex flex-col items-center"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
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
              {/* Your existing calendar content */}


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
                      month: "space-y-4 w-full",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "calendar-head-cell text-muted-foreground w-9 font-normal text-[0.8rem] flex-1",
                      row: "flex w-full",
                      cell: "calendar-cell text-center text-sm relative focus-within:relative focus-within:z-20 flex-1 p-0", // Removed the accent bg classes
                      day: "h-24 w-32 p-0 font-normal aria-selected:opacity-100 rounded-md flex items-center justify-center mx-auto",
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
              {/* Controls Row */}
              <div className="flex justify-between items-center">
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
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex gap-2">
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
    </>
  );
};

export default CalendarApp;