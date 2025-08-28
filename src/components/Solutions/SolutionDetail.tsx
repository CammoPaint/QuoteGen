import React from 'react';
import { ArrowLeft, Check, Star, Download, ArrowRight } from 'lucide-react';
import { Solution } from '../../types';

interface SolutionDetailProps {
  solution: Solution;
  onBack: () => void;
}

export const SolutionDetail: React.FC<SolutionDetailProps> = ({ solution, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Solutions</span>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Last updated:</span>
              <span className="text-sm text-gray-900">
                {new Date(solution.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {solution.heroTitle || solution.title}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {solution.heroSubtitle || solution.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand hover:bg-blue-600 transition-colors">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                {solution.cta?.buttonText && (
                  <button className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                    <Download className="mr-2 h-5 w-5" />
                    {solution.cta.buttonText}
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              {solution.heroImage ? (
                <img
                  src={solution.heroImage}
                  alt={solution.title}
                  className="w-full h-auto rounded-lg shadow-xl"
                />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-xl flex items-center justify-center">
                  <div className="text-center">
                    <Star className="h-16 w-16 text-brand/60 mx-auto mb-4" />
                    <p className="text-gray-500">Solution Preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      {solution.benefitList?.benefits && solution.benefitList.benefits.length > 0 && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {solution.benefitList.title || 'Why Choose Our Solution?'}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {solution.benefitList.description}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {solution.benefitList.benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-brand" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      {solution.featureList?.features && solution.featureList.features.length > 0 && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {solution.featureList.title || 'Key Features'}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {solution.featureList.description}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {solution.featureList.features.map((feature, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mb-4">
                    <i className={`${feature.icon} text-brand text-lg`}></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      {solution.cta && (
        <div className="bg-brand py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {solution.cta.title}
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              {solution.cta.description}
            </p>
            <button className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-brand bg-white hover:bg-gray-50 transition-colors">
              {solution.cta.buttonText}
              <ArrowRight className="ml-2 h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Project Description Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-gray-600">
              Use this solution template to generate a custom quote for your business needs.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Description Template</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {solution.prompt}
            </p>
            <div className="mt-6">
              <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand hover:bg-blue-600 transition-colors">
                Generate Quote with This Template
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
