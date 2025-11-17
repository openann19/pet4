# 🚀 Media Editor Quick Start Guide

## Installation (Already Complete ✅)

The editor is fully implemented in `apps/web/src/hooks/media-editor/`

## 1️⃣ Quick Start (30 seconds)

```typescript
import { useMediaEditor } from '@/hooks/media-editor';

function MyComponent() {
  const editor = useMediaEditor({
    context: 'post',     // or 'profile' | 'message' | 'story'
    quality: 'high',     // or 'low' | 'medium' | 'ultra'
    aspectRatio: 1,      // 1:1 square
  });

  const handleFile = async (file: File) => {
    // Load
    await editor.loadImage(file);

    // Apply preset (instant professional look)
    await editor.applyPreset('post-vibrant');

    // Export
    const blob = await editor.exportMedia();

    // Upload blob to server
    return blob;
  };

  return <input type="file" onChange={(e) => handleFile(e.target.files[0])} />;
}
```

## 2️⃣ Context-Specific Integration

### Post Creation

```typescript
const editor = useMediaEditor({ context: 'post' });

// Quick options:
editor.applyPreset('post-default');     // Balanced
editor.applyPreset('post-landscape');   // 16:9 landscape
editor.applyPreset('post-portrait');    // 4:5 portrait
editor.applyPreset('post-vibrant');     // Vibrant colors
```

### Profile Photo

```typescript
const editor = useMediaEditor({ context: 'profile' });

// Professional presets:
editor.applyPreset('profile-photo');        // Natural look
editor.applyPreset('profile-professional'); // Magazine quality
```

### Message Attachment

```typescript
const editor = useMediaEditor({
  context: 'message',
  quality: 'medium', // Faster for quick sharing
});

editor.applyPreset('message-quick-share');
editor.applyPreset('message-fun');
```

### Story

```typescript
const editor = useMediaEditor({
  context: 'story',
  aspectRatio: 9/16, // Vertical
});

editor.applyPreset('story-default');
editor.applyPreset('story-dramatic');
editor.applyPreset('story-golden');
```

## 3️⃣ Common Tasks

### Apply Filter

```typescript
// 30 presets available:
await editor.applyFilter('cinematic-teal-orange');
await editor.applyFilter('vintage-film');
await editor.applyFilter('portrait-natural');
await editor.applyFilter('anime-vibrant');
// ... see FILTER_PRESETS for all options
```

### Remove Background

```typescript
await editor.removeBackground({
  quality: 'accurate',      // 'fast' | 'balanced' | 'accurate'
  threshold: 0.5,           // 0-1 sensitivity
  feather: 10,              // Edge softness
  refinement: true,         // Extra pass for quality
  preserveDetails: true,    // Keep fine details
});
```

### Smart Crop

```typescript
// Face-aware cropping:
await editor.cropToAspectRatio(1, { detectFaces: true });

// Or specify aspect ratio preset:
await editor.smartResize.resizeToPreset(
  editor.editorState.currentMedia!,
  'instagram-square'
);
```

### Adjust Parameters

```typescript
editor.applyAdjustment('brightness', 0.2);   // -1 to 1
editor.applyAdjustment('contrast', 0.15);    // -1 to 1
editor.applyAdjustment('saturation', -0.1);  // -1 to 1
editor.applyAdjustment('exposure', 0.3);     // -1 to 1
editor.applyAdjustment('temperature', 15);   // Kelvin offset
editor.applyAdjustment('tint', 5);           // Magenta-Green
editor.applyAdjustment('highlights', -0.2);  // -1 to 1
editor.applyAdjustment('shadows', 0.1);      // -1 to 1
editor.applyAdjustment('vibrance', 0.15);    // -1 to 1
```

## 4️⃣ Advanced Features

### Video Timeline

```typescript
const { timeline } = editor;

// Add video track
const trackId = timeline.addTrack('video', 'Main Video');

// Add clip
const clipId = timeline.addClip(trackId, videoSource, 0);

// Add fade-in transition
timeline.addTransition(clipId, {
  id: 'trans-1',
  type: 'fade',
  duration: 1,
  position: 'in',
  easing: 'ease-in-out',
});

// Split at 5 seconds
timeline.splitClip(clipId, 5);

// Play preview
timeline.play();
```

### Keyframe Animation

