import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMeetings, Meeting } from '@/hooks/useMeetings';
import { useLeads } from '@/hooks/useLeads';
import { ChevronLeft, ChevronRight, Clock, MapPin, Phone, Plus, User, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ScheduleMeetingDialog from '@/components/calendar/ScheduleMeetingDialog';
import MeetingOutcomeDialog from '@/components/calendar/MeetingOutcomeDialog';

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
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [activeOutcomeMeeting, setActiveOutcomeMeeting] = useState<Meeting | null>(null);
  const [scheduleLeadId, setScheduleLeadId] = useState<string | undefined>(undefined);
  const [scheduleLeadName, setScheduleLeadName] = useState<string | undefined>(undefined);
  const [scheduleDefaultDate, setScheduleDefaultDate] = useState<Date | undefined>(undefined);
  
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
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-140px)]">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-card p-4 flex flex-col">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-foreground">{monthName}</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="rounded-lg bg-secondary/30" />;
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
                    'p-1.5 rounded-lg text-left transition-all flex flex-col',
                    'hover:bg-accent/10',
                    isToday(date) && 'ring-2 ring-accent',
                    isSelected && 'bg-accent/10'
                  )}
                >
                  <div
                    className={cn(
                      'text-xs font-medium mb-0.5',
                      isToday(date) ? 'text-accent' : 'text-foreground'
                    )}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5 flex-1 overflow-hidden">
                    {dayMeetings.slice(0, 2).map((meeting) => {
                      const config = meetingTypeConfig[meeting.meeting_type] || meetingTypeConfig['meeting'];
                      return (
                        <div
                          key={meeting.id}
                          className={cn(
                            'text-[10px] px-1 py-0.5 rounded truncate',
                            config.bgColor,
                            config.color
                          )}
                        >
                          {meeting.title}
                        </div>
                      );
                    })}
                    {dayMeetings.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">+{dayMeetings.length - 2}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="bg-card rounded-xl shadow-card p-4 overflow-y-auto">
          <h3 className="font-display font-semibold text-sm text-foreground mb-3">
            {selectedDate
              ? selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Select a date'}
          </h3>

          {meetingsLoading ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-xs">Loading...</p>
            </div>
          ) : selectedDate && selectedDateMeetings.length > 0 ? (
            <div className="space-y-3">
              {selectedDateMeetings.map((meeting) => {
                const config = meetingTypeConfig[meeting.meeting_type] || meetingTypeConfig['meeting'];
                const lead = leadsMap.get(meeting.lead_id);
                return (
                  <div
                    key={meeting.id}
                    className="bg-secondary/50 rounded-lg p-3 hover:bg-secondary/70 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedDate(new Date(meeting.scheduled_at));
                      setActiveOutcomeMeeting(meeting);
                      setShowOutcomeDialog(true);
                    }}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <h4 className="font-medium text-foreground text-sm">{meeting.title}</h4>
                        <span
                          className={cn(
                            'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                            config.color,
                            config.bgColor
                          )}
                        >
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTime(meeting.scheduled_at)}
                      </div>
                    </div>
                    {lead && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 bg-background/50 rounded-lg p-1.5">
                        <User className="w-3 h-3" />
                        <span className="font-medium text-foreground">{lead.name}</span>
                        <span className="text-[10px]">•</span>
                        <Phone className="w-2.5 h-2.5" />
                        <span className="text-[10px]">{lead.phone}</span>
                      </div>
                    )}
                    {meeting.location && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                        <MapPin className="w-3 h-3" />
                        {meeting.location}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveOutcomeMeeting(meeting);
                          setShowOutcomeDialog(true);
                        }}
                      >
                        Add outcome
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOutcomeDialog(false);
                          setActiveOutcomeMeeting(null);
                          setScheduleLeadId(meeting.lead_id);
                          setScheduleLeadName(leadsMap.get(meeting.lead_id)?.name);
                          setScheduleDefaultDate(new Date(meeting.scheduled_at));
                          setTimeout(() => setShowScheduleDialog(true), 400);
                        }}
                      >
                        Reschedule
                      </Button>
                    </div>
                  </div>
                );
              })}
              <MeetingOutcomeDialog
                open={showOutcomeDialog}
                onOpenChange={(v) => setShowOutcomeDialog(v)}
                meeting={activeOutcomeMeeting}
                onNextSchedule={() => setShowScheduleDialog(true)}
              />
            </div>
          ) : selectedDate ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 rounded-full bg-secondary mx-auto mb-2 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-xs">No meetings scheduled</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-xs">Click on a date to see meetings</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Schedule Meeting Button */}
      <Button
        onClick={() => setShowScheduleDialog(true)}
        className="fixed bottom-20 right-6 z-30 rounded-full shadow-lg px-4 h-12 gap-2"
      >
        <Plus className="w-5 h-5" />
        Schedule Meeting
      </Button>

      <ScheduleMeetingDialog
        open={showScheduleDialog}
        onOpenChange={(v) => {
          setShowScheduleDialog(v);
          if (!v) {
            setScheduleLeadId(undefined);
            setScheduleLeadName(undefined);
            setScheduleDefaultDate(undefined);
          }
        }}
        leadId={scheduleLeadId}
        leadName={scheduleLeadName}
        defaultDate={scheduleDefaultDate ?? selectedDate ?? undefined}
      />
    </DashboardLayout>
  );
};

export default CalendarPage;
