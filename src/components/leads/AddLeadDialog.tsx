import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeads, CreateLeadInput } from '@/hooks/useLeads';
import { PROPERTY_TYPE_LABELS, LEAD_SOURCE_LABELS, PropertyType } from '@/types/lead';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'add' | 'edit';
  initialData?: CreateLeadInput;
  onUpdate?: (data: CreateLeadInput) => Promise<void>;
}

const emptyForm: CreateLeadInput = {
  name: '',
  phone: '',
  email: '',
  property_types: [],
  budget_min: 0,
  budget_max: 0,
  location_preference: '',
  source: 'other',
  temperature: 'warm',
  notes: '',
};

const AddLeadDialog = ({
  open,
  onOpenChange,
  mode = 'add',
  initialData,
  onUpdate,
}: AddLeadDialogProps) => {
  const { createLead } = useLeads();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateLeadInput>(emptyForm);

  /* -----------------------------
     INIT FORM
  ------------------------------ */
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        ...initialData,
        property_types: initialData.property_types ?? [],
      });
    }

    if (mode === 'add') {
      setFormData(emptyForm);
    }
  }, [mode, initialData, open]);

  /* -----------------------------
     MULTI SELECT HANDLER
  ------------------------------ */
  const togglePropertyType = (type: PropertyType) => {
    setFormData((prev) => {
      const exists = prev.property_types?.includes(type);
      return {
        ...prev,
        property_types: exists
          ? prev.property_types?.filter((t) => t !== type)
          : [...(prev.property_types ?? []), type],
      };
    });
  };

  /* -----------------------------
     SUBMIT
  ------------------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setLoading(true);

    if (mode === 'edit' && onUpdate) {
      await onUpdate(formData);
    } else {
      await createLead(formData);
    }

    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-4 rounded-2xl max-h-[calc(100vh-120px)] overflow-y-auto my-[60px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">
            {mode === 'edit' ? 'Edit Lead' : 'Add New Lead'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* NAME + PHONE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: e.target.value }))
                }
                className="h-8 text-sm"
                required
              />
            </div>
          </div>

          {/* EMAIL */}
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input
              value={formData.email || ''}
              onChange={(e) =>
                setFormData((p) => ({ ...p, email: e.target.value }))
              }
              className="h-8 text-sm"
            />
          </div>

          {/* PROPERTY TYPES (MULTI) */}
          <div className="space-y-1.5">
            <Label className="text-xs">Property Types</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => {
                const typedKey = key as PropertyType;
                const active = formData.property_types?.includes(typedKey);

                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => togglePropertyType(typedKey)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SOURCE + TEMPERATURE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Source</Label>
              <Select
                value={formData.source}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, source: v as any }))
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_SOURCE_LABELS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Temperature</Label>
              <Select
                value={formData.temperature}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, temperature: v as any }))
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">🔥 Hot</SelectItem>
                  <SelectItem value="warm">🌤 Warm</SelectItem>
                  <SelectItem value="cold">❄ Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* BUDGET */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Budget Min (₹)</Label>
              <Input
                type="number"
                value={formData.budget_min}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    budget_min: Number(e.target.value),
                  }))
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Budget Max (₹)</Label>
              <Input
                type="number"
                value={formData.budget_max}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    budget_max: Number(e.target.value),
                  }))
                }
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* LOCATION */}
          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <Input
              value={formData.location_preference || ''}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  location_preference: e.target.value,
                }))
              }
              placeholder="Preferred location"
              className="h-8 text-sm"
            />
          </div>

          {/* NOTES */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Additional notes..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {/* ACTIONS */}
          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Saving...' : mode === 'edit' ? 'Update' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadDialog;
