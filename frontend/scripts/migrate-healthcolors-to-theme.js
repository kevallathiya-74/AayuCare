#!/usr/bin/env node

/**
 * Migration Script: healthColors → theme.colors
 * 
 * Automatically converts all healthColors.* references to theme.colors.*
 * across all screen files in the frontend.
 * 
 * Usage: node scripts/migrate-healthcolors-to-theme.js
 */

const fs = require('fs');
const path = require('path');

// Color mapping: healthColors.* → theme.colors.*
const COLOR_MAPPINGS = [
  // Primary/Secondary colors
  { from: /healthColors\.primary\.main/g, to: 'theme.colors.primary' },
  { from: /healthColors\.primary\.light/g, to: 'theme.colors.primaryLight' },
  { from: /healthColors\.primary\.dark/g, to: 'theme.colors.primaryDark' },
  { from: /healthColors\.secondary\.main/g, to: 'theme.colors.secondary' },
  { from: /healthColors\.secondary\.light/g, to: 'theme.colors.secondaryLight' },
  { from: /healthColors\.secondary\.dark/g, to: 'theme.colors.secondaryDark' },
  { from: /healthColors\.secondary\.gradient/g, to: 'theme.gradients.secondary' },
  
  // Semantic colors (nested structure)
  { from: /healthColors\.error\.main/g, to: 'theme.colors.error.main' },
  { from: /healthColors\.error\.light/g, to: 'theme.colors.error.light' },
  { from: /healthColors\.error\.dark/g, to: 'theme.colors.error.dark' },
  { from: /healthColors\.error\.background/g, to: 'theme.colors.error.background' },
  
  { from: /healthColors\.success\.main/g, to: 'theme.colors.success.main' },
  { from: /healthColors\.success\.light/g, to: 'theme.colors.success.light' },
  { from: /healthColors\.success\.dark/g, to: 'theme.colors.success.dark' },
  { from: /healthColors\.success\.background/g, to: 'theme.colors.success.background' },
  
  { from: /healthColors\.warning\.main/g, to: 'theme.colors.warning.main' },
  { from: /healthColors\.warning\.light/g, to: 'theme.colors.warning.light' },
  { from: /healthColors\.warning\.dark/g, to: 'theme.colors.warning.dark' },
  { from: /healthColors\.warning\.background/g, to: 'theme.colors.warning.background' },
  
  { from: /healthColors\.info\.main/g, to: 'theme.colors.info.main' },
  { from: /healthColors\.info\.light/g, to: 'theme.colors.info.light' },
  { from: /healthColors\.info\.dark/g, to: 'theme.colors.info.dark' },
  { from: /healthColors\.info\.background/g, to: 'theme.colors.info.background' },
  
  // Background colors
  { from: /healthColors\.background\.primary/g, to: 'theme.colors.background.primary' },
  { from: /healthColors\.background\.secondary/g, to: 'theme.colors.background.secondary' },
  { from: /healthColors\.background\.tertiary/g, to: 'theme.colors.background.tertiary' },
  { from: /healthColors\.background\.card/g, to: 'theme.colors.background.card' },
  { from: /healthColors\.background\.overlay/g, to: 'theme.colors.background.overlay' },
  
  // Text colors
  { from: /healthColors\.text\.primary/g, to: 'theme.colors.text.primary' },
  { from: /healthColors\.text\.secondary/g, to: 'theme.colors.text.secondary' },
  { from: /healthColors\.text\.tertiary/g, to: 'theme.colors.text.tertiary' },
  { from: /healthColors\.text\.white/g, to: 'theme.colors.text.white' },
  { from: /healthColors\.text\.link/g, to: 'theme.colors.text.link' },
  { from: /healthColors\.text\.disabled/g, to: 'theme.colors.text.disabled' },
  
  // Border colors
  { from: /healthColors\.border\.main/g, to: 'theme.colors.border.main' },
  { from: /healthColors\.border\.light/g, to: 'theme.colors.border.light' },
  { from: /healthColors\.border\.medium/g, to: 'theme.colors.border.main' },
  { from: /healthColors\.border\.dark/g, to: 'theme.colors.border.dark' },
  
  // Hospital/Healthcare colors
  { from: /healthColors\.hospital\.teal/g, to: 'theme.colors.healthcare.teal' },
  { from: /healthColors\.hospital\.navy/g, to: 'theme.colors.healthcare.navy' },
  { from: /healthColors\.hospital\.gradient/g, to: 'theme.gradients.primary' },
  
  // Health metrics
  { from: /healthColors\.health\.heartRate/g, to: 'theme.colors.healthcare.heartRate' },
  { from: /healthColors\.health\.bloodPressure/g, to: 'theme.colors.healthcare.bloodPressure' },
  { from: /healthColors\.health\.temperature/g, to: 'theme.colors.healthcare.temperature' },
  { from: /healthColors\.health\.glucose/g, to: 'theme.colors.healthcare.glucose' },
  { from: /healthColors\.health\.oxygen/g, to: 'theme.colors.healthcare.oxygen' },
  { from: /healthColors\.health\.weight/g, to: 'theme.colors.healthcare.weight' },
  { from: /healthColors\.health\.steps/g, to: 'theme.colors.healthcare.steps' },
  
  // Status colors
  { from: /healthColors\.status\.pending/g, to: 'theme.colors.status.pending' },
  { from: /healthColors\.status\.confirmed/g, to: 'theme.colors.status.confirmed' },
  { from: /healthColors\.status\.cancelled/g, to: 'theme.colors.status.cancelled' },
  { from: /healthColors\.status\.completed/g, to: 'theme.colors.status.completed' },
  { from: /healthColors\.status\.inProgress/g, to: 'theme.colors.status.inProgress' },
  
  // Common colors
  { from: /healthColors\.white/g, to: 'theme.colors.white' },
  { from: /healthColors\.black/g, to: 'theme.colors.black' },
  { from: /healthColors\.transparent/g, to: 'theme.colors.transparent' },
  
  // Grays
  { from: /healthColors\.neutral\.gray50/g, to: 'theme.colors.grays.gray50' },
  { from: /healthColors\.neutral\.gray100/g, to: 'theme.colors.grays.gray100' },
  { from: /healthColors\.neutral\.gray200/g, to: 'theme.colors.grays.gray200' },
  { from: /healthColors\.neutral\.gray300/g, to: 'theme.colors.grays.gray300' },
  { from: /healthColors\.neutral\.gray400/g, to: 'theme.colors.grays.gray400' },
  { from: /healthColors\.neutral\.gray500/g, to: 'theme.colors.grays.gray500' },
  { from: /healthColors\.neutral\.gray600/g, to: 'theme.colors.grays.gray600' },
  { from: /healthColors\.neutral\.gray700/g, to: 'theme.colors.grays.gray700' },
  { from: /healthColors\.neutral\.gray800/g, to: 'theme.colors.grays.gray800' },
  { from: /healthColors\.neutral\.gray900/g, to: 'theme.colors.grays.gray900' },
  { from: /healthColors\.neutral\.black/g, to: 'theme.colors.grays.black' },
  { from: /healthColors\.neutral\.white/g, to: 'theme.colors.white' },
  
  // Card colors
  { from: /healthColors\.card\.background/g, to: 'theme.colors.background.card' },
  { from: /healthColors\.card\.border/g, to: 'theme.colors.border.light' },
  { from: /healthColors\.card\.shadow/g, to: 'theme.shadows.card.shadowColor' },
  
  // Input colors
  { from: /healthColors\.input\.background/g, to: 'theme.colors.background.card' },
  { from: /healthColors\.input\.border/g, to: 'theme.colors.border.light' },
  { from: /healthColors\.input\.borderFocused/g, to: 'theme.colors.primary' },
  { from: /healthColors\.input\.placeholder/g, to: 'theme.colors.text.tertiary' },
  
  // Border radius
  { from: /healthColors\.borderRadius\.medium/g, to: 'theme.borderRadius.md' },
  { from: /healthColors\.borderRadius\.small/g, to: 'theme.borderRadius.sm' },
  { from: /healthColors\.borderRadius\.large/g, to: 'theme.borderRadius.lg' },
  
  // Gradients
  { from: /healthColors\.gradients\.primary/g, to: 'theme.gradients.primary' },
  { from: /healthColors\.gradients\.secondary/g, to: 'theme.gradients.secondary' },
  
  // Fitness/Womens colors
  { from: /healthColors\.fitness\.aqua/g, to: 'theme.colors.healthcare.teal' },
  { from: /healthColors\.womens\.lavender/g, to: 'theme.colors.healthcare.purple' },
  
  // Semantic colors
  { from: /healthColors\.semantic\.error/g, to: 'theme.colors.error.main' },
  
  // Button states
  { from: /healthColors\.button\.disabled/g, to: 'theme.colors.grays.gray300' },
  { from: /healthColors\.button\.disabledText/g, to: 'theme.colors.text.disabled' },
  
  // Text inverse (for selected states)
  { from: /healthColors\.text\.inverse/g, to: 'theme.colors.white' },
  
  // Accent colors
  { from: /healthColors\.accent\.coral/g, to: 'theme.colors.healthcare.heartRate' },
  { from: /healthColors\.accent\.green/g, to: 'theme.colors.success.main' },
  { from: /healthColors\.accent\.lavender/g, to: 'theme.colors.healthcare.purple' },
  { from: /healthColors\.accent\.aqua/g, to: 'theme.colors.healthcare.teal' },
  { from: /healthColors\.accent\.purple/g, to: 'theme.colors.healthcare.purple' },
  { from: /healthColors\.accent\.pink/g, to: 'theme.colors.healthcare.pink' },
  
  // Background variants without nested structure
  { from: /healthColors\.background\.main/g, to: 'theme.colors.background.primary' },
  { from: /healthColors\.primary\.background/g, to: 'theme.withOpacity(theme.colors.primary, 0.1)' },
  
  // Text shortcuts
  { from: /healthColors\.textSecondary/g, to: 'theme.colors.text.secondary' },
  { from: /healthColors\.textPrimary/g, to: 'theme.colors.text.primary' },
  { from: /healthColors\.textTertiary/g, to: 'theme.colors.text.tertiary' },
  
  // Border with fallback
  { from: /healthColors\.border\?\.light \|\| theme\.colors\.grays\.gray200/g, to: 'theme.colors.border.light' },
  
  // Simple color references (for return statements and inline expressions)
  { from: /\bhealthColors\.error\b/g, to: 'theme.colors.error.main' },
  { from: /\bhealthColors\.success\b/g, to: 'theme.colors.success.main' },
  { from: /\bhealthColors\.warning\b/g, to: 'theme.colors.warning.main' },
  { from: /\bhealthColors\.info\b/g, to: 'theme.colors.info.main' },
];

