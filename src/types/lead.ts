export type LeadStatus = 
  | 'new' 
  | 'contacted' 
  | 'site-visit-scheduled' 
  | 'site-visit-completed' 
  | 'negotiation' 
  | 'closed' 
  | 'lost';

export type PropertyType = 'plot' | 'flat' | 'villa' | 'commercial';

export type LeadSource = 
  | 'portal' 
  | 'referral' 
  | 'walk-in' 
  | 'social-media' 
  | 'web-form' 
  | 'whatsapp' 
  | 'facebook' 
  | 'other';

export type LeadTemperature = 'hot' | 'warm' | 'cold';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  propertyType: PropertyType;
  propertyTypes: PropertyType[];
  budgetMin: number;
  budgetMax: number;
  locationPreference: string;
  source: LeadSource;
  assignedAgentId: string;
  status: LeadStatus;
  followUpDate?: string | null;
  followUpTime?: string | null;
  notes: string;
  tags: string[];
  temperature: LeadTemperature;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: 'call' | 'note' | 'status-change' | 'meeting' | 'email' | 'follow-up';
  description: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
  createdBy: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'independent' | 'venture-agent';
  ventureId?: string;
  isActive: boolean;
}

export interface Venture {
  id: string;
  name: string;
  logo?: string;
  adminId: string;
  createdAt: string;
}

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  'new': { label: 'New', color: 'text-status-new', bgColor: 'bg-status-new/10' },
  'contacted': { label: 'Contacted', color: 'text-status-contacted', bgColor: 'bg-status-contacted/10' },
  'site-visit-scheduled': { label: 'Site Visit Scheduled', color: 'text-status-site-visit', bgColor: 'bg-status-site-visit/10' },
  'site-visit-completed': { label: 'Site Visit Done', color: 'text-status-site-visit', bgColor: 'bg-status-site-visit/10' },
  'negotiation': { label: 'Negotiation', color: 'text-status-negotiation', bgColor: 'bg-status-negotiation/10' },
  'closed': { label: 'Closed', color: 'text-status-closed', bgColor: 'bg-status-closed/10' },
  'lost': { label: 'Lost', color: 'text-status-lost', bgColor: 'bg-status-lost/10' },
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  'plot': 'Plot',
  'flat': 'Flat',
  'villa': 'Villa',
  'commercial': 'Commercial',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  'portal': 'Property Portal',
  'referral': 'Referral',
  'walk-in': 'Walk-in',
  'social-media': 'Social Media',
  'web-form': 'Web Form',
  'whatsapp': 'WhatsApp',
  'facebook': 'Facebook',
  'other': 'Other',
};
