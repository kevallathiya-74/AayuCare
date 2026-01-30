#!/usr/bin/env node

/**
 * Validation Script: Verify Theme Migration
 * 
 * Checks that all screens properly use theme.colors.* instead of healthColors.*
 */

const fs = require('fs');
const path = require('path');

let results = {
  totalFiles: 0,
  passedFiles: 0,
  failedFiles: [],
  warnings: []
};

/**
 * Find all JS files recursively
 */
function findJSFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '__tests__') {
        findJSFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Validate a single file
 */
function validateFile(filePath) {
  results.totalFiles++;
  
  // Skip theme source files
  if (filePath.includes('theme/healthColors.js') || filePath.includes('theme/index.js')) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Check for healthColors references
    if (content.includes('healthColors')) {
      results.failedFiles.push({
        file: relativePath,
        reason: 'Contains healthColors reference'
      });
      return;
    }
    
    // Check for proper theme import if theme is used
    if (content.includes('theme.colors') || content.includes('theme.spacing') || content.includes('theme.typography')) {
      if (!content.match(/import\s+{\s*theme\s*}\s+from/)) {
        results.warnings.push({
          file: relativePath,
          message: 'Uses theme but import statement may be incorrect'
        });
      }
    }
    
    results.passedFiles++;
    
  } catch (error) {
    results.failedFiles.push({
      file: filePath,
      reason: error.message
    });
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Validating Theme Migration\n');
  console.log('='.repeat(60));
  
  const screensDir = path.join(__dirname, '..', 'src', 'screens');
  const componentsDir = path.join(__dirname, '..', 'src', 'components');
  
  console.log('\n📂 Scanning directories...\n');
  
  let allFiles = [];
  if (fs.existsSync(screensDir)) {
    allFiles = allFiles.concat(findJSFiles(screensDir));
  }
  if (fs.existsSync(componentsDir)) {
    allFiles = allFiles.concat(findJSFiles(componentsDir));
  }
  
  console.log(`📄 Found ${allFiles.length} files to validate\n`);
  
  allFiles.forEach(validateFile);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Validation Results:\n');
  console.log(`   Total files checked:  ${results.totalFiles}`);
  console.log(`   ✅ Passed:           ${results.passedFiles}`);
  console.log(`   ❌ Failed:           ${results.failedFiles.length}`);
  console.log(`   ⚠️  Warnings:         ${results.warnings.length}`);
  
  if (results.failedFiles.length > 0) {
    console.log('\n❌ Failed Files:\n');
    results.failedFiles.forEach(fail => {
      console.log(`   - ${fail.file}`);
      console.log(`     Reason: ${fail.reason}\n`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:\n');
    results.warnings.forEach(warn => {
      console.log(`   - ${warn.file}`);
      console.log(`     ${warn.message}\n`);
    });
  }
  
  if (results.failedFiles.length === 0) {
    console.log('\n🎉 All files passed validation!');
    console.log('\n✅ Theme migration is complete and successful.');
  } else {
    console.log('\n⚠️  Some files failed validation.');
    console.log('   Run: node scripts/migrate-healthcolors-to-theme.js');
    process.exit(1);
  }
}

main();
