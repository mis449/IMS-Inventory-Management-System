import React from 'react';

const DragScrollTable = ({ children, className = "" }) => {
  return (
    <div
      className={`overflow-x-auto overflow-y-auto flex-1 min-h-0 ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  );
};

export default DragScrollTable;
