import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MapPin, Upload, CurrencyDollar, X, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { lostFoundAPI } from '@/api/lost-found-api'
import { MapLocationPicker } from './MapLocationPicker'
import { createLogger } from '@/lib/logger'

interface CreateLostAlertDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateLostAlertDialog({ open, onClose, onSuccess }: CreateLostAlertDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)

  const [petName, setPetName] = useState('')
  const [species, setSpecies] = useState<'dog' | 'cat' | 'other'>('dog')
  const [breed, setBreed] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState<'tiny' | 'small' | 'medium' | 'large' | 'extra-large'>('medium')
  const [distinctiveFeatures, setDistinctiveFeatures] = useState<string[]>([])
  const [featureInput, setFeatureInput] = useState('')
  const [microchipId, setMicrochipId] = useState('')
  
  const [lastSeenDate, setLastSeenDate] = useState('')
  const [lastSeenTime, setLastSeenTime] = useState('')
  const [locationDescription, setLocationDescription] = useState('')
  const [landmarks, setLandmarks] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [radiusM, setRadiusM] = useState(5000)
  
  const [reward, setReward] = useState<number | undefined>()
  const [contactInfo, setContactInfo] = useState('')
  const [photos] = useState<string[]>([])

  const addFeature = () => {
    if (featureInput.trim()) {
      setDistinctiveFeatures([...distinctiveFeatures, featureInput.trim()])
      setFeatureInput('')
    }
  }

  const removeFeature = (index: number) => {
    setDistinctiveFeatures(distinctiveFeatures.filter((_, i) => i !== index))
  }

  const handleLocationSelect = (lat: number, lon: number) => {
    setSelectedLocation({ lat, lon })
    setShowMapPicker(false)
  }

  const maskContactInfo = (contact: string): string => {
    if (contact.includes('@')) {
      const parts = contact.split('@')
      const local = parts[0]
      const domain = parts[1]
      if (local && domain) {
        return `${local.substring(0, 2)}***@${domain}`
      }
    }
    if (contact.length > 4) {
      return `${contact.substring(0, 3)}***${contact.substring(contact.length - 2)}`
    }
    return contact
  }

  const handleSubmit = async () => {
    if (!petName || !species || !lastSeenDate || !lastSeenTime || !contactInfo) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)

      const user = await spark.user()
      const whenISO = new Date(`${lastSeenDate}T${lastSeenTime}`).toISOString()

      await lostFoundAPI.createAlert({
        ownerId: user.id,
        ownerName: user.login || 'Unknown',
        ownerAvatar: user.avatarUrl,
        petSummary: {
          name: petName,
          species,
          breed: breed || undefined,
          color: color || undefined,
          size,
          distinctiveFeatures: distinctiveFeatures.length > 0 ? distinctiveFeatures : undefined,
          microchipId: microchipId || undefined
        },
        lastSeen: {
          whenISO,
          lat: selectedLocation?.lat,
          lon: selectedLocation?.lon,
          radiusM,
          description: locationDescription || undefined,
          landmarks: landmarks ? [landmarks] : undefined
        },
        reward,
        contactMask: maskContactInfo(contactInfo),
        photos,
        description: locationDescription || undefined
      })

      toast.success('Lost pet alert created successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      const logger = createLogger('CreateLostAlertDialog')
      logger.error('Failed to create lost alert', error instanceof Error ? error : new Error(String(error)))
      toast.error('Failed to create alert. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open && !showMapPicker} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Lost Pet</DialogTitle>
            <DialogDescription>
              Help us help you find your pet. The more details, the better.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Pet Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="petName">Pet Name *</Label>
                  <Input
                    id="petName"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="e.g., Max"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="species">Species *</Label>
                  <Select value={species} onValueChange={(v) => setSpecies(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="e.g., Golden Retriever"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g., Golden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select value={size} onValueChange={(v) => setSize(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiny">Tiny (0-5 lbs)</SelectItem>
                    <SelectItem value="small">Small (6-20 lbs)</SelectItem>
                    <SelectItem value="medium">Medium (21-50 lbs)</SelectItem>
                    <SelectItem value="large">Large (51-100 lbs)</SelectItem>
                    <SelectItem value="extra-large">Extra Large (100+ lbs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Distinctive Features</Label>
                <div className="flex gap-2">
                  <Input
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    placeholder="e.g., White spot on chest"
                  />
                  <Button type="button" onClick={addFeature} size="icon">
                    <Plus size={16} />
                  </Button>
                </div>
                {distinctiveFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {distinctiveFeatures.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {feature}
                        <button onClick={() => removeFeature(index)}>
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="microchipId">Microchip ID (if applicable)</Label>
                <Input
                  id="microchipId"
                  value={microchipId}
                  onChange={(e) => setMicrochipId(e.target.value)}
                  placeholder="15-digit microchip number"
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Last Seen Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastSeenDate">Date *</Label>
                  <Input
                    id="lastSeenDate"
                    type="date"
                    value={lastSeenDate}
                    onChange={(e) => setLastSeenDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastSeenTime">Time *</Label>
                  <Input
                    id="lastSeenTime"
                    type="time"
                    value={lastSeenTime}
                    onChange={(e) => setLastSeenTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location on Map</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowMapPicker(true)}
                >
                  <MapPin size={16} className="mr-2" />
                  {selectedLocation ? 'Update Location' : 'Pick Location on Map'}
                </Button>
                {selectedLocation && (
                  <p className="text-xs text-muted-foreground">
                    Location set: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="radiusM">Search Radius</Label>
                <Select value={radiusM.toString()} onValueChange={(v) => setRadiusM(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1 km</SelectItem>
                    <SelectItem value="2000">2 km</SelectItem>
                    <SelectItem value="5000">5 km</SelectItem>
                    <SelectItem value="10000">10 km</SelectItem>
                    <SelectItem value="20000">20 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationDescription">Location Description</Label>
                <Textarea
                  id="locationDescription"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  placeholder="e.g., Near Central Park, by the main entrance"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landmarks">Nearby Landmarks</Label>
                <Input
                  id="landmarks"
                  value={landmarks}
                  onChange={(e) => setLandmarks(e.target.value)}
                  placeholder="e.g., Coffee shop on the corner"
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Contact & Reward</h3>
              
              <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Information *</Label>
                <Input
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Email or phone number"
                />
                <p className="text-xs text-muted-foreground">
                  Will be partially masked for privacy (e.g., ab***@email.com)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward">Reward Amount (Optional)</Label>
                <div className="flex gap-2">
                  <div className="shrink-0 bg-muted rounded-md px-3 flex items-center">
                    <CurrencyDollar size={18} className="text-muted-foreground" />
                  </div>
                  <Input
                    id="reward"
                    type="number"
                    min="0"
                    value={reward || ''}
                    onChange={(e) => setReward(parseFloat(e.target.value) || undefined)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photos</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload photos of your pet</p>
                  <p className="text-xs text-muted-foreground mt-1">Up to 5 photos, max 5MB each</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 sticky bottom-0 bg-card pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Alert...' : 'Create Alert'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showMapPicker && (
        <MapLocationPicker
          onSelect={handleLocationSelect}
          onClose={() => setShowMapPicker(false)}
          initialLocation={selectedLocation || undefined}
        />
      )}
    </>
  )
}
