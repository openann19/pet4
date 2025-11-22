declare module 'react-leaflet' {
  import type * as React from 'react';
  import type L from 'leaflet';

  export interface MapContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    center: [number, number];
    zoom: number;
    children?: React.ReactNode;
    scrollWheelZoom?: boolean;
    zoomControl?: boolean;
    dragging?: boolean;
    touchZoom?: boolean;
    doubleClickZoom?: boolean;
    style?: React.CSSProperties;
    ref?: React.Ref<L.Map | null>;
  }

  export const MapContainer: React.FC<MapContainerProps>;

  export interface TileLayerProps extends React.HTMLAttributes<HTMLImageElement> {
    url: string;
    attribution?: string;
  }

  export const TileLayer: React.FC<TileLayerProps>;

  export interface MarkerEventHandlers {
    click?: () => void;
    [event: string]: ((...args: unknown[]) => void) | undefined;
  }

  export interface MarkerProps {
    position: [number, number];
    icon?: L.Icon | L.DivIcon;
    eventHandlers?: MarkerEventHandlers;
    children?: React.ReactNode;
  }

  export const Marker: React.FC<MarkerProps>;

  export interface PopupProps {
    children?: React.ReactNode;
  }

  export const Popup: React.FC<PopupProps>;

  export function useMap(): L.Map;

  export function useMapEvents(handlers: Record<string, (...args: unknown[]) => void>): void;
}
