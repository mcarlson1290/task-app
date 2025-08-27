import React, { useState } from 'react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';

interface DebugPanelProps {
  tasks: any[];
  filteredTasks: any[];
  staff: any[];
  filters?: any;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ tasks, filteredTasks, staff, filters }) => {
  const [showDebug, setShowDebug] = useState(false);
  const { currentUser } = useCurrentUser();

  if (!showDebug) {
    return (
      <button 
        onClick={() => setShowDebug(true)}
        style={{ 
          position: 'fixed', 
          bottom: 10, 
          right: 10,
          padding: '10px',
          background: '#2D8028',
          color: 'white',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        🔍 Debug
      </button>
    );
  }

  const assignmentCounts: Record<string, number> = {};
  tasks.forEach(task => {
    if (task.assignTo) {
      assignmentCounts[task.assignTo] = (assignmentCounts[task.assignTo] || 0) + 1;
    }
    if (task.assignedTo) {
      const key = `legacy_${task.assignedTo}`;
      assignmentCounts[key] = (assignmentCounts[key] || 0) + 1;
    }
  });

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      width: '500px',
      maxHeight: '400px',
      overflow: 'auto',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0 }}>🔍 Assignment Debug Panel</h4>
        <button 
          onClick={() => setShowDebug(false)}
          style={{ 
            cursor: 'pointer', 
            background: 'none', 
            border: 'none', 
            fontSize: '16px' 
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong>Current User:</strong>
        <div style={{ 
          background: currentUser ? '#f0f9ff' : '#fef2f2', 
          padding: '6px', 
          borderRadius: '4px',
          marginTop: '4px'
        }}>
          {currentUser ? (
            <>
              <div>✅ {currentUser.fullName} ({currentUser.email})</div>
              <div>ID: {currentUser.id}</div>
              <div>Roles: {currentUser.rolesAssigned?.join(', ') || 'None'}</div>
            </>
          ) : (
            <div>❌ No current user loaded</div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong>Task Counts:</strong>
        <div>Total Tasks: {tasks.length}</div>
        <div>Filtered Tasks: {filteredTasks.length}</div>
        <div>Staff Members: {staff.length}</div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong>Assignment Distribution:</strong>
        <div style={{ 
          background: '#f9fafb', 
          padding: '6px', 
          borderRadius: '4px',
          maxHeight: '100px',
          overflow: 'auto'
        }}>
          {Object.entries(assignmentCounts).map(([assignment, count]) => (
            <div key={assignment} style={{ fontSize: '10px' }}>
              {assignment}: {count as number}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong>Sample Task Assignments:</strong>
        <div style={{ 
          background: '#f9fafb', 
          padding: '6px', 
          borderRadius: '4px',
          maxHeight: '120px',
          overflow: 'auto'
        }}>
          {tasks.slice(0, 8).map(task => {
            const assignment = task.assignTo || task.assignedTo;
            const isMatch = currentUser ? 
              (assignment === 'all_staff' && currentUser.id !== null) ||
              (assignment?.startsWith('role_') && currentUser.rolesAssigned?.includes(assignment.replace('role_', ''))) ||
              (assignment?.startsWith('user_') && parseInt(assignment.replace('user_', '')) === currentUser.id)
              : false;
            
            return (
              <div key={task.id} style={{ 
                fontSize: '10px', 
                marginBottom: '2px',
                color: isMatch ? '#059669' : '#374151',
                fontWeight: isMatch ? 'bold' : 'normal'
              }}>
                {isMatch ? '✅' : '❌'} {task.title?.substring(0, 25)}... → {assignment || 'No assignment'}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => {
            console.log('=== DEBUG DATA DUMP ===');
            console.log('Current User:', currentUser);
            console.log('Assignment counts:', assignmentCounts);
            console.log('First 10 tasks with assignments:');
            tasks.slice(0, 10).forEach((task, i) => {
              console.log(`${i+1}. "${task.title}" -> assignTo: "${task.assignTo}" | assignedTo: "${task.assignedTo}"`);
            });
            console.log('Staff roles available:', staff.map(s => ({ name: s.fullName, roles: s.rolesAssigned })));
          }}
          style={{
            padding: '6px 12px',
            background: '#2D8028',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Log to Console
        </button>
        
        <button 
          onClick={() => {
            // Test assignment matching
            const testTask = tasks.find(t => t.assignTo || t.assignedTo);
            if (testTask && currentUser) {
              console.log('=== TESTING ASSIGNMENT MATCH ===');
              console.log('Test task:', testTask.title);
              console.log('Assignment:', testTask.assignTo || testTask.assignedTo);
              console.log('Current user ID:', currentUser.id);
              console.log('Current user roles:', currentUser.rolesAssigned);
              
              // Test different assignment types
              const assignment = testTask.assignTo || testTask.assignedTo;
              if (assignment === `user_${currentUser.id}`) {
                console.log('✅ Direct user match');
              } else if (assignment === 'all_staff') {
                console.log('✅ All staff match');
              } else if (assignment?.startsWith('role_')) {
                const role = assignment.replace('role_', '');
                const hasRole = currentUser.rolesAssigned?.includes(role);
                console.log(`Role check for "${role}": ${hasRole ? '✅' : '❌'}`);
              }
            }
          }}
          style={{
            padding: '6px 12px',
            background: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Test Match
        </button>
      </div>
    </div>
  );
};

export default DebugPanel;