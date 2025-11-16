/**
 * Codemod to normalize animation system usage:
 * - Removes AnimatedView imports, replaces with MotionView
 * - Removes useAnimatePresence imports, replaces with Presence
 * - Updates JSX tags <AnimatedView> -> <MotionView>
 * - Ensures @petspark/motion imports include needed specifiers
 */
module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  let usedAnimatedView = false;
  let removedAnimatePresence = false;

  // 1) Remove legacy imports and remember if we saw them
  root.find(j.ImportDeclaration).forEach((path) => {
    const src = path.value.source.value;

    if (src === '@/effects/reanimated/animated-view') {
      const keep = [];
      for (const s of path.value.specifiers || []) {
        if (s.imported && s.imported.name === 'AnimatedView') {
          usedAnimatedView = true; // will add MotionView
          continue; // drop
        }
        // Keep type imports like AnimatedStyle - they may still be needed
        // or can be imported from @petspark/motion if available
        keep.push(s);
      }
      path.value.specifiers = keep;
      if (keep.length === 0) j(path).remove();
    }

    if (src === '@/effects/reanimated/use-animate-presence') {
      const keep = [];
      for (const s of path.value.specifiers || []) {
        if (s.imported && s.imported.name === 'useAnimatePresence') {
          removedAnimatePresence = true; // will add Presence
          continue; // drop
        }
        keep.push(s);
      }
      path.value.specifiers = keep;
      if (keep.length === 0) j(path).remove();
    }
  });

  // 2) Ensure motion import exists with needed specifiers
  const motionImports = root.find(j.ImportDeclaration, {
    source: { value: '@petspark/motion' },
  });

  if (motionImports.size() === 0) {
    const specs = [];
    if (usedAnimatedView) specs.push(j.importSpecifier(j.identifier('MotionView')));
    if (removedAnimatePresence) specs.push(j.importSpecifier(j.identifier('Presence')));
    if (specs.length > 0) {
      const imp = j.importDeclaration(specs, j.literal('@petspark/motion'));
      root.get().node.program.body.unshift(imp);
    }
  } else {
    motionImports.forEach((p) => {
      const existing = new Set((p.value.specifiers || []).map((s) => s.imported && s.imported.name));
      if (usedAnimatedView && !existing.has('MotionView')) {
        p.value.specifiers.push(j.importSpecifier(j.identifier('MotionView')));
      }
      if (removedAnimatePresence && !existing.has('Presence')) {
        p.value.specifiers.push(j.importSpecifier(j.identifier('Presence')));
      }
    });
  }

  // 3) Rename JSX tags <AnimatedView> -> <MotionView>
  if (usedAnimatedView) {
    root
      .find(j.JSXIdentifier, { name: 'AnimatedView' })
      .forEach((p) => {
        p.value.name = 'MotionView';
      });
  }

  return root.toSource();
};
