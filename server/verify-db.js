const dotenv = require('dotenv');
dotenv.config();

const cloudflareD1 = require('./services/cloudflareD1Service');
const dbConfig = require('./config/db');

async function checkDatabase() {
  console.log('\n=============================================');
  console.log('🔍 NOTEX Database Connection Diagnostic');
  console.log('=============================================');

  console.log('\n1. Checking Environment Variables:');
  console.log(`- CLOUDFLARE_ACCOUNT_ID:     ${process.env.CLOUDFLARE_ACCOUNT_ID || '(Not set)'}`);
  console.log(`- CLOUDFLARE_D1_DATABASE_ID: ${process.env.CLOUDFLARE_D1_DATABASE_ID || '(Not set)'}`);
  console.log(`- CLOUDFLARE_API_TOKEN:      ${process.env.CLOUDFLARE_API_TOKEN ? '••••••••' + process.env.CLOUDFLARE_API_TOKEN.slice(-6) : '(Not set)'}`);
  console.log(`- MONGODB_URI:               ${process.env.MONGODB_URI ? 'Configured' : '(Not set)'}`);

  // Validate Account ID format
  if (process.env.CLOUDFLARE_ACCOUNT_ID === 'notex-db') {
    console.log('\n⚠️  ACTION REQUIRED:');
    console.log('   `CLOUDFLARE_ACCOUNT_ID` in your .env is currently set to "notex-db" (the database name).');
    console.log('   Your Cloudflare Account ID is a 32-character hexadecimal code.');
    console.log('   👉 Look at your browser URL bar on Cloudflare: dash.cloudflare.com/<ACCOUNT_ID>/...');
    console.log('   👉 Or look at the right sidebar of the Cloudflare Overview page.');
    console.log('=============================================\n');
    return;
  }

  console.log('\n2. Testing Cloudflare D1 Connection...');
  cloudflareD1.reloadConfig();

  if (cloudflareD1.isConfigured) {
    try {
      const isAlive = await cloudflareD1.testConnection();
      if (isAlive) {
        console.log('✅ Connection to Cloudflare D1 was SUCCESSFUL!');
        console.log('📦 Initializing / verifying tables (users, folders, notes, share_links)...');
        await cloudflareD1.initD1Tables();
        console.log('🎉 Cloudflare D1 is 100% READY! Your data will now persist permanently.');
      } else {
        console.log('❌ Cloudflare D1 test connection failed. Please check your credentials.');
      }
    } catch (e) {
      console.error(`❌ Connection Error: ${e.message}`);
    }
  } else {
    console.log('ℹ️  Cloudflare D1 credentials not fully configured.');
  }

  console.log('\n=============================================\n');
}

checkDatabase();
