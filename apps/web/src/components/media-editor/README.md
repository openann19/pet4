# Media Editor

Cross-platform media editor (image + video) with resize, crop, rotate, filters, etc., that works on web and mobile.

## Features

- **Image Editing**: Resize, crop, rotate, flip, adjust (brightness/contrast/saturation/temperature/exposure), blur, filters (mono, sepia, vivid, cool, warm, cinematic), watermark
- **Video Editing**: Trim, resize, rotate, flip, speed adjustment, color adjustments, filters, watermark
- **Unified API**: Single entry point `editMedia()` that routes to appropriate engine
- **Cross-Platform**: Works on web (Skia + FFmpeg WASM) and mobile (Skia + FFmpeg Kit)

## Usage

### Image Editing

```typescript
import { editMedia } from '@/core/services/media/edit-media';
import type { MediaInput, ImageOperation } from '@/core/types/media-types';

const result = await editMedia(
  {
    type: 'image',
    uri: 'https://example.com/image.jpg',
    width: 3024,
    height: 4032,
  },
  [
    { type: 'filter', name: 'cinematic', intensity: 0.8 },
    { type: 'blur', radius: 2 },
    { type: 'resize', width: 1440, height: 1920 },
  ],
  { imageFormat: 'jpeg', quality: 0.92 }
);

console.log(result.uri); // Edited image URI
```

### Video Editing

```typescript
const result = await editMedia(
  {
    type: 'video',
    uri: 'https://example.com/video.mp4',
    durationSec: 60,
  },
  [
    { type: 'trim', startSec: 2, endSec: 28 },
    { type: 'resize', width: 1080, height: 1920 },
    { type: 'filter', name: 'vivid', intensity: 0.7 },
    { type: 'speed', rate: 1.25 },
    {
      type: 'watermark',
      uri: 'https://example.com/watermark.png',
      x: 40,
      y: 40,
      opacity: 0.75,
    },
  ],
  { quality: 0.9 }
);
```

### Using the MediaEditor Component

```typescript
import { MediaEditor } from '@/components/media-editor'

function MyComponent() {
  const handleDone = (uri: string) => {
    console.log('Edited media URI:', uri)
  }

  return (
    <MediaEditor
      source={{
        type: 'image',
        uri: 'https://example.com/image.jpg',
        width: 1920,
        height: 1080,
      }}
      onDone={handleDone}
      onCancel={() => console.log('Cancelled')}
    />
  )
}
```

## Architecture

- **Types**: `src/core/types/media-types.ts` - Unified types for image and video operations
- **Image Engine**: `src/core/services/media/image-engine.ts` - Skia-based image processing
- **Video Engine**: `src/core/services/media/video-engine.ts` - FFmpeg-based video processing
- **Unified Entry**: `src/core/services/media/edit-media.ts` - Routes to appropriate engine
- **UI Component**: `src/components/media-editor/MediaEditor.tsx` - Skinnable editor UI

## Dependencies

- `@shopify/react-native-skia` - GPU-accelerated image processing
- `@ffmpeg/ffmpeg` (web) - FFmpeg WASM for web video processing
- `ffmpeg-kit-react-native` (mobile) - FFmpeg for native video processing
- `expo-file-system` (mobile) - File system access on native
- `zod` - Schema validation for operations

## Notes

- FFmpegKit is deprecated but still functional for now
- Web implementation uses data URLs for output
- Native implementation saves to cache directory
- All operations are validated with Zod schemas
- Error handling with structured logging
