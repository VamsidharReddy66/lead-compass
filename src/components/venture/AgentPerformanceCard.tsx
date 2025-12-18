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
import { MoreVertical, Mail, Phone, UserX, UserCheck, TrendingUp } from 'lucide-react';
import { VentureAgent } from '@/hooks/useVentureAgents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgentPerformanceCardProps {
  agent: VentureAgent;
  onUpdate: () => void;
}

const AgentPerformanceCard = ({ agent, onUpdate }: AgentPerformanceCardProps) => {
  const [updating, setUpdating] = useState(false);

  const toggleStatus = async () => {
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

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="bg-card border-border hover:border-accent/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={agent.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-accent/20 text-accent font-medium">
                {getInitials(agent.profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-foreground">
                {agent.profile?.full_name || 'Unknown'}
              </h3>
              <Badge 
                variant={agent.status === 'active' ? 'default' : 'secondary'}
                className={agent.status === 'active' ? 'bg-status-success/20 text-status-success' : ''}
              >
                {agent.status}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          {agent.profile?.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="truncate">{agent.profile.email}</span>
            </div>
          )}
          {agent.profile?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{agent.profile.phone}</span>
            </div>
          )}
        </div>

        {/* Performance stats placeholder */}
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
      </CardContent>
    </Card>
  );
};

export default AgentPerformanceCard;
