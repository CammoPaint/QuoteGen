import React, { useState, useEffect } from 'react';
import { Target, ArrowRight, Loader2 } from 'lucide-react';
import { Solution } from '../../types';

interface SolutionsListProps {
  onSolutionClick: (solution: Solution) => void;
}

export const SolutionsList: React.FC<SolutionsListProps> = ({ onSolutionClick }) => {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://insytifycms-default-rtdb.firebaseio.com/solutions.json');
        const data = await response.json();
        
        // Transform the Firebase data structure to our Solution interface
        const solutionsArray: Solution[] = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          title: value.title || '',
          prompt: value.prompt || '',
          description: value.description || '',
          isActive: value.isActive !== false,
          updatedAt: value.updatedAt || '',
          // Additional fields for the solutions display
          heroImage: value.heroImage || value.hero?.image || '',
          heroTitle: value.heroTitle || value.hero?.title || '',
          heroSubtitle: value.heroSubtitle || value.hero?.description || '',
          benefitList: value.benefitList || {},
          featureList: value.featureList || {},
          cta: value.cta || {}
        })).filter(solution => solution.isActive); // Only show active solutions
        
        setSolutions(solutionsArray);
      } catch (error) {
        console.error('Failed to fetch solutions:', error);
        setError('Failed to load solutions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolutions();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <span className="text-gray-600">Loading solutions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Solutions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Solutions</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Discover our comprehensive range of business solutions designed to streamline your operations, 
          boost productivity, and drive growth. Each solution is tailored to meet the unique needs of modern businesses.
        </p>
      </div>

      {/* Solutions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {solutions.map((solution) => (
          <div
            key={solution.id}
            onClick={() => onSolutionClick(solution)}
            className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer hover:border-brand/20"
          >
            {/* Image */}
            <div className="aspect-video bg-gray-100 overflow-hidden">
              {solution.heroImage ? (
                <img
                  src={solution.heroImage}
                  alt={solution.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                  <Target className="h-12 w-12 text-brand/60" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-brand transition-colors">
                {solution.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-3">
                {solution.description}
              </p>
              
              {/* CTA */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-brand font-medium">Learn More</span>
                <ArrowRight className="h-4 w-4 text-brand group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {solutions.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Solutions Available</h3>
          <p className="text-gray-600">Check back later for new solutions.</p>
        </div>
      )}
    </div>
  );
};
