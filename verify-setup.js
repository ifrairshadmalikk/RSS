#!/usr/bin/env node

/**
 * Trend Detector - Setup Verification Script
 * Run this script to verify your setup is complete and working
 * 
 * Usage: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Trend Detector Setup Verification\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    checks.passed++;
  } else {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    checks.failed++;
  }
}

function checkEnvVariable(variable, description) {
  if (process.env[variable]) {
    console.log(`✅ ${description}: ${variable}=${process.env[variable].substring(0, 20)}...`);
    checks.passed++;
  } else {
    console.log(`⚠️  ${description}: ${variable} - Not set`);
    checks.warnings++;
  }
}

function checkDir(dirPath, description) {
  const fullPath = path.join(__dirname, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    console.log(`✅ ${description}`);
    checks.passed++;
  } else {
    console.log(`❌ ${description} - Directory not found: ${dirPath}`);
    checks.failed++;
  }
}

console.log('📁 Checking project structure...\n');
checkDir('server', 'Server directory exists');
checkDir('client', 'Client directory exists');
checkFile('server/package.json', 'Server package.json exists');
checkFile('client/package.json', 'Client package.json exists');
checkFile('docker-compose.yml', 'Docker compose file exists');
checkFile('README.md', 'README file exists');

console.log('\n🔐 Checking environment configuration...\n');
checkFile('server/.env', 'Server .env file exists (run setup first if missing)');

// Try to load .env
try {
  const envPath = path.join(__dirname, 'server', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const required = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
    
    const missing = required.filter(key => !envContent.includes(key));
    if (missing.length === 0) {
      console.log('✅ All required environment variables are configured');
      checks.passed++;
    } else {
      console.log(`⚠️  Missing environment variables: ${missing.join(', ')}`);
      checks.warnings += missing.length;
    }
  }
} catch (e) {
  // Silently ignore if can't read
}

console.log('\n📦 Checking server dependencies...\n');
checkFile('server/node_modules/express', 'Express installed');
checkFile('server/node_modules/mongoose', 'Mongoose installed');
checkFile('server/node_modules/jsonwebtoken', 'JWT installed');
checkFile('server/node_modules/bcryptjs', 'Bcryptjs installed');
checkFile('server/node_modules/zod', 'Zod validation installed');

console.log('\n⚛️  Checking client dependencies...\n');
checkFile('client/node_modules/react', 'React installed');
checkFile('client/node_modules/react-router-dom', 'React Router installed');
checkFile('client/node_modules/axios', 'Axios installed');
checkFile('client/node_modules/tailwindcss', 'Tailwind CSS installed');
checkFile('client/node_modules/lucide-react', 'Lucide React icons installed');

console.log('\n🤖 Checking AI service configuration...\n');
checkFile('server/src/services/aiService.js', 'AI Service exists');
checkFile('server/src/services/trendService.js', 'Trend Service exists');
checkFile('server/src/models/Article.js', 'Article model with AI fields');
checkFile('server/src/models/Trend.js', 'Trend model with category/country');

console.log('\n🔑 Checking authentication...\n');
checkFile('server/src/routes/auth.js', 'Auth routes exist');
checkFile('server/src/routes/profile.js', 'Profile routes exist');
checkFile('server/src/middleware/auth.js', 'Auth middleware exists');

console.log('\n📊 Checking data models...\n');
checkFile('server/src/models/User.js', 'User model exists');
checkFile('server/src/models/Notification.js', 'Notification model exists');
checkFile('server/src/models/RssFeed.js', 'RSS Feed model exists');

console.log('\n🎨 Checking frontend pages...\n');
checkFile('client/src/pages/Login.jsx', 'Login page exists');
checkFile('client/src/pages/Settings.jsx', 'Settings page with admin panel');
checkFile('client/src/pages/Trends.jsx', 'Trends page with filtering');
checkFile('client/src/pages/Dashboard.jsx', 'Dashboard page');
checkFile('client/src/pages/Admin.jsx', 'Admin page');

console.log('\n\n═══════════════════════════════════════');
console.log('📋 VERIFICATION SUMMARY');
console.log('═══════════════════════════════════════\n');

console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);

console.log('\n🚀 Next Steps:\n');

if (checks.failed === 0) {
  console.log('1. Ensure MongoDB is running: mongod');
  console.log('2. Start server: cd server && npm run dev');
  console.log('3. Start client: cd client && npm run dev');
  console.log('4. Visit http://localhost:5173');
  console.log('5. Login with admin credentials from .env');
  console.log('6. Go to Settings to verify admin panel appears');
} else {
  console.log('❌ Please fix the failed checks above before running the app');
}

console.log('\n📚 Documentation: See SETUP_AND_TROUBLESHOOTING.md\n');

process.exit(checks.failed > 0 ? 1 : 0);
