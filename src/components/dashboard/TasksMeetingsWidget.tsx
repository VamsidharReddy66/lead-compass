import { useState, useMemo } from 'react';
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns';
import { useMeetings, Meeting } from '@/hooks/useMeetings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckSquare, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  Video,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'open' | 'overdue' | 'completed';
type ViewType = 'tasks' | 'meetings';
type MeetingType = 'all' | 'site-visit' | 'follow-up' | 'negotiation' | 'closing';

interface TimeSlot {
  hour: number;
  label: string;
  meetings: Meeting[];
}

const MEETING_TYPES: { value: MeetingType; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'site-visit', label: 'Site Visit' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closing', label: 'Closing' },
];

const TasksMeetingsWidget = () => {
  const { meetings, loading } = useMeetings();
  const [selectedViews, setSelectedViews] = useState<ViewType[]>(['tasks', 'meetings']);
  const [filter, setFilter] = useState<FilterType>('all');
  const [meetingTypeFilter, setMeetingTypeFilter] = useState<MeetingType>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const toggleView = (view: ViewType) => {
    setSelectedViews((prev) =>
      prev.includes(view) ? prev.filter((v) => v !== view) : [...prev, view]
    );
  };

  // Filter by meeting type first
  const typeFilteredMeetings = useMemo(() => {
    if (meetingTypeFilter === 'all') return meetings;
    return meetings.filter((m) => m.meeting_type === meetingTypeFilter);
  }, [meetings, meetingTypeFilter]);

  // Then filter by status
  const filteredMeetings = useMemo(() => {
    const now = new Date();
    return typeFilteredMeetings.filter((meeting) => {
      const meetingDate = new Date(meeting.scheduled_at);
      switch (filter) {
        case 'open':
          return meeting.status === 'scheduled' && meetingDate >= now;
        case 'overdue':
          return meeting.status === 'scheduled' && meetingDate < now;
        case 'completed':
          return meeting.status === 'completed';
        default:
          return true;
      }
    });
  }, [typeFilteredMeetings, filter]);

  const todayMeetings = useMemo(() => {
    return filteredMeetings.filter((m) =>
      isSameDay(new Date(m.scheduled_at), selectedDate)
    );
  }, [filteredMeetings, selectedDate]);

  const timeSlots: TimeSlot[] = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const label = `${hour.toString().padStart(2, '0')}:00`;
      const meetingsInSlot = todayMeetings.filter((m) => {
        const meetingHour = new Date(m.scheduled_at).getHours();
        return meetingHour === hour;
      });
      slots.push({ hour, label, meetings: meetingsInSlot });
    }
    return slots;
  }, [todayMeetings]);

  const goToPreviousDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate((prev) => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Dynamic filter counts based on type-filtered meetings
  const filterCounts = useMemo(() => {
    const now = new Date();
    return {
      all: typeFilteredMeetings.length,
      open: typeFilteredMeetings.filter((m) => m.status === 'scheduled' && new Date(m.scheduled_at) >= now).length,
      overdue: typeFilteredMeetings.filter((m) => m.status === 'scheduled' && new Date(m.scheduled_at) < now).length,
      completed: typeFilteredMeetings.filter((m) => m.status === 'completed').length,
    };
  }, [typeFilteredMeetings]);

  return (
    <div className="grid lg:grid-cols-3 gap-6 mb-8">
      {/* Tasks/Meetings List */}
      <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-card">
        {/* Header with view toggles */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Button
              variant={selectedViews.includes('tasks') ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => toggleView('tasks')}
            >
              <CheckSquare className="w-4 h-4" />
              Tasks
            </Button>
            <Button
              variant={selectedViews.includes('meetings') ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => toggleView('meetings')}
            >
              <CalendarIcon className="w-4 h-4" />
              Meetings
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <CheckSquare className="w-4 h-4" />
              Add task
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Filter tabs with meeting type filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {(['all', 'open', 'overdue', 'completed'] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-8 capitalize',
                  filter === f ? '' : 'text-muted-foreground'
                )}
                onClick={() => setFilter(f)}
              >
                {f === 'all' 
                  ? `All (${filterCounts.all})` 
                  : `${f.charAt(0).toUpperCase() + f.slice(1)} (${filterCounts[f]})`}
              </Button>
            ))}
          </div>
          
          {/* Meeting Type Filter */}
          <Select value={meetingTypeFilter} onValueChange={(v) => setMeetingTypeFilter(v as MeetingType)}>
            <SelectTrigger className="w-[150px] h-8">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {MEETING_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sub-header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Checkbox id="select-all" />
            <label htmlFor="select-all" className="text-sm text-muted-foreground">
              Select all
            </label>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Due date:</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-primary">
              Today ({format(new Date(), 'd MMM')})
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[200px] flex flex-col items-center justify-center text-center py-8">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : todayMeetings.length === 0 ? (
            <>
              <h4 className="font-semibold text-foreground mb-2">
                Find your upcoming tasks, meetings and reminders here.
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Join video calls from Freshsales Suite
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Video className="w-4 h-4 text-blue-500" />
                  Zoom
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  Microsoft Teams
                </Button>
              </div>
            </>
          ) : (
            <div className="w-full space-y-2">
              {todayMeetings.map((meeting) => {
                const isOverdue = meeting.status === 'scheduled' && new Date(meeting.scheduled_at) < new Date();
                return (
                  <div
                    key={meeting.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg text-left',
                      isOverdue 
                        ? 'bg-[hsl(var(--overdue-bg))] border-l-4 border-l-[hsl(var(--overdue))]' 
                        : 'bg-secondary/50'
                    )}
                  >
                    <Checkbox />
                    <div className="flex-1">
                      <p className={cn(
                        'text-sm font-medium',
                        isOverdue ? 'text-[hsl(var(--overdue))]' : 'text-foreground'
                      )}>{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(meeting.scheduled_at), 'h:mm a')}
                        {isOverdue && ' (Overdue)'}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'capitalize',
                        isOverdue && 'border-[hsl(var(--overdue))] text-[hsl(var(--overdue))]'
                      )}
                    >
                      {meeting.meeting_type}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Calendar Sidebar */}
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-foreground">My calendar</h4>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Date selector */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {format(selectedDate, 'd MMM')}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToPreviousDay}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToNextDay}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {!isToday(selectedDate) && (
              <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={goToToday}>
                Show today
              </Button>
            )}
          </div>
        </div>

        {/* Time slots */}
        <ScrollArea className="h-[280px]">
          <div className="space-y-0">
            {timeSlots.slice(0, 12).map((slot) => (
              <div
                key={slot.hour}
                className="flex items-start gap-3 py-2 border-b border-dashed border-border/50"
              >
                <span className="text-xs text-muted-foreground w-12 shrink-0">
                  {slot.label}
                </span>
                <div className="flex-1">
                  {slot.meetings.map((meeting) => {
                    const isOverdue = meeting.status === 'scheduled' && new Date(meeting.scheduled_at) < new Date();
                    return (
                      <div
                        key={meeting.id}
                        className={cn(
                          'text-xs rounded px-2 py-1 mb-1',
                          isOverdue 
                            ? 'bg-overdue/10 text-overdue font-medium' 
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {meeting.title}
                        {isOverdue && ' (Overdue)'}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default TasksMeetingsWidget;
