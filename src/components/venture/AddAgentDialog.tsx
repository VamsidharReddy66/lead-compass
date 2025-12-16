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
import { Mail, Loader2 } from 'lucide-react';
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
      // First, check if user exists with this email
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!existingProfile) {
        toast.error('No user found with this email. They need to sign up first.');
        setLoading(false);
        return;
      }

      // Check if agent is already added to this venture
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

      // Add agent to venture
      const { error: insertError } = await supabase
        .from('venture_agents')
        .insert({
          venture_id: userRole.venture_id,
          agent_id: existingProfile.id,
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

      // Ignore duplicate role error
      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      toast.success('Agent added successfully!');
      setEmail('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding agent:', error);
      toast.error(error.message || 'Failed to add agent');
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
            <p className="text-sm text-muted-foreground">
              The agent must have an existing account. They can be an independent agent or part of other ventures.
            </p>
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
