import type { APIConfig } from '@/api/api-config-api';
import {
  ShieldCheck,
  Image as ImageIcon,
  Bell,
  Envelope,
  Database,
  ChartBar,
  VideoCamera,
} from '@phosphor-icons/react';
import { APIConfigSection } from './APIConfigSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';

interface SectionHelperProps {
  config: APIConfig;
  showSecrets: Record<string, boolean>;
  onToggleSecret: (key: string) => void;
  onUpdateConfig: (section: keyof APIConfig, field: string, value: string | boolean | number) => void;
  onTest: (service: string) => Promise<void>;
  onReset: (section: keyof APIConfig) => void;
  testingService: string | null;
  triggerHaptic: (type: 'light' | 'medium' | 'selection' | 'success') => void;
}

export function KYCSection({
  config,
  showSecrets,
  onToggleSecret,
  onUpdateConfig,
  onTest,
  onReset,
  testingService,
  triggerHaptic,
}: SectionHelperProps) {
  return (
    <APIConfigSection
      sectionKey="kyc"
      icon={<ShieldCheck size={24} className="text-green-600" weight="fill" />}
      title="KYC / Identity Verification"
      description="Configure identity verification service"
      enabled={config?.kyc?.enabled ?? true}
      onEnabledChange={(checked) => {
        triggerHaptic('selection');
        onUpdateConfig('kyc', 'enabled', checked);
      }}
      provider={{
        value: config?.kyc?.provider ?? 'manual',
        options: [
          { value: 'manual', label: 'Manual Review' },
          { value: 'stripe', label: 'Stripe Identity' },
          { value: 'onfido', label: 'Onfido' },
          { value: 'jumio', label: 'Jumio' },
        ],
        onChange: (value) => {
          triggerHaptic('selection');
          onUpdateConfig('kyc', 'provider', value);
        },
        disabledValue: 'manual',
      }}
      fields={[
        {
          id: 'kyc-key',
          label: 'API Key',
          type: 'password',
          value: config?.kyc?.apiKey ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('kyc', 'apiKey', value);
          },
          placeholder: 'sk_...',
          showSecretToggle: true,
          secretKey: 'kyc-key',
        },
      ]}
      switches={[
        {
          label: 'Auto-approve Verifications',
          description: 'Automatically approve successful verification checks',
          checked: config?.kyc?.autoApprove ?? false,
          onChange: (checked) => {
            triggerHaptic('selection');
            onUpdateConfig('kyc', 'autoApprove', checked);
          },
        },
        {
          label: 'Require Documents',
          description: 'Require photo ID and proof of pet ownership',
          checked: config?.kyc?.requireDocuments ?? true,
          onChange: (checked) => {
            triggerHaptic('selection');
            onUpdateConfig('kyc', 'requireDocuments', checked);
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
        await onTest('KYC');
        triggerHaptic('success');
      }}
      onReset={() => {
        triggerHaptic('medium');
        onReset('kyc');
      }}
      testingService={testingService}
    />
  );
}

export function ModerationSection({
  config,
  showSecrets,
  onToggleSecret,
  onUpdateConfig,
  onTest,
  onReset,
  testingService,
  triggerHaptic,
}: SectionHelperProps) {
  return (
    <APIConfigSection
      sectionKey="photoModeration"
      icon={<ImageIcon size={24} className="text-red-600" weight="fill" />}
      title="Photo Moderation"
      description="Configure automated content moderation"
      enabled={config?.photoModeration?.enabled ?? true}
      onEnabledChange={(checked) => {
        triggerHaptic('selection');
        onUpdateConfig('photoModeration', 'enabled', checked);
      }}
      provider={{
        value: config?.photoModeration?.provider ?? 'spark',
        options: [
          { value: 'spark', label: 'Spark Moderation (Included)' },
          { value: 'openai', label: 'OpenAI Vision' },
          { value: 'google-vision', label: 'Google Cloud Vision' },
          { value: 'aws-rekognition', label: 'AWS Rekognition' },
        ],
        onChange: (value) => {
          triggerHaptic('selection');
          onUpdateConfig('photoModeration', 'provider', value);
        },
        disabledValue: 'spark',
      }}
      fields={[
        {
          id: 'mod-key',
          label: 'API Key',
          type: 'password',
          value: config?.photoModeration?.apiKey ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('photoModeration', 'apiKey', value);
          },
          placeholder: 'sk_...',
          showSecretToggle: true,
          secretKey: 'mod-key',
        },
      ]}
      switches={[
        {
          label: 'Auto-reject Violations',
          description: 'Automatically reject photos that violate policies',
          checked: config?.photoModeration?.autoReject ?? false,
          onChange: (checked) => {
            triggerHaptic('selection');
            onUpdateConfig('photoModeration', 'autoReject', checked);
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
        await onTest('Photo Moderation');
        triggerHaptic('success');
      }}
      onReset={() => {
        triggerHaptic('medium');
        onReset('photoModeration');
      }}
      testingService={testingService}
    >
      <div className="space-y-3">
        <Label htmlFor="mod-threshold-range">
          Confidence Threshold ({Math.round((config?.photoModeration?.confidenceThreshold ?? 0.8) * 100)}%)
        </Label>
        <Input
          id="mod-threshold-range"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config?.photoModeration?.confidenceThreshold ?? 0.8}
          onChange={(e) => {
            triggerHaptic('selection');
            onUpdateConfig('photoModeration', 'confidenceThreshold', parseFloat(e.target.value));
          }}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Higher values are more strict but may have false positives
        </p>
      </div>
    </APIConfigSection>
  );
}

export function SMSSection({
  config,
  showSecrets,
  onToggleSecret,
  onUpdateConfig,
  onTest,
  onReset,
  testingService,
  triggerHaptic,
}: SectionHelperProps) {
  return (
    <APIConfigSection
      sectionKey="sms"
      icon={<Bell size={24} className="text-indigo-600" weight="fill" />}
      title="SMS Service"
      description="Configure SMS notifications and verification"
      enabled={config?.sms?.enabled ?? false}
      onEnabledChange={(checked) => {
        triggerHaptic('selection');
        onUpdateConfig('sms', 'enabled', checked);
      }}
      provider={{
        value: config?.sms?.provider ?? 'disabled',
        options: [
          { value: 'disabled', label: 'Disabled' },
          { value: 'twilio', label: 'Twilio' },
          { value: 'vonage', label: 'Vonage (Nexmo)' },
          { value: 'aws-sns', label: 'AWS SNS' },
        ],
        onChange: (value) => {
          triggerHaptic('selection');
          onUpdateConfig('sms', 'provider', value);
        },
        disabledValue: 'disabled',
      }}
      fields={[
        {
          id: 'sms-key',
          label: 'API Key / Account SID',
          type: 'password',
          value: config?.sms?.apiKey ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('sms', 'apiKey', value);
          },
          showSecretToggle: true,
          secretKey: 'sms-key',
        },
        {
          id: 'sms-secret',
          label: 'API Secret / Auth Token',
          type: 'password',
          value: config?.sms?.apiSecret ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('sms', 'apiSecret', value);
          },
          showSecretToggle: true,
          secretKey: 'sms-secret',
        },
        {
          id: 'sms-from',
          label: 'From Number',
          type: 'tel',
          value: config?.sms?.fromNumber ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('sms', 'fromNumber', value);
          },
          placeholder: '+1234567890',
        },
      ]}
      showSecrets={showSecrets}
      onToggleSecret={(key) => {
        triggerHaptic('light');
        onToggleSecret(key);
      }}
      onTest={async () => {
        triggerHaptic('light');
        await onTest('SMS');
        triggerHaptic('success');
      }}
      onReset={() => {
        triggerHaptic('medium');
        onReset('sms');
      }}
      testingService={testingService}
      testDisabled={config?.sms?.provider === 'disabled'}
    />
  );
}

