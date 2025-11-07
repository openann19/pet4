/**
 * Type stubs for @shopify/react-native-skia
 * This package is only available on native platforms, not web.
 * These types allow the code to compile but will throw at runtime if called on web.
 */
declare module '@shopify/react-native-skia' {
  export const Skia: {
    Data: {
      fromBytes(bytes: Uint8Array): any
    }
    Image: {
      MakeImageFromEncoded(data: any): {
        width(): number
        height(): number
        makeCopyWithDefaults(): any
        encodeToBase64(format?: any, quality?: number): string
      } | null
    }
    Surface: {
      MakeOffscreen(width: number, height: number): {
        getCanvas(): any
        makeImageSnapshot(): any
      } | null
    }
    Paint: new () => any
    Color(r: number, g: number, b: number, a?: number): number
    ColorFilter: {
      MakeMatrix(matrix: number[]): any
    }
    ImageFilter: {
      MakeBlur(sigmaX: number, sigmaY: number, mode: any, input?: any): any
    }
  }
  export default any
}
