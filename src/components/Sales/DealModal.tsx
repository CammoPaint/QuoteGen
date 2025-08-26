import React, { useEffect, useMemo, useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Deal } from '../../types';
import { useCustomers } from '../../hooks/useCustomers';

export interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Omit<Deal, 'id'>) => Promise<void> | void;
  currentUserId: string;
  defaultStage?: Deal['pipelineStage'];
  defaultStatus?: Deal['status'];
  defaultCustomerId?: string;
  initialData?: Partial<Omit<Deal, 'id' | 'userId' | 'pipelineStage' | 'status' | 'createdDate'>>;
  onDelete?: (dealId: string) => Promise<void> | void;
  dealId?: string;
}

const getTodayDateString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getDatePlusDaysString = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const DealModal: React.FC<DealModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentUserId,
  defaultStage = 'New',
  defaultStatus = 'Open',
  defaultCustomerId,
  initialData,
  onDelete,
  dealId,
}) => {
  const { customers, loading: customersLoading } = useCustomers();

  const [form, setForm] = useState({
    title: '',
    customerId: defaultCustomerId || '',
    contactName: '',
    contactEmail: '',
    dealValue: 2000 as number | undefined,
    currency: 'AUD',
    expectedCloseDate: getDatePlusDaysString(14) as string | undefined,
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm(f => ({
        ...f,
        title: initialData.title ?? f.title,
        customerId: initialData.customerId ?? f.customerId,
        contactName: initialData.contactName ?? f.contactName,
        contactEmail: initialData.contactEmail ?? f.contactEmail,
        dealValue: initialData.dealValue ?? f.dealValue,
        currency: initialData.currency ?? f.currency,
        expectedCloseDate: initialData.expectedCloseDate ?? f.expectedCloseDate,
        notes: initialData.notes ?? f.notes,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    if (!isOpen) {
      // reset on close
      setForm({
        title: '',
        customerId: defaultCustomerId || '',
        contactName: '',
        contactEmail: '',
        dealValue: 2000,
        currency: 'AUD',
        expectedCloseDate: getDatePlusDaysString(14),
        notes: ''
      });
      setCustomerDropdownOpen(false);
      setCustomerSearch('');
    }
  }, [isOpen, defaultCustomerId]);

  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const selectedCustomer = useMemo(() => customers.find(c => c.id === form.customerId), [customers, form.customerId]);
  const filteredCustomers = useMemo(() => {
    const list = customerSearch
      ? customers.filter(c =>
          c.companyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.contactName.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.emailAddress.toLowerCase().includes(customerSearch.toLowerCase())
        )
      : customers;
    return list.slice(0, 20);
  }, [customers, customerSearch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!form.title.trim()) return;
    if (!form.customerId) return;

    const payload: Omit<Deal, 'id'> = {
      title: form.title.trim(),
      pipelineStage: defaultStage,
      customerId: form.customerId,
      userId: currentUserId,
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      dealValue: form.dealValue,
      currency: form.currency,
      createdDate: getTodayDateString(),
      expectedCloseDate: form.expectedCloseDate || undefined,
      notes: form.notes,
      status: defaultStatus,
      lossReason: null,
    };

    try {
      setIsSaving(true);
      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    if (!onDelete || !dealId) return;
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!onDelete || !dealId || isDeleting) return;
    try {
      setIsDeleting(true);
      await onDelete(dealId);
      setShowDeleteConfirmation(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{initialData ? 'Edit Deal' : 'Add New Deal'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <input
                value={defaultCustomerId ? (selectedCustomer?.companyName || '') : (customerDropdownOpen ? customerSearch : (selectedCustomer?.companyName || ''))}
                onChange={(e) => {
                  if (defaultCustomerId) return;
                  setCustomerSearch(e.target.value);
                  setCustomerDropdownOpen(true);
                }}
                onFocus={() => !defaultCustomerId && setCustomerDropdownOpen(true)}
                placeholder={customersLoading ? 'Loading customers...' : 'Search customers...'}
                disabled={!!defaultCustomerId}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent ${defaultCustomerId ? 'bg-gray-100' : ''}`}
              />
              {!defaultCustomerId && customerDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
                  ) : (
                    filteredCustomers.map(c => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          setForm(v => ({
                            ...v,
                            customerId: c.id,
                            contactName: c.contactName || '',
                            contactEmail: c.emailAddress || '',
                          }));
                          setCustomerDropdownOpen(false);
                          setCustomerSearch('');
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedCustomer?.id === c.id ? 'bg-blue-50' : ''}`}
                      >
                        <div className="font-medium text-gray-900">{c.companyName}</div>
                        <div className="text-xs text-gray-500">{c.contactName} • {c.emailAddress}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedCustomer && (
                <div className="mt-1 text-xs text-gray-500">Selected: {selectedCustomer.companyName}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm(v => ({ ...v, title: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="ABC Plumbing - CRM App"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                value={form.contactName}
                onChange={(e) => setForm(v => ({ ...v, contactName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm(v => ({ ...v, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.dealValue ?? ''}
                onChange={(e) => setForm(v => ({ ...v, dealValue: e.target.value === '' ? undefined : Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                value={form.currency}
                onChange={(e) => setForm(v => ({ ...v, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
              <input
                type="date"
                value={form.expectedCloseDate ?? ''}
                onChange={(e) => setForm(v => ({ ...v, expectedCloseDate: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm(v => ({ ...v, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Add any notes..."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {onDelete && dealId && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="px-4 py-2 text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting…' : 'Delete Deal'}
                </button>
              )}
            </div>
            <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving…' : 'Save Deal'}</span>
            </button>
            </div>
          </div>
        </form>
      </div>
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Deal</h3>
					  <p className="text-sm text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this deal?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting…' : 'Delete Deal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealModal;


