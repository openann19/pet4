# Media Upload & Edit System

## Overview

A unified media upload and editing system that supports both web (drag-drop) and mobile (native picker) platforms, with integrated video trimming, image editing, and seamless handoff to the existing `editMedia` pipeline.

## Architecture

### Components

1. **`useUploadPicker`** (`src/core/services/media/picker/use-upload-picker.ts`)
   - Unified hook for picking images and videos
   - Web: Uses HTML5 file input with blob URLs
   - Mobile: Falls back to `expo-image-picker` → `expo-document-picker`
   - Extracts dimensions and duration metadata automatically

2. **`DropZoneWeb`** (`src/components/media-editor/drop-zone-web.tsx`)
   - Web-only drag-and-drop zone component
   - Handles file validation (images/videos only)
   - Gracefully degrades on native (returns null)

3. **`getVideoThumbnails`** (`src/core/services/media/video/thumbnails.ts`)
   - Generates evenly-spaced video thumbnails
   - Web: Uses HTML5 video + canvas API
   - Native: Uses FFmpeg-kit (optional, graceful fallback)
   - Returns data URLs on web, file URIs on native

4. **`VideoTrimmer`** (`src/components/media-editor/video-trimmer.tsx`)
   - Visual timeline trimmer with animated handles
   - Uses React Native Reanimated for smooth gestures
   - Displays thumbnails in timeline
   - Calls `onChange` with start/end seconds

5. **`UploadAndEditScreen`** (`src/components/media-editor/upload-and-edit-screen.tsx`)
   - Main orchestration component
   - Handles image flow → `MediaEditor`
   - Handles video flow → `VideoTrimmer` → `editMedia`
   - Integrates with existing `editMedia` pipeline

## Features

### Image Upload & Edit

- Web: Drag-drop or file picker
- Mobile: Native image picker
- Automatic dimension extraction
- Flows into existing `MediaEditor` component

### Video Upload & Trim

- Web: Drag-drop or file picker
- Mobile: Native video picker
- Visual timeline with thumbnails
- Trim start/end points
- Automatic resize to 1080x1920
- Handoff to `editMedia` for processing

### Cross-Platform Support

- Web-first, mobile fallback
- Graceful degradation if native modules unavailable
- No heavy dependencies required

## Usage

```tsx
import { UploadAndEditScreen } from '@/components/media-editor/upload-and-edit-screen';

function MyComponent() {
  const handleDone = (outputUri: string) => {
    // Use processed media
  };

  return <UploadAndEditScreen onDone={handleDone} />;
}
```

### Standalone Picker

```tsx
import { useUploadPicker } from '@/core/services/media/picker';

function MyComponent() {
  const { pickAny, pickImage, pickVideo } = useUploadPicker();

  const handlePick = async () => {
    const media = await pickAny();
    if (media) {
      // Use media.uri, media.type, media.width, etc.
    }
  };

  return <button onClick={handlePick}>Pick Media</button>;
}
```

## Integration with Existing Pipeline

All media flows through the existing `editMedia` function:

```typescript
import { editMedia } from '@/core/services/media/edit-media';
import type { ImageOperation, VideoOperation } from '@/core/types/media-types';

// Images
const imageOps: ImageOperation[] = [];
const result = await editMedia(imageInput, imageOps, {
  imageFormat: 'jpeg',
  quality: 0.92,
});

// Videos
const videoOps: VideoOperation[] = [
  { type: 'trim', startSec: 2, endSec: 10 },
  { type: 'resize', width: 1080, height: 1920 },
];
const result = await editMedia(videoInput, videoOps, {
  quality: 0.9,
});
```

## File Structure

```
src/
├── core/services/media/
│   ├── picker/
│   │   ├── use-upload-picker.ts      # Unified picker hook
│   │   └── index.ts                  # Exports
│   └── video/
│       ├── thumbnails.ts             # Video thumbnail generation
│       ├── __tests__/
│       │   └── thumbnails.test.ts    # Tests
│       └── index.ts                  # Exports
└── components/media-editor/
    ├── drop-zone-web.tsx             # Web drag-drop zone
    ├── video-trimmer.tsx             # Video trimmer component
    ├── upload-and-edit-screen.tsx    # Main screen
    └── __tests__/
        ├── drop-zone-web.test.tsx
        ├── video-trimmer.test.tsx
        └── use-upload-picker.test.ts
```

## Testing

Tests are included for all components:

- `use-upload-picker.test.ts` - Picker hook tests
- `drop-zone-web.test.tsx` - Drag-drop component tests
- `video-trimmer.test.tsx` - Trimmer component tests
- `thumbnails.test.ts` - Thumbnail generation tests

Run tests:

```bash
npm run test
```

## Type Safety

All components use strict TypeScript:

- No `any` types
- Proper interfaces exported
- Full type coverage for MediaInput, ImageOperation, VideoOperation
- Strict optional semantics compliance

## Performance

- Video thumbnails generated off-main-thread (web)
- Reanimated worklets for smooth trimming gestures
- No unnecessary re-renders (memoized callbacks)
- Graceful fallbacks if heavy dependencies unavailable

## Accessibility

- All interactive elements have `accessibilityRole`
- Proper `aria-label` attributes
- Screen reader friendly labels
- Keyboard navigation support (web)

## Error Handling

- Structured error logging via `createLogger`
- Graceful degradation on module import failures
- User-friendly error states
- No console.log in production code

## Future Enhancements

- [ ] Add haptic feedback for mobile gestures
- [ ] Support multiple file selection
- [ ] Add progress indicators for long operations
- [ ] Add preview before export
- [ ] Support video filters/effects
- [ ] Add audio track support for videos
