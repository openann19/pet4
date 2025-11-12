/**
 * Type stubs for @shopify/react-native-skia
 * This package is only available on native platforms, not web.
 * These types allow the code to compile but will throw at runtime if called on web.
 */
declare module '@shopify/react-native-skia' {
  export interface SkImage {
    width(): number;
    height(): number;
    makeCopyWithDefaults(): SkImage;
    encodeToBase64(format?: string, quality?: number): string;
  }

  export interface SkRect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface SkCanvas {
    clear(color: number): void;
    drawImageRect(image: SkImage, src: SkRect, dest: SkRect, paint: SkPaint): void;
    drawRect(rect: SkRect, paint: SkPaint): void;
  }

  export interface SkSurface {
    getCanvas(): SkCanvas;
    makeImageSnapshot(): SkImage;
  }

  export type SkPaint = Record<string, unknown>;

  export type SkColorFilter = Record<string, unknown>;

  export type SkImageFilter = Record<string, unknown>;

  export const Skia: {
    Data: {
      fromBytes(bytes: Uint8Array): Uint8Array;
    };
    Image: {
      MakeImageFromEncoded(data: Uint8Array): SkImage | null;
    };
    Surface: {
      MakeOffscreen(width: number, height: number): SkSurface | null;
    };
    Paint: new () => SkPaint;
    Color: {
      (color: string): number;
      (r: number, g: number, b: number, a?: number): number;
    };
    ColorFilter: {
      MakeMatrix(matrix: number[]): SkColorFilter;
    };
    ImageFilter: {
      MakeBlur(sigmaX: number, sigmaY: number, mode: string, input?: SkImageFilter): SkImageFilter;
    };
  };

  export default Skia;
}
