/**
 * TouchEvent polyfills for jsdom (doesn't support TouchEvent by default)
 */
export function setupTouchEventPolyfills(): void {
  if (typeof TouchEvent === 'undefined') {
    (global as typeof globalThis & { TouchEvent: typeof TouchEvent }).TouchEvent =
      class TouchEvent extends Event {
        readonly touches: TouchList;
        readonly targetTouches: TouchList;
        readonly changedTouches: TouchList;
        readonly altKey: boolean;
        readonly metaKey: boolean;
        readonly ctrlKey: boolean;
        readonly shiftKey: boolean;

        constructor(type: string, eventInitDict?: TouchEventInit) {
          super(type, eventInitDict);

          const touchesArray = eventInitDict?.touches! || [];
          const targetTouchesArray = eventInitDict?.targetTouches! || [];
          const changedTouchesArray = eventInitDict?.changedTouches! || [];

          const createTouchList = (touches: Touch[]): TouchList => {
            const list = touches as unknown as TouchList;
            list.item = (index: number) => touches[index] || null;
            return list;
          };

          this.touches = createTouchList(touchesArray);
          this.targetTouches = createTouchList(targetTouchesArray);
          this.changedTouches = createTouchList(changedTouchesArray);
          this.altKey = eventInitDict?.altKey ?? false;
          this.metaKey = eventInitDict?.metaKey ?? false;
          this.ctrlKey = eventInitDict?.ctrlKey ?? false;
          this.shiftKey = eventInitDict?.shiftKey ?? false;
        }
      } as typeof TouchEvent;

    // Touch polyfill
    if (typeof Touch === 'undefined') {
      (global as typeof globalThis & { Touch: typeof Touch }).Touch = class Touch {
        readonly identifier: number;
        readonly target: EventTarget;
        readonly clientX: number;
        readonly clientY: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly screenX: number;
        readonly screenY: number;
        readonly radiusX: number;
        readonly radiusY: number;
        readonly rotationAngle: number;
        readonly force: number;

        constructor(touchInitDict: TouchInit | Partial<Touch>) {
          const init = touchInitDict as TouchInit & Partial<Touch>;
          this.identifier = init.identifier ?? 0;
          this.target = init.target ?? ({} as EventTarget);
          this.clientX = init.clientX ?? 0;
          this.clientY = init.clientY ?? 0;
          this.pageX = init.pageX ?? init.clientX ?? 0;
          this.pageY = init.pageY ?? init.clientY ?? 0;
          this.screenX = init.screenX ?? init.clientX ?? 0;
          this.screenY = init.screenY ?? init.clientY ?? 0;
          this.radiusX = init.radiusX ?? 0;
          this.radiusY = init.radiusY ?? 0;
          this.rotationAngle = init.rotationAngle ?? 0;
          this.force = init.force ?? 0;
        }
      } as typeof Touch;
    }

    // TouchList polyfill
    if (typeof TouchList === 'undefined') {
      (global as typeof globalThis & { TouchList: typeof TouchList }).TouchList =
        class TouchList extends Array<Touch> {
          item(index: number): Touch | null {
            return this[index] || null;
          }
        } as typeof TouchList;
    }
  }
}

/**
 * Pointer capture polyfills for jsdom (needed for Radix UI Slider)
 */
export function setupPointerCapturePolyfills(): void {
  if (typeof Element !== 'undefined') {
    const originalElement = Element.prototype;
    if (!originalElement.hasPointerCapture) {
      const pointerCaptureMap = new WeakMap<Element, Set<number>>();
      originalElement.hasPointerCapture = function (pointerId: number): boolean {
        const captures = pointerCaptureMap.get(this);
        return captures?.has(pointerId) ?? false;
      };
      originalElement.setPointerCapture = function (pointerId: number): void {
        if (!pointerCaptureMap.has(this)) {
          pointerCaptureMap.set(this, new Set());
        }
        pointerCaptureMap.get(this)!.add(pointerId);
      };
      originalElement.releasePointerCapture = function (pointerId: number): void {
        const captures = pointerCaptureMap.get(this);
        captures?.delete(pointerId);
      };
    }
  }
}

