import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskOverview } from "@/components/TaskOverview";
import { TaskAnalytics } from "@/components/TaskAnalytics";
import { useLocation } from "@/contexts/LocationContext";
import { getStoredAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const TaskData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const { currentLocation, isViewingAllLocations } = useLocation();
  const auth = getStoredAuth();
  const isManager = auth.user?.role === 'manager' || auth.user?.role === 'corporate';
  
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
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'analytics')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            📋 Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            📈 Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <TaskOverview />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <TaskAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskData;