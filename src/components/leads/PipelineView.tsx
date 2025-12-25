import { useState } from 'react';
import { Lead, LeadStatus, LEAD_STATUS_CONFIG } from '@/types/lead';
import LeadCard from './LeadCard';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [mobileStageIndex, setMobileStageIndex] = useState(0);

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

  const goToPreviousStage = () => {
    setMobileStageIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextStage = () => {
    setMobileStageIndex((prev) => Math.min(pipelineStages.length - 1, prev + 1));
  };

  const currentMobileStage = pipelineStages[mobileStageIndex];
  const currentMobileStageLeads = getLeadsByStage(currentMobileStage);
  const currentMobileConfig = LEAD_STATUS_CONFIG[currentMobileStage];

  return (
    <>
      {/* Mobile View - Single Stage with Navigation */}
      <div className="md:hidden w-full max-w-full overflow-x-hidden">
        {/* Stage Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-2 mb-3 w-full max-w-full">
          {pipelineStages.map((stage, index) => {
            const config = LEAD_STATUS_CONFIG[stage];
            const count = getLeadsByStage(stage).length;
            const isActive = index === mobileStageIndex;

            return (
              <button
                key={stage}
                onClick={() => setMobileStageIndex(index)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {config.label.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>

        {/* Current Stage Header */}
        <div className="flex items-center justify-between gap-2 mb-3 w-full max-w-full">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', currentMobileConfig.bgColor.replace('/10', ''))} />
            <h3 className="font-semibold text-sm text-foreground truncate">{currentMobileConfig.label}</h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex-shrink-0">
              {currentMobileStageLeads.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToPreviousStage}
              disabled={mobileStageIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {mobileStageIndex + 1}/{pipelineStages.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToNextStage}
              disabled={mobileStageIndex === pipelineStages.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stage Content */}
        <div
          className={cn(
            'bg-secondary/50 rounded-xl p-3 min-h-[350px]',
            dragOverStage === currentMobileStage && 'bg-accent/10 ring-2 ring-accent ring-dashed'
          )}
          onDragOver={(e) => handleDragOver(e, currentMobileStage)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, currentMobileStage)}
        >
          <div className="space-y-2">
            {currentMobileStageLeads.map((lead) => (
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
                  compact
                />
              </div>
            ))}

            {currentMobileStageLeads.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No leads in this stage
              </div>
            )}
          </div>
        </div>

        {/* Quick Move Buttons */}
        {currentMobileStageLeads.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 w-full max-w-full">
            <span className="text-xs text-muted-foreground py-1.5">Move to:</span>
            {pipelineStages
              .filter((s) => s !== currentMobileStage)
              .slice(0, 4)
              .map((stage) => {
                const config = LEAD_STATUS_CONFIG[stage];
                return (
                  <button
                    key={stage}
                    className="px-2.5 py-1 bg-secondary rounded-full text-xs text-muted-foreground hover:bg-secondary/80 transition-colors"
                    onClick={() => {
                      // This is a hint - user needs to tap a lead first
                    }}
                  >
                    {config.label.split(' ')[0]}
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Desktop View - Horizontal Columns */}
      <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => {
          const stageLeads = getLeadsByStage(stage);
          const config = LEAD_STATUS_CONFIG[stage];
          const isDropTarget = dragOverStage === stage;

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-72 lg:w-80"
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', config.bgColor.replace('/10', ''))} />
                  <h3 className="font-semibold text-foreground text-sm">{config.label}</h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
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
    </>
  );
};

export default PipelineView;
