/**
 * Mobile App Translations
 *
 * Centralized translations for the mobile app
 */

export interface Translations {
  home: {
    title: string
    description: string
    adoption: {
      title: string
      subtitle: string
      canEditActiveListing: string
      acceptingApplications: string
    }
    community: {
      title: string
      subtitle: string
      pendingPostsEditable: string
      commentsOnLivePosts: string
    }
    matching: {
      title: string
      subtitle: string
      hardGates: string
      weightedScore: string
    }
    footer: string
  }
  adopt: {
    title: string
    description: string
    marketplace: {
      title: string
      comingSoon: string
    }
  }
  adoption: {
    title: string
    description: string
    listing: {
      status: string
      ownerCanEdit: string
      applicationsAccepted: string
    }
    transitions: {
      listing: string
      application: string
      permitted: string
      blocked: string
    }
    noData: string
  }
  community: {
    title: string
    description: string
    moderation: {
      title: string
      pendingPostsEditable: string
      commentsOnActivePosts: string
    }
    transitions: {
      post: string
      comment: string
      permitted: string
      blocked: string
    }
  }
  common: {
    loading: string
    error: string
    retry: string
    yes: string
    no: string
    enabled: string
    paused: string
    allowed: string
    locked: string
    open: string
    closed: string
    allClear: string
    requiresReview: string
  }
  chat: {
    title: string
    callButton: string
    offlineMessage: string
    failedToStartCall: string
    failedToEndCall: string
    failedToAcceptCall: string
    failedToDeclineCall: string
  }
  feed: {
    title: string
    description: string
    discover: string
    map: string
    loading: string
    retry: string
    failedToLoadPets: string
    noPetsFound: string
    yearsOld: string
    species: string
    photos: string
    mapNotInstalled: string
    mapInstallHint: string
  }
  profile: {
    title: string
    description: string
    lifeStage: string
    intents: string
    kyc: string
    kycVerified: string
    kycPending: string
    vetDocs: string
    vetVerified: string
    vetMissing: string
    noValue: string
  }
  matches: {
    title: string
    description: string
    today: string
    noMatches: string
    callMatch: string
    failedToStartCall: string
    failedToEndCall: string
    failedToAcceptCall: string
    failedToDeclineCall: string
  }
  matching: {
    title: string
    loading: string
    error: string
    errorMessage: string
  }
  effectsPlayground: {
    title: string
    description: string
    settings: string
    accessibility: string
    reducedMotion: string
    sendWarp: string
    sendWarpSubtitle: string
    triggerSend: string
    mediaZoom: string
    mediaZoomSubtitle: string
    open: string
    close: string
    replyRibbon: string
    replyRibbonSubtitle: string
    animateRibbon: string
    resetAll: string
  }
}

