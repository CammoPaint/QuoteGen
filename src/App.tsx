import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { LoginForm } from './components/Auth/LoginForm';
import { SignUpForm } from './components/Auth/SignUpForm';
import { DashboardStats } from './components/Dashboard/DashboardStats';
// import { RecentActivity } from './components/Dashboard/RecentActivity';
import { QuickActions } from './components/Dashboard/QuickActions';
import { TodaysTasks } from './components/Dashboard/TodaysTasks';
import { CustomerList } from './components/Customers/CustomerList';
import { CustomerForm } from './components/Customers/CustomerForm';
import { CustomerDetails } from './components/Customers/CustomerDetails';
import { QuoteGenerator } from './components/Quotes/QuoteGenerator';
import { QuoteViewer } from './components/Quotes/QuoteViewer';
import { customerService } from './services/customerService';
import { TaskList } from './components/Tasks/TaskList';
import { TaskForm } from './components/Tasks/TaskForm';
import { UserManagementPage } from './components/Admin/UserManagementPage';
import { InvitationAcceptancePage } from './components/Auth/InvitationAcceptancePage';
import { SettingsPage } from './components/Settings/SettingsPage';
import { LeadManagement } from './components/Sales/LeadManagement';
import { LeadDetails } from './components/Sales/LeadDetails';
import LeadSearch from './components/Sales/LeadSearch';
import { SalesPipeline } from './components/Sales/SalesPipeline';
import { CommissionTracker } from './components/Sales/CommissionTracker';
import { useCustomers } from './hooks/useCustomers';
import { useQuotes } from './hooks/useQuotes';
import { quoteService } from './services/quoteService';
import { useTasks } from './hooks/useTasks';
import { useCommissions } from './hooks/useCommissions';
import { useUsers } from './hooks/useUsers';
import { Customer, Quote, Task } from './types';
import { Filter, ChevronDown } from 'lucide-react';

// Simple router to handle invitation acceptance
const getRouteFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  if (window.location.pathname === '/accept-invitation' && token) {
    return { route: 'accept-invitation', token };
  }
  
  return { route: 'app', token: null };
};

// Wrapper component to handle customer loading for quotes
interface QuoteViewerWrapperProps {
  quote: Quote;
  customers: Customer[];
  onEdit: (quote: Quote) => void;
  onDelete: (quoteId: string) => void;
  onClose: () => void;
}

