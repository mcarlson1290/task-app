import React from 'react';
import SubHeader from './SubHeader';

// Example usage of SubHeader component
const SubHeaderExample: React.FC = () => {
  return (
    <SubHeader>
      {/* Left side - Filter controls */}
      <div className="filter-group">
        <input 
          type="text" 
          placeholder="Search tasks..." 
          className="search-input"
        />
        <select className="filter-dropdown">
          <option value="all">All Categories</option>
          <option value="seeding">Seeding</option>
          <option value="harvesting">Harvesting</option>
          <option value="packing">Packing</option>
        </select>
        <select className="filter-dropdown">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Right side - Tab navigation and action buttons */}
      <div className="tab-group">
        <button className="tab-button active">All Tasks</button>
        <button className="tab-button">My Tasks</button>
        <button className="tab-button">Overdue</button>
      </div>

      <div className="ml-auto">
        <button className="btn-secondary">
          <span>📊</span>
          Export
        </button>
        <button className="btn-primary">
          <span>➕</span>
          Add Task
        </button>
      </div>
    </SubHeader>
  );
};

export default SubHeaderExample;