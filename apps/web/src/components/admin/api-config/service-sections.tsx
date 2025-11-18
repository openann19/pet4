import type { APIConfig } from '@/api/api-config-api';
import { APIConfigSection } from './APIConfigSection';
import { ConfigField } from './ConfigField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  MapPin,
  Robot,
  ShieldCheck,
  Image as ImageIcon,
  Bell,
  Envelope,
  Database,
  ChartBar,
  VideoCamera,
  Warning,
} from '@phosphor-icons/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ServiceSectionProps {
  config: APIConfig;
  showSecrets: Record<string, boolean>;
  onToggleSecret: (key: string) => void;
  onUpdateConfig: (section: keyof APIConfig, field: string, value: string | boolean | number) => void;
  onTest: (service: string) => Promise<void>;
  onReset: (section: keyof APIConfig) => void;
  testingService: string | null;
  triggerHaptic: (type: 'light' | 'medium' | 'selection' | 'success') => void;
}

export function MapsServiceSection({
  config,
  showSecrets,
  onToggleSecret,
  onUpdateConfig,
  onTest,
  onReset,
  testingService,
  triggerHaptic,
}: ServiceSectionProps) {
  return (
    <APIConfigSection
      sectionKey="maps"
      icon={<MapPin size={20} className="text-blue-600 dark:text-blue-400" weight="fill" />}
      title="Maps Service"
      description="Configure map provider for location features"
      enabled={config?.maps?.enabled ?? true}
      onEnabledChange={(checked) => {
        triggerHaptic('selection');
        onUpdateConfig('maps', 'enabled', checked);
      }}
      provider={{
        value: config?.maps?.provider ?? 'openstreetmap',
        options: [
          { value: 'google', label: 'Google Maps' },
          { value: 'mapbox', label: 'Mapbox' },
          { value: 'openstreetmap', label: 'OpenStreetMap (Free)' },
        ],
        onChange: (value) => {
          triggerHaptic('selection');
          onUpdateConfig('maps', 'provider', value);
        },
        disabledValue: 'openstreetmap',
      }}
      fields={[
        {
          id: 'maps-key',
          label: 'API Key',
          type: 'password',
          value: config?.maps?.apiKey ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('maps', 'apiKey', value);
          },
          placeholder: 'sk_...',
          showSecretToggle: true,
          secretKey: 'maps-key',
        },
        {
          id: 'maps-rate',
          label: 'Rate Limit (requests/min)',
          type: 'number',
          value: config?.maps?.rateLimit ?? 100,
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('maps', 'rateLimit', value);
          },
        },
      ]}
      showSecrets={showSecrets}
      onToggleSecret={(key) => {
        triggerHaptic('light');
        onToggleSecret(key);
      }}
      onTest={async () => {
        triggerHaptic('light');
        await onTest('Maps');
        triggerHaptic('success');
      }}
      onReset={() => {
        triggerHaptic('medium');
        onReset('maps');
      }}
      testingService={testingService}
      testDisabled={Boolean(config?.maps?.provider === 'openstreetmap')}
    />
  );
}

export function AIServiceSection({
  config,
  showSecrets,
  onToggleSecret,
  onUpdateConfig,
  onTest,
  onReset,
  testingService,
  triggerHaptic,
}: ServiceSectionProps) {
  return (
    <APIConfigSection
      sectionKey="ai"
      icon={<Robot size={24} className="text-purple-600" weight="fill" />}
      title="AI Service"
      description="Configure AI provider for matching and analysis"
      enabled={config?.ai?.enabled ?? true}
      onEnabledChange={(checked) => {
        triggerHaptic('selection');
        onUpdateConfig('ai', 'enabled', checked);
      }}
      provider={{
        value: config?.ai?.provider ?? 'spark',
        options: [
          { value: 'spark', label: 'Spark AI (Included)' },
          { value: 'openai', label: 'OpenAI' },
          { value: 'anthropic', label: 'Anthropic' },
        ],
        onChange: (value) => {
          triggerHaptic('selection');
          onUpdateConfig('ai', 'provider', value);
        },
        disabledValue: 'spark',
      }}
      fields={[
        {
          id: 'ai-key',
          label: 'API Key',
          type: 'password',
          value: config?.ai?.apiKey ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('ai', 'apiKey', value);
          },
          placeholder: 'sk_...',
          showSecretToggle: true,
          secretKey: 'ai-key',
        },
      ]}
      showSecrets={showSecrets}
      onToggleSecret={(key) => {
        triggerHaptic('light');
        onToggleSecret(key);
      }}
      onTest={async () => {
        triggerHaptic('light');
        await onTest('AI');
        triggerHaptic('success');
      }}
      onReset={() => {
        triggerHaptic('medium');
        onReset('ai');
      }}
      testingService={testingService}
    >
      <div className="space-y-3">
        <Label htmlFor="ai-model-select">Model</Label>
        <Select
          value={config?.ai?.model ?? 'gpt-4o'}
          onValueChange={(value) => {
            triggerHaptic('selection');
            onUpdateConfig('ai', 'model', value);
          }}
        >
          <SelectTrigger id="ai-model-select" className="w-full">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
            <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
            <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ConfigField
          id="ai-tokens-grid"
          label="Max Tokens"
          type="number"
          value={config?.ai?.maxTokens ?? 1000}
          onChange={(value) => {
            triggerHaptic('selection');
            onUpdateConfig('ai', 'maxTokens', value);
          }}
        />
        <ConfigField
          id="ai-temp-grid"
          label="Temperature"
          type="number"
          value={config?.ai?.temperature ?? 0.7}
          onChange={(value) => {
            triggerHaptic('selection');
            onUpdateConfig('ai', 'temperature', value);
          }}
          step="0.1"
          min="0"
          max="2"
        />
      </div>
    </APIConfigSection>
  );
}

export {
  KYCSection,
  ModerationSection,
  SMSSection,
  EmailSection,
  StorageSection,
  AnalyticsSection,
  LiveKitSection,
} from './section-helpers';

