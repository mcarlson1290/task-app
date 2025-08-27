import React, { useState, useEffect } from 'react';

interface GamifiedProgressBarsProps {
  tasks: any[];
  currentUser: any;
  selectedDate: string;
}

const GamifiedProgressBars: React.FC<GamifiedProgressBarsProps> = ({ tasks, currentUser, selectedDate }) => {
  const today = new Date().toISOString().split('T')[0];
  const [currentAffirmation, setCurrentAffirmation] = useState(0);
  
  // Only show for today view
  if (selectedDate !== today) return null;
  
  // Affirmations pool
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
  
  // Rotate affirmations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAffirmation((prev) => (prev + 1) % affirmations.length);
    }, 5000); // Change every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate task stats for all tasks
  const teamStats = {
    overdue: tasks.filter(t => {
      const taskDate = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
      return taskDate < today && t.status === 'pending';
    }).length,
    pending: tasks.filter(t => {
      const taskDate = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
      return t.status === 'pending' && taskDate >= today;
    }).length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    paused: tasks.filter(t => t.status === 'paused').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    skipped: tasks.filter(t => t.status === 'skipped').length,
  };
  
  // Calculate stats for user's tasks only
  const myTasks = tasks.filter(task => {
    if (!currentUser || !task.assignTo) return false;
    
    if (task.assignTo === `user_${currentUser.id}`) return true;
    if (task.assignTo === 'all_staff' && currentUser.id) return true;
    
    if (task.assignTo?.startsWith('role_')) {
      const roleName = task.assignTo.replace('role_', '');
      return currentUser.rolesAssigned?.includes(roleName) || false;
    }
    
    return false;
  });
  
  const myStats = {
    overdue: myTasks.filter(t => {
      const taskDate = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
      return taskDate < today && t.status === 'pending';
    }).length,
    pending: myTasks.filter(t => {
      const taskDate = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
      return t.status === 'pending' && taskDate >= today;
    }).length,
    inProgress: myTasks.filter(t => t.status === 'in_progress').length,
    paused: myTasks.filter(t => t.status === 'paused').length,
    completed: myTasks.filter(t => t.status === 'completed').length,
    skipped: myTasks.filter(t => t.status === 'skipped').length,
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
            >
              {stats.overdue > 2 && <span>{stats.overdue}</span>}
            </div>
          )}
          
          {/* Pending */}
          {stats.pending > 0 && (
            <div 
              className="progress-segment pending"
              style={{ width: `${(stats.pending / total) * 100}%` }}
              title={`${stats.pending} pending`}
            >
              {stats.pending > 2 && <span>{stats.pending}</span>}
            </div>
          )}
          
          {/* In Progress */}
          {stats.inProgress > 0 && (
            <div 
              className="progress-segment in-progress"
              style={{ width: `${(stats.inProgress / total) * 100}%` }}
              title={`${stats.inProgress} in progress`}
            >
              {stats.inProgress > 2 && <span>{stats.inProgress}</span>}
            </div>
          )}
          
          {/* Paused */}
          {stats.paused > 0 && (
            <div 
              className="progress-segment paused"
              style={{ width: `${(stats.paused / total) * 100}%` }}
              title={`${stats.paused} paused`}
            >
              {stats.paused > 2 && <span>{stats.paused}</span>}
            </div>
          )}
          
          {/* Completed */}
          {stats.completed > 0 && (
            <div 
              className="progress-segment completed"
              style={{ width: `${(stats.completed / total) * 100}%` }}
              title={`${stats.completed} completed`}
            >
              {stats.completed > 2 && <span>{stats.completed}</span>}
            </div>
          )}
          
          {/* Skipped */}
          {stats.skipped > 0 && (
            <div 
              className="progress-segment skipped"
              style={{ width: `${(stats.skipped / total) * 100}%` }}
              title={`${stats.skipped} skipped`}
            >
              {stats.skipped > 2 && <span>{stats.skipped}</span>}
            </div>
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