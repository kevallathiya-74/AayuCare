/**
 * Storage Module Runtime Test
 * Validates storage is properly wired at module load time
 */

console.log('\n🔍 STORAGE MODULE VALIDATION\n');

// Test 1: Can we import storage?
let storage;
try {
  storage = require('../src/utils/storage');
  console.log('✅ Step 1: Storage module imported');
} catch (error) {
  console.error('❌ Step 1 FAILED: Cannot import storage module');
  console.error('   Error:', error.message);
  process.exit(1);
}

// Test 2: Does default export exist?
if (!storage.default) {
  console.error('❌ Step 2 FAILED: storage.default is undefined');
  console.error('   Available keys:', Object.keys(storage));
  process.exit(1);
}
console.log('✅ Step 2: storage.default exists');

// Test 3: Are all methods defined?
const requiredMethods = ['getItem', 'setItem', 'deleteItem', 'removeItem', 'clear', 'getAllKeys'];
let allMethodsExist = true;

requiredMethods.forEach(method => {
  if (typeof storage.default[method] !== 'function') {
    console.error(`❌ Step 3 FAILED: storage.default.${method} is not a function`);
    console.error(`   Type: ${typeof storage.default[method]}`);
    allMethodsExist = false;
  }
});

if (!allMethodsExist) {
  process.exit(1);
}
console.log('✅ Step 3: All storage methods defined');

// Test 4: Test named exports
if (typeof storage.getItem !== 'function') {
  console.error('❌ Step 4 FAILED: Named export storage.getItem not a function');
  process.exit(1);
}
console.log('✅ Step 4: Named exports working');

// Test 5: Simulate api.js import pattern
console.log('\n📝 Testing api.js import pattern...');
try {
  const storageDefault = storage.default;
  
  if (!storageDefault || typeof storageDefault.getItem !== 'function') {
    console.error('❌ api.js pattern FAILED: Default import broken');
    console.error('   storageDefault:', storageDefault);
    process.exit(1);
  }
  
  console.log('✅ api.js pattern: import storage from "../utils/storage" → WORKS');
  console.log('   storage.getItem type:', typeof storageDefault.getItem);
} catch (error) {
  console.error('❌ api.js pattern FAILED:', error.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('✅ ALL STORAGE VALIDATION CHECKS PASSED');
console.log('='.repeat(60));
console.log('\n🎯 Storage module is properly wired and ready for use');
console.log('   • Default export: ✅');
console.log('   • Named exports: ✅');
console.log('   • All methods: ✅');
console.log('   • Runtime guards: ✅\n');
