import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Users, Award } from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  roleAwarded: string;
  sections: number;
  estimatedTime: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  completedDate?: string;
  icon: string;
  requiresApproval?: boolean;
}

interface CourseCardProps {
  course: Course;
  onStart: (course: Course) => void;
  onResume: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onStart, onResume }) => {
  const getStatusColor = () => {
    switch (course.status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'in-progress': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const getStatusBadge = () => {
    switch (course.status) {
      case 'completed': 
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in-progress': 
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      default: 
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
    }
  };

  const getActionButton = () => {
    switch (course.status) {
      case 'completed':
        return (
          <Button disabled className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed
          </Button>
        );
      case 'in-progress':
        return (
          <Button onClick={() => onResume(course)} className="w-full bg-[#2D8028] hover:bg-[#203B17]">
            Resume Course
          </Button>
        );
      default:
        return (
          <Button onClick={() => onStart(course)} className="w-full bg-[#2D8028] hover:bg-[#203B17]">
            Start Course
          </Button>
        );
    }
  };

  const progressPercentage = course.sections > 0 ? (course.progress / course.sections) * 100 : 0;

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-lg ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="text-4xl mb-2">{course.icon}</div>
          {getStatusBadge()}
        </div>
        <CardTitle className="text-lg text-[#203B17] leading-tight">
          {course.title}
        </CardTitle>
        {course.requiresApproval && (
          <Badge variant="outline" className="w-fit text-xs">
            <Users className="h-3 w-3 mr-1" />
            Manager Approval Required
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center">
            📑 {course.sections} sections
          </span>
          <span className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {course.estimatedTime}
          </span>
        </div>

        {course.status === 'in-progress' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{course.progress}/{course.sections} sections</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {course.roleAwarded && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="flex items-center text-sm text-blue-800">
              <Award className="h-4 w-4 mr-2" />
              <span><strong>Awards:</strong> {course.roleAwarded} role</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {getActionButton()}
          {course.status === 'completed' && course.completedDate && (
            <p className="text-xs text-gray-500 text-center">
              Completed on {new Date(course.completedDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;