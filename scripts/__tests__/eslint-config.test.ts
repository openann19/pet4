/**
 * ESLint Configuration Validation Tests
 * 
 * Ensures ESLint configs are properly set up across the monorepo:
 * - No duplicate configs
 * - Flat config format used
 * - No deprecated .eslintrc files
 */

import { describe, it, expect } from 'vitest'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const ROOT_DIR = join(import.meta.dirname, '..', '..')

describe('ESLint Configuration Validation', () => {
  it('should have no .eslintrc files (deprecated format)', async () => {
    const deprecatedConfigs: string[] = []
    
    const checkDir = async (dir: string, relativePath: string = ''): Promise<void> => {
      const entries = await readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        const relPath = join(relativePath, entry.name)
        
        // Skip node_modules and other ignored directories
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') {
          continue
        }
        
        if (entry.isDirectory()) {
          await checkDir(fullPath, relPath)
        } else if (entry.isFile()) {
          // Check for deprecated ESLint config files
          if (entry.name.startsWith('.eslintrc')) {
            deprecatedConfigs.push(relPath)
          }
        }
      }
    }
    
    await checkDir(ROOT_DIR)
    
    expect(deprecatedConfigs).toEqual([])
  })
  
  it('should have flat config (eslint.config.js) in each package', async () => {
    const packages = [
      'apps/web',
      'apps/mobile',
      'packages/shared',
    ]
    
    const missingConfigs: string[] = []
    
    for (const pkg of packages) {
      const configPath = join(ROOT_DIR, pkg, 'eslint.config.js')
      if (!existsSync(configPath)) {
        missingConfigs.push(pkg)
      }
    }
    
    expect(missingConfigs).toEqual([])
  })
  
  it('should not have duplicate eslint.config.mjs files', async () => {
    const duplicateConfigs: string[] = []
    
    const checkDir = async (dir: string, relativePath: string = ''): Promise<void> => {
      const entries = await readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        const relPath = join(relativePath, entry.name)
        
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue
        }
        
        if (entry.isDirectory()) {
          await checkDir(fullPath, relPath)
        } else if (entry.isFile() && entry.name === 'eslint.config.mjs') {
          // If both .js and .mjs exist, that's a duplicate
          const jsConfigPath = join(dir, 'eslint.config.js')
          if (existsSync(jsConfigPath)) {
            duplicateConfigs.push(relPath)
          }
        }
      }
    }
    
    await checkDir(ROOT_DIR)
    
    expect(duplicateConfigs).toEqual([])
  })
  
  it('should have valid flat config syntax in all configs', async () => {
    const packages = [
      'apps/web',
      'apps/mobile',
      'packages/shared',
    ]
    
    const invalidConfigs: string[] = []
    
    for (const pkg of packages) {
      const configPath = join(ROOT_DIR, pkg, 'eslint.config.js')
      if (existsSync(configPath)) {
        try {
          const content = await readFile(configPath, 'utf-8')
          // Check for flat config indicators
          const hasFlatConfig = 
            content.includes('export default') ||
            content.includes('tseslint.config') ||
            content.includes('@eslint/js')
          
          if (!hasFlatConfig) {
            invalidConfigs.push(pkg)
          }
        } catch (error) {
          invalidConfigs.push(pkg)
        }
      }
    }
    
    expect(invalidConfigs).toEqual([])
  })
  
  it('should have consistent TypeScript ESLint configuration', async () => {
    const packages = [
      'apps/web',
      'apps/mobile',
      'packages/shared',
    ]
    
    const inconsistentConfigs: string[] = []
    
    for (const pkg of packages) {
      const configPath = join(ROOT_DIR, pkg, 'eslint.config.js')
      if (existsSync(configPath)) {
        try {
          const content = await readFile(configPath, 'utf-8')
          // Check for required TypeScript ESLint config
          const hasTypeScriptConfig = 
            content.includes('typescript-eslint') ||
            content.includes('tseslint')
          
          if (!hasTypeScriptConfig) {
            inconsistentConfigs.push(pkg)
          }
        } catch (error) {
          inconsistentConfigs.push(pkg)
        }
      }
    }
    
    expect(inconsistentConfigs).toEqual([])
  })
})

