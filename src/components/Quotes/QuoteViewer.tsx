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
    const newItem: ScopeItem = {
      id: Date.now().toString(),
      feature: '',
      description: '',
      estimatedHours: 0,
      estimatedCost: 0
    };

    setEditedQuote({
      ...editedQuote,
      scopeOfWork: [...editedQuote.scopeOfWork, newItem]
    });
  };

  const removeScopeItem = (index: number) => {
    const updatedScopeOfWork = editedQuote.scopeOfWork.filter((_, i) => i !== index);
    const totalCost = updatedScopeOfWork.reduce((sum, item) => sum + item.estimatedCost, 0);

    setEditedQuote({
      ...editedQuote,
      scopeOfWork: updatedScopeOfWork,
      totalEstimatedCost: totalCost
    });
  };

  const handleSave = () => {
    onEdit(editedQuote);
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
                <input
                  type="number"
                  value={editedQuote.hourlyRate}
                  onChange={(e) => setEditedQuote({ ...editedQuote, hourlyRate: Number(e.target.value) })}
                  className="w-40 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                />
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
                        {isEditing ? (
                          <div className="space-y-4">
                            <input
                              type="text"
                              placeholder="Feature name"
                              value={item.feature}
                              onChange={(e) => handleScopeItemChange(index, 'feature', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                            />
                            <textarea
                              placeholder="Description"
                              value={item.description}
                              onChange={(e) => handleScopeItemChange(index, 'description', e.target.value)}
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
                                <input
                                  type="number"
                                  value={item.estimatedHours}
                                  onChange={(e) => handleScopeItemChange(index, 'estimatedHours', Number(e.target.value))}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cost</label>
                                <input
                                  type="number"
                                  value={item.estimatedCost}
                                  readOnly
                                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
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
                                <span>${item.estimatedCost.toLocaleString()}</span>
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeScopeItem(index)}
                          className="ml-6 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
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
                <span className="text-3xl font-bold text-[#34A853]">
                  ${(isEditing ? editedQuote : quote).totalEstimatedCost.toLocaleString()}
                </span>
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

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Save Changes
                </button>
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
    </div>
  );
};