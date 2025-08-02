import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, X, Play, ArrowRight } from "lucide-react";
import { courseService } from "@/services/courseService";
import { getStoredAuth } from "@/lib/auth";

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
  const auth = getStoredAuth();
  const currentUser = auth.user;
  
  // Update current section when course changes
  useEffect(() => {
    if (course && currentUser) {
      const userProgress = courseService.getUserProgress(currentUser.id, course.id);
      const completedSections = userProgress?.completedSections || [];
      setCurrentSection(completedSections.length);
      setSectionCompleted(false);
    }
  }, [course, currentUser]);

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
            className="max-w-full h-auto my-3 rounded-lg"
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
              className="w-full h-96 my-3 rounded-lg"
              frameBorder="0"
              allowFullScreen
            />
          );
        } else if (isVimeoUrl(url)) {
          return (
            <iframe
              key={index}
              src={getVimeoEmbedUrl(url)}
              className="w-full h-96 my-3 rounded-lg"
              frameBorder="0"
              allowFullScreen
            />
          );
        } else {
          return (
            <video key={index} controls className="w-full my-3 rounded-lg">
              <source src={url} />
            </video>
          );
        }
      } else {
        return <p key={index} className="mb-3">{part}</p>;
      }
    });
  };
  
  if (!course) return null;
  
  const totalSections = course.sections;
  const isLastSection = currentSection === totalSections - 1;

  const handleNext = async () => {
    if (!currentUser) return;
    
    if (sectionCompleted) {
      // Update progress in central service
      try {
        await courseService.updateProgress(currentUser.id, course.id, currentSection);
        
        if (isLastSection) {
          // Course will be completed by the service, which calls onComplete
          onComplete(course.id);
        } else {
          setCurrentSection(currentSection + 1);
          setSectionCompleted(false);
        }
      } catch (error) {
        console.error('Failed to update course progress:', error);
        alert('Failed to save progress. Please try again.');
      }
    }
  };

  const getSectionTitle = (courseId: number, sectionIndex: number) => {
    // Get section details from course data if available
    if (course.sectionDetails && course.sectionDetails[sectionIndex]) {
      return course.sectionDetails[sectionIndex].title;
    }
    return `Section ${sectionIndex + 1}`;
  };
  
  const getSectionContent = (courseId: number, sectionIndex: number) => {
    // Get section content from course data if available
    if (course.sectionDetails && course.sectionDetails[sectionIndex]) {
      return course.sectionDetails[sectionIndex].content;
    }
    return 'Course content will be available here.';
  };

  const renderSectionForViewing = (section: any) => {
    if (!section) return null;
    
    switch (section.type) {
      case 'video':
        if (isYouTubeUrl(section.content)) {
          return (
            <iframe
              src={getYouTubeEmbedUrl(section.content)}
              className="w-full h-96 rounded-lg"
              frameBorder="0"
              allowFullScreen
            />
          );
        } else if (isVimeoUrl(section.content)) {
          return (
            <iframe
              src={getVimeoEmbedUrl(section.content)}
              className="w-full h-96 rounded-lg"
              frameBorder="0"
              allowFullScreen
            />
          );
        } else {
          return (
            <video className="w-full rounded-lg" controls>
              <source src={section.content} />
              Your browser does not support video.
            </video>
          );
        }
        
      case 'image':
        return (
          <div className="text-center">
            <img 
              src={section.content} 
              alt={section.title} 
              className="max-w-full h-auto rounded-lg mx-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
              }}
            />
            {section.caption && (
              <p className="text-center italic text-gray-600 mt-2">{section.caption}</p>
            )}
          </div>
        );
        
      case 'rich-text':
        return (
          <div className="prose max-w-none">
            {renderRichContent(section.content)}
          </div>
        );
        
      case 'quiz':
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">{section.content}</p>
            <div className="space-y-2">
              {['A', 'B', 'C', 'D'].map(option => (
                <label key={option} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="radio"
                    name={`quiz-${section.id}`}
                    value={option}
                    className="mr-3"
                  />
                  <span>{section[`option${option}`]}</span>
                </label>
              ))}
            </div>
          </div>
        );
        
      case 'checklist':
        const items = section.content.split('\n').filter((item: string) => item.trim());
        return (
          <div className="space-y-2">
            {items.map((item: string, idx: number) => (
              <label key={idx} className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-50">
                <input type="checkbox" className="mr-3" />
                <span>{item.replace(/^☐\s*/, '')}</span>
              </label>
            ))}
          </div>
        );
        
      default:
        return <div className="whitespace-pre-wrap">{section.content}</div>;
    }
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
                
                <div className="space-y-6">
                  {/* Actual course section content */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="bg-white p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-3">Section Content:</h4>
                      {course.sectionDetails && course.sectionDetails[currentSection] ? (
                        renderSectionForViewing(course.sectionDetails[currentSection])
                      ) : (
                        <div className="text-gray-600">
                          <p className="mb-4">
                            This section covers essential knowledge and skills for the {course.roleAwarded} role.
                          </p>
                          <p>{getSectionContent(course.id, currentSection)}</p>
                        </div>
                      )}
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