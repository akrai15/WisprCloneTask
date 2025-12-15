import React from 'react';
import { MicIcon } from './Icons';

const Controls = ({ isRecording, onStart, onStop }) => {
  // Logic to prevent rapid-fire clicks if needed, 
  // currently just wrappers for the props.
  const handlePushDown = () => {
    if (!isRecording) onStart();
  };

  const handlePushUp = () => {
    if (isRecording) onStop();
  };

  return (
    <div className="controls-wrapper">
      <div className="controls">
        <button
          className={`record-btn ${isRecording ? 'active' : ''}`}
          onMouseDown={handlePushDown}
          onMouseUp={handlePushUp}
          onMouseLeave={handlePushUp} // Stop recording if mouse slips off
          onTouchStart={handlePushDown} // Basic mobile support
          onTouchEnd={handlePushUp}
          title="Hold to Speak"
        >
          <MicIcon />
        </button>
      </div>
      
      <div className="status-hint">
         {isRecording ? 'Listening...' : 'Hold to Speak'}
      </div>
    </div>
  );
};

export default Controls;