import React, { useState, useEffect, useRef } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { invoke } from '@tauri-apps/api/core';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'; // Corrected Import

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
  const isRecordingRef = useRef(false);
  const isKeyDownRef = useRef(false);
  const transcriptionRef = useRef("");
  const appWindow = getCurrentWindow();

  // --- 1. HUD CONTROL LOGIC ---
  useEffect(() => {
    const handleHUD = async () => {
      // Get the HUD window instance safely inside the effect
      const hud = await WebviewWindow.getByLabel('hud');
      if (hud) {
        if (isRecording) {
          await hud.show();
          await hud.setAlwaysOnTop(true);
        } else {
          await hud.hide();
        }
      }
    };
    handleHUD();
  }, [isRecording]);

  // --- 2. FULL VOLUME SOUND GENERATOR ---
  const playFeedbackSound = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'square'; 

      if (type === 'start') {
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
      } else {
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
      }

      gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.error("Audio feedback failed", e);
    }
  };

  // --- 3. CONNECTION OBSERVER ---
  useEffect(() => {
    if (connectionState === 'Connected') {
      playFeedbackSound('start');
    } else if (connectionState === 'Disconnected') {
      if (transcriptionRef.current !== "") {
        playFeedbackSound('stop');
      }
    }
  }, [connectionState]);

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { transcriptionRef.current = transcription; }, [transcription]);

  useEffect(() => {
    const initApp = async () => {
      let permission = await isPermissionGranted();
      if (!permission) await requestPermission();
      await appWindow.setAlwaysOnTop(true);
    };
    initApp();
  }, []);

  // --- 4. SHORTCUT LOGIC ---
  useEffect(() => {
    const setupShortcut = async () => {
      try {
        await unregisterAll();
        await register('Control+Alt+P', async (event) => {
          if (event.state === 'Pressed') {
            if (isKeyDownRef.current) return;
            isKeyDownRef.current = true;

            if (!isRecordingRef.current) {
              clearTranscription();
              transcriptionRef.current = "";
              startRecording();
            } else {
              stopRecording();
              
              setTimeout(async () => {
                const finalSpeech = transcriptionRef.current.trim();
                if (finalSpeech) {
                  try {
                    await writeText(finalSpeech); 
                    await invoke('trigger_paste'); 
                    sendNotification({ 
                      title: 'Wispr Clone', 
                      body: '✅ Transcribed & Pasted!' 
                    });
                  } catch (err) {
                    console.error("Paste failed:", err);
                  }
                }
              }, 250);
            }
          } else {
            isKeyDownRef.current = false;
          }
        });
      } catch (err) {
        console.error("Shortcut failed:", err);
      }
    };
    setupShortcut();
    return () => { unregisterAll(); };
  }, [startRecording, stopRecording, clearTranscription]);

  return (
    <div className={`container ${isRecording ? 'recording-active' : ''}`}>
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
        <Controls isRecording={isRecording} onStart={startRecording} onStop={stopRecording} />
        <div className="actions">
          <button className="action-btn primary" onClick={() => writeText(transcription)} disabled={!transcription}>
            <CopyIcon /> Copy
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