# Announcer

A live region component for making screen reader announcements. Provides accessible way to announce dynamic content changes to users of assistive technologies.

## Overview

`Announcer` uses ARIA live regions to announce dynamic content changes to screen readers. It's essential for providing feedback when content changes without page navigation, such as form submissions, search results, or status updates.

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `message` | `string` | - | ✅ | Message to announce to screen readers |
| `politeness` | `'polite' \| 'assertive'` | `'polite'` | ❌ | Politeness level of announcement |
| `clearDelay` | `number` | `5000` | ❌ | Delay in ms before clearing message (0 = never clear) |

## Usage

### Basic Announcement

```tsx
import { Announcer } from '@/components/a11y/Announcer';
import { useState } from 'react';

function SearchResults() {
  const [results, setResults] = useState([]);
  const [announcement, setAnnouncement] = useState('');

  const handleSearch = async (query: string) => {
    const data = await search(query);
    setResults(data);
    setAnnouncement(`Found ${data.length} results for ${query}`);
  };

  return (
    <>
      <Announcer message={announcement} />
      <SearchForm onSearch={handleSearch} />
      <ResultsList results={results} />
    </>
  );
}
```

### Assertive Announcement

```tsx
import { Announcer } from '@/components/a11y/Announcer';

function FormSubmission() {
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    try {
      await submitForm();
      setStatus('Form submitted successfully');
    } catch (error) {
      setStatus('Error: Failed to submit form');
    }
  };

  return (
    <>
      <Announcer message={status} politeness="assertive" />
      <form onSubmit={handleSubmit}>...</form>
    </>
  );
}
```

### Persistent Announcement

```tsx
import { Announcer } from '@/components/a11y/Announcer';

function StatusIndicator() {
  const [status, setStatus] = useState('System online');

  return (
    <Announcer
      message={status}
      clearDelay={0} // Never clear
    />
  );
}
```

### Using the Hook

```tsx
import { useAnnouncer } from '@/components/a11y/Announcer';
import { Announcer } from '@/components/a11y/Announcer';

function MyComponent() {
  const { announce, announcement } = useAnnouncer();

  const handleAction = () => {
    // Perform action
    announce('Action completed successfully', 'polite');
  };

  return (
    <>
      <Announcer message={announcement} />
      <button onClick={handleAction}>Perform Action</button>
    </>
  );
}
```

## Politeness Levels

### `polite` (Default)

- **Use for**: Non-critical updates, status changes, search results
- **Behavior**: Screen reader announces when it finishes current task
- **Example**: "Search completed. 10 results found."

```tsx
<Announcer
  message="Search completed. 10 results found."
  politeness="polite"
/>
```

### `assertive`

- **Use for**: Critical errors, important alerts, urgent notifications
- **Behavior**: Screen reader interrupts current task to announce
- **Example**: "Error: Failed to save changes."

```tsx
<Announcer
  message="Error: Failed to save changes."
  politeness="assertive"
/>
```

## Accessibility

- ✅ **WCAG 2.1 AA Compliant**: Meets requirement 4.1.3 (Status Messages)
- ✅ **ARIA Live Regions**: Uses `aria-live` and `aria-atomic` attributes
- ✅ **Screen Reader Support**: Works with NVDA, JAWS, VoiceOver
- ✅ **Hidden Visually**: Uses `sr-only` class to hide from visual users
- ✅ **Atomic Updates**: `aria-atomic="true"` ensures complete message is read

### A11y Best Practices

1. **Use Polite for Non-Critical**: Most announcements should be `polite`
2. **Use Assertive Sparingly**: Only for critical errors or urgent alerts
3. **Be Concise**: Keep messages short and clear
4. **Clear Old Messages**: Use `clearDelay` to prevent stale announcements
5. **Test with Screen Reader**: Always test with actual screen reader software

## Common Use Cases

### Form Validation

```tsx
function FormWithValidation() {
  const [error, setError] = useState('');

  const validate = () => {
    if (!email) {
      setError('Email is required');
    }
  };

  return (
    <>
      <Announcer message={error} politeness="assertive" />
      <form>...</form>
    </>
  );
}
```

### Search Results

```tsx
function SearchComponent() {
  const [results, setResults] = useState([]);
  const [announcement, setAnnouncement] = useState('');

  const handleSearch = (query: string) => {
    const data = search(query);
    setResults(data);
    setAnnouncement(`Found ${data.length} results`);
  };

  return (
    <>
      <Announcer message={announcement} />
      <SearchInput onSearch={handleSearch} />
      <ResultsList results={results} />
    </>
  );
}
```

### Loading States

```tsx
function DataLoader() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const loadData = async () => {
    setLoading(true);
    setStatus('Loading data...');

    try {
      await fetchData();
      setStatus('Data loaded successfully');
    } catch {
      setStatus('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Announcer message={status} />
      <button onClick={loadData} disabled={loading}>
        Load Data
      </button>
    </>
  );
}
```

## Implementation Details

- Uses `role="status"` for semantic HTML
- Uses `aria-live` for live region behavior
- Uses `aria-atomic="true"` to read complete message
- Uses `sr-only` class to hide visually
- Automatically clears message after `clearDelay` (default 5 seconds)

## Related Components

- `SkipLink` - Skip navigation link
- `KeyboardShortcutsHelp` - Keyboard navigation help
- `HighContrastToggle` - High contrast mode

## Testing

### Manual Testing

1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Trigger announcement
3. Verify screen reader announces message
4. Test both `polite` and `assertive` modes

### Automated Testing

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { Announcer } from '@/components/a11y/Announcer';

test('announces message to screen readers', () => {
  const { rerender } = render(<Announcer message="" />);

  rerender(<Announcer message="Test announcement" />);

  const announcer = screen.getByRole('status');
  expect(announcer).toHaveTextContent('Test announcement');
  expect(announcer).toHaveAttribute('aria-live', 'polite');
});
```

## Browser Support

- ✅ All modern browsers
- ✅ Screen readers (NVDA, JAWS, VoiceOver, Narrator)
- ✅ Mobile screen readers (TalkBack, VoiceOver iOS)

## Best Practices

1. **Don't Overuse**: Only announce important changes
2. **Be Specific**: Include context in messages
3. **Clear Stale Messages**: Use `clearDelay` appropriately
4. **Test Thoroughly**: Always test with screen readers
5. **Use Appropriate Politeness**: Match politeness to message importance
