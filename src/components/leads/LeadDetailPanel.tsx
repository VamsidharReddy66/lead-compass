import { Lead, LEAD_STATUS_CONFIG, PROPERTY_TYPE_LABELS, LEAD_SOURCE_LABELS } from '@/types/lead';
import { formatCurrency } from '@/data/mockData';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  MessageSquare,
  PhoneCall,
  CalendarPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
}

const temperatureColors = {
  hot: 'bg-lead-hot text-white',
  warm: 'bg-lead-warm text-white',
  cold: 'bg-lead-cold text-white',
};

const LeadDetailPanel = ({ lead, onClose }: LeadDetailPanelProps) => {
  const statusConfig = LEAD_STATUS_CONFIG[lead.status];

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-card shadow-2xl z-50 animate-slide-in-right">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-accent font-semibold text-lg">
              {lead.name.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">{lead.name}</h2>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusConfig.color, statusConfig.bgColor)}>
                {statusConfig.label}
              </span>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', temperatureColors[lead.temperature])}>
                {lead.temperature}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <PhoneCall className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <MessageSquare className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <CalendarPlus className="w-4 h-4 mr-2" />
            Meeting
          </Button>
        </div>

        {/* Contact Information */}
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a href={`tel:${lead.phone}`} className="text-foreground hover:text-accent">
                {lead.phone}
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a href={`mailto:${lead.email}`} className="text-foreground hover:text-accent">
                {lead.email}
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{lead.locationPreference}</span>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Property Interest</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Property Type</div>
              <div className="font-medium text-foreground">{PROPERTY_TYPE_LABELS[lead.propertyType]}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Budget Range</div>
              <div className="font-medium text-foreground">
                {formatCurrency(lead.budgetMin)} - {formatCurrency(lead.budgetMax)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Lead Source</div>
              <div className="font-medium text-foreground">{LEAD_SOURCE_LABELS[lead.source]}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Created</div>
              <div className="font-medium text-foreground">
                {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Follow-up */}
        {lead.followUpDate && (
          <div className="bg-accent/10 rounded-xl p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Scheduled Follow-up
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {new Date(lead.followUpDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              {lead.followUpTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {lead.followUpTime}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {lead.notes && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">Notes</h3>
            <p className="text-sm text-muted-foreground bg-secondary/50 rounded-xl p-4">{lead.notes}</p>
          </div>
        )}

        {/* Tags */}
        {lead.tags.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Lead
          </Button>
          <Button variant="outline" className="text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailPanel;
