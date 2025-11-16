/* eslint-env node */
 

/**
 * Tailwind Plugin: Linear Gradient Utilities
 *
 * Adds bg-linear-to-* classes as alias for bg-gradient-to-*
 * This provides a consistent naming convention across the codebase.
 */

const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss/types/config').PluginCreator} */
function linearGradientPlugin({ addUtilities, theme }) {
  const directions = {
    't': 'to top',
    'tr': 'to top right',
    'r': 'to right',
    'br': 'to bottom right',
    'b': 'to bottom',
    'bl': 'to bottom left',
    'l': 'to left',
    'tl': 'to top left',
  };

  const utilities = {};

  for (const [key, value] of Object.entries(directions)) {
    utilities[`.bg-linear-to-${key}`] = {
      'background-image': `linear-gradient(${value}, var(--tw-gradient-stops))`,
    };
  }

  addUtilities(utilities);
}

module.exports = linearGradientPlugin;
