import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DbLead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  property_type: 'plot' | 'flat' | 'villa' | 'commercial';
  budget_min: number;
  budget_max: number;
  location_preference: string | null;
  source: 'portal' | 'referral' | 'walk-in' | 'social-media' | 'web-form' | 'whatsapp' | 'facebook' | 'other';
  assigned_agent_id: string;
  venture_id: string | null;
  status: 'new' | 'contacted' | 'site-visit-scheduled' | 'site-visit-completed' | 'negotiation' | 'closed' | 'lost';
  follow_up_date: string | null;
  follow_up_time: string | null;
  notes: string | null;
  tags: string[];
  temperature: 'hot' | 'warm' | 'cold';
  created_at: string;
  updated_at: string;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  property_type?: DbLead['property_type'];
  budget_min?: number;
  budget_max?: number;
  location_preference?: string;
  source?: DbLead['source'];
  venture_id?: string;
  status?: DbLead['status'];
  follow_up_date?: string;
  follow_up_time?: string;
  notes?: string;
  tags?: string[];
  temperature?: DbLead['temperature'];
}

export const useLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<DbLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const createLead = async (input: CreateLeadInput) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...input,
        assigned_agent_id: user.id,
      })
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
      return null;
    }

    toast.success('Lead created successfully');
    return data;
  };

  const updateLead = async (id: string, updates: Partial<CreateLeadInput>) => {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
      return null;
    }

    toast.success('Lead updated successfully');
    return data;
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      if (import.meta.env.DEV) console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
      return false;
    }

    toast.success('Lead deleted successfully');
    return true;
  };

  const searchLeads = useCallback(async (query: string) => {
    if (!user || !query.trim()) return [];
    
    // Sanitize input to escape SQL pattern characters
    const sanitizeForLike = (str: string) => {
      return str
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/%/g, '\\%')    // Escape percent signs
        .replace(/_/g, '\\_');   // Escape underscores
    };
    
    const searchTerm = sanitizeForLike(query.trim().toLowerCase());
    
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, phone, email')
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      if (import.meta.env.DEV) console.error('Error searching leads:', error);
      return [];
    }

    return data || [];
  }, [user]);

  useEffect(() => {
    fetchLeads();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    leads,
    loading,
    createLead,
    updateLead,
    deleteLead,
    searchLeads,
    refetch: fetchLeads,
  };
};