/**
 * MotionText - Web Implementation
 * Uses Framer Motion for web platform
 */

import { motion } from 'framer-motion'
import type { ComponentProps } from 'react'

export type MotionTextProps = ComponentProps<typeof motion.span>

/**
 * Web-compatible MotionText using Framer Motion
 */
export const MotionText = motion.span
