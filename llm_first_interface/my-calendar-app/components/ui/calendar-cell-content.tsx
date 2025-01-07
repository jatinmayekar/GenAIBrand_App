import { CalendarEvent } from "@/types/events";
import { Dumbbell, Calendar as CalendarIcon, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const icons = {
  workout: <Dumbbell className="h-3 w-3" />,
  meeting: <CalendarIcon className="h-3 w-3" />,
  appointment: <UserRound className="h-3 w-3" />
};

const EventBadge = ({ event }: { event: CalendarEvent }) => {
  return (
    <Badge 
      variant="outline" 
      className="flex items-center gap-1 w-full justify-start text-xs h-5 px-1"
    >
      {icons[event.type]}
      <span className="truncate">{event.title}</span>
      <span className="ml-auto flex-shrink-0">{event.time}</span>
    </Badge>
  );
};

interface CalendarCellContentProps {
  date: Date;
  events: CalendarEvent[];
}

export function CalendarCellContent({ date, events }: CalendarCellContentProps) {
  const sortedEvents = events
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 3);

  return (
    <div className="h-24 w-full p-1 flex flex-col">
      {/* Day number in top-left */}
      <div className="text-sm mb-1">{date.getDate()}</div>
      
      {/* Events container */}
      <div className="flex-1 space-y-1">
        {[0, 1, 2].map((index) => {
          const event = sortedEvents[index];
          return event ? (
            <EventBadge key={event.id} event={event} />
          ) : (
            <div key={index} className="h-5" /> // Placeholder for empty event slot
          );
        })}
      </div>
    </div>
  );
}