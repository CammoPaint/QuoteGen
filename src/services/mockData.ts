import { Customer, Quote, Task } from '../types';

export const mockCustomers: Customer[] = [
  {
    id: '1',
    companyName: 'Tech Innovations Inc',
    contactName: 'Sarah Johnson',
    address: '123 Innovation Drive, San Francisco, CA 94105',
    phoneNumber: '+1 (555) 123-4567',
    emailAddress: 'sarah.johnson@techinnovations.com',
    notes: 'Key client for enterprise solutions. Interested in AI-powered applications.',
    attachments: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    companyName: 'Creative Design Studio',
    contactName: 'Mike Chen',
    address: '456 Design Avenue, New York, NY 10001',
    phoneNumber: '+1 (555) 987-6543',
    emailAddress: 'mike@creativedesign.com',
    notes: 'Specializes in branding and web design. Looking for e-commerce solutions.',
    attachments: [],
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: '3',
    companyName: 'StartupXYZ',
    contactName: 'Emily Rodriguez',
    address: '789 Startup Blvd, Austin, TX 78701',
    phoneNumber: '+1 (555) 456-7890',
    emailAddress: 'emily@startupxyz.com',
    notes: 'Early-stage startup in fintech. Need MVP development.',
    attachments: [],
    createdAt: '2024-02-01T09:15:00Z',
    updatedAt: '2024-02-01T09:15:00Z'
  }
];

export const mockQuotes: Quote[] = [
  {
    id: '1',
    customerId: '1',
    projectOverview: 'Development of an AI-powered customer service chatbot platform',
    timeFrame: '12-16 weeks',
    scopeOfWork: [
      {
        id: '1',
        feature: 'User Authentication System',
        description: 'Secure login/logout with role-based access control',
        estimatedHours: 40,
        estimatedCost: 4000
      },
      {
        id: '2',
        feature: 'AI Chatbot Engine',
        description: 'Natural language processing and response generation',
        estimatedHours: 80,
        estimatedCost: 8000
      },
      {
        id: '3',
        feature: 'Admin Dashboard',
        description: 'Analytics, user management, and system configuration',
        estimatedHours: 60,
        estimatedCost: 6000
      }
    ],
    hourlyRate: 100,
    totalEstimatedCost: 18000,
    status: 'sent',
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-16T11:00:00Z'
  }
];

export const mockTasks: Task[] = [
  {
    id: '1',
    customerId: '1',
    quoteId: '1',
    title: 'Follow up on quote approval',
    description: 'Contact Sarah Johnson regarding the AI chatbot project quote',
    taskType: 'email',
    assignedTo: 'John Doe',
    assignedToId: '1',
    dateCreated: '2024-01-17T10:00:00Z',
    dateDue: '2024-01-19T17:00:00Z',
    status: 'pending',
    priority: 'high'
  },
  {
    id: '2',
    customerId: '2',
    title: 'Initial consultation call',
    description: 'Discuss project requirements for e-commerce platform',
    taskType: 'phone',
    assignedTo: 'John Doe',
    assignedToId: '1',
    dateCreated: '2024-01-21T09:00:00Z',
    dateDue: '2024-01-22T15:00:00Z',
    status: 'completed',
    priority: 'medium'
  },
  {
    id: '3',
    customerId: '3',
    title: 'Project kickoff meeting',
    description: 'Meet with Emily to finalize MVP requirements',
    taskType: 'meeting',
    assignedTo: 'John Doe',
    assignedToId: '1',
    dateCreated: '2024-02-02T08:00:00Z',
    dateDue: '2024-02-05T10:00:00Z',
    status: 'in-progress',
    priority: 'high'
  }
];