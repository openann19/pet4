#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { mergeCommand } from './commands/merge.js'
import { lockCommand } from './commands/lock.js'
import { diffCommand } from './commands/diff.js'
import { migrateCommand } from './commands/migrate.js'
import { newPackCommand } from './commands/new-pack.js'

const program = new Command()

program
  .name('spec')
  .description('Spec pack management CLI')
  .version('0.1.0')

program
  .command('merge')
  .description('Merge packs into a merged spec')
  .requiredOption('-i, --input <patterns...>', 'Input pack file patterns (glob)')
  .requiredOption('-o, --output <file>', 'Output merged spec file')
  .option('-l, --lock-file <file>', 'Lock file path')
  .action(async (options) => {
    try {
      await mergeCommand({
        input: options.input,
        output: options.output,
        lockFile: options.lockFile,
      })
      console.log(chalk.green('✓ Merged packs successfully'))
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(chalk.red('✗ Merge failed:'), err.message)
      process.exit(1)
    }
  })

program
  .command('lock')
  .description('Generate lock file with signatures')
  .requiredOption('-m, --merged-spec <file>', 'Merged spec file')
  .requiredOption('-o, --output <file>', 'Output lock file')
  .requiredOption('--issued-by <name>', 'Issuer name')
  .option('--reviewed-at <date>', 'Review date (ISO 8601)')
  .action(async (options) => {
    try {
      await lockCommand({
        mergedSpec: options.mergedSpec,
        output: options.output,
        issuedBy: options.issuedBy,
        reviewedAt: options.reviewedAt,
      })
      console.log(chalk.green('✓ Lock file generated successfully'))
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(chalk.red('✗ Lock failed:'), err.message)
      process.exit(1)
    }
  })

program
  .command('diff')
  .description('Compare two merged specs')
  .requiredOption('-o, --old-spec <file>', 'Old merged spec file')
  .requiredOption('-n, --new-spec <file>', 'New merged spec file')
  .action(async (options) => {
    try {
      const diff = await diffCommand({
        oldSpec: options.oldSpec,
        newSpec: options.newSpec,
      })

      console.log(chalk.bold('Diff Results:'))
      console.log(chalk.green(`  Added: ${diff.added.length}`))
      console.log(chalk.red(`  Removed: ${diff.removed.length}`))
      console.log(chalk.yellow(`  Updated: ${diff.updated.length}`))
      console.log(chalk.gray(`  Unchanged: ${diff.unchanged.length}`))

      if (diff.added.length > 0) {
        console.log(chalk.green('\nAdded packs:'))
        for (const pack of diff.added) {
          console.log(`  + ${pack.packId}@${pack.version}`)
        }
      }

      if (diff.removed.length > 0) {
        console.log(chalk.red('\nRemoved packs:'))
        for (const pack of diff.removed) {
          console.log(`  - ${pack.packId}@${pack.version}`)
        }
      }

      if (diff.updated.length > 0) {
        console.log(chalk.yellow('\nUpdated packs:'))
        for (const pack of diff.updated) {
          console.log(`  ~ ${pack.packId}: ${pack.oldVersion} → ${pack.newVersion}`)
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(chalk.red('✗ Diff failed:'), err.message)
      process.exit(1)
    }
  })

program
  .command('migrate')
  .description('Migrate pack using registry')
  .requiredOption('-p, --pack-file <file>', 'Pack file to migrate')
  .requiredOption('-r, --registry-file <file>', 'Registry file')
  .option('-v, --target-version <version>', 'Target version')
  .action(async (options) => {
    try {
      await migrateCommand({
        packFile: options.packFile,
        registryFile: options.registryFile,
        targetVersion: options.targetVersion,
      })
      console.log(chalk.green('✓ Pack migrated successfully'))
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(chalk.red('✗ Migration failed:'), err.message)
      process.exit(1)
    }
  })

program
  .command('new-pack')
  .description('Scaffold a new pack')
  .requiredOption('--pack-id <id>', 'Pack ID')
  .requiredOption('--name <name>', 'Pack name')
  .requiredOption('--version <version>', 'Pack version')
  .requiredOption('-o, --output <file>', 'Output pack file')
  .option('--description <text>', 'Pack description')
  .option('--author <name>', 'Pack author')
  .option('--license <license>', 'Pack license')
  .option('--tags <tags...>', 'Pack tags')
  .action(async (options) => {
    try {
      await newPackCommand({
        packId: options.packId,
        name: options.name,
        version: options.version,
        output: options.output,
        description: options.description,
        author: options.author,
        license: options.license,
        tags: options.tags,
      })
      console.log(chalk.green('✓ Pack scaffolded successfully'))
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(chalk.red('✗ Scaffold failed:'), err.message)
      process.exit(1)
    }
  })

program.parse()
