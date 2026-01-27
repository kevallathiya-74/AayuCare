#!/usr/bin/env node

/**
 * Theme Import Validator
 * Prevents runtime errors by ensuring all files using theme properties import theme
 * 
 * Usage: node scripts/validate-theme-imports.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const THEME_PROPERTIES = ['theme.typography', 'theme.spacing', 'theme.colors', 'theme.shadows', 'theme.elevation'];

let errors = [];
let filesChecked = 0;

function checkFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) {
    return;
  }

  filesChecked++;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if file uses theme properties
  const usesTheme = THEME_PROPERTIES.some(prop => content.includes(prop));
  
  if (!usesTheme) {
    return; // File doesn't use theme, skip
  }

  // Check if file imports theme
  const hasThemeImport = /import\s+(?:{[^}]*\btheme\b[^}]*}|\btheme\b)/.test(content);

  if (!hasThemeImport) {
    const relativePath = path.relative(process.cwd(), filePath);
    errors.push({
      file: relativePath,
      message: 'Uses theme properties but does not import theme',
      fix: 'Add: import { theme } from "../../theme" or import { theme } from "../theme"'
    });
  }
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      checkFile(fullPath);
    }
  }
}

console.log('🔍 Validating theme imports...\n');

try {
  scanDirectory(SRC_DIR);

  if (errors.length === 0) {
    console.log(`✅ Success! All ${filesChecked} files have correct theme imports.\n`);
    process.exit(0);
  } else {
    console.error(`❌ Found ${errors.length} file(s) with missing theme imports:\n`);
    
    errors.forEach((error, index) => {
      console.error(`${index + 1}. ${error.file}`);
      console.error(`   ${error.message}`);
      console.error(`   Fix: ${error.fix}\n`);
    });

    console.error(`\nTotal files checked: ${filesChecked}`);
    console.error(`Files with errors: ${errors.length}\n`);
    
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Error running validation:', err.message);
  process.exit(1);
}
