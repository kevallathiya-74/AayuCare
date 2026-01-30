/**
 * Storage Module Validation Test
 * Verifies storage abstraction is properly set up
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Storage Module...\n');

const checks = [];

// Check 1: storage.js exists
const storagePath = path.join(__dirname, '../src/utils/storage/storage.js');
if (fs.existsSync(storagePath)) {
  checks.push({ name: 'storage.js file exists', pass: true });
} else {
  checks.push({ name: 'storage.js file exists', pass: false });
}

// Check 2: index.js exists
const indexPath = path.join(__dirname, '../src/utils/storage/index.js');
if (fs.existsSync(indexPath)) {
  checks.push({ name: 'index.js file exists', pass: true });
} else {
  checks.push({ name: 'index.js file exists', pass: false });
}

// Check 3: storage.js has required exports
const storageContent = fs.readFileSync(storagePath, 'utf8');
const requiredExports = ['getItem', 'setItem', 'deleteItem', 'removeItem', 'clear', 'getAllKeys'];
const hasAllExports = requiredExports.every(exp => {
  const regex = new RegExp(`export const ${exp}\\s*=`, 'g');
  return regex.test(storageContent);
});
checks.push({ name: 'All exports defined', pass: hasAllExports });

// Check 4: storage.js uses AsyncStorage
const usesAsyncStorage = storageContent.includes("from '@react-native-async-storage/async-storage'");
checks.push({ name: 'Uses AsyncStorage', pass: usesAsyncStorage });

// Check 5: storage.js has default export
const hasDefaultExport = /export default \{/.test(storageContent);
checks.push({ name: 'Has default export', pass: hasDefaultExport });

// Check 6: api.js imports from new location
const apiPath = path.join(__dirname, '../src/services/api.js');
const apiContent = fs.readFileSync(apiPath, 'utf8');
const apiUsesNewStorage = apiContent.includes("from '../utils/storage'");
checks.push({ name: 'api.js uses new storage', pass: apiUsesNewStorage });

// Check 7: authInterceptor.js imports from new location
const authInterceptorPath = path.join(__dirname, '../src/utils/authInterceptor.js');
const authInterceptorContent = fs.readFileSync(authInterceptorPath, 'utf8');
const authInterceptorUsesNewStorage = authInterceptorContent.includes("from './storage'");
checks.push({ name: 'authInterceptor.js uses new storage', pass: authInterceptorUsesNewStorage });

// Check 8: No localStorage or sessionStorage usage
const hasWebStorage = apiContent.includes('localStorage') || 
                     apiContent.includes('sessionStorage') ||
                     authInterceptorContent.includes('localStorage') ||
                     authInterceptorContent.includes('sessionStorage');
checks.push({ name: 'No web storage APIs used', pass: !hasWebStorage });

// Display results
console.log('Test Results:\n');
checks.forEach(check => {
  const icon = check.pass ? '✅' : '❌';
  console.log(`${icon} ${check.name}`);
});

const allPassed = checks.every(check => check.pass);

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All validation checks passed!');
  console.log('\nStorage module is properly configured.');
  console.log('Ready for device testing.');
  process.exit(0);
} else {
  console.log('❌ Some validation checks failed!');
  process.exit(1);
}
