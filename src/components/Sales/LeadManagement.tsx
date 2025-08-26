import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Phone, Mail, User, Building, X } from 'lucide-react';
import { Customer } from '../../types';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import UserFilterDropdown from '../Shared/UserFilterDropdown';

interface LeadManagementProps {
  onViewLead: (lead: Customer) => void;
  onViewLeadDetails: (lead: Customer) => void;
  onAddCustomer: () => void;
}

export const LeadManagement: React.FC<LeadManagementProps> = ({
  onViewLead,
  onViewLeadDetails,
  onAddCustomer
}) => {
  const { user } = useAuth();
  const { leads, loading: leadsLoading, error, setFilterUserId } = useLeads();

  const { loading: usersLoading, getAvailableUsers, getUserName } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Customer | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  // Using shared dropdown with internal open state
  const [sortBy, setSortBy] = useState<'companyName' | 'contactName' | 'createdAt'>('createdAt');
  // Pagination
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

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

  // Handle filtering based on selected user and role
  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin' || user.role === 'sales_manager') {
      console.log('Admin/Manager setting filter to:', selectedUser === 'all' ? 'all users' : selectedUser);
      // If 'all' is selected, pass undefined to show all users
      setFilterUserId(selectedUser === 'all' ? undefined : selectedUser);
    } else {
      // Non-admin users can only see their own leads
      console.log('Standard user, filtering to own leads:', user.id);
      setFilterUserId(user.id);
      setSelectedUser(user.id);
    }
  }, [user, selectedUser, setFilterUserId]);

  // User name resolved by shared component via getUserName

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.emailAddress || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phoneNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const sortedLeads = React.useMemo(() => {
    const list = [...filteredLeads];
    if (sortBy === 'companyName') {
      list.sort((a, b) => a.companyName.localeCompare(b.companyName));
    } else if (sortBy === 'contactName') {
      list.sort((a, b) => (a.contactName || '').localeCompare(b.contactName || ''));
    } else {
      // createdAt descending (newest first)
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [filteredLeads, sortBy]);

  // Reset to first page when inputs change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sourceFilter, sortBy, selectedUser]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const paginatedLeads = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'discovery_call_booked': return 'bg-purple-100 text-purple-800';
      case 'quote_sent': return 'bg-orange-100 text-orange-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'website': return <Building className="h-4 w-4" />;
      case 'referral': return <User className="h-4 w-4" />;
      case 'cold_outreach': return <Phone className="h-4 w-4" />;
      case 'social_media': return <Mail className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewLead = (lead: Customer) => {
    setSelectedLead(lead);
    setShowDialog(true);
    // Also call the parent callback if provided
    onViewLead(lead);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedLead(null);
  };

  const loading = leadsLoading || usersLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
          <p className="text-gray-600">Manage and track your sales leads</p>
        </div>
        <div className="flex items-center space-x-4">
          {getAvailableUsers().length > 1 && (
            <UserFilterDropdown
              selectedUser={selectedUser || ''}
              onSelect={(id) => {
                console.log('Selecting user (Leads):', id);
                setSelectedUser(id);
              }}
              availableUsers={getAvailableUsers()}
              getUserName={getUserName}
              showAllOption={user?.role === 'admin' || user?.role === 'sales_manager'}
            />
          )}
          <div className="text-sm text-gray-600">Total Leads: {leads.length}</div>
          <button 
            onClick={onAddCustomer}
            className="flex items-center space-x-2 px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'companyName' | 'contactName' | 'createdAt')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
            >
              <option value="companyName">Company Name (A–Z)</option>
              <option value="contactName">Contact Name (A–Z)</option>
              <option value="createdAt">Date Created (Newest)</option>
            </select>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="discovery_call_booked">Discovery Call Booked</option>
                <option value="quote_sent">Quote Sent</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="all">All Sources</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="social_media">Social Media</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewLeadDetails(lead)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          {getSourceIcon(lead.source)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.companyName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.contactName}</div>
                    <div className="text-sm text-gray-500">{lead.emailAddress}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status || 'new')}`}>
                      {((lead.status || 'new').replace(/_/g, ' ')).replace(/\b\w/g, (ch) => ch.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.phoneNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(lead as any).assignedToUserName || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(lead.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewLead(lead);
                        }}
                        className="text-brand hover:text-blue-600 transition-colors"
                        title="Quick view"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedLeads.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No leads found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {sortedLeads.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            {(() => {
              const start = (page - 1) * pageSize + 1;
              const end = Math.min(page * pageSize, sortedLeads.length);
              return `Showing ${start}-${end} of ${sortedLeads.length}`;
            })()}
          </div>
          <div className="inline-flex gap-2">
            <button
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <div className="hidden md:flex items-center gap-1">
              {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    className={`px-3 py-1 border rounded-md text-sm ${page === pageNum ? 'bg-brand text-white border-brand' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 7 && (
                <span className="px-2 text-sm text-gray-500">…</span>
              )}
            </div>
            <button
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Lead Quick View Dialog - Simplified */}
      {showDialog && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            {/* Dialog Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedLead.companyName}</h3>
                  <p className="text-sm text-gray-500">Lead #{selectedLead.displayId}</p>
                </div>
                <button
                  onClick={handleCloseDialog}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLead.contactName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Industry</label>
                    <p className="mt-1 text-sm text-gray-900">{(selectedLead as any).industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <a 
                      href={`mailto:${selectedLead.emailAddress}`}
                      className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      {selectedLead.emailAddress}
                    </a>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <a 
                      href={`tel:${selectedLead.phoneNumber}`}
                      className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      {selectedLead.phoneNumber}
                    </a>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Industry</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{(selectedLead as any).industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedLead.source?.replace(/_/g, ' ') || 'Not specified'}</p>
                  </div>
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900 p-2 rounded">{selectedLead.address}</p>
                  </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCloseDialog}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleCloseDialog();
                    onViewLeadDetails(selectedLead);
                  }}
                  className="px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 