import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Target, Award } from "lucide-react";
import { Task } from "@shared/schema";

interface TaskPerformanceWidgetProps {
  tasks: Task[];
}

const TaskPerformanceWidget: React.FC<TaskPerformanceWidgetProps> = ({ tasks }) => {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayTasks = tasks.filter(t => {
    const today = new Date();
    const taskDate = new Date(t.createdAt);
    return taskDate.toDateString() === today.toDateString();
  }).length;

  const highPriorityCompleted = tasks.filter(t => 
    t.status === 'completed' && t.priority === 'high'
  ).length;

  const averageProgress = tasks.length > 0 
    ? Math.round(tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length)
    : 0;

  const getPerformanceLevel = (rate: number) => {
    if (rate >= 80) return { label: "Excellent", color: "bg-green-500" };
    if (rate >= 60) return { label: "Good", color: "bg-blue-500" };
    if (rate >= 40) return { label: "Average", color: "bg-yellow-500" };
    return { label: "Needs Improvement", color: "bg-red-500" };
  };

  const performance = getPerformanceLevel(completionRate);

  return (
    <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-[#2D8028]/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-[#203B17]">
          <TrendingUp className="h-5 w-5" />
          Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-[#2D8028]">{completedTasks}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-amber-600">{inProgressTasks}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Completion Rate</span>
            <Badge className={`${performance.color} text-white`}>
              {performance.label}
            </Badge>
          </div>
          <Progress value={completionRate} className="h-2" />
          <div className="text-xs text-gray-600 text-right">{completionRate}%</div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm font-medium text-[#203B17]">{todayTasks}</div>
              <div className="text-xs text-gray-600">Today's Tasks</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            <div>
              <div className="text-sm font-medium text-[#203B17]">{highPriorityCompleted}</div>
              <div className="text-xs text-gray-600">High Priority Done</div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Average Progress</span>
          </div>
          <Progress value={averageProgress} className="h-2" />
          <div className="text-xs text-gray-600 text-right mt-1">{averageProgress}%</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskPerformanceWidget;