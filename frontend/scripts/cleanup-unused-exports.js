#!/usr/bin/env node

/**
 * 🧹 AayuCare Cleanup Script
 * 
 * Removes unused exports and cleans up dead code
 * 
 * Usage: node scripts/cleanup-unused-exports.js [--dry-run] [--fix]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
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
 * Extract all exports from a file
 */
function extractExports(content, filePath) {
  const exports = [];
  
  // Named exports: export const/function/class Name
  const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(content)) !== null) {
    exports.push({
      name: match[1],
      type: 'named',
      filePath,
    });
  }
  
  // Named exports from destructuring: export { Name1, Name2 }
  const destructuredExportRegex = /export\s*{\s*([^}]+)\s*}/g;
  while ((match = destructuredExportRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(' as ')[0]);
    names.forEach(name => {
      if (name) {
        exports.push({
          name: name.trim(),
          type: 'named',
          filePath,
        });
      }
    });
  }
  
  return exports;
}

/**
 * Extract all imports from a file
 */
function extractImports(content) {
  const imports = new Set();
  
  // Named imports: import { Name1, Name2 } from '...'
  const namedImportRegex = /import\s*{\s*([^}]+)\s*}\s*from/g;
  let match;
  while ((match = namedImportRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(' as ')[0]);
    names.forEach(name => imports.add(name.trim()));
  }
  
  // Default imports: import Name from '...'
  const defaultImportRegex = /import\s+(\w+)\s+from/g;
  while ((match = defaultImportRegex.exec(content)) !== null) {
    imports.add(match[1]);
  }
  
  return imports;
}

/**
 * Check if export is used in component exports
 */
function isUsedInComponentExports(exportName, allFiles) {
  // Check index.js files that re-export
  const indexFiles = allFiles.filter(f => f.endsWith('index.js'));
  
  for (const indexFile of indexFiles) {
    try {
      const content = fs.readFileSync(indexFile, 'utf8');
      if (content.includes(exportName)) {
        return true;
      }
    } catch (err) {
      // Skip
    }
  }
  
  return false;
}

async function main() {
  log('\n🧹 AayuCare Cleanup Script\n', 'cyan');
  
  if (DRY_RUN) {
    log('📋 DRY RUN MODE - No changes will be made\n', 'yellow');
  } else if (FIX_MODE) {
    log('🔧 FIX MODE - Will remove unused exports\n', 'yellow');
  }
  
  const srcDir = path.join(__dirname, '..', 'src');
  const allFiles = findAllFiles(srcDir);
  
  log(`📂 Scanning ${allFiles.length} files...\n`, 'cyan');
  
  // Step 1: Collect all exports
  log('Step 1: Collecting exports...', 'cyan');
  const allExports = [];
  
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const exports = extractExports(content, file);
      allExports.push(...exports);
    } catch (err) {
      // Skip
    }
  }
  
  log(`   Found ${allExports.length} exports\n`, 'green');
  
  // Step 2: Collect all imports
  log('Step 2: Collecting imports...', 'cyan');
  const allImports = new Set();
  
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const imports = extractImports(content);
      imports.forEach(imp => allImports.add(imp));
    } catch (err) {
      // Skip
    }
  }
  
  log(`   Found ${allImports.size} unique imports\n`, 'green');
  
  // Step 3: Find unused exports
  log('Step 3: Finding unused exports...', 'cyan');
  const unusedExports = [];
  
  for (const exp of allExports) {
    // Skip if used in imports
    if (allImports.has(exp.name)) continue;
    
    // Skip if used in re-exports
    if (isUsedInComponentExports(exp.name, allFiles)) continue;
    
    // Skip screens (used by navigation)
    if (exp.filePath.includes('/screens/')) continue;
    
    // Skip navigators
    if (exp.filePath.includes('/navigation/')) continue;
    
    // Skip App.js
    if (exp.filePath.includes('App.js')) continue;
    
    // Skip default exports
    if (exp.name === 'default') continue;
    
    // Skip store exports
    if (exp.filePath.includes('/store/')) continue;
    
    // Skip context exports
    if (exp.filePath.includes('/context/')) continue;
    
    unusedExports.push(exp);
  }
  
  // Step 4: Report findings
  log(`\n📊 Results:\n`, 'cyan');
  
  if (unusedExports.length === 0) {
    log('✅ No unused exports found!\n', 'green');
    return;
  }
  
  log(`⚠️  Found ${unusedExports.length} potentially unused exports:\n`, 'yellow');
  
  // Group by file
  const byFile = {};
  unusedExports.forEach(exp => {
    const relativePath = path.relative(srcDir, exp.filePath);
    if (!byFile[relativePath]) {
      byFile[relativePath] = [];
    }
    byFile[relativePath].push(exp.name);
  });
  
  Object.keys(byFile).sort().forEach(file => {
    log(`   ${file}`, 'yellow');
    byFile[file].forEach(name => {
      log(`      → export ${name}`, 'cyan');
    });
    log('', 'reset');
  });
  
  // Step 5: Remove unused exports if in fix mode
  if (FIX_MODE && !DRY_RUN) {
    log('🔧 Removing unused exports...\n', 'yellow');
    
    let filesModified = 0;
    
    for (const [file, exports] of Object.entries(byFile)) {
      const fullPath = path.join(srcDir, file);
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;
        
        exports.forEach(exportName => {
          // Remove export const/function/class Name
          const regex1 = new RegExp(`export\\s+(const|let|var|function|class)\\s+${exportName}\\s*[=({][^]*?(?=export|$)`, 'g');
          if (regex1.test(content)) {
            content = content.replace(regex1, '');
            modified = true;
          }
          
          // Remove from export { Name } statements
          const regex2 = new RegExp(`,?\\s*${exportName}\\s*,?`, 'g');
          const exportBlock = /export\s*{\s*([^}]+)\s*}/g;
          content = content.replace(exportBlock, (match) => {
            if (match.includes(exportName)) {
              modified = true;
              const cleaned = match
                .replace(regex2, '')
                .replace(/{\s*,/, '{')
                .replace(/,\s*}/, '}')
                .replace(/,\s*,/g, ',');
              return cleaned === 'export {}' ? '' : cleaned;
            }
            return match;
          });
        });
        
        if (modified) {
          fs.writeFileSync(fullPath, content, 'utf8');
          log(`   ✅ Cleaned: ${file}`, 'green');
          filesModified++;
        }
      } catch (err) {
        log(`   ❌ Error cleaning ${file}: ${err.message}`, 'red');
      }
    }
    
    log(`\n✅ Modified ${filesModified} files\n`, 'green');
  } else if (!FIX_MODE) {
    log(`💡 Run with --fix to remove unused exports\n`, 'cyan');
  }
}

main().catch(err => {
  log(`\n💥 Error: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
