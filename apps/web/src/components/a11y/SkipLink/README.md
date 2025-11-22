# SkipLink

A skip link component that allows keyboard users to bypass navigation and jump directly to the main content. Essential for WCAG 2.1 AA compliance.

## Overview

`SkipLink` provides a hidden link that becomes visible when focused, allowing keyboard users to skip repetitive navigation elements and access main content immediately. This is a critical accessibility feature for users who navigate with keyboards or assistive technologies.

## Props

This component accepts no props. It's a simple, self-contained accessibility feature.

## Usage

### Basic Implementation

```tsx
import { SkipLink } from '@/components/a11y/SkipLink';

function App() {
  return (
    <div>
      <SkipLink />
      <nav>
        {/* Navigation content */}
      </nav>
      <main id="main-content">
        {/* Main content */}
      </main>
    </div>
  );
}
```

### With React Router

```tsx
import { SkipLink } from '@/components/a11y/SkipLink';
import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
```

### Multiple Skip Links

For complex layouts, you can add multiple skip links:

```tsx
import { SkipLink } from '@/components/a11y/SkipLink';

function ComplexLayout() {
  return (
    <div>
      <SkipLink />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50">
        Skip to main content
      </a>
      <a href="#search" className="sr-only focus:not-sr-only focus:absolute focus:top-16 focus:left-4 focus:z-50">
        Skip to search
      </a>

      <nav>...</nav>
      <main id="main-content">...</main>
      <aside id="search">...</aside>
    </div>
  );
}
```

## Accessibility

- ✅ **WCAG 2.1 AA Compliant**: Meets requirement 2.4.1 (Bypass Blocks)
- ✅ **Keyboard Accessible**: Visible when focused via Tab key
- ✅ **Screen Reader Friendly**: Announced as "Skip to main content" link
- ✅ **High Contrast**: Uses primary color with sufficient contrast ratio
- ✅ **Focus Indicators**: Clear focus ring for keyboard navigation

### A11y Features

1. **Screen Reader Only by Default**: Uses `sr-only` class to hide visually but keep accessible
2. **Visible on Focus**: Becomes visible when focused via keyboard navigation
3. **Proper Positioning**: Positioned at top-left with high z-index
4. **Clear Focus Ring**: Uses `ring-2` with offset for clear focus indication
5. **Semantic HTML**: Uses native `<a>` element with proper `href`

## Styling

The component uses Tailwind CSS classes:

- `sr-only`: Hidden visually but accessible to screen readers
- `focus:not-sr-only`: Visible when focused
- `focus:absolute`: Positioned absolutely when focused
- `focus:top-4 focus:left-4`: Positioned at top-left corner
- `focus:z-50`: High z-index to appear above other content
- `focus:bg-primary`: Uses theme primary color
- `focus:text-primary-foreground`: Contrasting text color
- `focus:px-4 focus:py-2`: Padding for clickable area
- `focus:rounded-md`: Rounded corners
- `focus:shadow-lg`: Drop shadow for visibility
- `focus:outline-none`: Removes default outline
- `focus:ring-2 focus:ring-ring`: Custom focus ring
- `focus:ring-offset-2`: Ring offset for better visibility

## Target Element

The skip link targets `#main-content` by default. Ensure your main content area has this ID:

```tsx
<main id="main-content">
  {/* Your main content */}
</main>
```

## Testing

### Manual Testing

1. Navigate to page with keyboard (Tab key)
2. First Tab should focus the skip link
3. Skip link should become visible
4. Press Enter to activate
5. Focus should move to main content

### Automated Testing

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkipLink } from '@/components/a11y/SkipLink';

test('skip link is accessible and functional', async () => {
  render(
    <>
      <SkipLink />
      <main id="main-content">Main content</main>
    </>
  );

  const skipLink = screen.getByText('Skip to main content');
  expect(skipLink).toBeInTheDocument();

  // Should be hidden visually
  expect(skipLink).toHaveClass('sr-only');

  // Focus should make it visible
  skipLink.focus();
  expect(skipLink).toHaveClass('focus:not-sr-only');

  // Click should navigate to main content
  await userEvent.click(skipLink);
  expect(document.getElementById('main-content')).toHaveFocus();
});
```

## Related Components

- `Announcer` - For screen reader announcements
- `KeyboardShortcutsHelp` - Keyboard navigation help
- `HighContrastToggle` - High contrast mode toggle

## Browser Support

- ✅ All modern browsers
- ✅ Screen readers (NVDA, JAWS, VoiceOver)
- ✅ Keyboard navigation
- ✅ Mobile browsers (though less critical on mobile)

## Best Practices

1. **Place at Top**: Always place skip link at the very top of the page
2. **Single Target**: Use one skip link per page targeting main content
3. **Test with Keyboard**: Always test with keyboard-only navigation
4. **Test with Screen Reader**: Verify with screen reader software
5. **Consistent Placement**: Use same placement across all pages

## Implementation Notes

- Uses native `<a>` element for semantic HTML
- No JavaScript required - pure CSS solution
- Works with any routing solution (React Router, Next.js, etc.)
- Zero runtime overhead
- Accessible by default
