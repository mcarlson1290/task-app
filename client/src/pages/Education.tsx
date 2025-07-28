import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, BookOpen, Award, CheckCircle, Play, Filter, Plus, Target } from "lucide-react";
import { TrainingModule, UserProgress, CourseAssignment, User } from "@shared/schema";
import { getStoredAuth } from "@/lib/auth";
import CourseCard from "@/components/CourseCard";
import CourseModal from "@/components/CourseModal";
import CourseCreationModal from "@/components/CourseCreationModal";
import CourseAssignmentModal from "@/components/CourseAssignmentModal";
import confetti from "canvas-confetti";

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
  assignedBy?: string;
  assignedDate?: string;
  dueDate?: string;
  priority?: 'low' | 'normal' | 'high';
}

const Education: React.FC = () => {
  const auth = getStoredAuth();
  const [filterTab, setFilterTab] = useState<string>('assigned');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [courseToAssign, setCourseToAssign] = useState<Course | null>(null);  
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const isCorporateManager = auth.user?.role === 'corporate';
  const isManager = auth.user?.role === 'manager' || auth.user?.role === 'corporate';
  const currentUser = auth.user as User;
  // Query for course assignments
  const { data: courseAssignments = [] } = useQuery<CourseAssignment[]>({
    queryKey: ['/api/course-assignments', { userId: currentUser?.id }],
    queryFn: () => fetch(`/api/course-assignments?userId=${currentUser?.id}`).then(res => res.json()),
    enabled: !!currentUser
  });

  // Query for all users (for assignment modal)
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users']
  });

  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      title: 'Basic Safety & Orientation',
      description: 'Introduction to farm safety procedures and basic orientation',
      roleAwarded: 'General Staff',
      sections: 3,
      estimatedTime: '20 minutes',
      status: 'completed',
      progress: 3,
      completedDate: new Date().toISOString(),
      icon: '🦺',
      prerequisites: {
        courses: [],
        requirements: []
      }
    },
    {
      id: 2,
      title: 'Seeding Technician Certification',
      description: 'Learn proper seeding techniques for microgreens and leafy greens production',
      roleAwarded: 'Seeding Technician',
      sections: 5,
      estimatedTime: '45 minutes',
      status: 'not-started',
      progress: 0,
      icon: '🌱',
      prerequisites: {
        courses: [1],
        requirements: []
      }
    },
    {
      id: 3,
      title: 'Harvest Operations Training',
      description: 'Master harvesting techniques, timing, and quality control procedures',
      roleAwarded: 'Harvest Technician',
      sections: 6,
      estimatedTime: '1 hour',
      status: 'in-progress',
      progress: 3,
      icon: '🌾',
      prerequisites: {
        courses: [1],
        requirements: []
      }
    },
    {
      id: 4,
      title: 'Forklift Operation Certificate',
      description: 'Learn to safely operate warehouse equipment and material handling',
      roleAwarded: 'Equipment Operator',
      sections: 8,
      estimatedTime: '3 hours',
      status: 'not-started',
      progress: 0,
      icon: '🚜',
      prerequisites: {
        courses: [1],
        requirements: [
          { type: 'age', value: 18, label: 'Must be 18 or older' },
          { type: 'license', value: 'drivers', label: 'Valid driver\'s license required' },
          { type: 'tenure', value: 30, label: 'Employed for at least 30 days' }
        ]
      }
    },
    {
      id: 5,
      title: 'Chemical Handling Certification',
      description: 'Safe handling of nutrients, pH solutions, and cleaning chemicals',
      roleAwarded: 'Chemical Handler',
      sections: 6,
      estimatedTime: '2 hours',
      status: 'not-started',
      progress: 0,
      icon: '⚗️',
      prerequisites: {
        courses: [1],
        requirements: [
          { type: 'age', value: 21, label: 'Must be 21 or older' },
          { type: 'certification', value: 'hazmat', label: 'HAZMAT certification preferred' }
        ]
      }
    },
    {
      id: 6,
      title: 'Advanced Growing Systems',
      description: 'Deep dive into hydroponic systems and optimization techniques',
      roleAwarded: 'Senior Grower',
      sections: 8,
      estimatedTime: '2 hours',
      status: 'not-started',
      progress: 0,
      icon: '🌿',
      prerequisites: {
        courses: [2, 3],
        requirements: []
      }
    },
    {
      id: 7,
      title: 'Farm Manager Fundamentals',
      description: 'Leadership, scheduling, and operations management for farm supervisors',
      roleAwarded: 'Farm Manager',
      sections: 10,
      estimatedTime: '3 hours',
      status: 'not-started',
      progress: 0,
      requiresApproval: true,
      icon: '👔',
      prerequisites: {
        courses: [2, 3, 6],
        requirements: [
          { type: 'tenure', value: 180, label: 'Employed for at least 6 months' }
        ]
      }
    }
  ]);

  // Calculate completed courses from assignments (for progress bar)
  const assignedCompletedCourses = courseAssignments.filter(assignment => {
    const course = courses.find(c => c.id === assignment.courseId);
    return course?.status === 'completed';
  }).length;

  const completedCourses = courses.filter(c => c.status === 'completed').length;
  const totalCourses = courses.length;
  const overallProgress = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;

  // Handle course assignment
  const handleAssignCourse = (course: Course) => {
    setCourseToAssign(course);
    setShowAssignmentModal(true);
  };

  const handleCloseAssignmentModal = () => {
    setShowAssignmentModal(false);
    setCourseToAssign(null);
  };

  // Get assigned courses with assignment details
  const getAssignedCourses = () => {
    if (!currentUser) return [];
    
    return courseAssignments.map(assignment => {
      const course = courses.find(c => c.id === assignment.courseId);
      if (!course) return null;
      
      const assignedByUser = allUsers.find(u => u.id === assignment.assignedByUserId);
      
      return {
        ...course,
        assignedBy: assignedByUser?.name || 'Unknown',
        assignedDate: assignment.assignedDate ? new Date(assignment.assignedDate).toISOString() : undefined,
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString() : undefined,
        priority: assignment.priority as 'low' | 'normal' | 'high' | undefined
      };
    }).filter(Boolean) as Course[];
  };

  const filteredCourses = (() => {
    switch (filterTab) {
      case 'assigned':
        return getAssignedCourses();
      case 'in-progress':
        return courses.filter(course => course.status === 'in-progress');
      case 'completed':
        return courses.filter(course => course.status === 'completed');
      case 'not-started':
        return courses.filter(course => course.status === 'not-started');
      case 'all':
      default:
        return courses;
    }
  })();

  const handleStartCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const handleResumeCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const handleCourseComplete = (courseId: number) => {
    const completedCourse = courses.find(c => c.id === courseId);
    
    setCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseId
          ? {
              ...course,
              status: 'completed' as const,
              progress: course.sections,
              completedDate: new Date().toISOString()
            }
          : course
      )
    );
    
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Show success message
    if (completedCourse) {
      setTimeout(() => {
        alert(`🎉 Congratulations! You've completed "${completedCourse.title}" and earned the ${completedCourse.roleAwarded} role!`);
      }, 500);
    }
  };

  const handleCloseModal = () => {
    setShowCourseModal(false);
    setSelectedCourse(null);
  };

  const handleCreateCourse = (newCourse: Omit<Course, 'id' | 'status' | 'progress'>) => {
    const courseWithId = {
      ...newCourse,
      id: Date.now(),
      status: 'not-started' as const,
      progress: 0
    };
    setCourses(prevCourses => [...prevCourses, courseWithId]);
    setShowCreateModal(false);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowCreateModal(true);
  };

  const handleUpdateCourse = (updatedCourse: Omit<Course, 'id' | 'status' | 'progress'>) => {
    if (editingCourse) {
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === editingCourse.id 
            ? { 
                ...updatedCourse, 
                id: editingCourse.id,
                status: course.status,
                progress: course.progress
              }
            : course
        )
      );
      setEditingCourse(null);
      setShowCreateModal(false);
    }
  };

  const handleDeleteCourse = (courseId: number) => {
    const courseToDelete = courses.find(c => c.id === courseId);
    if (!courseToDelete) return;
    
    // Check if any other courses have this as a prerequisite
    const dependentCourses = courses.filter(course => 
      course.prerequisites?.courses?.includes(courseId)
    );
    
    if (dependentCourses.length > 0) {
      const dependentTitles = dependentCourses.map(c => `• ${c.title}`).join('\n');
      alert(`Cannot delete this course. The following courses require it as a prerequisite:\n\n${dependentTitles}\n\nRemove this prerequisite from these courses first.`);
      return;
    }
    
    // Final confirmation
    if (confirm(`Delete "${courseToDelete.title}"?\n\nThis action cannot be undone.`)) {
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      
      // Log the deletion
      console.log(`Course deleted:`, {
        courseId,
        title: courseToDelete.title,
        deletedBy: currentUser.name,
        deletedAt: new Date().toISOString()
      });
      
      // If in edit modal, close it
      if (showCreateModal && editingCourse?.id === courseId) {
        setShowCreateModal(false);
        setEditingCourse(null);
      }
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setEditingCourse(null);
  };

  const checkPrerequisites = (course: Course) => {
    if (!course.prerequisites) {
      return true;
    }
    
    // Check course prerequisites
    const coursePrereqsMet = course.prerequisites.courses.every(prereqId => {
      const prereqCourse = courses.find(c => c.id === prereqId);
      return prereqCourse?.status === 'completed';
    });
    
    // Check additional requirements (mock implementation for demo)
    const requirementsMet = course.prerequisites.requirements.every(req => {
      switch (req.type) {
        case 'age':
          // Mock: assume user meets age requirement
          return true;
        case 'tenure':
          // Mock: assume user has sufficient tenure
          return true;
        case 'license':
        case 'certification':
          // Mock: simulate some users having certifications
          return Math.random() > 0.3;
        default:
          return true;
      }
    });
    
    return coursePrereqsMet && requirementsMet;
  };

  const getAvailableCourses = () => {
    return courses.filter(course => {
      const prerequisitesMet = checkPrerequisites(course);
      return prerequisitesMet;
    });
  };

  const getLockedCourses = () => {
    return courses.filter(course => !checkPrerequisites(course));
  };

  return (
    <div className="education-page">
      {/* Action button in top right */}
      {isCorporateManager && (
        <div className="page-actions">
          <button 
            className="btn-create-course"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Course
          </button>
        </div>
      )}
      
      {/* Progress Summary Card */}
      <div className="learning-progress-card">
        <div className="progress-icon">🎓</div>
        <div className="progress-content">
          <h3>Your Learning Progress</h3>
          <div className="progress-stats">
            <span className="assigned">{courseAssignments.length} Courses Assigned</span>
            <span className="separator">•</span>
            <span className="completed">{assignedCompletedCourses} Completed</span>
            <span className="separator">•</span>
            <span className="role">👤 {auth.user?.role === 'manager' ? 'Manager' : 'Technician'} Role</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${courseAssignments.length > 0 ? (assignedCompletedCourses / courseAssignments.length) * 100 : 0}%` }} 
            />
          </div>
          <span className="progress-text">
            {courseAssignments.length > 0 ? Math.round((assignedCompletedCourses / courseAssignments.length) * 100) : 0}% Complete
          </span>
        </div>
      </div>
      
      {/* Filter tabs matching sub-tab style */}
      <div className="course-filter-tabs">
        <button
          className={`filter-tab ${filterTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setFilterTab('assigned')}
        >
          🎯 Assigned
        </button>
        <button
          className={`filter-tab ${filterTab === 'all' ? 'active' : ''}`}
          onClick={() => setFilterTab('all')}
        >
          📚 All Courses
        </button>
        <button
          className={`filter-tab ${filterTab === 'in-progress' ? 'active' : ''}`}
          onClick={() => setFilterTab('in-progress')}
        >
          🔄 In Progress
        </button>
        <button
          className={`filter-tab ${filterTab === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterTab('completed')}
        >
          ✅ Completed
        </button>
        <button
          className={`filter-tab ${filterTab === 'not-started' ? 'active' : ''}`}
          onClick={() => setFilterTab('not-started')}
        >
          📋 Not Started
        </button>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 courses-grid">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onStart={handleStartCourse}
            onResume={handleResumeCourse}
            onEdit={handleEditCourse}
            onDelete={isCorporateManager ? handleDeleteCourse : undefined}
            onAssign={isManager ? handleAssignCourse : undefined}
            allCourses={courses}
            isLocked={!checkPrerequisites(course)}
            isCorporateManager={isCorporateManager}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No courses found for "{filterTab}" filter
          </h3>
          <p className="text-gray-600">
            Try selecting a different filter or check back later for new courses.
          </p>
        </div>
      )}

      {/* Course Modal */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          isOpen={showCourseModal}
          onClose={handleCloseModal}
          onComplete={handleCourseComplete}
        />
      )}

      {/* Course Creation Modal */}
      <CourseCreationModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSave={editingCourse ? handleUpdateCourse : handleCreateCourse}
        onDelete={isCorporateManager ? handleDeleteCourse : undefined}
        allCourses={courses}
        editingCourse={editingCourse}
      />

      {/* Course Assignment Modal */}
      {isManager && (
        <CourseAssignmentModal
          isOpen={showAssignmentModal}
          onClose={handleCloseAssignmentModal}
          course={courseToAssign}
          assignedBy={currentUser}
        />
      )}
    </div>
  );
};

export default Education;
