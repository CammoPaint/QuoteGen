export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'standard' | 'sales_agent' | 'sales_manager';
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'standard';
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
  invitedByName: string;
  companyId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  address: string;
  phoneNumber: string;
  emailAddress: string;
  notes: string;
  attachments: Attachment[];
  customerType: 'lead' | 'customer';
  // Optional website for both leads and customers
  website?: string;
  // Lead-specific fields (required when customerType === 'lead')
  displayId?: string;
  industry?: string;
  source?: 'website' | 'referral' | 'cold_outreach' | 'social_media' | 'other';
  status?: 'new' | 'contacted' | 'discovery_call_booked' | 'quote_sent' | 'closed_won' | 'closed_lost';
  assignedToUserId?: string;
  assignedToUserName?: string;
  createdByUserId?: string;
  createdByUserName?: string;
  value?: number;
  nextFollowUp?: string;
  // For compatibility when using as a lead (emailAddress and phoneNumber are the primary fields)
  contactEmail?: string;
  contactPhone?: string;
  // Legacy assignment fields (deprecated)
  assignedTo?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface Solution {
  id: string;
  title: string;
  prompt: string;
  description: string;
  isActive: boolean;
  updatedAt: string;
  // Additional fields for solutions display
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  benefitList?: {
    title?: string;
    description?: string;
    benefits?: Array<{
      title: string;
      description: string;
      imageUrl?: string;
    }>;
  };
  featureList?: {
    title?: string;
    description?: string;
    features?: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
  };
  cta?: {
    title?: string;
    description?: string;
    buttonText?: string;
    highlightedText?: string;
  };
}

export interface ScopeItem {
  id: string;
  feature: string;
  description: string;
  items?: Array<{
    itemName: string;
    description: string;
  }>;
  estimatedHours: number;
  estimatedCost: number;
}

export interface Quote {
  id: string; // This should be the Firestore document ID
  displayId: string; // This is the sequential display ID
  customerId: string;
  projectOverview: string;
  timeFrame: string;
  scopeOfWork: ScopeItem[];
  hourlyRate: number;
  totalEstimatedCost: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  mockupUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  customerId?: string;
  customerName?: string;
  quoteId?: string;
  title: string;
  description: string;
  taskType: 'email' | 'phone' | 'meeting' | 'other';
  assignedToUserId: string;
  assignedToUserName: string;
  createdByUserId?: string;
  createdByUserName?: string;
  dateCreated: string;
  dateDue: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface QuoteGenerationRequest {
  companyName: string;
  projectDescription: string;
  hourlyRate?: number;
}

export interface QuoteGenerationResponse {
  projectOverview: string;
  timeFrame: string;
  scopeOfWork: Omit<ScopeItem, 'id'>[];
  hourlyRate: number;
  totalEstimatedCost: number;
}

export interface MockupGenerationResponse {
  success: boolean;
  mockupUrl: string;
  timestamp: string;
}

export interface MockupGenerationRequest {
  quoteData: any;
  quoteId: string;
  companyName: string;
}



export interface Commission {
  id: string;
  agentId: string;
  agentName: string;
  customerId: string; // Changed from leadId to customerId
  quoteId: string;
  dealValue: number;
  commissionAmount: number;
  commissionType: 'one_time' | 'recurring';
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  month?: string; // For recurring commissions
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  leads: Customer[];
}

export interface Deal {
  id: string;
  title: string;
  pipelineStage: 'New' | 'Contacted' | 'Quoted' | 'Review' | 'Won' | 'Lost';
  customerId: string;
  userId: string;
  contactName: string;
  contactEmail: string;
  dealValue?: number;
  currency: string;
  createdDate: string; // YYYY-MM-DD
  expectedCloseDate?: string; // YYYY-MM-DD
  notes?: string;
  status: 'Open' | 'Won' | 'Lost';
  lossReason?: string | null;
}