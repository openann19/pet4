/**
 * Web Route Discovery Script
 * Discovers all React Router routes in the web application
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface RouteInfo {
  path: string;
  component: string;
  isLazy: boolean;
  isProtected: boolean;
  states?: string[];
  description?: string;
}

interface RouteMatrix {
  routes: RouteInfo[];
  breakpoints: string[];
  themes: string[];
  states: string[];
}

const APP_TSX_PATH = join(process.cwd(), 'apps/web/src/App.tsx');
const OUTPUT_PATH = join(process.cwd(), 'scripts/ui-audit/web-routes.json');

function discoverRoutes(): RouteMatrix {
  const appContent = readFileSync(APP_TSX_PATH, 'utf-8');

  const routes: RouteInfo[] = [];

  // Extract explicit routes from <Route> components
  const routeMatches = appContent.matchAll(/<Route\s+path="([^"]+)"[^>]*>/g);
  for (const match of routeMatches) {
    const path = match[1];

    // Check if it's a protected route by looking for ProtectedRoute wrapper
    const isProtected = appContent.includes(`path="${path}"`) &&
                       appContent.includes('ProtectedRoute');

    // Extract component name from lazy import or element
    let component = 'Unknown';
    const componentMatch = appContent.match(
      new RegExp(`path="${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>\\s*<[^>]*>\\s*<[^>]*>\\s*<([A-Za-z]+)`, 's')
    );
    if (componentMatch) {
      component = componentMatch[1];
    }

    // Check for lazy loading
    const isLazy = appContent.includes(`lazy(`) || appContent.includes(`createLazyNamed`);

    routes.push({
      path,
      component,
      isLazy,
      isProtected,
    });
  }

  // Extract view-based routes (discover, matches, chat, etc.)
  const viewRoutes: RouteInfo[] = [
    {
      path: '/',
      component: 'App',
      isLazy: false,
      isProtected: false,
      states: ['welcome', 'auth', 'main'],
      description: 'Root route with state-based rendering',
    },
    {
      path: '/demo/pets',
      component: 'PetsDemoPage',
      isLazy: true,
      isProtected: false,
    },
  ];

  // Extract view components from state management
  const viewTypes = ['discover', 'matches', 'chat', 'community', 'adoption', 'lost-found', 'profile'];
  for (const view of viewTypes) {
    viewRoutes.push({
      path: `/${view}`,
      component: `${view.charAt(0).toUpperCase() + view.slice(1)}View`,
      isLazy: true,
      isProtected: false,
      description: `Main ${view} view accessible via state management`,
    });
  }

  // Combine explicit routes with view routes
  const allRoutes = [...routes, ...viewRoutes];

  // Remove duplicates based on path
  const uniqueRoutes = Array.from(
    new Map(allRoutes.map(route => [route.path, route])).values()
  );

  return {
    routes: uniqueRoutes,
    breakpoints: ['xs', 'sm', 'md', 'lg', 'xl'],
    themes: ['light', 'dark'],
    states: ['idle', 'hover', 'focus', 'active', 'disabled', 'loading', 'error', 'empty'],
  };
}

function generateRouteMatrix(matrix: RouteMatrix): void {
  const totalCombinations =
    matrix.routes.length *
    matrix.breakpoints.length *
    matrix.themes.length *
    matrix.states.length;

  console.log('Web Route Discovery Results:');
  console.log(`Total routes: ${matrix.routes.length}`);
  console.log(`Breakpoints: ${matrix.breakpoints.join(', ')}`);
  console.log(`Themes: ${matrix.themes.join(', ')}`);
  console.log(`States: ${matrix.states.join(', ')}`);
  console.log(`Total combinations: ${totalCombinations}`);

  writeFileSync(OUTPUT_PATH, JSON.stringify(matrix, null, 2), 'utf-8');
  console.log(`\nRoute matrix saved to: ${OUTPUT_PATH}`);
}

if (require.main === module) {
  try {
    const matrix = discoverRoutes();
    generateRouteMatrix(matrix);
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Route discovery failed:', err);
    process.exit(1);
  }
}

export { discoverRoutes, type RouteInfo, type RouteMatrix };
