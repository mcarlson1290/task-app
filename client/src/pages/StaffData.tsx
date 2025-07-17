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

// Staff Table Row Component
const StaffTableRow: React.FC<{
  person: any;
  isManager: boolean;
  onEdit: (person: any) => void;
}> = ({ person, isManager, onEdit }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return `${Math.floor(diffHours / 24)}d ago`;
  };
  
  return (
    <tr className={person.activeStatus !== 'active' ? 'inactive-row' : ''}>
      <td>
        <div className="staff-name">
          {person.fullName}
          {person.microsoftId && (
            <span className="ms-connected" title="Microsoft Teams Connected">
              📧
            </span>
          )}
        </div>
      </td>
      <td>
        <div className="contact-info">
          <div className="email">{person.email}</div>
          <div className="phone">{person.phone}</div>
        </div>
      </td>
      <td>
        <div className="roles-list">
          {person.rolesAssigned.map((role: string) => (
            <span key={role} className="role-badge">{role}</span>
          ))}
        </div>
      </td>
      <td>{formatDate(person.dateHired)}</td>
      {isManager && (
        <td className="pay-rate">
          ${person.payRate.toFixed(2)}/hr
        </td>
      )}
      <td>
        <div className="training-status">
          <span className="completed" title="Completed courses">
            ✅ {person.trainingCompleted.length}
          </span>
          {person.trainingInProgress.length > 0 && (
            <span className="in-progress" title="In progress">
              📚 {person.trainingInProgress.length}
            </span>
          )}
        </div>
      </td>
      <td>
        <span className={`status-badge status-${person.activeStatus}`}>
          {person.activeStatus.replace('-', ' ')}
        </span>
      </td>
      <td>
        <span className="last-active">
          {formatTimeAgo(person.lastTaskCompleted)}
        </span>
      </td>
      <td>
        <button 
          onClick={() => onEdit(person)}
          className="btn-edit"
        >
          Edit
        </button>
      </td>
    </tr>
  );
};

// Staff Edit View Component
const StaffEditView: React.FC<{
  staff: any[];
  isManager: boolean;
}> = ({ staff, isManager }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const { toast } = useToast();
  
  // Filter staff based on search
  const filteredStaff = staff.filter(person =>
    person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.rolesAssigned.some((role: string) => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Sort staff
  const sortedStaff = [...filteredStaff].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.fullName.localeCompare(b.fullName);
      case 'dateHired':
        return new Date(b.dateHired).getTime() - new Date(a.dateHired).getTime();
      case 'payRate':
        return b.payRate - a.payRate;
      case 'tasks':
        return b.tasksCompleted - a.tasksCompleted;
      default:
        return 0;
    }
  });
  
  const handleEdit = (person: any) => {
    setEditingStaff(person);
    setShowEditModal(true);
  };

  const handleAddStaff = () => {
    toast({
      title: "Add Staff Member",
      description: "Staff addition feature will be implemented next.",
    });
  };
  
  return (
    <div className="staff-edit-view">
      {/* Toolbar */}
      <div className="staff-toolbar">
        <input
          type="text"
          placeholder="🔍 Search by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="name">Sort by Name</option>
          <option value="dateHired">Sort by Hire Date</option>
          <option value="payRate">Sort by Pay Rate</option>
          <option value="tasks">Sort by Tasks Completed</option>
        </select>
        
        <button className="btn-add-staff" onClick={handleAddStaff}>
          + Add Staff Member
        </button>
      </div>
      
      {/* Staff Table */}
      <div className="staff-table-container">
        <table className={`staff-table ${isManager ? 'manager-view' : ''}`}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Roles</th>
              <th>Hire Date</th>
              {isManager && <th>Pay Rate</th>}
              <th>Training</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedStaff.map(person => (
              <StaffTableRow 
                key={person.id}
                person={person}
                isManager={isManager}
                onEdit={handleEdit}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Edit Modal - placeholder for now */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Staff Member</h2>
            <p>Edit form coming in Part 3</p>
            <p>Staff Member: {editingStaff?.fullName}</p>
            <button onClick={() => setShowEditModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

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
          <StaffEditView 
            staff={staff}
            isManager={isManager}
          />
        ) : (
          <div>
            <p>Staff Analytics View - Coming in Part 4</p>
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