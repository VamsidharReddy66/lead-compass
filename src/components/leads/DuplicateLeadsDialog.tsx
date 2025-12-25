import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lead } from '@/types/lead';
import { Phone, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LEAD_STATUS_CONFIG } from '@/types/lead';

interface DuplicateLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
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
}: DuplicateLeadsDialogProps) => {
  const duplicateGroups = useMemo(() => {
    // Normalize phone numbers for comparison
    const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
    
    // Group leads by normalized phone number
    const phoneMap = new Map<string, Lead[]>();
    
    leads.forEach((lead) => {
      const normalizedPhone = normalizePhone(lead.phone);
      if (!phoneMap.has(normalizedPhone)) {
        phoneMap.set(normalizedPhone, []);
      }
      phoneMap.get(normalizedPhone)!.push(lead);
    });
    
    // Filter to only groups with duplicates (more than 1 lead)
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
              
              {duplicateGroups.map((group) => (
                <div
                  key={group.phone}
                  className="bg-secondary/50 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {group.leads[0].phone}
                    <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full">
                      {group.leads.length} duplicates
                    </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {group.leads.map((lead) => {
                      const statusConfig = LEAD_STATUS_CONFIG[lead.status];
                      return (
                        <button
                          key={lead.id}
                          onClick={() => {
                            onLeadClick(lead);
                            onOpenChange(false);
                          }}
                          className="w-full text-left p-2 bg-card rounded-md hover:bg-accent/10 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{lead.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {lead.email || 'No email'}
                            </p>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateLeadsDialog;
