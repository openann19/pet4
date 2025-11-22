# ✨ Welcome to Your Spark Template

You've just launched your brand-new Spark Template Codespace — everything's fired up and ready for you to explore, build, and create with Spark!

This template is your blank canvas. It comes with a minimal setup to help you get started quickly with Spark development.

🚀 What's Inside?

- A clean, minimal Spark environment
- Pre-configured for local development
- Ready to scale with your ideas

## 🎨 Animation System

This project uses a unified animation system powered by **Framer Motion** through the `@petspark/motion` façade package. This provides a consistent animation API across web and mobile platforms.

### Key Principles

- **Single Import Surface**: All animations must use `@petspark/motion` (aliased to `packages/motion/src/framer-api`)
- **Motion Semantics**: Use `MotionValue<T>` instead of `{ value: T }` patterns
- **Platform Aware**: Automatically resolves to appropriate implementations (Framer Motion for web, Reanimated for mobile)
- **Performance Optimized**: Includes reduced motion support and performance budgets

### Usage Examples

```typescript
import { useMotionValue, animate, MotionView } from '@petspark/motion'

// Motion values for reactive animations
const scale = useMotionValue(1)

// Animate values
animate(scale, 1.2, { type: 'spring' })

// Use in components
<MotionView
  style={{ scale }}
  whileHover={{ scale: 1.1 }}
  transition={{ type: 'spring' }}
>
  Content
</MotionView>
```

### Migration Notes

- ✅ **Completed**: All web animations migrated from `react-native-reanimated` to motion façade
- ✅ **Removed**: Polyfills and direct reanimated imports
- ✅ **Updated**: Vite config and build optimizations
- ✅ **Tested**: All animation hooks and components use Framer Motion under the hood

🧠 What Can You Do?

Right now, this is just a starting point — the perfect place to begin building and testing your Spark applications.

🧹 Just Exploring?
No problem! If you were just checking things out and don't need to keep this code:

- Simply delete your Spark.
- Everything will be cleaned up — no traces left behind.

📄 License For Spark Template Resources

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
