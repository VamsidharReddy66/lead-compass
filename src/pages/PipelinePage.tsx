import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PipelineView from '@/components/leads/PipelineView';
import LeadDetailPanel from '@/components/leads/LeadDetailPanel';
import { useLeads } from '@/hooks/useLeads';
import { Lead, LeadStatus } from '@/types/lead';
import { Loader2 } from 'lucide-react';

const PipelinePage = () => {
  const { leads, loading, updateLead } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleClosePanel = () => {
    setSelectedLead(null);
  };

  const handleLeadStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    await updateLead(leadId, { status: newStatus });
  };

  // Map database leads to Lead type
  const mappedLeads: Lead[] = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email || undefined,
    propertyType: lead.property_type as Lead['propertyType'],
    budgetMin: lead.budget_min || undefined,
    budgetMax: lead.budget_max || undefined,
    locationPreference: lead.location_preference || undefined,
    source: lead.source as Lead['source'],
    status: lead.status as LeadStatus,
    temperature: lead.temperature as Lead['temperature'],
    assignedAgentId: lead.assigned_agent_id,
    followUpDate: lead.follow_up_date || undefined,
    followUpTime: lead.follow_up_time || undefined,
    notes: lead.notes || undefined,
    tags: lead.tags || [],
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  }));

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
          <h1 className="text-3xl font-display font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Drag and drop leads between stages to update their status
          </p>
        </div>

        {/* Pipeline View */}
        <PipelineView
          leads={mappedLeads}
          onLeadClick={handleLeadClick}
          onLeadStatusChange={handleLeadStatusChange}
        />
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel lead={selectedLead} onClose={handleClosePanel} />
      )}
    </DashboardLayout>
  );
};

export default PipelinePage;
