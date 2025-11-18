import { configBroadcastService } from '@/core/services/config-broadcast-service';
import { adminApi } from '@/api/admin-api';
import { useStorage } from '@/hooks/use-storage';
import type { User } from '@/lib/user-service';
import { createLogger } from '@/lib/logger';
import { Radio } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useMapProviderConfig } from '@/lib/maps/provider-config';
import type { PlaceCategory } from '@/lib/maps/types';
import { MapPin, Pencil, Plus, Trash } from '@phosphor-icons/react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getMapConfig,
  updateMapConfig,
  type MapConfig,
  type MapSettings,
  type PlaceCategorySettings,
} from '@/api/map-config-api';

const logger = createLogger('MapSettingsView');

const DEFAULT_MAP_SETTINGS: MapSettings = {
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
};

const DEFAULT_CATEGORY_SETTINGS: PlaceCategorySettings = {
  categories: [
    { id: 'park', name: 'Parks', icon: '🌳', color: 'var(--color-success-9)' },
    { id: 'vet', name: 'Veterinarians', icon: '🏥', color: 'var(--color-accent-secondary-9)' },
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
};

export default function MapSettingsView() {
  const {
    config: providerConfig,
    updateConfig: updateProviderConfig,
    resetToDefaults: resetProviderDefaults,
  } = useMapProviderConfig();
  const [mapSettings, setMapSettings] = useState<MapSettings>(DEFAULT_MAP_SETTINGS);
  const [categorySettings, setCategorySettings] = useState<PlaceCategorySettings>(DEFAULT_CATEGORY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [_saving, setSaving] = useState(false);

  const [editingCategory, setEditingCategory] = useState<PlaceCategory | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [currentUser] = useStorage<User | null>('current-user', null);
  const [newCategory, setNewCategory] = useState<Partial<PlaceCategory>>({
    id: '',
    name: '',
    icon: '',
    color: 'var(--color-fg)',
  });

  // Load config from backend
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getMapConfig();
      if (config) {
        setMapSettings(config.settings);
        setCategorySettings(config.categorySettings);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load map config', err);
      toast.error('Failed to load map configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  // Save config to backend
  const saveConfig = useCallback(async () => {
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    setSaving(true);
    try {
      const config: MapConfig = {
        settings: mapSettings,
        categorySettings,
        providerConfig: {
          provider: providerConfig.PROVIDER ?? 'maplibre',
          apiKey: providerConfig.MAP_TILES_API_KEY,
          geocodingApiKey: providerConfig.GEOCODING_API_KEY,
          mapStyleUrl: providerConfig.MAP_STYLE_URL,
          geocodingEndpoint: providerConfig.GEOCODING_ENDPOINT,
        },
      };
      await updateMapConfig(config, currentUser.id || 'admin');
      toast.success('Map configuration saved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save map config', err);
      toast.error('Failed to save map configuration');
    } finally {
      setSaving(false);
    }
  }, [mapSettings, categorySettings, providerConfig, currentUser]);

  const handleSettingChange = <K extends keyof MapSettings>(
    key: K,
    value: MapSettings[K]
  ): void => {
    if (value === undefined) return;
    setMapSettings((current) => ({
      ...current,
      [key]: value,
    }));
    // Auto-save to backend
    void saveConfig().catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save map setting', err, { key });
    });
  };

  const handleAddCategory = (): void => {
    if (!newCategory.id || !newCategory.name || !newCategory.icon || !newCategory.color) {
      toast.error('Please fill in all category fields');
      return;
    }

    setCategorySettings((current) => ({
      ...current,
      categories: [...current.categories, newCategory as PlaceCategory],
    }));

    setNewCategory({ id: '', name: '', icon: '', color: 'var(--color-fg)' });
    setIsAddingCategory(false);
    // Auto-save to backend
    void saveConfig().catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save category', err);
      toast.error('Failed to save category');
    });
    toast.success('Category added successfully');
  };

  const handleDeleteCategory = (categoryId: string): void => {
    setCategorySettings((current) => ({
      ...current,
      categories: current.categories.filter((cat) => cat.id !== categoryId),
    }));
    // Auto-save to backend
    void saveConfig().catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save after deleting category', err, { categoryId });
      toast.error('Failed to delete category');
    });
    toast.success('Category deleted');
  };

  const handleUpdateCategory = (updatedCategory: PlaceCategory): void => {
    setCategorySettings((current) => ({
      ...current,
      categories: current.categories.map((cat) =>
        cat.id === updatedCategory.id ? updatedCategory : cat
      ),
    }));
    setEditingCategory(null);
    // Auto-save to backend
    void saveConfig().catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save after updating category', err, { categoryId: updatedCategory.id });
      toast.error('Failed to update category');
    });
    toast.success('Category updated');
  };

  const handleResetToDefaults = (): void => {
    setMapSettings(DEFAULT_MAP_SETTINGS);
    setCategorySettings(DEFAULT_CATEGORY_SETTINGS);
    // Auto-save to backend
    void saveConfig().catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save after reset', err);
      toast.error('Failed to reset settings');
    });
    toast.success('Settings reset to defaults');
  };

  const handleBroadcastSettings = async (): Promise<void> => {
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setBroadcasting(true);

      // Save config first
      await saveConfig();

      const allSettings = {
        mapSettings,
        providerConfig,
        categorySettings,
      };

      await configBroadcastService.broadcastConfig(
        'map',
        allSettings as Record<string, unknown>,
        currentUser.id || 'admin'
      );

      toast.success('Map settings saved and broadcasted successfully');

      await adminApi.createAuditLog({
        adminId: currentUser.id || 'admin',
        action: 'config_broadcast',
        targetType: 'map_config',
        targetId: 'map-settings',
        details: JSON.stringify({ configType: 'map' }),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error('Failed to broadcast map settings');
      logger.error('Broadcast error', err, { configType: 'map' });
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading map configuration...</div>
      </div>
    );
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetToDefaults}>
              Reset to Defaults
            </Button>
            <Button
              onClick={() => {
                void handleBroadcastSettings().catch((error) => {
                  const err = error instanceof Error ? error : new Error(String(error));
                  const logger = createLogger('MapSettingsView');
                  logger.error('Failed to broadcast settings from button', err);
                });
              }}
              disabled={broadcasting}
            >
              <Radio size={16} className="mr-2" />
              {broadcasting ? 'Broadcasting...' : 'Broadcast Settings'}
            </Button>
          </div>
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
                    onValueChange={([value]) => {
                      if (value !== undefined) {
                        handleSettingChange('PRIVACY_GRID_METERS', value);
                      }
                    }}
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
                onCheckedChange={(checked: boolean) =>
                  handleSettingChange('ENABLE_PRECISE_LOCATION', checked)
                }
              />

              <Separator />

              <div className="space-y-3">
                <Label>Precise Location Timeout (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[mapSettings?.PRECISE_LOCATION_TIMEOUT_MINUTES ?? 60]}
                    onValueChange={([value]) => {
                      if (value !== undefined) {
                        handleSettingChange('PRECISE_LOCATION_TIMEOUT_MINUTES', value);
                      }
                    }}
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
                      { handleSettingChange('DEFAULT_RADIUS_KM', parseInt(e.target.value)); }
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
                    onChange={(e) => handleSettingChange('MAX_RADIUS_KM', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Units</Label>
                <Select
                  value={mapSettings?.UNITS ?? 'metric'}
                  onValueChange={(value: string) => {
                    if (value === 'metric' || value === 'imperial') {
                      const unitValue: 'metric' | 'imperial' = value;
                      handleSettingChange('UNITS', unitValue);
                    }
                  }}
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
                  onChange={(e) =>
                    handleSettingChange('COUNTRY_BIAS', e.target.value.toUpperCase())
                  }
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
                onCheckedChange={(checked: boolean) =>
                  handleSettingChange('ENABLE_GEOFENCING', checked)
                }
              />

              <Separator />

              <FeatureFlagItem
                label="Lost Pet Alerts"
                description="Allow users to create and view lost pet alerts on the map"
                checked={mapSettings?.ENABLE_LOST_PET_ALERTS ?? true}
                onCheckedChange={(checked: boolean) =>
                  handleSettingChange('ENABLE_LOST_PET_ALERTS', checked)
                }
              />

              <Separator />

              <FeatureFlagItem
                label="Playdate Planning"
                description="Enable playdate location suggestions and meeting points"
                checked={mapSettings?.ENABLE_PLAYDATE_PLANNING ?? true}
                onCheckedChange={(checked: boolean) =>
                  { handleSettingChange('ENABLE_PLAYDATE_PLANNING', checked); }
                }
              />

              <Separator />

              <FeatureFlagItem
                label="Place Discovery"
                description="Show pet-friendly places and businesses on the map"
                checked={mapSettings?.ENABLE_PLACE_DISCOVERY ?? true}
                onCheckedChange={(checked: boolean) =>
                  handleSettingChange('ENABLE_PLACE_DISCOVERY', checked)
                }
              />

              <Separator />

              <FeatureFlagItem
                label="Auto Center on Location"
                description="Automatically center the map on user's location when loaded"
                checked={mapSettings?.AUTO_CENTER_ON_LOCATION ?? true}
                onCheckedChange={(checked: boolean) =>
                  { handleSettingChange('AUTO_CENTER_ON_LOCATION', checked); }
                }
              />

              <Separator />

              <FeatureFlagItem
                label="Show Distance Labels"
                description="Display distance information on map markers"
                checked={mapSettings?.SHOW_DISTANCE_LABELS ?? true}
                onCheckedChange={(checked: boolean) =>
                  handleSettingChange('SHOW_DISTANCE_LABELS', checked)
                }
              />

              <Separator />

              <FeatureFlagItem
                label="Cluster Markers"
                description="Group nearby markers together to reduce clutter"
                checked={mapSettings?.CLUSTER_MARKERS ?? true}
                onCheckedChange={(checked: boolean) =>
                  handleSettingChange('CLUSTER_MARKERS', checked)
                }
              />

              <Separator />

              <div className="space-y-3">
                <Label>Max Visible Markers</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[mapSettings?.MAX_MARKERS_VISIBLE ?? 50]}
                    onValueChange={([value]) => {
                      if (value !== undefined) {
                        handleSettingChange('MAX_MARKERS_VISIBLE', value);
                      }
                    }}
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
                  <CardDescription>Manage the types of places users can discover</CardDescription>
                </div>
                <Button onClick={() => setIsAddingCategory(true)} size="sm" className="gap-2">
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
                  onCheckedChange={(checked: boolean) => {
                    try {
                      setCategorySettings((current) => ({
                        ...current,
                        enableUserSubmittedPlaces: checked,
                      }));
                    } catch (error) {
                      const err = error instanceof Error ? error : new Error(String(error));
                      logger.error('Failed to update category setting', err);
                    }
                  }}
                />

                <Separator className="my-4" />

                <FeatureFlagItem
                  label="Require Moderation"
                  description="Review user-submitted places before they appear on the map"
                  checked={categorySettings?.requireModeration ?? true}
                  onCheckedChange={(checked: boolean) => {
                    try {
                      setCategorySettings((current) => ({
                        ...current,
                        requireModeration: checked,
                      }));
                    } catch (error) {
                      const err = error instanceof Error ? error : new Error(String(error));
                      logger.error('Failed to update category setting', err);
                    }
                  }}
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
                            { setNewCategory((prev) => ({ ...prev, id: e.target.value })); }
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          placeholder="e.g., Dog Parks"
                          value={newCategory.name}
                          onChange={(e) =>
                            { setNewCategory((prev) => ({ ...prev, name: e.target.value })); }
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
                            { setNewCategory((prev) => ({ ...prev, icon: e.target.value })); }
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
                              { setNewCategory((prev) => ({ ...prev, color: e.target.value })); }
                            }
                            className="w-20"
                          />
                          <Input
                            type="text"
                            value={newCategory.color}
                            onChange={(e) =>
                              { setNewCategory((prev) => ({ ...prev, color: e.target.value })); }
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => { setIsAddingCategory(false); }}>
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
                                  { setEditingCategory({ ...editingCategory, name: e.target.value }); }
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Icon</Label>
                              <Input
                                value={editingCategory.icon}
                                onChange={(e) =>
                                  { setEditingCategory({ ...editingCategory, icon: e.target.value }); }
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
                                  { setEditingCategory({ ...editingCategory, color: e.target.value }); }
                                }
                                className="w-20"
                              />
                              <Input
                                type="text"
                                value={editingCategory.color}
                                onChange={(e) =>
                                  { setEditingCategory({ ...editingCategory, color: e.target.value }); }
                                }
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => { setEditingCategory(null); }}>
                              Cancel
                            </Button>
                            <Button onClick={() => { handleUpdateCategory(editingCategory); }}>
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                              style={{ backgroundColor: `${String(category.color ?? '')}20` }}
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
                              size="sm"
                              onClick={() => setEditingCategory(category)}
                              aria-label={`Edit category ${category.name}`}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              aria-label={`Delete category ${category.name}`}
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
              <CardTitle>Map Provider Configuration</CardTitle>
              <CardDescription>
                Configure map provider API keys and endpoints. Changes take effect immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="map-provider">Map Provider</Label>
                <Select
                  value={providerConfig.PROVIDER}
                  onValueChange={(value) =>
                    updateProviderConfig({ PROVIDER: value as 'maplibre' | 'mapbox' })
                  }
                >
                  <SelectTrigger id="map-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maplibre">MapLibre GL (Open Source)</SelectItem>
                    <SelectItem value="mapbox">Mapbox</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose between MapLibre (open-source) or Mapbox (commercial)
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="map-style-url">Map Style URL</Label>
                <Input
                  id="map-style-url"
                  value={providerConfig.MAP_STYLE_URL}
                  onChange={(e) => updateProviderConfig({ MAP_STYLE_URL: e.target.value })}
                  placeholder="https://api.maptiler.com/maps/streets-v2/style.json?key="
                />
                <p className="text-sm text-muted-foreground">
                  Map style JSON URL. Include ?key= at the end if your provider requires it.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="map-tiles-api-key">Map Tiles API Key</Label>
                <Input
                  id="map-tiles-api-key"
                  type="password"
                  value={providerConfig.MAP_TILES_API_KEY}
                  onChange={(e) => updateProviderConfig({ MAP_TILES_API_KEY: e.target.value })}
                  placeholder="Enter your map tiles API key"
                />
                <p className="text-sm text-muted-foreground">
                  API key for accessing map tiles. Required for displaying maps.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geocoding-api-key">Geocoding API Key</Label>
                <Input
                  id="geocoding-api-key"
                  type="password"
                  value={providerConfig.GEOCODING_API_KEY}
                  onChange={(e) => updateProviderConfig({ GEOCODING_API_KEY: e.target.value })}
                  placeholder="Enter your geocoding API key"
                />
                <p className="text-sm text-muted-foreground">
                  API key for geocoding (address lookup). Required for search and place discovery.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geocoding-endpoint">Geocoding Endpoint</Label>
                <Input
                  id="geocoding-endpoint"
                  value={providerConfig.GEOCODING_ENDPOINT}
                  onChange={(e) => updateProviderConfig({ GEOCODING_ENDPOINT: e.target.value })}
                  placeholder="https://api.maptiler.com/geocoding"
                />
                <p className="text-sm text-muted-foreground">
                  Base URL for geocoding API requests.
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Reset to Environment Defaults</p>
                  <p className="text-sm text-muted-foreground">
                    Restore configuration from environment variables
                  </p>
                </div>
                <Button variant="outline" onClick={resetProviderDefaults}>
                  Reset Provider Config
                </Button>
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Current Configuration Status</p>
                <div className="flex items-center gap-2">
                  <Badge variant={providerConfig.MAP_TILES_API_KEY ? 'default' : 'destructive'}>
                    {providerConfig.MAP_TILES_API_KEY
                      ? 'Tiles API: Configured'
                      : 'Tiles API: Missing'}
                  </Badge>
                  <Badge variant={providerConfig.GEOCODING_API_KEY ? 'default' : 'destructive'}>
                    {providerConfig.GEOCODING_API_KEY
                      ? 'Geocoding API: Configured'
                      : 'Geocoding API: Missing'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

interface FeatureFlagItemProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
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
  );
}
