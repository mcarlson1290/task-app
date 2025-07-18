import React from 'react';

interface SubHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const SubHeader: React.FC<SubHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`sub-header ${className}`}>
      <div className="sub-header-content">
        {children}
      </div>
    </div>
  );
};

export default SubHeader;