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
import { Mail, Loader2, UserPlus, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AddAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddAgentDialog = ({ open, onOpenChange, onSuccess }: AddAgentDialogProps) => {
  const { userRole } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRole?.venture_id) return;

    setLoading(true);
    try {
      // Check if this email is already invited or added
      const { data: existingInvite } = await supabase
        .from('venture_agents')
        .select('id, status, agent_id')
        .eq('venture_id', userRole.venture_id)
        .or(`email.eq.${email},agent_id.in.(select id from profiles where email = '${email}')`)
        .maybeSingle();

      // More reliable check - query by email directly
      const { data: existingByEmail } = await supabase
        .from('venture_agents')
        .select('id, status')
        .eq('venture_id', userRole.venture_id)
        .eq('email', email)
        .maybeSingle();

      if (existingByEmail) {
        if (existingByEmail.status === 'pending') {
          toast.error('An invitation is already pending for this email.');
        } else {
          toast.error('This agent is already part of your venture.');
        }
        setLoading(false);
        return;
      }

      // Check if user exists with this email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
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
            email: email,
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

        toast.success('Agent added successfully!');
      } else {
        // User doesn't exist - create pending invitation
        const { error: insertError } = await supabase
          .from('venture_agents')
          .insert({
            venture_id: userRole.venture_id,
            email: email,
            status: 'pending',
            agent_id: null
          });

        if (insertError) throw insertError;

        toast.success('Invitation sent! Agent will be added when they sign up.');
      }

      setEmail('');
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
            <Label htmlFor="agent-email">Agent Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="agent-email"
                type="email"
                placeholder="agent@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Existing users will be added immediately</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>New users will be added when they sign up</span>
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
