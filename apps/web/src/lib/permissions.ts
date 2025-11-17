import { createLogger } from './logger';
import type { ExtendedPermissionDescriptor } from './types/performance-api';

const logger = createLogger('Permissions');

export type PermissionType = 'camera' | 'microphone' | 'location' | 'notifications' | 'storage';

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  permanent: boolean;
}

export interface PermissionRequest {
  type: PermissionType;
  rationale: {
    en: string;
    bg: string;
  };
  onGrant?: () => void;
  onDeny?: () => void;
}

class PermissionsManager {
  async checkPermission(type: PermissionType): Promise<PermissionStatus> {
    switch (type) {
      case 'camera':
        return this.checkMediaPermission('camera');
      case 'microphone':
        return this.checkMediaPermission('microphone');
      case 'location':
        return this.checkLocationPermission();
      case 'notifications':
        return this.checkNotificationPermission();
      case 'storage':
        return this.checkStoragePermission();
      default:
        return { granted: false, denied: false, prompt: true, permanent: false };
    }
  }

  private async checkMediaPermission(kind: 'camera' | 'microphone'): Promise<PermissionStatus> {
    try {
      const permissionName = kind === 'camera' ? 'camera' : 'microphone';
      const descriptor: ExtendedPermissionDescriptor = { name: permissionName };
      // Type assertion needed because ExtendedPermissionDescriptor uses non-standard permission names
      const result = await navigator.permissions.query(descriptor as PermissionDescriptor);

      return {
        granted: result.state === 'granted',
        denied: result.state === 'denied',
        prompt: result.state === 'prompt',
        permanent: result.state === 'denied',
      };
    } catch {
      return { granted: false, denied: false, prompt: true, permanent: false };
    }
  }

  private async checkLocationPermission(): Promise<PermissionStatus> {
    if (!('geolocation' in navigator)) {
      return { granted: false, denied: true, prompt: false, permanent: true };
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return {
        granted: result.state === 'granted',
        denied: result.state === 'denied',
        prompt: result.state === 'prompt',
        permanent: result.state === 'denied',
      };
    } catch {
      return { granted: false, denied: false, prompt: true, permanent: false };
    }
  }

  private checkNotificationPermission(): PermissionStatus {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, prompt: false, permanent: true };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      prompt: permission === 'default',
      permanent: permission === 'denied',
    };
  }

  private async checkStoragePermission(): Promise<PermissionStatus> {
    try {
      const descriptor: ExtendedPermissionDescriptor = { name: 'persistent-storage' };
      // Type assertion needed because ExtendedPermissionDescriptor uses non-standard permission names
      const result = await navigator.permissions.query(descriptor as PermissionDescriptor);
      return {
        granted: result.state === 'granted',
        denied: result.state === 'denied',
        prompt: result.state === 'prompt',
        permanent: false,
      };
    } catch {
      return { granted: true, denied: false, prompt: false, permanent: false };
    }
  }

  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      logger.error(
        'Camera permission denied',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      logger.error(
        'Microphone permission denied',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  async requestLocationPermission(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => { resolve(true); },
        () => { resolve(false); },
        { timeout: 10000 }
      );
    });
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      logger.error(
        'Notification permission denied',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  async requestPermissionWithRationale(
    request: PermissionRequest,
    language: 'en' | 'bg' = 'en'
  ): Promise<boolean> {
    const status = await this.checkPermission(request.type);

    if (status.granted) {
      request.onGrant?.();
      return true;
    }

    if (status.permanent) {
      request.onDeny?.();
      return false;
    }

    const rationale = request.rationale[language];
    const proceed = confirm(rationale);

    if (!proceed) {
      request.onDeny?.();
      return false;
    }

    let granted = false;
    switch (request.type) {
      case 'camera':
        granted = await this.requestCameraPermission();
        break;
      case 'microphone':
        granted = await this.requestMicrophonePermission();
        break;
      case 'location':
        granted = await this.requestLocationPermission();
        break;
      case 'notifications':
        granted = await this.requestNotificationPermission();
        break;
      case 'storage':
        granted = true;
        break;
    }

    if (granted) {
      request.onGrant?.();
    } else {
      request.onDeny?.();
    }

    return granted;
  }

  getPermissionEducationMessage(type: PermissionType, language: 'en' | 'bg' = 'en'): string {
    const messages = {
      camera: {
        en: 'Camera access is needed to take photos of your pet. You can enable it in your browser settings.',
        bg: 'Необходим е достъп до камерата, за да правите снимки на вашия любимец. Можете да го активирате в настройките на браузъра.',
      },
      microphone: {
        en: 'Microphone access is needed for voice messages. You can enable it in your browser settings.',
        bg: 'Необходим е достъп до микрофона за гласови съобщения. Можете да го активирате в настройките на браузъра.',
      },
      location: {
        en: 'Location access helps you find pets nearby. You can enable it in your browser settings.',
        bg: 'Достъпът до местоположението ви помага да намирате любимци наблизо. Можете да го активирате в настройките на браузъра.',
      },
      notifications: {
        en: 'Notifications help you stay updated on matches and messages. You can enable them in your browser settings.',
        bg: 'Известията ви помагат да сте информирани за съвпадения и съобщения. Можете да ги активирате в настройките на браузъра.',
      },
      storage: {
        en: 'Storage access is needed to save your data. This should be enabled by default.',
        bg: 'Необходим е достъп до хранилището за запазване на вашите данни. Това трябва да бъде активирано по подразбиране.',
      },
    };

    return messages[type][language];
  }
}

export const permissionsManager = new PermissionsManager();

export const PERMISSION_RATIONALES = {
  camera: {
    en: 'PawfectMatch needs camera access to let you take photos of your pet for their profile.',
    bg: 'PawfectMatch се нуждае от достъп до камерата, за да можете да правите снимки на вашия любимец за профила му.',
  },
  microphone: {
    en: 'PawfectMatch needs microphone access to let you send voice messages to your matches.',
    bg: 'PawfectMatch се нуждае от достъп до микрофона, за да можете да изпращате гласови съобщения на вашите съвпадения.',
  },
  location: {
    en: 'PawfectMatch uses your approximate location to show you pets nearby. Your exact location is never shared.',
    bg: 'PawfectMatch използва вашето приблизително местоположение, за да ви покаже любимци наблизо. Точното ви местоположение никога не се споделя.',
  },
  notifications: {
    en: 'Get notified when you have new matches and messages from other pet owners.',
    bg: 'Получавайте известия, когато имате нови съвпадения и съобщения от други собственици на любимци.',
  },
  storage: {
    en: 'PawfectMatch needs storage access to save your preferences and data.',
    bg: 'PawfectMatch се нуждае от достъп до хранилището, за да запазва вашите предпочитания и данни.',
  },
};
