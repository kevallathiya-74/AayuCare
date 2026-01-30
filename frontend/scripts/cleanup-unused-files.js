#!/usr/bin/env node

/**
 * Cleanup Script: Remove unused code files
 * 
 * Scans entry points and removes files that are not imported anywhere.
 * 
 * Usage: node scripts/cleanup-unused-files.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

const stats = {
  filesScanned: 0,
  unusedFiles: [],
  deletedFiles: [],
  errors: []
};

// Entry points to scan from
const ENTRY_POINTS = [
  'App.js',
  'src/navigation/AppNavigator.js',
  'src/navigation/PatientTabNavigator.js',
  'src/navigation/DoctorTabNavigator.js',
  'src/navigation/AdminTabNavigator.js',
  'src/screens/patient/index.js',
  'src/screens/hospital/index.js',
  'src/screens/admin/index.js'
];

// Patterns to identify imports
const IMPORT_PATTERNS = [
  /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
  /require\(['"]([^'"]+)['"]\)/g
];

// Directories to scan for unused files
const SCAN_DIRS = [
  'src/screens',
  'src/components',
  'src/utils',
  'src/services'
];

// Files to never delete (core files)
const PROTECTED_FILES = [
  'App.js',
  'index.js',
  'theme/index.js',
  'theme/healthColors.js',
  'config/app.js'
];

let importedFiles = new Set();

/**
 * Recursively extract all imports from a file
 */
function extractImports(filePath, baseDir) {
  if (!fs.existsSync(filePath)) return;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    IMPORT_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let importPath = match[1];
        
        // Resolve relative imports
        if (importPath.startsWith('.')) {
          const dir = path.dirname(filePath);
          importPath = path.resolve(dir, importPath);
        } else if (importPath.startsWith('src/')) {
          importPath = path.resolve(baseDir, importPath);
        } else {
          // Skip node_modules
          continue;
        }
        
        // Add .js extension if missing
        if (!path.extname(importPath)) {
          if (fs.existsSync(importPath + '.js')) {
            importPath += '.js';
          } else if (fs.existsSync(path.join(importPath, 'index.js'))) {
            importPath = path.join(importPath, 'index.js');
          }
        }
        
        if (fs.existsSync(importPath)) {
          importedFiles.add(importPath);
          // Recursively scan imported files
          extractImports(importPath, baseDir);
        }
      }
    });
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
  }
}

/**
 * Find all JS files in directory
 */
function findAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '__tests__') {
        findAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Check if file is protected
 */
function isProtected(filePath, baseDir) {
  const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
  return PROTECTED_FILES.some(protected => relativePath.endsWith(protected));
}

/**
 * Delete file safely
 */
function deleteFile(filePath) {
  if (DRY_RUN) {
    console.log(`   [DRY RUN] Would delete: ${filePath}`);
    return true;
  }
  
  try {
    fs.unlinkSync(filePath);
    console.log(`   ✅ Deleted: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error deleting ${filePath}: ${error.message}`);
    stats.errors.push({ file: filePath, error: error.message });
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🧹 Starting unused files cleanup\n');
  console.log('='.repeat(60));
  
  const baseDir = path.join(__dirname, '..');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be deleted\n');
  }
  
  // Step 1: Scan entry points
  console.log('📋 Step 1: Scanning entry points...\n');
  
  ENTRY_POINTS.forEach(entryPoint => {
    const fullPath = path.join(baseDir, entryPoint);
    console.log(`   Scanning: ${entryPoint}`);
    extractImports(fullPath, baseDir);
  });
  
  console.log(`\n   ✓ Found ${importedFiles.size} imported files\n`);
  
  // Step 2: Find all files in scan directories
  console.log('📂 Step 2: Finding all files...\n');
  
  let allFiles = [];
  SCAN_DIRS.forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    console.log(`   Scanning: ${dir}`);
    const files = findAllFiles(fullPath);
    allFiles = allFiles.concat(files);
  });
  
  stats.filesScanned = allFiles.length;
  console.log(`\n   ✓ Found ${allFiles.length} total files\n`);
  
  // Step 3: Identify unused files
  console.log('🔍 Step 3: Identifying unused files...\n');
  
  allFiles.forEach(file => {
    if (!importedFiles.has(file) && !isProtected(file, baseDir)) {
      stats.unusedFiles.push(file);
      const relativePath = path.relative(baseDir, file);
      console.log(`   ⚠️  Unused: ${relativePath}`);
    }
  });
  
  // Step 4: Delete unused files
  if (stats.unusedFiles.length > 0) {
    console.log(`\n🗑️  Step 4: Deleting unused files...\n`);
    
    stats.unusedFiles.forEach(file => {
      if (deleteFile(file)) {
        stats.deletedFiles.push(file);
      }
    });
  } else {
    console.log('\n✅ No unused files found!\n');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Cleanup Summary:');
  console.log(`   Files scanned:    ${stats.filesScanned}`);
  console.log(`   Imported files:   ${importedFiles.size}`);
  console.log(`   Unused files:     ${stats.unusedFiles.length}`);
  console.log(`   Deleted files:    ${stats.deletedFiles.length}`);
  console.log(`   Errors:           ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    stats.errors.forEach(err => {
      console.log(`   - ${err.file}: ${err.error}`);
    });
  }
  
  if (DRY_RUN && stats.unusedFiles.length > 0) {
    console.log('\n⚠️  This was a DRY RUN. To actually delete files, run:');
    console.log('   node scripts/cleanup-unused-files.js');
  }
  
  if (stats.deletedFiles.length > 0) {
    console.log('\n✅ Cleanup completed!');
    console.log('\n⚠️  Review changes with: git status');
  }
}

// Run the cleanup
main();
