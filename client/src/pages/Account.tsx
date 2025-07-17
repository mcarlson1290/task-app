import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";

const Account: React.FC = () => {
  const auth = getStoredAuth();
  
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: auth.isAuthenticated,
  });

  // Calculate real stats from tasks
  const userTasks = tasks.filter(task => task.assignedTo === auth.user?.id);
  const completedTasks = userTasks.filter(t => t.status === 'completed');
  const activeTasks = userTasks.filter(t => t.status === 'in_progress' || t.status === 'paused');
  
  const thisWeekCompleted = completedTasks.filter(t => {
    if (!t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return completedDate > weekAgo;
  }).length;

  const onTimeCompletionRate = completedTasks.length > 0 
    ? Math.round((completedTasks.filter(t => {
        if (!t.completedAt || !t.dueDate) return true;
        return new Date(t.completedAt) <= new Date(t.dueDate);
      }).length / completedTasks.length) * 100)
    : 100;

  // Get recent tasks (last 5 completed or modified tasks)
  const recentTasks = userTasks
    .filter(t => t.completedAt || t.startedAt)
    .sort((a, b) => {
      const aDate = new Date(a.completedAt || a.startedAt || 0);
      const bDate = new Date(b.completedAt || b.startedAt || 0);
      return bDate.getTime() - aDate.getTime();
    })
    .slice(0, 5);

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const taskDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getTaskIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'paused': return '⏸️';
      case 'skipped': return '⏭️';
      default: return '📋';
    }
  };

  const getRoleTrainingData = (role: string) => {
    switch (role) {
      case 'manager':
        return {
          badges: ['Manager', 'Harvest Tech', 'Seeding Tech'],
          completedCourses: 4,
          totalCourses: 5,
          progressPercent: 80
        };
      case 'technician':
        return {
          badges: ['Farm Technician', 'Safety Certified'],
          completedCourses: 3,
          totalCourses: 4,
          progressPercent: 75
        };
      default:
        return {
          badges: ['General Staff'],
          completedCourses: 2,
          totalCourses: 3,
          progressPercent: 67
        };
    }
  };

  const trainingData = getRoleTrainingData(auth.user?.role || '');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#203B17] mb-2">Account Information</h1>
        <p className="text-gray-600">Your profile and activity summary</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>👤</span>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
              <p className="text-lg text-[#203B17] font-medium">{auth.user?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Email</label>
              <p className="text-lg text-[#203B17] font-medium">{auth.user?.username}@growspace.farm</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Employee ID</label>
              <p className="text-lg text-[#203B17] font-medium">EMP{String(auth.user?.id).padStart(3, '0')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🏢</span>
              Work Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current Role</label>
              <p className="text-lg text-[#203B17] font-medium capitalize">{auth.user?.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Assigned Location</label>
              <p className="text-lg text-[#203B17] font-medium">Grow Space Vertical Farm</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Trained Roles</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {trainingData.badges.map((badge, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎓</span>
              Training Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Progress</label>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#2D8028] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${trainingData.progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {trainingData.completedCourses} of {trainingData.totalCourses} required courses completed
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Completion Rate</label>
              <p className="text-lg text-[#203B17] font-medium">{trainingData.progressPercent}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊</span>
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#203B17]">{thisWeekCompleted}</div>
              <div className="text-sm text-gray-600">Tasks Completed This Week</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#203B17]">{completedTasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks Completed</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#203B17]">{onTimeCompletionRate}%</div>
              <div className="text-sm text-gray-600">On-Time Completion Rate</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#203B17]">{activeTasks.length}</div>
              <div className="text-sm text-gray-600">Active Tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🕒</span>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">{getTaskIcon(task.status)}</span>
                  <div className="flex-1">
                    <span className="font-medium text-[#203B17]">{task.title}</span>
                    <div className="text-sm text-gray-600 capitalize">{task.type.replace('-', ' ')}</div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(task.completedAt || task.startedAt || '')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity</p>
                <p className="text-sm">Complete some tasks to see your activity here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;