import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PipelineView from '@/components/leads/PipelineView';
import LeadDetailPanel from '@/components/leads/LeadDetailPanel';
import { useLeads } from '@/hooks/useLeads';
import { Lead, LeadStatus } from '@/types/lead';
import { Loader2 } from 'lucide-react';

const PipelinePage = () => {
  const { leads, loading, updateLead } = useLeads();

  /* -----------------------------
     Selection (ID-based, stable)
  ------------------------------ */
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id);
  };

  const handleClosePanel = () => {
    setSelectedLeadId(null);
  };

  /* -----------------------------
     STATUS UPDATE (DB-SAFE)
  ------------------------------ */
  const handleLeadStatusChange = async (
    leadId: string,
    newStatus: LeadStatus
  ) => {
    /**
     * CRITICAL:
     * newStatus MUST be enum value (not label)
     * Matches DbLead['status']
     */
    await updateLead(leadId, {
      status: newStatus as any, // safe: guarded inside useLeads
    });
  };

  /* -----------------------------
     Map DB Lead → UI Lead
     (single source of truth)
  ------------------------------ */
  const mappedLeads: Lead[] = useMemo(
    () =>
      leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || undefined,
        propertyType: lead.property_types?.[0] ?? 'flat',
        budgetMin: lead.budget_min ?? 0,
        budgetMax: lead.budget_max ?? 0,
        locationPreference: lead.location_preference || '',
        source: lead.source,
        status: lead.status as LeadStatus,
        temperature: lead.temperature,
        assignedAgentId: lead.assigned_agent_id,
        followUpDate: lead.follow_up_date || undefined,
        followUpTime: lead.follow_up_time || undefined,
        notes: lead.notes || '',
        tags: lead.tags || [],
        createdAt: lead.created_at,
        updatedAt: lead.updated_at,
      })),
    [leads]
  );

  /* -----------------------------
     Selected Lead (derived)
  ------------------------------ */
  const selectedLead =
    mappedLeads.find((l) => l.id === selectedLeadId) || null;

  if (loading) {
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Pipeline
          </h1>
          <p className="text-muted-foreground mt-1">
            Drag and drop leads between stages to update their status
          </p>
        </div>

        {/* Pipeline */}
        <PipelineView
          leads={mappedLeads}
          onLeadClick={handleLeadClick}
          onLeadStatusChange={handleLeadStatusChange}
        />
      </div>

      {/* Detail Panel */}
      {selectedLead && (
        <>
          <div
            className="fixed inset-0 bg-foreground/20 z-40"
            onClick={handleClosePanel}
          />
          <LeadDetailPanel
            lead={selectedLead}
            onClose={handleClosePanel}
            onStatusChange={handleLeadStatusChange}
          />
        </>
      )}
    </DashboardLayout>
  );
};

export default PipelinePage;
