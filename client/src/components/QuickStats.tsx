import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { DashboardAnalytics } from "@/types";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

const QuickStats: React.FC = () => {
  const { data: analytics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const completionRate = analytics.totalTasks > 0 
    ? (analytics.completedTasks / analytics.totalTasks) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#203B17]">
          Today's Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Completed Tasks</span>
            <span className="text-sm font-medium text-[#203B17]">
              {analytics.completedTasks}/{analytics.totalTasks}
            </span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">Hours Logged</span>
            </div>
            <span className="text-sm font-medium text-[#203B17]">
              {Math.round(analytics.totalTimeLogged / 60 * 10) / 10}h
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-sm text-gray-600">In Progress</span>
            </div>
            <span className="text-sm font-medium text-amber-600">
              {analytics.inProgressTasks}
            </span>
          </div>

          {analytics.lowStockAlerts > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                <span className="text-sm text-gray-600">Low Stock Alerts</span>
              </div>
              <span className="text-sm font-medium text-red-600">
                {analytics.lowStockAlerts}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStats;
