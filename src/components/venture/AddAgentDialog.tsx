import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Loader2, UserPlus, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';

interface AddAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be less than 15 digits')
  .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format');

const AddAgentDialog = ({ open, onOpenChange, onSuccess }: AddAgentDialogProps) => {
  const { userRole } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRole?.venture_id) return;

    // Validate phone number
    const validation = phoneSchema.safeParse(phone.trim());
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }
    setError('');

    const normalizedPhone = phone.trim().replace(/[\s\-()]/g, '');

    setLoading(true);
    try {
      // Check if this phone is already invited
      const { data: existingByPhone } = await supabase
        .from('venture_agents')
        .select('id, status')
        .eq('venture_id', userRole.venture_id)
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingByPhone) {
        if (existingByPhone.status === 'pending') {
          toast.error('An invitation is already pending for this phone number.');
        } else {
          toast.error('This agent is already part of your venture.');
        }
        setLoading(false);
        return;
      }

      // Check if user exists with this phone
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, phone, full_name')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingProfile) {
        // Check if agent is already added by agent_id
        const { data: existingAgent } = await supabase
          .from('venture_agents')
          .select('id')
          .eq('venture_id', userRole.venture_id)
          .eq('agent_id', existingProfile.id)
          .maybeSingle();

        if (existingAgent) {
          toast.error('This agent is already part of your venture.');
          setLoading(false);
          return;
        }

        // User exists - add them directly as active agent
        const { error: insertError } = await supabase
          .from('venture_agents')
          .insert({
            venture_id: userRole.venture_id,
            agent_id: existingProfile.id,
            phone: normalizedPhone,
            status: 'active',
            joined_at: new Date().toISOString()
          });

        if (insertError) throw insertError;

        // Add venture_agent role for this user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: existingProfile.id,
            role: 'venture_agent',
            venture_id: userRole.venture_id
          });

        if (roleError && !roleError.message.includes('duplicate')) {
          throw roleError;
        }

        toast.success(`${existingProfile.full_name || 'Agent'} added successfully!`);
      } else {
        // User doesn't exist - create pending invitation
        const { error: insertError } = await supabase
          .from('venture_agents')
          .insert({
            venture_id: userRole.venture_id,
            phone: normalizedPhone,
            status: 'pending',
            agent_id: null
          });

        if (insertError) throw insertError;

        toast.success('Agent added! They will be linked when they sign up with this phone number.');
      }

      setPhone('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error adding agent:', error);
      toast.error('Failed to add agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Agent to Venture</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-phone">Agent Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="agent-phone"
                type="tel"
                placeholder="+91 9876543210"
                className="pl-10"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError('');
                }}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Existing users will be added immediately</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>New users will be linked when they sign up</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Agent
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAgentDialog;
