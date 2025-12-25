import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useActivities } from '@/hooks/useActivities';
import { Meeting, useMeetings } from '@/hooks/useMeetings';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting | null;
  onNextSchedule?: () => void;
}

const MeetingOutcomeDialog = ({ open, onOpenChange, meeting, onNextSchedule }: Props) => {
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [outcomeNote, setOutcomeNote] = useState('');

  const { createActivity } = useActivities(meeting?.lead_id);
  const { updateMeetingStatus } = useMeetings();

  useEffect(() => {
    if (!open) {
      setSelectedOutcome('');
      setOutcomeNote('');
    }
  }, [open]);

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

  const saveOutcome = async () => {
    if (!selectedOutcome || !meeting) return;
    try {
      const now = formatNow();
      await createActivity({
        lead_id: meeting.lead_id,
        activity_type: 'meeting_outcome',
        description: `Outcome: ${selectedOutcome}${outcomeNote ? ' - ' + outcomeNote : ''} | Meeting: ${formatDateTime(meeting.scheduled_at)} | Updated: ${now}`,
        previous_value: null,
        new_value: selectedOutcome,
        meeting_id: meeting.id,
      });

      // Mark meeting as completed so it disappears from calendar
      await updateMeetingStatus(meeting.id, 'completed');
    } catch (err) {
      console.error('Error saving meeting outcome:', err);
    }
  };

  const handleSave = async () => {
    await saveOutcome();
    onOpenChange(false);
  };

  const handleNextSchedule = async () => {
    await saveOutcome();
    onOpenChange(false);
    // Longer delay to ensure this dialog closes fully before schedule dialog opens
    if (onNextSchedule) setTimeout(() => onNextSchedule(), 400);
  };

  if (!open || !meeting) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
      <div className="bg-card w-full max-w-md rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-lg">Meeting Status</h3>

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

        <Button variant="outline" className="w-full" onClick={handleNextSchedule}>
          Next Schedule
        </Button>

        <Button className="w-full" onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default MeetingOutcomeDialog;
