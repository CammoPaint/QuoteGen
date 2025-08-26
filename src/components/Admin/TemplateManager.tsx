import React, { useState } from 'react';
import { Save, Plus, Trash2, X } from 'lucide-react';
import { PDFTemplate } from '../../services/pdfService';
import { useTemplates } from '../../hooks/useTemplates';

interface TemplateManagerProps {
  onClose?: () => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ onClose }) => {
  const { 
    templates, 
    activeTemplate, 
    loading, 
    saveTemplate, 
    setActiveTemplateById, 
    createNewTemplate, 
    deleteTemplate 
  } = useTemplates();

  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate>(activeTemplate);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    const saved = await saveTemplate(selectedTemplate);
    setSelectedTemplate(saved);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    const newTemplate = createNewTemplate();
    setSelectedTemplate(newTemplate);
    setIsEditing(true);
  };

  const handleDelete = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(templateId);
      if (selectedTemplate.id === templateId) {
        setSelectedTemplate(templates.find(t => t.id === 'default') || templates[0]);
      }
    }
  };

  const handleFieldChange = (field: keyof PDFTemplate, value: any) => {
    setSelectedTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompanyInfoChange = (field: keyof PDFTemplate['companyInfo'], value: string) => {
    setSelectedTemplate(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        [field]: value
      }
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">PDF Template Manager</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="flex min-h-[600px]">
          {/* Template List */}
          <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Templates</h3>
              <button
                onClick={handleCreateNew}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTemplate.id === template.id
                      ? 'border-brand bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {template.id === activeTemplate.id && (
                          <span className="text-green-600 font-medium">Active • </span>
                        )}
                        Updated {new Date(template.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {template.id !== 'default' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Editor */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Template' : 'Template Details'}
                </h3>
                <div className="flex items-center space-x-2">
                  {!isEditing && selectedTemplate.id !== activeTemplate.id && (
                    <button
                      onClick={() => setActiveTemplateById(selectedTemplate.id)}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Set as Active
                    </button>
                  )}
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedTemplate(templates.find(t => t.id === selectedTemplate.id) || selectedTemplate);
                          setIsEditing(false);
                        }}
                        className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-brand text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTemplate.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{selectedTemplate.name}</p>
                  )}
                </div>

                {/* Company Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Company Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={selectedTemplate.companyInfo.name}
                          onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedTemplate.companyInfo.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={selectedTemplate.companyInfo.phone}
                          onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedTemplate.companyInfo.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={selectedTemplate.companyInfo.email}
                          onChange={(e) => handleCompanyInfoChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedTemplate.companyInfo.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={selectedTemplate.companyInfo.website || ''}
                          onChange={(e) => handleCompanyInfoChange('website', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedTemplate.companyInfo.website || 'Not set'}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      {isEditing ? (
                        <textarea
                          value={selectedTemplate.companyInfo.address}
                          onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedTemplate.companyInfo.address}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms and Conditions
                  </label>
                  {isEditing ? (
                    <textarea
                      value={selectedTemplate.termsAndConditions}
                      onChange={(e) => handleFieldChange('termsAndConditions', e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent font-mono text-sm"
                      placeholder="Enter terms and conditions..."
                    />
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedTemplate.termsAndConditions}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Footer Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Footer Text
                  </label>
                  {isEditing ? (
                    <textarea
                      value={selectedTemplate.footerText}
                      onChange={(e) => handleFieldChange('footerText', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="Enter footer text..."
                    />
                  ) : (
                    <p className="text-gray-900">{selectedTemplate.footerText}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};