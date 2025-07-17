import React, { useState } from 'react';
import { getStoredAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

// Mock staff data
const mockStaff = [
  {
    id: 1,
    fullName: 'Alex Martinez',
    email: 'alex.martinez@growspace.farm',
    phone: '555-0101',
    location: 'Grow Space',
    rolesAssigned: ['General Staff', 'Seeding Tech'],
    dateHired: '2023-06-15',
    payRate: 18.50, // Hidden from non-managers
    trainingCompleted: ['Basic Safety & Orientation', 'Seeding Technician Certification'],
    trainingInProgress: [],
    preferredHours: 'Morning (6am-2pm)',
    activeStatus: 'active',
    lastTaskCompleted: '2024-03-15T14:30:00',
    managerNotes: 'Excellent attention to detail, very reliable',
    tasksCompleted: 156,
    avgTaskDuration: '45m',
    onTimeRate: 98.5,
    microsoftId: null // Will be populated with Teams integration
  },
  {
    id: 2,
    fullName: 'Sarah Johnson',
    email: 'sarah.j@growspace.farm',
    phone: '555-0102',
    location: 'Grow Space',
    rolesAssigned: ['General Staff', 'Harvest Tech', 'Packing'],
    dateHired: '2023-03-22',
    payRate: 20.00,
    trainingCompleted: ['Basic Safety & Orientation', 'Harvest Operations Training'],
    trainingInProgress: ['Equipment Operation & Maintenance'],
    preferredHours: 'Flexible',
    activeStatus: 'active',
    lastTaskCompleted: '2024-03-15T16:45:00',
    managerNotes: 'Fast learner, great with customers',
    tasksCompleted: 234,
    avgTaskDuration: '38m',
    onTimeRate: 96.2,
    microsoftId: null
  },
  {
    id: 3,
    fullName: 'Mike Chen',
    email: 'mike.chen@growspace.farm',
    phone: '555-0103',
    location: 'Grow Space',
    rolesAssigned: ['General Staff', 'Equipment Tech', 'Cleaning Crew'],
    dateHired: '2024-01-10',
    payRate: 17.00,
    trainingCompleted: ['Basic Safety & Orientation'],
    trainingInProgress: ['Equipment Operation & Maintenance'],
    preferredHours: 'Afternoon (2pm-10pm)',
    activeStatus: 'active',
    lastTaskCompleted: '2024-03-14T18:20:00',
    managerNotes: 'New hire, showing good progress',
    tasksCompleted: 42,
    avgTaskDuration: '52m',
    onTimeRate: 88.5,
    microsoftId: null
  },
  {
    id: 4,
    fullName: 'Jessica Wong',
    email: 'jessica.w@growspace.farm',
    phone: '555-0104',
    location: 'Grow Space',
    rolesAssigned: ['Manager', 'All Roles'],
    dateHired: '2022-11-01',
    payRate: 28.00,
    trainingCompleted: ['Basic Safety & Orientation', 'Manager Fundamentals', 'All Technical Courses'],
    trainingInProgress: [],
    preferredHours: 'Full-time',
    activeStatus: 'active',
    lastTaskCompleted: '2024-03-15T17:00:00',
    managerNotes: 'Shift supervisor, excellent leadership',
    tasksCompleted: 412,
    avgTaskDuration: '32m',
    onTimeRate: 99.1,
    microsoftId: null
  },
  {
    id: 5,
    fullName: 'Tom Rodriguez',
    email: 'tom.r@growspace.farm',
    phone: '555-0105',
    location: 'Grow Space',
    rolesAssigned: ['General Staff'],
    dateHired: '2024-02-20',
    payRate: 16.50,
    trainingCompleted: ['Basic Safety & Orientation'],
    trainingInProgress: ['Seeding Technician Certification'],
    preferredHours: 'Morning (6am-2pm)',
    activeStatus: 'on-leave',
    lastTaskCompleted: '2024-03-01T12:00:00',
    managerNotes: 'On medical leave until 03/20',
    tasksCompleted: 18,
    avgTaskDuration: '48m',
    onTimeRate: 85.0,
    microsoftId: null
  }
];

const StaffData: React.FC = () => {
  const auth = getStoredAuth();
  const { toast } = useToast();
  const isManager = auth.user?.role === 'manager' || auth.user?.role === 'corporate';
  const [activeTab, setActiveTab] = useState('edit');
  const [staff, setStaff] = useState(mockStaff);

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Staff report will be downloaded shortly.",
    });
  };

  if (!isManager) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>This page is only available to managers.</p>
      </div>
    );
  }

  return (
    <div className="staff-data-page">
      <div className="page-header">
        <h1>👥 Staff Data Management</h1>
        <button className="btn-export" onClick={handleExport}>
          📥 Export Staff Report
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          ✏️ Staff Edit
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Staff Analytics
        </button>
      </div>
      
      {/* Content will go here based on activeTab */}
      <div className="tab-content">
        {activeTab === 'edit' ? (
          <div>
            <p>Staff Edit View - Coming next</p>
            <div className="staff-summary">
              <h3>Current Staff Summary</h3>
              <p>Total Staff: {staff.length}</p>
              <p>Active Staff: {staff.filter(s => s.activeStatus === 'active').length}</p>
              <p>On Leave: {staff.filter(s => s.activeStatus === 'on-leave').length}</p>
            </div>
          </div>
        ) : (
          <div>
            <p>Staff Analytics View - Coming next</p>
            <div className="analytics-summary">
              <h3>Quick Analytics Preview</h3>
              <p>Average Tasks Completed: {Math.round(staff.reduce((sum, s) => sum + s.tasksCompleted, 0) / staff.length)}</p>
              <p>Average On-Time Rate: {Math.round(staff.reduce((sum, s) => sum + s.onTimeRate, 0) / staff.length)}%</p>
              <p>Average Pay Rate: ${(staff.reduce((sum, s) => sum + s.payRate, 0) / staff.length).toFixed(2)}/hr</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffData;