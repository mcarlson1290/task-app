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
            onUpdateStaff={setStaff}
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