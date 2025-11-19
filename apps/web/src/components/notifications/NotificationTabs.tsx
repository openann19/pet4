import React, {
  useCallback
  useEffect
  useId
  useLayoutEffect
  useMemo
  useRef
  useState
} from 'react';
import { isTruthy } from '@petspark/shared';

type Locale = 'en' | 'bg';

export type TabKey = 'all' | 'matches' | 'messages' | (string & {});

type UnreadCounts = Record<TabKey, number | undefined>;

interface Segment {
  key: TabKey;
  label: { en: string; bg: string };
  badge?: number;
}

interface SocketPayload {
  type?: string;
  counts?: Record<string, number | undefined>;
  [key: string]: unknown;
}

interface SocketLike {
  on: (event: string, cb: (payload: SocketPayload) => void) => void;
  off: (event: string, cb: (payload: SocketPayload) => void) => void;
}

export interface NotificationTabsProps {
  locale?: Locale;
  segments?: Segment[];
  unread?: UnreadCounts; // initial counts (will live-update via socket if provided)
  onTabChange?: (from: TabKey, to: TabKey) => void; // analytics hook
  onRequestClose?: () => void; // called on downward swipe (mobile sheet)
  renderPanel: (key: TabKey) => React.ReactNode; // render content per tab
  storageKey?: string; // localStorage key for persistence
  socket?: SocketLike; // to receive unread updates {type:"unread:update", counts:{...}}
  edgeFade?: boolean; // gradient edge fade for overflow tablist
  className?: string; // outer container class override
  ariaLabel?: string; // tablist label for a11y
}

// ---------- Utilities ----------

const cx = (...v: (string | false | null | undefined)[]) => v.filter(Boolean).join(' ');
const isBrowser = typeof window !== 'undefined';

function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    if (!isBrowser) return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal] as const;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (!isBrowser || !window.matchMedia) return;
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(!!m.matches);
    update();
    m.addEventListener?.('change', update);
    return () => m.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

// Minimal swipe detector for touch/pointer
function useSwipe(
  ref: React.RefObject<HTMLElement>,
  opts: { onLeft?: () => void; onRight?: () => void; onDown?: () => void; threshold?: number } = {}
) {
  const start = useRef<{ x: number; y: number; time: number } | null>(null);
  const threshold = opts.threshold ?? 24;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
      start.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      const adx = Math.abs(dx),
        ady = Math.abs(dy);
      const dt = Date.now() - start.current.time;
      start.current = null;

      // Prefer the dominant axis
      if (adx > ady && adx >= threshold && dt < 800) {
        if (dx < 0) opts.onLeft?.();
        else opts.onRight?.();
      } else if (ady >= threshold && dt < 800 && dy > 0) {
        // downward swipe to close
        opts.onDown?.();
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
    };
  }, [ref, opts.onLeft, opts.onRight, opts.onDown, threshold]);
}

// Format badge with cap at 9+ and localized number (tooltip carries exact)
function formatBadge(count: number | undefined, locale: Locale) {
  if (!count || count <= 0) return null;
  if (count > 9) return { display: '9+', title: new Intl.NumberFormat(locale).format(count) };
  return {
    display: new Intl.NumberFormat(locale).format(count),
    title: new Intl.NumberFormat(locale).format(count),
  };
}

// ---------- Defaults ----------

const DEFAULT_SEGMENTS: Segment[] = [
  { key: 'all', label: { en: 'All', bg: 'Всички' } },
  { key: 'matches', label: { en: 'Matches', bg: 'Съвпадения' } },
  { key: 'messages', label: { en: 'Messages', bg: 'Съобщения' } },
];

// ---------- Component ----------

