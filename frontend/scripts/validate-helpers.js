/**
 * Validate helpers.js has all required exports
 */

const fs = require('fs');
const path = require('path');

const helpersPath = path.join(__dirname, '../src/utils/helpers.js');
const content = fs.readFileSync(helpersPath, 'utf8');

const requiredExports = [
  'formatCurrency',
  'formatPhoneNumber',
  'isValidPhoneNumber',
  'isValidEmail',
  'isValidAadhaar',
  'formatDate',
  'formatTime',
  'formatDateTime',
  'getRelativeTime',
  'getBMICategory',
  'getBPCategory',
  'getHeartRateCategory',
  'capitalize',
  'truncate',
  'getInitials',
  'getErrorMessage',
  'hapticFeedback',
  'debounce',
  'throttle',
  'groupBy',
  'sortBy',
];

console.log('🔍 Validating helpers.js exports...\n');

let allValid = true;

requiredExports.forEach((exportName) => {
  // Check if it's defined as export const
  const exportRegex = new RegExp(`export const ${exportName}\\s*=`, 'g');
  const isDefined = exportRegex.test(content);
  
  // Check if it's in default export
  const defaultExportRegex = new RegExp(`export default[\\s\\S]*${exportName}[,\\s}]`, 'g');
  const isInDefault = defaultExportRegex.test(content);
  
  if (isDefined && isInDefault) {
    console.log(`✅ ${exportName}: defined and exported`);
  } else if (!isDefined) {
    console.log(`❌ ${exportName}: NOT defined`);
    allValid = false;
  } else if (!isInDefault) {
    console.log(`❌ ${exportName}: defined but NOT in default export`);
    allValid = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ All exports are valid!');
  process.exit(0);
} else {
  console.log('❌ Some exports are missing!');
  process.exit(1);
}
