import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeetings, CreateMeetingInput } from '@/hooks/useMeetings';
import { useLeads } from '@/hooks/useLeads';
import { useActivities } from '@/hooks/useActivities';
import { Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  leadName?: string;
  defaultDate?: Date;
  /** If provided, dialog is in reschedule mode and will update existing meeting */
  reschedulesMeetingId?: string;
  reschedulesCurrentDate?: string;
}

const ScheduleMeetingDialog = ({
  open,
  onOpenChange,
  leadId,
  leadName,
  defaultDate,
  reschedulesMeetingId,
  reschedulesCurrentDate,
}: ScheduleMeetingDialogProps) => {
  const { createMeeting, rescheduleMeeting } = useMeetings();
  const { createActivity } = useActivities(leadId);
  const { searchLeads } = useLeads();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; phone: string; email: string | null }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedLead, setSelectedLead] = useState<{ id: string; name: string } | null>(
    leadId && leadName ? { id: leadId, name: leadName } : null
  );
  
  const getDefaultDate = () => {
    if (defaultDate) {
      return defaultDate.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };
  
  const [formData, setFormData] = useState(() => ({
    title: leadName ? `Follow-up with ${leadName}` : '',
    description: '',
    meeting_type: 'follow-up' as const,
    date: getDefaultDate(),
    time: '10:00',
    duration_minutes: 30,
    location: '',
  }));

  // Reset form when dialog opens with new lead
  useEffect(() => {
    if (open) {
      setSelectedLead(leadId && leadName ? { id: leadId, name: leadName } : null);
      setFormData(prev => ({
        ...prev,
        title: leadName ? `Follow-up with ${leadName}` : '',
        date: getDefaultDate(),
        time: '10:00',
      }));
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open, leadId, leadName, defaultDate]);

  // Search leads when query changes
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length >= 2) {
        const results = await searchLeads(searchQuery);
        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };
    
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchLeads]);

  const handleSelectLead = (lead: { id: string; name: string; phone: string }) => {
    setSelectedLead({ id: lead.id, name: lead.name });
    setFormData(prev => ({
      ...prev,
      title: prev.title || `Follow-up with ${lead.name}`,
    }));
    setSearchQuery('');
    setShowSearchResults(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setLoading(true);
    const scheduled_at = new Date(`${formData.date}T${formData.time}`).toISOString();

    // Reschedule mode: update existing meeting
    if (reschedulesMeetingId) {
      const success = await rescheduleMeeting(reschedulesMeetingId, scheduled_at);
      if (success && leadId) {
        // Log reschedule activity with old and new date/time
        await createActivity({
          lead_id: leadId,
          activity_type: 'meeting_rescheduled',
          description: `Meeting rescheduled from ${formatDateTime(reschedulesCurrentDate || '')} to ${formatDateTime(scheduled_at)}`,
          previous_value: reschedulesCurrentDate || null,
          new_value: scheduled_at,
          meeting_id: reschedulesMeetingId,
        });
      }
      setLoading(false);
      if (success) onOpenChange(false);
      return;
    }
    
    const input: CreateMeetingInput = {
      lead_id: selectedLead.id,
      title: formData.title,
      description: formData.description || undefined,
      meeting_type: formData.meeting_type,
      scheduled_at,
      duration_minutes: formData.duration_minutes,
      location: formData.location || undefined,
    };

    const result = await createMeeting(input);
    setLoading(false);
    
    if (result) {
      // Log activity for new meeting scheduled
      await createActivity({
        lead_id: selectedLead.id,
        activity_type: 'meeting_scheduled',
        description: `Meeting scheduled for ${formatDateTime(scheduled_at)}`,
        previous_value: null,
        new_value: scheduled_at,
        meeting_id: result.id,
      });
      onOpenChange(false);
      setSelectedLead(null);
      setFormData({
        title: '',
        description: '',
        meeting_type: 'follow-up',
        date: getDefaultDate(),
        time: '10:00',
        duration_minutes: 30,
        location: '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-4 rounded-2xl max-h-[calc(100vh-120px)] overflow-y-auto my-[60px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">{reschedulesMeetingId ? 'Reschedule Meeting' : 'Schedule Meeting'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Lead Search */}
          {!leadId && (
            <div className="space-y-1.5">
              <Label className="text-xs">Select Lead *</Label>
              {selectedLead ? (
                <div className="flex items-center justify-between p-2 bg-secondary rounded-md">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedLead.name}</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedLead(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-36 overflow-y-auto">
                      {searchResults.map((lead) => (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => handleSelectLead(lead)}
                          className="w-full px-3 py-1.5 text-left hover:bg-secondary transition-colors"
                        >
                          <span className="text-sm font-medium">{lead.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{lead.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3 text-center text-xs text-muted-foreground">
                      No leads found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Meeting title"
              className="h-8 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meeting_type" className="text-xs">Type</Label>
            <Select
              value={formData.meeting_type}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, meeting_type: value }))}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="site-visit">Site Visit</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time" className="text-xs">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="h-8 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="duration" className="text-xs">Duration</Label>
              <Select
                value={formData.duration_minutes.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hrs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Optional"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Notes</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional notes..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !selectedLead}>
              {loading ? 'Saving...' : (reschedulesMeetingId ? 'Reschedule' : 'Schedule')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMeetingDialog;