const enTranslations: Translations = {
  home: {
    title: 'PetSpark Mobile Readiness',
    description: 'Key slices from the shared domain layer rendered with native-first components.',
    adoption: {
      title: 'Adoption',
      subtitle: 'Marketplace governance and workflows',
      canEditActiveListing: 'Active listings can be edited:',
      acceptingApplications: 'Accepting new applications:',
    },
    community: {
      title: 'Community',
      subtitle: 'Engagement guardrails',
      pendingPostsEditable: 'Pending posts editable:',
      commentsOnLivePosts: 'Comments on live posts:',
    },
    matching: {
      title: 'Matching',
      subtitle: 'Signal-driven pairing',
      hardGates: 'Hard gates:',
      weightedScore: 'Weighted score:',
    },
    footer: 'Navigation routes map directly to production domain slices, keeping parity with the web surface.',
  },
  adopt: {
    title: 'Adopt',
    description: 'Browse and apply for adoptions.',
    marketplace: {
      title: 'Marketplace',
      comingSoon: 'Listings and filters coming soon.',
    },
  },
  adoption: {
    title: 'Adoption domain parity',
    description: 'Shared rules ensure that marketplace moderation behaves consistently across platforms.',
    listing: {
      status: 'Status: active',
      ownerCanEdit: 'Owner can edit:',
      applicationsAccepted: 'Applications accepted:',
    },
    transitions: {
      listing: 'Allowed listing transitions',
      application: 'Application workflow',
      permitted: 'permitted',
      blocked: 'blocked',
    },
    noData: 'No pet data available',
  },
  community: {
    title: 'Community safety rails',
    description: 'Moderation and engagement policies mirrored from the web app ensure identical enforcement.',
    moderation: {
      title: 'Post moderation',
      pendingPostsEditable: 'Pending posts can be edited:',
      commentsOnActivePosts: 'Comments allowed on active posts:',
    },
    transitions: {
      post: 'Post transitions',
      comment: 'Comment transitions',
      permitted: 'permitted',
      blocked: 'blocked',
    },
  },
  common: {
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    yes: 'Yes',
    no: 'No',
    enabled: 'Enabled',
    paused: 'Paused',
    allowed: 'Allowed',
    locked: 'Locked',
    open: 'Open',
    closed: 'Closed',
    allClear: 'All clear',
    requiresReview: 'Requires review',
  },
  chat: {
    title: 'Chat',
    callButton: 'Call',
    offlineMessage: 'You are offline. Please check your connection.',
    failedToStartCall: 'Failed to start call',
    failedToEndCall: 'Failed to end call',
    failedToAcceptCall: 'Failed to accept call',
    failedToDeclineCall: 'Failed to decline call',
  },
  feed: {
    title: 'Discover',
    description: 'Browse nearby pets or switch to map view.',
    discover: 'Discover',
    map: 'Map',
    mapNotInstalled: 'Map module not installed',
    mapInstallHint: 'Install react-native-maps to enable the live map view.',
    failedToLoadPets: 'Failed to load pets',
    retry: 'Retry',
    loading: 'Loading...',
    noPetsFound: 'No pets found',
    species: 'Species',
    photos: 'Photos',
    yearsOld: 'years old',
  },
  profile: {
    title: 'Operator overview',
    description: 'Snapshot of mobile-ready records pulled directly from the shared domain schema.',
    lifeStage: 'Life stage',
    intents: 'Intents',
    kyc: 'KYC',
    kycVerified: 'verified',
    kycPending: 'pending',
    vetDocs: 'Vet docs',
    vetVerified: 'verified',
    vetMissing: 'missing',
    noValue: '—',
  },
  matches: {
    title: 'Matches',
    description: 'Signal-driven pairing results.',
    today: 'Today',
    noMatches: 'Your latest matches will show here.',
    callMatch: 'Call Match',
    failedToStartCall: 'Failed to start call',
    failedToEndCall: 'Failed to end call',
    failedToAcceptCall: 'Failed to accept call',
    failedToDeclineCall: 'Failed to decline call',
  },
  matching: {
    title: 'Matching',
    loading: 'Loading pets...',
    error: 'Error loading pets',
    errorMessage: 'Error loading pets. Please try again.',
  },
  effectsPlayground: {
    title: 'Effects Playground',
    description: 'Interactive demos for Skia effects with timing controls.',
    settings: 'Settings',
    accessibility: 'Accessibility',
    reducedMotion: 'Reduced Motion',
    sendWarp: 'Send Warp',
    sendWarpSubtitle: 'AdditiveBloom glow trail',
    triggerSend: 'Trigger Send',
    mediaZoom: 'Media Zoom',
    mediaZoomSubtitle: 'ChromaticAberrationFX on open',
    open: 'Open',
    close: 'Close',
    replyRibbon: 'Reply Ribbon',
    replyRibbonSubtitle: 'RibbonFX for swipe-to-reply',
    animateRibbon: 'Animate Ribbon',
    resetAll: 'Reset All',
  },
}