export function EmailSection({
  config,
  showSecrets,
  onToggleSecret,
  onUpdateConfig,
  onTest,
  onReset,
  testingService,
  triggerHaptic,
}: SectionHelperProps) {
  return (
    <APIConfigSection
      sectionKey="email"
      icon={<Envelope size={24} className="text-cyan-600" weight="fill" />}
      title="Email Service"
      description="Configure email notifications and alerts"
      enabled={config?.email?.enabled ?? false}
      onEnabledChange={(checked) => {
        triggerHaptic('selection');
        onUpdateConfig('email', 'enabled', checked);
      }}
      provider={{
        value: config?.email?.provider ?? 'disabled',
        options: [
          { value: 'disabled', label: 'Disabled' },
          { value: 'sendgrid', label: 'SendGrid' },
          { value: 'mailgun', label: 'Mailgun' },
          { value: 'aws-ses', label: 'AWS SES' },
        ],
        onChange: (value) => {
          triggerHaptic('selection');
          onUpdateConfig('email', 'provider', value);
        },
        disabledValue: 'disabled',
      }}
      fields={[
        {
          id: 'email-key',
          label: 'API Key',
          type: 'password',
          value: config?.email?.apiKey ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('email', 'apiKey', value);
          },
          showSecretToggle: true,
          secretKey: 'email-key',
        },
        {
          id: 'email-from',
          label: 'From Email',
          type: 'email',
          value: config?.email?.fromEmail ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('email', 'fromEmail', value);
          },
          placeholder: 'noreply@pawfectmatch.com',
        },
        {
          id: 'email-name',
          label: 'From Name',
          type: 'text',
          value: config?.email?.fromName ?? 'PawfectMatch',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('email', 'fromName', value);
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
        await onTest('Email');
        triggerHaptic('success');
      }}
      onReset={() => {
        triggerHaptic('medium');
        onReset('email');
      }}
      testingService={testingService}
      testDisabled={config?.email?.provider === 'disabled'}
    />
  );
}

