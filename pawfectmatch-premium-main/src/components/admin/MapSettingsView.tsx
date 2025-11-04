import { useState } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { MapPin, Plus, Trash, Pencil } from '@phosphor-icons/react'
import type { PlaceCategory } from '@/lib/maps/types'

interface MapSettings {
  PRIVACY_GRID_METERS: number
  DEFAULT_RADIUS_KM: number
  MAX_RADIUS_KM: number
  MIN_RADIUS_KM: number
  UNITS: 'metric' | 'imperial'
  COUNTRY_BIAS: string
  ENABLE_PRECISE_LOCATION: boolean
  PRECISE_LOCATION_TIMEOUT_MINUTES: number
  ENABLE_GEOFENCING: boolean
  ENABLE_LOST_PET_ALERTS: boolean
  ENABLE_PLAYDATE_PLANNING: boolean
  ENABLE_PLACE_DISCOVERY: boolean
  AUTO_CENTER_ON_LOCATION: boolean
  SHOW_DISTANCE_LABELS: boolean
  CLUSTER_MARKERS: boolean
  MAX_MARKERS_VISIBLE: number
}

interface PlaceCategorySettings {
  categories: PlaceCategory[]
  defaultCategory: string
  enableUserSubmittedPlaces: boolean
  requireModeration: boolean
}

