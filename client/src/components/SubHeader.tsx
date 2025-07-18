import React from 'react';
import './SubHeader.css';

interface SubHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const SubHeader: React.FC<SubHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`sub-header-wrapper ${className}`}>
      <div className="sub-header-container">
        <div className="sub-header-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SubHeader;