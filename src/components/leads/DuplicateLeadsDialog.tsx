import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lead } from '@/types/lead';
import { Phone, AlertTriangle, Merge, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LEAD_STATUS_CONFIG } from '@/types/lead';
import { Button } from '@/components/ui/button';

interface DuplicateLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onMerge?: (keepLeadId: string, deleteLeadIds: string[]) => Promise<boolean>;
}

interface DuplicateGroup {
  phone: string;
  leads: Lead[];
}

const DuplicateLeadsDialog = ({
  open,
  onOpenChange,
  leads,
  onLeadClick,
  onMerge,
}: DuplicateLeadsDialogProps) => {
  const [mergeMode, setMergeMode] = useState<string | null>(null); // phone number being merged
  const [selectedKeepId, setSelectedKeepId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const duplicateGroups = useMemo(() => {
    const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
    const phoneMap = new Map<string, Lead[]>();
    
    leads.forEach((lead) => {
      const normalizedPhone = normalizePhone(lead.phone);
      if (!phoneMap.has(normalizedPhone)) {
        phoneMap.set(normalizedPhone, []);
      }
      phoneMap.get(normalizedPhone)!.push(lead);
    });
    
    const groups: DuplicateGroup[] = [];
    phoneMap.forEach((groupLeads, phone) => {
      if (groupLeads.length > 1) {
        groups.push({ phone, leads: groupLeads });
      }
    });
    
    return groups;
  }, [leads]);

  const totalDuplicates = duplicateGroups.reduce(
    (sum, group) => sum + group.leads.length,
    0
  );

  const handleStartMerge = (phone: string) => {
    setMergeMode(phone);
    setSelectedKeepId(null);
  };

  const handleCancelMerge = () => {
    setMergeMode(null);
    setSelectedKeepId(null);
  };

  const handleConfirmMerge = async () => {
    if (!selectedKeepId || !mergeMode || !onMerge) return;

    const group = duplicateGroups.find((g) => g.phone === mergeMode);
    if (!group) return;

    const deleteIds = group.leads
      .filter((l) => l.id !== selectedKeepId)
      .map((l) => l.id);

    setIsMerging(true);
    const success = await onMerge(selectedKeepId, deleteIds);
    setIsMerging(false);

    if (success) {
      setMergeMode(null);
      setSelectedKeepId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Duplicate Leads
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No duplicates found</p>
              <p className="text-sm">All leads have unique phone numbers</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {duplicateGroups.length} phone number(s) with {totalDuplicates} total leads
              </p>
              
              {duplicateGroups.map((group) => {
                const isInMergeMode = mergeMode === group.phone;
                
                return (
                  <div
                    key={group.phone}
                    className="bg-secondary/50 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {group.leads[0].phone}
                        <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full">
                          {group.leads.length} duplicates
                        </span>
                      </div>
                      
                      {onMerge && !isInMergeMode && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleStartMerge(group.phone)}
                        >
                          <Merge className="w-3 h-3 mr-1" />
                          Merge
                        </Button>
                      )}
                    </div>

                    {isInMergeMode && (
                      <p className="text-xs text-primary font-medium">
                        Select the lead to keep (others will be deleted):
                      </p>
                    )}
                    
                    <div className="space-y-1.5">
                      {group.leads.map((lead) => {
                        const statusConfig = LEAD_STATUS_CONFIG[lead.status];
                        const isSelected = selectedKeepId === lead.id;
                        
                        return (
                          <button
                            key={lead.id}
                            onClick={() => {
                              if (isInMergeMode) {
                                setSelectedKeepId(lead.id);
                              } else {
                                onLeadClick(lead);
                                onOpenChange(false);
                              }
                            }}
                            className={cn(
                              'w-full text-left p-2 rounded-md transition-colors flex items-center justify-between gap-2',
                              isInMergeMode
                                ? isSelected
                                  ? 'bg-primary/10 ring-2 ring-primary'
                                  : 'bg-card hover:bg-accent/10'
                                : 'bg-card hover:bg-accent/10'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isInMergeMode && (
                                <div
                                  className={cn(
                                    'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                    isSelected
                                      ? 'bg-primary border-primary'
                                      : 'border-muted-foreground/40'
                                  )}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{lead.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {lead.email || 'No email'}
                                </p>
                              </div>
                            </div>
                            <span
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap',
                                statusConfig.bgColor,
                                statusConfig.color
                              )}
                            >
                              {statusConfig.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {isInMergeMode && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8"
                          onClick={handleCancelMerge}
                          disabled={isMerging}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-8"
                          onClick={handleConfirmMerge}
                          disabled={!selectedKeepId || isMerging}
                        >
                          {isMerging ? 'Merging...' : 'Confirm Merge'}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateLeadsDialog;