export default function MapSettingsView() {
  const [mapSettings, setMapSettings] = useStorage<MapSettings>('admin-map-settings', {
    PRIVACY_GRID_METERS: 1000,
    DEFAULT_RADIUS_KM: 10,
    MAX_RADIUS_KM: 100,
    MIN_RADIUS_KM: 1,
    UNITS: 'metric',
    COUNTRY_BIAS: 'US',
    ENABLE_PRECISE_LOCATION: true,
    PRECISE_LOCATION_TIMEOUT_MINUTES: 60,
    ENABLE_GEOFENCING: true,
    ENABLE_LOST_PET_ALERTS: true,
    ENABLE_PLAYDATE_PLANNING: true,
    ENABLE_PLACE_DISCOVERY: true,
    AUTO_CENTER_ON_LOCATION: true,
    SHOW_DISTANCE_LABELS: true,
    CLUSTER_MARKERS: true,
    MAX_MARKERS_VISIBLE: 50,
  })

  const [categorySettings, setCategorySettings] = useStorage<PlaceCategorySettings>(
    'admin-map-categories',
    {
      categories: [
        { id: 'park', name: 'Parks', icon: '🌳', color: '#22c55e' },
        { id: 'vet', name: 'Veterinarians', icon: '🏥', color: '#3b82f6' },
        { id: 'groomer', name: 'Groomers', icon: '✂️', color: '#a855f7' },
        { id: 'cafe', name: 'Pet Cafes', icon: '☕', color: '#f59e0b' },
        { id: 'store', name: 'Pet Stores', icon: '🛒', color: '#ec4899' },
        { id: 'hotel', name: 'Pet Hotels', icon: '🏨', color: '#14b8a6' },
        { id: 'beach', name: 'Dog Beaches', icon: '🏖️', color: '#06b6d4' },
        { id: 'training', name: 'Training Centers', icon: '🎯', color: '#8b5cf6' },
      ],
      defaultCategory: 'park',
      enableUserSubmittedPlaces: true,
      requireModeration: true,
    }
  )

  const [editingCategory, setEditingCategory] = useState<PlaceCategory | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState<Partial<PlaceCategory>>({
    id: '',
    name: '',
    icon: '',
    color: '#000000',
  })

  const handleSettingChange = (key: keyof MapSettings, value: any) => {
    setMapSettings((current) => ({
      ...current,
      [key]: value,
    }))
    toast.success('Map setting updated')
  }

  const handleAddCategory = () => {
    if (!newCategory.id || !newCategory.name || !newCategory.icon || !newCategory.color) {
      toast.error('Please fill in all category fields')
      return
    }

    setCategorySettings((current) => ({
      ...current,
      categories: [...current.categories, newCategory as PlaceCategory],
    }))

    setNewCategory({ id: '', name: '', icon: '', color: '#000000' })
    setIsAddingCategory(false)
    toast.success('Category added successfully')
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategorySettings((current) => ({
      ...current,
      categories: current.categories.filter((cat) => cat.id !== categoryId),
    }))
    toast.success('Category deleted')
  }

  const handleUpdateCategory = (updatedCategory: PlaceCategory) => {
    setCategorySettings((current) => ({
      ...current,
      categories: current.categories.map((cat) =>
        cat.id === updatedCategory.id ? updatedCategory : cat
      ),
    }))
    setEditingCategory(null)
    toast.success('Category updated')
  }

  // Category visibility toggle handler - reserved for future use
   
  const _handleToggleCategoryVisibility = (_categoryId: string): void => {
    void _categoryId
    toast.info('Category visibility toggled')
  }
  void _handleToggleCategoryVisibility

  const handleResetToDefaults = () => {
    setMapSettings({
      PRIVACY_GRID_METERS: 1000,
      DEFAULT_RADIUS_KM: 10,
      MAX_RADIUS_KM: 100,
      MIN_RADIUS_KM: 1,
      UNITS: 'metric',
      COUNTRY_BIAS: 'US',
      ENABLE_PRECISE_LOCATION: true,
      PRECISE_LOCATION_TIMEOUT_MINUTES: 60,
      ENABLE_GEOFENCING: true,
      ENABLE_LOST_PET_ALERTS: true,
      ENABLE_PLAYDATE_PLANNING: true,
      ENABLE_PLACE_DISCOVERY: true,
      AUTO_CENTER_ON_LOCATION: true,
      SHOW_DISTANCE_LABELS: true,
      CLUSTER_MARKERS: true,
      MAX_MARKERS_VISIBLE: 50,
    })
    toast.success('Settings reset to defaults')
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MapPin className="text-primary" size={32} weight="duotone" />
              Map Configuration
            </h1>
            <p className="text-muted-foreground">
              Configure map features, privacy settings, and place categories
            </p>
          </div>
          <Button variant="outline" onClick={handleResetToDefaults}>
            Reset to Defaults
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Location Settings</CardTitle>
              <CardDescription>
                Configure how location data is handled and displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Privacy Grid Size (meters)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[mapSettings?.PRIVACY_GRID_METERS ?? 1000]}
                    onValueChange={([value]) => handleSettingChange('PRIVACY_GRID_METERS', value)}
                    min={100}
                    max={5000}
                    step={100}
                    className="flex-1"
                  />
                  <span className="w-20 text-right font-medium">
                    {mapSettings?.PRIVACY_GRID_METERS ?? 1000}m
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Approximate user locations are snapped to a grid of this size for privacy
                </p>
              </div>

              <Separator />

              <FeatureFlagItem
                label="Enable Precise Location"
                description="Allow users to temporarily share their exact location"
                checked={mapSettings?.ENABLE_PRECISE_LOCATION ?? true}
                onCheckedChange={(checked: boolean) => handleSettingChange('ENABLE_PRECISE_LOCATION', checked)}
              />

              <Separator />

              <div className="space-y-3">
                <Label>Precise Location Timeout (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[mapSettings?.PRECISE_LOCATION_TIMEOUT_MINUTES ?? 60]}
                    onValueChange={([value]) =>
                      handleSettingChange('PRECISE_LOCATION_TIMEOUT_MINUTES', value)
                    }
                    min={5}
                    max={240}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-20 text-right font-medium">
                    {mapSettings?.PRECISE_LOCATION_TIMEOUT_MINUTES ?? 60} min
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  How long precise location sharing remains active before reverting to approximate
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Radius (km)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={mapSettings?.DEFAULT_RADIUS_KM ?? 10}
                    onChange={(e) =>
                      handleSettingChange('DEFAULT_RADIUS_KM', parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Radius (km)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={mapSettings?.MAX_RADIUS_KM ?? 100}
                    onChange={(e) =>
                      handleSettingChange('MAX_RADIUS_KM', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Units</Label>
                <Select
                  value={mapSettings?.UNITS ?? 'metric'}
                  onValueChange={(value) => handleSettingChange('UNITS', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (km, m)</SelectItem>
                    <SelectItem value="imperial">Imperial (mi, ft)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Country Bias</Label>
                <Input
                  placeholder="US, GB, DE, etc."
                  value={mapSettings?.COUNTRY_BIAS ?? 'US'}
                  onChange={(e) => handleSettingChange('COUNTRY_BIAS', e.target.value.toUpperCase())}
                  maxLength={2}
                />
                <p className="text-sm text-muted-foreground">
                  Two-letter country code for location search bias
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Map Features</CardTitle>
              <CardDescription>Enable or disable map functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FeatureFlagItem
                label="Geofencing"
                description="Enable location-based alerts and notifications"
                checked={mapSettings?.ENABLE_GEOFENCING ?? true}
                onCheckedChange={(checked: boolean) => handleSettingChange('ENABLE_GEOFENCING', checked)}
              />

              <Separator />

              <FeatureFlagItem
                label="Lost Pet Alerts"
                description="Allow users to create and view lost pet alerts on the map"
                checked={mapSettings?.ENABLE_LOST_PET_ALERTS ?? true}
                onCheckedChange={(checked: boolean) => handleSettingChange('ENABLE_LOST_PET_ALERTS', checked)}
              />

              <Separator />

              <FeatureFlagItem
                label="Playdate Planning"
                description="Enable playdate location suggestions and meeting points"
                checked={mapSettings?.ENABLE_PLAYDATE_PLANNING ?? true}
                onCheckedChange={(checked: boolean) =>
                  handleSettingChange('ENABLE_PLAYDATE_PLANNING', checked)
                }
              />

              <Separator />

              <FeatureFlagItem
                label="Place Discovery"
                description="Show pet-friendly places and businesses on the map"
                checked={mapSettings?.ENABLE_PLACE_DISCOVERY ?? true}
                onCheckedChange={(checked: boolean) => handleSettingChange('ENABLE_PLACE_DISCOVERY', checked)}
              />

              <Separator />

              <FeatureFlagItem
                label="Auto Center on Location"
                description="Automatically center the map on user's location when loaded"
                checked={mapSettings?.AUTO_CENTER_ON_LOCATION ?? true}
                onCheckedChange={(checked: boolean) =>
                  handleSettingChange('AUTO_CENTER_ON_LOCATION', checked)
                }
              />

              <Separator />

              <FeatureFlagItem
                label="Show Distance Labels"
                description="Display distance information on map markers"
                checked={mapSettings?.SHOW_DISTANCE_LABELS ?? true}
                onCheckedChange={(checked: boolean) => handleSettingChange('SHOW_DISTANCE_LABELS', checked)}
              />

              <Separator />

              <FeatureFlagItem
                label="Cluster Markers"
                description="Group nearby markers together to reduce clutter"
                checked={mapSettings?.CLUSTER_MARKERS ?? true}
                onCheckedChange={(checked: boolean) => handleSettingChange('CLUSTER_MARKERS', checked)}
              />

              <Separator />

              <div className="space-y-3">
                <Label>Max Visible Markers</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[mapSettings?.MAX_MARKERS_VISIBLE ?? 50]}
                    onValueChange={([value]) => handleSettingChange('MAX_MARKERS_VISIBLE', value)}
                    min={10}
                    max={200}
                    step={10}
                    className="flex-1"
                  />
                  <span className="w-16 text-right font-medium">
                    {mapSettings?.MAX_MARKERS_VISIBLE ?? 50}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum number of markers to display at once
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Place Categories</CardTitle>
                  <CardDescription>
                    Manage the types of places users can discover
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingCategory(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus size={16} />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <FeatureFlagItem
                  label="User-Submitted Places"
                  description="Allow users to add new places to the map"
                  checked={categorySettings?.enableUserSubmittedPlaces ?? true}
                  onCheckedChange={(checked: boolean) =>
                    setCategorySettings((current) => ({
                      ...current,
                      enableUserSubmittedPlaces: checked,
                    }))
                  }
                />

                <Separator className="my-4" />

                <FeatureFlagItem
                  label="Require Moderation"
                  description="Review user-submitted places before they appear on the map"
                  checked={categorySettings?.requireModeration ?? true}
                  onCheckedChange={(checked: boolean) =>
                    setCategorySettings((current) => ({
                      ...current,
                      requireModeration: checked,
                    }))
                  }
                />
              </div>

              <Separator />

              {isAddingCategory && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category ID</Label>
                        <Input
                          placeholder="e.g., dog-park"
                          value={newCategory.id}
                          onChange={(e) =>
                            setNewCategory((prev) => ({ ...prev, id: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          placeholder="e.g., Dog Parks"
                          value={newCategory.name}
                          onChange={(e) =>
                            setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Icon (emoji)</Label>
                        <Input
                          placeholder="🐕"
                          value={newCategory.icon}
                          onChange={(e) =>
                            setNewCategory((prev) => ({ ...prev, icon: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={newCategory.color}
                            onChange={(e) =>
                              setNewCategory((prev) => ({ ...prev, color: e.target.value }))
                            }
                            className="w-20"
                          />
                          <Input
                            type="text"
                            value={newCategory.color}
                            onChange={(e) =>
                              setNewCategory((prev) => ({ ...prev, color: e.target.value }))
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddCategory}>Add Category</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {categorySettings?.categories.map((category) => (
                  <Card key={category.id}>
                    <CardContent className="pt-6">
                      {editingCategory?.id === category.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                value={editingCategory.name}
                                onChange={(e) =>
                                  setEditingCategory({ ...editingCategory, name: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Icon</Label>
                              <Input
                                value={editingCategory.icon}
                                onChange={(e) =>
                                  setEditingCategory({ ...editingCategory, icon: e.target.value })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={editingCategory.color}
                                onChange={(e) =>
                                  setEditingCategory({ ...editingCategory, color: e.target.value })
                                }
                                className="w-20"
                              />
                              <Input
                                type="text"
                                value={editingCategory.color}
                                onChange={(e) =>
                                  setEditingCategory({ ...editingCategory, color: e.target.value })
                                }
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditingCategory(null)}>
                              Cancel
                            </Button>
                            <Button onClick={() => handleUpdateCategory(editingCategory)}>
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              {category.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold">{category.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {category.id}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                  style={{ backgroundColor: category.color, color: 'white' }}
                                >
                                  {category.color}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingCategory(category)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash size={16} className="text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                View settings for external map services and APIs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Geocoding Endpoint" value="/api/geocode" />
              <Separator />
              <InfoRow label="Places Endpoint" value="/api/places" />
              <Separator />
              <InfoRow label="Routing Endpoint" value="/api/routes" />
              <Separator />
              <InfoRow
                label="Tiles Source"
                value="https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.png"
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}

interface FeatureFlagItemProps {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function FeatureFlagItem({ label, description, checked, onCheckedChange }: FeatureFlagItemProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1 flex-1">
        <Label className="text-base">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground font-mono">{value}</span>
    </div>
  )
}
