import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockLeads } from '@/data/mockData';
import { Lead, LEAD_STATUS_CONFIG } from '@/types/lead';
import { ChevronLeft, ChevronRight, Clock, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const leads = mockLeads.filter((lead) => lead.followUpDate);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getLeadsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return leads.filter((lead) => lead.followUpDate === dateStr);
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

  const selectedDateLeads = selectedDate ? getLeadsForDate(selectedDate) : [];

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Calendar</h1>
        <p className="text-muted-foreground">Schedule and track follow-ups, meetings, and site visits.</p>
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

              const dayLeads = getLeadsForDate(date);
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
                    {dayLeads.slice(0, 2).map((lead) => (
                      <div
                        key={lead.id}
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded truncate',
                          LEAD_STATUS_CONFIG[lead.status].bgColor,
                          LEAD_STATUS_CONFIG[lead.status].color
                        )}
                      >
                        {lead.name}
                      </div>
                    ))}
                    {dayLeads.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayLeads.length - 2} more</div>
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

          {selectedDate && selectedDateLeads.length > 0 ? (
            <div className="space-y-4">
              {selectedDateLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-secondary/50 rounded-xl p-4 hover:bg-secondary/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-foreground">{lead.name}</h4>
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          LEAD_STATUS_CONFIG[lead.status].color,
                          LEAD_STATUS_CONFIG[lead.status].bgColor
                        )}
                      >
                        {LEAD_STATUS_CONFIG[lead.status].label}
                      </span>
                    </div>
                    {lead.followUpTime && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {lead.followUpTime}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      {lead.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {lead.locationPreference}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedDate ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-3 flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No follow-ups scheduled</p>
              <Button variant="accent" size="sm" className="mt-4">
                Schedule Follow-up
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Click on a date to see scheduled follow-ups</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
