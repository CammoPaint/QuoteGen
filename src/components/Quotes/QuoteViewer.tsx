import React, { useState } from 'react';
import { Edit2, Download, Clock, Plus, Trash2, X, FileText, Settings, Code, Copy, ArrowLeft, Menu, ChevronDown, Eye } from 'lucide-react';
import { Quote, Customer, ScopeItem } from '../../types';
import { generateQuotePDF, previewQuotePDF } from '../../services/pdfService';
import { generateBoltPrompt, generateMockup } from '../../services/aiService';
import { useTemplates } from '../../hooks/useTemplates';
import { TemplateManager } from '../Admin/TemplateManager';

interface QuoteViewerProps {
  quote: Quote;
  customer: Customer | undefined;
  onEdit: (quote: Quote) => void;
  onDelete: (quoteId: string) => void;
  onClose: () => void;
}

export const QuoteViewer: React.FC<QuoteViewerProps> = ({
  quote,
  customer,
  onEdit,
  onDelete,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuote, setEditedQuote] = useState(quote);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [, setIsGeneratingPDF] = useState(false);
  const [showBoltPrompt, setShowBoltPrompt] = useState(false);
  const [boltPrompt, setBoltPrompt] = useState('');
  const [, setIsGeneratingPrompt] = useState(false);
  const [, setIsGeneratingMockup] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showAddScopeItemModal, setShowAddScopeItemModal] = useState(false);
  const [newScopeItem, setNewScopeItem] = useState<Omit<ScopeItem, 'id'>>({
    feature: '',
    description: '',
    estimatedHours: 0,
    estimatedCost: 0
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isEditingScopeItem, setIsEditingScopeItem] = useState(false);
  const [editingScopeItemIndex, setEditingScopeItemIndex] = useState<number>(-1);
  const [editingScopeItem, setEditingScopeItem] = useState<ScopeItem | null>(null);
  const { activeTemplate } = useTemplates();

  const handleScopeItemChange = (index: number, field: keyof ScopeItem, value: string | number) => {
    const updatedScopeOfWork = [...editedQuote.scopeOfWork];
    updatedScopeOfWork[index] = {
      ...updatedScopeOfWork[index],
      [field]: value
    };

    if (field === 'estimatedHours') {
      updatedScopeOfWork[index].estimatedCost = Number(value) * editedQuote.hourlyRate;
    }

    const totalCost = updatedScopeOfWork.reduce((sum, item) => sum + item.estimatedCost, 0);

    setEditedQuote({
      ...editedQuote,
      scopeOfWork: updatedScopeOfWork,
      totalEstimatedCost: totalCost
    });
  };

  const addScopeItem = () => {
    setNewScopeItem({
      feature: '',
      description: '',
      estimatedHours: 0,
      estimatedCost: 0
    });
    setShowAddScopeItemModal(true);
  };

  const handleAddScopeItem = () => {
    if (!newScopeItem.feature.trim() || !newScopeItem.description.trim()) {
      alert('Please fill in both feature name and description');
      return;
    }

    const newItem: ScopeItem = {
      id: Date.now().toString(),
      ...newScopeItem,
      estimatedCost: newScopeItem.estimatedHours * editedQuote.hourlyRate
    };

    const updatedQuote = {
      ...editedQuote,
      scopeOfWork: [...editedQuote.scopeOfWork, newItem]
    };

    // Save the quote automatically
    onEdit(updatedQuote);
    
    // Update local state
    setEditedQuote(updatedQuote);

    setShowAddScopeItemModal(false);
    setNewScopeItem({
      feature: '',
      description: '',
      estimatedHours: 0,
      estimatedCost: 0
    });

    // Show success toast
    showToastMessage(`Scope item "${newItem.feature}" added and saved successfully!`);
  };

  const handleNewScopeItemChange = (field: keyof Omit<ScopeItem, 'id'>, value: string | number) => {
    setNewScopeItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditScopeItem = (index: number) => {
    const item = editedQuote.scopeOfWork[index];
    setEditingScopeItem({ ...item });
    setEditingScopeItemIndex(index);
    setIsEditingScopeItem(true);
  };

  const handleEditingScopeItemChange = (field: keyof Omit<ScopeItem, 'id'>, value: string | number | any[]) => {
    if (!editingScopeItem) return;
    
    setEditingScopeItem(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      
      // Recalculate cost if hours changed
      if (field === 'estimatedHours') {
        updated.estimatedCost = Number(value) * editedQuote.hourlyRate;
      }
      
      return updated;
    });
  };

  const handleSaveScopeItem = () => {
    if (!editingScopeItem || editingScopeItemIndex === -1) return;
    
    if (!editingScopeItem.feature.trim() || !editingScopeItem.description.trim()) {
      alert('Please fill in both feature name and description');
      return;
    }

    const updatedScopeOfWork = [...editedQuote.scopeOfWork];
    updatedScopeOfWork[editingScopeItemIndex] = editingScopeItem;
    
    const totalCost = updatedScopeOfWork.reduce((sum, item) => sum + item.estimatedCost, 0);

    const updatedQuote = {
      ...editedQuote,
      scopeOfWork: updatedScopeOfWork,
      totalEstimatedCost: totalCost
    };

    // Save the quote automatically
    onEdit(updatedQuote);
    
    // Update local state
    setEditedQuote(updatedQuote);

    // Close modal and reset state
    setIsEditingScopeItem(false);
    setEditingScopeItemIndex(-1);
    setEditingScopeItem(null);

    // Show success toast
    showToastMessage(`Scope item "${editingScopeItem.feature}" updated successfully!`);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const removeScopeItem = (index: number) => {
    const itemToRemove = editedQuote.scopeOfWork[index];
    const updatedScopeOfWork = editedQuote.scopeOfWork.filter((_, i) => i !== index);
    const totalCost = updatedScopeOfWork.reduce((sum, item) => sum + item.estimatedCost, 0);

    setEditedQuote({
      ...editedQuote,
      scopeOfWork: updatedScopeOfWork,
      totalEstimatedCost: totalCost
    });

    // Show toast for removed item
    showToastMessage(`Scope item "${itemToRemove.feature}" removed successfully!`);
  };

  const handleSave = () => {
    // Check if hourly rate has changed and recalculate all costs
    if (editedQuote.hourlyRate !== quote.hourlyRate) {
      const updatedScopeOfWork = editedQuote.scopeOfWork.map(item => ({
        ...item,
        estimatedCost: item.estimatedHours * editedQuote.hourlyRate
      }));
      
      const totalCost = updatedScopeOfWork.reduce((sum, item) => sum + item.estimatedCost, 0);
      
      const updatedQuote = {
        ...editedQuote,
        scopeOfWork: updatedScopeOfWork,
        totalEstimatedCost: totalCost
      };
      
      onEdit(updatedQuote);
      setEditedQuote(updatedQuote);
      showToastMessage('Quote updated successfully! All costs recalculated based on new hourly rate.');
    } else {
      onEdit(editedQuote);
      showToastMessage('Quote updated successfully!');
    }
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedQuote(quote);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    onDelete(quote.id);
    setShowDeleteConfirmation(false);
  };

  const exportToPDF = async () => {
    if (!customer) {
      alert('Customer information is required to generate PDF');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      await generateQuotePDF(quote, customer, activeTemplate);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const previewQuote = async () => {
    if (!customer) {
      alert('Customer information is required to preview quote');
      return;
    }

    try {
      const previewResult = await previewQuotePDF(quote, customer, activeTemplate, { showPDF: true, showHTML: true });
      console.log('Preview result:', previewResult);
      // Use HTML content if available, otherwise use PDF URL
      setPreviewUrl(previewResult.htmlContent || '');
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing quote:', error);
      alert('Failed to generate preview. Please try again.');
    }
  };

  const generateBoltNewPrompt = async () => {
    if (!customer) {
      alert('Customer information is required to generate Bolt.New prompt');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      // Convert quote to the format expected by the Firebase function
      const quoteResponse = {
        ProjectOverview: quote.projectOverview,
        TimeFrame: {
          RequirementsClarificationPhase: "5 days",
          Stage1Development: "20 days", 
          Stage2FinalDraft: "10 days",
          Stage3Signoff: "5 days"
        },
        ScopeOfWork: quote.scopeOfWork.map(item => ({
          FeatureName: item.feature,
          Description: item.description,
          Items: item.items || [],
          EstimatedHours: item.estimatedHours,
          EstimatedCost: item.estimatedCost
        })),
        HourlyRate: quote.hourlyRate,
        TotalEstimatedCost: quote.totalEstimatedCost
      };

      const result = await generateBoltPrompt({
        quoteResponse,
        companyName: customer.companyName,
        additionalContext: `This application is for ${customer.companyName}. Contact: ${customer.contactName} (${customer.emailAddress})`
      });

      setBoltPrompt(result.prompt);
      setShowBoltPrompt(true);
    } catch (error) {
      console.error('Error generating Bolt.New prompt:', error);
      alert('Failed to generate Bolt.New prompt. Please try again.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const copyPromptToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(boltPrompt);
      alert('Prompt copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard. Please select and copy manually.');
    }
  };

  const generateMockupImage = async () => {
    if (!customer) {
      alert('Customer information is required to generate mockup');
      return;
    }
    if (!quote.id) {
      alert('Quote ID is missing. Please save the quote first, then try again.');
      return;
    }

    setIsGeneratingMockup(true);
    try {
      // Convert quote to the format expected by the Firebase function
      const quoteResponse = {
        ProjectOverview: quote.projectOverview,
        TimeFrame: {
          RequirementsClarificationPhase: "5 days",
          Stage1Development: "20 days", 
          Stage2FinalDraft: "10 days",
          Stage3Signoff: "5 days"
        },
        ScopeOfWork: quote.scopeOfWork.map(item => ({
          FeatureName: item.feature,
          Description: item.description,
          Items: item.items || [],
          EstimatedHours: item.estimatedHours,
          EstimatedCost: item.estimatedCost
        })),
        HourlyRate: quote.hourlyRate,
        TotalEstimatedCost: quote.totalEstimatedCost
      };

      // Use the Firestore document ID (quote.id) for the mockup generation
      const result = await generateMockup(quoteResponse, quote.id, customer.companyName);
      
      // Update the quote with the mockup URL
      const updatedQuote = { ...quote, mockupUrl: result.mockupUrl };
      onEdit(updatedQuote);
      
      alert('Mockup generated successfully!');
    } catch (error) {
      console.error('Error generating mockup:', error);
      alert('Failed to generate mockup. Please try again.');
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{customer?.companyName}</h1>
                <p className="text-sm text-gray-600">
                  {customer?.contactName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isEditing && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <span>Cancel</span>
                  </button>
                </div>
              )}
              {!isEditing && (
                <div className="relative">
                  <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Menu className="h-4 w-4" />
                    <span>Actions</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {showActionMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowTemplateManager(true);
                            setShowActionMenu(false);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Manage Templates</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowActionMenu(false);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span>Edit Quote</span>
                        </button>

                        <button
                          onClick={() => {
                            previewQuote();
                            setShowActionMenu(false);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Preview Quote</span>
                        </button>

                        <button
                          onClick={() => {
                            exportToPDF();
                            setShowActionMenu(false);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Download className="h-4 w-4" />
                          <span>Export PDF</span>
                        </button>

                        <button
                          onClick={() => {
                            generateBoltNewPrompt();
                            setShowActionMenu(false);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Code className="h-4 w-4" />
                          <span>Generate Bolt.New Prompt</span>
                        </button>

                        <button
                          onClick={() => {
                            generateMockupImage();
                            setShowActionMenu(false);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <FileText className="h-4 w-4" />
                          <span>{quote.mockupUrl ? 'Regenerate' : 'Generate'} Mockup</span>
                        </button>

                        <div className="border-t border-gray-200 my-1"></div>

                        <button
                          onClick={() => {
                            handleDelete();
                            setShowActionMenu(false);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Quote</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8 space-y-8">
            {/* Project Overview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Overview</h3>
              {isEditing ? (
                <textarea
                  value={editedQuote.projectOverview}
                  onChange={(e) => setEditedQuote({ ...editedQuote, projectOverview: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                  rows={4}
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{quote.projectOverview}</p>
              )}
            </div>

            

            {/* Hourly Rate */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Hourly Rate</h3>
              {isEditing ? (
                <div>
                  <input
                    type="number"
                    value={editedQuote.hourlyRate}
                    onChange={(e) => setEditedQuote({ ...editedQuote, hourlyRate: Number(e.target.value) })}
                    className="w-40 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                  {editedQuote.hourlyRate !== quote.hourlyRate && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Changing the hourly rate will recalculate all item costs when you save.
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Current total: ${editedQuote.scopeOfWork.reduce((sum, item) => sum + (item.estimatedHours * editedQuote.hourlyRate), 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-gray-700">
                  <span className="text-lg">${quote.hourlyRate}/hour</span>
                </div>
              )}
            </div>

            {/* Scope of Work */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Scope of Work</h3>
                {isEditing && (
                  <button
                    onClick={addScopeItem}
                    className="flex items-center space-x-2 px-4 py-2 text-sm bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                {(isEditing ? editedQuote : quote).scopeOfWork.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">{item.feature}</h4>
                            <p className="text-gray-600 leading-relaxed mb-4">{item.description}</p>
                            
                            {/* Display Items */}
                            {item.items && item.items.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-3">Included Items:</h5>
                                <ul className="space-y-2">
                                  {item.items.map((subItem, subIndex) => (
                                    <li key={subIndex} className="text-sm text-gray-600">
                                      <span className="font-medium">{subItem.itemName}:</span> {subItem.description}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{item.estimatedHours} hours</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>
                                  ${isEditing && editedQuote.hourlyRate !== quote.hourlyRate 
                                    ? (item.estimatedHours * editedQuote.hourlyRate).toLocaleString()
                                    : item.estimatedCost.toLocaleString()
                                  }
                                </span>
                                {isEditing && editedQuote.hourlyRate !== quote.hourlyRate && (
                                  <span className="text-xs text-blue-600">
                                    (was ${item.estimatedCost.toLocaleString()})
                                  </span>
                                )}
                              </span>
                            </div>
                        </>
                      </div>
                      {isEditing && (
                        <div className="flex items-center space-x-2 ml-6">
                          <button
                            onClick={() => handleEditScopeItem(index)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit item"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeScopeItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Cost */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-gray-900">Total Estimated Cost</span>
                <div className="text-right">
                  <span className="text-3xl font-bold text-[#34A853]">
                    ${isEditing && editedQuote.hourlyRate !== quote.hourlyRate
                      ? editedQuote.scopeOfWork.reduce((sum, item) => sum + (item.estimatedHours * editedQuote.hourlyRate), 0).toLocaleString()
                      : (isEditing ? editedQuote : quote).totalEstimatedCost.toLocaleString()
                    }
                  </span>
                  {isEditing && editedQuote.hourlyRate !== quote.hourlyRate && (
                    <div className="text-sm text-blue-600 mt-1">
                      <span>was ${quote.totalEstimatedCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mockup Section */}
            {quote.mockupUrl && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Mockup</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={quote.mockupUrl}
                    alt="Application Mockup"
                    className="w-full h-auto"
                    style={{ maxHeight: '600px', objectFit: 'contain' }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This mockup shows a preview of the application based on your project requirements.
                </p>
              </div>
            )}


          </div>
        </div>
      </div>

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <TemplateManager onClose={() => setShowTemplateManager(false)} />
          </div>
        </div>
      )}

      {/* Bolt.New Prompt Modal */}
      {showBoltPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Bolt.New Development Prompt</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Copy this prompt and paste it into Bolt.New to build the application
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyPromptToClipboard}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy to Clipboard</span>
                </button>
                <button
                  onClick={() => setShowBoltPrompt(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono leading-relaxed">
                  {boltPrompt}
                </pre>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Code className="h-4 w-4" />
                <span>
                  This prompt is ready to use in Bolt.New. Simply copy and paste it to start building the application.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Quote</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this quote for <strong>{customer?.companyName}</strong>? 
                This will permanently remove the quote and all associated data.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quote Preview</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={exportToPDF}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#34A853] text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export as PDF</span>
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-white">
              <div 
                dangerouslySetInnerHTML={{ __html: previewUrl }}
                className="preview-content"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Scope Item Modal */}
      {showAddScopeItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Scope Item</h3>
              <button
                onClick={() => setShowAddScopeItemModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter feature name"
                  value={newScopeItem.feature}
                  onChange={(e) => handleNewScopeItemChange('feature', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Describe the feature and what it includes"
                  value={newScopeItem.description}
                  onChange={(e) => handleNewScopeItemChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={newScopeItem.estimatedHours}
                  onChange={(e) => handleNewScopeItemChange('estimatedHours', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Estimated cost: ${(newScopeItem.estimatedHours * editedQuote.hourlyRate).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAddScopeItemModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddScopeItem}
                disabled={!newScopeItem.feature.trim() || !newScopeItem.description.trim() || newScopeItem.estimatedHours <= 0}
                className="px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-right-2 duration-300">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="ml-4 text-white hover:text-green-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Scope Item Modal */}
      {isEditingScopeItem && editingScopeItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Scope Item</h3>
              <button
                onClick={() => {
                  setIsEditingScopeItem(false);
                  setEditingScopeItemIndex(-1);
                  setEditingScopeItem(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter feature name"
                  value={editingScopeItem.feature}
                  onChange={(e) => handleEditingScopeItemChange('feature', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Describe the feature and what it includes"
                  value={editingScopeItem.description}
                  onChange={(e) => handleEditingScopeItemChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
              
              {/* Included Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Included Items
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingScopeItem.items) {
                        handleEditingScopeItemChange('items', [{ itemName: '', description: '' }]);
                      } else {
                        handleEditingScopeItemChange('items', [...editingScopeItem.items, { itemName: '', description: '' }]);
                      }
                    }}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Item</span>
                  </button>
                </div>
                
                {editingScopeItem.items && editingScopeItem.items.length > 0 ? (
                  <div className="space-y-3">
                    {editingScopeItem.items?.map((item, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Item name"
                            value={item.itemName}
                            onChange={(e) => {
                              if (editingScopeItem.items) {
                                const updatedItems = [...editingScopeItem.items];
                                updatedItems[index] = { ...item, itemName: e.target.value };
                                handleEditingScopeItemChange('items', updatedItems);
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                          />
                          <textarea
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => {
                              if (editingScopeItem.items) {
                                const updatedItems = [...editingScopeItem.items];
                                updatedItems[index] = { ...item, description: e.target.value };
                                handleEditingScopeItemChange('items', updatedItems);
                              }
                            }}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (editingScopeItem.items) {
                              const updatedItems = editingScopeItem.items.filter((_, i) => i !== index);
                              handleEditingScopeItemChange('items', updatedItems);
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-md">
                    <p className="text-sm text-gray-500">No included items yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Item" to include specific deliverables</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={editingScopeItem.estimatedHours}
                  onChange={(e) => handleEditingScopeItemChange('estimatedHours', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Estimated cost: ${(editingScopeItem.estimatedHours * editedQuote.hourlyRate).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsEditingScopeItem(false);
                  setEditingScopeItemIndex(-1);
                  setEditingScopeItem(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScopeItem}
                disabled={!editingScopeItem.feature.trim() || !editingScopeItem.description.trim() || editingScopeItem.estimatedHours <= 0}
                className="px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};