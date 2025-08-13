#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Preparing package for publication...');

try {
  // Clean and build
  console.log('📦 Building TypeScript...');
  execSync('npm run clean', { stdio: 'inherit' });
  execSync('npx tsc', { stdio: 'inherit' });
  
  // Make sure dist/server.js is executable
  const serverPath = path.join('dist', 'server.js');
  if (fs.existsSync(serverPath)) {
    fs.chmodSync(serverPath, '755');
    console.log('✅ Made dist/server.js executable');
  }
  
  console.log('✅ Package prepared successfully!');
} catch (error) {
  console.error('❌ Error preparing package:', error.message);
  process.exit(1);
}
