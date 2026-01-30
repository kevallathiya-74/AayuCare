#!/usr/bin/env node

/**
 * 🧹 AayuCare Duplicate Code Remover
 * 
 * Detects duplicate code blocks and refactors them into utilities
 * 
 * Usage: node scripts/remove-duplicates.js [--fix]
 */

const fs = require('fs');
const path = require('path');

const FIX_MODE = process.argv.includes('--fix');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'build') {
        findAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Common duplicate patterns to extract
 */
const DUPLICATE_PATTERNS = [
  {
    name: 'StyleSheet.create boilerplate',
    pattern: /const styles = StyleSheet\.create\({[\s\S]*?}\);/g,
    extract: false, // Too complex to auto-extract
  },
  {
    name: 'Empty state rendering',
    pattern: /<View style={styles\.empty[^>]*}>[\s\S]*?<Text[^>]*>[^<]*<\/Text>[\s\S]*?<\/View>/g,
    utilityName: 'EmptyState',
    file: 'src/components/common/EmptyState.js',
  },
  {
    name: 'Loading indicator',
    pattern: /<ActivityIndicator[^>]*\/>/g,
    utilityName: 'LoadingIndicator',
    file: 'src/components/common/LoadingOverlay.js',
  },
  {
    name: 'SafeAreaView wrapper',
    pattern: /<SafeAreaView[^>]*>[\s\S]*?<\/SafeAreaView>/g,
    extract: false,
  },
];

/**
 * Refactor card components to use shared utilities
 */
function refactorCardComponents(files) {
  log('\n🔧 Refactoring card components...', 'cyan');
  
  const cardFiles = files.filter(f => 
    f.includes('Card.js') && 
    f.includes('/components/health/')
  );
  
  let refactoredCount = 0;
  
  cardFiles.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Check if already using cardStyles
      if (content.includes('from ../../utils/cardStyles')) {
        return;
      }
      
      // Add import
      const importStatement = "import { createCardStyles } from '../../utils/cardStyles';\n";
      
      if (content.includes('import { StyleSheet')) {
        content = content.replace(
          /(import { StyleSheet[^}]*} from 'react-native';)/,
          `$1\n${importStatement}`
        );
      }
      
      // Replace inline styles with utility
      const stylePattern = /const styles = StyleSheet\.create\({\s*card: {[\s\S]*?},\s*}\);/;
      
      if (stylePattern.test(content)) {
        content = content.replace(stylePattern, 'const styles = createCardStyles();');
        
        if (FIX_MODE && content !== originalContent) {
          fs.writeFileSync(file, content, 'utf8');
          const relativePath = path.relative(process.cwd(), file);
          log(`   ✅ Refactored: ${relativePath}`, 'green');
          refactoredCount++;
        }
      }
      
    } catch (err) {
      // Skip
    }
  });
  
  return refactoredCount;
}

/**
 * Remove duplicate utility functions
 */
function removeDuplicateUtilities(files) {
  log('\n🔧 Removing duplicate utility functions...', 'cyan');
  
  const utilityFiles = files.filter(f => f.includes('/utils/'));
  
  // Common duplicate functions across utils
  const duplicateFunctions = [
    'formatDate',
    'formatTime',
    'validateEmail',
    'validatePhone',
  ];
  
  const functionLocations = new Map();
  
  // Find where each function is defined
  utilityFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      duplicateFunctions.forEach(funcName => {
        const regex = new RegExp(`export\\s+(const|function)\\s+${funcName}`, 'g');
        if (regex.test(content)) {
          if (!functionLocations.has(funcName)) {
            functionLocations.set(funcName, []);
          }
          functionLocations.get(funcName).push(file);
        }
      });
    } catch (err) {
      // Skip
    }
  });
  
  // Report duplicates
  let duplicateCount = 0;
  functionLocations.forEach((locations, funcName) => {
    if (locations.length > 1) {
      log(`   ⚠️  ${funcName} defined in ${locations.length} files:`, 'yellow');
      locations.forEach(loc => {
        log(`      → ${path.relative(process.cwd(), loc)}`, 'cyan');
      });
      duplicateCount++;
    }
  });
  
  return duplicateCount;
}

/**
 * Consolidate date formatters
 */
function consolidateDateFormatters(files) {
  log('\n🔧 Consolidating date formatters...', 'cyan');
  
  let consolidatedCount = 0;
  
  files.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Skip if it's the dateFormatters utility itself
      if (file.includes('dateFormatters.js')) {
        return;
      }
      
      // Skip if already using dateFormatters
      if (content.includes('from ../../utils/dateFormatters') || 
          content.includes('from ../utils/dateFormatters')) {
        return;
      }
      
      // Check for inline date formatting
      const hasDateFormatting = 
        content.includes('.toLocaleDateString(') ||
        content.includes('.toLocaleTimeString(') ||
        content.includes('new Date(') && content.includes('getMonth()');
      
      if (hasDateFormatting) {
        const relativePath = path.relative(process.cwd(), file);
        log(`   📅 ${relativePath} has inline date formatting`, 'yellow');
        consolidatedCount++;
      }
      
    } catch (err) {
      // Skip
    }
  });
  
  return consolidatedCount;
}

