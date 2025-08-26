import React, { useState, useEffect } from 'react';
import { Plus, User, Building, DollarSign, Calendar } from 'lucide-react';
import { Deal } from '../../types';
import { useDeals } from '../../hooks/useDeals';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import DealModal from './DealModal';
import { useCustomers } from '../../hooks/useCustomers';
import UserFilterDropdown from '../Shared/UserFilterDropdown';

interface SalesPipelineProps {
  onViewDeal?: (deal: Deal) => void;
  onEditDeal?: (deal: Deal) => void;
}

interface PipelineColumn {
  id: Deal['pipelineStage'];
  name: string;
  color: string;
  deals: Deal[];
}

export const SalesPipeline: React.FC<SalesPipelineProps> = ({ onEditDeal: _ }) => {
  const { user } = useAuth();
  const { deals, loading: dealsLoading, error, updateDeal, addDeal, deleteDeal, setFilterUserId } = useDeals();
  const { customers } = useCustomers();
  const { loading: usersLoading, getAvailableUsers, getUserName } = useUsers();
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<Deal['pipelineStage'] | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Define pipeline stages
  const stages: PipelineColumn[] = [
    { id: 'New', name: 'New', color: 'bg-blue-500', deals: [] },
    { id: 'Contacted', name: 'Contacted', color: 'bg-yellow-500', deals: [] },
    { id: 'Quoted', name: 'Quoted', color: 'bg-orange-500', deals: [] },
    { id: 'Review', name: 'Review', color: 'bg-purple-500', deals: [] },
    { id: 'Won', name: 'Won', color: 'bg-green-500', deals: [] },
    { id: 'Lost', name: 'Lost', color: 'bg-red-500', deals: [] },
  ];

  useEffect(() => {
    const updated = stages.map(stage => ({
      ...stage,
      deals: deals.filter(d => d.pipelineStage === stage.id)
    }));
    setColumns(updated);
  }, [deals]);

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
      console.log('Admin/Manager setting deals filter to:', selectedUser === 'all' ? 'all users' : selectedUser);
      // If 'all' is selected, pass undefined to show all users
      setFilterUserId(selectedUser === 'all' ? undefined : selectedUser);
    } else {
      // Non-admin users can only see their own deals
      console.log('Standard user, filtering to own deals:', user.id);
      setFilterUserId(user.id);
      setSelectedUser(user.id);
    }
  }, [user, selectedUser, setFilterUserId]);

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetStageId?: Deal['pipelineStage']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (targetStageId) {
      setDragOverStageId(targetStageId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: Deal['pipelineStage']) => {
    e.preventDefault();
    
    if (!draggedDeal || draggedDeal.pipelineStage === targetStageId) {
      return;
    }

    try {
      await updateDeal(draggedDeal.id, { pipelineStage: targetStageId });
      
      setColumns(prev => prev.map(col => ({
        ...col,
        deals: col.id === draggedDeal.pipelineStage
          ? col.deals.filter(d => d.id !== draggedDeal.id)
          : col.id === targetStageId
          ? [...col.deals, { ...draggedDeal, pipelineStage: targetStageId }]
          : col.deals
      })));
    } catch (error) {
      console.error('Error updating deal stage:', error);
    }
    
    setDraggedDeal(null);
    setDragOverStageId(null);
  };

  const handleSaveDeal = async (payload: Omit<Deal, 'id'>) => {
    await addDeal(payload);
    setIsCreateOpen(false);
  };

  const handleUpdateDeal = async (payload: Omit<Deal, 'id'>) => {
    if (!editingDeal) return;
    const { title, customerId, contactName, contactEmail, dealValue, currency, expectedCloseDate, notes, status } = payload;
    await updateDeal(editingDeal.id, {
      title,
      customerId,
      contactName,
      contactEmail,
      dealValue,
      currency,
      expectedCloseDate,
      notes,
      status,
    });
    setIsEditOpen(false);
    setEditingDeal(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (dealsLoading || usersLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Sales Pipeline</h2>
          <p className="text-gray-600">Drag and drop deals to move them through the pipeline</p>
        </div>
        <div className="flex items-center space-x-4">
          {getAvailableUsers().length > 1 && (
            <UserFilterDropdown
              selectedUser={selectedUser || ''}
              onSelect={(id) => {
                console.log('Selecting user (Pipeline):', id);
                setSelectedUser(id);
              }}
              availableUsers={getAvailableUsers()}
              getUserName={getUserName}
              showAllOption={user?.role === 'admin' || user?.role === 'sales_manager'}
            />
          )}
          <div className="text-sm text-gray-600">Total Deals: {deals.length}</div>
          <div className="text-sm text-gray-600">Total Value: {formatCurrency(deals.reduce((s, d) => s + (d.dealValue || 0), 0))}</div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Deal</span>
          </button>
        </div>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {columns.map((stage) => (
          <div
            key={stage.id}
            className={`bg-gray-50 rounded-lg p-4 min-h-[600px] transition-all ${dragOverStageId === stage.id ? 'ring-2 ring-brand bg-blue-50/40' : ''}`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDrop={(e) => handleDrop(e, stage.id)}
            onDragEnter={() => setDragOverStageId(stage.id)}
            onDragLeave={() => setDragOverStageId(null)}
          >
            {/* Stage Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                <h3 className="font-semibold text-gray-900">{stage.name}</h3>
              </div>
              <div className="flex items-center space-x-2" />
            </div>

            {/* Stage Value */}
            <div className="mb-4">
              <div className="text-sm text-gray-600">Value</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(stage.deals.reduce((sum, d) => sum + (d.dealValue || 0), 0))}
              </div>
            </div>

            {/* New deal creation moved to header button */}

            {/* Deals */}
            <div className="space-y-3">
              {stage.deals.map((deal) => (
                <div
                  key={deal.id}
                  className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all ${
                    draggedDeal?.id === deal.id ? 'opacity-70 ring-2 ring-brand scale-[.98]' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, deal)}
                  onDragEnd={() => { setDraggedDeal(null); setDragOverStageId(null); }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm truncate">{deal.title}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{deal.contactName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Building className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{customers.find(c => c.id === deal.customerId)?.companyName || '—'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{formatCurrency(deal.dealValue || 0)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{deal.createdDate}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">                   
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => { setEditingDeal(deal); setIsEditOpen(true); }}
                        className="text-xs text-brand hover:text-blue-600"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {stage.deals.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-sm">No deals</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pipeline Summary removed */}

      <DealModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleSaveDeal}
        currentUserId={user?.id || ''}
        defaultStage="New"
        defaultStatus="Open"
      />

      <DealModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingDeal(null); }}
        onSave={handleUpdateDeal}
        onDelete={async (dealId: string) => { await deleteDeal(dealId); }}
        dealId={editingDeal?.id}
        currentUserId={user?.id || ''}
        defaultStage={editingDeal?.pipelineStage || 'New'}
        defaultStatus={editingDeal?.status || 'Open'}
        defaultCustomerId={editingDeal?.customerId}
        initialData={editingDeal || undefined}
      />
    </div>
  );
}; 