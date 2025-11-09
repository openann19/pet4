/**
 * Media Editor Integration Examples
 * Quick reference for integrating the advanced editor across different contexts
 */

// ============================================================================
// Example 1: Post Creation with Editor
// ============================================================================

import { useMediaEditor } from '@/hooks/media-editor';

function CreatePostWithEditor() {
    const editor = useMediaEditor({
        context: 'post',
        quality: 'high',
        aspectRatio: 1, // Square for Instagram
    });

    const _handleFileSelect = async (file: File) => {
        // Load the media
        await editor.loadImage(file);

        // Apply a preset for quick editing
        await editor.applyPreset('post-vibrant');
        // Or manually customize
        await editor.applyFilter('cinematic-teal-orange');
        await editor.cropToAspectRatio(1);

        // Export when ready
        const _blob = await editor.exportMedia();

        // Upload blob to server
        return blob;
    };

    return <div>{/* Post creation UI */}</div>;
}

// ============================================================================
// Example 2: Profile Photo Editor
// ============================================================================

function ProfilePhotoEditor() {
    const editor = useMediaEditor({
        context: 'profile',
        quality: 'ultra',
        aspectRatio: 1, // Square profile photo
    });

    const _handleEdit = async (file: File) => {
        await editor.loadImage(file);

        // Apply professional portrait preset
        await editor.applyPreset('profile-professional');

        // Remove background if needed
        await editor.removeBackground();

        // Smart crop with face detection
        const _result = await editor.smartResize.smartCrop(
            editor.editorState.currentMedia!,
            1, // 1:1 aspect ratio
            { detectFaces: true }
        );

        // Export
        return await editor.exportMedia();
    };

    return <div>{/* Profile photo editor UI */}</div>;
}

// ============================================================================
// Example 3: Story Creation with Filters
// ============================================================================

function StoryEditor() {
    const editor = useMediaEditor({
        context: 'story',
        quality: 'high',
        aspectRatio: 9 / 16, // Vertical story format
    });

    const _handleCreateStory = async (file: File) => {
        await editor.loadImage(file);

        // Apply dramatic filter for impact
        await editor.applyFilter('cinematic-golden-hour');

        // Ensure correct aspect ratio
        await editor.cropToAspectRatio(9 / 16);

        // Export
        return await editor.exportMedia();
    };

    return <div>{/* Story creation UI */}</div>;
}

// ============================================================================
// Example 4: Message Media with Quick Filters
// ============================================================================

function MessageMediaEditor() {
    const editor = useMediaEditor({
        context: 'message',
        quality: 'medium', // Faster processing for messages
    });

    const _handleQuickEdit = async (file: File) => {
        await editor.loadImage(file);

        // Apply fun filter
        await editor.applyPreset('message-fun');

        // Quick export
        return await editor.exportMedia();
    };

    return <div>{/* Message media UI */}</div>;
}

// ============================================================================
// Example 5: Advanced Video Timeline Editing
// ============================================================================

function VideoTimelineEditor() {
    const { timeline } = useMediaEditor({
        context: 'post',
        quality: 'high',
    });

    const _handleVideoEdit = async () => {
        // Add video track
        const videoTrackId = timeline.addTrack('video', 'Main Video');

        // Add video clip
        const source = {
            id: 'video-1',
            type: 'video' as const,
            url: 'path/to/video.mp4',
            duration: 10,
            width: 1920,
            height: 1080,
        };

        const clipId = timeline.addClip(videoTrackId, source, 0);

        // Add transition
        timeline.addTransition(clipId, {
            id: 'trans-1',
            type: 'fade',
            duration: 1,
            position: 'in',
            easing: 'ease-in-out',
        });

        // Add keyframe animation
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

        // Split clip at 5 seconds
        timeline.splitClip(clipId, 5);

        // Play preview
        timeline.play();
    };

    return <div>{/* Timeline UI */}</div>;
}

// ============================================================================
// Example 6: Custom Filter Application
// ============================================================================

function CustomFilterEditor() {
    const editor = useMediaEditor({
        context: 'post',
        quality: 'high',
    });

    const _applyCustomFilter = async (file: File) => {
        await editor.loadImage(file);

        // Apply multiple filters in sequence
        const filterIds = [
            'vintage-film',
            'cinematic-bleach-bypass',
        ];

        for (const filterId of filterIds) {
            await editor.applyFilter(filterId);
        }

        // Apply custom adjustments
        editor.applyAdjustment('brightness', 0.2);
        editor.applyAdjustment('contrast', 0.15);
        editor.applyAdjustment('saturation', -0.1);

        return await editor.exportMedia();
    };

    return <div>{/* Custom filter UI */}</div>;
}

