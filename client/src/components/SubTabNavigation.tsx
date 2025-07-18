import React from 'react';
import { getStoredAuth } from '@/lib/auth';

interface SubTab {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
  requiresRole?: string;
}

interface SubTabNavigationProps {
  tabs: SubTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const SubTabNavigation: React.FC<SubTabNavigationProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange 
}) => {
  const auth = getStoredAuth();
  const currentUser = auth.user;
  
  const visibleTabs = tabs.filter(tab => 
    !tab.requiresRole || 
    currentUser?.role === tab.requiresRole || 
    currentUser?.role === 'corporate'
  );
  
  return (
    <div className="sub-tab-navigation">
      {visibleTabs.map(tab => (
        <button
          key={tab.id}
          className={`sub-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
};