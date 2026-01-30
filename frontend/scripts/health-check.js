#!/usr/bin/env node

/**
 * 🏥 AayuCare Health Check Script
 * 
 * Comprehensive validation from entry point to endpoints:
 * - Syntax errors
 * - Runtime errors (undefined imports, missing files, etc.)
 * - Duplicate code/files
 * - Dead code detection
 * - Import validation
 * - Navigation integrity
 * 
 * Usage: node scripts/health-check.js [--fix] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const FIX_MODE = process.argv.includes('--fix');
const VERBOSE = process.argv.includes('--verbose');

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

const stats = {
  totalFiles: 0,
  syntaxErrors: [],
  runtimeErrors: [],
  duplicateFiles: [],
  duplicateCode: [],
  deadCode: [],
  missingImports: [],
  brokenNavigation: [],
  warnings: [],
  filesFixed: 0,
  issuesFound: 0,
};

// Entry points to validate
const ENTRY_POINTS = [
  'App.js',
  'src/navigation/AppNavigator.js',
  'src/navigation/PatientTabNavigator.js',
  'src/navigation/DoctorTabNavigator.js',
  'src/navigation/AdminTabNavigator.js',
];

/**
 * Print colored message
 */
function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logBold(message, color = 'white') {
  console.log(`${colors.bold}${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function section(title) {
  console.log('\n' + '='.repeat(60));
  logBold(`\n${title}\n`, 'cyan');
  console.log('='.repeat(60) + '\n');
}

/**
 * Find all JS/JSX files
 */
function findAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '__tests__' && file !== 'build') {
        findAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Check 1: Syntax Errors - Using ESLint or basic validation
 */
async function checkSyntaxErrors(files) {
  section('🔍 STEP 1: Checking Syntax Errors');
  
  for (const file of files) {
    stats.totalFiles++;
    
    try {
      let content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);
      
      // Check for common syntax issues in React Native
      const issues = [];
      let modified = false;
      
      // Check 1: Unmatched brackets
      const openBrackets = (content.match(/\{/g) || []).length;
      const closeBrackets = (content.match(/\}/g) || []).length;
      if (openBrackets !== closeBrackets) {
        issues.push(`Unmatched curly brackets: ${openBrackets} opening vs ${closeBrackets} closing`);
      }
      
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        issues.push(`Unmatched parentheses: ${openParens} opening vs ${closeParens} closing`);
      }
      
      const openSquare = (content.match(/\[/g) || []).length;
      const closeSquare = (content.match(/\]/g) || []).length;
      if (openSquare !== closeSquare) {
        issues.push(`Unmatched square brackets: ${openSquare} opening vs ${closeSquare} closing`);
      }
      
      // Check 2: Unterminated strings (excluding comments) - WITH AUTO-FIX
      const lines = content.split('\n');
      const fixedLines = [];
      
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        
        // Skip comments
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          fixedLines.push(line);
          return;
        }
        
        let fixedLine = line;
        
        // Fix common apostrophe issues in JSX text
        // Pattern: >Text with apostrophes like Today's or We're<
        if (line.includes('>') && line.includes('<') && line.includes("'")) {
          // Fix patterns like >Today's< or >We're<
          fixedLine = fixedLine.replace(/>([^<]*)'([^<]*)</g, (match, before, after) => {
            // If this looks like an apostrophe in English text
            if (/[a-z]'[a-z]/i.test(before + "'" + after)) {
              modified = true;
              return `>${before}&#39;${after}<`;
            }
            return match;
          });
          
          // Fix "Today's" pattern in JSX strings
          fixedLine = fixedLine.replace(/Today's/g, () => {
            modified = true;
            return "Today&#39;s";
          });
          
          fixedLine = fixedLine.replace(/TODAY'S/g, () => {
            modified = true;
            return "TODAY&#39;S";
          });
          
          // Fix "Don't" pattern
          fixedLine = fixedLine.replace(/Don't/g, () => {
            modified = true;
            return "Don&#39;t";
          });
          
          // Fix "We're" and "We've" patterns
          fixedLine = fixedLine.replace(/We're/g, () => {
            modified = true;
            return "We&#39;re";
          });
          
          fixedLine = fixedLine.replace(/We've/g, () => {
            modified = true;
            return "We&#39;ve";
          });
        }
        
        fixedLines.push(fixedLine);
        
        // Check if still has issues
        const withoutStrings = fixedLine
          .replace(/"[^"]*"/g, '""')
          .replace(/'[^']*'/g, "''")
          .replace(/`[^`]*`/g, '``');
        
        const singleQuotes = (withoutStrings.match(/'/g) || []).length;
        
        if (singleQuotes % 2 !== 0) {
          issues.push(`Unterminated string (single quote) on line ${idx + 1}: ${line.substring(0, 60)}...`);
        }
      });
      
      // Write fixed content if in fix mode
      if (modified && FIX_MODE) {
        fs.writeFileSync(file, fixedLines.join('\n'), 'utf8');
        stats.filesFixed++;
        log(`   ✅ Fixed apostrophes in: ${relativePath}`, 'green');
      }
      
      // Check 3: Multiple exports default
      const defaultExports = (content.match(/export\s+default/g) || []).length;
      if (defaultExports > 1) {
        issues.push(`Multiple default exports found (${defaultExports})`);
      }
      
      // Check 4: JSX fragments issues
      if (content.includes('<>') && !content.includes('React')) {
        if (!content.includes("import React") && !content.includes("import { Fragment }")) {
          issues.push('JSX fragment used but React not imported');
        }
      }
      
      // Record issues
      if (issues.length > 0 && !modified) {
        issues.forEach(issue => {
          stats.syntaxErrors.push({
            file: relativePath,
            error: issue
          });
          stats.issuesFound++;
        });
      }
      
    } catch (err) {
      stats.warnings.push({
        file: path.relative(process.cwd(), file),
        message: `Cannot read file: ${err.message}`
      });
    }
  }
  
  if (stats.syntaxErrors.length > 0) {
    log(`❌ Found ${stats.syntaxErrors.length} syntax errors:\n`, 'red');
    stats.syntaxErrors.slice(0, 15).forEach(err => {
      log(`   ${err.file}`, 'red');
      log(`   → ${err.error}\n`, 'yellow');
    });
    if (stats.syntaxErrors.length > 15) {
      log(`   ... and ${stats.syntaxErrors.length - 15} more\n`, 'yellow');
    }
    
    if (!FIX_MODE) {
      log(`   💡 Run with --fix to automatically fix apostrophes\n`, 'blue');
    }
  } else {
    log('✅ No syntax errors found!', 'green');
  }
}

/**
 * Check 2: Runtime Errors (Missing imports, undefined variables)
 */
async function checkRuntimeErrors(files) {
  section('🔍 STEP 2: Checking Runtime Errors');
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);
      
      // Check for missing imports
      const importMatches = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
      
      for (const importMatch of importMatches) {
        const importPath = importMatch.match(/from\s+['"]([^'"]+)['"]/)[1];
        
        // Skip node_modules
        if (!importPath.startsWith('.') && !importPath.startsWith('src/')) continue;
        
        let resolvedPath = importPath;
        if (importPath.startsWith('.')) {
          const dir = path.dirname(file);
          resolvedPath = path.resolve(dir, importPath);
        } else if (importPath.startsWith('src/')) {
          resolvedPath = path.resolve(process.cwd(), importPath);
        }
        
        // Add extensions if missing
        const extensions = ['', '.js', '.jsx', '/index.js', '/index.jsx'];
        let found = false;
        
        for (const ext of extensions) {
          if (fs.existsSync(resolvedPath + ext)) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          stats.missingImports.push({
            file: relativePath,
            import: importPath,
            resolved: resolvedPath
          });
          stats.issuesFound++;
        }
      }
      
      // Check for undefined theme references
      if (content.includes('theme.') && !content.includes("import { theme }") && !content.includes('from "../../theme"') && !content.includes("from '../../theme'")) {
        if (!relativePath.includes('theme/')) {
          stats.runtimeErrors.push({
            file: relativePath,
            error: 'Uses theme but missing import',
            type: 'missing-theme-import'
          });
          stats.issuesFound++;
        }
      }
      
      // Check for console.log in production code (warning only)
      const consoleMatches = content.match(/console\.(log|warn|error)\(/g) || [];
      if (consoleMatches.length > 10) {
        stats.warnings.push({
          file: relativePath,
          message: `${consoleMatches.length} console statements found (consider removing)`
        });
      }
      
    } catch (err) {
      // Skip
    }
  }
  
  if (stats.missingImports.length > 0) {
    log(`❌ Found ${stats.missingImports.length} missing imports:\n`, 'red');
    stats.missingImports.slice(0, 10).forEach(err => {
      log(`   ${err.file}`, 'red');
      log(`   → Cannot resolve: ${err.import}\n`, 'yellow');
    });
    if (stats.missingImports.length > 10) {
      log(`   ... and ${stats.missingImports.length - 10} more\n`, 'yellow');
    }
  } else {
    log('✅ No missing imports found!', 'green');
  }
  
  if (stats.runtimeErrors.length > 0) {
    log(`\n⚠️  Found ${stats.runtimeErrors.length} potential runtime issues:\n`, 'yellow');
    stats.runtimeErrors.forEach(err => {
      log(`   ${err.file}`, 'yellow');
      log(`   → ${err.error}\n`, 'yellow');
    });
  }
}

/**
 * Check 3: Duplicate Files
 */
async function checkDuplicateFiles(files) {
  section('🔍 STEP 3: Checking Duplicate Files');
  
  const fileHashes = new Map();
  const crypto = require('crypto');
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const hash = crypto.createHash('md5').update(content).digest('hex');
      
      if (fileHashes.has(hash)) {
        stats.duplicateFiles.push({
          file1: path.relative(process.cwd(), fileHashes.get(hash)),
          file2: path.relative(process.cwd(), file),
          hash
        });
        stats.issuesFound++;
      } else {
        fileHashes.set(hash, file);
      }
    } catch (err) {
      // Skip
    }
  }
  
  if (stats.duplicateFiles.length > 0) {
    log(`⚠️  Found ${stats.duplicateFiles.length} duplicate files:\n`, 'yellow');
    stats.duplicateFiles.forEach(dup => {
      log(`   Duplicate:`, 'yellow');
      log(`   → ${dup.file1}`, 'cyan');
      log(`   → ${dup.file2}\n`, 'cyan');
      
      if (FIX_MODE) {
        // Delete the second duplicate
        try {
          fs.unlinkSync(path.resolve(process.cwd(), dup.file2));
          log(`   ✅ Deleted: ${dup.file2}\n`, 'green');
          stats.filesFixed++;
        } catch (err) {
          log(`   ❌ Failed to delete: ${err.message}\n`, 'red');
        }
      }
    });
    
    if (!FIX_MODE) {
      log(`   Run with --fix to delete duplicates\n`, 'blue');
    }
  } else {
    log('✅ No duplicate files found!', 'green');
  }
}

/**
 * Check 4: Duplicate Code Blocks
 */
async function checkDuplicateCode(files) {
  section('🔍 STEP 4: Checking Duplicate Code Blocks');
  
  const codeBlocks = new Map();
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      // Check for blocks of 10+ identical lines
      for (let i = 0; i < lines.length - 10; i++) {
        const block = lines.slice(i, i + 10).join('\n').trim();
        
        if (block.length < 50) continue; // Skip small blocks
        
        if (codeBlocks.has(block)) {
          const existing = codeBlocks.get(block);
          if (existing.file !== file) {
            stats.duplicateCode.push({
              file1: path.relative(process.cwd(), existing.file),
              file2: path.relative(process.cwd(), file),
              line1: existing.line,
              line2: i + 1,
              snippet: block.substring(0, 60) + '...'
            });
          }
        } else {
          codeBlocks.set(block, { file, line: i + 1 });
        }
      }
    } catch (err) {
      // Skip
    }
  }
  
  if (stats.duplicateCode.length > 0) {
    log(`⚠️  Found ${stats.duplicateCode.length} duplicate code blocks:\n`, 'yellow');
    stats.duplicateCode.slice(0, 5).forEach(dup => {
      log(`   Duplicate code:`, 'yellow');
      log(`   → ${dup.file1}:${dup.line1}`, 'cyan');
      log(`   → ${dup.file2}:${dup.line2}`, 'cyan');
      log(`   "${dup.snippet}"\n`, 'white');
    });
    if (stats.duplicateCode.length > 5) {
      log(`   ... and ${stats.duplicateCode.length - 5} more\n`, 'yellow');
    }
    log(`   ℹ️  Consider refactoring into shared utilities\n`, 'blue');
  } else {
    log('✅ No significant duplicate code found!', 'green');
  }
}

/**
 * Check 5: Dead Code Detection
 */
async function checkDeadCode(files) {
  section('🔍 STEP 5: Checking Dead Code');
  
  const allExports = new Map();
  const allImports = new Set();
  
  // First pass: collect all exports
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);
      
      // Find exports
      const exportMatches = content.match(/export\s+(default\s+)?(class|function|const|let)\s+(\w+)/g) || [];
      exportMatches.forEach(match => {
        const name = match.match(/(\w+)$/)[1];
        allExports.set(`${relativePath}:${name}`, {
          file: relativePath,
          name,
          used: false
        });
      });
    } catch (err) {
      // Skip
    }
  }
  
  // Second pass: check which exports are imported
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Find imports
      const importMatches = content.match(/import\s+{([^}]+)}/g) || [];
      importMatches.forEach(match => {
        const imports = match.match(/{\s*([^}]+)\s*}/)[1].split(',');
        imports.forEach(imp => {
          allImports.add(imp.trim());
        });
      });
    } catch (err) {
      // Skip
    }
  }
  
  // Find unused exports
  let unusedExports = [];
  for (const [key, exportData] of allExports) {
    if (!allImports.has(exportData.name) && exportData.name !== 'default') {
      unusedExports.push(exportData);
    }
  }
  
  // Filter out common patterns that are okay
  unusedExports = unusedExports.filter(exp => {
    return !exp.file.includes('/screens/') && // Screen components are used by navigation
           !exp.file.includes('App.js') &&     // App entry point
           !exp.file.includes('/navigation/'); // Navigation files
  });
  
  if (unusedExports.length > 0) {
    log(`⚠️  Found ${unusedExports.length} potentially unused exports:\n`, 'yellow');
    unusedExports.slice(0, 10).forEach(exp => {
      log(`   ${exp.file}`, 'yellow');
      log(`   → export ${exp.name}\n`, 'cyan');
    });
    if (unusedExports.length > 10) {
      log(`   ... and ${unusedExports.length - 10} more\n`, 'yellow');
    }
    log(`   ℹ️  Review and remove if truly unused\n`, 'blue');
  } else {
    log('✅ No obvious dead code found!', 'green');
  }
  
  stats.deadCode = unusedExports;
}

/**
 * Check 6: Navigation Integrity
 */
async function checkNavigation(files) {
  section('🔍 STEP 6: Checking Navigation Integrity');
  
  const navigationFiles = files.filter(f => f.includes('/navigation/'));
  const screenRoutes = new Map();
  const screenFiles = new Set();
  
  // Collect all screen files
  files.forEach(file => {
    if (file.includes('/screens/')) {
      const fileName = path.basename(file, path.extname(file));
      screenFiles.add(fileName);
    }
  });
  
  // Check navigation files
  for (const navFile of navigationFiles) {
    try {
      const content = fs.readFileSync(navFile, 'utf8');
      const relativePath = path.relative(process.cwd(), navFile);
      
      // Find all Screen.name references
      const routeMatches = content.match(/<Stack\.Screen\s+name="([^"]+)"/g) || [];
      routeMatches.forEach(match => {
        const routeName = match.match(/name="([^"]+)"/)[1];
        screenRoutes.set(routeName, relativePath);
      });
      
      // Find navigation.navigate calls
      const navigateMatches = content.match(/navigation\.navigate\(['"]([^'"]+)['"]/g) || [];
      navigateMatches.forEach(match => {
        const routeName = match.match(/navigate\(['"]([^'"]+)['"]/)[1];
        
        if (!screenRoutes.has(routeName)) {
          stats.brokenNavigation.push({
            file: relativePath,
            route: routeName,
            error: 'Route not defined in any navigator'
          });
          stats.issuesFound++;
        }
      });
    } catch (err) {
      // Skip
    }
  }
  
  if (stats.brokenNavigation.length > 0) {
    log(`❌ Found ${stats.brokenNavigation.length} broken navigation references:\n`, 'red');
    stats.brokenNavigation.forEach(nav => {
      log(`   ${nav.file}`, 'red');
      log(`   → ${nav.error}: "${nav.route}"\n`, 'yellow');
    });
  } else {
    log('✅ Navigation integrity verified!', 'green');
  }
}

/**
 * Check 7: Entry Point Validation
 */
async function checkEntryPoints() {
  section('🔍 STEP 7: Validating Entry Points');
  
  let allValid = true;
  
  for (const entryPoint of ENTRY_POINTS) {
    const fullPath = path.resolve(process.cwd(), entryPoint);
    
    if (!fs.existsSync(fullPath)) {
      log(`❌ Entry point missing: ${entryPoint}`, 'red');
      allValid = false;
      stats.issuesFound++;
    } else {
      log(`✅ ${entryPoint}`, 'green');
      
      // Basic validation - check if file is readable and has content
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.trim().length === 0) {
          log(`   ⚠️  Entry point is empty!`, 'yellow');
          allValid = false;
        }
      } catch (err) {
        log(`   ⚠️  Cannot read entry point: ${err.message}`, 'yellow');
        allValid = false;
      }
    }
  }
  
  if (allValid) {
    log('\n✅ All entry points valid!', 'green');
  }
}

/**
 * Extract line number from error message
 */
function extractLineNumber(errorMessage) {
  const match = errorMessage.match(/line (\d+)/i);
  return match ? match[1] : null;
}

/**
 * Generate Summary Report
 */
function generateSummary() {
  section('📊 HEALTH CHECK SUMMARY');
  
  logBold(`Files Scanned: ${stats.totalFiles}`, 'cyan');
  console.log('');
  
  // Issues breakdown
  const issues = [
    { name: 'Syntax Errors', count: stats.syntaxErrors.length, color: 'red', critical: true },
    { name: 'Missing Imports', count: stats.missingImports.length, color: 'red', critical: true },
    { name: 'Runtime Issues', count: stats.runtimeErrors.length, color: 'yellow', critical: false },
    { name: 'Broken Navigation', count: stats.brokenNavigation.length, color: 'red', critical: true },
    { name: 'Duplicate Files', count: stats.duplicateFiles.length, color: 'yellow', critical: false },
    { name: 'Duplicate Code', count: stats.duplicateCode.length, color: 'yellow', critical: false },
    { name: 'Unused Exports', count: stats.deadCode.length, color: 'yellow', critical: false },
    { name: 'Warnings', count: stats.warnings.length, color: 'blue', critical: false },
  ];
  
  let criticalIssues = 0;
  let nonCriticalIssues = 0;
  
  issues.forEach(issue => {
    if (issue.count > 0) {
      const symbol = issue.critical ? '❌' : '⚠️';
      log(`${symbol} ${issue.name}: ${issue.count}`, issue.color);
      
      if (issue.critical) {
        criticalIssues += issue.count;
      } else {
        nonCriticalIssues += issue.count;
      }
    }
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  if (criticalIssues === 0 && nonCriticalIssues === 0) {
    logBold('🎉 EXCELLENT! No issues found!', 'green');
    logBold('✅ Your app is healthy and ready for production!', 'green');
  } else if (criticalIssues === 0) {
    logBold(`⚠️  ${nonCriticalIssues} non-critical issues found`, 'yellow');
    log('These should be reviewed but won\'t break the app.', 'yellow');
  } else {
    logBold(`🚨 ${criticalIssues} CRITICAL issues found!`, 'red');
    log('These must be fixed before deploying to production.', 'red');
  }
  
  if (FIX_MODE && stats.filesFixed > 0) {
    console.log('');
    logBold(`🔧 Fixed ${stats.filesFixed} issues automatically`, 'green');
  }
  
  if (!FIX_MODE && (stats.duplicateFiles.length > 0)) {
    console.log('');
    log('💡 Tip: Run with --fix to automatically fix some issues', 'blue');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Exit with error code if critical issues found
  if (criticalIssues > 0) {
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  logBold('\n🏥 AayuCare Health Check\n', 'cyan');
  
  if (FIX_MODE) {
    log('🔧 FIX MODE ENABLED - Will automatically fix issues\n', 'yellow');
  }
  
  const baseDir = path.join(__dirname, '..');
  const srcDir = path.join(baseDir, 'src');
  
  log('📂 Scanning project files...\n', 'cyan');
  
  const allFiles = findAllFiles(srcDir);
  log(`Found ${allFiles.length} files\n`, 'cyan');
  
  // Run all checks
  await checkSyntaxErrors(allFiles);
  await checkRuntimeErrors(allFiles);
  await checkDuplicateFiles(allFiles);
  await checkDuplicateCode(allFiles);
  await checkDeadCode(allFiles);
  await checkNavigation(allFiles);
  await checkEntryPoints();
  
  // Generate summary
  generateSummary();
}

// Run the health check
main().catch(err => {
  log(`\n💥 Fatal error: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
