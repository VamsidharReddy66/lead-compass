import { useState } from 'react';
import { Lead, LeadStatus, LEAD_STATUS_CONFIG, PROPERTY_TYPE_LABELS, LEAD_SOURCE_LABELS } from '@/types/lead';
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
  History,
  CheckCircle2,
  XCircle,
  ArrowRight,
  FileText,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ScheduleMeetingDialog from '@/components/calendar/ScheduleMeetingDialog';
import { useMeetings, Meeting } from '@/hooks/useMeetings';
import { useActivities } from '@/hooks/useActivities';
import { Textarea } from '@/components/ui/textarea';

const pipelineStages: LeadStatus[] = [
  'new',
  'contacted',
  'site-visit-scheduled',
  'site-visit-completed',
  'negotiation',
  'closed',
  'lost',
];

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
}

const temperatureColors = {
  hot: 'bg-lead-hot text-white',
  warm: 'bg-lead-warm text-white',
  cold: 'bg-lead-cold text-white',
};

const meetingTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  'follow-up': { label: 'Follow-up', color: 'text-accent', bgColor: 'bg-accent/10' },
  'site-visit': { label: 'Site Visit', color: 'text-status-new', bgColor: 'bg-status-new/10' },
  'call': { label: 'Call', color: 'text-status-contacted', bgColor: 'bg-status-contacted/10' },
  'meeting': { label: 'Meeting', color: 'text-status-negotiation', bgColor: 'bg-status-negotiation/10' },
};

