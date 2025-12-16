import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface VentureAgent {
  id: string;
  agent_id: string;
  venture_id: string;
  status: string;
  invited_at: string;
  joined_at: string | null;
  profile?: {
    email: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
}

export const useVentureAgents = () => {
  const { userRole } = useAuth();
  const [agents, setAgents] = useState<VentureAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    if (!userRole?.venture_id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch venture agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('venture_agents')
        .select('*')
        .eq('venture_id', userRole.venture_id);

      if (agentsError) throw agentsError;

      // Fetch profiles for each agent
      const agentsWithProfiles = await Promise.all(
        (agentsData || []).map(async (agent) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email, full_name, phone, avatar_url')
            .eq('id', agent.agent_id)
            .maybeSingle();

          return {
            ...agent,
            profile: profileData || undefined
          };
        })
      );
      
      setAgents(agentsWithProfiles);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [userRole?.venture_id]);

  return { agents, loading, refetch: fetchAgents };
};
