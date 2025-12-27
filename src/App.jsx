import React, { useState, useEffect, useRef } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { invoke } from '@tauri-apps/api/core';

// Hooks
import { useDeepgram } from './hooks/useDeepgram';

// Components
import StatusBadge from './components/StatusBadge';
import Controls from './components/Controls';
import { CopyIcon, CheckIcon, TrashIcon } from './components/Icons';

import './App.css';

function App() {
  const { 
    isRecording, 
    connectionState, 
    transcription, 
    startRecording, 
    stopRecording, 
    clearTranscription 
  } = useDeepgram();

  const [copyStatus, setCopyStatus] = useState('Copy');
  
  // Refs for stable state access inside the shortcut listener
  const isRecordingRef = useRef(false);
  const isKeyDownRef = useRef(false);
  const transcriptionRef = useRef("");

  // Keep Refs in sync with React State so the shortcut always sees the latest data
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { transcriptionRef.current = transcription; }, [transcription]);

  useEffect(() => {
    const setupShortcut = async () => {
      try {
        // Clean up to prevent "Hotkey already registered" errors
        await unregisterAll();

        await register('Control+Alt+P', async (event) => {
          if (event.state === 'Pressed') {
            // 1. Block the OS auto-repeat from spamming the toggle
            if (isKeyDownRef.current) return;
            isKeyDownRef.current = true;

            // 2. TOGGLE LOGIC
            if (!isRecordingRef.current) {
              console.log("Starting System-wide Voice Input...");
              clearTranscription();
              transcriptionRef.current = "";
              startRecording();
            } else {
              console.log("Stopping and Pasting...");
              stopRecording();
              
              // 3. CRITICAL: 200ms buffer to allow the final voice packet to arrive
              setTimeout(async () => {
                const finalSpeech = transcriptionRef.current.trim();
                if (finalSpeech) {
                  try {
                    await writeText(finalSpeech); // Write to Clipboard
                    await invoke('trigger_paste'); // Trigger Ctrl+V
                  } catch (err) {
                    console.error("Paste failed. Check permissions:", err);
                  }
                }
              }, 250);
            }
          } 
          else if (event.state === 'Released') {
            isKeyDownRef.current = false;
          }
        });
      } catch (err) {
        console.error("Shortcut Error:", err);
      }
    };

    setupShortcut();
    return () => { unregisterAll(); };
  }, [startRecording, stopRecording, clearTranscription]);

  const handleCopyToClipboard = async () => {
    if (!transcription) return;
    try {
      await writeText(transcription);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy'), 2000);
    } catch (err) {
      setCopyStatus('Error');
    }
  };

  return (
    <div className="container">
      <header>
        <h1><span>🎙️</span> Wispr Clone</h1>
        <StatusBadge connectionState={connectionState} />
      </header>

      <main>
        <div className="transcription-box">
          {transcription || (
            <span className="placeholder">
              Press <strong>Ctrl + Alt + P</strong> to start/stop typing...
            </span>
          )}
        </div>

        <Controls 
          isRecording={isRecording}
          onStart={startRecording}
          onStop={stopRecording}
        />

        <div className="actions">
          <button className="action-btn primary" onClick={handleCopyToClipboard} disabled={!transcription}>
            {copyStatus === 'Copied!' ? <CheckIcon /> : <CopyIcon />} {copyStatus}
          </button>
          
          <button className="action-btn secondary" onClick={clearTranscription} disabled={!transcription}>
            <TrashIcon /> Clear
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;