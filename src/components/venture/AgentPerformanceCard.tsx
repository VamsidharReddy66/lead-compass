import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Mail, Phone, UserX, UserCheck, Clock, Trash2 } from 'lucide-react';
import { VentureAgent } from '@/hooks/useVentureAgents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgentPerformanceCardProps {
  agent: VentureAgent;
  onUpdate: () => void;
}

const AgentPerformanceCard = ({ agent, onUpdate }: AgentPerformanceCardProps) => {
  const [updating, setUpdating] = useState(false);
  const isPending = agent.status === 'pending';

  const toggleStatus = async () => {
    if (isPending) return;
    setUpdating(true);
    try {
      const newStatus = agent.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('venture_agents')
        .update({ status: newStatus })
        .eq('id', agent.id);

      if (error) throw error;
      toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      onUpdate();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating agent:', error);
      toast.error('Failed to update agent status');
    } finally {
      setUpdating(false);
    }
  };

  const cancelInvitation = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('venture_agents')
        .delete()
        .eq('id', agent.id);

      if (error) throw error;
      toast.success('Invitation cancelled');
      onUpdate();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (name: string | null, phone?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (phone) {
      return phone.slice(-2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  const getStatusBadge = () => {
    if (isPending) {
      return (
        <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
    return (
      <Badge 
        variant={agent.status === 'active' ? 'default' : 'secondary'}
        className={agent.status === 'active' ? 'bg-status-success/20 text-status-success' : ''}
      >
        {agent.status}
      </Badge>
    );
  };

  return (
    <Card className={`bg-card border-border hover:border-accent/30 transition-colors ${isPending ? 'opacity-80' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={agent.profile?.avatar_url || undefined} />
              <AvatarFallback className={`font-medium ${isPending ? 'bg-amber-500/20 text-amber-500' : 'bg-accent/20 text-accent'}`}>
                {getInitials(agent.profile?.full_name, agent.phone || agent.profile?.phone, agent.email || agent.profile?.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-foreground">
                {agent.profile?.full_name || agent.phone || agent.email || 'Unknown'}
              </h3>
              {getStatusBadge()}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPending ? (
                <DropdownMenuItem onClick={cancelInvitation} disabled={updating} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancel Invitation
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={toggleStatus} disabled={updating}>
                  {agent.status === 'active' ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          {(agent.profile?.phone || agent.phone) && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{agent.profile?.phone || agent.phone}</span>
            </div>
          )}
          {(agent.profile?.email || agent.email) && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="truncate">{agent.profile?.email || agent.email}</span>
            </div>
          )}
        </div>

        {/* Performance stats - only show for active agents */}
        {!isPending && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Leads</p>
            </div>
            <div>
              <p className="text-lg font-bold text-status-success">0</p>
              <p className="text-xs text-muted-foreground">Closed</p>
            </div>
            <div>
              <p className="text-lg font-bold text-accent">0%</p>
              <p className="text-xs text-muted-foreground">Rate</p>
            </div>
          </div>
        )}

        {isPending && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Waiting for agent to sign up...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentPerformanceCard;
