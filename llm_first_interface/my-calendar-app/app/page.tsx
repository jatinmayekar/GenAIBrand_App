"use client"
import React, { useState, useRef } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from "@/components/ui/switch";
import { 
  Mic, 
  ChevronLeft, 
  ChevronRight, 
  Settings,
  PanelRightClose
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"

type Event = {
  date: Date;
  title: string;
};

const CalendarApp: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [message, setMessage] = useState<string>('');
  const [gesturesEnabled, setGesturesEnabled] = useState<boolean>(true);
  const [events, setEvents] = useState<Event[]>([
    { date: new Date(), title: 'Sample Event' }
  ]);

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

  return (
    <SidebarProvider>
      <AppSidebar>
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Events</h2>
          {events.map((event, index) => (
            <div key={index} className="p-2 mb-2 bg-gray-100 rounded">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-gray-600">
                {event.date.toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </AppSidebar>

      <SidebarInset>
        {/* Header with trigger */}
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-hidden flex flex-col items-center">
          {/* Your existing calendar content */}
          <div className="text-center mb-8 w-full max-w-lg">
            <h1 className="text-4xl font-bold text-primary mb-2">Calie</h1>
            <p className="text-gray-600 italic">A smart AI calendar assistant for you</p>
          </div>

          {/* Calendar Container */}
          <div className="w-full flex justify-center">
            <div 
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="w-full max-w-lg"
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => handleDateSelect(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border shadow"
                showOutsideDays={false}
                disableNavigation={true}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4 w-full",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex-1",
                  row: "flex w-full mt-2",
                  cell: "text-center text-sm relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 flex-1 p-0",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md flex items-center justify-center mx-auto",
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

        {/* Bottom Controls */}
        <div className="border-t bg-white p-4">
          <div className="mx-auto max-w-lg space-y-4">
            {/* Controls Row */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <SidebarTrigger>
                  <Button variant="outline" size="icon">
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </SidebarTrigger>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Settings</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Gesture Controls</span>
                      <Switch
                        checked={gesturesEnabled}
                        onCheckedChange={setGesturesEnabled}
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
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
  );
};

export default CalendarApp;