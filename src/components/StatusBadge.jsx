import React from 'react';

const StatusBadge = ({ connectionState }) => {
  // Helper to determine the text label
  const getLabel = () => {
    switch (connectionState) {
      case 'Connected': return 'Ready';
      case 'Connecting': return 'Connecting...';
      case 'Error': return 'Error';
      default: return 'Offline';
    }
  };

  // Helper to determine the CSS class (e.g., 'connected', 'error')
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