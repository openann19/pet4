import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import React, { type ReactNode } from 'react';
import { Warning } from '@phosphor-icons/react';
import { ConfigField } from './ConfigField';
import { ServiceTestButton } from './ServiceTestButton';
import type { APIConfig } from '@/api/api-config-api';

interface ProviderOption {
  value: string;
  label: string;
}

interface FieldConfig {
  id: string;
  label: string;
  type?: 'text' | 'password' | 'number' | 'email' | 'tel' | 'url';
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  showSecretToggle?: boolean;
  secretKey?: string;
  step?: string;
  min?: string;
  max?: string;
  helperText?: string;
}

interface SwitchConfig {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface APIConfigSectionProps {
  sectionKey: keyof APIConfig;
  icon: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  provider?: {
    value: string;
    options: ProviderOption[];
    onChange: (value: string) => void;
    disabledValue?: string;
  };
  fields: FieldConfig[];
  switches?: SwitchConfig[];
  showSecrets: Record<string, boolean>;
  onToggleSecret: (key: string) => void;
  onTest: () => void;
  onReset: () => void;
  testingService: string | null;
  testDisabled?: boolean | "";
  alert?: {
    variant: 'warning' | 'info';
    title: string;
    description: string;
  };
  children?: ReactNode;
}

function SectionHeader({
  icon,
  title,
  description,
  enabled,
  onEnabledChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}) {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">{icon}</div>
          <div className="space-y-0.5">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
    </CardHeader>
  );
}

function ProviderSelect({
  sectionKey,
  provider,
}: {
  sectionKey: keyof APIConfig;
  provider: {
    value: string;
    options: ProviderOption[];
    onChange: (value: string) => void;
  };
}) {
  return (
    <div className="space-y-3">
      <Label htmlFor={`${sectionKey}-provider`}>Provider</Label>
      <Select value={provider.value} onValueChange={provider.onChange}>
        <SelectTrigger id={`${sectionKey}-provider`} className="w-full">
          <SelectValue placeholder="Select provider" />
        </SelectTrigger>
        <SelectContent>
          {provider.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FieldsList({
  fields,
  showSecrets,
  onToggleSecret,
}: {
  fields: FieldConfig[];
  showSecrets: Record<string, boolean>;
  onToggleSecret: (key: string) => void;
}) {
  return (
    <>
      {fields.map((field) => (
        <div key={field.id}>
          <ConfigField
            id={field.id}
            label={field.label}
            type={field.type}
            value={field.value}
            onChange={field.onChange}
            placeholder={field.placeholder}
            showSecretToggle={field.showSecretToggle}
            isSecretVisible={field.secretKey ? showSecrets[field.secretKey] ?? false : false}
            onToggleSecret={field.secretKey ? () => onToggleSecret(field.secretKey!) : undefined}
            secretToggleAriaLabel={
              field.secretKey
                ? showSecrets[field.secretKey] ?? false
                  ? `Hide ${field.label}`
                  : `Show ${field.label}`
                : undefined
            }
            step={field.step}
            min={field.min}
            max={field.max}
          />
          {field.helperText && (
            <p className="text-xs text-muted-foreground mt-1">{field.helperText}</p>
          )}
        </div>
      ))}
    </>
  );
}

function SwitchesList({ switches }: { switches: SwitchConfig[] }) {
  return (
    <>
      {switches.map((switchConfig, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>{switchConfig.label}</Label>
            {switchConfig.description && (
              <p className="text-sm text-muted-foreground">{switchConfig.description}</p>
            )}
          </div>
          <Switch checked={switchConfig.checked} onCheckedChange={switchConfig.onChange} />
        </div>
      ))}
    </>
  );
}

function APIConfigContent({
  sectionKey,
  provider,
  fields,
  switches,
  showSecrets,
  onToggleSecret,
  isProviderDisabled,
  children,
  alert,
}: {
  sectionKey: keyof APIConfig;
  provider?: APIConfigSectionProps['provider'];
  fields: APIConfigSectionProps['fields'];
  switches?: APIConfigSectionProps['switches'];
  showSecrets: APIConfigSectionProps['showSecrets'];
  onToggleSecret: (key: string) => void;
  isProviderDisabled: boolean;
  children?: React.ReactNode;
  alert?: APIConfigSectionProps['alert'];
}): React.JSX.Element {
  return (
    <>
      {alert && (
        <Alert variant={alert.variant} className="shadow-sm">
          <Warning size={20} weight="fill" />
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      )}
      {provider && <ProviderSelect sectionKey={sectionKey} provider={provider} />}
      {!isProviderDisabled && (
        <>
          <FieldsList fields={fields} showSecrets={showSecrets} onToggleSecret={onToggleSecret} />
          {switches && <SwitchesList switches={switches} />}
          {children}
        </>
      )}
    </>
  );
}

function APIConfigActions({
  title,
  sectionTesting,
  isTestDisabled,
  isProviderDisabled,
  onTest,
  onReset,
}: {
  title: string;
  sectionTesting: boolean;
  isTestDisabled: boolean;
  isProviderDisabled: boolean;
  onTest: () => void;
  onReset: () => void;
}): React.JSX.Element {
  return (
    <div className="flex gap-2">
      <ServiceTestButton
        isTesting={sectionTesting}
        onTest={onTest}
        disabled={isTestDisabled || isProviderDisabled}
      />
      <Button variant="outline" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}

export function APIConfigSection({
  sectionKey,
  icon,
  title,
  description,
  enabled,
  onEnabledChange,
  provider,
  fields,
  switches,
  showSecrets,
  onToggleSecret,
  onTest,
  onReset,
  testingService,
  testDisabled = false,
  alert,
  children,
}: APIConfigSectionProps) {
  const isProviderDisabled = Boolean(provider?.disabledValue && provider.value === provider.disabledValue);
  const sectionTesting = testingService === title;
  const isTestDisabled = Boolean(testDisabled);

  return (
    <Card className="shadow-sm border-border/50">
      <SectionHeader
        icon={icon}
        title={title}
        description={description}
        enabled={enabled}
        onEnabledChange={onEnabledChange}
      />
      <CardContent className="space-y-6">
        <APIConfigContent
          sectionKey={sectionKey}
          provider={provider}
          fields={fields}
          switches={switches}
          showSecrets={showSecrets}
          onToggleSecret={onToggleSecret}
          isProviderDisabled={isProviderDisabled}
          children={children}
          alert={alert}
        />
        <APIConfigActions
          title={title}
          sectionTesting={sectionTesting}
          isTestDisabled={isTestDisabled}
          isProviderDisabled={isProviderDisabled}
          onTest={onTest}
          onReset={onReset}
        />
      </CardContent>
    </Card>
  );
}