```typescript
// Opacity fade-in
timeline.addKeyframe(clipId, {
  id: 'kf-1',
  time: 0,
  property: 'opacity',
  value: 0,
  easing: 'ease-in',
});

timeline.addKeyframe(clipId, {
  id: 'kf-2',
  time: 1,
  property: 'opacity',
  value: 1,
  easing: 'ease-out',
});

// Scale zoom-in
timeline.addKeyframe(clipId, {
  id: 'kf-3',
  time: 0,
  property: 'scaleX',
  value: 1,
  easing: 'bounce',
});

timeline.addKeyframe(clipId, {
  id: 'kf-4',
  time: 2,
  property: 'scaleX',
  value: 1.5,
  easing: 'ease-out',
});
```

### Undo/Redo

```typescript
// Built-in 50-step history
editor.undo();
editor.redo();

// Or use keyboard shortcuts (auto-enabled)
// Ctrl+Z = Undo
// Ctrl+Y = Redo
```

## 5️⃣ Individual Hooks

If you need granular control, use hooks separately:

```typescript
import {
  useFilters,
  useBackgroundRemoval,
  useSmartResize,
  useVideoTimeline,
  useMediaProcessor,
  FILTER_PRESETS,
  ASPECT_RATIO_PRESETS,
} from '@/hooks/media-editor';

function CustomEditor() {
  const filters = useFilters();
  const bgRemoval = useBackgroundRemoval();
  const resize = useSmartResize();
  const timeline = useVideoTimeline();
  const processor = useMediaProcessor();

  // Use individually as needed
}
```

## 6️⃣ UI Components

### Advanced Slider

```typescript
import { useAdvancedSlider, triggerHaptic } from '@/hooks/media-editor';

function BrightnessSlider() {
  const slider = useAdvancedSlider({
    value: 0,
    min: -1,
    max: 1,
    step: 0.01,
    label: 'Brightness',
    unit: '',
    hapticFeedback: true,
    onChange: (value) => {
      editor.applyAdjustment('brightness', value);
      triggerHaptic('light');
    },
  });

  return (
    <div
      ref={slider.sliderRef}
      {...slider.handlers}
      className="w-full h-2 bg-gray-700 rounded-full cursor-pointer"
    >
      <div
        className="h-full bg-blue-500 rounded-full"
        style={{ width: `${slider.percentage}%` }}
      />
    </div>
  );
}
```

### Haptic Feedback

```typescript
import { triggerHaptic } from '@/hooks/media-editor';

// Patterns:
triggerHaptic('light');    // Subtle tap
triggerHaptic('medium');   // Noticeable tap
triggerHaptic('heavy');    // Strong tap
triggerHaptic('tick');     // Quick tick (sliders)
triggerHaptic('success');  // Success pattern
triggerHaptic('error');    // Error pattern
```

### Keyboard Shortcuts

```typescript
import { useKeyboardShortcuts } from '@/hooks/media-editor';

useKeyboardShortcuts([
  { key: 'z', modifiers: ['ctrl'], action: editor.undo },
  { key: 'y', modifiers: ['ctrl'], action: editor.redo },
  { key: 's', modifiers: ['ctrl'], action: handleSave },
  { key: 'f', modifiers: ['ctrl'], action: toggleFullscreen },
]);
```

### Gesture Recognition

```typescript
import { useGestures } from '@/hooks/media-editor';

const gestures = useGestures({
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
  onSwipeUp: () => console.log('Swiped up'),
  onSwipeDown: () => console.log('Swiped down'),
  threshold: 50, // px
});

<div {...gestures.handlers}>Swipeable content</div>
```

## 7️⃣ Available Presets

### Filter Categories (30 total)

```typescript
// Vintage
'vintage-film', 'vintage-polaroid', 'vintage-sepia', 'vintage-retro'

// Cinematic
'cinematic-teal-orange', 'cinematic-noir', 'cinematic-bleach-bypass',
'cinematic-blue-hour', 'cinematic-golden-hour'

// Anime
'anime-vibrant', 'anime-pastel', 'anime-cel-shaded'

// Portrait
'portrait-natural', 'portrait-dramatic', 'portrait-soft-glow',
'portrait-magazine'

// Landscape
'landscape-vivid', 'landscape-moody', 'landscape-hdr'

// Dramatic
'dramatic-storm', 'dramatic-sunset'

// Vibrant
'vibrant-pop', 'vibrant-neon'

// Muted
'muted-minimal', 'muted-faded'

// Monochrome
'monochrome-classic', 'monochrome-high-contrast', 'monochrome-low-key'

// Artistic
'artistic-oil-painting', 'artistic-sketch', 'artistic-watercolor'
```

### Aspect Ratio Presets (12 total)

