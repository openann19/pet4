import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { buildLLMPrompt } from '@/lib/llm-prompt'
import { llmService } from '@/lib/llm-service'
import { parseLLMError } from '@/lib/llm-utils'
import { createLogger } from '@/lib/logger'
import { Camera, Check, Image as ImageIcon, Sparkle, Upload, X } from '@phosphor-icons/react'
import { Presence, motion } from '@petspark/motion'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('PetPhotoAnalyzer')

interface AnalysisResult {
  breed: string
  age: number
  size: 'small' | 'medium' | 'large' | 'extra-large'
  personality: string[]
  confidence: number
}

interface PetPhotoAnalyzerProps {
  onAnalysisComplete: (result: AnalysisResult & { photo: string }) => void
}

export default function PetPhotoAnalyzer({ onAnalysisComplete }: PetPhotoAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [photo, setPhoto] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [uploadMode, setUploadMode] = useState<'url' | 'file' | 'camera'>('url')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoInput = (url: string) => {
    setPhoto(url)
    setResult(null)
    setShowResult(false)
  }

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPhoto(dataUrl)
      setResult(null)
      setShowResult(false)
      toast.success('Photo uploaded!', {
        description: 'Click Analyze to extract pet information'
      })
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
    }
    reader.readAsDataURL(file)
  }

  const handleCameraCapture = () => {
    if (isTruthy(cameraInputRef.current)) {
      cameraInputRef.current.click()
    }
  }

  const handleFileSelect = () => {
    if (isTruthy(fileInputRef.current)) {
      fileInputRef.current.click()
    }
  }

  const analyzePhoto = async () => {
    if (!photo) {
      toast.error('Please upload or capture a photo first')
      return
    }

    setAnalyzing(true)
    setShowResult(false)

    try {
      const isDataUrl = photo.startsWith('data:')
      const prompt = buildLLMPrompt`You are an expert veterinarian and animal behaviorist. Analyze this pet photo and extract the following information. Be specific but realistic.

${String(isDataUrl ? 'This is an uploaded/captured photo of a pet.' : `Photo URL: ${String(photo ?? '')}` ?? '')}

Based on typical characteristics of pets in photos, provide:
1. The most likely breed (be specific, e.g., "Golden Retriever" not just "Dog")
2. Estimated age in years (1-15)
3. Size category: small (under 20 lbs), medium (20-50 lbs), large (50-100 lbs), or extra-large (over 100 lbs)
4. 3-5 personality traits from this list: Playful, Calm, Energetic, Gentle, Social, Independent, Affectionate, Curious, Protective, Loyal, Friendly, Quiet
5. Your confidence level in this analysis (0-100)

Return ONLY valid JSON with this exact structure, nothing else:
{
  "breed": "breed name",
  "age": number,
  "size": "small" | "medium" | "large" | "extra-large",
  "personality": ["trait1", "trait2", "trait3"],
  "confidence": number
}`

      const response = await llmService.llm(prompt, 'gpt-4o', true)
      const analysisResult = JSON.parse(response)

      setResult(analysisResult)
      setShowResult(true)
      
      toast.success('Photo analyzed successfully! 🎉', {
        description: `Found a ${String(analysisResult.breed ?? '')} with ${String(analysisResult.confidence ?? '')}% confidence`
      })
    } catch (error) {
      const errorInfo = parseLLMError(error)
      logger.error('Failed to analyze photo', error instanceof Error ? error : new Error(String(error)), { technicalMessage: errorInfo.technicalMessage })
      toast.error('Failed to analyze photo', {
        description: errorInfo.userMessage,
        duration: 6000,
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAccept = () => {
    if (isTruthy(result)) {
      onAnalysisComplete({ ...result, photo })
      toast.success('Information applied!', {
        description: 'You can still edit any field before saving'
      })
    }
  }

  return (
    <div className="space-y-4">
      <MotionView
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card className="p-6 bg-linear-to-br from-primary/5 via-accent/5 to-secondary/5 border-2 border-dashed border-primary/20">
          <div className="flex items-start gap-4">
            <MotionView
              className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center shrink-0"
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(245,158,11,0.3)',
                  '0 0 30px rgba(245,158,11,0.5)',
                  '0 0 20px rgba(245,158,11,0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkle size={24} weight="fill" className="text-white" />
            </MotionView>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                AI Photo Analysis
                <Badge variant="secondary" className="text-xs">New</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload, capture, or paste a photo URL and let AI automatically detect breed, age, size, and personality
              </p>
              
              <div className="flex gap-2 mb-3">
                <MotionView whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    size="sm"
                    variant={uploadMode === 'camera' ? 'default' : 'outline'}
                    onClick={() => {
                      setUploadMode('camera')
                      handleCameraCapture()
                    }}
                    className="gap-2"
                  >
                    <Camera size={16} weight="fill" />
                    <span>Camera</span>
                  </Button>
                </MotionView>
                <MotionView whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    size="sm"
                    variant={uploadMode === 'file' ? 'default' : 'outline'}
                    onClick={() => {
                      setUploadMode('file')
                      handleFileSelect()
                    }}
                    className="gap-2"
                  >
                    <ImageIcon size={16} weight="fill" />
                    <span>Upload</span>
                  </Button>
                </MotionView>
                <MotionView whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    size="sm"
                    variant={uploadMode === 'url' ? 'default' : 'outline'}
                    onClick={() => { setUploadMode('url'); }}
                    className="gap-2"
                  >
                    <Upload size={16} weight="fill" />
                    <span>URL</span>
                  </Button>
                </MotionView>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (isTruthy(file)) handleFileUpload(file)
                }}
                className="hidden"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (isTruthy(file)) handleFileUpload(file)
                }}
                className="hidden"
              />
              
              {uploadMode === 'url' && (
                <MotionView 
                  className="flex gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <input
                    type="text"
                    value={photo}
                    onChange={(e) => { handlePhotoInput(e.target.value); }}
                    placeholder="Paste image URL here..."
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                    disabled={analyzing}
                  />
                  <Button
                    type="button"
                    onClick={analyzePhoto}
                    disabled={!photo || analyzing}
                    className="bg-linear-to-r from-primary to-accent hover:opacity-90"
                  >
                    {analyzing ? (
                      <>
                        <MotionView
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkle size={18} weight="fill" />
                        </MotionView>
                        <span className="ml-2">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Camera size={18} weight="fill" />
                        <span className="ml-2">Analyze</span>
                      </>
                    )}
                  </Button>
                </MotionView>
              )}

              {(uploadMode === 'file' || uploadMode === 'camera') && photo && (
                <MotionView
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-muted text-muted-foreground">
                    Photo {uploadMode === 'camera' ? 'captured' : 'uploaded'} ✓
                  </div>
                  <Button
                    type="button"
                    onClick={analyzePhoto}
                    disabled={analyzing}
                    className="bg-linear-to-r from-primary to-accent hover:opacity-90"
                  >
                    {analyzing ? (
                      <>
                        <MotionView
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkle size={18} weight="fill" />
                        </MotionView>
                        <span className="ml-2">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkle size={18} weight="fill" />
                        <span className="ml-2">Analyze</span>
                      </>
                    )}
                  </Button>
                </MotionView>
              )}
            </div>
          </div>
        </Card>
      </MotionView>

      <Presence>
        {photo && !analyzing && (
          <MotionView
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative h-64 rounded-lg overflow-hidden bg-muted"
          >
            <img src={photo} alt="Pet preview" className="w-full h-full object-cover" />
          </MotionView>
        )}
      </Presence>

      <Presence>
        {analyzing && (
          <MotionView
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 bg-linear-to-br from-background to-muted/30">
              <div className="flex items-center gap-3 mb-4">
                <MotionView
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkle size={24} weight="fill" className="text-primary" />
                </MotionView>
                <div>
                  <h4 className="font-semibold">Analyzing photo...</h4>
                  <p className="text-sm text-muted-foreground">This may take a few seconds</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {['Detecting breed...', 'Estimating age...', 'Analyzing personality...', 'Calculating confidence...'].map((text, idx) => (
                  <MotionView
                    key={text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.3 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <MotionView
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    {text}
                  </MotionView>
                ))}
              </div>
            </Card>
          </MotionView>
        )}
      </Presence>

      <Presence>
        {showResult && result && (
          <MotionView
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <Card className="p-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-start gap-4 mb-4">
                <MotionView
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0"
                >
                  <Check size={24} weight="bold" className="text-white" />
                </MotionView>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1">Analysis Complete!</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Confidence:</span>
                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                      {result.confidence}%
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <MotionView
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-xs text-muted-foreground mb-1">Breed</div>
                  <div className="font-semibold">{result.breed}</div>
                </MotionView>

                <MotionView
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="text-xs text-muted-foreground mb-1">Age</div>
                  <div className="font-semibold">{result.age} years</div>
                </MotionView>

                <MotionView
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-xs text-muted-foreground mb-1">Size</div>
                  <div className="font-semibold capitalize">{result.size.replace('-', ' ')}</div>
                </MotionView>

                <MotionView
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="text-xs text-muted-foreground mb-1">Traits</div>
                  <div className="font-semibold">{result.personality && Array.isArray(result.personality) ? result.personality.length : 0} detected</div>
                </MotionView>
              </div>

              <MotionView
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-xs text-muted-foreground mb-2">Personality Traits</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {result.personality.map((trait, idx) => (
                    <MotionView
                      key={trait}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                    >
                      <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                        {trait}
                      </Badge>
                    </MotionView>
                  ))}
                </div>
              </MotionView>

              <div className="flex gap-2 pt-2">
                <MotionView
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowResult(false)
                      setResult(null)
                    }}
                  >
                    <X size={18} weight="bold" />
                    <span className="ml-2">Discard</span>
                  </Button>
                </MotionView>
                <MotionView
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    className="w-full bg-linear-to-r from-green-500 to-emerald-500 hover:opacity-90"
                    onClick={handleAccept}
                  >
                    <Check size={18} weight="bold" />
                    <span className="ml-2">Apply to Profile</span>
                  </Button>
                </MotionView>
              </div>
            </Card>
          </MotionView>
        )}
      </Presence>
    </div>
  )
}
