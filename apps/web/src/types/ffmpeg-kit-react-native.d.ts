/**
 * Type declarations for ffmpeg-kit-react-native
 * Used for web compatibility when module is not available
 */

declare module 'ffmpeg-kit-react-native' {
  export interface FFmpegKitResult {
    readonly returnCode: number;
    readonly output: string;
    readonly failureStackTrace: string | null;
    readonly cancel: () => void;
  }

  export interface FFprobeKitResult {
    readonly returnCode: number;
    readonly output: string;
    readonly failureStackTrace: string | null;
  }

  export interface MediaInformation {
    readonly path: string;
    readonly format: string;
    readonly streams: {
      readonly index: number;
      readonly codec: string;
      readonly width?: number;
      readonly height?: number;
      readonly duration?: number;
      readonly bitrate?: number;
    }[];
  }

  export function execute(command: string): Promise<FFmpegKitResult>;
  export function executeAsync(
    command: string,
    executeCallback?: (result: FFmpegKitResult) => void
  ): Promise<FFmpegKitResult>;

  export function getMediaInformation(path: string): Promise<MediaInformation>;
  export function getMediaInformationAsync(
    path: string,
    executeCallback?: (result: FFprobeKitResult) => void
  ): Promise<MediaInformation>;

  export function cancel(executionId: number): void;
  export function cancelAll(): void;
}
