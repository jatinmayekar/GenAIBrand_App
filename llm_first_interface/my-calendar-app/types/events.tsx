export interface CalendarEvent {
  id: string;
  date: Date;
  time: string;
  title: string;
  type: 'workout' | 'meeting' | 'appointment';
}

// Mock events
export const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    date: new Date(2024, 11, 27),
    time: '6:00 PM',
    title: 'Workout',
    type: 'workout'
  },
  {
    id: '2',
    date: new Date(2024, 11, 27),
    time: '2:00 PM',
    title: 'Meeting',
    type: 'meeting'
  },
  {
    id: '3',
    date: new Date(2024, 11, 27),
    time: '10:00 AM',
    title: 'Doctor',
    type: 'appointment'
  }
];