const QuoteViewerWrapper: React.FC<QuoteViewerWrapperProps> = ({
  quote,
  customers,
  onEdit,
  onDelete,
  onClose
}) => {
  const [customer, setCustomer] = useState<Customer | undefined>(
    customers.find(c => c.id === quote.customerId)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to find customer in the provided list first
    const foundCustomer = customers.find(c => c.id === quote.customerId);
    if (foundCustomer) {
      setCustomer(foundCustomer);
      return;
    }

    // If not found, try to fetch it directly
    const fetchCustomer = async () => {
      if (!quote.customerId) return;
      
      setLoading(true);
      try {
        const fetchedCustomer = await customerService.getCustomerById(quote.customerId);
        if (fetchedCustomer) {
          setCustomer(fetchedCustomer);
        }
      } catch (error) {
        console.error('Error fetching customer for quote:', error);
        // Create a fallback customer object with minimal info
        setCustomer({
          id: quote.customerId,
          companyName: 'Unknown Company',
          contactName: 'Unknown Contact',
          emailAddress: '',
          phoneNumber: '',
          address: '',
          notes: '',
          attachments: [],
          customerType: 'customer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [quote.customerId, customers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        <p className="ml-4 text-gray-600">Loading customer information...</p>
      </div>
    );
  }

  return (
    <QuoteViewer
      quote={quote}
      customer={customer}
      onEdit={onEdit}
      onDelete={onDelete}
      onClose={onClose}
    />
  );
};

const AppContent: React.FC = () => {
  // Early route check: if accepting an invitation, avoid loading any app data hooks
  const currentRoute = getRouteFromUrl();
  if (currentRoute.route === 'accept-invitation' && currentRoute.token) {
    const handleInvitationAccepted = () => {
      // Return to app root after acceptance
      window.history.replaceState({}, '', '/');
      window.location.reload();
    };
    return (
      <InvitationAcceptancePage
        token={currentRoute.token}
        onAcceptComplete={handleInvitationAccepted}
      />
    );
  }

  const { user, loading } = useAuth();
  
  // All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(true);

  
  // Firestore hooks for data management
  const { customers, addCustomer, updateCustomer } = useCustomers();
  const { quotes, loading: quotesLoading, addQuote, updateQuote, deleteQuote, setFilterUserId } = useQuotes();
  const { tasks, addTask, updateTask, deleteTask, getTodaysTasks } = useTasks();
  const { markCommissionAsPaid } = useCommissions();
  const { loading: usersLoading, getAvailableUsers, getUserName } = useUsers();
  
  // Modal states
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerFormType, setCustomerFormType] = useState<'customer' | 'lead'>('customer');
  const [showQuoteGenerator, setShowQuoteGenerator] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  // Removed unused selectedLead and selectedCommission state
  
  // User selector states for quotes
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);


  // Initialize selectedUser when user is available
  useEffect(() => {
    if (user?.id && !selectedUser) {
      if (user.role === 'admin' || user.role === 'sales_manager') {
        // Default to "All Users" for admins and managers
        setSelectedUser('all');
      } else {
        // Default to own user for standard users
        setSelectedUser(user.id);
      }
    }
  }, [user?.id, user?.role, selectedUser]);

  // Handle filtering based on selected user and role for quotes
  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin' || user.role === 'sales_manager') {
      console.log('Admin/Manager setting quotes filter to:', selectedUser === 'all' ? 'all users' : selectedUser);
      // If 'all' is selected, pass undefined to show all users
      setFilterUserId(selectedUser === 'all' ? undefined : selectedUser);
    } else {
      // Non-admin users can only see their own quotes
      console.log('Standard user, filtering to own quotes:', user.id);
      setFilterUserId(user.id);
      setSelectedUser(user.id);
    }
  }, [user, selectedUser, setFilterUserId]);

  // Update quotes filter when selectedUser changes
  useEffect(() => {
    if (selectedUser && selectedUser !== 'all') {
      setFilterUserId(selectedUser);
    } else {
      setFilterUserId(undefined);
    }
  }, [selectedUser, setFilterUserId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen) {
        const target = event.target as Element;
        // Check if the click is outside the dropdown container
        if (!target.closest('.user-dropdown-container')) {
          setUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Ensure non-admins don't land on admin-only tabs (e.g., after role change or login)
  useEffect(() => {
    if (user && user.role !== 'admin' && activeTab === 'users') {
      setActiveTab('dashboard');
    }
  }, [user?.role, activeTab]);

  const getSelectedUserName = () => {
    if (selectedUser === 'all') {
      return 'All Users';
    }
    const userName = getUserName(selectedUser);
    console.log('Getting selected user name (Quotes):', { selectedUser, userName, availableUsers: getAvailableUsers().length });
    return userName || 'Select User';
  };

  // Now we can do conditional returns after all hooks have been called

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        {showLogin ? (
          <LoginForm onToggleMode={() => setShowLogin(false)} />
        ) : (
          <SignUpForm onToggleMode={() => setShowLogin(true)} />
        )}
      </div>
    );
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-customer':
        setShowCustomerForm(true);
        break;
      case 'new-quote':
        setShowQuoteGenerator(true);
        break;
      case 'new-task':
        setShowTaskForm(true);
        break;
    }
  };

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (selectedCustomer) {
        // Edit existing customer
        await updateCustomer(selectedCustomer.id, customerData);
      } else {
        // Add new customer
        await addCustomer(customerData);
      }
      setShowCustomerForm(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error saving customer:', error);
      // Handle error (show toast, etc.)
    }
  };

  const handleSaveQuote = async (quote: Quote) => {
    try {
      if (selectedQuote) {
        // Edit existing quote
        await updateQuote(selectedQuote.id, quote);
        // The useQuotes hook will update the quotes array, so we need to find the updated quote
        const updatedQuote = { ...quote, id: selectedQuote.id, updatedAt: new Date().toISOString() };
        setSelectedQuote(updatedQuote);
        return updatedQuote;
      } else {
        // Add new quote and return object with id
        const newId = await addQuote(quote);
        const createdQuote = { ...quote, id: newId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Quote;
        setSelectedQuote(createdQuote);
        return createdQuote;
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      // Handle error (show toast, etc.)
      throw error;
    }
  };

  const handleSaveTask = (task: any) => {
    if (selectedTask) {
      updateTask(selectedTask.id, task);
    } else {
      addTask(task);
    }
    setShowTaskForm(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    setShowTaskForm(false);
    setSelectedTask(null);
  };  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardStats />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TodaysTasks 
                  tasks={getTodaysTasks()} 
                  onTaskClick={(task) => {
                    setSelectedTask(task);
                    setShowTaskForm(true);
                  }}
                />
              </div>
              <div className="space-y-6">
                <QuickActions onAction={handleQuickAction} />
              </div>
            </div>
          </div>
        );
      case 'customers':
        return (
          <CustomerList
            customers={customers}
            onCustomerSelect={(customer) => {
              setSelectedCustomer(customer);
              setCustomerFormType('customer');
              setShowCustomerForm(true);
            }}
            onAddCustomer={() => {
              setSelectedCustomer(null);
              setCustomerFormType('customer');
              setShowCustomerForm(true);
            }}
            onCustomerDetails={(customer) => {
              setSelectedCustomerId(customer.id);
              setActiveTab('customer-details');
            }}
          />
        );
      case 'quotes':
        console.log('Quotes tab rendered with:', { 
          quotes, 
          quotesLoading, 
          user, 
          selectedUser,
          quotesLength: quotes?.length 
        });
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Quotes</h2>
                <p className="text-gray-600">Manage and track your project quotes</p>
              </div>
              <div className="flex items-center space-x-4">
                {getAvailableUsers().length > 1 && (
                  <div className="flex items-center space-x-2 relative user-dropdown-container">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(!userDropdownOpen);
                        }}
                        className="flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:ring-2 focus:ring-brand focus:border-transparent"
                      >
                        <span>{getSelectedUserName()}</span>
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </button>
                      {userDropdownOpen && (
                        <div className="absolute z-10 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {(user?.role === 'admin' || user?.role === 'sales_manager') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Selecting All Users for quotes');
                                setSelectedUser('all');
                                setUserDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedUser === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                            >
                              <div className="font-medium">All Users</div>
                              <div className="text-xs text-gray-500">View quotes from all team members</div>
                            </button>
                          )}
                          {(user?.role === 'admin' || user?.role === 'sales_manager') && getAvailableUsers().length > 0 && (
                            <div className="border-t border-gray-200 my-1"></div>
                          )}
                          {getAvailableUsers().map(u => (
                            <button
                              key={u.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Selecting user for quotes:', u.name, u.id);
                                setSelectedUser(u.id);
                                setUserDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedUser === u.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                            >
                              <div className="font-medium">{u.name}</div>
                              <div className="text-xs text-gray-500">{u.email} • {u.role}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="text-sm text-gray-600">Total Quotes: {quotes.length}</div>
                <button
                  onClick={() => setShowQuoteGenerator(true)}
                  className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors"
                >
                  Generate Quote
                </button>
              </div>
            </div>
            {quotesLoading || usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading quotes...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quotes.map((quote) => {
                  const customer = customers.find(c => c.id === quote.customerId);
                  return (
                    <div
                      key={quote.id}
                      onClick={() => {
                        setSelectedQuote(quote);
                        setActiveTab('quote-details');
                      }}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{customer?.companyName}</h3>
                          <p className="text-sm text-gray-600">{quote.projectOverview}</p>
                          <p className="text-lg font-semibold text-[#34A853] mt-2">
                            ${quote.totalEstimatedCost.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            quote.status === 'approved' ? 'bg-green-100 text-green-800' :
                            quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {quote.status}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(quote.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'tasks':
        return (
          <TaskList
            tasks={tasks}
            onTaskSelect={(task) => {
              setSelectedTask(task);
              setShowTaskForm(true);
            }}
            onAddTask={() => {
              setSelectedTask(null);
              setShowTaskForm(true);
            }}
          />
        );
      case 'users':
        return user.role === 'admin' ? (
          <UserManagementPage />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this feature.</p>
          </div>
        );
      case 'quote-details':
        return selectedQuote ? (
          <QuoteViewerWrapper
            quote={selectedQuote}
            customers={customers}
            onEdit={handleSaveQuote}
            onDelete={async (quoteId) => {
              await deleteQuote(quoteId);
              setSelectedQuote(null);
              setActiveTab('quotes');
            }}
            onClose={() => {
              setSelectedQuote(null);
              setActiveTab('quotes');
            }}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote Not Found</h2>
            <p className="text-gray-600">The requested quote could not be found.</p>
          </div>
        );
      case 'leads':
        return (
          <LeadManagement
            onViewLead={() => {}}
            onAddCustomer={() => {
              setSelectedCustomer(null);
              setCustomerFormType('lead');
              setShowCustomerForm(true);
            }}
            onViewLeadDetails={(lead) => {
              setSelectedLeadId(lead.id);
              setActiveTab('lead-details');
            }}
          />
        );
      case 'lead-details':
        return selectedLeadId ? (
          <LeadDetails
            leadId={selectedLeadId}
            onBack={() => {
              setSelectedLeadId(null);
              setActiveTab('leads');
            }}
            onAddQuote={() => {
              // Handle adding quote for this lead
              setActiveTab('quotes');
            }}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lead Not Found</h2>
            <p className="text-gray-600">The requested lead could not be found.</p>
          </div>
        );
      case 'lead-search':
        return (
          <LeadSearch />
        );
      case 'pipeline':
        return (
          <SalesPipeline />
        );
      case 'commissions':
        return (
          <CommissionTracker
            onViewCommission={() => {}}
            onMarkAsPaid={(commissionId) => {
              markCommissionAsPaid(commissionId);
            }}
          />
        );
      case 'customer-details':
        return selectedCustomerId ? (
          <CustomerDetails
            customerId={selectedCustomerId}
            onBack={() => {
              setSelectedCustomerId(null);
              setActiveTab('customers');
            }}
            onAddQuote={() => {
              // Handle adding quote for this customer
              setActiveTab('quotes');
            }}
            onQuoteClick={(quote) => {
              setSelectedQuote(quote);
              setActiveTab('quote-details');
            }}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Not Found</h2>
            <p className="text-gray-600">The requested customer could not be found.</p>
          </div>
        );
      case 'settings':
        return <SettingsPage userRole={user.role} />;
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
            <p className="text-gray-600">This feature is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          userRole={user.role}
        />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>

      {/* Modals */}
      {showCustomerForm && (
        <CustomerForm
          customer={selectedCustomer || undefined}
          initialType={customerFormType}
          onSave={handleSaveCustomer}
          onCancel={() => {
            setShowCustomerForm(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {showQuoteGenerator && (
        <QuoteGenerator
          customers={customers}
          onQuoteGenerated={async (quote) => {
            try {
              const newId = await addQuote(quote);
              // Fetch full quote so displayId is present
              const full = await quoteService.getQuoteById(newId);
              if (full) {
                setSelectedQuote(full);
                setActiveTab('quote-details');
              }
            } finally {
              setShowQuoteGenerator(false);
            }
          }}
          onClose={() => setShowQuoteGenerator(false)}
        />
      )}



      {showTaskForm && (
        <TaskForm
          task={selectedTask || undefined}
          onSave={handleSaveTask}
          onDelete={selectedTask ? handleDeleteTask : undefined}
          onCancel={() => {
            setShowTaskForm(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;