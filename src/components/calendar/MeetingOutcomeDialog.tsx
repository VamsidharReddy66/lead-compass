import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useActivities } from '@/hooks/useActivities';
import { Meeting } from '@/hooks/useMeetings';

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

  useEffect(() => {
    if (!open) {
      setSelectedOutcome('');
      setOutcomeNote('');
    }
  }, [open]);

  const saveOutcome = async () => {
    if (!selectedOutcome || !meeting) return;
    try {
      await createActivity({
        lead_id: meeting.lead_id,
        activity_type: 'meeting_outcome',
        description: `${selectedOutcome}${outcomeNote ? ': ' + outcomeNote : ''}`,
        previous_value: null,
        new_value: selectedOutcome,
        meeting_id: meeting.id,
      });
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
