import { SyntaxKind } from 'ts-morph';
import { loadProject, ensureLoggerImport, saveAll } from './shared';

const project = loadProject();
const files = project.getSourceFiles(['**/*.{ts,tsx,js,jsx}', '!**/node_modules/**', '!**/dist/**', '!**/.next/**']);

for (const sf of files) {
  let mutated = false;
  sf.forEachDescendant((node) => {
    if (node.getKind() === SyntaxKind.PropertyAccessExpression) {
      const pae = node.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
      const expr = pae.getExpression().getText();
      const name = pae.getName();
      if (expr === 'console' && ['log', 'warn', 'error', 'debug'].includes(name)) {
        mutated = true;
        pae.replaceWithText(`logger.${name === 'log' ? 'info' : name}`);
      }
    }
  });
  if (mutated) {
    ensureLoggerImport(sf);
  }
}

saveAll(project);
