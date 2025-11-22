/**
 * UploadAndEditScreen Tests
 * Covers image and video upload flows, export behavior, and onDone wiring.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { MediaInput } from '@/core/types/media-types';
import { UploadAndEditScreen } from '../upload-and-edit-screen';

const mockPickAny = vi.fn<[], Promise<MediaInput | null>>();
const mockEditMedia = vi.fn();

vi.mock('@/core/services/media/picker', () => ({
    useUploadPicker: () => ({
        pickAny: mockPickAny,
    }),
}));

vi.mock('@/core/services/media/edit-media', () => ({
    editMedia: (...args: unknown[]) => mockEditMedia(...args),
}));

vi.mock('../drop-zone-web', () => ({
    DropZoneWeb: ({ children }: { children?: ReactNode }) => (
        <div data-testid="drop-zone">
            {children}
        </div>
    ),
}));

vi.mock('../MediaEditor', () => ({
    MediaEditor: ({ onDone }: { onDone: (uri: string) => void }) => (
        <div data-testid="media-editor">
            <button type="button" onClick={() => onDone('edited-uri')}>
                Complete Edit
            </button>
        </div>
    ),
}));

vi.mock('../video-trimmer', () => ({
    VideoTrimmer: ({ onChange }: { onChange: (start: number, end: number) => void }) => (
        <button
            type="button"
            data-testid="video-trimmer"
            onClick={() => onChange(1, 3)}
        >
            Set Trim
        </button>
    ),
}));

describe('UploadAndEditScreen', () => {
    const onDone = vi.fn<(uri: string) => void>();

    beforeEach(() => {
        vi.clearAllMocks();
        mockPickAny.mockReset();
        mockEditMedia.mockReset();
    });

    it('renders initial UI with heading and upload button', () => {
        render(<UploadAndEditScreen onDone={onDone} />);

        expect(screen.getByText(/upload & edit/i)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /upload photo\/video/i }),
        ).toBeInTheDocument();
    });

    it('handles image export flow and calls onDone', async () => {
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });

        const imageMedia: MediaInput = {
            // Cast to the concrete image variant shape used at runtime
            type: 'image',
            uri: 'image-uri',
            width: 800,
            height: 600,
        } as MediaInput;

        mockPickAny.mockResolvedValueOnce(imageMedia);
        mockEditMedia.mockResolvedValueOnce({ uri: 'exported-image-uri' });

        render(<UploadAndEditScreen onDone={onDone} />);

        const uploadButton = screen.getByRole('button', { name: /upload photo\/video/i });
        await user.click(uploadButton);

        await waitFor(() => {
            expect(mockPickAny).toHaveBeenCalledTimes(1);
        });

        const exportButton = await screen.findByRole('button', { name: /export/i });
        await user.click(exportButton);

        await waitFor(() => {
            expect(mockEditMedia).toHaveBeenCalledTimes(1);
        });

        const [mediaArg, opsArg, optionsArg] = mockEditMedia.mock.calls[0];
        expect(mediaArg).toEqual(imageMedia);
        expect(opsArg).toEqual([]);
        expect(optionsArg).toEqual(
            expect.objectContaining({ imageFormat: 'jpeg', quality: 0.92 }),
        );
        expect(onDone).toHaveBeenCalledWith('exported-image-uri');
    });

    it('handles video export with trim and resize operations', async () => {
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });

        const videoMedia: MediaInput = {
            type: 'video',
            uri: 'video-uri',
            durationSec: 10,
        } as MediaInput;

        mockPickAny.mockResolvedValueOnce(videoMedia);
        mockEditMedia.mockResolvedValueOnce({ uri: 'exported-video-uri' });

        render(<UploadAndEditScreen onDone={onDone} />);

        const uploadButton = screen.getByRole('button', { name: /upload photo\/video/i });
        await user.click(uploadButton);

        await waitFor(() => {
            expect(mockPickAny).toHaveBeenCalledTimes(1);
        });

        const trimmerButton = await screen.findByTestId('video-trimmer');
        await user.click(trimmerButton);

        const exportButton = await screen.findByRole('button', { name: /export/i });
        await user.click(exportButton);

        await waitFor(() => {
            expect(mockEditMedia).toHaveBeenCalledTimes(1);
        });

        const [mediaArg, opsArg, optionsArg] = mockEditMedia.mock.calls[0];
        expect(mediaArg).toEqual(videoMedia);

        const ops = opsArg as Array<{ type: string }>;
        const trimOp = ops.find((op) => op.type === 'trim');
        const resizeOp = ops.find((op) => op.type === 'resize');

        expect(trimOp).toEqual(
            expect.objectContaining({ type: 'trim', startSec: 1, endSec: 3 }),
        );
        expect(resizeOp).toEqual(
            expect.objectContaining({ type: 'resize', width: 1080, height: 1920 }),
        );

        expect(optionsArg).toEqual(expect.objectContaining({ quality: 0.9 }));
        expect(onDone).toHaveBeenCalledWith('exported-video-uri');
    });
});
