'use client';

import { getVideoThumbnails } from '@/core/services/media/video/thumbnails';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';

export interface VideoTrimmerProps {
  uri: string;
  durationSec?: number;
  onChange: (startSec: number, endSec: number) => void;
}

export function VideoTrimmer({
  uri,
  durationSec = 0,
  onChange,
}: VideoTrimmerProps): React.ReactElement {
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [width, setWidth] = useState(0);
  const [start, setStart] = useState(0); // px from left
  const [end, setEnd] = useState(0); // px from left
  const timelineRef = useRef<HTMLDivElement>(null);
  const handleW = 16;

  useEffect(() => {
    let cancelled = false;

    getVideoThumbnails(uri, 8).then((thumbnails) => {
      if (!cancelled) {
        setThumbs(thumbnails);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  const pxToSec = useMemo(() => {
    return (px: number): number => {
      if (!width || durationSec === 0) {
        return 0;
      }
      return Math.max(0, Math.min(durationSec, (px / width) * durationSec));
    };
  }, [width, durationSec]);

  const _update = useCallback(() => {
    const startSec = pxToSec(start);
    const endSec = pxToSec(end);
    onChange(Math.min(startSec, endSec), Math.max(startSec, endSec));
  }, [pxToSec, onChange, start, end]);

  useEffect(() => {
    if (timelineRef.current) {
      const w = timelineRef.current.offsetWidth;
      setWidth(w);
      setEnd(w);
    }
  }, []);

  const maskWidth = Math.max(handleW, end - start);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: 'var(--color-bg-overlay)', fontWeight: '700', fontSize: 14, marginBottom: 8 }}>
        Trim
      </div>
      <div
        ref={timelineRef}
        style={{
          position: 'relative',
          height: 72,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid #666',
          backgroundColor: '#222',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
          {thumbs.length > 0 ? (
            thumbs.map((thumb, i) => (
              <img
                key={i}
                src={thumb}
                alt={`Thumbnail ${i + 1}`}
                style={{ flex: 1, height: '100%', objectFit: 'cover' }}
              />
            ))
          ) : (
            <div style={{ flex: 1, height: '100%', backgroundColor: '#333' }} />
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: start,
            width: maskWidth,
            backgroundColor: 'rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            width: handleW,
            height: '100%',
            backgroundColor: '#444',
            borderRight: '1px solid #666',
            borderLeft: '1px solid #666',
            zIndex: 10,
            transform: `translateX(${start}px)`,
            cursor: 'ew-resize',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            width: handleW,
            height: '100%',
            backgroundColor: '#444',
            borderRight: '1px solid #666',
            borderLeft: '1px solid #666',
            zIndex: 10,
            transform: `translateX(${end - handleW}px)`,
            cursor: 'ew-resize',
          }}
        />
      </div>
    </div>
  );
}
