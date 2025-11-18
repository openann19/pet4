/**
 * Type declarations for vaul drawer library
 */

declare module 'vaul' {
  import type { ComponentPropsWithoutRef, _ElementRef, PropsWithChildren, ForwardRefExoticComponent, RefAttributes } from 'react';
  import * as DialogPrimitive from '@radix-ui/react-dialog';

  export interface DrawerProps extends PropsWithChildren {
    readonly open?: boolean;
    readonly onOpenChange?: (open: boolean) => void;
    readonly shouldScaleBackground?: boolean;
    readonly activeSnapPoint?: number | string | null;
    readonly setActiveSnapPoint?: (snapPoint: number | string | null) => void;
    readonly snapPoints?: (number | string)[];
    readonly fadeFromIndex?: number;
    readonly modal?: boolean;
    readonly onClose?: () => void;
    readonly onDrag?: (event: PointerEvent, percentageDragged: number) => void;
    readonly onRelease?: (event: PointerEvent, open: boolean) => void;
    readonly dismissible?: boolean;
    readonly handleOnly?: boolean;
    readonly direction?: 'top' | 'bottom' | 'left' | 'right';
    readonly preventScrollRestoration?: boolean;
    readonly disablePreventScroll?: boolean;
    readonly noBodyStyles?: boolean;
    readonly container?: HTMLElement;
  }

  type RootComponent = ForwardRefExoticComponent<DrawerProps & RefAttributes<HTMLDivElement>>;
  type TriggerComponent = ForwardRefExoticComponent<DialogPrimitive.DialogTriggerProps & RefAttributes<HTMLButtonElement>>;
  type PortalComponent = (props: { container?: HTMLElement; children?: React.ReactNode }) => JSX.Element;
  type CloseComponent = ForwardRefExoticComponent<DialogPrimitive.DialogCloseProps & RefAttributes<HTMLButtonElement>>;
  type OverlayComponent = ForwardRefExoticComponent<DialogPrimitive.DialogOverlayProps & RefAttributes<HTMLDivElement>>;
  type ContentComponent = ForwardRefExoticComponent<DialogPrimitive.DialogContentProps & RefAttributes<HTMLDivElement>>;
  type HandleComponent = ForwardRefExoticComponent<ComponentPropsWithoutRef<'div'> & RefAttributes<HTMLDivElement>>;
  type TitleComponent = ForwardRefExoticComponent<DialogPrimitive.DialogTitleProps & RefAttributes<HTMLHeadingElement>>;
  type DescriptionComponent = ForwardRefExoticComponent<DialogPrimitive.DialogDescriptionProps & RefAttributes<HTMLParagraphElement>>;

  export const Drawer: {
    Root: RootComponent;
    NestedRoot: RootComponent;
    Content: ContentComponent;
    Overlay: OverlayComponent;
    Trigger: TriggerComponent;
    Portal: PortalComponent;
    Handle: HandleComponent;
    Close: CloseComponent;
    Title: TitleComponent;
    Description: DescriptionComponent;
  };

  export const Root: RootComponent;
  export const NestedRoot: RootComponent;
  export const Content: ContentComponent;
  export const Overlay: OverlayComponent;
  export const Trigger: TriggerComponent;
  export const Portal: PortalComponent;
  export const Handle: HandleComponent;
  export const Close: CloseComponent;
  export const Title: TitleComponent;
  export const Description: DescriptionComponent;
}
