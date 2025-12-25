import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadCard from '@/components/leads/LeadCard';
import LeadDetailPanel from '@/components/leads/LeadDetailPanel';
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import { useLeads, DbLead, CreateLeadInput } from '@/hooks/useLeads';
import {
  LeadStatus,
  PropertyType,
  LEAD_STATUS_CONFIG,
  PROPERTY_TYPE_LABELS,
  Lead,
} from '@/types/lead';
import {
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  Plus,
  Loader2,
  Copy,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import DuplicateLeadsDialog from '@/components/leads/DuplicateLeadsDialog';

/* --------------------------------
   DB Lead → UI Lead
   property_types[] → propertyType
--------------------------------- */
const dbLeadToLead = (dbLead: DbLead): Lead => ({
  id: dbLead.id,
  name: dbLead.name,
  phone: dbLead.phone,
  email: dbLead.email || '',
  propertyType: dbLead.property_types?.[0] ?? 'flat',
  propertyTypes: (dbLead.property_types ?? ['flat']) as PropertyType[],
  budgetMin: Number(dbLead.budget_min) || 0,
  budgetMax: Number(dbLead.budget_max) || 0,
  locationPreference: dbLead.location_preference || '',
  source: dbLead.source,
  assignedAgentId: dbLead.assigned_agent_id,
  status: dbLead.status,
  followUpDate: dbLead.follow_up_date,
  followUpTime: dbLead.follow_up_time,
  notes: dbLead.notes || '',
  tags: dbLead.tags || [],
  temperature: dbLead.temperature,
  createdAt: dbLead.created_at,
  updatedAt: dbLead.updated_at,
});

// Helper to format property types as "Plot | Villa"
const formatPropertyTypes = (types: PropertyType[]): string => {
  if (!types || types.length === 0) return 'Flat';
  return types
    .map((t) => PROPERTY_TYPE_LABELS[t] || t)
    .join(' | ');
};

const LeadsPage = () => {
  const { leads: dbLeads, loading, updateLead, mergeLeads } = useLeads();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [propertyFilter, setPropertyFilter] =
    useState<PropertyType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchOpen, setSearchOpen] = useState(false);

  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editLeadData, setEditLeadData] =
    useState<CreateLeadInput | null>(null);

  const leads = useMemo(() => dbLeads.map(dbLeadToLead), [dbLeads]);

  // Keep selectedLead in sync with updated leads data
  useEffect(() => {
    if (selectedLead) {
      const updatedLead = leads.find((l) => l.id === selectedLead.id);
      if (updatedLead) {
        setSelectedLead(updatedLead);
      } else {
        // Lead was deleted
        setSelectedLead(null);
      }
    }
  }, [leads]);

  /* ---------------- FILTER ---------------- */
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || lead.status === statusFilter;

      const matchesProperty =
        propertyFilter === 'all' ||
        lead.propertyType === propertyFilter;

      return matchesSearch && matchesStatus && matchesProperty;
    });
  }, [leads, searchQuery, statusFilter, propertyFilter]);

  /* ------------ STATUS CHANGE ------------ */
  const handleStatusChange = async (
    leadId: string,
    newStatus: LeadStatus
  ) => {
    await updateLead(leadId, {
      status: newStatus as DbLead['status'],
    });
    // No need to manually update selectedLead - it will sync from useEffect above
  };

  /* ------------ EDIT LEAD ------------ */
  const handleEditLead = (lead: Lead) => {
    setDialogMode('edit');
    setEditLeadData({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      property_types: lead.propertyTypes || [lead.propertyType],
      budget_min: lead.budgetMin,
      budget_max: lead.budgetMax,
      location_preference: lead.locationPreference,
      source: lead.source,
      temperature: lead.temperature,
      notes: lead.notes,
    });
    setLeadDialogOpen(true);
  };

  const handleUpdateLead = async (data: CreateLeadInput) => {
    if (!selectedLead) return;
    await updateLead(selectedLead.id, data);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* FILTER BAR */}
      <div className="flex items-center gap-2 mb-4">
        {/* Search Icon / Expandable Search */}
        {searchOpen ? (
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search..."
              className="pl-8 pr-8 h-9 text-sm bg-card border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4" />
          </Button>
        )}

        {/* Filter Button with Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-1.5",
                (statusFilter !== 'all' || propertyFilter !== 'all') && "border-primary text-primary"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {(statusFilter !== 'all' || propertyFilter !== 'all') && (
                <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {(statusFilter !== 'all' ? 1 : 0) + (propertyFilter !== 'all' ? 1 : 0)}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 space-y-3" align="start">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                  className="w-full h-9 px-3 pr-8 rounded-lg border border-border bg-background text-sm appearance-none"
                >
                  <option value="all">All Statuses</option>
                  {Object.entries(LEAD_STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Property Type</label>
              <div className="relative">
                <select
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value as PropertyType | 'all')}
                  className="w-full h-9 px-3 pr-8 rounded-lg border border-border bg-background text-sm appearance-none"
                >
                  <option value="all">All Properties</option>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
              </div>
            </div>
            {(statusFilter !== 'all' || propertyFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={() => {
                  setStatusFilter('all');
                  setPropertyFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </PopoverContent>
        </Popover>

        {/* Find Duplicates */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setDuplicateDialogOpen(true)}
        >
          <Copy className="w-4 h-4" />
        </Button>

        {/* View Toggle */}
        <div className="flex bg-secondary rounded-lg p-0.5 ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5 rounded-md',
              viewMode === 'grid' ? 'bg-card shadow-sm' : 'text-muted-foreground'
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5 rounded-md',
              viewMode === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* LEADS */}
      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-2 gap-3'
            : 'space-y-3'
        )}
      >
        {filteredLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => setSelectedLead(lead)}
          />
        ))}
      </div>

      {/* DETAIL PANEL */}
      {selectedLead && (
        <>
          <div
            className="fixed inset-0 bg-foreground/20 z-40"
            onClick={() => setSelectedLead(null)}
          />
          <LeadDetailPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onStatusChange={handleStatusChange}
          />
        </>
      )}

      {/* ADD / EDIT */}
      <AddLeadDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        mode={dialogMode}
        initialData={editLeadData || undefined}
        onUpdate={handleUpdateLead}
      />

      {/* DUPLICATE LEADS */}
      <DuplicateLeadsDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        leads={leads}
        onLeadClick={setSelectedLead}
        onMerge={mergeLeads}
      />

      {/* FLOATING ADD BUTTON */}
      <Button
        onClick={() => {
          setDialogMode('add');
          setEditLeadData(null);
          setLeadDialogOpen(true);
        }}
        className="fixed bottom-20 right-6 z-30 rounded-full w-14 h-14 shadow-lg"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </DashboardLayout>
  );
};

export default LeadsPage;
