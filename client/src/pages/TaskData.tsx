import React, { useState } from "react";
import { TaskOverview } from "@/components/TaskOverview";
import { TaskAnalytics } from "@/components/TaskAnalytics";
import { useLocation } from "@/contexts/LocationContext";
import { getStoredAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import SubHeader from "@/components/SubHeader";

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
      <SubHeader>
        <div className="tab-group">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
          <button 
            className={`tab-button ${activeTab === 'costs' ? 'active' : ''}`}
            onClick={() => setActiveTab('costs')}
          >
            💰 Cost Analysis
          </button>
        </div>
        <button className="btn-primary ml-auto">
          📊 Export Task Report
        </button>
      </SubHeader>
      
      <div className="tab-content">
        {activeTab === 'overview' && <TaskOverview />}
        {activeTab === 'analytics' && <TaskAnalytics />}
        {activeTab === 'costs' && <div className="p-8 text-center text-gray-500">Cost Analysis coming soon...</div>}
      </div>
    </div>
  );
};

export default TaskData;