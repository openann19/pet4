import { useState } from 'react';

export const useLiveStream = () => {
  const [currentStream, setCurrentStream] = useState(null);
  const [loading, setLoading] = useState(false);

  const startStream = async (title: string, category: string, privacy: string) => {
    setLoading(true);
    const newStream = {
      id: Date.now().toString(),
      title,
      category,
      privacy,
      startedAt: new Date(),
    };
    setCurrentStream(newStream);
    setLoading(false);
    return newStream;
  };

  const endStream = async () => {
    setCurrentStream(null);
  };

  return {
    currentStream,
    loading,
    startStream,
    endStream,
  };
};
