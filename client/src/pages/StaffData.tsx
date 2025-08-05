import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/contexts/LocationContext';
import { SubTabNavigation } from '@/components/SubTabNavigation';
import { 
  getAllStaff, 
  updateStaffMember, 
  addStaffMember, 
  getAvailableRoles, 
  canAssignRole,
  type StaffMember 
} from '@/services/staffService';

// Production launch - using dynamic staff generation from Microsoft authentication

// StaffEditView Component
const StaffEditView: React.FC<{
  staff: StaffMember[];
  isManager: boolean;
  onUpdateStaff: (staff: StaffMember[]) => void;
}> = ({ staff, isManager, onUpdateStaff }) => {
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const handleEditStaff = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setShowEditModal(true);
  };

  const handleAddStaff = () => {
    setEditingStaff(null);
    setShowEditModal(true);
  };

  const handleSaveStaff = (staffData: StaffMember) => {
    if (editingStaff) {
      // Update existing staff member
      updateStaffMember(staffData);
      const updatedStaff = staff.map(person => 
        person.id === staffData.id ? staffData : person
      );
      onUpdateStaff(updatedStaff);
    } else {
      // Add new staff member
      const newStaff = addStaffMember({
        fullName: staffData.fullName,
        email: staffData.email,
        phone: staffData.phone,
        location: staffData.location,
        rolesAssigned: staffData.rolesAssigned,
        dateHired: staffData.dateHired,
        payRate: staffData.payRate,
        trainingCompleted: staffData.trainingCompleted || [],
        trainingInProgress: staffData.trainingInProgress || [],
        preferredHours: staffData.preferredHours,
        activeStatus: staffData.activeStatus,
        lastTaskCompleted: staffData.lastTaskCompleted,
        managerNotes: staffData.managerNotes,
        tasksCompleted: staffData.tasksCompleted || 0,
        avgTaskDuration: staffData.avgTaskDuration || '0m',
        onTimeRate: staffData.onTimeRate || 100,
        microsoftId: staffData.microsoftId || '',
        lastActive: new Date().toISOString()
      });
      const updatedStaff = [...staff, newStaff];
      onUpdateStaff(updatedStaff);
    }
    
    setShowEditModal(false);
    setEditingStaff(null);
    toast({
      title: "Staff Member Saved",
      description: `${staffData.fullName} has been ${editingStaff ? 'updated' : 'added'} successfully.`,
    });
  };

  const handleDeleteStaff = (staffId: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      const updatedStaff = staff.filter(person => person.id !== staffId);
      onUpdateStaff(updatedStaff);
      toast({
        title: "Staff Member Deleted",
        description: "Staff member has been removed successfully.",
      });
    }
  };

  return (
    <div className="staff-edit-view">
      <div className="actions-bar">
        <button className="btn-primary" onClick={handleAddStaff}>
          + Add New Staff Member
        </button>
      </div>

      <div className="staff-list">
        {staff.length === 0 ? (
          <div className="empty-state">
            <h3>No Staff Members Found</h3>
            <p>Staff members will automatically appear here when they log in with Microsoft authentication.</p>
          </div>
        ) : (
          staff.map(person => (
            <div key={person.id} className="staff-card">
              <div className="staff-info">
                <h3>{person.fullName}</h3>
                <p>{person.email}</p>
                <div className="staff-details">
                  <span>Location: {person.location}</span>
                  <span>Roles: {person.rolesAssigned.join(', ')}</span>
                  <span>Status: {person.activeStatus}</span>
                </div>
              </div>
              {isManager && (
                <div className="staff-actions">
                  <button onClick={() => handleEditStaff(person)}>Edit</button>
                  <button onClick={() => handleDeleteStaff(person.id)} className="btn-danger">Delete</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// StaffAnalyticsView Component
const StaffAnalyticsView: React.FC<{
  staff: StaffMember[];
}> = ({ staff }) => {
  return (
    <div className="staff-analytics-view">
      <div className="analytics-summary">
        <div className="metric-card">
          <h3>Total Staff</h3>
          <div className="metric">{staff.length}</div>
        </div>
        <div className="metric-card">
          <h3>Active Staff</h3>
          <div className="metric">{staff.filter(s => s.activeStatus === 'active').length}</div>
        </div>
        <div className="metric-card">
          <h3>Average Tasks</h3>
          <div className="metric">
            {staff.length > 0 ? Math.round(staff.reduce((sum, s) => sum + s.tasksCompleted, 0) / staff.length) : 0}
          </div>
        </div>
      </div>

      <div className="staff-performance">
        <h3>Staff Performance</h3>
        <div className="performance-list">
          {staff.map(person => (
            <div key={person.id} className="performance-row">
              <div className="staff-name">{person.fullName}</div>
              <div className="performance-metrics">
                <span>Tasks: {person.tasksCompleted}</span>
                <span>On-time: {person.onTimeRate}%</span>
                <span>Avg Duration: {person.avgTaskDuration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StaffData: React.FC = () => {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const { currentLocation, isViewingAllLocations } = useLocation();
  const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Corporate';
  const [activeTab, setActiveTab] = useState('edit');
  const [staff, setStaff] = useState<StaffMember[]>([]);

  // Load staff data from service on component mount with refresh
  useEffect(() => {
    const loadStaffData = () => {
      const staffData = getAllStaff();
      console.log('Loaded staff data:', staffData.length, 'members');
      console.log('Staff members:', staffData.map(s => `${s.fullName} (${s.email})`));
      setStaff(staffData);
    };
    
    loadStaffData();
    
    // Refresh every 5 seconds to catch new logins
    const interval = setInterval(loadStaffData, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Filter staff by location
  const filteredStaff = React.useMemo(() => {
    if (isViewingAllLocations || currentUser?.role === 'Corporate') {
      return staff;
    }
    return staff.filter(person => person.location === currentLocation.code);
  }, [staff, currentLocation.code, isViewingAllLocations, currentUser?.role]);

  // Update staff data handler
  const handleUpdateStaff = (updatedStaff: StaffMember[]) => {
    setStaff(updatedStaff);
    // Staff service handles persistence automatically
  };

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

  const tabs = [
    { id: 'edit', label: 'Staff Edit', icon: '✏️' },
    { id: 'analytics', label: 'Staff Analytics', icon: '📊' }
  ];

  return (
    <div className="staff-data-page">
      {/* Navigation and Actions on same line */}
      <div className="nav-with-actions">
        <SubTabNavigation 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="nav-actions">
          <button className="btn-export" onClick={handleExport}>
            📊 Export Staff Report
          </button>
        </div>
      </div>
      
      {/* Content will go here based on activeTab */}
      <div className="tab-content">
        {activeTab === 'edit' ? (
          <StaffEditView 
            staff={filteredStaff}
            isManager={isManager}
            onUpdateStaff={handleUpdateStaff}
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