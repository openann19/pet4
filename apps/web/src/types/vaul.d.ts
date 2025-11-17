/**
 * Type declarations for vaul drawer library
 */

declare module 'vaul' {
  import type { ComponentPropsWithoutRef, PropsWithChildren } from 'react';

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

  export type DrawerTriggerProps = ComponentPropsWithoutRef<'button'>
  export type DrawerContentProps = ComponentPropsWithoutRef<'div'>
  export type DrawerHeaderProps = ComponentPropsWithoutRef<'div'>
  export type DrawerFooterProps = ComponentPropsWithoutRef<'div'>
  export type DrawerTitleProps = ComponentPropsWithoutRef<'h2'>
  export type DrawerDescriptionProps = ComponentPropsWithoutRef<'p'>
  export type DrawerCloseProps = ComponentPropsWithoutRef<'button'>
  export type DrawerOverlayProps = ComponentPropsWithoutRef<'div'>
  export interface DrawerPortalProps extends PropsWithChildren {
    readonly container?: HTMLElement;
  }

  export const Drawer: {
    (props: DrawerProps): JSX.Element;
    displayName?: string;
  };

  export const DrawerTrigger: {
    (props: DrawerTriggerProps): JSX.Element;
    displayName?: string;
  };

  export const DrawerContent: {
    (props: DrawerContentProps): JSX.Element;
    displayName?: string;
  };

  export const DrawerHeader: {
    (props: DrawerHeaderProps): JSX.Element;
    displayName?: string;
  };

  export const DrawerFooter: {
    (props: DrawerFooterProps): JSX.Element;
    displayName?: string;
  };

  export const DrawerTitle: {
    (props: DrawerTitleProps): JSX.Element;
    displayName?: string;
  };

  export const DrawerDescription: {
    (props: DrawerDescriptionProps): JSX.Element;
    displayName?: string;
  };

  export const DrawerClose: {
    (props: DrawerCloseProps): JSX.Element;
    displayName?: string;
  };

  export const DrawerOverlay: {
    (props: DrawerOverlayProps): JSX.Element;
    displayName?: string;
  };

  export const DrawerPortal: {
    (props: DrawerPortalProps): JSX.Element;
    displayName?: string;
  };

  export const DrawerNestedRoot: {
    (props: DrawerProps): JSX.Element;
    displayName?: string;
  };
}
