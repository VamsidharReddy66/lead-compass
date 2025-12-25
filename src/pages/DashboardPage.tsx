import { useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TasksMeetingsWidget from '@/components/dashboard/TasksMeetingsWidget';
import { useLeads } from '@/hooks/useLeads';
import { useMeetings } from '@/hooks/useMeetings';
import { useActivityNotifications } from '@/hooks/useActivityNotifications';
import { LEAD_STATUS_CONFIG, LEAD_SOURCE_LABELS, LeadStatus, LeadSource, PropertyType } from '@/types/lead';
import { TrendingUp, Users, Flame, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DashboardPage = () => {
  const { leads: dbLeads, loading: leadsLoading } = useLeads();
  const { meetings, loading: meetingsLoading } = useMeetings();
  
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

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
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

    // Conversion funnel
    const totalLeads = leads.length;
    const contacted = leads.filter((l) =>
      ['contacted', 'site-visit-scheduled', 'site-visit-completed', 'negotiation', 'closed'].includes(l.status)
    ).length;
    const siteVisits = leads.filter((l) =>
      ['site-visit-completed', 'negotiation', 'closed'].includes(l.status)
    ).length;
    const closed = leads.filter((l) => l.status === 'closed').length;
    const hotLeads = leads.filter((l) => l.temperature === 'hot').length;
    const todayFollowUps = leads.filter((l) => l.followUpDate === today).length;

    // Meetings stats
    const scheduledMeetings = meetings.filter((m) => m.status === 'scheduled').length;
    const completedMeetings = meetings.filter((m) => m.status === 'completed').length;
    const todayMeetings = meetings.filter((m) => {
      const meetingDate = new Date(m.scheduled_at).toISOString().split('T')[0];
      return meetingDate === today && m.status === 'scheduled';
    }).length;

    return {
      statusBreakdown,
      sourceBreakdown,
      funnel: {
        total: totalLeads,
        contacted,
        siteVisits,
        closed,
      },
      conversionRate: totalLeads > 0 ? Math.round((closed / totalLeads) * 100) : 0,
      hotLeads,
      todayFollowUps,
      closedDeals: closed,
      scheduledMeetings,
      completedMeetings,
      todayMeetings,
    };
  }, [leads, meetings]);

  const funnelSteps = useMemo(() => {
    const total = stats.funnel.total || 1; // Avoid division by zero
    return [
      { label: 'Total Leads', value: stats.funnel.total, percentage: 100 },
      { label: 'Contacted', value: stats.funnel.contacted, percentage: Math.round((stats.funnel.contacted / total) * 100) },
      { label: 'Site Visits', value: stats.funnel.siteVisits, percentage: Math.round((stats.funnel.siteVisits / total) * 100) },
      { label: 'Closed', value: stats.funnel.closed, percentage: Math.round((stats.funnel.closed / total) * 100) },
    ];
  }, [stats.funnel]);

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
      {/* Page Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground hidden sm:block">Track your performance and lead conversion metrics in real-time.</p>
      </div>

      {/* KPI Cards - Mobile: 2 columns, Desktop: 5 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-card">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-status-new/10 flex items-center justify-center">
              <Users className="w-4 h-4 md:w-6 md:h-6 text-status-new" />
            </div>
          </div>
          <div className="font-display text-xl md:text-3xl font-bold text-foreground mb-0.5 md:mb-1">{leads.length}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Total Leads</div>
        </div>

        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-card">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-lead-hot/10 flex items-center justify-center">
              <Flame className="w-4 h-4 md:w-6 md:h-6 text-lead-hot" />
            </div>
          </div>
          <div className="font-display text-xl md:text-3xl font-bold text-foreground mb-0.5 md:mb-1">{stats.hotLeads}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Hot Leads</div>
        </div>

        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-card">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-accent/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 md:w-6 md:h-6 text-accent" />
            </div>
          </div>
          <div className="font-display text-xl md:text-3xl font-bold text-foreground mb-0.5 md:mb-1">
            {stats.todayFollowUps + stats.todayMeetings}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">Today's Tasks</div>
        </div>

        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-card">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-status-closed/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-status-closed" />
            </div>
          </div>
          <div className="font-display text-xl md:text-3xl font-bold text-foreground mb-0.5 md:mb-1">{stats.closedDeals}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Deals Closed</div>
        </div>

        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-card col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-accent" />
            </div>
          </div>
          <div className="font-display text-xl md:text-3xl font-bold text-foreground mb-0.5 md:mb-1">
            {stats.conversionRate}%
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">Conversion Rate</div>
        </div>
      </div>

      {/* Tasks & Meetings Widget */}
      <TasksMeetingsWidget />

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Conversion Funnel */}
        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-card">
          <h3 className="font-display font-semibold text-sm md:text-base text-foreground mb-4 md:mb-6">Conversion Funnel</h3>
          <div className="space-y-3 md:space-y-4">
            {funnelSteps.map((step) => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <span className="text-xs md:text-sm font-medium text-foreground">{step.label}</span>
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {step.value} ({step.percentage}%)
                  </span>
                </div>
                <div className="h-6 md:h-8 bg-secondary rounded-lg overflow-hidden">
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
        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-card">
          <h3 className="font-display font-semibold text-sm md:text-base text-foreground mb-4 md:mb-6">Lead Status Distribution</h3>
          <div className="space-y-2 md:space-y-3">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => {
              const config = LEAD_STATUS_CONFIG[status as LeadStatus];
              const percentage = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-2 md:gap-3">
                  <div className={cn('w-2.5 h-2.5 md:w-3 md:h-3 rounded-full', config.bgColor.replace('/10', ''))} />
                  <span className="text-xs md:text-sm text-foreground flex-1 truncate">{config.label}</span>
                  <span className="text-xs md:text-sm font-medium text-foreground">{count}</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground w-10 md:w-12 text-right">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-card lg:col-span-2">
          <h3 className="font-display font-semibold text-sm md:text-base text-foreground mb-4 md:mb-6">Lead Sources</h3>
          {Object.keys(stats.sourceBreakdown).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {Object.entries(stats.sourceBreakdown).map(([source, count]) => {
                const percentage = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                return (
                  <div key={source} className="bg-secondary/50 rounded-lg md:rounded-xl p-3 md:p-4">
                    <div className="text-lg md:text-2xl font-bold text-foreground mb-0.5 md:mb-1">{count}</div>
                    <div className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2 truncate">
                      {LEAD_SOURCE_LABELS[source as LeadSource] || source}
                    </div>
                    <div className="h-1 md:h-1.5 bg-secondary rounded-full overflow-hidden">
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
            <p className="text-muted-foreground text-center py-6 md:py-8 text-sm">
              No leads yet. Add leads to see source distribution.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
