import { SyntaxKind } from 'ts-morph';
import { loadProject, ensureGuardsImport, saveAll } from './shared';
import { isTruthy, isDefined } from '@/core/guards';

const project = loadProject();
const files = project.getSourceFiles([
  '**/*.{ts,tsx}',
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/.next/**',
  '!scripts/**',
]);

for (const sf of files) {
  let mutated = false;

  sf.forEachDescendant((node) => {
    if (
      node.getKind() === SyntaxKind.IfStatement ||
      node.getKind() === SyntaxKind.WhileStatement ||
      node.getKind() === SyntaxKind.DoStatement
    ) {
      const expr =
        'getExpression' in node && typeof node.getExpression === 'function'
          ? node.getExpression()
          : undefined;
      if (!expr) return;

      const kind = expr.getKind();
      const simple =
        kind === SyntaxKind.Identifier ||
        kind === SyntaxKind.PropertyAccessExpression ||
        kind === SyntaxKind.ElementAccessExpression;

      if (isTruthy(simple)) {
        const text = expr.getText();
        if (text !== 'true' && text !== 'false' && !/^!/.test(text) && !text.startsWith('isTruthy(')) {
          expr.replaceWithText(`isTruthy(${String(text ?? '')})`);
          mutated = true;
        }
      }
    }
  });

  if (isTruthy(mutated)) {
    ensureGuardsImport(sf);
  }
}

saveAll(project);
