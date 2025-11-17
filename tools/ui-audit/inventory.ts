import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';

const out = (p: string, d: unknown): void => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
};

const pages = fg.sync('apps/web/app/**/page.tsx');
const screens = fg.sync('apps/mobile/src/screens/**/*.tsx');
const modules = fg.sync(['packages/{ui,motion,utils,config,contracts}/**/*.ts{,x}']);

out(
  'audit/inventory/pages.json',
  pages.map((p) => ({
    path: p,
    slug: p.replace(/[^a-z0-9]+/gi, '-'),
    url: '/' + p.split('app/')[1]?.replace('/page.tsx', '') || '/',
  }))
);

out(
  'audit/inventory/screens.json',
  screens.map((p) => ({
    path: p,
    name: path.basename(p, '.tsx'),
    slug: p.replace(/[^a-z0-9]+/gi, '-'),
    testID: `nav-${path.basename(p, '.tsx').toLowerCase()}`,
  }))
);

out(
  'audit/inventory/modules.json',
  modules.map((p) => ({
    path: p,
  }))
);
