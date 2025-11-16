'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from '@petspark/motion';
import type { CSSProperties } from 'react';

const isWeb = typeof window !== 'undefined';

export interface DropZoneWebProps {
  onDrop: (file: File) => void;
}

export function DropZoneWeb({ onDrop }: DropZoneWebProps): React.ReactElement | null {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    const preventDefault = (e: DragEvent): void => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent): void => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer?.files?.[0];
      if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
        onDrop(file);
      }
    };

    element.addEventListener('dragover', preventDefault);
    element.addEventListener('dragenter', preventDefault);
    element.addEventListener('drop', handleDrop);

    return () => {
      element.removeEventListener('dragover', preventDefault);
      element.removeEventListener('dragenter', preventDefault);
      element.removeEventListener('drop', handleDrop);
    };
  }, [onDrop]);

  if (!isWeb) {
    return null;
  }

  const dropZoneStyle: CSSProperties = {
    borderWidth: 1,
    borderColor: '#666',
    borderStyle: 'dashed',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 120,
  };

  return (
    <motion.div
      ref={ref}
      style={dropZoneStyle}
      role="button"
      aria-label="Drop photo or video here"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <span style={textStyle}>Drag & drop photo or video</span>
    </motion.div>
  );
}

const textStyle: CSSProperties = {
  color: '#999',
  fontSize: 14,
  fontWeight: '500',
};
