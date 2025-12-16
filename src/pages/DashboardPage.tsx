import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import PipelineView from '@/components/leads/PipelineView';
import LeadDetailPanel from '@/components/leads/LeadDetailPanel';
import { mockLeads } from '@/data/mockData';
import { Lead, LeadStatus } from '@/types/lead';
import { LayoutGrid, List, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DashboardPage = () => {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const hotLeads = leads.filter((l) => l.temperature === 'hot').length;
    const todayFollowUps = leads.filter((l) => l.followUpDate === today).length;
    const closedDeals = leads.filter((l) => l.status === 'closed').length;
    const conversionRate = Math.round((closedDeals / leads.length) * 100);

    return {
      totalLeads: leads.length,
      hotLeads,
      todayFollowUps,
      closedDeals,
      conversionRate,
    };
  }, [leads]);

  const handleLeadStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus, updatedAt: new Date().toISOString() } : lead
      )
    );
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your lead overview.</p>
      </div>

      {/* Stats */}
      <DashboardStats {...stats} />

      {/* Pipeline Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-foreground">Lead Pipeline</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('pipeline')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'pipeline'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'list'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <PipelineView
          leads={leads}
          onLeadClick={setSelectedLead}
          onLeadStatusChange={handleLeadStatusChange}
        />
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <>
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            onClick={() => setSelectedLead(null)}
          />
          <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
        </>
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;
