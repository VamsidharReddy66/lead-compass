import { useState } from 'react';
import { Lead, LeadStatus, LEAD_STATUS_CONFIG } from '@/types/lead';
import LeadCard from './LeadCard';
import { cn } from '@/lib/utils';

interface PipelineViewProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onLeadStatusChange: (leadId: string, newStatus: LeadStatus) => void;
}

const pipelineStages: LeadStatus[] = [
  'new',
  'contacted',
  'site-visit-scheduled',
  'site-visit-completed',
  'negotiation',
  'closed',
  'lost',
];

const PipelineView = ({ leads, onLeadClick, onLeadStatusChange }: PipelineViewProps) => {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);

  const getLeadsByStage = (stage: LeadStatus) => {
    return leads.filter((lead) => lead.status === stage);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== stage) {
      onLeadStatusChange(draggedLead.id, stage);
    }
    setDraggedLead(null);
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {pipelineStages.map((stage) => {
        const stageLeads = getLeadsByStage(stage);
        const config = LEAD_STATUS_CONFIG[stage];
        const isDropTarget = dragOverStage === stage;

        return (
          <div
            key={stage}
            className="flex-shrink-0 w-80"
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', config.bgColor.replace('/10', ''))} />
                <h3 className="font-semibold text-foreground">{config.label}</h3>
                <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {stageLeads.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div
              className={cn(
                'bg-secondary/50 rounded-2xl p-3 min-h-[500px] transition-all duration-200',
                isDropTarget && 'bg-accent/10 ring-2 ring-accent ring-dashed'
              )}
            >
              <div className="space-y-3">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    className="transition-transform"
                  >
                    <LeadCard
                      lead={lead}
                      onClick={() => onLeadClick(lead)}
                      isDragging={draggedLead?.id === lead.id}
                      showOverdueIndicator={true}
                    />
                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PipelineView;
