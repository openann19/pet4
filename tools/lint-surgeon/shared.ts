import { Project, QuoteKind } from 'ts-morph';

export function loadProject(): Project {
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: false,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
      useTrailingCommas: true,
    },
  });
  return project;
}

export function ensureLoggerImport(source: import('ts-morph').SourceFile): void {
  const has = source.getImportDeclarations().some((d) =>
    d.getModuleSpecifierValue().endsWith('/core/logger') ||
    d.getModuleSpecifierValue() === '@/core/logger' ||
    d.getModuleSpecifierValue() === 'src/core/logger'
  );
  if (!has) {
    source.addImportDeclaration({
      defaultImport: 'logger',
      moduleSpecifier: '../../src/core/logger',
    });
  }
}

export function ensureGuardsImport(source: import('ts-morph').SourceFile): void {
  const has = source.getImportDeclarations().some((d) =>
    d.getModuleSpecifierValue().endsWith('/core/guards') ||
    d.getModuleSpecifierValue() === '@/core/guards'
  );
  if (!has) {
    source.addImportDeclaration({
      namedImports: ['isTruthy', 'isDefined'],
      moduleSpecifier: '../../src/core/guards',
    });
  }
}

export function saveAll(project: Project): void {
  project.saveSync();
}
