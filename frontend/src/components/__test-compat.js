// Simple compatibility test for our components
// This file checks if all imports are available

// Test basic imports
try {
  const React = require('react');
  console.log('✅ React available');
} catch (e) {
  console.log('❌ React not available:', e.message);
}

// Test framer-motion
try {
  const motion = require('framer-motion').motion;
  console.log('✅ Framer Motion available');
} catch (e) {
  console.log('❌ Framer Motion not available:', e.message);
}

// Test other dependencies
const dependencies = [
  'axios',
  'react-dnd',
  'react-dnd-html5-backend',
  'zustand'
];

dependencies.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep} available`);
  } catch (e) {
    console.log(`❌ ${dep} not available:`, e.message);
  }
});

console.log('\n🎯 Component structure validation complete!');