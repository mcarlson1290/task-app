import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, BookOpen, Award, CheckCircle, Play } from "lucide-react";
import { TrainingModule, UserProgress } from "@shared/schema";
import { getStoredAuth } from "@/lib/auth";

const Education: React.FC = () => {
  const auth = getStoredAuth();

  const { data: modules = [], isLoading } = useQuery<TrainingModule[]>({
    queryKey: ["/api/training/modules"],
  });

  const { data: progress = [] } = useQuery<UserProgress[]>({
    queryKey: ["/api/training/progress", auth.user?.id],
    enabled: !!auth.user?.id,
  });

  const getModuleProgress = (moduleId: number) => {
    return progress.find(p => p.moduleId === moduleId);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      operations: "⚙️",
      safety: "🛡️",
      quality: "✅",
      equipment: "🔧",
      general: "📚",
    };
    return icons[category as keyof typeof icons] || "📚";
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const completedModules = progress.filter(p => p.completed).length;
  const totalModules = modules.length;
  const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#203B17] mb-2">Education Center</h1>
          <p className="text-gray-600">Complete training modules to unlock new roles and skills</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button className="bg-[#2D8028] hover:bg-[#203B17] text-white">
            <BookOpen className="h-4 w-4 mr-2" />
            Create Module
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-[#2D8028]" />
            Your Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Modules Completed</span>
              <span className="font-medium text-[#203B17]">
                {completedModules}/{totalModules}
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{Math.round(overallProgress)}% Complete</span>
              <span>{totalModules - completedModules} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {modules.map((module) => {
          const moduleProgress = getModuleProgress(module.id);
          const isCompleted = moduleProgress?.completed || false;
          const score = moduleProgress?.score || 0;

          return (
            <Card key={module.id} className={`hover:shadow-md transition-shadow ${
              isCompleted ? 'border-green-200 bg-green-50' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getCategoryIcon(module.category)}</span>
                    <div>
                      <h3 className="font-semibold text-[#203B17]">{module.title}</h3>
                      <p className="text-sm text-gray-600 capitalize">{module.category}</p>
                    </div>
                  </div>
                  {isCompleted && (
                    <Badge className="bg-green-100 text-green-800 border-none">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {module.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{formatDuration(module.duration || 0)}</span>
                    </div>
                    {module.requiredForRole && (
                      <Badge variant="outline" className="text-xs">
                        {module.requiredForRole}
                      </Badge>
                    )}
                  </div>

                  {isCompleted && score > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Your Score</span>
                      <span className="font-medium text-[#203B17]">{score}%</span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {isCompleted ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Review module
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Review Module
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-[#2D8028] hover:bg-[#203B17] text-white"
                      onClick={() => {
                        // Start module
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Module
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No training modules available</h3>
          <p className="text-gray-600">
            Training modules will appear here when they become available.
          </p>
        </div>
      )}
    </div>
  );
};

export default Education;
