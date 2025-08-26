import React, { useEffect, useRef, useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

export interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserFilterDropdownProps {
  selectedUser: string;
  onSelect: (id: string) => void;
  availableUsers: AvailableUser[];
  getUserName: (id: string) => string | undefined;
  showAllOption?: boolean;
  className?: string;
}

const UserFilterDropdown: React.FC<UserFilterDropdownProps> = ({
  selectedUser,
  onSelect,
  availableUsers,
  getUserName,
  showAllOption = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getSelectedUserName = () => {
    if (selectedUser === 'all') return 'All Users';
    return getUserName(selectedUser) || 'Select User';
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Element;
      if (!target.closest('.user-dropdown-container')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (availableUsers.length <= 0) return null;

  return (
    <div className={`flex items-center space-x-2 relative user-dropdown-container ${className}`} ref={containerRef}>
      <Filter className="h-4 w-4 text-gray-500" />
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          className="flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          <span>{getSelectedUserName()}</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
        {open && (
          <div className="absolute z-10 top-full mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {showAllOption && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect('all');
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedUser === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
              >
                <div className="font-medium">All Users</div>
              </button>
            )}
            {showAllOption && availableUsers.length > 0 && (
              <div className="border-t border-gray-200 my-1" />
            )}
            {availableUsers.map((u) => (
              <button
                key={u.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(u.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedUser === u.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
              >
                <div className="font-medium">{u.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFilterDropdown;
