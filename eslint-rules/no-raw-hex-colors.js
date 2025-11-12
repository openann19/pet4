/**
 * ESLint Rule: No Raw Hex Colors
 * Bans the use of raw hex color values in favor of design tokens
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw hex color values. Use design tokens instead.',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      noHexColor: 'Raw hex color "{{value}}" found. Use design token instead (e.g., --primary, --background).',
    },
  },
  create(context) {
    const hexColorRegex = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\b/g;

    function checkString(node, value) {
      if (typeof value !== 'string') return;

      const matches = [...value.matchAll(hexColorRegex)];
      for (const match of matches) {
        context.report({
          node,
          messageId: 'noHexColor',
          data: { value: match[0] },
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkString(node, node.value);
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          checkString(quasi, quasi.value.raw);
        }
      },
      JSXAttribute(node) {
        if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'string') {
          checkString(node.value, node.value.value);
        }
      },
    };
  },
};
