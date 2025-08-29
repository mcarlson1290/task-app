import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocation } from '@/contexts/LocationContext';
import { TrendingUp, TrendingDown, Minus, Clock, CheckCircle, SkipForward } from 'lucide-react';

interface RecurringTaskData {
  id: string;
  title: string;
  frequency: string;
  avgCompletionTime: number;
  completionRate: number;
  totalInstances: number;
  assignedTo: string;
  trend: 'improving' | 'stable' | 'declining';
  location: string;
}

export const RecurringTaskAnalytics: React.FC = () => {
  const { currentLocation, isViewingAllLocations } = useLocation();
  const [selectedTask, setSelectedTask] = useState('all');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompareTasks, setSelectedCompareTasks] = useState<string[]>([]);

  const { data: recurringTasks = [], isLoading } = useQuery<RecurringTaskData[]>({
    queryKey: ['/api/recurring-tasks', { location: currentLocation.code }],
    queryFn: async () => {
      const response = await fetch(`/api/recurring-tasks?location=${currentLocation.code}`);
      if (!response.ok) throw new Error('Failed to fetch recurring tasks');
      const rawTasks = await response.json();
      
      // Transform to analytics format with mock analytics data
      return rawTasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        frequency: task.frequency,
        avgCompletionTime: Math.random() * 30 + 15, // Mock data
        completionRate: Math.random() * 20 + 80, // Mock data  
        totalInstances: Math.floor(Math.random() * 100) + 50, // Mock data
        assignedTo: task.assignedTo || 'Team',
        trend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as 'improving' | 'stable' | 'declining',
        location: task.location || currentLocation.code
      }));
    },
    enabled: true,
  });

  // Filter tasks by location if needed
  const filteredTasks = useMemo(() => {
    if (isViewingAllLocations) return recurringTasks;
    return recurringTasks.filter(task => task.location === currentLocation.code);
  }, [recurringTasks, currentLocation.code, isViewingAllLocations]);

  // Performance over time for selected task (mock data)
  const performanceData = useMemo(() => {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
    return weeks.map(week => ({
      week,
      avgTime: Math.random() * 10 + 15,
      completionRate: Math.random() * 15 + 85,
      instances: Math.floor(Math.random() * 20) + 30
    }));
  }, [selectedTask]);

  // Staff performance on selected task (mock data)
  const staffPerformance = useMemo(() => {
    const staff = ['Sarah', 'Dan', 'Mike', 'Lisa', 'Tom', 'Emma'];
    return staff.map(name => ({
      name,
      avgTime: Math.random() * 10 + 15,
      instances: Math.floor(Math.random() * 20) + 30,
      successRate: Math.random() * 10 + 90
    }));
  }, [selectedTask]);

  // Task comparison data
  const comparisonData = useMemo(() => {
    if (!compareMode || selectedCompareTasks.length === 0) return [];
    
    const tasksToCompare = filteredTasks.filter(task => selectedCompareTasks.includes(task.id));
    return tasksToCompare.map(task => ({
      name: task.title.substring(0, 20) + '...',
      completionRate: task.completionRate,
      avgTime: task.avgCompletionTime,
      instances: task.totalInstances
    }));
  }, [filteredTasks, selectedCompareTasks, compareMode]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#203B17] mb-2">Recurring Task Analytics</h2>
          <p className="text-gray-600">Analyze performance patterns and trends for recurring tasks</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Recurring Tasks</SelectItem>
              {filteredTasks.map(task => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={compareMode ? 'default' : 'outline'}
            onClick={() => setCompareMode(!compareMode)}
          >
            Compare Tasks
          </Button>
        </div>
      </div>

      {/* Compare Mode Selection */}
      {compareMode && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">Select tasks to compare:</span>
            {filteredTasks.map(task => (
              <Badge
                key={task.id}
                variant={selectedCompareTasks.includes(task.id) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedCompareTasks(prev => 
                    prev.includes(task.id) 
                      ? prev.filter(id => id !== task.id)
                      : [...prev, task.id]
                  );
                }}
              >
                {task.title}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Task Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.frequency}</p>
              </div>
              {getTrendIcon(task.trend)}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Completion Rate</span>
                </div>
                <span className="font-semibold">{task.completionRate.toFixed(1)}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Avg. Time</span>
                </div>
                <span className="font-semibold">{task.avgCompletionTime.toFixed(1)} min</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <SkipForward className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Total Instances</span>
                </div>
                <span className="font-semibold">{task.totalInstances}</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Assigned to</span>
                  <Badge variant="outline">{task.assignedTo?.replace?.('role_', '') || task.assignedTo}</Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Over Time */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Performance Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="instances" fill="#e5e7eb" name="Instances" />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Completion Rate (%)"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avgTime" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Avg. Time (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Staff Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={staffPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="avgTime" fill="#3b82f6" name="Avg. Time (min)" />
                <Bar dataKey="successRate" fill="#10b981" name="Success Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Comparison (if in compare mode) */}
        {compareMode && comparisonData.length > 0 && (
          <Card className="p-6 lg:col-span-2">
            <CardHeader>
              <CardTitle>Task Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="completionRate" fill="#10b981" name="Completion Rate (%)" />
                  <Bar yAxisId="right" dataKey="avgTime" fill="#3b82f6" name="Avg. Time (min)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task Performance Summary */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(filteredTasks.reduce((acc, task) => acc + task.completionRate, 0) / filteredTasks.length).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Average Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(filteredTasks.reduce((acc, task) => acc + task.avgCompletionTime, 0) / filteredTasks.length).toFixed(1)} min
              </div>
              <div className="text-sm text-gray-600">Average Completion Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {filteredTasks.reduce((acc, task) => acc + task.totalInstances, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Instances</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};