export function StorageSection({
  config,
  showSecrets,
  onToggleSecret,
  onUpdateConfig,
  onTest,
  onReset,
  testingService,
  triggerHaptic,
}: SectionHelperProps) {
  return (
    <APIConfigSection
      sectionKey="storage"
      icon={<Database size={24} className="text-orange-600" weight="fill" />}
      title="Storage Service"
      description="Configure file and image storage"
      enabled={config?.storage?.enabled ?? true}
      onEnabledChange={(checked) => {
        triggerHaptic('selection');
        onUpdateConfig('storage', 'enabled', checked);
      }}
      provider={{
        value: config?.storage?.provider ?? 'local',
        options: [
          { value: 'local', label: 'Local Storage' },
          { value: 'aws-s3', label: 'AWS S3' },
          { value: 'cloudflare-r2', label: 'Cloudflare R2' },
        ],
        onChange: (value) => {
          triggerHaptic('selection');
          onUpdateConfig('storage', 'provider', value);
        },
        disabledValue: 'local',
      }}
      fields={[
        {
          id: 'storage-key',
          label: 'Access Key ID',
          type: 'password',
          value: config?.storage?.apiKey ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('storage', 'apiKey', value);
          },
          showSecretToggle: true,
          secretKey: 'storage-key',
        },
        {
          id: 'storage-secret',
          label: 'Secret Access Key',
          type: 'password',
          value: config?.storage?.apiSecret ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('storage', 'apiSecret', value);
          },
          showSecretToggle: true,
          secretKey: 'storage-secret',
        },
      ]}
      showSecrets={showSecrets}
      onToggleSecret={(key) => {
        triggerHaptic('light');
        onToggleSecret(key);
      }}
      onTest={async () => {
        triggerHaptic('light');
        await onTest('Storage');
        triggerHaptic('success');
      }}
      onReset={() => {
        triggerHaptic('medium');
        onReset('storage');
      }}
      testingService={testingService}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label htmlFor="storage-bucket">Bucket Name</Label>
          <Input
            id="storage-bucket"
            value={config?.storage?.bucket ?? ''}
            onChange={(e) => {
              triggerHaptic('selection');
              onUpdateConfig('storage', 'bucket', e.target.value);
            }}
            placeholder="my-bucket"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="storage-region">Region</Label>
          <Input
            id="storage-region"
            value={config?.storage?.region ?? 'us-east-1'}
            onChange={(e) => {
              triggerHaptic('selection');
              onUpdateConfig('storage', 'region', e.target.value);
            }}
            placeholder="us-east-1"
          />
        </div>
      </div>
    </APIConfigSection>
  );
}

