import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeetings, CreateMeetingInput } from '@/hooks/useMeetings';
import { useLeads } from '@/hooks/useLeads';
import { Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  leadName?: string;
  defaultDate?: Date;
}

const ScheduleMeetingDialog = ({
  open,
  onOpenChange,
  leadId,
  leadName,
  defaultDate,
}: ScheduleMeetingDialogProps) => {
  const { createMeeting } = useMeetings();
  const { searchLeads } = useLeads();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; phone: string; email: string | null }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedLead, setSelectedLead] = useState<{ id: string; name: string } | null>(
    leadId && leadName ? { id: leadId, name: leadName } : null
  );
  
  const defaultDateStr = defaultDate ? defaultDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    title: leadName ? `Follow-up with ${leadName}` : '',
    description: '',
    meeting_type: 'follow-up' as const,
    date: defaultDateStr,
    time: '10:00',
    duration_minutes: 30,
    location: '',
  });

  // Reset form when dialog opens with new lead
  useEffect(() => {
    if (open) {
      setSelectedLead(leadId && leadName ? { id: leadId, name: leadName } : null);
      setFormData(prev => ({
        ...prev,
        title: leadName ? `Follow-up with ${leadName}` : '',
      }));
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open, leadId, leadName]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setLoading(true);
    const scheduled_at = new Date(`${formData.date}T${formData.time}`).toISOString();
    
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
      onOpenChange(false);
      setSelectedLead(null);
      setFormData({
        title: '',
        description: '',
        meeting_type: 'follow-up',
        date: defaultDateStr,
        time: '10:00',
        duration_minutes: 30,
        location: '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lead Search */}
          {!leadId && (
            <div className="space-y-2">
              <Label>Select Lead *</Label>
              {selectedLead ? (
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedLead.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">#{selectedLead.id.slice(0, 8)}</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedLead(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, name, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((lead) => (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => handleSelectLead(lead)}
                          className={cn(
                            'w-full px-4 py-2 text-left hover:bg-secondary transition-colors',
                            'flex flex-col gap-0.5'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lead.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">#{lead.id.slice(0, 8)}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{lead.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
                      No leads found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Meeting title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_type">Type</Label>
            <Select
              value={formData.meeting_type}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, meeting_type: value }))}
            >
              <SelectTrigger>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select
              value={formData.duration_minutes.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Meeting location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedLead}>
              {loading ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMeetingDialog;
