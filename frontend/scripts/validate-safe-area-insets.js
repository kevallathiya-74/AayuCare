#!/usr/bin/env node

/**
 * SafeAreaInsets Validator
 * Prevents runtime errors by ensuring correct usage of useSafeAreaInsets API
 * 
 * CRITICAL: Detects incorrect function calls like insets.bottom() instead of insets.bottom
 * 
 * Usage: node scripts/validate-safe-area-insets.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');

// Patterns to detect
const INCORRECT_PATTERNS = [
  { pattern: /insets\.bottom\s*\(/g, property: 'bottom' },
  { pattern: /insets\.top\s*\(/g, property: 'top' },
  { pattern: /insets\.left\s*\(/g, property: 'left' },
  { pattern: /insets\.right\s*\(/g, property: 'right' },
];

let errors = [];
let filesChecked = 0;

function checkFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) {
    return;
  }

  filesChecked++;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if file uses useSafeAreaInsets
  if (!content.includes('useSafeAreaInsets')) {
    return; // File doesn't use safe area insets, skip
  }

  // Check for incorrect patterns
  for (const { pattern, property } of INCORRECT_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      const lines = content.split('\n');
      const matchedLines = [];
      
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          matchedLines.push({
            line: index + 1,
            code: line.trim()
          });
        }
      });

      const relativePath = path.relative(process.cwd(), filePath);
      errors.push({
        file: relativePath,
        property,
        count: matches.length,
        lines: matchedLines,
        message: `Incorrect usage: insets.${property}() is called as a function`,
        fix: `Change to: insets.${property} (property access, not function call)`
      });
    }
  }
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      checkFile(fullPath);
    }
  }
}

console.log('🔍 Validating SafeAreaInsets usage...\n');

try {
  scanDirectory(SRC_DIR);

  if (errors.length === 0) {
    console.log(`✅ Success! All ${filesChecked} files use SafeAreaInsets correctly.\n`);
    process.exit(0);
  } else {
    console.error(`❌ Found ${errors.length} file(s) with incorrect SafeAreaInsets usage:\n`);
    
    errors.forEach((error, index) => {
      console.error(`${index + 1}. ${error.file}`);
      console.error(`   ${error.message}`);
      console.error(`   Fix: ${error.fix}`);
      console.error(`   Occurrences: ${error.count}`);
      error.lines.forEach(({ line, code }) => {
        console.error(`   Line ${line}: ${code}`);
      });
      console.error('');
    });

    console.error(`Total files checked: ${filesChecked}`);
    console.error(`Files with errors: ${errors.length}\n`);
    
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Error running validation:', err.message);
  process.exit(1);
}