export function AnalyticsSection({
  config,
  showSecrets,
  onToggleSecret,
  onUpdateConfig,
  onTest,
  onReset,
  testingService,
  triggerHaptic,
}: SectionHelperProps) {
  const isGoogleAnalytics = config?.analytics?.provider === 'google-analytics';
  return (
    <APIConfigSection
      sectionKey="analytics"
      icon={<ChartBar size={24} className="text-pink-600" weight="fill" />}
      title="Analytics Service"
      description="Configure user analytics and tracking"
      enabled={config?.analytics?.enabled ?? false}
      onEnabledChange={(checked) => {
        triggerHaptic('selection');
        onUpdateConfig('analytics', 'enabled', checked);
      }}
      provider={{
        value: config?.analytics?.provider ?? 'disabled',
        options: [
          { value: 'disabled', label: 'Disabled' },
          { value: 'google-analytics', label: 'Google Analytics' },
          { value: 'mixpanel', label: 'Mixpanel' },
          { value: 'amplitude', label: 'Amplitude' },
        ],
        onChange: (value) => {
          triggerHaptic('selection');
          onUpdateConfig('analytics', 'provider', value);
        },
        disabledValue: 'disabled',
      }}
      fields={[
        {
          id: 'analytics-key',
          label: isGoogleAnalytics ? 'Measurement ID' : 'API Key',
          type: 'password',
          value: config?.analytics?.apiKey ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('analytics', 'apiKey', value);
          },
          placeholder: isGoogleAnalytics ? 'G-XXXXXXXXXX' : 'api_key',
          showSecretToggle: true,
          secretKey: 'analytics-key',
        },
      ]}
      showSecrets={showSecrets}
      onToggleSecret={(key) => {
        triggerHaptic('light');
        onToggleSecret(key);
      }}
      onTest={async () => {
        triggerHaptic('light');
        await onTest('Analytics');
        triggerHaptic('success');
      }}
      onReset={() => {
        triggerHaptic('medium');
        onReset('analytics');
      }}
      testingService={testingService}
      testDisabled={config?.analytics?.provider === 'disabled'}
    />
  );
}

export function LiveKitSection({
  config,
  showSecrets,
  onToggleSecret,
  onUpdateConfig,
  onTest,
  onReset,
  testingService,
  triggerHaptic,
}: SectionHelperProps) {
  return (
    <APIConfigSection
      sectionKey="livekit"
      icon={<VideoCamera size={24} className="text-violet-600" weight="fill" />}
      title="LiveKit Streaming"
      description="Configure live streaming and video chat"
      enabled={config?.livekit?.enabled ?? false}
      onEnabledChange={(checked) => {
        triggerHaptic('selection');
        onUpdateConfig('livekit', 'enabled', checked);
      }}
      fields={[
        {
          id: 'livekit-key',
          label: 'API Key',
          type: 'password',
          value: config?.livekit?.apiKey ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('livekit', 'apiKey', value);
          },
          placeholder: 'APxxxxxxxxxxxx',
          showSecretToggle: true,
          secretKey: 'livekit-key',
        },
        {
          id: 'livekit-secret',
          label: 'API Secret',
          type: 'password',
          value: config?.livekit?.apiSecret ?? '',
          onChange: (value) => {
            triggerHaptic('selection');
            onUpdateConfig('livekit', 'apiSecret', value);
          },
          placeholder: 'secret_...',
          showSecretToggle: true,
          secretKey: 'livekit-secret',
        },
      ]}
      showSecrets={showSecrets}
      onToggleSecret={(key) => {
        triggerHaptic('light');
        onToggleSecret(key);
      }}
      onTest={async () => {
        triggerHaptic('light');
        await onTest('LiveKit');
        triggerHaptic('success');
      }}
      onReset={() => {
        triggerHaptic('medium');
        onReset('livekit');
      }}
      testingService={testingService}
      testDisabled={!config?.livekit?.enabled}
      alert={{
        variant: 'warning',
        title: 'Server-Side Implementation Required',
        description:
          'LiveKit tokens must be generated server-side for security. Configure these credentials on your backend server and use them to sign tokens via API.',
      }}
    >
      <div className="space-y-3">
        <Label htmlFor="livekit-url-helper">WebSocket URL</Label>
        <Input
          id="livekit-url-helper"
          type="url"
          value={config?.livekit?.wsUrl ?? ''}
          onChange={(e) => {
            triggerHaptic('selection');
            onUpdateConfig('livekit', 'wsUrl', e.target.value);
          }}
          placeholder="wss://your-project.livekit.cloud"
        />
        <p className="text-xs text-muted-foreground">Your LiveKit server WebSocket URL</p>
      </div>
    </APIConfigSection>
  );
}

