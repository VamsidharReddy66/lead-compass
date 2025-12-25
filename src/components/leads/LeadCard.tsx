import { Lead, LEAD_STATUS_CONFIG, PROPERTY_TYPE_LABELS } from '@/types/lead';
import { formatCurrency } from '@/data/mockData';
import { Phone, Mail, MapPin, Calendar, Flame, Thermometer, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
  compact?: boolean;
}

const temperatureIcons = {
  hot: Flame,
  warm: Thermometer,
  cold: Snowflake,
};

const temperatureColors = {
  hot: 'text-lead-hot',
  warm: 'text-lead-warm',
  cold: 'text-lead-cold',
};

const LeadCard = ({ lead, onClick, isDragging, compact }: LeadCardProps) => {
  const TempIcon = temperatureIcons[lead.temperature];
  const statusConfig = LEAD_STATUS_CONFIG[lead.status];

  // Check if lead is overdue (has a follow-up date in the past)
  const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date();

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'bg-card rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer',
          isDragging && 'opacity-50 rotate-1 scale-105',
          isOverdue && 'border-l-2 border-l-destructive bg-destructive/5'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-medium text-sm text-foreground truncate">{lead.name}</h3>
              <TempIcon className={cn('w-3.5 h-3.5 flex-shrink-0', temperatureColors[lead.temperature])} />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {formatCurrency(lead.budgetMin)} - {formatCurrency(lead.budgetMax)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lead.followUpDate && (
              <div className={cn(
                "text-[10px] px-1.5 py-0.5 rounded",
                isOverdue ? "text-destructive bg-destructive/10" : "text-accent bg-accent/10"
              )}>
                {new Date(lead.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card rounded-lg p-2.5 border border-border/40 hover:border-border hover:shadow-sm transition-all cursor-pointer',
        isDragging && 'opacity-50 rotate-2 scale-105',
        isOverdue && 'border-l-2 border-l-destructive'
      )}
    >
      {/* Name & Status */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="font-medium text-sm truncate">{lead.name}</h3>
          <TempIcon className={cn('w-3 h-3 flex-shrink-0', temperatureColors[lead.temperature])} />
        </div>
        <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap', statusConfig.color, statusConfig.bgColor)}>
          {statusConfig.label}
        </span>
      </div>

      {/* Phone & Budget */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{lead.phone}</span>
        <span className="font-medium text-foreground whitespace-nowrap">
          {formatCurrency(lead.budgetMin)}
        </span>
      </div>
    </div>
  );
};

export default LeadCard;
