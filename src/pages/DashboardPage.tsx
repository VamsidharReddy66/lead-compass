import { useMemo, useState } from 'react';
import { format, isToday, isSameDay } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TasksMeetingsWidget from '@/components/dashboard/TasksMeetingsWidget';
import { useLeads } from '@/hooks/useLeads';
import { useMeetings } from '@/hooks/useMeetings';
import { useActivityNotifications } from '@/hooks/useActivityNotifications';
import { LEAD_STATUS_CONFIG, LEAD_SOURCE_LABELS, LeadStatus, LeadSource, PropertyType } from '@/types/lead';
import { TrendingUp, Users, Flame, Calendar, CheckCircle, Loader2, ChevronDown, BarChart3, Target, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const DashboardPage = () => {
  const { leads: dbLeads, loading: leadsLoading } = useLeads();
  const { meetings, loading: meetingsLoading } = useMeetings();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Enable global activity notifications
  useActivityNotifications();

  // Map DB leads to UI format for stats calculation
  const leads = useMemo(() => 
    dbLeads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email || '',
      propertyType: (lead.property_types?.[0] ?? 'flat') as PropertyType,
      propertyTypes: (lead.property_types ?? ['flat']) as PropertyType[],
      budgetMin: Number(lead.budget_min) || 0,
      budgetMax: Number(lead.budget_max) || 0,
      locationPreference: lead.location_preference || '',
      source: lead.source,
      assignedAgentId: lead.assigned_agent_id,
      status: lead.status as LeadStatus,
      followUpDate: lead.follow_up_date,
      followUpTime: lead.follow_up_time,
      notes: lead.notes || '',
      tags: lead.tags || [],
      temperature: lead.temperature,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
    })),
  [dbLeads]);

  // Date-specific stats
  const dateStats = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Leads created on selected date
    const leadsCreatedOnDate = leads.filter((l) => 
      l.createdAt.split('T')[0] === dateStr
    ).length;
    
    // Hot leads as of selected date
    const hotLeadsOnDate = leads.filter((l) => 
      l.temperature === 'hot' && l.createdAt.split('T')[0] === dateStr
    ).length;
    
    // Follow-ups on selected date
    const followUpsOnDate = leads.filter((l) => l.followUpDate === dateStr).length;
    
    // Meetings on selected date
    const meetingsOnDate = meetings.filter((m) => {
      const meetingDate = new Date(m.scheduled_at).toISOString().split('T')[0];
      return meetingDate === dateStr;
    }).length;
    
    // Deals closed on selected date
    const closedOnDate = leads.filter((l) => 
      l.status === 'closed' && l.updatedAt.split('T')[0] === dateStr
    ).length;

    return {
      newLeads: leadsCreatedOnDate,
      hotLeads: hotLeadsOnDate,
      tasks: followUpsOnDate + meetingsOnDate,
      closed: closedOnDate,
    };
  }, [leads, meetings, selectedDate]);

  // Overall stats
  const overallStats = useMemo(() => {
    const totalLeads = leads.length;
    const hotLeads = leads.filter((l) => l.temperature === 'hot').length;
    const warmLeads = leads.filter((l) => l.temperature === 'warm').length;
    const coldLeads = leads.filter((l) => l.temperature === 'cold').length;
    const closed = leads.filter((l) => l.status === 'closed').length;
    const lost = leads.filter((l) => l.status === 'lost').length;
    const inProgress = leads.filter((l) => 
      !['closed', 'lost', 'new'].includes(l.status)
    ).length;
    const conversionRate = totalLeads > 0 ? Math.round((closed / totalLeads) * 100) : 0;
    const totalMeetings = meetings.length;
    const completedMeetings = meetings.filter((m) => m.status === 'completed').length;

    // Status breakdown
    const statusBreakdown: Record<LeadStatus, number> = {
      'new': 0,
      'contacted': 0,
      'site-visit-scheduled': 0,
      'site-visit-completed': 0,
      'negotiation': 0,
      'closed': 0,
      'lost': 0,
    };
    leads.forEach((lead) => {
      statusBreakdown[lead.status]++;
    });

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {};
    leads.forEach((lead) => {
      sourceBreakdown[lead.source] = (sourceBreakdown[lead.source] || 0) + 1;
    });

    // Funnel
    const contacted = leads.filter((l) =>
      ['contacted', 'site-visit-scheduled', 'site-visit-completed', 'negotiation', 'closed'].includes(l.status)
    ).length;
    const siteVisits = leads.filter((l) =>
      ['site-visit-completed', 'negotiation', 'closed'].includes(l.status)
    ).length;

    return {
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      closed,
      lost,
      inProgress,
      conversionRate,
      totalMeetings,
      completedMeetings,
      statusBreakdown,
      sourceBreakdown,
      funnel: { total: totalLeads, contacted, siteVisits, closed },
    };
  }, [leads, meetings]);

  const funnelSteps = useMemo(() => {
    const total = overallStats.funnel.total || 1;
    return [
      { label: 'Total Leads', value: overallStats.funnel.total, percentage: 100 },
      { label: 'Contacted', value: overallStats.funnel.contacted, percentage: Math.round((overallStats.funnel.contacted / total) * 100) },
      { label: 'Site Visits', value: overallStats.funnel.siteVisits, percentage: Math.round((overallStats.funnel.siteVisits / total) * 100) },
      { label: 'Closed', value: overallStats.funnel.closed, percentage: Math.round((overallStats.funnel.closed / total) * 100) },
    ];
  }, [overallStats.funnel]);

  if (leadsLoading || meetingsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Header with Date Picker */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Dashboard</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'd MMM')}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Date-Specific Stats */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">
          {isToday(selectedDate) ? "Today's Activity" : format(selectedDate, 'EEEE, d MMMM')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card rounded-xl p-3 shadow-card">
            <div className="w-7 h-7 rounded-lg bg-status-new/10 flex items-center justify-center mb-1.5">
              <UserPlus className="w-3.5 h-3.5 text-status-new" />
            </div>
            <div className="font-display text-lg font-bold text-foreground">{dateStats.newLeads}</div>
            <div className="text-[10px] text-muted-foreground">New Leads</div>
          </div>

          <div className="bg-card rounded-xl p-3 shadow-card">
            <div className="w-7 h-7 rounded-lg bg-lead-hot/10 flex items-center justify-center mb-1.5">
              <Flame className="w-3.5 h-3.5 text-lead-hot" />
            </div>
            <div className="font-display text-lg font-bold text-foreground">{dateStats.hotLeads}</div>
            <div className="text-[10px] text-muted-foreground">Hot Leads</div>
          </div>

          <div className="bg-card rounded-xl p-3 shadow-card">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="font-display text-lg font-bold text-foreground">{dateStats.tasks}</div>
            <div className="text-[10px] text-muted-foreground">Tasks</div>
          </div>

          <div className="bg-card rounded-xl p-3 shadow-card">
            <div className="w-7 h-7 rounded-lg bg-status-closed/10 flex items-center justify-center mb-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-status-closed" />
            </div>
            <div className="font-display text-lg font-bold text-foreground">{dateStats.closed}</div>
            <div className="text-[10px] text-muted-foreground">Closed</div>
          </div>
        </div>
      </div>

      {/* Overall Stats Section */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Overall Statistics</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl p-3 shadow-card">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mb-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="font-display text-lg font-bold text-foreground">{overallStats.totalLeads}</div>
            <div className="text-[10px] text-muted-foreground">Total Leads</div>
          </div>

          <div className="bg-card rounded-xl p-3 shadow-card">
            <div className="w-7 h-7 rounded-lg bg-status-closed/10 flex items-center justify-center mb-1.5">
              <Target className="w-3.5 h-3.5 text-status-closed" />
            </div>
            <div className="font-display text-lg font-bold text-foreground">{overallStats.closed}</div>
            <div className="text-[10px] text-muted-foreground">Total Closed</div>
          </div>

          <div className="bg-card rounded-xl p-3 shadow-card">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="font-display text-lg font-bold text-foreground">{overallStats.conversionRate}%</div>
            <div className="text-[10px] text-muted-foreground">Conversion</div>
          </div>

          <div className="bg-card rounded-xl p-3 shadow-card">
            <div className="w-7 h-7 rounded-lg bg-lead-hot/10 flex items-center justify-center mb-1.5">
              <Flame className="w-3.5 h-3.5 text-lead-hot" />
            </div>
            <div className="font-display text-lg font-bold text-foreground">{overallStats.hotLeads}</div>
            <div className="text-[10px] text-muted-foreground">Hot</div>
          </div>

          <div className="bg-card rounded-xl p-3 shadow-card">
            <div className="w-7 h-7 rounded-lg bg-lead-warm/10 flex items-center justify-center mb-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-lead-warm" />
            </div>
            <div className="font-display text-lg font-bold text-foreground">{overallStats.warmLeads}</div>
            <div className="text-[10px] text-muted-foreground">Warm</div>
          </div>

          <div className="bg-card rounded-xl p-3 shadow-card">
            <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center mb-1.5">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="font-display text-lg font-bold text-foreground">{overallStats.coldLeads}</div>
            <div className="text-[10px] text-muted-foreground">Cold</div>
          </div>
        </div>
      </div>

      {/* Tasks & Meetings Widget */}
      <TasksMeetingsWidget />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Conversion Funnel */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-display font-semibold text-sm text-foreground mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            {funnelSteps.map((step) => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{step.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {step.value} ({step.percentage}%)
                  </span>
                </div>
                <div className="h-5 bg-secondary rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-lg transition-all duration-500"
                    style={{ width: `${step.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-display font-semibold text-sm text-foreground mb-4">Status Distribution</h3>
          <div className="space-y-2">
            {Object.entries(overallStats.statusBreakdown).map(([status, count]) => {
              const config = LEAD_STATUS_CONFIG[status as LeadStatus];
              const percentage = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', config.bgColor.replace('/10', ''))} />
                  <span className="text-xs text-foreground flex-1 truncate">{config.label}</span>
                  <span className="text-xs font-medium text-foreground">{count}</span>
                  <span className="text-[10px] text-muted-foreground w-10 text-right">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-card rounded-xl p-4 shadow-card lg:col-span-2">
          <h3 className="font-display font-semibold text-sm text-foreground mb-4">Lead Sources</h3>
          {Object.keys(overallStats.sourceBreakdown).length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(overallStats.sourceBreakdown).map(([source, count]) => {
                const percentage = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                return (
                  <div key={source} className="bg-secondary/50 rounded-lg p-3">
                    <div className="text-lg font-bold text-foreground mb-0.5">{count}</div>
                    <div className="text-xs text-muted-foreground mb-1 truncate">
                      {LEAD_SOURCE_LABELS[source as LeadSource] || source}
                    </div>
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6 text-xs">
              No leads yet. Add leads to see source distribution.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