```typescript
'instagram-square'      // 1:1
'instagram-portrait'    // 4:5
'instagram-story'       // 9:16
'youtube-landscape'     // 16:9
'youtube-shorts'        // 9:16
'facebook-post'         // 1.91:1
'twitter-post'          // 16:9
'linkedin-post'         // 1.91:1
'pinterest-pin'         // 2:3
'tiktok-video'          // 9:16
'cinematic'             // 21:9
'4k-landscape'          // 16:9
'hd-landscape'          // 16:9
```

## 8️⃣ Performance Tips

### 1. Choose Appropriate Quality

```typescript
// For quick previews or messages:
useMediaEditor({ quality: 'medium' })

// For final exports:
useMediaEditor({ quality: 'ultra' })
```

### 2. Batch Processing

```typescript
async function processBatch(files: File[]) {
  for (const file of files) {
    await editor.loadImage(file);
    await editor.applyPreset('post-vibrant');
    const blob = await editor.exportMedia();
    await uploadToServer(blob);
    editor.reset(); // Clear for next file
  }
}
```

### 3. Use Presets for Speed

```typescript
// Presets are pre-configured for optimal performance
await editor.applyPreset('post-vibrant');

// Instead of individual adjustments:
// await editor.applyFilter(...);
// await editor.applyAdjustment(...);
// await editor.applyAdjustment(...);
```

## 9️⃣ Error Handling

```typescript
try {
  await editor.loadImage(file);
  await editor.applyFilter('cinematic-teal-orange');
  const blob = await editor.exportMedia();

  if (!blob) {
    throw new Error('Export failed');
  }

  return blob;
} catch (error) {
  console.error('Editor error:', error);
  // Handle error (show toast, etc.)
}
```

## 🔟 Complete Example

```typescript
import { useMediaEditor, triggerHaptic } from '@/hooks/media-editor';
import { useState } from 'react';

function PhotoEditor() {
  const [file, setFile] = useState<File | null>(null);
  const editor = useMediaEditor({
    context: 'post',
    quality: 'high',
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    try {
      // Load image
      await editor.loadImage(selectedFile);
      triggerHaptic('success');

      // Apply default preset
      await editor.applyPreset('post-vibrant');

    } catch (error) {
      triggerHaptic('error');
      console.error('Failed to load image:', error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await editor.exportMedia();
      if (!blob) throw new Error('Export failed');

      // Upload to server
      const formData = new FormData();
      formData.append('photo', blob, 'edited-photo.jpg');

      await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      triggerHaptic('success');

    } catch (error) {
      triggerHaptic('error');
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Photo Editor</h1>

      {/* File input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="mb-4"
      />

      {/* Preview */}
      {editor.editorState.currentMedia && (
        <div className="mb-4">
          <canvas ref={(el) => {
            if (el && editor.editorState.currentMedia) {
              const ctx = el.getContext('2d');
              ctx?.drawImage(editor.editorState.currentMedia, 0, 0);
            }
          }} />
        </div>
      )}

      {/* Controls */}
      <div className="space-y-2">
        <button
          onClick={() => editor.applyFilter('cinematic-teal-orange')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Apply Cinematic Filter
        </button>

        <button
          onClick={() => editor.removeBackground()}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Remove Background
        </button>

        <button
          onClick={() => editor.cropToAspectRatio(1)}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Crop to Square
        </button>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-indigo-500 text-white rounded"
        >
          Export & Upload
        </button>
      </div>

      {/* Undo/Redo */}
      <div className="mt-4 space-x-2">
        <button
          onClick={editor.undo}
          disabled={editor.editorState.historyIndex <= 0}
          className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          Undo (Ctrl+Z)
        </button>

        <button
          onClick={editor.redo}
          disabled={editor.editorState.historyIndex >= editor.editorState.history.length - 1}
          className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          Redo (Ctrl+Y)
        </button>
      </div>
    </div>
  );
}

export default PhotoEditor;
```

---

## 📚 Additional Resources

- **Full Documentation**: `MEDIA_EDITOR_IMPLEMENTATION_COMPLETE.md`
- **10 Integration Examples**: `MEDIA_EDITOR_EXAMPLES.tsx`
- **Summary**: `ULTRA_ADVANCED_MEDIA_EDITOR_SUMMARY.md`

---

## ✅ Quick Checklist

- [ ] Import `useMediaEditor` hook
- [ ] Choose context (`post`/`profile`/`message`/`story`)
- [ ] Load image/video with `editor.loadImage(file)`
- [ ] Apply preset with `editor.applyPreset('...')`
- [ ] Export with `editor.exportMedia()`
- [ ] Upload blob to server

**That's it! You're ready to use the ultra-advanced media editor.** 🎉
