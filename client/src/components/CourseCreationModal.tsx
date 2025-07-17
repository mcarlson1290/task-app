import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Minus } from "lucide-react";

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
  prerequisites?: number[];
}

interface CourseCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Omit<Course, 'id' | 'status' | 'progress'>) => void;
  allCourses: Course[];
}

interface CourseSection {
  title: string;
  type: 'text' | 'video' | 'quiz' | 'checklist';
  content: string;
}

const CourseCreationModal: React.FC<CourseCreationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  allCourses 
}) => {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    roleAwarded: '',
    estimatedTime: '',
    icon: '📚',
    prerequisites: [] as number[],
    requiresApproval: false
  });

  const [sections, setSections] = useState<CourseSection[]>([
    { title: '', type: 'text' as const, content: '' }
  ]);

  const availableIcons = ['📚', '🌱', '🌾', '🧹', '🔧', '🦺', '📊', '🌿', '👔', '⚙️', '🎯', '📋'];

  const handleAddSection = () => {
    setSections([...sections, { title: '', type: 'text', content: '' }]);
  };

  const handleRemoveSection = (index: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index));
    }
  };

  const handleSectionChange = (index: number, field: keyof CourseSection, value: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };

  const handlePrerequisiteToggle = (courseId: number, checked: boolean) => {
    if (checked) {
      setCourseData({
        ...courseData,
        prerequisites: [...courseData.prerequisites, courseId]
      });
    } else {
      setCourseData({
        ...courseData,
        prerequisites: courseData.prerequisites.filter(id => id !== courseId)
      });
    }
  };

  const handleSave = () => {
    if (!courseData.title || !courseData.roleAwarded || !courseData.estimatedTime) {
      alert('Please fill in all required fields');
      return;
    }

    const newCourse = {
      ...courseData,
      sections: sections.length,
      completedDate: undefined
    };

    onSave(newCourse);
    
    // Reset form
    setCourseData({
      title: '',
      description: '',
      roleAwarded: '',
      estimatedTime: '',
      icon: '📚',
      prerequisites: [],
      requiresApproval: false
    });
    setSections([{ title: '', type: 'text', content: '' }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#203B17]">
            Create New Course
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={courseData.title}
                onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                placeholder="e.g., Advanced Hydroponics Training"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="roleAwarded">Role Awarded *</Label>
              <Input
                id="roleAwarded"
                value={courseData.roleAwarded}
                onChange={(e) => setCourseData({ ...courseData, roleAwarded: e.target.value })}
                placeholder="e.g., Senior Technician"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="estimatedTime">Estimated Time *</Label>
              <Input
                id="estimatedTime"
                value={courseData.estimatedTime}
                onChange={(e) => setCourseData({ ...courseData, estimatedTime: e.target.value })}
                placeholder="e.g., 2 hours"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Course Icon</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableIcons.map(icon => (
                  <Button
                    key={icon}
                    type="button"
                    variant={courseData.icon === icon ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCourseData({ ...courseData, icon })}
                    className="text-lg"
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={courseData.description}
              onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
              placeholder="Brief description of what students will learn..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Prerequisites */}
          <div>
            <Label>Prerequisites</Label>
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
              {allCourses.map(course => (
                <div key={course.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`prereq-${course.id}`}
                    checked={courseData.prerequisites.includes(course.id)}
                    onCheckedChange={(checked) => 
                      handlePrerequisiteToggle(course.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={`prereq-${course.id}`} className="text-sm">
                    {course.icon} {course.title}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Manager Approval */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresApproval"
              checked={courseData.requiresApproval}
              onCheckedChange={(checked) => 
                setCourseData({ ...courseData, requiresApproval: checked as boolean })
              }
            />
            <Label htmlFor="requiresApproval">Requires Manager Approval</Label>
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">Course Sections</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSection}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>

            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Section {index + 1}</h4>
                    {sections.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSection(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Section Title</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                        placeholder="e.g., Introduction to Hydroponics"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Content Type</Label>
                      <select
                        value={section.type}
                        onChange={(e) => handleSectionChange(index, 'type', e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                      >
                        <option value="text">Text Content</option>
                        <option value="video">Video</option>
                        <option value="quiz">Quiz</option>
                        <option value="checklist">Checklist</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={section.content}
                      onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                      placeholder="Section content/instructions..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#2D8028] hover:bg-[#203B17]">
            Create Course
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseCreationModal;