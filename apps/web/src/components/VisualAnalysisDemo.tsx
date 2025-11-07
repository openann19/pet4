import { useState } from 'react'
import { motion, Presence } from '@petspark/motion'
import { Sparkle, Eye, ArrowRight } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const DEMO_PETS = [
  {
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    breed: 'Golden Retriever',
    age: 3,
    size: 'large',
    personality: ['Friendly', 'Playful', 'Energetic', 'Social'],
    confidence: 92,
  },
  {
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    breed: 'Tabby Cat',
    age: 2,
    size: 'small',
    personality: ['Curious', 'Independent', 'Calm', 'Affectionate'],
    confidence: 88,
  },
  {
    photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
    breed: 'German Shepherd',
    age: 4,
    size: 'large',
    personality: ['Loyal', 'Protective', 'Energetic', 'Social'],
    confidence: 95,
  },
]

export default function VisualAnalysisDemo() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const currentPet = DEMO_PETS[selectedIndex]
  if (!currentPet) return null

  const runDemo = () => {
    setShowResult(false)
    setAnalyzing(true)

    setTimeout(() => {
      setAnalyzing(false)
      setShowResult(true)
    }, 2000)
  }

  const nextPet = () => {
    setSelectedIndex((prev) => (prev + 1) % DEMO_PETS.length)
    setShowResult(false)
    setAnalyzing(false)
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="flex items-start gap-4 mb-6">
        <MotionView
          className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0"
          animate={{
            boxShadow: [
              '0 0 20px rgba(245,158,11,0.3)',
              '0 0 30px rgba(245,158,11,0.5)',
              '0 0 20px rgba(245,158,11,0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Eye size={24} weight="fill" className="text-white" />
        </MotionView>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">AI Visual Analysis Demo</h3>
          <p className="text-sm text-muted-foreground">
            See how our AI reads pet photos to extract breed, age, size, and personality traits
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <MotionView
            key={selectedIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4"
          >
            <img src={currentPet.photo} alt="Demo pet" className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                Sample {selectedIndex + 1}/{DEMO_PETS.length}
              </Badge>
            </div>
          </MotionView>

          <div className="flex gap-2">
            <Button onClick={runDemo} disabled={analyzing} className="flex-1 bg-gradient-to-r from-primary to-accent">
              {analyzing ? (
                <>
                  <MotionView animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkle size={18} weight="fill" />
                  </MotionView>
                  <span className="ml-2">Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkle size={18} weight="fill" />
                  <span className="ml-2">Analyze This Photo</span>
                </>
              )}
            </Button>
            <Button variant="outline" onClick={nextPet} disabled={analyzing}>
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>

        <div>
          <Presence mode="wait">
            {!showResult && !analyzing && (
              <MotionView
                key="prompt"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center h-full text-center p-8"
              >
                <div>
                  <Eye size={48} className="text-muted-foreground/30 mx-auto mb-4" weight="duotone" />
                  <p className="text-muted-foreground">Click "Analyze This Photo" to see AI in action</p>
                </div>
              </MotionView>
            )}

            {analyzing && (
              <MotionView
                key="analyzing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <Card className="p-4 bg-background/50">
                  <div className="flex items-center gap-3 mb-4">
                    <MotionView animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                      <Sparkle size={24} weight="fill" className="text-primary" />
                    </MotionView>
                    <div>
                      <h4 className="font-semibold">Analyzing photo...</h4>
                      <p className="text-xs text-muted-foreground">Processing visual features</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {['Detecting breed...', 'Estimating age...', 'Analyzing personality...', 'Calculating confidence...'].map(
                      (text, idx) => (
                        <MotionView
                          key={text}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.4 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <MotionView
                            className="w-1.5 h-1.5 rounded-full bg-primary"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          {text}
                        </MotionView>
                      )
                    )}
                  </div>
                </Card>
              </MotionView>
            )}

            {showResult && (
              <MotionView
                key="result"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="h-full"
              >
                <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">Analysis Results</h4>
                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                      {currentPet.confidence}% confidence
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <MotionView initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                      <div className="text-xs text-muted-foreground mb-1">Breed</div>
                      <div className="font-semibold text-lg">{currentPet.breed}</div>
                    </MotionView>

                    <div className="grid grid-cols-2 gap-4">
                      <MotionView initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                        <div className="text-xs text-muted-foreground mb-1">Age</div>
                        <div className="font-semibold">{currentPet.age} years</div>
                      </MotionView>

                      <MotionView initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <div className="text-xs text-muted-foreground mb-1">Size</div>
                        <div className="font-semibold capitalize">{currentPet.size.replace('-', ' ')}</div>
                      </MotionView>
                    </div>

                    <MotionView initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                      <div className="text-xs text-muted-foreground mb-2">Personality Traits</div>
                      <div className="flex flex-wrap gap-2">
                        {currentPet.personality.map((trait, idx) => (
                          <MotionView
                            key={trait}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 + idx * 0.05 }}
                          >
                            <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                              {trait}
                            </Badge>
                          </MotionView>
                        ))}
                      </div>
                    </MotionView>

                    <MotionView
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="pt-2 border-t border-green-200 dark:border-green-800"
                    >
                      <p className="text-xs text-muted-foreground">
                        💡 This information would be automatically filled in when creating a pet profile
                      </p>
                    </MotionView>
                  </div>
                </Card>
              </MotionView>
            )}
          </Presence>
        </div>
      </div>
    </Card>
  )
}
