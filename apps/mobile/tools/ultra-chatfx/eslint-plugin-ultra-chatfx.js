/* eslint-env node */
import { minimatch } from 'minimatch';

function fileMatches(context, globs) {
  const name = context.getFilename();
  return (globs || []).some((g) => minimatch(name, g, { dot: true }));
}

export default {
  rules: {
    // 1) Disallow classic RN Animated in chat/effects – enforce Reanimated/Skia path
    'no-react-native-animated': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Use Reanimated/Skia; ban React Native Animated.',
        },
        messages: {
          banned: 'Classic React Native Animated is banned. Use react-native-reanimated worklets.',
        },
      },
      create(ctx) {
        return {
          ImportDeclaration(node) {
            if (node.source.value === 'react-native') {
              const hasAnimated = node.specifiers.some(
                (s) => s.imported && s.imported.name === 'Animated',
              );
              if (hasAnimated) {
                ctx.report({
                  node,
                  messageId: 'banned',
                });
              }
            }
          },
        };
      },
    },

    // 2) Require reduced-motion guard whenever using withTiming/withSpring/etc
    'require-reduced-motion-guard': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Animations must respect Reduced Motion.',
        },
        messages: {
          missing: 'Reanimated animation detected without a Reduced Motion guard (AccessibilityInfo or useReducedMotion* hook).',                               
        },
        schema: [
          {
            type: 'object',
            properties: {
              globs: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(ctx) {
        const options = ctx.options && ctx.options[0] || {};
        const globs = options.globs || [];

        if (!fileMatches(ctx, globs)) {
          return {};
        }

        let usesReanimatedAPI = false;
        let sawReducedMotion = false;

        return {
          ImportDeclaration(node) {
            if (node.source.value === 'react-native-reanimated') {
              const names = node.specifiers
                .map((s) => s.imported && s.imported.name)
                .filter(Boolean);
              if (
                names.some((n) =>
                  ['withTiming', 'withSpring', 'withDecay', 'Easing', 'useAnimatedStyle'].includes(n),
                )
              ) {
                usesReanimatedAPI = true;
              }
            }
            // Accept either our hook name OR native AccessibilityInfo presence
            if (node.source.value === 'react-native') {
              if (
                node.specifiers.some(
                  (s) => s.imported && s.imported.name === 'AccessibilityInfo',
                )
              ) {
                sawReducedMotion = true;
              }
            }
              if (
                typeof node.source.value === 'string' &&
                node.source.value.includes('effects/core')
              ) {
              if (
                node.specifiers.some(
                  (s) => s.imported && /useReducedMotion/i.test(s.imported.name),
                )
              ) {
                sawReducedMotion = true;
              }
            }
          },
          Identifier(node) {
            if (/reducedMotion/i.test(node.name) || /useReducedMotion/i.test(node.name)) {
              sawReducedMotion = true;
            }
          },
          'Program:exit'() {
            if (usesReanimatedAPI && !sawReducedMotion) {
              ctx.report({
                loc: { line: 1, column: 0 },
                messageId: 'missing',
              });
            }
          },
        };
      },
    },

    // 3) Effects modules must import Skia (GPU path)
    'require-skia-in-effects': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Effects files must use Skia for GPU rendering.',
        },
        messages: {
          missing: "Effect component (suffix 'FX') exported without Skia import.",                                                                              
        },
        schema: [
          {
            type: 'object',
            properties: {
              globs: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(ctx) {
        const options = ctx.options && ctx.options[0] || {};
        const globs = options.globs || [];

        if (!fileMatches(ctx, globs)) {
          return {};
        }

        let sawSkia = false;
        let sawEffectExport = false;

        return {
          ImportDeclaration(node) {
            if (
              typeof node.source.value === 'string' &&
              node.source.value.includes('@shopify/react-native-skia')
            ) {
              sawSkia = true;
            }
          },
          ExportNamedDeclaration(node) {
            if (
              node.declaration &&
              node.declaration.id &&
              /FX$/.test(node.declaration.id.name)
            ) {
              sawEffectExport = true;
            }
            if (node.declaration && node.declaration.declarations) {
              for (const decl of node.declaration.declarations) {
                if (decl.id && decl.id.name && /FX$/.test(decl.id.name)) {
                  sawEffectExport = true;
                }
              }
            }
          },
          'Program:exit'() {
            if (sawEffectExport && !sawSkia) {
              ctx.report({
                loc: { line: 1, column: 0 },
                messageId: 'missing',
              });
            }
          },
        };
      },
    },

    // 4) Ban Math.random in effects/chat to enforce deterministic physics unless seeded                                                                        
    'ban-math-random-in-effects': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Deterministic effects only. No Math.random in effects/chat.',                                                                           
        },
        messages: {
          banned: 'Math.random is banned in effects/chat. Use a seeded RNG.',
        },
        schema: [
          {
            type: 'object',
            properties: {
              globs: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(ctx) {
        const options = ctx.options && ctx.options[0] || {};
        const globs = options.globs || [];

        if (!fileMatches(ctx, globs)) {
          return {};
        }

        return {
          MemberExpression(node) {
            if (
              node.object &&
              node.object.name === 'Math' &&
              node.property &&
              node.property.name === 'random'
            ) {
              ctx.report({
                node,
                messageId: 'banned',
              });
            }
          },
        };
      },
    },
  },
};

