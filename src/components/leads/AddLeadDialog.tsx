import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeads, CreateLeadInput } from '@/hooks/useLeads';
import { PROPERTY_TYPE_LABELS, LEAD_SOURCE_LABELS } from '@/types/lead';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddLeadDialog = ({ open, onOpenChange }: AddLeadDialogProps) => {
  const { createLead } = useLeads();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateLeadInput>({
    name: '',
    phone: '',
    email: '',
    property_type: 'flat',
    budget_min: 0,
    budget_max: 0,
    location_preference: '',
    source: 'other',
    temperature: 'warm',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setLoading(true);
    const result = await createLead(formData);
    setLoading(false);
    
    if (result) {
      onOpenChange(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        property_type: 'flat',
        budget_min: 0,
        budget_max: 0,
        location_preference: '',
        source: 'other',
        temperature: 'warm',
        notes: '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Lead name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                value={formData.property_type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, property_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, source: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_SOURCE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_min">Budget Min (₹)</Label>
              <Input
                id="budget_min"
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_min: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_max">Budget Max (₹)</Label>
              <Input
                id="budget_max"
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_max: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location Preference</Label>
            <Input
              id="location"
              value={formData.location_preference}
              onChange={(e) => setFormData(prev => ({ ...prev, location_preference: e.target.value }))}
              placeholder="Preferred location"
            />
          </div>

          <div className="space-y-2">
            <Label>Temperature</Label>
            <Select
              value={formData.temperature}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, temperature: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">🔥 Hot</SelectItem>
                <SelectItem value="warm">🌡️ Warm</SelectItem>
                <SelectItem value="cold">❄️ Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadDialog;