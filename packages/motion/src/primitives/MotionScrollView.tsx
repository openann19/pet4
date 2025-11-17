/**
 * MotionScrollView - Web Implementation
 * Uses Framer Motion for web platform
 */

import { motion } from 'framer-motion'
import type { ComponentProps } from 'react'

export type MotionScrollViewProps = ComponentProps<typeof motion.div>

/**
 * Web-compatible MotionScrollView using Framer Motion
 */
export const MotionScrollView = motion.div
