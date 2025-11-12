/**
 * ESLint Rule: Enforce Design Tokens
 * Enforces use of design tokens for spacing, radii, and other design values
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce use of design tokens for spacing, radii, and other design values.',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      rawSpacing: 'Raw spacing value found. Use spacing token (e.g., --spacing-4, p-4).',
      rawRadius: 'Raw radius value found. Use radius token (e.g., --radius-md, rounded-md).',
      rawShadow: 'Raw shadow value found. Use shadow token (e.g., --shadow-md).',
    },
  },
  create(context) {
    // Pattern for raw pixel values in Tailwind classes
    const rawSpacingPattern = /(?:p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr|gap|space)-\[?\d+px\]?/;
    const rawRadiusPattern = /rounded-\[?\d+px\]?/;
    const rawShadowPattern = /shadow-\[?['"][^'"]*['"]\]?/;

    function checkClassName(node, className) {
      if (typeof className !== 'string') return;

      if (rawSpacingPattern.test(className)) {
        context.report({
          node,
          messageId: 'rawSpacing',
        });
      }

      if (rawRadiusPattern.test(className)) {
        context.report({
          node,
          messageId: 'rawRadius',
        });
      }

      if (rawShadowPattern.test(className) && !className.includes('shadow-')) {
        context.report({
          node,
          messageId: 'rawShadow',
        });
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name.name === 'className' && node.value) {
          if (node.value.type === 'Literal' && typeof node.value.value === 'string') {
            checkClassName(node.value, node.value.value);
          } else if (node.value.type === 'JSXExpressionContainer' && node.value.expression.type === 'Literal') {
            checkClassName(node.value.expression, node.value.expression.value);
          }
        }
      },
    };
  },
};
