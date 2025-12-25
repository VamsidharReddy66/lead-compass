import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { LEAD_STATUS_CONFIG } from '@/types/lead';

/* =====================
   TYPES
===================== */
export type PropertyType = 'plot' | 'flat' | 'villa' | 'commercial';

export interface DbLead {
  id: string;
  name: string;
  phone: string;
  email: string | null;

  // ✅ MULTI PROPERTY TYPES
  property_types: PropertyType[];

  budget_min: number;
  budget_max: number;
  location_preference: string | null;

  source:
    | 'portal'
    | 'referral'
    | 'walk-in'
    | 'social-media'
    | 'web-form'
    | 'whatsapp'
    | 'facebook'
    | 'other';

  assigned_agent_id: string;
  venture_id: string | null;

  status:
    | 'new'
    | 'contacted'
    | 'site-visit-scheduled'
    | 'site-visit-completed'
    | 'negotiation'
    | 'closed'
    | 'lost';

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

  // ✅ MULTI PROPERTY TYPES
  property_types?: PropertyType[];

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

/* =====================
   VALID STATUS GUARD
===================== */
const VALID_STATUSES: DbLead['status'][] = [
  'new',
  'contacted',
  'site-visit-scheduled',
  'site-visit-completed',
  'negotiation',
  'closed',
  'lost',
];

/* =====================
   HOOK
===================== */
export const useLeads = () => {
  const { user } = useAuth();

  const [leads, setLeads] = useState<DbLead[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------------
     FETCH
  ---------------------- */
  const fetchLeads = async () => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map database response to ensure property_types is present
      const mappedData = (data ?? []).map((item: any) => ({
        ...item,
        property_types: item.property_types || (item.property_type ? [item.property_type] : []),
      })) as DbLead[];
      setLeads(mappedData);
    } catch (err) {
      console.error('Error fetching leads:', err);
      toast.error('Failed to load leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------
     CREATE
  ---------------------- */
  const createLead = async (input: CreateLeadInput) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...input,
          assigned_agent_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const mappedData = {
        ...data,
        property_types: (data as any).property_types || ((data as any).property_type ? [(data as any).property_type] : []),
      } as DbLead;
      setLeads((prev) => [mappedData, ...prev]);

      // Activity
      await supabase.from('activities').insert({
        lead_id: data.id,
        agent_id: user.id,
        activity_type: 'lead_created',
        description: 'Lead created',
        previous_value: null,
        new_value: data.status ?? 'new',
        meeting_id: null,
      });

      toast.success('Lead created successfully');
      return data;
    } catch (err) {
      console.error('Create lead error:', err);
      toast.error('Failed to create lead');
      return null;
    }
  };

  /* ---------------------
     UPDATE (PIPELINE + DETAIL PANEL SAFE)
  ---------------------- */
  const updateLead = async (id: string, updates: Partial<CreateLeadInput>) => {
    if (!user) return null;

    if (updates.status && !VALID_STATUSES.includes(updates.status)) {
      toast.error('Invalid lead status');
      return null;
    }

    const previousLead = leads.find((l) => l.id === id);

    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const mappedData = {
        ...data,
        property_types: (data as any).property_types || ((data as any).property_type ? [(data as any).property_type] : []),
      } as DbLead;
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? mappedData : l))
      );

      /* ✅ STATUS CHANGE ACTIVITY (CAPITAL LABELS ONLY) */
      if (
        updates.status &&
        previousLead &&
        previousLead.status !== updates.status
      ) {
        const fromLabel = LEAD_STATUS_CONFIG[previousLead.status].label;
        const toLabel = LEAD_STATUS_CONFIG[updates.status].label;

        await supabase.from('activities').insert({
          lead_id: id,
          agent_id: user.id,
          activity_type: 'status_change',
          description: `Status changed from ${fromLabel} to ${toLabel}`,
          previous_value: previousLead.status,
          new_value: updates.status,
          meeting_id: null,
        });
      }

      toast.success('Lead updated successfully');
      return data;
    } catch (err) {
      console.error('Update lead error:', err);
      toast.error('Failed to update lead');
      return null;
    }
  };

  /* ---------------------
     DELETE
  ---------------------- */
  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;

      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success('Lead deleted successfully');
      return true;
    } catch (err) {
      console.error('Delete lead error:', err);
      toast.error('Failed to delete lead');
      return false;
    }
  };

  /* ---------------------
     MERGE LEADS
  ---------------------- */
  const mergeLeads = async (keepLeadId: string, deleteLeadIds: string[]) => {
    if (!user) return false;

    try {
      // Delete the duplicate leads (keeping the selected one)
      for (const id of deleteLeadIds) {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) throw error;
      }

      setLeads((prev) => prev.filter((l) => !deleteLeadIds.includes(l.id)));

      // Log activity for the kept lead
      await supabase.from('activities').insert({
        lead_id: keepLeadId,
        agent_id: user.id,
        activity_type: 'merge',
        description: `Merged ${deleteLeadIds.length} duplicate lead(s) into this record`,
        previous_value: null,
        new_value: null,
        meeting_id: null,
      });

      toast.success(`Merged ${deleteLeadIds.length} duplicate(s) successfully`);
      return true;
    } catch (err) {
      console.error('Merge leads error:', err);
      toast.error('Failed to merge leads');
      return false;
    }
  };

  /* ---------------------
     SEARCH
  ---------------------- */
  const searchLeads = useCallback(
    async (query: string) => {
      if (!user || !query.trim()) return [];

      try {
        const { data } = await supabase
          .from('leads')
          .select('id, name, phone, email')
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(10);

        return data || [];
      } catch {
        return [];
      }
    },
    [user]
  );

  /* ---------------------
     EFFECTS
  ---------------------- */
  useEffect(() => {
    fetchLeads();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          const newLead = payload.new as any;
          const mappedLead = {
            ...newLead,
            property_types: newLead.property_types || (newLead.property_type ? [newLead.property_type] : []),
          } as DbLead;
          setLeads((prev) => {
            if (prev.some((l) => l.id === mappedLead.id)) return prev;
            return [mappedLead, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads' },
        (payload) => {
          const updated = payload.new as any;
          const mappedLead = {
            ...updated,
            property_types: updated.property_types || (updated.property_type ? [updated.property_type] : []),
          } as DbLead;
          setLeads((prev) =>
            prev.map((l) => (l.id === mappedLead.id ? mappedLead : l))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'leads' },
        (payload) => {
          const deleted = payload.old as { id: string };
          setLeads((prev) => prev.filter((l) => l.id !== deleted.id));
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
    mergeLeads,
    searchLeads,
    refetch: fetchLeads,
  };
};
