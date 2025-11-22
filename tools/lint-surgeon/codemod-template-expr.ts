import { Node, SyntaxKind } from 'ts-morph';
import { loadProject, saveAll } from './shared';
import { isTruthy } from '@/core/guards';

const project = loadProject();
const files = project.getSourceFiles(['**/*.{ts,tsx}', '!**/node_modules/**', '!**/dist/**', '!**/.next/**']);

for (const sf of files) {
  let mutated = false;

  const templates = [...sf.getDescendantsOfKind(SyntaxKind.TemplateExpression)];
  for (const template of templates) {
    if (template.wasForgotten()) {
      continue;
    }

    const expressions = template.getTemplateSpans().map((span) => span.getExpression());
    for (const expr of expressions) {
      const code = expr.getText();

      if (/^(String|Number|Boolean)\(/.test(code)) {
        continue;
      }

      if (/\?\?/.test(code)) {
        continue;
      }

      if (Node.isStringLiteral(expr) || Node.isNoSubstitutionTemplateLiteral(expr)) {
        continue;
      }

      expr.replaceWithText(`String(${String(code ?? '')} ?? '')`);
      mutated = true;
    }
  }

  if (isTruthy(mutated)) {
    // no imports needed
  }
}

saveAll(project);
