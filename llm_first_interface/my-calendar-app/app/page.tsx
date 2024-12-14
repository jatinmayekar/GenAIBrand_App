"use client"
import React, { useState, useRef } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from "@/components/ui/switch";
import { 
  Mic, 
  ChevronLeft, 
  ChevronRight, 
  Settings,
  PanelRightClose,
  PanelRight
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Add type definitions
type Event = {
  date: Date;
  title: string;
};

const CalendarApp = () => {
  // Add proper types to state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [message, setMessage] = useState<string>('');
  const [gesturesEnabled, setGesturesEnabled] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [events, setEvents] = useState<Event[]>([
    { date: new Date(), title: 'Sample Event' }
  ]);

  // Touch gesture handling
  const touchStartX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;
  const DOUBLE_CLICK_DELAY = 300;

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
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime;
    
    if (timeDiff < DOUBLE_CLICK_DELAY) {
      setIsSidebarOpen(prev => !prev);
    }
    
    setLastClickTime(currentTime);
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
    <div className="flex h-screen bg-gray-50">
      {/* Main Calendar Section */}
      <div className={`flex-1 flex flex-col h-full ${!isSidebarOpen ? 'pr-8' : ''}`}>
        <div className="flex-1 p-8 overflow-hidden">
          <div className={`mx-auto ${!isSidebarOpen ? 'max-w-full' : 'max-w-4xl'}`}>
            {/* Branding Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-2">Calie</h1>
              <p className="text-gray-600 italic">A smart AI calendar assistant for you</p>
            </div>

            {/* Calendar Container */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="w-full flex justify-center"
            >
              <div className={`w-full ${!isSidebarOpen ? 'max-w-none' : 'max-w-4xl'}`}>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="rounded-md border shadow w-full"
                  showOutsideDays={false}
                  disableNavigation={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls - remain the same */}
        <div className="border-t bg-white p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* All Controls Row */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSidebarOpen(prev => !prev)}
                >
                  {isSidebarOpen ? 
                    <PanelRightClose className="h-4 w-4" /> : 
                    <PanelRight className="h-4 w-4" />
                  }
                </Button>
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
      </div>

      {/* Sidebar */}
      {isSidebarOpen && (
        <Card className="w-80 h-full border-l">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-4">Events</h2>
            {events.map((event, index) => (
              <div key={index} className="p-2 mb-2 bg-gray-100 rounded">
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-gray-600">
                  {event.date.toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarApp;