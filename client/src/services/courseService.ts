import { apiRequest } from "@/lib/queryClient";

export interface Course {
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
  sectionDetails?: {
    title: string;
    type: string;
    content: string;
  }[];
  createdBy?: string;
  createdAt?: string;
}

// Central course database (would eventually be moved to backend database)
let coursesDatabase: Course[] = [
  {
    id: 1,
    title: 'Basic Safety & Orientation',
    description: 'Introduction to farm safety procedures and basic orientation',
    roleAwarded: 'General Staff',
    sections: 3,
    estimatedTime: '20 minutes',
    status: 'not-started',
    progress: 0,
    icon: '🛡️',
    sectionDetails: [
      {
        title: 'Farm Safety Overview',
        type: 'text',
        content: 'Welcome to Grow Space Vertical Farms! This course covers essential safety procedures and farm orientation.'
      },
      {
        title: 'Emergency Procedures',
        type: 'text', 
        content: 'Learn about emergency exits, first aid locations, and emergency contact procedures.'
      },
      {
        title: 'Basic Equipment Safety',
        type: 'text',
        content: 'Understanding proper use of basic farm equipment and safety protocols.'
      }
    ]
  },
  {
    id: 2,
    title: 'Seeding Technician Certification',
    description: 'Complete training for seeding operations and microgreen cultivation',
    roleAwarded: 'Seeding Tech',
    sections: 4,
    estimatedTime: '45 minutes',
    status: 'not-started',
    progress: 0,
    icon: '🌱',
    prerequisites: {
      courses: [1],
      requirements: []
    },
    sectionDetails: [
      {
        title: 'Seeding Fundamentals',
        type: 'text',
        content: 'Learn proper seeding techniques for microgreens and optimal growing conditions.'
      },
      {
        title: 'Seed Selection & Storage',
        type: 'text',
        content: 'Understanding different seed varieties and proper storage methods.'
      },
      {
        title: 'Tray Preparation',
        type: 'text',
        content: 'Proper tray cleaning, medium preparation, and setup procedures.'
      },
      {
        title: 'Quality Control',
        type: 'text',
        content: 'Monitoring seed germination rates and identifying potential issues.'
      }
    ]
  },
  {
    id: 3,
    title: 'Harvest Operations Training',
    description: 'Learn proper harvesting techniques and quality control',
    roleAwarded: 'Harvest Tech',
    sections: 3,
    estimatedTime: '35 minutes',
    status: 'not-started',
    progress: 0,
    icon: '🌾',
    prerequisites: {
      courses: [1],
      requirements: []
    },
    sectionDetails: [
      {
        title: 'Harvest Timing',
        type: 'text',
        content: 'Understanding optimal harvest timing for different crops and quality indicators.'
      },
      {
        title: 'Harvesting Techniques',
        type: 'text',
        content: 'Proper cutting techniques, handling, and post-harvest procedures.'
      },
      {
        title: 'Quality Assessment',
        type: 'text',
        content: 'Grading standards and quality control measures for harvested products.'
      }
    ]
  },
  {
    id: 4,
    title: 'Equipment Operation & Maintenance',
    description: 'Training on equipment operation, maintenance, and troubleshooting',
    roleAwarded: 'Equipment Tech',
    sections: 5,
    estimatedTime: '60 minutes',
    status: 'not-started',
    progress: 0,
    icon: '⚙️',
    prerequisites: {
      courses: [1],
      requirements: [
        { type: 'tenure', value: 90, label: 'Employed for at least 3 months' }
      ]
    },
    sectionDetails: [
      {
        title: 'Equipment Overview',
        type: 'text',
        content: 'Introduction to various equipment used in vertical farming operations.'
      },
      {
        title: 'Operation Procedures',
        type: 'text',
        content: 'Step-by-step operating procedures for each piece of equipment.'
      },
      {
        title: 'Preventive Maintenance',
        type: 'text',
        content: 'Regular maintenance schedules and procedures to prevent equipment failure.'
      },
      {
        title: 'Troubleshooting',
        type: 'text',
        content: 'Common issues and troubleshooting steps for equipment problems.'
      },
      {
        title: 'Safety Protocols',
        type: 'text',
        content: 'Safety procedures specific to equipment operation and maintenance.'
      }
    ]
  },
  {
    id: 5,
    title: 'Cleaning & Sanitation Procedures',
    description: 'Comprehensive cleaning protocols and sanitation standards',
    roleAwarded: 'Cleaning Crew',
    sections: 2,
    estimatedTime: '25 minutes',
    status: 'not-started',
    progress: 0,
    icon: '🧽',
    prerequisites: {
      courses: [1],
      requirements: []
    },
    sectionDetails: [
      {
        title: 'Sanitation Standards',
        type: 'text',
        content: 'Understanding food safety requirements and sanitation standards for vertical farms.'
      },
      {
        title: 'Cleaning Procedures',
        type: 'text',
        content: 'Step-by-step cleaning procedures for growing systems, equipment, and work areas.'
      }
    ]
  },
  {
    id: 6,
    title: 'Packaging & Quality Control',
    description: 'Learn packaging standards and quality control procedures',
    roleAwarded: 'Packaging Tech',
    sections: 3,
    estimatedTime: '40 minutes',
    status: 'not-started',
    progress: 0,
    icon: '📦',
    prerequisites: {
      courses: [1, 3],
      requirements: []
    },
    sectionDetails: [
      {
        title: 'Packaging Standards',
        type: 'text',
        content: 'Understanding packaging requirements and standards for different products.'
      },
      {
        title: 'Quality Control Checks',
        type: 'text',
        content: 'Quality control procedures and documentation requirements.'
      },
      {
        title: 'Labeling & Traceability',
        type: 'text',
        content: 'Proper labeling procedures and traceability requirements.'
      }
    ]
  },
  {
    id: 7,
    title: 'Management Fundamentals',
    description: 'Leadership training for supervisory roles',
    roleAwarded: 'Team Lead',
    sections: 4,
    estimatedTime: '90 minutes',
    status: 'not-started',
    progress: 0,
    icon: '👔',
    requiresApproval: true,
    prerequisites: {
      courses: [2, 3, 6],
      requirements: [
        { type: 'tenure', value: 180, label: 'Employed for at least 6 months' }
      ]
    },
    sectionDetails: [
      {
        title: 'Leadership Principles',
        type: 'text',
        content: 'Fundamental leadership concepts and management principles.'
      },
      {
        title: 'Team Management',
        type: 'text',
        content: 'Effective team management strategies and communication techniques.'
      },
      {
        title: 'Performance Monitoring',
        type: 'text',
        content: 'Methods for monitoring team performance and providing feedback.'
      },
      {
        title: 'Problem Resolution',
        type: 'text',
        content: 'Conflict resolution and problem-solving strategies for managers.'
      }
    ]
  }
];

// User progress tracking (would eventually be in backend database)
let userProgressDatabase: Record<number, Record<number, {
  completedSections: number[];
  startedAt: Date;
  completedAt?: Date;
  status: 'not-started' | 'in-progress' | 'completed';
}>> = {};

export const courseService = {
  // Get all courses
  getAllCourses: (): Course[] => {
    return coursesDatabase;
  },
  
  // Get courses for specific user (for now, return all - would filter by assignments in backend)
  getUserCourses: (userId: number): Course[] => {
    const userProgress = userProgressDatabase[userId] || {};
    
    return coursesDatabase.map(course => {
      const progress = userProgress[course.id];
      return {
        ...course,
        status: progress?.status || 'not-started',
        progress: progress?.completedSections?.length || 0,
        completedDate: progress?.completedAt?.toISOString()
      };
    });
  },
  
  // Get user's progress for a specific course
  getUserProgress: (userId: number, courseId: number) => {
    return userProgressDatabase[userId]?.[courseId];
  },
  
  // Update progress for a course section
  updateProgress: (userId: number, courseId: number, sectionIndex: number) => {
    if (!userProgressDatabase[userId]) {
      userProgressDatabase[userId] = {};
    }
    if (!userProgressDatabase[userId][courseId]) {
      userProgressDatabase[userId][courseId] = {
        completedSections: [],
        startedAt: new Date(),
        status: 'in-progress'
      };
    }
    
    const progress = userProgressDatabase[userId][courseId];
    if (!progress.completedSections.includes(sectionIndex)) {
      progress.completedSections.push(sectionIndex);
    }
    
    // Check if course is complete
    const course = coursesDatabase.find(c => c.id === courseId);
    if (course && progress.completedSections.length === course.sections) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      
      // Call backend to assign role
      return courseService.completeCourse(userId, courseId, course.roleAwarded);
    }
    
    return Promise.resolve(progress);
  },
  
  // Complete course and assign role via backend
  completeCourse: async (userId: number, courseId: number, roleAwarded: string) => {
    try {
      const response = await apiRequest('POST', `/api/courses/${courseId}/complete`, {
        userId,
        roleAwarded
      });
      
      console.log('Course completion response:', response);
      return response;
    } catch (error) {
      console.error('Failed to complete course:', error);
      throw error;
    }
  },
  
  // Create/update course (Corporate Manager only)
  saveCourse: (course: Omit<Course, 'id' | 'status' | 'progress'> & { id?: number }): Course => {
    if (course.id) {
      // Update existing course
      const index = coursesDatabase.findIndex(c => c.id === course.id);
      if (index >= 0) {
        coursesDatabase[index] = {
          ...course,
          status: coursesDatabase[index].status,
          progress: coursesDatabase[index].progress,
          createdAt: coursesDatabase[index].createdAt
        } as Course;
        return coursesDatabase[index];
      }
    }
    
    // Create new course
    const newCourse: Course = {
      ...course,
      id: Date.now(),
      status: 'not-started',
      progress: 0,
      createdAt: new Date().toISOString()
    };
    coursesDatabase.push(newCourse);
    return newCourse;
  },
  
  // Delete course
  deleteCourse: (courseId: number): boolean => {
    const index = coursesDatabase.findIndex(c => c.id === courseId);
    if (index >= 0) {
      coursesDatabase.splice(index, 1);
      return true;
    }
    return false;
  }
};