/**
 * Consolidate validation functions
 */
function consolidateValidation(files) {
  log('\n🔧 Consolidating validation...', 'cyan');
  
  let consolidatedCount = 0;
  
  files.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      
      // Skip validation utilities
      if (file.includes('validation.js') || file.includes('validators.js')) {
        return;
      }
      
      // Skip if already using validation utils
      if (content.includes('from ../../utils/validation') || 
          content.includes('from ../utils/validation')) {
        return;
      }
      
      // Check for inline validation
      const hasValidation = 
        content.includes('email.match(') ||
        content.includes('@') && content.includes('.test(') ||
        content.includes('password.length');
      
      if (hasValidation) {
        const relativePath = path.relative(process.cwd(), file);
        log(`   ✅ ${relativePath} has inline validation`, 'yellow');
        consolidatedCount++;
      }
      
    } catch (err) {
      // Skip
    }
  });
  
  return consolidatedCount;
}

/**
 * Remove duplicate imports
 */
function removeDuplicateImports(files) {
  log('\n🔧 Removing duplicate imports...', 'cyan');
  
  let fixedCount = 0;
  
  files.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Find all import statements
      const imports = content.match(/import [^;]+;/g) || [];
      const uniqueImports = new Set();
      const duplicates = [];
      
      imports.forEach(imp => {
        if (uniqueImports.has(imp)) {
          duplicates.push(imp);
        } else {
          uniqueImports.add(imp);
        }
      });
      
      if (duplicates.length > 0 && FIX_MODE) {
        // Remove duplicates
        duplicates.forEach(dup => {
          const firstOccurrence = content.indexOf(dup);
          const secondOccurrence = content.indexOf(dup, firstOccurrence + 1);
          
          if (secondOccurrence > -1) {
            content = content.substring(0, secondOccurrence) + 
                     content.substring(secondOccurrence + dup.length);
          }
        });
        
        if (content !== originalContent) {
          fs.writeFileSync(file, content, 'utf8');
          const relativePath = path.relative(process.cwd(), file);
          log(`   ✅ Fixed: ${relativePath} (${duplicates.length} duplicates)`, 'green');
          fixedCount++;
        }
      }
      
    } catch (err) {
      // Skip
    }
  });
  
  return fixedCount;
}

async function main() {
  log('\n🧹 AayuCare Duplicate Code Remover\n', 'cyan');
  
  if (FIX_MODE) {
    log('🔧 FIX MODE ENABLED\n', 'yellow');
  } else {
    log('📋 ANALYSIS MODE (use --fix to apply changes)\n', 'yellow');
  }
  
  const srcDir = path.join(__dirname, '..', 'src');
  const allFiles = findAllFiles(srcDir);
  
  log(`📂 Scanning ${allFiles.length} files...\n`, 'cyan');
  
  // Run all refactorings
  const stats = {
    cardsRefactored: refactorCardComponents(allFiles),
    duplicateUtils: removeDuplicateUtilities(allFiles),
    dateFormatters: consolidateDateFormatters(allFiles),
    validation: consolidateValidation(allFiles),
    duplicateImports: removeDuplicateImports(allFiles),
  };
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📊 Duplicate Code Analysis:\n', 'cyan');
  log(`Card components refactored:     ${stats.cardsRefactored}`, 'green');
  log(`Duplicate utility functions:    ${stats.duplicateUtils}`, 'yellow');
  log(`Files with inline dates:        ${stats.dateFormatters}`, 'yellow');
  log(`Files with inline validation:   ${stats.validation}`, 'yellow');
  log(`Duplicate imports fixed:        ${stats.duplicateImports}`, 'green');
  
  const totalIssues = stats.duplicateUtils + stats.dateFormatters + stats.validation;
  
  if (totalIssues > 0) {
    log(`\n⚠️  ${totalIssues} opportunities to reduce duplication`, 'yellow');
    log('💡 Consider using the utility functions in src/utils/', 'cyan');
  } else {
    log('\n✅ No duplicate code issues found!', 'green');
  }
  
  if (FIX_MODE) {
    const totalFixed = stats.cardsRefactored + stats.duplicateImports;
    log(`\n🔧 Fixed ${totalFixed} files automatically\n`, 'green');
  } else {
    log('\n💡 Run with --fix to automatically refactor\n', 'cyan');
  }
}

main().catch(err => {
  log(`\n💥 Error: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
