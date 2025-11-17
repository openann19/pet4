export type AriaLiveRegion = 'polite' | 'assertive' | 'off';
export type AriaRelevant = 'additions' | 'removals' | 'text' | 'all' | 'additions text';
export type AriaCurrent = 'page' | 'step' | 'location' | 'date' | 'time' | boolean;

export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-live'?: AriaLiveRegion;
  'aria-atomic'?: boolean;
  'aria-relevant'?: AriaRelevant;
  'aria-busy'?: boolean;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean | 'mixed';
  'aria-current'?: AriaCurrent;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-required'?: boolean;
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-modal'?: boolean;
  'aria-controls'?: string;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  role?: string;
}

export interface AriaLabelOptions {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
}

export function getAriaLabelAttributes(options: AriaLabelOptions): Partial<AriaAttributes> {
  const attrs: Partial<AriaAttributes> = {};
  
  if (options.label) {
    attrs['aria-label'] = options.label;
  }
  
  if (options.labelledBy) {
    attrs['aria-labelledby'] = options.labelledBy;
  }
  
  if (options.describedBy) {
    attrs['aria-describedby'] = options.describedBy;
  }
  
  return attrs;
}

export interface AriaLiveRegionOptions {
  live?: AriaLiveRegion;
  atomic?: boolean;
  relevant?: AriaRelevant;
  busy?: boolean;
}

export function getAriaLiveRegionAttributes(options: AriaLiveRegionOptions = {}): Partial<AriaAttributes> {
  const attrs: Partial<AriaAttributes> = {};
  
  if (options.live !== undefined) {
    attrs['aria-live'] = options.live;
  }
  
  if (options.atomic !== undefined) {
    attrs['aria-atomic'] = options.atomic;
  }
  
  if (options.relevant !== undefined) {
    attrs['aria-relevant'] = options.relevant;
  }
  
  if (options.busy !== undefined) {
    attrs['aria-busy'] = options.busy;
  }
  
  return attrs;
}

export interface AriaButtonOptions extends AriaLabelOptions {
  pressed?: boolean | 'mixed';
  expanded?: boolean;
  disabled?: boolean;
  controls?: string;
  hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}

export function getAriaButtonAttributes(options: AriaButtonOptions): Partial<AriaAttributes> {
  const attrs = getAriaLabelAttributes(options);
  
  if (options.pressed !== undefined) {
    attrs['aria-pressed'] = options.pressed;
  }
  
  if (options.expanded !== undefined) {
    attrs['aria-expanded'] = options.expanded;
  }
  
  if (options.disabled !== undefined) {
    attrs['aria-disabled'] = options.disabled;
  }
  
  if (options.controls) {
    attrs['aria-controls'] = options.controls;
  }
  
  if (options.hasPopup !== undefined) {
    attrs['aria-haspopup'] = options.hasPopup;
  }
  
  return attrs;
}

export interface AriaFormFieldOptions extends AriaLabelOptions {
  invalid?: boolean | 'grammar' | 'spelling';
  required?: boolean;
  disabled?: boolean;
}

export function getAriaFormFieldAttributes(options: AriaFormFieldOptions): Partial<AriaAttributes> {
  const attrs = getAriaLabelAttributes(options);
  
  if (options.invalid !== undefined) {
    attrs['aria-invalid'] = options.invalid;
  }
  
  if (options.required !== undefined) {
    attrs['aria-required'] = options.required;
  }
  
  if (options.disabled !== undefined) {
    attrs['aria-disabled'] = options.disabled;
  }
  
  return attrs;
}

export interface AriaNavigationOptions extends AriaLabelOptions {
  current?: AriaCurrent;
}

export function getAriaNavigationAttributes(options: AriaNavigationOptions): Partial<AriaAttributes> {
  const attrs = getAriaLabelAttributes(options);
  
  if (options.current !== undefined) {
    attrs['aria-current'] = options.current;
  }
  
  return attrs;
}

export interface AriaAlertOptions extends AriaLabelOptions {
  live?: AriaLiveRegion;
  atomic?: boolean;
  role?: 'alert' | 'alertdialog' | 'status';
}

export function getAriaAlertAttributes(options: AriaAlertOptions = {}): Partial<AriaAttributes> {
  const attrs: Partial<AriaAttributes> = {};
  
  if (options.role) {
    attrs.role = options.role;
  } else if (options.live !== undefined || options.atomic !== undefined) {
    attrs.role = 'alert';
  }
  
  if (options.label) {
    attrs['aria-label'] = options.label;
  }
  
  if (options.labelledBy) {
    attrs['aria-labelledby'] = options.labelledBy;
  }
  
  if (options.describedBy) {
    attrs['aria-describedby'] = options.describedBy;
  }
  
  if (options.live !== undefined) {
    attrs['aria-live'] = options.live;
  } else if (options.role === 'alert' || options.role === 'alertdialog') {
    attrs['aria-live'] = 'assertive';
  } else if (options.role === 'status') {
    attrs['aria-live'] = 'polite';
  }
  
  if (options.atomic !== undefined) {
    attrs['aria-atomic'] = options.atomic;
  } else if (options.role === 'alert' || options.role === 'alertdialog') {
    attrs['aria-atomic'] = true;
  }
  
  return attrs;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getToastAriaAttributes(type: 'success' | 'error' | 'warning' | 'info'): Partial<AriaAttributes> {
  const role = type === 'error' ? 'alert' : 'status';
  const live = type === 'error' ? 'assertive' : 'polite';
  
  return {
    role,
    'aria-live': live,
    'aria-atomic': true,
  };
}

export function getIconButtonAriaLabel(iconName: string, action?: string): string {
  if (action) {
    return `${action} ${iconName}`;
  }
  return iconName;
}

/**
 * Announce a message to screen readers using ARIA live regions
 * @param message - The message to announce
 * @param priority - The priority level ('polite' or 'assertive')
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  // Create a temporary live region for the announcement
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.style.position = 'absolute';
  liveRegion.style.left = '-10000px';
  liveRegion.style.width = '1px';
  liveRegion.style.height = '1px';
  liveRegion.style.overflow = 'hidden';
  
  document.body.appendChild(liveRegion);
  
  // Add the message after a small delay to ensure it's announced
  setTimeout(() => {
    liveRegion.textContent = message;
    
    // Remove the live region after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, 100);
}
