import React, { useState } from 'react';
import { User, Building, FileText, Bell, FileImage } from 'lucide-react';
import { CompanySettings } from './CompanySettings';
import { TemplateManager } from '../Admin/TemplateManager';

type SettingsTab = 'company' | 'profile' | 'pdf-templates' | 'notifications';

interface SettingsPageProps {
  userRole?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  const tabs = [
    { id: 'company' as const, name: 'Company', icon: Building },
    { id: 'profile' as const, name: 'Profile', icon: User },
    { id: 'pdf-templates' as const, name: 'PDF Templates', icon: FileImage },
    { id: 'notifications' as const, name: 'Notifications', icon: Bell },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'company':
        return <CompanySettings />;
      case 'profile':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Settings</h3>
            <p className="text-gray-600">Profile management coming soon.</p>
          </div>
        );
      case 'pdf-templates':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">PDF Template Management</h2>
              <p className="text-gray-600 mt-1">Create and manage PDF templates for your quotes</p>
            </div>
            <TemplateManager onClose={() => {}} />
          </div>
        );
      case 'notifications':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Settings</h3>
            <p className="text-gray-600">Notification preferences coming soon.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
      </div>

      <div className="flex space-x-8">
        {/* Settings Navigation */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.filter(tab => {
              // Hide PDF Templates for non-admin users
              if (tab.id === 'pdf-templates' && userRole !== 'admin') return false;
              return true;
            }).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};