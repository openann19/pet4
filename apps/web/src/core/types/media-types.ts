import { z } from 'zod';

/**
 * Media type discriminator
 */
export type MediaType = 'image' | 'video';

/**
 * Available filter presets
 */
export type FilterName = 'none' | 'mono' | 'sepia' | 'vivid' | 'cool' | 'warm' | 'cinematic';

/**
 * Image operation types
 */
export type ImageOperation =
  | { type: 'resize'; width: number; height: number }
  | { type: 'crop'; x: number; y: number; width: number; height: number }
  | { type: 'rotate'; degrees: 90 | 180 | 270 | number }
  | { type: 'flip'; axis: 'horizontal' | 'vertical' }
  | {
      type: 'adjust';
      brightness?: number;
      contrast?: number;
      saturation?: number;
      temperature?: number;
      exposure?: number;
    }
  | { type: 'blur'; radius: number }
  | { type: 'filter'; name: FilterName; intensity?: number }
  | {
      type: 'watermark';
      uri: string;
      x: number;
      y: number;
      scale?: number;
      opacity?: number;
    };

/**
 * Video operation types
 */
export type VideoOperation =
  | { type: 'trim'; startSec: number; endSec: number }
  | { type: 'resize'; width: number; height: number }
  | { type: 'rotate'; degrees: 90 | 180 | 270 | number }
  | { type: 'flip'; axis: 'horizontal' | 'vertical' }
  | { type: 'speed'; rate: number }
  | {
      type: 'adjust';
      brightness?: number;
      contrast?: number;
      saturation?: number;
      temperature?: number;
      exposure?: number;
    }
  | { type: 'filter'; name: FilterName; intensity?: number }
  | {
      type: 'watermark';
      uri: string;
      x: number;
      y: number;
      scale?: number;
      opacity?: number;
    };

/**
 * Media input descriptor
 */
export interface MediaInput {
  type: MediaType;
  uri: string;
  width?: number;
  height?: number;
  durationSec?: number;
}

/**
 * Edit options
 */
export interface EditOptions {
  /** Output format for images: 'jpeg' | 'png' (default jpeg) */
  imageFormat?: 'jpeg' | 'png';
  /** Output quality 0..1 for JPEG/MP4 CRF mapping (default 0.9) */
  quality?: number;
  /** If true, prefer GPU paths; fallback to CPU if needed */
  preferGpu?: boolean;
}

/**
 * Edited media result
 */
export interface EditedMedia {
  type: MediaType;
  uri: string;
  width?: number;
  height?: number;
  durationSec?: number;
  bytes?: number;
}

/**
 * Zod schema for image operations validation
 */
export const ImageOpsSchema = z.array(
  z.union([
    z.object({
      type: z.literal('resize'),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
    z.object({
      type: z.literal('crop'),
      x: z.number().nonnegative(),
      y: z.number().nonnegative(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    z.object({
      type: z.literal('rotate'),
      degrees: z.number(),
    }),
    z.object({
      type: z.literal('flip'),
      axis: z.enum(['horizontal', 'vertical']),
    }),
    z.object({
      type: z.literal('adjust'),
      brightness: z.number().optional(),
      contrast: z.number().optional(),
      saturation: z.number().optional(),
      temperature: z.number().optional(),
      exposure: z.number().optional(),
    }),
    z.object({
      type: z.literal('blur'),
      radius: z.number().nonnegative(),
    }),
    z.object({
      type: z.literal('filter'),
      name: z.enum(['none', 'mono', 'sepia', 'vivid', 'cool', 'warm', 'cinematic']),
      intensity: z.number().min(0).max(1).optional(),
    }),
    z.object({
      type: z.literal('watermark'),
      uri: z.string().url(),
      x: z.number(),
      y: z.number(),
      scale: z.number().optional(),
      opacity: z.number().min(0).max(1).optional(),
    }),
  ])
);

/**
 * Zod schema for video operations validation
 */
export const VideoOpsSchema = z.array(
  z.union([
    z.object({
      type: z.literal('trim'),
      startSec: z.number().min(0),
      endSec: z.number().min(0),
    }),
    z.object({
      type: z.literal('resize'),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
    z.object({
      type: z.literal('rotate'),
      degrees: z.number(),
    }),
    z.object({
      type: z.literal('flip'),
      axis: z.enum(['horizontal', 'vertical']),
    }),
    z.object({
      type: z.literal('speed'),
      rate: z.number().min(0.25).max(4),
    }),
    z.object({
      type: z.literal('adjust'),
      brightness: z.number().optional(),
      contrast: z.number().optional(),
      saturation: z.number().optional(),
      temperature: z.number().optional(),
      exposure: z.number().optional(),
    }),
    z.object({
      type: z.literal('filter'),
      name: z.enum(['none', 'mono', 'sepia', 'vivid', 'cool', 'warm', 'cinematic']),
      intensity: z.number().min(0).max(1).optional(),
    }),
    z.object({
      type: z.literal('watermark'),
      uri: z.string().url(),
      x: z.number(),
      y: z.number(),
      scale: z.number().optional(),
      opacity: z.number().min(0).max(1).optional(),
    }),
  ])
);
