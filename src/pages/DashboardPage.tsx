import { useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TasksMeetingsWidget from '@/components/dashboard/TasksMeetingsWidget';
import { useLeads } from '@/hooks/useLeads';
import { useMeetings } from '@/hooks/useMeetings';
import { useActivityNotifications } from '@/hooks/useActivityNotifications';
import { LEAD_STATUS_CONFIG, LEAD_SOURCE_LABELS, LeadStatus, LeadSource, PropertyType } from '@/types/lead';
import { TrendingUp, Users, Loader2 } from 'lucide-react';
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
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Dashboard</h1>
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
