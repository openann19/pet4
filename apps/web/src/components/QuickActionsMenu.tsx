import { useState } from 'react';
import { MotionView, Presence } from '@petspark/motion';
import { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import React from 'react';
import {
  Plus,
  X,
  PawPrint,
  Heart,
  Calendar,
  BookmarkSimple,
  Sparkle,
  ChartBar,
  MapTrifold,
} from '@phosphor-icons/react';
import { haptics } from '@/lib/haptics';

interface QuickActionsMenuProps {
  onCreatePet: () => void;
  onViewHealth: () => void;
  onSchedulePlaydate: () => void;
  onSavedSearches: () => void;
  onGenerateProfiles: () => void;
  onViewStats: () => void;
  onViewMap?: () => void;
}

export default function QuickActionsMenu({
  onCreatePet,
  onViewHealth,
  onSchedulePlaydate,
  onSavedSearches,
  onGenerateProfiles,
  onViewStats,
  onViewMap,
}: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: <PawPrint size={20} weight="fill" />,
      label: 'Add Pet',
      onClick: () => {
        onCreatePet();
        setIsOpen(false);
      },
      color: 'from-primary to-accent',
    },
    {
      icon: <Heart size={20} weight="fill" />,
      label: 'Health',
      onClick: () => {
        onViewHealth();
        setIsOpen(false);
      },
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: <Calendar size={20} weight="fill" />,
      label: 'Schedule',
      onClick: () => {
        onSchedulePlaydate();
        setIsOpen(false);
      },
      color: 'from-blue-500 to-cyan-500',
    },
    ...(onViewMap
      ? [
          {
            icon: <MapTrifold size={20} weight="fill" />,
            label: 'Map',
            onClick: () => {
              onViewMap();
              setIsOpen(false);
            },
            color: 'from-teal-500 to-cyan-500',
          },
        ]
      : []),
    {
      icon: <BookmarkSimple size={20} weight="fill" />,
      label: 'Saved',
      onClick: () => {
        onSavedSearches();
        setIsOpen(false);
      },
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: <Sparkle size={20} weight="fill" />,
      label: 'Generate',
      onClick: () => {
        onGenerateProfiles();
        setIsOpen(false);
      },
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <ChartBar size={20} weight="fill" />,
      label: 'Stats',
      onClick: () => {
        onViewStats();
        setIsOpen(false);
      },
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const handleToggle = () => {
    haptics.light();
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <Presence visible={isOpen}>
        <MotionView
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="flex flex-col gap-3 mb-4"
        >
          {actions.map((action, index) => {
            const itemOpacity = useSharedValue(0);
            const itemX = useSharedValue(50);
            const itemScale = useSharedValue(0.8);
            const hoverScale = useSharedValue(1);
            const hoverX = useSharedValue(0);

            React.useEffect(() => {
              const delay = index * 50;
              setTimeout(() => {
                itemOpacity.value = withSpring(1, { stiffness: 500, damping: 30 });
                itemX.value = withSpring(0, { stiffness: 500, damping: 30 });
                itemScale.value = withSpring(1, { stiffness: 500, damping: 30 });
              }, delay);
            }, []);

            const handleMouseEnter = React.useCallback(() => {
              hoverScale.value = withTiming(1.1, { duration: 200 });
              hoverX.value = withTiming(-5, { duration: 200 });
            }, []);

            const handleMouseLeave = React.useCallback(() => {
              hoverScale.value = withTiming(1, { duration: 200 });
              hoverX.value = withTiming(0, { duration: 200 });
            }, []);

            const animatedStyle = useAnimatedStyle(() => ({
              opacity: itemOpacity.value,
              transform: [
                { translateX: itemX.value + hoverX.value },
                { scale: itemScale.value * hoverScale.value },
              ],
            }));

            return (
              <MotionView
                key={action.label}
                animatedStyle={animatedStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => {
                  haptics.selection();
                  action.onClick();
                }}
                className="group flex items-center gap-3 bg-card/95 backdrop-blur-md border border-border rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-full bg-linear-to-br ${action.color} flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow`}
                >
                  {action.icon}
                </div>
                <span className="font-medium text-sm pr-2">{action.label}</span>
              </MotionView>
            );
          })}
        </MotionView>
      </Presence>

      <MotionView
        onClick={handleToggle}
        className={`w-14 h-14 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white shadow-2xl hover:shadow-primary/50 transition-all ${
          isOpen ? 'rotate-45' : ''
        }`}
        style={{ transition: 'transform 0.3s ease' }}
      >
        <Presence visible={!isOpen}>
          <MotionView
            key="open"
            initial={{ opacity: 0, rotate: 90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: -90 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={24} weight="bold" />
          </MotionView>
        </Presence>
        <Presence visible={isOpen}>
          <MotionView
            key="close"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <X size={24} weight="bold" />
          </MotionView>
        </Presence>
      </MotionView>

      <Presence visible={isOpen}>
        <MotionView
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleToggle}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
        />
      </Presence>
    </div>
  );
}
