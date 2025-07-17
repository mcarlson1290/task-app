import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Minus } from "lucide-react";

// RequirementBuilder Component
const RequirementBuilder: React.FC<{ onAdd: (req: any) => void }> = ({ onAdd }) => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [reqType, setReqType] = useState('age');
  const [reqValue, setReqValue] = useState('');
  const [reqLabel, setReqLabel] = useState('');

  const handleAddRequirement = () => {
    if (!reqLabel) return;
    
    onAdd({
      type: reqType,
      value: reqType === 'age' || reqType === 'tenure' ? parseInt(reqValue) : reqValue,
      label: reqLabel
    });
    
    // Reset
    setReqValue('');
    setReqLabel('');
    setShowBuilder(false);
  };

  return (
    <div>
      {!showBuilder ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowBuilder(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Requirement
        </Button>
      ) : (
        <div className="border rounded p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <select
                value={reqType}
                onChange={(e) => setReqType(e.target.value)}
                className="w-full p-1 border rounded text-sm"
              >
                <option value="age">Age Requirement</option>
                <option value="tenure">Employment Duration</option>
                <option value="license">License/Permit</option>
                <option value="certification">Certification</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Value</Label>
              <Input
                value={reqValue}
                onChange={(e) => setReqValue(e.target.value)}
                placeholder={reqType === 'age' ? '18' : reqType === 'tenure' ? '30' : 'drivers'}
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Display Label</Label>
            <Input
              value={reqLabel}
              onChange={(e) => setReqLabel(e.target.value)}
              placeholder="e.g., Must be 18 or older"
              className="text-sm"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddRequirement}
              className="flex-1"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBuilder(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

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

interface CourseCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Omit<Course, 'id' | 'status' | 'progress'>) => void;
  allCourses: Course[];
  editingCourse?: Course | null;
}

interface CourseSection {
  title: string;
  type: 'text' | 'video' | 'image' | 'rich-text' | 'quiz' | 'checklist';
  content: string;
  caption?: string;
}

const CourseCreationModal: React.FC<CourseCreationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  allCourses,
  editingCourse = null
}) => {
  const [courseData, setCourseData] = useState({
    title: editingCourse?.title || '',
    description: editingCourse?.description || '',
    roleAwarded: editingCourse?.roleAwarded || '',
    estimatedTime: editingCourse?.estimatedTime || '',
    icon: editingCourse?.icon || '📚',
    prerequisites: editingCourse?.prerequisites || { courses: [], requirements: [] },
    requiresApproval: editingCourse?.requiresApproval || false
  });

  const [sections, setSections] = useState<CourseSection[]>([
    { title: '', type: 'text' as const, content: '' }
  ]);

  // Update form when editing course changes
  useEffect(() => {
    if (editingCourse) {
      setCourseData({
        title: editingCourse.title,
        description: editingCourse.description,
        roleAwarded: editingCourse.roleAwarded,
        estimatedTime: editingCourse.estimatedTime,
        icon: editingCourse.icon,
        prerequisites: editingCourse.prerequisites || { courses: [], requirements: [] },
        requiresApproval: editingCourse.requiresApproval || false
      });
    } else {
      setCourseData({
        title: '',
        description: '',
        roleAwarded: '',
        estimatedTime: '',
        icon: '📚',
        prerequisites: { courses: [], requirements: [] },
        requiresApproval: false
      });
    }
  }, [editingCourse]);

  const availableIcons = ['📚', '🌱', '🌾', '🧹', '🔧', '🦺', '📊', '🌿', '👔', '⚙️', '🎯', '📋'];

  // Helper functions for video URLs
  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com/watch') || url.includes('youtu.be/');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const isVimeoUrl = (url: string) => {
    return url.includes('vimeo.com/');
  };

  const getVimeoEmbedUrl = (url: string) => {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  };

  // Render rich text content with embedded media
  const renderRichContent = (content: string) => {
    if (!content) return null;
    
    // Split content by media tags
    const parts = content.split(/(\[\[IMAGE:.*?\]\]|\[\[VIDEO:.*?\]\])/);
    
    return parts.map((part, index) => {
      if (part.startsWith('[[IMAGE:')) {
        const url = part.match(/\[\[IMAGE:(.*?)\]\]/)?.[1];
        return url ? (
          <img 
            key={index} 
            src={url} 
            alt="Embedded" 
            className="max-w-full h-auto my-3 rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
            }}
          />
        ) : null;
      } else if (part.startsWith('[[VIDEO:')) {
        const url = part.match(/\[\[VIDEO:(.*?)\]\]/)?.[1];
        if (!url) return null;
        
        if (isYouTubeUrl(url)) {
          return (
            <iframe
              key={index}
              src={getYouTubeEmbedUrl(url)}
              className="w-full h-96 my-3 rounded"
              frameBorder="0"
              allowFullScreen
            />
          );
        } else if (isVimeoUrl(url)) {
          return (
            <iframe
              key={index}
              src={getVimeoEmbedUrl(url)}
              className="w-full h-96 my-3 rounded"
              frameBorder="0"
              allowFullScreen
            />
          );
        } else {
          return (
            <video key={index} controls className="w-full my-3 rounded">
              <source src={url} />
            </video>
          );
        }
      } else {
        return <p key={index}>{part}</p>;
      }
    });
  };

  const renderSectionContent = (section: CourseSection, index: number) => {
    switch (section.type) {
      case 'video':
        return (
          <div className="space-y-3">
            <Input
              type="url"
              placeholder="Video URL (YouTube, Vimeo, or direct video link)"
              value={section.content}
              onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
              className="w-full"
            />
            {section.content && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-sm font-medium">Preview:</div>
                <div className="p-3">
                  {isYouTubeUrl(section.content) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(section.content)}
                      className="w-full h-48"
                      frameBorder="0"
                      allowFullScreen
                    />
                  ) : isVimeoUrl(section.content) ? (
                    <iframe
                      src={getVimeoEmbedUrl(section.content)}
                      className="w-full h-48"
                      frameBorder="0"
                      allowFullScreen
                    />
                  ) : (
                    <video className="w-full h-48" controls>
                      <source src={section.content} />
                      Your browser does not support video.
                    </video>
                  )}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'image':
        return (
          <div className="space-y-3">
            <Input
              type="url"
              placeholder="Image URL (jpg, png, gif)"
              value={section.content}
              onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
              className="w-full"
            />
            <Textarea
              placeholder="Image caption (optional)"
              value={section.caption || ''}
              onChange={(e) => handleSectionChange(index, 'caption', e.target.value)}
              rows={2}
              className="w-full"
            />
            {section.content && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-sm font-medium">Preview:</div>
                <div className="p-3">
                  <img 
                    src={section.content} 
                    alt="Preview" 
                    className="max-w-full h-auto rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                    }}
                  />
                  {section.caption && (
                    <p className="text-center italic text-gray-600 mt-2">{section.caption}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'rich-text':
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">You can embed images and videos using URLs in your text</p>
            <Textarea
              placeholder="Enter your content. Use [[IMAGE:url]] for images or [[VIDEO:url]] for videos"
              value={section.content}
              onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
              rows={6}
              className="w-full"
            />
            {section.content && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-sm font-medium">Preview:</div>
                <div className="p-3 bg-white rounded">
                  {renderRichContent(section.content)}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'quiz':
        return (
          <div className="space-y-3">
            <Input
              placeholder="Quiz question"
              value={section.content}
              onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
              className="w-full"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Option A"
                value={(section as any).optionA || ''}
                onChange={(e) => handleSectionChange(index, 'optionA' as keyof CourseSection, e.target.value)}
              />
              <Input
                placeholder="Option B"
                value={(section as any).optionB || ''}
                onChange={(e) => handleSectionChange(index, 'optionB' as keyof CourseSection, e.target.value)}
              />
              <Input
                placeholder="Option C"
                value={(section as any).optionC || ''}
                onChange={(e) => handleSectionChange(index, 'optionC' as keyof CourseSection, e.target.value)}
              />
              <Input
                placeholder="Option D"
                value={(section as any).optionD || ''}
                onChange={(e) => handleSectionChange(index, 'optionD' as keyof CourseSection, e.target.value)}
              />
            </div>
            <select
              value={(section as any).correctAnswer || 'A'}
              onChange={(e) => handleSectionChange(index, 'correctAnswer' as keyof CourseSection, e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="A">Correct Answer: A</option>
              <option value="B">Correct Answer: B</option>
              <option value="C">Correct Answer: C</option>
              <option value="D">Correct Answer: D</option>
            </select>
          </div>
        );
        
      case 'checklist':
        return (
          <div className="space-y-3">
            <Textarea
              placeholder="Enter checklist items (one per line)"
              value={section.content}
              onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
              rows={4}
              className="w-full"
            />
            {section.content && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-sm font-medium">Preview:</div>
                <div className="p-3">
                  {section.content.split('\n').filter(item => item.trim()).map((item, idx) => (
                    <div key={idx} className="flex items-center py-1">
                      <input type="checkbox" className="mr-2" />
                      <span>{item.replace(/^☐\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      default: // text
        return (
          <Textarea
            placeholder="Section content/instructions..."
            value={section.content}
            onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
            rows={4}
            className="w-full"
          />
        );
    }
  };

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
        prerequisites: {
          ...courseData.prerequisites,
          courses: [...courseData.prerequisites.courses, courseId]
        }
      });
    } else {
      setCourseData({
        ...courseData,
        prerequisites: {
          ...courseData.prerequisites,
          courses: courseData.prerequisites.courses.filter(id => id !== courseId)
        }
      });
    }
  };

  const handleAddRequirement = (requirement: { type: string; value: number | string; label: string }) => {
    setCourseData({
      ...courseData,
      prerequisites: {
        ...courseData.prerequisites,
        requirements: [...courseData.prerequisites.requirements, requirement]
      }
    });
  };

  const handleRemoveRequirement = (index: number) => {
    setCourseData({
      ...courseData,
      prerequisites: {
        ...courseData.prerequisites,
        requirements: courseData.prerequisites.requirements.filter((_, i) => i !== index)
      }
    });
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
      prerequisites: { courses: [], requirements: [] },
      requiresApproval: false
    });
    setSections([{ title: '', type: 'text', content: '' }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#203B17]">
            {editingCourse ? 'Edit Course' : 'Create New Course'}
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
            <Label>Course Prerequisites</Label>
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
              {allCourses
                .filter(course => course.id !== editingCourse?.id)
                .map(course => (
                <div key={course.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`prereq-${course.id}`}
                    checked={courseData.prerequisites.courses.includes(course.id)}
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

          {/* Additional Requirements */}
          <div>
            <Label>Additional Requirements</Label>
            <div className="mt-2 space-y-2">
              {courseData.prerequisites.requirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{req.label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRequirement(index)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <RequirementBuilder onAdd={handleAddRequirement} />
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
                        <option value="text">📝 Text Content</option>
                        <option value="rich-text">📄 Rich Text (with media)</option>
                        <option value="video">🎥 Video Only</option>
                        <option value="image">🖼️ Image Only</option>
                        <option value="quiz">❓ Quiz</option>
                        <option value="checklist">✅ Checklist</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>Content</Label>
                    {renderSectionContent(section, index)}
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
            {editingCourse ? 'Save Changes' : 'Create Course'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseCreationModal;