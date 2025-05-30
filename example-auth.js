// VoidBeam Core - Authentication Examples
const { Client, Authenticator } = require('./index');

async function offlineExample() {
  console.log('\n🔧 === Offline Authentication Example ===');
  
  try {
    const auth = await Authenticator.getOfflineAuth('TestPlayer');
    console.log('✅ Offline Authentication Success:');
    console.log(`   Player: ${auth.name}`);
    console.log(`   UUID: ${auth.uuid}`);
    console.log(`   Type: ${auth.meta.type}`);
    
    // Validate token
    const isValid = await Authenticator.validate(auth.access_token, auth.client_token, 'offline');
    console.log(`   Token Valid: ${isValid}`);
    
  } catch (error) {
    console.error('❌ Offline Authentication Error:', error.message);
  }
}

async function microsoftExample() {
  console.log('\n🔧 === Microsoft Authentication Example ===');
  console.log('💡 Note: This will open a browser window for Microsoft login');
  
  try {
    const auth = await Authenticator.getMicrosoftAuth({ gui: true });
    console.log('✅ Microsoft Authentication Success:');
    console.log(`   Player: ${auth.name}`);
    console.log(`   UUID: ${auth.uuid}`);
    console.log(`   Type: ${auth.meta.type}`);
    console.log(`   XUID: ${auth.meta.xuid || 'N/A'}`);
    
    // Validate token
    const isValid = await Authenticator.validate(auth.access_token, auth.client_token, 'microsoft');
    console.log(`   Token Valid: ${isValid}`);
    
  } catch (error) {
    console.error('❌ Microsoft Authentication Error:', error.message);
    console.log('💡 Make sure you have a valid Microsoft account with Minecraft');
  }
}

async function yggdrasilExample() {
  console.log('\n🔧 === Yggdrasil (Mojang) Authentication Example ===');
  console.log('⚠️  Warning: Yggdrasil authentication requires valid Mojang account credentials');
  console.log('💡 This is for demonstration only - do not use real credentials in production');
  
  // Note: This is just an example - real credentials would be needed
  const exampleEmail = 'your_email@example.com';
  const examplePassword = 'your_password';
  
  try {
    // Uncomment the line below and provide real credentials to test
    // const auth = await Authenticator.getYggdrasilAuth(exampleEmail, examplePassword);
    
    console.log('⚠️  Skipping Yggdrasil example - requires real credentials');
    console.log('📝 To test Yggdrasil authentication:');
    console.log('   1. Uncomment the getYggdrasilAuth line above');
    console.log('   2. Replace with your actual Mojang email and password');
    console.log('   3. Run the example again');
    
  } catch (error) {
    console.error('❌ Yggdrasil Authentication Error:', error.message);
  }
}

async function unifiedApiExample() {
  console.log('\n🔧 === Unified API Example ===');
  
  try {
    // Example 1: Offline using unified API
    console.log('\n📝 Unified API - Offline:');
    const offlineAuth = await Authenticator.getAuth({
      type: 'offline',
      username: 'UnifiedTestPlayer'
    });
    console.log(`   ✅ ${offlineAuth.name} (${offlineAuth.meta.type})`);
    
    // Example 2: Microsoft using unified API
    console.log('\n📝 Unified API - Microsoft (demo):');
    console.log('   💡 Would open browser for Microsoft login');
    // const microsoftAuth = await Authenticator.getAuth({ type: 'microsoft', gui: true });
    
    // Example 3: Yggdrasil using unified API
    console.log('\n📝 Unified API - Yggdrasil (demo):');
    console.log('   💡 Would authenticate with Mojang servers');
    // const yggdrasilAuth = await Authenticator.getAuth({
    //   type: 'yggdrasil',
    //   username: 'email@example.com',
    //   password: 'password'
    // });
    
  } catch (error) {
    console.error('❌ Unified API Error:', error.message);
  }
}

async function tokenManagementExample() {
  console.log('\n🔧 === Token Management Example ===');
  
  try {
    // Create offline auth for demonstration
    const auth = await Authenticator.getOfflineAuth('TokenTestPlayer');
    
    console.log('\n📝 Token Validation:');
    const isValid = await Authenticator.validate(auth.access_token, auth.client_token, auth.meta.type);
    console.log(`   Valid: ${isValid}`);
    
    console.log('\n📝 Token Refresh:');
    const refreshedAuth = await Authenticator.refreshAuth(auth.access_token, auth.client_token, auth.meta.type);
    console.log(`   Refreshed for: ${refreshedAuth.name}`);
    
    console.log('\n📝 Token Invalidation:');
    const invalidated = await Authenticator.invalidate(auth.access_token, auth.client_token, auth.meta.type);
    console.log(`   Invalidated: ${invalidated}`);
    
    console.log('\n📝 Sign Out:');
    const signedOut = await Authenticator.signOut(auth.name, null, auth.meta.type);
    console.log(`   Signed Out: ${signedOut}`);
    
  } catch (error) {
    console.error('❌ Token Management Error:', error.message);
  }
}

async function launchExample() {
  console.log('\n🔧 === Launch with Authentication Example ===');
  
  try {
    // Get offline authentication
    const auth = await Authenticator.getOfflineAuth('LaunchTestPlayer');
    
    // Setup launcher
    const launcher = new Client();
    
    // Setup event listeners
    launcher.on('debug', (message) => {
      console.log(`🔍 ${message}`);
    });
    
    launcher.on('progress', (progress) => {
      const percentage = Math.round((progress.task / progress.total) * 100);
      console.log(`📥 ${progress.type.toUpperCase()}: ${percentage}% (${progress.task}/${progress.total})`);
    });
    
    const options = {
      authorization: auth,
      root: './minecraft',
      version: {
        number: '1.20.1',
        type: 'release'
      },
      memory: {
        max: '2G',
        min: '1G'
      }
    };
    
    console.log('\n🚀 Launching Minecraft with authenticated user...');
    console.log(`   Player: ${auth.name}`);
    console.log(`   Auth Type: ${auth.meta.type}`);
    console.log(`   UUID: ${auth.uuid}`);
    
    // Note: Uncomment to actually launch Minecraft
    // const process = await launcher.launch(options);
    console.log('💡 Launch commented out for demo - uncomment to actually launch');
    
  } catch (error) {
    console.error('❌ Launch Example Error:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 VoidBeam Core - Authentication Examples\n');
  console.log('This example demonstrates all authentication methods supported by VoidBeam Core:');
  console.log('- Offline Authentication (no account needed)');
  console.log('- Microsoft Authentication (Xbox Live/Game Pass)');
  console.log('- Yggdrasil Authentication (Legacy Mojang accounts)');
  
  // Run examples
  await offlineExample();
  await microsoftExample();
  await yggdrasilExample();
  await unifiedApiExample();
  await tokenManagementExample();
  await launchExample();
  
  console.log('\n✨ All authentication examples completed!');
  console.log('\n📚 For more information:');
  console.log('   - Check the README.md for full documentation');
  console.log('   - Run "npm run cli" for interactive launcher');
  console.log('   - See example.js for basic launch examples');
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔐 VoidBeam Core Authentication Examples

Usage:
  node example-auth.js              Run all authentication examples
  node example-auth.js offline      Run only offline example
  node example-auth.js microsoft    Run only Microsoft example
  node example-auth.js yggdrasil    Run only Yggdrasil example
  node example-auth.js unified      Run only unified API example
  node example-auth.js tokens       Run only token management example
  node example-auth.js launch       Run only launch example

Examples:
  node example-auth.js offline      Test offline authentication
  npm run example:auth              Run via npm script
`);
  process.exit(0);
}

// Run specific examples based on arguments
if (args.length > 0) {
  const example = args[0].toLowerCase();
  switch (example) {
    case 'offline':
      offlineExample().catch(console.error);
      break;
    case 'microsoft':
      microsoftExample().catch(console.error);
      break;
    case 'yggdrasil':
      yggdrasilExample().catch(console.error);
      break;
    case 'unified':
      unifiedApiExample().catch(console.error);
      break;
    case 'tokens':
      tokenManagementExample().catch(console.error);
      break;
    case 'launch':
      launchExample().catch(console.error);
      break;
    default:
      console.error('❌ Unknown example:', example);
      process.exit(1);
  }
} else {
  // Run all examples
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
