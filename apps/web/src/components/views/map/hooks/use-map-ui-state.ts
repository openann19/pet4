import { useState, useEffect } from 'react';
import { useSharedValue, withSpring,
  type AnimatedStyle,
} from '@petspark/motion';
import type { MapMarker } from '@/lib/maps/types';

export interface UseMapUIStateReturn {
  showList: boolean;
  selectedMarker: MapMarker | null;
  setShowList: (show: boolean) => void;
  setSelectedMarker: (marker: MapMarker | null) => void;
  sidebarStyle: ReturnType<typeof useAnimatedStyle>;
  detailSheetStyle: ReturnType<typeof useAnimatedStyle>;
}

export function useMapUIState(): UseMapUIStateReturn {
  const [showList, setShowList] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const sidebarX = useSharedValue<number>(100);
  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${sidebarX.value}%` }],
  }));

  const detailSheetY = useSharedValue<number>(100);
  const detailSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: `${detailSheetY.value}%` }],
  }));

  useEffect(() => {
    if (showList) {
      sidebarX.value = withSpring(0, { damping: 30, stiffness: 300 });
    } else {
      sidebarX.value = withSpring(100, { damping: 30, stiffness: 300 });
    }
  }, [showList, sidebarX]);

  useEffect(() => {
    if (selectedMarker?.type === 'place') {
      detailSheetY.value = withSpring(0, { damping: 30, stiffness: 300 });
    } else {
      detailSheetY.value = withSpring(100, { damping: 30, stiffness: 300 });
    }
  }, [selectedMarker, detailSheetY]);

  return {
    showList,
    selectedMarker,
    setShowList,
    setSelectedMarker,
    sidebarStyle,
    detailSheetStyle,
  };
}

