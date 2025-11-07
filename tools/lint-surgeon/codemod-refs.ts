import { SyntaxKind } from 'ts-morph';
import { loadProject, saveAll } from './shared';
import { isTruthy, isDefined } from '@/core/guards';

const project = loadProject();
const files = project.getSourceFiles([
  '**/*.{ts,tsx}',
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/.next/**',
]);

for (const sf of files) {
  let mutated = false;

  sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
    const expression = call.getExpression().getText();
    const typeArgs = call.getTypeArguments();
    if (expression === 'useRef' && typeArgs.length === 1) {
      const [typeArg] = typeArgs;
      if (!typeArg) {
        return;
      }
      const text = typeArg.getText();
      if (text === 'any' || text === 'unknown') {
        typeArg.replaceWithText('HTMLElement | null');
        mutated = true;
      }
    }
  });

  if (isTruthy(mutated)) {
    const hasReactImport = sf.getImportDeclarations().some((d) => d.getModuleSpecifierValue() === 'react');
    if (!hasReactImport) {
      sf.addImportDeclaration({ moduleSpecifier: 'react' });
    }
  }
}

saveAll(project);
