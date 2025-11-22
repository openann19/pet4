import { useTheme } from 'next-themes';
import type { ToasterProps } from 'sonner';
import { Toaster as Sonner } from 'sonner';

function isValidTheme(theme: string | undefined): theme is 'light' | 'dark' | 'system' {
  return theme === 'light' || theme === 'dark' || theme === 'system';
}

interface CSSPropertiesWithVars extends React.CSSProperties {
  '--normal-bg'?: string;
  '--normal-text'?: string;
  '--normal-border'?: string;
}

const Toaster = (props: ToasterProps) => {
  const { theme } = useTheme();

  // Validate and set theme
  const themeValue: 'light' | 'dark' | 'system' = isValidTheme(theme) ? theme : 'system';

  // Build style object with CSS custom properties
  const style: CSSPropertiesWithVars = {
    '--normal-bg': 'var(--popover)',
    '--normal-text': 'var(--popover-foreground)',
    '--normal-border': 'var(--border)',
  };

  // Build merged style if props.style is provided
  const mergedStyle = props.style ? { ...style, ...props.style } : style;

  // Extract props that are defined, excluding className, style, and theme
  const additionalProps: Record<string, unknown> = {};
  for (const key in props) {
    if (key !== 'className' && key !== 'style' && key !== 'theme') {
      const value = props[key as keyof ToasterProps];
      if (value !== undefined) {
        additionalProps[key] = value;
      }
    }
  }

  // Build complete props object
  const toasterProps = {
    theme: themeValue,
    className: props.className ?? 'toaster group',
    style: mergedStyle,
    ...additionalProps,
  };

  return <Sonner {...toasterProps} />;
};

export { Toaster };
