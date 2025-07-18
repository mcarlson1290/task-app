import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from "recharts";
import { 
  TrendingUp, Clock, CheckCircle, AlertTriangle, Users, 
  Target, Award, Activity, RotateCcw, Zap 
} from "lucide-react";
import { DashboardAnalytics } from "@/types";
import { useLocation } from "@/contexts/LocationContext";
import { RecurringTaskAnalytics } from "./RecurringTaskAnalytics";

// Staff Comparison Component
const StaffComparison: React.FC = () => {
  const { currentLocation, isViewingAllLocations } = useLocation();
  
  // Mock staff performance data - replace with real data
  const staffData = [
    { name: 'Sarah Johnson', tasksCompleted: 45, avgTime: 22.5, efficiency: 96.2, location: 'K' },
    { name: 'Dan Smith', tasksCompleted: 42, avgTime: 24.1, efficiency: 94.8, location: 'K' },
    { name: 'Mike Wilson', tasksCompleted: 38, avgTime: 26.3, efficiency: 92.1, location: 'R' },
    { name: 'Lisa Brown', tasksCompleted: 41, avgTime: 23.7, efficiency: 95.4, location: 'R' },
    { name: 'Tom Davis', tasksCompleted: 39, avgTime: 25.8, efficiency: 93.6, location: 'MKE' },
    { name: 'Emma Clark', tasksCompleted: 44, avgTime: 21.9, efficiency: 97.1, location: 'MKE' },
  ];

  const filteredStaffData = isViewingAllLocations 
    ? staffData 
    : staffData.filter(staff => staff.location === currentLocation.code);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Staff Performance Chart */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Staff Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredStaffData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasksCompleted" fill="#10b981" name="Tasks Completed" />
                <Bar dataKey="avgTime" fill="#3b82f6" name="Avg. Time (min)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Efficiency Ratings */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Efficiency Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStaffData.map((staff, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{staff.name}</div>
                    <div className="text-sm text-gray-600">{staff.tasksCompleted} tasks</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{staff.efficiency.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">{staff.avgTime.toFixed(1)} min avg</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Task Efficiency Component
const TaskEfficiency: React.FC = () => {
  const { currentLocation, isViewingAllLocations } = useLocation();
  
  // Mock efficiency data - replace with real data
  const efficiencyData = [
    { task: 'Seeding', planned: 30, actual: 25, efficiency: 120 },
    { task: 'Harvesting', planned: 45, actual: 42, efficiency: 107 },
    { task: 'Cleaning', planned: 20, actual: 22, efficiency: 91 },
    { task: 'Maintenance', planned: 35, actual: 38, efficiency: 92 },
    { task: 'Packaging', planned: 25, actual: 23, efficiency: 109 },
  ];

  const timeAnalysis = [
    { hour: '8:00', tasks: 12, efficiency: 95 },
    { hour: '9:00', tasks: 15, efficiency: 98 },
    { hour: '10:00', tasks: 18, efficiency: 102 },
    { hour: '11:00', tasks: 16, efficiency: 99 },
    { hour: '12:00', tasks: 8, efficiency: 85 },
    { hour: '13:00', tasks: 14, efficiency: 96 },
    { hour: '14:00', tasks: 17, efficiency: 101 },
    { hour: '15:00', tasks: 15, efficiency: 97 },
    { hour: '16:00', tasks: 12, efficiency: 94 },
  ];

  return (
    <div className="space-y-6">
      {/* Efficiency Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Efficiency</p>
              <p className="text-2xl font-bold text-green-600">104.2%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-blue-600">2.4 hrs</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Peak Hour</p>
              <p className="text-2xl font-bold text-purple-600">10:00 AM</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Efficiency */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Task Type Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="task" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="planned" fill="#e5e7eb" name="Planned Time" />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual Time" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Analysis */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Hourly Efficiency Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="tasks" fill="#10b981" name="Tasks Completed" />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Efficiency %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const TaskAnalytics: React.FC = () => {
  const [activeView, setActiveView] = React.useState<'recurring' | 'staff' | 'efficiency'>('recurring');
  const [timePeriod, setTimePeriod] = React.useState("7d");
  const { currentLocation, isViewingAllLocations } = useLocation();

  const { data: analytics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard", { location: currentLocation.code }],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/dashboard?location=${currentLocation.code}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  const COLORS = ['#2D8028', '#203B17', '#4ADE80', '#F59E0B', '#EF4444'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
        <p className="text-gray-600">Analytics will appear here once you have task data.</p>
      </div>
    );
  }

  const taskStatusData = [
    { name: 'Completed', value: analytics.completedTasks, color: '#2D8028' },
    { name: 'In Progress', value: analytics.inProgressTasks, color: '#F59E0B' },
    { name: 'Pending', value: analytics.pendingTasks, color: '#6B7280' },
  ];

  const taskTypeData = Object.entries(analytics.tasksByType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
    value: count,
  }));

  const completionRate = analytics.totalTasks > 0 
    ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100)
    : 0;

  const avgTimePerTask = analytics.completedTasks > 0 
    ? Math.round(analytics.totalTimeLogged / analytics.completedTasks)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#203B17] mb-2">Task Analytics</h2>
          <p className="text-gray-600">Performance insights and task completion metrics</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        <Button
          variant={activeView === 'recurring' ? 'default' : 'ghost'}
          onClick={() => setActiveView('recurring')}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Recurring Task Analysis
        </Button>
        <Button
          variant={activeView === 'staff' ? 'default' : 'ghost'}
          onClick={() => setActiveView('staff')}
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Staff Comparison
        </Button>
        <Button
          variant={activeView === 'efficiency' ? 'default' : 'ghost'}
          onClick={() => setActiveView('efficiency')}
          className="flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Efficiency Metrics
        </Button>
      </div>

      {/* Content based on active view */}
      {activeView === 'recurring' && <RecurringTaskAnalytics />}
      {activeView === 'staff' && <StaffComparison />}
      {activeView === 'efficiency' && <TaskEfficiency />}
    </div>
  );
};