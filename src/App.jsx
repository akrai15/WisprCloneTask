import React, { useState } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

// Hooks
import { useDeepgram } from './hooks/useDeepgram';

// Components
import StatusBadge from './components/StatusBadge';
import Controls from './components/Controls';
import { CopyIcon, CheckIcon, TrashIcon } from './components/Icons';

// Styles
import './App.css';

function App() {
  // 1. Init Custom Hook
  const { 
    isRecording, 
    connectionState, 
    transcription, 
    startRecording, 
    stopRecording,
    clearTranscription 
  } = useDeepgram();

  // 2. Local UI State
  const [copyStatus, setCopyStatus] = useState('Copy');

  // 3. Handlers
  const handleCopyToClipboard = async () => {
    if (!transcription) return;
    try {
      await writeText(transcription);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy'), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      setCopyStatus('Error');
    }
  };

  return (
    <div className="container">
      <header>
        <h1>
          <span>🎙️</span> Wispr Clone
        </h1>
        <StatusBadge connectionState={connectionState} />
      </header>

      <main>
        {/* Transcription Area */}
        <div className="transcription-box">
          {transcription || (
            <span className="placeholder">
              Hold the button below and start speaking...
            </span>
          )}
        </div>

        {/* Record Button Component */}
        <Controls 
          isRecording={isRecording}
          onStart={startRecording}
          onStop={stopRecording}
        />

        {/* Action Buttons (Copy / Clear) */}
        <div className="actions">
          <button 
            className="action-btn primary" 
            onClick={handleCopyToClipboard} 
            disabled={!transcription}
          >
            {copyStatus === 'Copied!' ? <CheckIcon /> : <CopyIcon />}
            {copyStatus}
          </button>
          
          <button 
            className="action-btn secondary" 
            onClick={clearTranscription}
            disabled={!transcription}
          >
            <TrashIcon /> Clear
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;