const bgTranslations: Translations = {
  home: {
    title: 'PetSpark Mobile Readiness',
    description: 'Ключови срезове от споделения домейн слой, визуализирани с нативни компоненти.',
    adoption: {
      title: 'Осиновяване',
      subtitle: 'Управление на пазара и работни процеси',
      canEditActiveListing: 'Активните обяви могат да се редактират:',
      acceptingApplications: 'Приемане на нови заявления:',
    },
    community: {
      title: 'Общност',
      subtitle: 'Ограничения за ангажиране',
      pendingPostsEditable: 'Изчакващите публикации могат да се редактират:',
      commentsOnLivePosts: 'Коментари към активни публикации:',
    },
    matching: {
      title: 'Съвпадение',
      subtitle: 'Съвпадения базирани на сигнали',
      hardGates: 'Строги ограничения:',
      weightedScore: 'Претеглена оценка:',
    },
    footer: 'Маршрутите за навигация се съпоставят директно с производствените домейн срезове, запазвайки паритет с уеб повърхността.',
  },
  adopt: {
    title: 'Осиновяване',
    description: 'Преглеждайте и кандидатствайте за осиновявания.',
    marketplace: {
      title: 'Пазар',
      comingSoon: 'Обявите и филтрите идват скоро.',
    },
  },
  adoption: {
    title: 'Паритет на домейна за осиновяване',
    description: 'Споделените правила гарантират, че модерацията на пазара се държи последователно на всички платформи.',
    listing: {
      status: 'Статус: активен',
      ownerCanEdit: 'Собственикът може да редактира:',
      applicationsAccepted: 'Приемат се заявления:',
    },
    transitions: {
      listing: 'Разрешени преходи на обяви',
      application: 'Работен процес за заявления',
      permitted: 'разрешено',
      blocked: 'блокирано',
    },
    noData: 'Няма налични данни за домашни любимци',
  },
  community: {
    title: 'Предпазни мерки за общността',
    description: 'Политиките за модерация и ангажираност, отразени от уеб приложението, осигуряват идентично прилагане.',
    moderation: {
      title: 'Модерация на публикации',
      pendingPostsEditable: 'Изчакващите публикации могат да се редактират:',
      commentsOnActivePosts: 'Коментарите са разрешени при активни публикации:',
    },
    transitions: {
      post: 'Преходи на публикации',
      comment: 'Преходи на коментари',
      permitted: 'разрешено',
      blocked: 'блокирано',
    },
  },
  common: {
    loading: 'Зареждане...',
    error: 'Грешка',
    retry: 'Опитай отново',
    yes: 'Да',
    no: 'Не',
    enabled: 'Активирано',
    paused: 'Пауза',
    allowed: 'Разрешено',
    locked: 'Заключено',
    open: 'Отворено',
    closed: 'Затворено',
    allClear: 'Всичко е наред',
    requiresReview: 'Изисква преглед',
  },
  chat: {
    title: 'Чат',
    callButton: 'Обаждане',
    offlineMessage: 'Вие сте офлайн. Моля, проверете връзката си.',
    failedToStartCall: 'Неуспешно стартиране на обаждане',
    failedToEndCall: 'Неуспешно приключване на обаждане',
    failedToAcceptCall: 'Неуспешно приемане на обаждане',
    failedToDeclineCall: 'Неуспешно отказване на обаждане',
  },
  feed: {
    title: 'Откриване',
    description: 'Преглеждайте близки домашни любимци или превключвайте към карта.',
    discover: 'Откриване',
    map: 'Карта',
    mapNotInstalled: 'Модулът за карта не е инсталиран',
    mapInstallHint: 'Инсталирайте react-native-maps, за да активирате живата карта.',
    failedToLoadPets: 'Неуспешно зареждане на домашни любимци',
    retry: 'Опитай отново',
    loading: 'Зареждане...',
    noPetsFound: 'Няма намерени домашни любимци',
    species: 'Вид',
    photos: 'Снимки',
    yearsOld: 'години',
  },
  profile: {
    title: 'Преглед на оператор',
    description: 'Снимка на мобилни записи, изтеглени директно от споделената домейн схема.',
    lifeStage: 'Жизнен етап',
    intents: 'Намерения',
    kyc: 'KYC',
    kycVerified: 'потвърдено',
    kycPending: 'чакащо',
    vetDocs: 'Ветеринарни документи',
    vetVerified: 'потвърдено',
    vetMissing: 'липсва',
    noValue: '—',
  },
  matches: {
    title: 'Съвпадения',
    description: 'Резултати от съвпадения базирани на сигнали.',
    today: 'Днес',
    noMatches: 'Вашите най-нови съвпадения ще се покажат тук.',
    callMatch: 'Обаждане на съвпадение',
    failedToStartCall: 'Неуспешно стартиране на обаждане',
    failedToEndCall: 'Неуспешно приключване на обаждане',
    failedToAcceptCall: 'Неуспешно приемане на обаждане',
    failedToDeclineCall: 'Неуспешно отказване на обаждане',
  },
  matching: {
    title: 'Съвпадение',
    loading: 'Зареждане на домашни любимци...',
    error: 'Грешка при зареждане на домашни любимци',
    errorMessage: 'Грешка при зареждане на домашни любимци. Моля, опитайте отново.',
  },
  effectsPlayground: {
    title: 'Игрище за ефекти',
    description: 'Интерактивни демонстрации за Skia ефекти с контроли за времетраене.',
    settings: 'Настройки',
    accessibility: 'Достъпност',
    reducedMotion: 'Намалено движение',
    sendWarp: 'Send Warp',
    sendWarpSubtitle: 'AdditiveBloom светенещ след',
    triggerSend: 'Стартиране на изпращане',
    mediaZoom: 'Увеличаване на медия',
    mediaZoomSubtitle: 'ChromaticAberrationFX при отваряне',
    open: 'Отвори',
    close: 'Затвори',
    replyRibbon: 'Лента за отговор',
    replyRibbonSubtitle: 'RibbonFX за свайп за отговор',
    animateRibbon: 'Анимирай лента',
    resetAll: 'Нулирай всичко',
  },
}

export const translations: Record<string, Translations> = {
  en: enTranslations,
  bg: bgTranslations,
}

export function getTranslations(language: string = 'en'): Translations {
  const translation = translations[language]
  if (translation) {
    return translation
  }
  // Always return en translations as fallback
  return enTranslations
}
