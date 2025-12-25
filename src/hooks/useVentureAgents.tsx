import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface VentureAgent {
  id: string;
  agent_id: string | null;
  venture_id: string;
  status: string;
  email: string | null;
  phone: string | null;
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

      // Fetch profiles for each agent that has an agent_id
      const agentsWithProfiles = await Promise.all(
        (agentsData || []).map(async (agent) => {
          if (agent.agent_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('email, full_name, phone, avatar_url')
              .eq('id', agent.agent_id)
              .maybeSingle();

            return {
              ...agent,
              profile: profileData || undefined
            };
          }
          // For pending invitations, return agent with phone/email from the record
          return {
            ...agent,
            profile: (agent.email || agent.phone) ? { 
              email: agent.email || '', 
              full_name: null, 
              phone: agent.phone, 
              avatar_url: null 
            } : undefined
          };
        })
      );
      
      setAgents(agentsWithProfiles);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [userRole?.venture_id]);

  return { agents, loading, refetch: fetchAgents };
};