// Import statement fixes
const IMPORT_FIXES = [
  {
    from: /import\s*{\s*theme\s*,\s*healthColors\s*}\s*from\s*(['"])(.*)theme\1/g,
    to: 'import { theme } from $1$2theme$1'
  },
  {
    from: /import\s*{\s*healthColors\s*,\s*theme\s*}\s*from\s*(['"])(.*)theme\1/g,
    to: 'import { theme } from $1$2theme$1'
  },
  {
    from: /import\s*{\s*healthColors\s*}\s*from\s*(['"]).*healthColors\1/g,
    to: 'import { theme } from $1../../theme$1'
  },
  {
    from: /import\s*{\s*theme\s*}\s*from\s*(['"]).*healthColors\1/g,
    to: 'import { theme } from $1../../theme$1'
  }
];

// Files to skip (already fixed or special cases)
const SKIP_FILES = [
  'DiseaseInfoScreen.js', // Already fixed manually
  'healthColors.js',       // Source file
  'index.js'               // Theme exports
];

let stats = {
  filesScanned: 0,
  filesModified: 0,
  replacementsMade: 0,
  errors: []
};

/**
 * Recursively find all .js files in directory
 */
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        findJSFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip excluded files
  if (SKIP_FILES.includes(fileName)) {
    console.log(`⏭️  Skipping: ${filePath}`);
    return;
  }
  
  stats.filesScanned++;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fileReplacements = 0;
    
    // Check if file uses healthColors
    if (!content.includes('healthColors')) {
      return;
    }
    
    console.log(`\n🔍 Processing: ${filePath}`);
    
    // Apply color mappings
    COLOR_MAPPINGS.forEach(mapping => {
      const matches = content.match(mapping.from);
      if (matches) {
        content = content.replace(mapping.from, mapping.to);
        fileReplacements += matches.length;
        console.log(`   ✓ Replaced ${matches.length}x: ${mapping.from.source.substring(0, 50)}...`);
      }
    });
    
    // Fix import statements
    IMPORT_FIXES.forEach(fix => {
      if (content.match(fix.from)) {
        content = content.replace(fix.from, fix.to);
        fileReplacements++;
        console.log(`   ✓ Fixed import statement`);
      }
    });
    
    // Remove any remaining healthColors references in validation checks
    content = content.replace(/if\s*\(\s*!healthColors[^)]*\)\s*{[^}]*}/g, '');
    content = content.replace(/console\.(log|error|warn)\([^)]*healthColors[^)]*\);?/g, '');
    
    // Write back if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesModified++;
      stats.replacementsMade += fileReplacements;
      console.log(`   ✅ Modified: ${fileReplacements} replacements`);
    } else {
      console.log(`   ℹ️  No changes needed`);
    }
    
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`   ❌ Error: ${error.message}`);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting healthColors → theme.colors migration\n');
  console.log('=' .repeat(60));
  
  const screensDir = path.join(__dirname, '..', 'src', 'screens');
  const componentsDir = path.join(__dirname, '..', 'src', 'components');
  
  let allFiles = [];
  
  if (fs.existsSync(screensDir)) {
    console.log(`📂 Scanning directory: ${screensDir}\n`);
    allFiles = allFiles.concat(findJSFiles(screensDir));
  }
  
  if (fs.existsSync(componentsDir)) {
    console.log(`📂 Scanning directory: ${componentsDir}\n`);
    allFiles = allFiles.concat(findJSFiles(componentsDir));
  }
  
  console.log(`📄 Found ${allFiles.length} JavaScript files\n`);
  
  allFiles.forEach(processFile);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Migration Summary:');
  console.log(`   Files scanned:    ${stats.filesScanned}`);
  console.log(`   Files modified:   ${stats.filesModified}`);
  console.log(`   Total replacements: ${stats.replacementsMade}`);
  console.log(`   Errors:           ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    stats.errors.forEach(err => {
      console.log(`   - ${err.file}: ${err.error}`);
    });
  }
  
  if (stats.filesModified > 0) {
    console.log('\n✅ Migration completed successfully!');
    console.log('\n⚠️  Next steps:');
    console.log('   1. Review changes with: git diff');
    console.log('   2. Test the application');
    console.log('   3. Run: node scripts/cleanup-unused-files.js');
  } else {
    console.log('\n✅ No files needed modification.');
  }
}

// Run the migration
main();