// ============================================================================
// Example 7: Batch Processing Multiple Images
// ============================================================================

function BatchImageProcessor() {
    const editor = useMediaEditor({
        context: 'post',
        quality: 'high',
    });

    const _processBatch = async (files: File[]) => {
        const results: Blob[] = [];

        for (const file of files) {
            // Load image
            await editor.loadImage(file);

            // Apply preset
            await editor.applyPreset('post-vibrant');

            // Export
            const _blob = await editor.exportMedia();
            if (blob) {
                results.push(blob);
            }

            // Reset for next file
            editor.reset();
        }

        return results;
    };

    return <div>{/* Batch processing UI */}</div>;
}

// ============================================================================
// Example 8: Using Individual Hooks
// ============================================================================

import {
    useFilters,
    useBackgroundRemoval,
    useSmartResize,
    ASPECT_RATIO_PRESETS,
    FILTER_PRESETS,
} from '@/hooks/media-editor';

function IndividualHookExample() {
    const filters = useFilters();
    const bgRemoval = useBackgroundRemoval();
    const resize = useSmartResize();

    const _processImage = async (img: HTMLImageElement) => {
        // Apply filter
        const filtered = await filters.applyFilter(
            img,
            FILTER_PRESETS[0]!, // Use first preset
            { intensity: 0.8 }
        );

        // Remove background
        const withoutBg = await bgRemoval.removeBackground(filtered, {
            quality: 'accurate',
            threshold: 0.5,
            feather: 10,
            refinement: true,
            preserveDetails: true,
            removeGreen: false,
        });

        // Convert to canvas
        const canvas = document.createElement('canvas');
        canvas.width = withoutBg.width;
        canvas.height = withoutBg.height;
        const ctx = canvas.getContext('2d');
        ctx?.putImageData(withoutBg, 0, 0);

        // Smart crop to Instagram square
        const cropped = await resize.smartCrop(canvas, 1);

        return cropped;
    };

    return <div>{/* Custom processing UI */}</div>;
}

// ============================================================================
// Example 9: UI Components with Sliders
// ============================================================================

import { useAdvancedSlider, triggerHaptic } from '@/hooks/media-editor';

function FilterAdjustmentSliders() {
    const brightnessSlider = useAdvancedSlider({
        value: 0,
        min: -1,
        max: 1,
        step: 0.01,
        label: 'Brightness',
        unit: '',
        hapticFeedback: true,
        onChange: (_value) => {
            // Apply brightness adjustment
            triggerHaptic('light');
        },
    });

    return (
        <div>
            <div
                ref={brightnessSlider.sliderRef}
                {...brightnessSlider.handlers}
                className="w-full h-2 bg-gray-700 rounded-full cursor-pointer"
            >
                <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${brightnessSlider.percentage}%` }}
                />
            </div>
        </div>
    );
}

// ============================================================================
// Example 10: Keyboard Shortcuts Integration
// ============================================================================

import { useKeyboardShortcuts } from '@/hooks/media-editor';

function EditorWithShortcuts() {
    const editor = useMediaEditor({ context: 'post' });

    useKeyboardShortcuts([
        {
            key: 'z',
            modifiers: ['ctrl'],
            action: editor.undo,
            description: 'Undo',
        },
        {
            key: 'y',
            modifiers: ['ctrl'],
            action: editor.redo,
            description: 'Redo',
        },
        {
            key: 's',
            modifiers: ['ctrl'],
            action: async () => {
                const _blob = await editor.exportMedia();
                // Save blob
            },
            description: 'Save',
        },
        {
            key: 'f',
            modifiers: ['ctrl'],
            action: () => {
                // Toggle fullscreen
            },
            description: 'Fullscreen',
        },
    ]);

    return <div>{/* Editor with shortcuts */}</div>;
}

export {
    CreatePostWithEditor,
    ProfilePhotoEditor,
    StoryEditor,
    MessageMediaEditor,
    VideoTimelineEditor,
    CustomFilterEditor,
    BatchImageProcessor,
    IndividualHookExample,
    FilterAdjustmentSliders,
    EditorWithShortcuts,
};
