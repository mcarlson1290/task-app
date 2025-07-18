import React, { useState } from "react";
import { SubTabNavigation } from "@/components/SubTabNavigation";
import { TaskOverview } from "@/components/TaskOverview";
import { TaskAnalytics } from "@/components/TaskAnalytics";
import { useLocation } from "@/contexts/LocationContext";
import { getStoredAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const TaskData: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { currentLocation, isViewingAllLocations } = useLocation();
  const auth = getStoredAuth();
  const isManager = auth.user?.role === 'manager' || auth.user?.role === 'corporate';
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'costs', label: 'Cost Analysis', icon: '💰' }
  ];
  
  if (!isManager) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 text-center">
              This page is only available to managers and corporate users.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="task-data-page">
      {/* Navigation and Actions on same line */}
      <div className="nav-with-actions">
        <SubTabNavigation 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="nav-actions">
          <button className="btn-export">
            📊 Export Task Report
          </button>
        </div>
      </div>
      
      <div className="tab-content">
        {activeTab === 'overview' && <TaskOverview />}
        {activeTab === 'analytics' && <TaskAnalytics />}
        {activeTab === 'costs' && <div className="p-8 text-center text-gray-500">Cost Analysis coming soon...</div>}
      </div>
    </div>
  );
};

export default TaskData;