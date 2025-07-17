import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Users, Award, Edit3 } from "lucide-react";

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
  prerequisites?: {
    courses: number[];
    requirements: {
      type: 'age' | 'tenure' | 'license' | 'certification';
      value: number | string;
      label: string;
    }[];
  };
}

interface CourseCardProps {
  course: Course;
  onStart: (course: Course) => void;
  onResume: (course: Course) => void;
  onEdit?: (course: Course) => void;
  allCourses?: Course[];
  isLocked?: boolean;
  isCorporateManager?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onStart, onResume, onEdit, allCourses = [], isLocked = false, isCorporateManager = false }) => {
  const checkPrerequisites = () => {
    if (!course.prerequisites) {
      return true;
    }
    
    // Check course prerequisites
    const coursePrereqsMet = course.prerequisites.courses.every(prereqId => {
      const prereqCourse = allCourses.find(c => c.id === prereqId);
      return prereqCourse?.status === 'completed';
    });
    
    // Check additional requirements (mock implementation for demo)
    const requirementsMet = course.prerequisites.requirements.every(req => {
      switch (req.type) {
        case 'age':
          return true; // Mock: assume user meets age requirement
        case 'tenure':
          return true; // Mock: assume user has sufficient tenure
        case 'license':
        case 'certification':
          return Math.random() > 0.3; // Mock: simulate some users having certifications
        default:
          return true;
      }
    });
    
    return coursePrereqsMet && requirementsMet;
  };

  const prerequisitesMet = checkPrerequisites();
  const courseIsLocked = isLocked || !prerequisitesMet;

  const getStatusColor = () => {
    if (courseIsLocked) return 'bg-gray-50 border-gray-300';
    switch (course.status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'in-progress': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const getStatusBadge = () => {
    if (courseIsLocked) {
      return <Badge className="bg-gray-100 text-gray-800">🔒 Locked</Badge>;
    }
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
    if (courseIsLocked) {
      return (
        <Button disabled className="w-full bg-gray-200 text-gray-500">
          🔒 Locked
        </Button>
      );
    }
    
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

  const getPrerequisiteNames = () => {
    if (!course.prerequisites || course.prerequisites.courses.length === 0) {
      return [];
    }
    return course.prerequisites.courses.map(prereqId => {
      const prereq = allCourses.find(c => c.id === prereqId);
      return prereq?.title || 'Unknown Course';
    });
  };

  const progressPercentage = course.sections > 0 ? (course.progress / course.sections) * 100 : 0;

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-lg ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="text-4xl mb-2">{course.icon}</div>
          <div className="flex items-center space-x-2">
            {isCorporateManager && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(course)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-[#203B17]"
                title="Edit Course"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            {getStatusBadge()}
          </div>
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

        {course.prerequisites && (course.prerequisites.courses.length > 0 || course.prerequisites.requirements.length > 0) && (
          <div className={`p-3 rounded-lg mb-4 ${prerequisitesMet ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center text-sm mb-2">
              <span className="font-medium">
                {prerequisitesMet ? '✅ All Requirements Met' : '🔒 Requirements:'}
              </span>
            </div>
            {!prerequisitesMet && (
              <div className="space-y-2">
                {course.prerequisites.courses.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-red-800 mb-1">Required Courses:</div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {getPrerequisiteNames().map((name, idx) => (
                        <li key={idx} className="flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-2 flex-shrink-0"></span>
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {course.prerequisites.requirements.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-red-800 mb-1">Additional Requirements:</div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {course.prerequisites.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-2 flex-shrink-0"></span>
                          {req.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
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