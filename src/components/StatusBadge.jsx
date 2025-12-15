import React from 'react';

const StatusBadge = ({ connectionState }) => {
  
  const getLabel = () => {
    switch (connectionState) {
      case 'Connected': return 'Ready';
      case 'Connecting': return 'Connecting...';
      case 'Error': return 'Error';
      default: return 'Offline';
    }
  };

 
  const getStatusClass = () => {
    if (connectionState.startsWith('Error')) return 'error';
    return connectionState.toLowerCase();
  };

  return (
    <div className={`status-badge ${getStatusClass()}`}>
      <div className="status-dot"></div>
      {getLabel()}
    </div>
  );
};

export default StatusBadge;