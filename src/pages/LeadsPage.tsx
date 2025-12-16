import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadCard from '@/components/leads/LeadCard';
import LeadDetailPanel from '@/components/leads/LeadDetailPanel';
import { mockLeads } from '@/data/mockData';
import { Lead, LeadStatus, PropertyType, LeadSource, LEAD_STATUS_CONFIG, PROPERTY_TYPE_LABELS, LEAD_SOURCE_LABELS } from '@/types/lead';
import { Search, Filter, X, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const LeadsPage = () => {
  const [leads] = useState<Lead[]>(mockLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [propertyFilter, setPropertyFilter] = useState<PropertyType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesProperty = propertyFilter === 'all' || lead.propertyType === propertyFilter;

      return matchesSearch && matchesStatus && matchesProperty;
    });
  }, [leads, searchQuery, statusFilter, propertyFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPropertyFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || propertyFilter !== 'all';

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">All Leads</h1>
        <p className="text-muted-foreground">Manage and track all your leads in one place.</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="h-10 px-4 pr-10 rounded-lg border border-input bg-background text-sm appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="all">All Statuses</option>
              {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Property Type Filter */}
          <div className="relative">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value as PropertyType | 'all')}
              className="h-10 px-4 pr-10 rounded-lg border border-input bg-background text-sm appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="all">All Properties</option>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* View Toggle */}
          <div className="flex bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'grid'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground">Filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                {LEAD_STATUS_CONFIG[statusFilter].label}
                <button onClick={() => setStatusFilter('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {propertyFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                {PROPERTY_TYPE_LABELS[propertyFilter]}
                <button onClick={() => setPropertyFilter('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredLeads.length} of {leads.length} leads
        </p>
      </div>

      {/* Leads Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredLeads.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No leads found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Lead Detail Panel */}
      {selectedLead && (
        <>
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            onClick={() => setSelectedLead(null)}
          />
          <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
        </>
      )}
    </DashboardLayout>
  );
};

export default LeadsPage;
