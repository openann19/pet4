/**
 * MotionView - Web Implementation
 * Uses Framer Motion for web platform
 */

import { motion } from 'framer-motion'
import type { ComponentProps } from 'react'

export type MotionViewProps = ComponentProps<typeof motion.div>

/**
 * Web-compatible MotionView using Framer Motion
 */
export const MotionView = motion.div
