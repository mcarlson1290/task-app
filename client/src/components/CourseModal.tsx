import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, X, Play, ArrowRight } from "lucide-react";

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

interface CourseModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (courseId: number) => void;
}

const CourseModal: React.FC<CourseModalProps> = ({ course, isOpen, onClose, onComplete }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [sectionCompleted, setSectionCompleted] = useState(false);
  
  // Update current section when course changes
  useEffect(() => {
    if (course) {
      setCurrentSection(course.progress || 0);
      setSectionCompleted(false);
    }
  }, [course]);
  
  if (!course) return null;
  
  const totalSections = course.sections;
  const isLastSection = currentSection === totalSections - 1;

  const handleNext = () => {
    if (isLastSection && sectionCompleted) {
      onComplete(course.id);
    } else if (sectionCompleted) {
      setCurrentSection(currentSection + 1);
      setSectionCompleted(false);
    }
  };

  const getSectionTitle = (courseId: number, sectionIndex: number) => {
    const titles: Record<number, string[]> = {
      1: ['Safety First', 'Seed Types', 'Tray Preparation', 'Seeding Technique', 'Record Keeping'],
      2: ['Timing Recognition', 'Cutting Tools', 'Harvest Methods', 'Quality Control', 'Packaging', 'Storage'],
      3: ['Sanitization Basics', 'Equipment Cleaning', 'Personal Hygiene', 'Safety Protocols'],
      4: ['Equipment Overview', 'Operation Procedures', 'Maintenance Schedule', 'Troubleshooting', 'Safety Systems', 'Documentation', 'Emergency Procedures', 'Quality Checks'],
      5: ['Leadership Fundamentals', 'Team Management', 'Scheduling Systems', 'Performance Metrics', 'Communication', 'Problem Solving', 'Resource Planning', 'Quality Assurance', 'Training Others', 'Operational Excellence']
    };
    return titles[courseId]?.[sectionIndex] || `Section ${sectionIndex + 1}`;
  };

  const progressPercentage = ((currentSection + (sectionCompleted ? 1 : 0)) / totalSections) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{course.icon}</span>
              <div>
                <DialogTitle className="text-xl text-[#203B17]">
                  {course.title}
                </DialogTitle>
                <DialogDescription>
                  Section {currentSection + 1} of {totalSections}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Course Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Section Indicators */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalSections }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < currentSection ? 'bg-green-500' : 
                  i === currentSection ? 'bg-blue-500' : 
                  'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Section Content */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Play className="h-5 w-5 text-[#2D8028]" />
                  <h3 className="text-lg font-semibold text-[#203B17]">
                    {getSectionTitle(course.id, currentSection)}
                  </h3>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 mb-4">
                    This section covers essential knowledge and skills for the {course.roleAwarded} role.
                  </p>
                  
                  <div className="space-y-2">
                    <p className="font-medium text-gray-800">Learning objectives:</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• 📹 Watch instructional videos</li>
                      <li>• 📄 Review detailed procedures</li>
                      <li>• 🖼️ Study visual guides and diagrams</li>
                      <li>• ✅ Complete interactive exercises</li>
                      <li>• ❓ Pass section quiz</li>
                    </ul>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Section Review</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Please confirm you have reviewed all materials in this section.
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sectionCompleted}
                        onChange={(e) => setSectionCompleted(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-blue-800">
                        I have completed this section
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex items-center gap-2"
            >
              Save & Exit
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!sectionCompleted}
              className={`flex items-center gap-2 ${
                isLastSection ? 'bg-green-600 hover:bg-green-700' : 'bg-[#2D8028] hover:bg-[#203B17]'
              }`}
            >
              {isLastSection ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete Course
                </>
              ) : (
                <>
                  Next Section
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseModal;