import { useState, useMemo } from 'react';
import {
  Lead,
  LeadStatus,
  LEAD_STATUS_CONFIG,
  PROPERTY_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
} from '@/types/lead';
import { formatCurrency } from '@/data/mockData';
import {
  X,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  PhoneCall,
  CalendarPlus,
  History,
  ArrowRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ScheduleMeetingDialog from '@/components/calendar/ScheduleMeetingDialog';
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import { useMeetings, Meeting } from '@/hooks/useMeetings';
import { useActivities } from '@/hooks/useActivities';
import { useLeads } from '@/hooks/useLeads';
import { Textarea } from '@/components/ui/textarea';
import ActivityHistory from '@/components/leads/ActivityHistory';

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
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => Promise<void>;
}

const temperatureColors: Record<string, string> = {
  hot: 'bg-lead-hot text-white',
  warm: 'bg-lead-warm text-white',
  cold: 'bg-lead-cold text-white',
};

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

const LeadDetailPanel = ({ lead, onClose, onStatusChange }: LeadDetailPanelProps) => {
  const statusConfig = LEAD_STATUS_CONFIG[lead.status];

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isRescheduleMode, setIsRescheduleMode] = useState(false);
  const [pendingOutcomeForNextSchedule, setPendingOutcomeForNextSchedule] = useState(false);

  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);

  const { meetings, updateMeetingStatus } = useMeetings();
  const { activities, createActivity } = useActivities(lead.id);
  const { updateLead } = useLeads();

  // Get only the NEXT upcoming meeting for this lead (one meeting at a time)
  const nextMeeting = useMemo(() => {
    const scheduled = meetings
      .filter((m) => m.lead_id === lead.id && m.status === 'scheduled')
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      );
    return scheduled.length > 0 ? scheduled[0] : null;
  }, [meetings, lead.id]);

  // Check if lead already has an active meeting (prevents creating duplicate)
  const hasActiveMeeting = !!nextMeeting;

  const currentStageIndex = pipelineStages.indexOf(lead.status);

  const handleStatusClick = async (newStatus: LeadStatus) => {
    if (!onStatusChange || newStatus === lead.status) return;

    await onStatusChange(lead.id, newStatus);
  };

  const formatNow = () => {
    return new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSaveOutcome = async () => {
    if (!selectedOutcome || !activeMeeting) return;

    try {
      const now = formatNow();
      await createActivity({
        lead_id: lead.id,
        activity_type: 'meeting_outcome',
        description: `Outcome: ${selectedOutcome}${outcomeNote ? ' - ' + outcomeNote : ''} | Meeting: ${formatDateTime(activeMeeting.scheduled_at)} | Updated: ${now}`,
        previous_value: null,
        new_value: selectedOutcome,
        meeting_id: activeMeeting.id,
      });

      // Mark meeting as completed so user can schedule a new one
      await updateMeetingStatus(activeMeeting.id, 'completed');
    } catch (err) {
      console.error('Error saving outcome activity:', err);
    } finally {
      setSelectedOutcome('');
      setOutcomeNote('');
      setActiveMeeting(null);
      setShowOutcomeDialog(false);
      setPendingOutcomeForNextSchedule(false);
    }
  };

  const handleNextSchedule = () => {
    // Don't save outcome yet - just open schedule dialog
    // Keep outcome data and activeMeeting in state
    // Set flag so we know to show outcome dialog after scheduling
    setPendingOutcomeForNextSchedule(true);
    setShowOutcomeDialog(false);
    setIsRescheduleMode(false);
    setTimeout(() => setShowScheduleDialog(true), 400);
  };

  const handleScheduleDialogClose = (open: boolean) => {
    setShowScheduleDialog(open);
    if (!open) {
      setIsRescheduleMode(false);
      // If we have pending outcome, show outcome dialog again to save
      if (pendingOutcomeForNextSchedule && activeMeeting) {
        setTimeout(() => setShowOutcomeDialog(true), 300);
      } else {
        setActiveMeeting(null);
      }
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  // Helper to format property types as "Plot | Villa"
  const formatPropertyTypes = (propertyType: string): string => {
    // Note: lead.propertyType is a single string (first property type from array)
    // For multi-property display, we'd need the full array from dbLead
    // For now, display the single property type; full array can be retrieved from dbLeads if needed
    return PROPERTY_TYPE_LABELS[propertyType as keyof typeof PROPERTY_TYPE_LABELS] || propertyType;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-card shadow-2xl z-50 animate-slide-in-right">
      {/* HEADER */}
      <div className="sticky top-0 bg-card border-b px-6 py-4 flex justify-between">
        <div>
          <h2 className="font-semibold text-lg">{lead.name}</h2>
          <div className="flex gap-2 mt-1">
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                statusConfig.bgColor,
                statusConfig.color
              )}
            >
              {statusConfig.label}
            </span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full capitalize',
                temperatureColors[lead.temperature]
              )}
            >
              {lead.temperature}
            </span>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X />
        </Button>
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">

        {/* QUICK ACTIONS */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              const cleanPhone = lead.phone.replace(/\D/g, '');
              window.open(`tel:${cleanPhone}`, '_self');
            }}
          >
            <PhoneCall className="w-4 h-4 mr-2" /> Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              const cleanPhone = lead.phone.replace(/\D/g, '');
              window.open(`https://wa.me/${cleanPhone}`, '_blank');
            }}
          >
            <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              setIsRescheduleMode(false);
              setShowScheduleDialog(true);
            }}
            disabled={hasActiveMeeting}
            title={hasActiveMeeting ? 'Complete or reschedule existing meeting first' : 'Schedule a meeting'}
          >
            <CalendarPlus className="w-4 h-4 mr-2" /> Meeting
          </Button>
        </div>

        {/* LEAD LIFECYCLE */}
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-accent" />
            Lead Lifecycle
          </h3>

          <div className="flex items-center gap-1 overflow-x-auto">
            {pipelineStages.map((stage, index) => {
              const cfg = LEAD_STATUS_CONFIG[stage];
              const isActive = stage === lead.status;
              const isPast = currentStageIndex > index;
              const isLost = lead.status === 'lost';

              if (isLost) {
                return (
                  <button
                    key={stage}
                    disabled={!onStatusChange || isActive}
                    onClick={() => handleStatusClick(stage)}
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium transition-all',
                      'bg-red-600 text-white'
                    )}
                  >
                    {cfg.label.split(' ')[0]}
                  </button>
                );
              }

              const activeClass = isActive ? 'bg-accent text-accent-foreground' : '';

              return (
                <button
                  key={stage}
                  disabled={!onStatusChange || isActive}
                  onClick={() => handleStatusClick(stage)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-all',
                    activeClass,
                    isPast && !isActive && 'bg-status-closed/20 text-status-closed',
                    !isActive && !isPast && 'bg-muted text-muted-foreground',
                    !isActive &&
                      onStatusChange &&
                      'hover:ring-2 hover:ring-accent/40'
                  )}
                >
                  {cfg.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTACT INFO */}
        <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-sm">Contact Information</h3>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4" /> {lead.phone}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4" /> {lead.email}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" /> {lead.locationPreference}
          </div>
        </div>

        {/* PROPERTY */}
        <div className="bg-secondary/50 rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Property Type</div>
            {lead.propertyTypes && lead.propertyTypes.length > 0
              ? lead.propertyTypes.map((pt) => PROPERTY_TYPE_LABELS[pt] || pt).join(' | ')
              : PROPERTY_TYPE_LABELS[lead.propertyType]}
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Budget</div>
            {formatCurrency(lead.budgetMin)} – {formatCurrency(lead.budgetMax)}
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Lead Source</div>
            {LEAD_SOURCE_LABELS[lead.source]}
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Created</div>
            {formatDate(lead.createdAt)}
          </div>
        </div>

        {/* NOTES */}
        {lead.notes && (
          <div className="bg-secondary/50 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-1">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {lead.notes}
            </p>
          </div>
        )}

        {/* NEXT MEETING (Only one at a time) */}
        {nextMeeting && (
          <div className="bg-accent/10 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm">Next Meeting</h3>

            <div className="bg-card p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <div>{nextMeeting.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(nextMeeting.scheduled_at)} · {formatTime(nextMeeting.scheduled_at)}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => {
                  setActiveMeeting(nextMeeting);
                  setShowOutcomeDialog(true);
                }}
              >
                Add outcome
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => {
                  setActiveMeeting(nextMeeting);
                  setIsRescheduleMode(true);
                  setShowScheduleDialog(true);
                }}
              >
                Reschedule
              </Button>
            </div>
          </div>
        )}

        {/* ACTIVITY HISTORY */}
        <ActivityHistory activities={activities} />

        {/* ACTIONS */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit2 className="w-4 h-4 mr-2" /> Edit Lead
          </Button>
          <Button variant="outline" className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* EDIT LEAD DIALOG */}
      <AddLeadDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        mode="edit"
        initialData={{
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          property_types: lead.propertyTypes || [lead.propertyType],
          budget_min: lead.budgetMin,
          budget_max: lead.budgetMax,
          location_preference: lead.locationPreference || '',
          source: lead.source,
          temperature: lead.temperature,
          notes: lead.notes || '',
        }}
        onUpdate={async (data) => {
          await updateLead(lead.id, data);
        }}
      />

      {/* OUTCOME DIALOG */}
      {showOutcomeDialog && activeMeeting && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
          <div className="bg-card w-full max-w-md rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-lg">Add outcome</h3>

            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
            >
              <option value="">Click to select</option>
              <option value="Interested">Interested</option>
              <option value="Left message">Left message</option>
              <option value="No response">No response</option>
              <option value="Not interested">Not interested</option>
              <option value="Not able to reach">Not able to reach</option>
            </select>

            <Textarea
              placeholder="Notes (optional)"
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
            />

            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await handleNextSchedule();
              }}
            >
              Next Schedule
            </Button>

            <Button
              className="w-full"
              onClick={async () => {
                await handleSaveOutcome();
              }}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      <ScheduleMeetingDialog
        open={showScheduleDialog}
        onOpenChange={handleScheduleDialogClose}
        leadId={lead.id}
        leadName={lead.name}
        reschedulesMeetingId={isRescheduleMode && activeMeeting ? activeMeeting.id : undefined}
        reschedulesCurrentDate={isRescheduleMode && activeMeeting ? activeMeeting.scheduled_at : undefined}
      />
    </div>
  );
};

export default LeadDetailPanel;

