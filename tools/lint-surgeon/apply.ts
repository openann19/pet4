#!/usr/bin/env tsx
import './codemod-console-to-logger';
import './codemod-strict-boolean';
import './codemod-template-expr';
import './codemod-refs';
import logger from '@/core/logger';

logger.info('Applied codemods. Run eslint --fix next.');
