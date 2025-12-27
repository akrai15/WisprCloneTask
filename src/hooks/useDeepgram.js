import { useState, useRef } from 'react';

const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY; 

export const useDeepgram = () => {
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [connectionState, setConnectionState] = useState('Disconnected'); 
  
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const startRecording = async () => {
    try {
      setConnectionState('Connecting');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const url = 'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true';
      const socket = new WebSocket(url, ['token', DEEPGRAM_API_KEY]);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Deepgram Connected');
        setConnectionState('Connected');
        setIsRecording(true);
        
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.addEventListener('dataavailable', async (event) => {
          if (event.data.size > 0 && socket.readyState === 1) {
            socket.send(event.data); 
          }
        });

        mediaRecorderRef.current.start(250);
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives[0]?.transcript;
        
        // FIXED: Only update local state. 
        // Do NOT call 'type_text' here, as it causes stuttering and errors.
        if (transcript && received.is_final) {
          setTranscription((prev) => prev + ' ' + transcript);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket Error', error);
        setConnectionState('Error');
      };

      socket.onclose = () => {
        setConnectionState('Disconnected');
        setIsRecording(false);
      };

    } catch (error) {
      console.error('Error starting recording:', error);
      setConnectionState('Error: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (socketRef.current) {
      if(socketRef.current.readyState === 1) {
          socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
          socketRef.current.close();
      }
    }
    
    setIsRecording(false);
    setConnectionState('Disconnected');
  };

  const clearTranscription = () => setTranscription('');

  return {
    isRecording,
    connectionState,
    transcription,
    startRecording,
    stopRecording,
    clearTranscription
  };
};