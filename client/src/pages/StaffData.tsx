import React, { useState } from 'react';
import { getStoredAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/contexts/LocationContext';

// Mock staff data with location codes
const mockStaff = [
  {
    id: 1,
    fullName: 'Alex Martinez',
    email: 'alex.martinez@growspace.farm',
    phone: '555-0101',
    location: 'K', // Kenosha
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
    location: 'K', // Kenosha
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
    location: 'R', // Racine
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
    location: 'R', // Racine
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
    location: 'MKE', // Milwaukee
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
  },
  {
    id: 6,
    fullName: 'David Kim',
    email: 'david.k@growspace.farm',
    phone: '555-0106',
    location: 'MKE', // Milwaukee
    rolesAssigned: ['General Staff', 'Harvest Tech'],
    dateHired: '2023-09-12',
    payRate: 19.25,
    trainingCompleted: ['Basic Safety & Orientation', 'Harvest Operations Training'],
    trainingInProgress: [],
    preferredHours: 'Evening (2pm-10pm)',
    activeStatus: 'active',
    lastTaskCompleted: '2024-03-15T19:30:00',
    managerNotes: 'Consistent performer, good teamwork',
    tasksCompleted: 187,
    avgTaskDuration: '41m',
    onTimeRate: 94.8,
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
  onUpdateStaff: (updatedStaff: any[]) => void;
}> = ({ staff, isManager, onUpdateStaff }) => {
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
    setEditingStaff(null);
    setShowEditModal(true);
  };

  const handleSaveStaff = (staffData: any) => {
    let updatedStaff;
    
    if (editingStaff) {
      // Update existing staff member
      updatedStaff = staff.map(person => 
        person.id === staffData.id ? staffData : person
      );
    } else {
      // Add new staff member
      updatedStaff = [...staff, { ...staffData, id: Date.now() }];
    }
    
    onUpdateStaff(updatedStaff);
    setShowEditModal(false);
    setEditingStaff(null);
    toast({
      title: "Staff Member Saved",
      description: `${staffData.fullName} has been ${editingStaff ? 'updated' : 'added'} successfully.`,
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
      
      {/* Edit Modal */}
      {showEditModal && (
        <StaffEditModal
          staff={editingStaff}
          onSave={handleSaveStaff}
          onClose={() => {
            setShowEditModal(false);
            setEditingStaff(null);
          }}
        />
      )}
    </div>
  );
};

// Staff Edit Modal Component
const StaffEditModal: React.FC<{
  staff: any;
  onSave: (staffData: any) => void;
  onClose: () => void;
}> = ({ staff, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: staff?.fullName || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    location: staff?.location || 'Grow Space',
    rolesAssigned: staff?.rolesAssigned || [],
    dateHired: staff?.dateHired || new Date().toISOString().split('T')[0],
    payRate: staff?.payRate || 16.00,
    preferredHours: staff?.preferredHours || 'Flexible',
    activeStatus: staff?.activeStatus || 'active',
    managerNotes: staff?.managerNotes || ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const availableRoles = [
    'General Staff',
    'Seeding Tech',
    'Harvest Tech',
    'Cleaning Crew',
    'Equipment Tech',
    'Packing',
    'Manager'
  ];
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
    if (formData.payRate <= 0) newErrors.payRate = 'Pay rate must be positive';
    if (formData.rolesAssigned.length === 0) newErrors.roles = 'At least one role required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const staffData = {
      ...staff,
      ...formData,
      id: staff?.id || Date.now(),
      // Keep existing data that isn't in the form
      trainingCompleted: staff?.trainingCompleted || [],
      trainingInProgress: staff?.trainingInProgress || [],
      lastTaskCompleted: staff?.lastTaskCompleted || null,
      tasksCompleted: staff?.tasksCompleted || 0,
      avgTaskDuration: staff?.avgTaskDuration || '0m',
      onTimeRate: staff?.onTimeRate || 100,
      microsoftId: staff?.microsoftId || null
    };
    
    onSave(staffData);
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h2>{staff ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="staff-form">
          <div className="form-grid">
            {/* Personal Information Section */}
            <div className="form-section">
              <h3>📋 Personal Information</h3>
              
              <label className={errors.fullName ? 'error' : ''}>
                Full Name *
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="John Smith"
                />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </label>
              
              <label className={errors.email ? 'error' : ''}>
                Email *
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john.smith@growspace.farm"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </label>
              
              <label>
                Phone
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="555-0123"
                />
              </label>
            </div>
            
            {/* Work Information Section */}
            <div className="form-section">
              <h3>💼 Work Information</h3>
              
              <label>
                Location
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                >
                  <option value="Grow Space">Grow Space</option>
                </select>
              </label>
              
              <label>
                Date Hired
                <input
                  type="date"
                  value={formData.dateHired}
                  onChange={(e) => setFormData({...formData, dateHired: e.target.value})}
                />
              </label>
              
              <label className={`pay-rate-field ${errors.payRate ? 'error' : ''}`}>
                Pay Rate ($/hr) *
                <div className="input-with-note">
                  <input
                    type="number"
                    value={formData.payRate}
                    onChange={(e) => setFormData({...formData, payRate: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.50"
                  />
                  <span className="field-note">🔒 Hidden from non-managers</span>
                </div>
                {errors.payRate && <span className="error-text">{errors.payRate}</span>}
              </label>
              
              <label>
                Preferred Hours
                <select
                  value={formData.preferredHours}
                  onChange={(e) => setFormData({...formData, preferredHours: e.target.value})}
                >
                  <option value="Flexible">Flexible</option>
                  <option value="Morning (6am-2pm)">Morning (6am-2pm)</option>
                  <option value="Afternoon (2pm-10pm)">Afternoon (2pm-10pm)</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </label>
              
              <label>
                Status
                <select
                  value={formData.activeStatus}
                  onChange={(e) => setFormData({...formData, activeStatus: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="on-leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            
            {/* Roles Section */}
            <div className="form-section full-width">
              <h3>👤 Assigned Roles</h3>
              {errors.roles && <span className="error-text">{errors.roles}</span>}
              
              <div className="checkbox-group">
                {availableRoles.map(role => (
                  <label key={role} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.rolesAssigned.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            rolesAssigned: [...formData.rolesAssigned, role]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            rolesAssigned: formData.rolesAssigned.filter(r => r !== role)
                          });
                        }
                      }}
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Manager Notes Section */}
            <div className="form-section full-width">
              <h3>📝 Manager Notes</h3>
              <textarea
                value={formData.managerNotes}
                onChange={(e) => setFormData({...formData, managerNotes: e.target.value})}
                rows={4}
                placeholder="Internal notes about this staff member..."
              />
            </div>
            
            {/* Training Info - Read Only for now */}
            {staff && (
              <div className="form-section full-width info-section">
                <h3>📚 Training Information</h3>
                <div className="info-grid">
                  <div>
                    <strong>Completed Training:</strong>
                    <ul>
                      {staff.trainingCompleted.length > 0 ? (
                        staff.trainingCompleted.map((training: string) => (
                          <li key={training}>{training}</li>
                        ))
                      ) : (
                        <li>No completed training</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <strong>In Progress:</strong>
                    <ul>
                      {staff.trainingInProgress.length > 0 ? (
                        staff.trainingInProgress.map((training: string) => (
                          <li key={training}>{training}</li>
                        ))
                      ) : (
                        <li>No training in progress</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-actions">
            <button type="submit" className="btn-save">
              {staff ? 'Save Changes' : 'Add Staff Member'}
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Staff Ranking Row Component
const StaffRankingRow: React.FC<{
  person: any;
  rank: number;
  metric: string;
}> = ({ person, rank, metric }) => {
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };
  
  const getMetricValue = () => {
    switch (metric) {
      case 'tasks':
        return `${person.tasksCompleted} tasks`;
      case 'efficiency':
        return `${person.onTimeRate}% on-time`;
      case 'cost':
        const costPerTask = person.payRate / (person.tasksCompleted / 100);
        return `$${costPerTask.toFixed(2)}/task`;
      default:
        return person.tasksCompleted;
    }
  };
  
  return (
    <div className="ranking-row">
      <span className="rank">{getRankEmoji(rank)}</span>
      <div className="person-info">
        <span className="name">{person.fullName}</span>
        <span className="roles">{person.rolesAssigned.join(', ')}</span>
      </div>
      <span className="metric-value">{getMetricValue()}</span>
    </div>
  );
};

// Staff Performance Card Component
const StaffPerformanceCard: React.FC<{
  staff: any;
}> = ({ staff }) => {
  // Calculate individual metrics
  const hoursWorked = staff.tasksCompleted * 0.75; // Rough estimate
  const laborCost = hoursWorked * staff.payRate;
  const costPerTask = staff.tasksCompleted > 0 ? laborCost / staff.tasksCompleted : 0;
  
  // Task type breakdown (mock data)
  const taskBreakdown = {
    'Seeding': Math.floor(staff.tasksCompleted * 0.3),
    'Harvesting': Math.floor(staff.tasksCompleted * 0.25),
    'Cleaning': Math.floor(staff.tasksCompleted * 0.2),
    'Packing': Math.floor(staff.tasksCompleted * 0.15),
    'Other': Math.floor(staff.tasksCompleted * 0.1)
  };
  
  return (
    <div className="performance-card">
      <div className="card-header">
        <h4>{staff.fullName}</h4>
        <span className={`status-indicator ${staff.activeStatus}`}>
          {staff.activeStatus}
        </span>
      </div>
      
      <div className="performance-metrics">
        <div className="metric-row">
          <span className="label">Tasks Completed:</span>
          <span className="value">{staff.tasksCompleted}</span>
        </div>
        <div className="metric-row">
          <span className="label">Avg Task Duration:</span>
          <span className="value">{staff.avgTaskDuration}</span>
        </div>
        <div className="metric-row">
          <span className="label">On-Time Rate:</span>
          <span className={`value ${staff.onTimeRate > 95 ? 'good' : staff.onTimeRate > 85 ? 'warning' : 'poor'}`}>
            {staff.onTimeRate}%
          </span>
        </div>
        <div className="metric-row">
          <span className="label">Est. Labor Cost:</span>
          <span className="value">${laborCost.toFixed(2)}</span>
        </div>
        <div className="metric-row">
          <span className="label">Cost per Task:</span>
          <span className="value">${costPerTask.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Mini Task Breakdown Chart */}
      <div className="task-breakdown">
        <h5>Tasks by Type</h5>
        <div className="breakdown-bars">
          {Object.entries(taskBreakdown).map(([type, count]) => (
            <div key={type} className="breakdown-item">
              <span className="type-label">{type}</span>
              <div className="bar-container">
                <div 
                  className="bar" 
                  style={{ width: `${(count / staff.tasksCompleted) * 100}%` }}
                />
              </div>
              <span className="count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Training Overview Component
const TrainingOverview: React.FC<{
  staff: any[];
}> = ({ staff }) => {
  // Get all unique training courses
  const allCourses = [
    'Basic Safety & Orientation',
    'Seeding Technician Certification',
    'Harvest Operations Training',
    'Equipment Operation & Maintenance',
    'Manager Fundamentals'
  ];
  
  return (
    <div className="training-overview">
      <h3>🎓 Training Completion Matrix</h3>
      <div className="training-matrix">
        <table>
          <thead>
            <tr>
              <th>Staff Member</th>
              {allCourses.map(course => (
                <th key={course} className="course-header">
                  {course.split(' ').map(word => word[0]).join('')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map(person => (
              <tr key={person.id}>
                <td className="staff-name-cell">{person.fullName}</td>
                {allCourses.map(course => (
                  <td key={course} className="status-cell">
                    {person.trainingCompleted.includes(course) ? (
                      <span className="completed">✅</span>
                    ) : person.trainingInProgress.includes(course) ? (
                      <span className="in-progress">📚</span>
                    ) : (
                      <span className="not-started">-</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Course name legend */}
      <div className="course-legend">
        <h4>Course Abbreviations:</h4>
        <ul>
          {allCourses.map(course => (
            <li key={course}>
              <strong>{course.split(' ').map(word => word[0]).join('')}:</strong> {course}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Staff Analytics View Component
const StaffAnalyticsView: React.FC<{
  staff: any[];
}> = ({ staff }) => {
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedMetric, setSelectedMetric] = useState('tasks');
  
  // Format date range for display
  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case 'last7days': return 'Last 7 Days';
      case 'last30days': return 'Last 30 Days';
      case 'last90days': return 'Last 90 Days';
      case 'last6months': return 'Last 6 Months';
      case 'last12months': return 'Last 12 Months';
      default: return 'Last 30 Days';
    }
  };
  
  const getDateRangeShort = (range: string) => {
    switch (range) {
      case 'last7days': return '7d';
      case 'last30days': return '30d';
      case 'last90days': return '90d';
      case 'last6months': return '6mo';
      case 'last12months': return '12mo';
      default: return '30d';
    }
  };
  
  // Filter staff data based on date range
  const getDateRangeMultiplier = (range: string) => {
    switch (range) {
      case 'last7days': return 0.25;
      case 'last30days': return 1;
      case 'last90days': return 3;
      case 'last6months': return 6;
      case 'last12months': return 12;
      default: return 1;
    }
  };
  
  const dateMultiplier = getDateRangeMultiplier(dateRange);
  
  // Apply date range filtering to staff performance data
  const getFilteredStaffData = () => {
    return staff.map((person, index) => ({
      ...person,
      tasksCompleted: Math.round(person.tasksCompleted * dateMultiplier),
      onTimeRate: Math.max(50, Math.min(100, person.onTimeRate + (index * 2 - 3) * dateMultiplier * 0.5))
    }));
  };
  
  const filteredStaff = getFilteredStaffData();
  
  // Calculate summary metrics based on filtered data
  const activeStaff = filteredStaff.filter(s => s.activeStatus === 'active');
  const totalStaff = filteredStaff.length;
  const avgPayRate = filteredStaff.reduce((sum, s) => sum + s.payRate, 0) / filteredStaff.length;
  
  // Calculate total labor cost with date range consideration
  const calculateTotalLaborCost = () => {
    let totalCost = 0;
    filteredStaff.forEach(person => {
      const hoursWorked = person.tasksCompleted * 0.75; // Rough estimate
      totalCost += hoursWorked * person.payRate;
    });
    return totalCost;
  };
  
  const totalLaborCost = calculateTotalLaborCost();
  
  // Calculate average on-time rate from filtered data
  const avgOnTimeRate = filteredStaff.reduce((sum, s) => sum + s.onTimeRate, 0) / filteredStaff.length;
  
  return (
    <div className="staff-analytics-view">
      {/* Date Range Filter */}
      <div className="analytics-toolbar">
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="date-range-select"
        >
          <option value="last7days">Last 7 Days</option>
          <option value="last30days">Last 30 Days</option>
          <option value="last90days">Last 90 Days</option>
          <option value="last6months">Last 6 Months</option>
          <option value="last12months">Last 12 Months</option>
        </select>
        
        <select 
          value={selectedMetric} 
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="metric-select"
        >
          <option value="tasks">Tasks Completed</option>
          <option value="hours">Hours Worked</option>
          <option value="efficiency">Efficiency</option>
          <option value="cost">Labor Cost</option>
        </select>
      </div>
      
      {/* Summary Cards */}
      <div className="analytics-cards">
        <div className="analytics-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Total Staff</h3>
            <div className="metric">{totalStaff}</div>
            <div className="sub-metric">{activeStaff.length} active</div>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Avg Pay Rate</h3>
            <div className="metric">${avgPayRate.toFixed(2)}</div>
            <div className="sub-metric">per hour</div>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="card-icon">⏱️</div>
          <div className="card-content">
            <h3>On-Time Rate</h3>
            <div className="metric">{avgOnTimeRate.toFixed(1)}%</div>
            <div className="sub-metric">average</div>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <h3>Labor Cost ({getDateRangeShort(dateRange)})</h3>
            <div className="metric">${totalLaborCost.toFixed(2)}</div>
            <div className="sub-metric">estimated</div>
          </div>
        </div>
      </div>
      
      {/* Performance Rankings */}
      <div className="performance-section">
        <h3>🏆 Top Performers by {selectedMetric === 'tasks' ? 'Tasks Completed' : 
                                   selectedMetric === 'hours' ? 'Hours Worked' :
                                   selectedMetric === 'efficiency' ? 'Efficiency Rate' :
                                   'Cost Efficiency'} ({getDateRangeLabel(dateRange)})</h3>
        <div className="rankings-list">
          {activeStaff
            .sort((a, b) => {
              switch (selectedMetric) {
                case 'tasks':
                  return b.tasksCompleted - a.tasksCompleted;
                case 'efficiency':
                  return b.onTimeRate - a.onTimeRate;
                case 'cost':
                  return (a.tasksCompleted / a.payRate) - (b.tasksCompleted / b.payRate);
                default:
                  return b.tasksCompleted - a.tasksCompleted;
              }
            })
            .slice(0, 10)
            .map((person, index) => (
              <StaffRankingRow 
                key={person.id}
                person={person}
                rank={index + 1}
                metric={selectedMetric}
              />
            ))
          }
        </div>
      </div>
      
      {/* Individual Performance Cards */}
      <div className="individual-performance">
        <h3>📊 Individual Performance Details ({getDateRangeLabel(dateRange)})</h3>
        <div className="performance-grid">
          {activeStaff.map(person => (
            <StaffPerformanceCard 
              key={person.id}
              staff={person}
            />
          ))}
        </div>
      </div>
      
      {/* Training Overview */}
      <TrainingOverview staff={filteredStaff} />
    </div>
  );
};

const StaffData: React.FC = () => {
  const auth = getStoredAuth();
  const { toast } = useToast();
  const { currentLocation, isViewingAllLocations } = useLocation();
  const isManager = auth.user?.role === 'manager' || auth.user?.role === 'corporate';
  const [activeTab, setActiveTab] = useState('edit');
  const [staff, setStaff] = useState(mockStaff);
  
  // Filter staff by location
  const filteredStaff = React.useMemo(() => {
    if (isViewingAllLocations) {
      return staff;
    }
    return staff.filter(person => person.location === currentLocation.code);
  }, [staff, currentLocation.code, isViewingAllLocations]);

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
        <div></div>
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
            staff={filteredStaff}
            isManager={isManager}
            onUpdateStaff={setStaff}
          />
        ) : (
          <StaffAnalyticsView 
            staff={filteredStaff}
          />
        )}
      </div>
    </div>
  );
};

export default StaffData;