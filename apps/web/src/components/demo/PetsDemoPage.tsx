'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  Heart,
  ChatCircleDots,
  ShareFat,
  DotsThreeVertical,
  ShieldCheck,
  MapPin,
} from '@phosphor-icons/react';
import { useApp } from '@/contexts/AppContext';

function applyVhFix(): void {
  const set = (): void => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  };
  set();
  addEventListener('resize', set);
  addEventListener('orientationchange', set);
}

interface Pet {
  id: string;
  name: string;
  kind: 'Dog' | 'Cat';
  breed: string;
  ageYears: number;
  sex: 'Female' | 'Male';
  distanceKm: number;
  tags: string[];
  bgUrl: string;
  avatarUrl: string;
  shelter: { name: string; verified: boolean };
  stats: { saves: number; messages: number };
}

const PETS: Pet[] = [
  {
    id: 'luna',
    name: 'Luna',
    kind: 'Dog',
    breed: 'Golden Retriever',
    ageYears: 3,
    sex: 'Female',
    distanceKm: 2.4,
    tags: ['Vaccinated', 'Good with kids', 'Leash trained'],
    bgUrl: '/demo/pets/luna.jpg',
    avatarUrl: '/demo/pets/luna-avatar.jpg',
    shelter: { name: 'Sunny Paws Rescue', verified: true },
    stats: { saves: 1580, messages: 73 },
  },
  {
    id: 'milo',
    name: 'Milo',
    kind: 'Cat',
    breed: 'British Shorthair',
    ageYears: 2,
    sex: 'Male',
    distanceKm: 5.1,
    tags: ['Neutered', 'Indoor', 'Microchipped'],
    bgUrl: '/demo/pets/milo.jpg',
    avatarUrl: '/demo/pets/milo-avatar.jpg',
    shelter: { name: 'City Whiskers', verified: true },
    stats: { saves: 940, messages: 41 },
  },
  {
    id: 'max',
    name: 'Max',
    kind: 'Dog',
    breed: 'Mixed',
    ageYears: 4,
    sex: 'Male',
    distanceKm: 1.1,
    tags: ['House trained', 'Calm', 'Great with dogs'],
    bgUrl: '/demo/pets/max.jpg',
    avatarUrl: '/demo/pets/max-avatar.jpg',
    shelter: { name: 'Kind Tails', verified: true },
    stats: { saves: 2010, messages: 102 },
  },
];

const k = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `${n}`;

