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
        'bg-card rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer group',
        isDragging && 'opacity-50 rotate-2 scale-105',
        isOverdue && 'border-l-4 border-l-destructive bg-destructive/5'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground/60 font-mono">#{lead.id.slice(0, 8)}</p>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>
            <TempIcon className={cn('w-4 h-4 flex-shrink-0', temperatureColors[lead.temperature])} />
          </div>
          <p className="text-sm text-muted-foreground">
            {lead.propertyTypes && lead.propertyTypes.length > 0
              ? lead.propertyTypes.map((pt) => PROPERTY_TYPE_LABELS[pt] || pt).join(' | ')
              : PROPERTY_TYPE_LABELS[lead.propertyType]}
          </p>
        </div>
        <span className={cn('text-xs font-medium px-2 py-1 rounded-full', statusConfig.color, statusConfig.bgColor)}>
          {statusConfig.label}
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="w-3.5 h-3.5" />
          <span className="truncate">{lead.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{lead.locationPreference}</span>
        </div>
      </div>

      {/* Budget */}
      <div className="text-sm font-medium text-foreground mb-3">
        {formatCurrency(lead.budgetMin)} - {formatCurrency(lead.budgetMax)}
      </div>

      {/* Follow-up */}
      {lead.followUpDate && (
        <div className={cn(
          "flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg",
          isOverdue 
            ? "text-destructive bg-destructive/10" 
            : "text-accent bg-accent/10"
        )}>
          <Calendar className="w-3.5 h-3.5" />
          {isOverdue ? 'Overdue: ' : 'Follow-up: '}
          {new Date(lead.followUpDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          {lead.followUpTime && ` at ${lead.followUpTime}`}
        </div>
      )}

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {lead.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadCard;
