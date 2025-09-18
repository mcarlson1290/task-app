import React, { useState, useEffect } from 'react';

interface GamifiedProgressBarsProps {
  tasks: any[];
  currentUser: any;
  selectedDate: string;
}

const GamifiedProgressBars: React.FC<GamifiedProgressBarsProps> = ({ tasks, currentUser, selectedDate }) => {
  const today = new Date().toISOString().split('T')[0];
  const [currentAffirmation, setCurrentAffirmation] = useState(0);
  
  // Affirmations pool - moved before useEffect to ensure consistent order
  const affirmations = [
    "Keep crushing it! 💪",
    "You're doing amazing!",
    "Only {percent}% left to go!",
    "Progress, not perfection!",
    "Every task counts!",
    "You've got this!",
    "Momentum is building!",
    "One task at a time!",
    "Stay focused, stay strong!",
    "Almost there!",
    "Making it happen!",
    "Productivity champion!",
    "Keep the streak alive!",
    "You're unstoppable!",
    "Great progress today!",
    "Winning the day!",
    "Task master in action!",
    "Building great habits!",
    "Excellence in motion!",
    "Today is your day!",
    "Crushing those goals!",
    "Keep pushing forward!",
    "Success is a journey!",
    "You're on fire! 🔥",
    "Making waves!",
    "Champion mindset!",
    "Consistency is key!",
    "Progress over perfection!",
    "Small wins add up!",
    "You're making it happen!"
  ];
  
  // Rotate affirmations - ensure this is always called
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAffirmation((prev) => (prev + 1) % affirmations.length);
    }, 3600000); // Change every hour (60 * 60 * 1000 ms)
    
    return () => clearInterval(interval);
  }, [affirmations.length]);
  
  // Safety check - don't render if we don't have tasks or current user (after all hooks)
  if (!tasks || !Array.isArray(tasks) || !currentUser) {
    return null;
  }
  
  // Only show for today view
  if (selectedDate !== today) return null;
  
  // Use the pre-filtered tasks passed from the parent component
  // These tasks are already filtered by the Tasks page to show only tasks visible on the selected date
  const todayTasks = tasks;
  
  // Calculate task stats for today's tasks only - with error handling
  const teamStats = {
    overdue: todayTasks.filter(t => {
      try {
        const taskDate = t?.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
        return taskDate < today && t?.status === 'pending';
      } catch (error) {
        return false;
      }
    }).length,
    pending: todayTasks.filter(t => {
      try {
        const taskDate = t?.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
        return t?.status === 'pending' && taskDate >= today;
      } catch (error) {
        return false;
      }
    }).length,
    inProgress: todayTasks.filter(t => t?.status === 'in_progress').length,
    paused: todayTasks.filter(t => t?.status === 'paused').length,
    completed: todayTasks.filter(t => t?.status === 'completed').length,
    skipped: todayTasks.filter(t => t?.status === 'skipped').length,
  };
  
  // Calculate stats for user's tasks only - with error handling
  const myTasks = todayTasks.filter(task => {
    try {
      if (!currentUser || !task) return false;
      
      // Check both assignTo and assignedTo fields
      const assignment = task.assignTo || task.assignedTo;
      if (!assignment) return false;
      
      if (assignment === `user_${currentUser.id}`) return true;
      if (assignment === 'all_staff' && currentUser.id) return true;
      
      if (assignment.startsWith && assignment.startsWith('role_')) {
        const roleName = assignment.replace('role_', '');
        return currentUser.rolesAssigned?.includes(roleName) || false;
      }
      
      return false;
    } catch (error) {
      console.warn('Error filtering task:', task, error);
      return false;
    }
  });
  
  const myStats = {
    overdue: myTasks.filter(t => {
      try {
        const taskDate = t?.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
        return taskDate < today && t?.status === 'pending';
      } catch (error) {
        return false;
      }
    }).length,
    pending: myTasks.filter(t => {
      try {
        const taskDate = t?.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
        return t?.status === 'pending' && taskDate >= today;
      } catch (error) {
        return false;
      }
    }).length,
    inProgress: myTasks.filter(t => t?.status === 'in_progress').length,
    paused: myTasks.filter(t => t?.status === 'paused').length,
    completed: myTasks.filter(t => t?.status === 'completed').length,
    skipped: myTasks.filter(t => t?.status === 'skipped').length,
  };
  
  const teamTotal = Object.values(teamStats).reduce((a, b) => a + b, 0);
  const myTotal = Object.values(myStats).reduce((a, b) => a + b, 0);
  
  const teamCompletedPercent = teamTotal > 0 
    ? Math.round(((teamStats.completed + teamStats.skipped) / teamTotal) * 100)
    : 0;
    
  const myCompletedPercent = myTotal > 0
    ? Math.round(((myStats.completed + myStats.skipped) / myTotal) * 100)
    : 0;
  
  // Get affirmation with percent replaced
  const getAffirmation = (percent: number) => {
    let message = affirmations[currentAffirmation];
    message = message.replace('{percent}', String(100 - percent));
    return message;
  };
  
  // Render progress bar
  const renderProgressBar = (stats: typeof teamStats, total: number, label: string, isPersonal = false) => {
    if (total === 0) {
      return (
        <div className="progress-bar-container">
          <div className="progress-label">
            <span>{label}</span>
            <span className="progress-text">No tasks today!</span>
          </div>
          <div className="progress-bar-empty">
            <div className="empty-message">🎉 All clear!</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="progress-bar-container">
        <div className="progress-label">
          <span>{label}</span>
          <span className="progress-count">{stats.completed + stats.skipped}/{total} tasks</span>
        </div>
        
        <div className="progress-bar">
          {/* Overdue */}
          {stats.overdue > 0 && (
            <div 
              className="progress-segment overdue"
              style={{ width: `${(stats.overdue / total) * 100}%` }}
              title={`${stats.overdue} overdue`}
            />
          )}
          
          {/* Pending */}
          {stats.pending > 0 && (
            <div 
              className="progress-segment pending"
              style={{ width: `${(stats.pending / total) * 100}%` }}
              title={`${stats.pending} pending`}
            />
          )}
          
          {/* In Progress */}
          {stats.inProgress > 0 && (
            <div 
              className="progress-segment in-progress"
              style={{ width: `${(stats.inProgress / total) * 100}%` }}
              title={`${stats.inProgress} in progress`}
            />
          )}
          
          {/* Paused */}
          {stats.paused > 0 && (
            <div 
              className="progress-segment paused"
              style={{ width: `${(stats.paused / total) * 100}%` }}
              title={`${stats.paused} paused`}
            />
          )}
          
          {/* Completed */}
          {stats.completed > 0 && (
            <div 
              className="progress-segment completed"
              style={{ width: `${(stats.completed / total) * 100}%` }}
              title={`${stats.completed} completed`}
            />
          )}
          
          {/* Skipped */}
          {stats.skipped > 0 && (
            <div 
              className="progress-segment skipped"
              style={{ width: `${(stats.skipped / total) * 100}%` }}
              title={`${stats.skipped} skipped`}
            />
          )}
        </div>
        
        <div className="progress-percentage">
          {isPersonal ? myCompletedPercent : teamCompletedPercent}% Complete
        </div>
      </div>
    );
  };
  
  return (
    <div className="gamified-progress-container">
      <div className="affirmation-message">
        {getAffirmation(myTotal > 0 ? myCompletedPercent : teamCompletedPercent)}
      </div>
      
      <div className="progress-bars-wrapper">
        {renderProgressBar(teamStats, teamTotal, "🏢 Team Progress")}
        {currentUser && renderProgressBar(myStats, myTotal, "👤 My Progress", true)}
      </div>
      
      <div className="progress-legend">
        <div className="legend-item">
          <span className="legend-color overdue"></span>
          <span>Overdue</span>
        </div>
        <div className="legend-item">
          <span className="legend-color pending"></span>
          <span>Pending</span>
        </div>
        <div className="legend-item">
          <span className="legend-color in-progress"></span>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <span className="legend-color completed"></span>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
};

export default GamifiedProgressBars;