export function NotificationTabs({
  locale = 'en',
  segments: providedSegments,
  unread,
  onTabChange,
  onRequestClose,
  renderPanel,
  storageKey = 'notifications:lastTab',
  socket,
  edgeFade = true,
  className,
  ariaLabel,
}: NotificationTabsProps) {
  const segments = useMemo(
    () => (providedSegments?.length ? providedSegments : DEFAULT_SEGMENTS),
    [providedSegments]
  );

  const [counts, setCounts] = useState<UnreadCounts>(() => unread ?? ({} as UnreadCounts));
  useEffect(() => {
    if (unread) setCounts(unread);
  }, [unread]);

  // Live updates from socket
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: SocketPayload) => {
      if (
        payload?.type === 'unread:update' &&
        payload?.counts &&
        typeof payload.counts === 'object'
      ) {
        setCounts((prev) => ({ ...prev, ...payload.counts }));
      }
    };
    socket.on('notifications', handler);
    return () => socket.off('notifications', handler);
  }, [socket]);

  const [selected, setSelected] = useLocalStorage<TabKey>(storageKey, segments[0]?.key ?? 'all');
  // Ensure selected is a valid key even if segments changed
  useEffect(() => {
    if (!segments.find((s) => s.key === selected)) {
      const firstSegment = segments[0];
      if (firstSegment) {
        setSelected(firstSegment.key);
      }
    }
  }, [segments, selected, setSelected]);

  // a11y ids
  const baseId = useId();
  const idForTab = (k: TabKey) => `${String(baseId ?? '')}-tab-${String(k ?? '')}`;
  const idForPanel = (k: TabKey) => `${String(baseId ?? '')}-panel-${String(k ?? '')}`;

  // Roving tabindex for keyboard
  const [focusIndex, setFocusIndex] = useState(() =>
    Math.max(
      0,
      segments.findIndex((s) => s.key === selected)
    )
  );
  useEffect(
    () =>
      setFocusIndex(
        Math.max(
          0,
          segments.findIndex((s) => s.key === selected)
        )
      ),
    [segments, selected]
  );

  // Indicator bar follows selected pill (transform only)
  const tablistRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const labelFor = useCallback(
    (key: TabKey) => {
      const seg = segments.find((s) => s.key === key);
      if (!seg) return '';
      return seg.label[locale] ?? seg.label.en;
    },
    [segments, locale]
  );

  const activate = useCallback(
    (key: TabKey) => {
      if (key === selected) return;
      const from = selected;
      setSelected(key);
      onTabChange?.(from, key);
      // announce politely
      const label = labelFor(key);
      setAnnounceMsg(locale === 'bg' ? `Преминахте към ${label}` : `Switched to ${label}`);
    },
    [selected, setSelected, onTabChange, locale, labelFor]
  );

  const step = useCallback(
    (delta: number) => {
      const idx = segments.findIndex((s) => s.key === selected);
      const next = Math.min(segments.length - 1, Math.max(0, idx + delta));
      if (next !== idx) {
        const nextSegment = segments[next];
        if (nextSegment) {
          activate(nextSegment.key);
        }
      }
    },
    [segments, selected, activate]
  );

  const updateIndicator = useCallback(() => {
    if (!tablistRef.current || !indicatorRef.current) return;
    const container = tablistRef.current;
    const active = container.querySelector<HTMLButtonElement>(
      `button[role="tab"][data-key="${selected}"]`
    );
    if (!active) return;

    const aRect = active.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const x = aRect.left - cRect.left + container.scrollLeft;
    const w = aRect.width;

    indicatorRef.current.style.transform = `translateX(${String(x ?? '')}px)`;
    indicatorRef.current.style.width = `${String(w ?? '')}px`;
  }, [selected]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, segments.length]);

  useEffect(() => {
    const c = tablistRef.current;
    if (!c) return;
    const ResizeObserverConstructor =
      typeof window !== 'undefined' && 'ResizeObserver' in window ? window.ResizeObserver : null;
    let ro: ResizeObserver | null = null;
    if (isTruthy(ResizeObserverConstructor)) {
      ro = new ResizeObserverConstructor(() => { updateIndicator(); });
      ro.observe(c);
    }
    const onScroll = () => updateIndicator();
    c.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      ro?.disconnect();
      c.removeEventListener('scroll', onScroll);
    };
  }, [updateIndicator]);

  // Swipe between tabs + down to close
  const shellRef = useRef<HTMLDivElement>(null);
  const handleSwipeLeft = useCallback(() => { step(1); }, [step]);
  const handleSwipeRight = useCallback(() => { step(-1); }, [step]);
  const handleSwipeDown = useCallback(() => onRequestClose?.(), [onRequestClose]);
  useSwipe(shellRef as React.RefObject<HTMLElement>, {
    onLeft: handleSwipeLeft,
    onRight: handleSwipeRight,
    onDown: handleSwipeDown,
  });

  // keyboard navigation
  const onKeyDownTab = (e: React.KeyboardEvent, index: number) => {
    const last = segments.length - 1;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusIndex(index === last ? 0 : index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusIndex(index === 0 ? last : index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusIndex(last);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const focusSegment = segments[focusIndex];
      if (focusSegment) {
        activate(focusSegment.key);
      }
    }
  };

  useEffect(() => {
    // keep focused tab in view when roving
    const tabs = tablistRef.current?.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
    if (!tabs || focusIndex < 0 || focusIndex >= tabs.length) return;
    const el = tabs[focusIndex];
    if (!el) return;
    el.focus();
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }, [focusIndex]);

  // Announcement live region
  const [announceMsg, setAnnounceMsg] = useState<string>('');

  // Edge fade visibility (only if overflow)
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const el = tablistRef.current;
    if (!el) return;
    const calc = () => { setOverflowing(el.scrollWidth > el.clientWidth + 2); };
    calc();
    const ResizeObserverConstructor =
      typeof window !== 'undefined' && 'ResizeObserver' in window ? window.ResizeObserver : null;
    let ro: ResizeObserver | null = null;
    if (isTruthy(ResizeObserverConstructor)) {
      ro = new ResizeObserverConstructor(calc);
      ro.observe(el);
    }
    const onScroll = () => calc();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      ro?.disconnect();
      el.removeEventListener('scroll', onScroll);
    };
  }, [segments.length]);

  return (
    <div
      ref={shellRef}
      className={cx('w-full flex flex-col', className)}
      data-testid="notification-tabs"
    >
      {/* Tablist */}
      <div className="relative">
        {/* gradient fades */}
        {edgeFade && overflowing && (
          <>
            <div
              className="pointer-events-none absolute left-0 top-0 h-12 w-6 bg-linear-to-r from-[--tablist-fade] to-transparent rounded-s-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-0 top-0 h-12 w-6 bg-linear-to-l from-[--tablist-fade] to-transparent rounded-e-2xl"
              aria-hidden
            />
          </>
        )}
        <div
          ref={tablistRef}
          role="tablist"
          aria-label={
            ariaLabel ?? (locale === 'bg' ? 'Сегменти известия' : 'Notification segments')
          }
          className={cx(
            'relative flex gap-1 overflow-x-auto no-scrollbar px-1 py-1 rounded-2xl',
            'min-h-[3rem] items-center',
            'bg-[--tabs-bg,--theme(--color-gray-100/0.5)] dark:bg-[--tabs-bg,--theme(--color-gray-800/0.5)]',
            'backdrop-blur supports-backdrop-filter:backdrop-blur-md'
          )}
          style={
            {
              // Themeable tokens with safe fallbacks
              '--tablist-fade': 'rgb(0 0 0 / 0.12)',
            } as React.CSSProperties & { '--tablist-fade'?: string }
          }
        >
          {/* indicator bar */}
          <div
            ref={indicatorRef}
            aria-hidden
            className={cx(
              'absolute bottom-0 h-1 rounded-full w-0 translate-x-0',
              reducedMotion ? 'transition-none' : 'transition-transform duration-200',                                                                          
              'bg-[--tabs-indicator,var(--color-blue-500)]'
            )}
          />
          {segments.map((seg, i) => {
            const k = seg.key;
            const selectedBool = selected === k;
            const label = seg.label[locale] ?? seg.label.en;
            const badgeData = formatBadge(counts[k] ?? seg.badge, locale);
            return (
              <button
                key={k}
                role="tab"
                id={idForTab(k)}
                data-key={k}
                aria-selected={selectedBool}
                aria-controls={idForPanel(k)}
                tabIndex={selectedBool ? 0 : -1}
                onClick={() => { activate(k); }}
                onKeyDown={(e) => { onKeyDownTab(e, i); }}
                className={cx(
                  'relative select-none whitespace-nowrap',
                  'px-3 h-10 min-w-11 min-h-11',
                  'rounded-full border',
                  selectedBool
                    ? 'bg-[--tab-active-bg,var(--color-gray-900)] text-[--tab-active-fg,var(--color-white)] dark:bg-[--tab-active-bg,var(--color-gray-100)] dark:text-[--tab-active-fg,var(--color-black)] border-transparent'
                    : 'bg-[--tab-bg,--theme(--color-white/0.6)] dark:bg-[--tab-bg,--theme(--color-gray-900/0.6)] text-[--tab-fg,var(--color-gray-700)] dark:text-[--tab-fg,var(--color-gray-200)] border-[--tab-border,--theme(--color-black/0.05)]',
                  'hover:brightness-105',
                  'focus:outline-none focus-visible:ring-2 ring-offset-2 ring-[--focus-ring,var(--color-blue-500)] ring-offset-[--tabs-bg,transparent]',
                  reducedMotion ? 'transition-none' : 'transition-[transform,filter] duration-150',
                  'will-change-transform',
                  'shadow-[inset_0_0_0_1px_rgb(255_255_255_/0.04)] dark:shadow-[inset_0_0_0_1px_rgb(0_0_0_/0.2)]'
                )}
                style={{ touchAction: 'pan-y' }} // keep horizontal swipe smooth
              >
                <span className="inline-flex items-center gap-2">
                  <span className="max-w-[10ch] truncate" title={label}>
                    {label}
                  </span>
                  {badgeData && (
                    <span
                      className={cx(
                        'inline-flex items-center justify-center text-xs leading-none',
                        'min-w-5 h-5 px-1 rounded-full',
                        selectedBool
                          ? 'bg-[--badge-active-bg,var(--color-white)] text-[--badge-active-fg,var(--color-black)]'
                          : 'bg-[--badge-bg,var(--color-gray-200)] dark:bg-[--badge-bg,var(--color-gray-700)] text-[--badge-fg,var(--color-gray-900)] dark:text-[--badge-fg,var(--color-gray-100)]'
                      )}
                      title={badgeData.title}
                      aria-label={
                        locale === 'bg'
                          ? `непрочетени ${badgeData.title}`
                          : `unread ${badgeData.title}`
                      }
                    >
                      {badgeData.display}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live region for polite announcements */}
      <div aria-live="polite" className="sr-only">
        {announceMsg}
      </div>

      {/* Panels */}
      <div className="mt-3">
        {segments.map((seg) => {
          const active = seg.key === selected;
          return (
            <div
              key={seg.key}
              id={idForPanel(seg.key)}
              role="tabpanel"
              aria-labelledby={idForTab(seg.key)}
              hidden={!active}
              className={cx(
                reducedMotion ? 'transition-none' : 'transition-opacity duration-200',
                active ? 'opacity-100' : 'opacity-0'
              )}
            >
              {renderPanel(seg.key)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
