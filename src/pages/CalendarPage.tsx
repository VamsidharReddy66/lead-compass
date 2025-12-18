import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMeetings, Meeting } from '@/hooks/useMeetings';
import { useLeads } from '@/hooks/useLeads';
import { ChevronLeft, ChevronRight, Clock, MapPin, Phone, Plus, User, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ScheduleMeetingDialog from '@/components/calendar/ScheduleMeetingDialog';

const meetingTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  'follow-up': { label: 'Follow-up', color: 'text-accent', bgColor: 'bg-accent/10' },
  'site-visit': { label: 'Site Visit', color: 'text-status-new', bgColor: 'bg-status-new/10' },
  'call': { label: 'Call', color: 'text-status-contacted', bgColor: 'bg-status-contacted/10' },
  'meeting': { label: 'Meeting', color: 'text-status-negotiation', bgColor: 'bg-status-negotiation/10' },
};

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  
  const { meetings, loading: meetingsLoading, getMeetingsForDate } = useMeetings();
  const { leads } = useLeads();

  // Create a map for quick lead lookup
  const leadsMap = new Map(leads.map(lead => [lead.id, lead]));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const selectedDateMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Calendar</h1>
          <p className="text-muted-foreground">Schedule and track follow-ups, meetings, and site visits.</p>
        </div>
        <Button onClick={() => setShowScheduleDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-card p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-foreground">{monthName}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-24 rounded-lg bg-secondary/30" />;
              }

              const dayMeetings = getMeetingsForDate(date);
              const isSelected =
                selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth();

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'h-24 p-2 rounded-lg text-left transition-all',
                    'hover:bg-accent/10',
                    isToday(date) && 'ring-2 ring-accent',
                    isSelected && 'bg-accent/10'
                  )}
                >
                  <div
                    className={cn(
                      'text-sm font-medium mb-1',
                      isToday(date) ? 'text-accent' : 'text-foreground'
                    )}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayMeetings.slice(0, 2).map((meeting) => {
                      const config = meetingTypeConfig[meeting.meeting_type] || meetingTypeConfig['meeting'];
                      return (
                        <div
                          key={meeting.id}
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded truncate',
                            config.bgColor,
                            config.color
                          )}
                        >
                          {meeting.title}
                        </div>
                      );
                    })}
                    {dayMeetings.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayMeetings.length - 2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="bg-card rounded-2xl shadow-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">
            {selectedDate
              ? selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Select a date'}
          </h3>

          {meetingsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Loading meetings...</p>
            </div>
          ) : selectedDate && selectedDateMeetings.length > 0 ? (
            <div className="space-y-4">
              {selectedDateMeetings.map((meeting) => {
                const config = meetingTypeConfig[meeting.meeting_type] || meetingTypeConfig['meeting'];
                const lead = leadsMap.get(meeting.lead_id);
                return (
                  <div
                    key={meeting.id}
                    className="bg-secondary/50 rounded-xl p-4 hover:bg-secondary/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-foreground">{meeting.title}</h4>
                        <span
                          className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            config.color,
                            config.bgColor
                          )}
                        >
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(meeting.scheduled_at)}
                      </div>
                    </div>
                    {lead && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 bg-background/50 rounded-lg p-2">
                        <User className="w-3.5 h-3.5" />
                        <span className="font-medium text-foreground">{lead.name}</span>
                        <span className="text-xs">•</span>
                        <Phone className="w-3 h-3" />
                        <span className="text-xs">{lead.phone}</span>
                      </div>
                    )}
                    {meeting.description && (
                      <p className="text-sm text-muted-foreground mt-2">{meeting.description}</p>
                    )}
                    {meeting.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <MapPin className="w-3.5 h-3.5" />
                        {meeting.location}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : selectedDate ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-3 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No meetings scheduled</p>
              <Button 
                variant="default" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowScheduleDialog(true)}
              >
                Schedule Meeting
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Click on a date to see scheduled meetings</p>
            </div>
          )}
        </div>
      </div>

      <ScheduleMeetingDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        defaultDate={selectedDate || undefined}
      />
    </DashboardLayout>
  );
};

export default CalendarPage;
