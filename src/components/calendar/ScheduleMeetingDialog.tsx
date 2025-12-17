import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeetings, CreateMeetingInput } from '@/hooks/useMeetings';

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
  const [loading, setLoading] = useState(false);
  
  const defaultDateStr = defaultDate ? defaultDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    title: leadName ? `Follow-up with ${leadName}` : '',
    description: '',
    meeting_type: 'follow-up' as const,
    date: defaultDateStr,
    time: '10:00',
    duration_minutes: 30,
    location: '',
    lead_id: leadId || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lead_id) return;

    setLoading(true);
    const scheduled_at = new Date(`${formData.date}T${formData.time}`).toISOString();
    
    const input: CreateMeetingInput = {
      lead_id: formData.lead_id,
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
      setFormData({
        title: '',
        description: '',
        meeting_type: 'follow-up',
        date: defaultDateStr,
        time: '10:00',
        duration_minutes: 30,
        location: '',
        lead_id: '',
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

          {!leadId && (
            <div className="space-y-2">
              <Label htmlFor="lead_id">Lead ID</Label>
              <Input
                id="lead_id"
                value={formData.lead_id}
                onChange={(e) => setFormData(prev => ({ ...prev, lead_id: e.target.value }))}
                placeholder="Lead ID"
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMeetingDialog;
