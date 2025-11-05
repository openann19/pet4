import { useState } from 'react';

export const useGroupCall = () => {
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const startCall = async () => {
    return { id: Date.now().toString() };
  };

  const endCall = async () => {
    setParticipants([]);
  };

  const toggleAudio = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsCameraOff(!isCameraOff);
  };

  return {
    participants,
    isMuted,
    isCameraOff,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
};
