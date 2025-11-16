import { MotionView } from "@petspark/motion";
/**
 * Ultra Animation Showcase
 * Interactive demo of all enhanced animation capabilities
 */

import { Button } from '@/components/ui/button';
import {
  use3DFlipCard,
  useBreathingAnimation,
  useConfettiBurst,
  useElasticScale,
  useGlowBorder,
  useMagneticHover,
  useMorphShape,
  useRippleEffect,
  useUltraCardReveal,
  useWaveAnimation,
} from '@/effects/reanimated';
import { useState } from 'react';

export function UltraAnimationShowcase() {
  const [showDemo, setShowDemo] = useState(true);

  // Ultra Card Reveal
  const card1 = useUltraCardReveal({ index: 0, enabled: showDemo });
  const card2 = useUltraCardReveal({ index: 1, enabled: showDemo });
  const card3 = useUltraCardReveal({ index: 2, enabled: showDemo });

  // Magnetic Hover
  const magnetic = useMagneticHover({ strength: 0.4, maxDistance: 60 });

  // Ripple Effect
  const ripple = useRippleEffect({ color: 'rgba(99, 102, 241, 0.4)' });

  // Elastic Scale
  const elastic = useElasticScale({ scaleUp: 1.2, scaleDown: 0.9 });

  // Morph Shape
  const morph = useMorphShape({
    shapes: [
      { borderRadius: [12, 12, 12, 12], scale: 1, rotate: 0 },
      { borderRadius: [32, 12, 32, 12], scale: 1.05, rotate: 5 },
      { borderRadius: [60, 60, 60, 60], scale: 1, rotate: 0 },
      { borderRadius: [12, 32, 12, 32], scale: 1.05, rotate: -5 },
    ],
  });

  // 3D Flip Card
  const flipCard = use3DFlipCard();

  // Glow Border
  const glowBorder = useGlowBorder({
    color: 'rgba(99, 102, 241, 0.8)',
    intensity: 24,
    pulseSize: 12,
  });

  // Breathing Animation
  const breathing = useBreathingAnimation({ duration: 4000 });

  // Wave Animation
  const wave = useWaveAnimation({ amplitude: 15, frequency: 2, speed: 3000 });

  // Confetti Burst
  const confetti = useConfettiBurst({ particleCount: 50, spread: 300 });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-white mb-2">Ultra Enhanced Animations</h1>
          <p className="text-xl text-gray-300">
            Experience buttery smooth, ultra-responsive animations
          </p>
        </div>

        {/* Ultra Card Reveal Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">3D Card Reveals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[card1, card2, card3].map((card, i) => (
              <MotionView key={i} style={card.animatedStyle}>
                <div className="bg-linear-to-br from-purple-600 to-blue-600 p-8 rounded-2xl shadow-2xl">
                  <h3 className="text-2xl font-bold text-white mb-4">Card {i + 1}</h3>
                  <p className="text-gray-200">
                    Ultra smooth 3D reveal with perspective transforms
                  </p>
                </div>
              </MotionView>
            ))}
          </div>
        </section>

        {/* Magnetic Hover Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Magnetic Hover</h2>
          <div
            ref={magnetic.handleRef}
            onMouseEnter={magnetic.handleMouseEnter}
            onMouseLeave={magnetic.handleMouseLeave}
            onMouseMove={magnetic.handleMouseMove}
            className="inline-block"
          >
            <MotionView style={magnetic.animatedStyle}>
              <div className="bg-linear-to-r from-pink-500 to-purple-600 px-12 py-8 rounded-2xl shadow-2xl cursor-pointer">
                <p className="text-2xl font-bold text-white">Hover over me!</p>
              </div>
            </MotionView>
          </div>
        </section>

        {/* Ripple Effect Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Ripple Effect</h2>
          <div
            onClick={ripple.addRipple}
            className="relative overflow-hidden bg-linear-to-r from-cyan-500 to-blue-600 px-12 py-8 rounded-2xl shadow-2xl cursor-pointer inline-block"
          >
            <p className="text-2xl font-bold text-white relative z-10">Click for ripples!</p>
            {ripple.ripples.map((r) => (
              <MotionView
                key={r.id}
                style={ripple.animatedStyle}
                className="absolute rounded-full pointer-events-none"
              >
                <div />
              </MotionView>
            ))}
          </div>
        </section>

        {/* Elastic Scale Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Elastic Scale</h2>
          <div
            onMouseDown={elastic.handlePressIn}
            onMouseUp={elastic.handlePressOut}
            onMouseLeave={elastic.handlePressOut}
            className="inline-block"
          >
            <MotionView style={elastic.animatedStyle}>
              <Button className="text-xl px-8 py-6 bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                Press Me!
              </Button>
            </MotionView>
          </div>
        </section>

        {/* Morph Shape Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Morphing Shapes</h2>
          <div className="flex gap-4">
            <MotionView style={morph.animatedStyle}>
              <div className="bg-linear-to-br from-green-500 to-emerald-600 w-32 h-32 shadow-2xl" />
            </MotionView>
            <Button onClick={morph.cycleShape} className="px-6 py-3">
              Morph Shape
            </Button>
          </div>
        </section>

        {/* 3D Flip Card Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">3D Flip Card</h2>
          <div className="relative w-64 h-40" onClick={flipCard.flip}>
            <MotionView style={flipCard.frontAnimatedStyle} className="absolute inset-0">
              <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center cursor-pointer">
                <p className="text-2xl font-bold text-white">Front</p>
              </div>
            </MotionView>
            <MotionView style={flipCard.backAnimatedStyle} className="absolute inset-0">
              <div className="w-full h-full bg-linear-to-br from-pink-500 to-orange-600 rounded-2xl shadow-2xl flex items-center justify-center cursor-pointer">
                <p className="text-2xl font-bold text-white">Back</p>
              </div>
            </MotionView>
          </div>
        </section>

        {/* Glow Border Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Animated Glow</h2>
          <MotionView style={glowBorder.animatedStyle}>
            <div className="bg-linear-to-r from-purple-900 to-indigo-900 px-12 py-8 rounded-2xl inline-block">
              <p className="text-2xl font-bold text-white">Pulsating Glow</p>
            </div>
          </MotionView>
        </section>

        {/* Breathing Animation Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Breathing Effect</h2>
          <MotionView style={breathing.animatedStyle}>
            <div className="bg-linear-to-r from-teal-500 to-cyan-600 px-12 py-8 rounded-2xl shadow-2xl inline-block">
              <p className="text-2xl font-bold text-white">Breathe...</p>
            </div>
          </MotionView>
        </section>

        {/* Wave Animation Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Wave Motion</h2>
          <MotionView style={wave.animatedStyle}>
            <div className="bg-linear-to-r from-blue-400 to-cyan-500 px-12 py-8 rounded-2xl shadow-2xl inline-block">
              <p className="text-2xl font-bold text-white">Flowing Wave</p>
            </div>
          </MotionView>
        </section>

        {/* Confetti Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Confetti Celebration</h2>
          <Button
            onClick={(e) => confetti.burst(e.clientX, e.clientY)}
            className="px-8 py-6 text-xl bg-linear-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
          >
            🎉 Celebrate!
          </Button>
          {confetti.particles.map((particle) => (
            <MotionView
              key={particle.id}
              style={confetti.createParticleStyle(particle)}
              className="absolute rounded-sm pointer-events-none"
            >
              <div />
            </MotionView>
          ))}
        </section>

        {/* Reset Button */}
        <div className="text-center pt-12">
          <Button
            onClick={() => {
              setShowDemo(false);
              setTimeout(() => { setShowDemo(true); }, 100);
            }}
            className="px-8 py-4 text-xl bg-white text-black hover:bg-gray-100"
          >
            Replay All Animations
          </Button>
        </div>
      </div>
    </div>
  );
}