const LeadDetailPanel = ({ lead, onClose, onStatusChange }: LeadDetailPanelProps) => {
  const statusConfig = LEAD_STATUS_CONFIG[lead.status];
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updatingMeetingId, setUpdatingMeetingId] = useState<string | null>(null);
  const [outcomeNote, setOutcomeNote] = useState('');
  const { meetings, updateMeeting } = useMeetings();
  const { activities, createActivity } = useActivities(lead.id);

  // Get upcoming meetings for this lead
  const upcomingMeetings = meetings
    .filter(m => m.lead_id === lead.id && m.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  // Get past/completed meetings for activity history
  const pastMeetings = meetings
    .filter(m => m.lead_id === lead.id && m.status !== 'scheduled')
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  // Get current stage index for pipeline
  const currentStageIndex = pipelineStages.indexOf(lead.status);

  const handleStatusClick = async (newStatus: LeadStatus) => {
    if (newStatus === lead.status || !onStatusChange) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(lead.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMeetingOutcome = async (meeting: Meeting, newStatus: 'completed' | 'cancelled') => {
    setUpdatingMeetingId(meeting.id);
    try {
      const updatedMeeting = await updateMeeting(meeting.id, { 
        status: newStatus,
        description: outcomeNote || meeting.description 
      });
      
      if (updatedMeeting) {
        // Create activity automatically
        await createActivity({
          lead_id: lead.id,
          activity_type: 'meeting-outcome',
          description: `${meeting.title} marked as ${newStatus}${outcomeNote ? `: ${outcomeNote}` : ''}`,
          previous_value: 'scheduled',
          new_value: newStatus,
          meeting_id: meeting.id,
        });
      }
      setOutcomeNote('');
      setUpdatingMeetingId(null);
    } catch {
      setUpdatingMeetingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-status-closed" />;
    if (status === 'cancelled') return <XCircle className="w-4 h-4 text-status-lost" />;
    return <Calendar className="w-4 h-4 text-muted-foreground" />;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'meeting-outcome':
        return <Calendar className="w-4 h-4 text-accent" />;
      case 'status-change':
        return <ArrowRight className="w-4 h-4 text-status-contacted" />;
      case 'note':
        return <FileText className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

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
        {/* Lead Lifecycle Pipeline */}
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-accent" />
            Lead Lifecycle
            {onStatusChange && <span className="text-xs text-muted-foreground font-normal">(click to update)</span>}
          </h3>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {pipelineStages.filter(s => s !== 'lost').map((stage, index) => {
              const stageConfig = LEAD_STATUS_CONFIG[stage];
              const isActive = stage === lead.status;
              const isPast = currentStageIndex > index || (lead.status === 'lost' && index === 0);
              const isLost = lead.status === 'lost';
              const canClick = onStatusChange && !isUpdatingStatus;
              
              return (
                <div key={stage} className="flex items-center">
                  <button 
                    onClick={() => canClick && handleStatusClick(stage)}
                    disabled={!canClick || isActive}
                    className={cn(
                      'flex-shrink-0 px-2 py-1 rounded text-xs font-medium transition-all',
                      isActive && !isLost && 'bg-accent text-accent-foreground',
                      isPast && !isActive && 'bg-status-closed/20 text-status-closed',
                      !isActive && !isPast && 'bg-muted text-muted-foreground',
                      isLost && isActive && 'bg-status-lost/20 text-status-lost',
                      canClick && !isActive && 'hover:ring-2 hover:ring-accent/50 cursor-pointer',
                      (!canClick || isActive) && 'cursor-default'
                    )}
                  >
                    {stageConfig.label.split(' ')[0]}
                  </button>
                  {index < pipelineStages.filter(s => s !== 'lost').length - 1 && (
                    <ArrowRight className={cn(
                      'w-3 h-3 mx-1 flex-shrink-0',
                      isPast ? 'text-status-closed' : 'text-muted-foreground/50'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
          {/* Mark as Lost button */}
          {onStatusChange && lead.status !== 'lost' && lead.status !== 'closed' && (
            <button
              onClick={() => handleStatusClick('lost')}
              disabled={isUpdatingStatus}
              className="text-xs text-status-lost hover:text-status-lost/80 font-medium transition-colors"
            >
              Mark as Lost
            </button>
          )}
          {lead.status === 'lost' && (
            <div className="text-xs text-status-lost font-medium">Lead marked as lost</div>
          )}
        </div>

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
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => setShowScheduleDialog(true)}
          >
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

        {/* Upcoming Meetings */}
        {upcomingMeetings.length > 0 && (
          <div className="bg-accent/10 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Upcoming Meetings ({upcomingMeetings.length})
            </h3>
            <div className="space-y-3">
              {upcomingMeetings.slice(0, 3).map((meeting) => {
                const config = meetingTypeConfig[meeting.meeting_type] || meetingTypeConfig['meeting'];
                const isUpdating = updatingMeetingId === meeting.id;
                return (
                  <div key={meeting.id} className="bg-card rounded-lg p-3 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm text-foreground">{meeting.title}</div>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.color, config.bgColor)}>
                          {config.label}
                        </span>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{formatDate(meeting.scheduled_at)}</div>
                        <div>{formatTime(meeting.scheduled_at)}</div>
                      </div>
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {meeting.location}
                      </div>
                    )}
                    {/* Outcome update section */}
                    <div className="pt-2 border-t border-border space-y-2">
                      <Textarea
                        placeholder="Add outcome notes (optional)..."
                        value={isUpdating ? outcomeNote : ''}
                        onChange={(e) => setOutcomeNote(e.target.value)}
                        className="text-xs min-h-[60px]"
                        disabled={isUpdating && updatingMeetingId !== meeting.id}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs text-status-closed hover:bg-status-closed/10"
                          onClick={() => handleMeetingOutcome(meeting, 'completed')}
                          disabled={isUpdating}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {isUpdating && updatingMeetingId === meeting.id ? 'Saving...' : 'Completed'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs text-status-lost hover:bg-status-lost/10"
                          onClick={() => handleMeetingOutcome(meeting, 'cancelled')}
                          disabled={isUpdating}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Cancelled
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {upcomingMeetings.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{upcomingMeetings.length - 3} more meetings
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity History */}
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            Activity History ({activities.length + pastMeetings.length})
          </h3>
          <div className="space-y-2">
            {/* Show activities from database */}
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="bg-card rounded-lg p-3 border-l-2 border-accent">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {getActivityIcon(activity.activity_type)}
                    <div>
                      <div className="font-medium text-sm text-foreground capitalize">
                        {activity.activity_type.replace('-', ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {activity.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {formatDate(activity.created_at)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Show past meetings as activities */}
            {pastMeetings.slice(0, 5 - activities.length).map((meeting) => {
              const config = meetingTypeConfig[meeting.meeting_type] || meetingTypeConfig['meeting'];
              return (
                <div key={meeting.id} className="bg-card rounded-lg p-3 border-l-2 border-muted">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getStatusIcon(meeting.status)}
                      <div>
                        <div className="font-medium text-sm text-foreground">{meeting.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.color, config.bgColor)}>
                            {config.label}
                          </span>
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                            meeting.status === 'completed' && 'bg-status-closed/10 text-status-closed',
                            meeting.status === 'cancelled' && 'bg-status-lost/10 text-status-lost',
                            meeting.status !== 'completed' && meeting.status !== 'cancelled' && 'bg-muted text-muted-foreground'
                          )}>
                            {meeting.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{formatDate(meeting.scheduled_at)}</div>
                    </div>
                  </div>
                  {meeting.description && (
                    <div className="mt-2 text-xs text-muted-foreground pl-6">
                      {meeting.description}
                    </div>
                  )}
                </div>
              );
            })}
            
            {activities.length === 0 && pastMeetings.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">
                No activity history yet
              </div>
            )}
            
            {(activities.length + pastMeetings.length) > 5 && (
              <div className="text-xs text-muted-foreground text-center">
                +{(activities.length + pastMeetings.length) - 5} more activities
              </div>
            )}
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

      <ScheduleMeetingDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        leadId={lead.id}
        leadName={lead.name}
      />
    </div>
  );
};

export default LeadDetailPanel;