export default function PetsDemoPage(): ReactElement {
  const [petIdx, setPetIdx] = useState(0);
  const pet = useMemo(() => {
    const index = petIdx % PETS.length;
    const selectedPet = PETS[index];
    if (!selectedPet) {
      return PETS[0]!;
    }
    return selectedPet;
  }, [petIdx]);
  const { theme, toggleTheme, language, toggleLanguage } = useApp();
  const themeDark = theme === 'dark';
  const locale = language;

  useEffect(() => {
    applyVhFix();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeDark);
  }, [themeDark]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .glass { background-color: hsl(var(--card) / .60); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.10) }
      .hero-top { background: linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.28) 40%, rgba(0,0,0,0) 100%) }
      .hero-bottom { background: linear-gradient(0deg, rgba(0,0,0,.70) 0%, rgba(0,0,0,0) 52%) }
      .grad-brand { background-image: linear-gradient(90deg, hsl(var(--primary)) 0%, #ff52a8 45%, hsl(var(--accent)) 100%); }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  const t = useMemo(
    () => ({
      adopt: locale === 'bg' ? 'Осинови' : 'Adopt',
      messageShelter: locale === 'bg' ? 'Съобщение до приюта' : 'Message Shelter',
      nearby: locale === 'bg' ? 'Наблизо' : 'Nearby',
      foryou: locale === 'bg' ? 'За теб' : 'For you',
      rescues: locale === 'bg' ? 'Приюти' : 'Rescues',
      trending: locale === 'bg' ? 'Тенденции' : 'Trending',
      saved: locale === 'bg' ? 'Запазени' : 'Saved',
      verified: locale === 'bg' ? 'Верифициран приют' : 'Verified shelter',
      away: locale === 'bg' ? 'далеч' : 'away',
      years: locale === 'bg' ? 'г.' : 'yr',
    }),
    [locale]
  );

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.currentTarget as HTMLImageElement;
    if (target.src !== `${window.location.origin}/demo/gradient.jpg`) {
      target.src = '/demo/gradient.jpg';
    }
  };

  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.currentTarget as HTMLImageElement;
    const fallbackSrc = '/demo/pets/fallback-avatar.jpg';
    if (target.src !== `${window.location.origin}${fallbackSrc}`) {
      target.src = fallbackSrc;
    }
  };

  return (
    <div
      className="relative min-h-[calc(var(--vh)*100)] bg-bg text-fg overflow-hidden"
      style={{ minHeight: '100svh' }}
    >
      {/* background */}
      <img
        src={pet.bgUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-90"
        draggable={false}
        onError={handleImageError}
      />

      {/* top glass bar */}
      <header className="fixed top-0 inset-x-0 z-40">
        <div className="hero-top pointer-events-none h-20 w-full" />
        <div className="pointer-events-auto px-4 sm:px-6">
          <div className="glass h-12 mt-2 rounded-xl flex items-center justify-between px-3">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full grad-brand shadow-[0_0_24px_rgba(255,82,168,.35)]" />
              <span className="font-semibold bg-clip-text text-transparent grad-brand">
                PawfectMatch Premium
              </span>
            </div>

            {/* Segmented tabs (demo, not switching content here) */}
            <div className="hidden md:flex items-center gap-1 px-1 py-1 rounded-full glass">
              {[t.nearby, t.foryou, t.rescues, t.trending, t.saved].map((label, i) => (
                <button
                  key={label}
                  className={`h-9 px-4 rounded-full text-sm font-medium transition ${
                    i === 1
                      ? 'text-white grad-brand shadow-[0_0_24px_rgba(255,82,168,.35)]'
                      : 'text-white/70 hover:text-white/90 hover:bg-white/10'
                  }`}
                  aria-current={i === 1 ? 'page' : undefined}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                className="px-3 h-9 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm"
                onClick={() => toggleLanguage()}
                type="button"
              >
                EN/BG
              </button>
              <button
                className="px-3 h-9 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm"
                onClick={() => toggleTheme()}
                type="button"
              >
                Dark/Light
              </button>
              <button
                className="ml-1 h-9 px-4 rounded-full grad-brand text-white text-sm font-semibold shadow-[0_0_24px_rgba(255,82,168,.35)] hover:opacity-95"
                onClick={() => setPetIdx((p) => (p + 1) % PETS.length)}
                aria-label="Next pet"
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* left overlay content */}
      <section className="relative z-10">
        <div className="absolute top-28 left-6 md:left-10 max-w-xl text-white drop-shadow-lg space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={pet.avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full ring-2 ring-white/20"
              onError={handleAvatarError}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[16px]">{pet.name}</span>
                {pet.shelter.verified && (
                  <span className="inline-flex items-center gap-1 text-[12px] px-2 h-6 rounded-full bg-white/15">
                    <ShieldCheck size={14} /> {t.verified}
                  </span>
                )}
              </div>
              <div className="text-white/80 text-sm">
                {pet.kind} • {pet.breed}
              </div>
            </div>
          </div>

          <p className="text-white/90 max-w-lg text-[15px]">
            {pet.name} is a {pet.ageYears}
            {t.years} {pet.sex.toLowerCase()} looking for a loving home.
          </p>

          {/* facts + chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[12px] px-2 h-7 rounded-full glass">
              <MapPin size={14} /> {pet.distanceKm.toFixed(1)} km {t.away}
            </span>
            {pet.tags.map((tag) => (
              <span key={tag} className="text-[12px] px-2 h-7 rounded-full bg-white/12">
                {tag}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2 pt-1">
            <button
              className="h-9 px-4 rounded-full bg-cyan-500 text-white font-semibold hover:opacity-95"
              type="button"
            >
              {t.messageShelter}
            </button>
            <button
              className="h-9 px-4 rounded-full grad-brand text-white font-semibold shadow-[0_0_24px_rgba(255,82,168,.35)] hover:opacity-95"
              type="button"
            >
              {t.adopt}
            </button>
          </div>
        </div>
      </section>

      {/* right action rail */}
      <aside className="fixed right-3 md:right-6 bottom-[96px] md:bottom-6 z-30 flex flex-col items-center gap-4">
        <button className="flex flex-col items-center gap-1" aria-label="Save pet" type="button">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/16">
            <Heart size={24} weight="fill" className="text-pink-500" />
          </div>
          <span className="text-xs text-white/90">{k(pet.stats.saves)}</span>
        </button>
        <button className="flex flex-col items-center gap-1" aria-label="Messages" type="button">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/16">
            <ChatCircleDots size={24} weight="fill" />
          </div>
          <span className="text-xs text-white/90">{k(pet.stats.messages)}</span>
        </button>
        <button
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/16"
          aria-label="Share"
          type="button"
        >
          <ShareFat size={22} />
        </button>
        <button
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/16"
          aria-label="More"
          type="button"
        >
          <DotsThreeVertical size={22} />
        </button>
      </aside>

      {/* bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="hero-bottom pointer-events-none h-16 w-full" />
        <div className="pointer-events-auto px-2 sm:px-4 pb-[env(safe-area-inset-bottom,0px)]">
          <div className="glass h-14 rounded-xl flex items-center justify-around text-white/85">
            {['Home', 'Discover', 'Messages', 'Wallet', 'Profile'].map((label, i) => (
              <button
                key={label}
                className={`flex flex-col items-center justify-center h-full w-16 rounded-lg ${i === 0 ? 'text-white' : 'hover:text-white'}`}
                type="button"
              >
                <span className={i === 0 ? 'grad-brand bg-clip-text text-transparent' : ''}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
