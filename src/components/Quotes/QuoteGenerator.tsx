import React, { useState } from 'react';
import { Bot, Loader2, DollarSign } from 'lucide-react';
import { Customer, QuoteGenerationRequest } from '../../types';
import { generateQuote } from '../../services/aiService';

interface QuoteGeneratorProps {
  customers: Customer[];
  onQuoteGenerated: (quote: any) => void;
  onClose: () => void;
}

export const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({
  customers,
  onQuoteGenerated,
  onClose
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleGenerate = async () => {
    if (!selectedCustomer || !projectDescription.trim()) return;

    setIsGenerating(true);
    try {
      const request: QuoteGenerationRequest = {
        companyName: selectedCustomer.companyName,
        projectDescription: projectDescription.trim(),
        hourlyRate
      };

      const response = await generateQuote(request);
      
      const quote = {
        customerId: selectedCustomerId,
        ...response,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onQuoteGenerated(quote);
    } catch (error) {
      console.error('Failed to generate quote:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-brand" />
            <h2 className="text-xl font-semibold text-gray-900">AI Quote Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer *
            </label>
            <select
              id="customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              required
            >
              <option value="">Choose a customer...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.companyName} - {customer.contactName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Project Description *
            </label>
            <textarea
              id="description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Describe the project requirements, features, and any specific needs..."
              required
            />
          </div>

          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate (Optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                id="hourlyRate"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                min="1"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Default: $50/hour</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Bot className="h-5 w-5 text-brand mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">AI-Powered Quote Generation</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Our AI will analyze your project description and generate a detailed quote with scope of work, time estimates, and costs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedCustomerId || !projectDescription.trim() || isGenerating}
              className="flex items-center space-x-2 px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  <span>Generate Quote</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};