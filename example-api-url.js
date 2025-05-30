// VoidBeam Core - Custom API URL Example
const { Authenticator } = require('./index');

async function apiUrlExample() {
  console.log('🔧 === API URL Management Example ===\n');
  
  try {
    // Display current API URLs
    console.log('📋 Current API URLs:');
    const currentUrls = Authenticator.getApiUrls();
    console.log('   Yggdrasil Authenticate:', currentUrls.yggdrasil.authenticate);
    console.log('   Yggdrasil Validate:', currentUrls.yggdrasil.validate);
    console.log('   Yggdrasil Refresh:', currentUrls.yggdrasil.refresh);
    console.log('   Yggdrasil Invalidate:', currentUrls.yggdrasil.invalidate);
    console.log('   Yggdrasil Signout:', currentUrls.yggdrasil.signout);
    
    // Change to custom authentication server
    console.log('\n🔄 Changing to custom authentication server...');
    const customUrls = Authenticator.changeApiUrl('https://custom-auth.example.com');
    console.log('✅ API URLs updated:');
    console.log('   Yggdrasil Authenticate:', customUrls.yggdrasil.authenticate);
    console.log('   Yggdrasil Validate:', customUrls.yggdrasil.validate);
    console.log('   Yggdrasil Refresh:', customUrls.yggdrasil.refresh);
    console.log('   Yggdrasil Invalidate:', customUrls.yggdrasil.invalidate);
    console.log('   Yggdrasil Signout:', customUrls.yggdrasil.signout);
    
    // Test with trailing slash removal
    console.log('\n🔄 Testing URL with trailing slash...');
    const urlWithSlash = Authenticator.changeApiUrl('https://another-server.com/');
    console.log('✅ Trailing slash removed:');
    console.log('   Authenticate URL:', urlWithSlash.yggdrasil.authenticate);
    
    // Reset to default Mojang URLs
    console.log('\n🔄 Resetting to default Mojang URLs...');
    const resetUrls = Authenticator.resetApiUrls();
    console.log('✅ URLs reset to defaults:');
    console.log('   Yggdrasil Authenticate:', resetUrls.yggdrasil.authenticate);
    console.log('   Yggdrasil Validate:', resetUrls.yggdrasil.validate);
    
    console.log('\n📝 Use Cases for Custom API URLs:');
    console.log('   • Custom authentication servers for private servers');
    console.log('   • Development/testing with local authentication services');
    console.log('   • Alternative Mojang-compatible authentication providers');
    console.log('   • Corporate/enterprise Minecraft deployments');
    
  } catch (error) {
    console.error('❌ API URL Example Error:', error.message);
  }
}

async function customServerExample() {
  console.log('\n🔧 === Custom Server Authentication Example ===\n');
  
  try {
    // Example: Configure for a custom Minecraft server with its own auth
    console.log('🎮 Setting up authentication for custom Minecraft server...');
    
    // Change API URL to custom server
    Authenticator.changeApiUrl('https://auth.myminecraftserver.com');
    
    console.log('✅ Authentication configured for custom server');
    console.log('💡 Now all Yggdrasil authentication calls will use:');
    console.log('   https://auth.myminecraftserver.com/authenticate');
    console.log('   https://auth.myminecraftserver.com/validate');
    console.log('   etc...');
    
    // Simulate authentication attempt (commented out since server doesn't exist)
    console.log('\n📝 Example authentication code:');
    console.log(`
    // This would now authenticate against the custom server
    const auth = await Authenticator.getYggdrasilAuth('username', 'password');
    
    // All token operations would also use the custom server
    const isValid = await Authenticator.validate(auth.access_token, auth.client_token, 'yggdrasil');
    `);
    
    // Reset for safety
    Authenticator.resetApiUrls();
    console.log('\n🔄 Reset to default URLs for safety');
    
  } catch (error) {
    console.error('❌ Custom Server Example Error:', error.message);
  }
}

async function errorHandlingExample() {
  console.log('\n🔧 === Error Handling Example ===\n');
  
  try {
    // Test invalid URL handling
    console.log('🧪 Testing error handling...');
    
    try {
      Authenticator.changeApiUrl('');
      console.log('❌ Should have thrown error for empty URL');
    } catch (error) {
      console.log('✅ Correctly caught empty URL error:', error.message);
    }
    
    try {
      Authenticator.changeApiUrl(null);
      console.log('❌ Should have thrown error for null URL');
    } catch (error) {
      console.log('✅ Correctly caught null URL error:', error.message);
    }
    
    try {
      Authenticator.changeApiUrl(123);
      console.log('❌ Should have thrown error for non-string URL');
    } catch (error) {
      console.log('✅ Correctly caught non-string URL error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error Handling Example Error:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 VoidBeam Core - API URL Management Examples\n');
  console.log('This example demonstrates how to customize authentication server URLs');
  console.log('for custom servers, development, or alternative authentication providers.\n');
  
  await apiUrlExample();
  await customServerExample();
  await errorHandlingExample();
  
  console.log('\n✨ All API URL examples completed!');
  console.log('\n📚 For more information:');
  console.log('   - Check the README.md for API documentation');
  console.log('   - See AUTHENTICATION.md for detailed auth guide');
  console.log('   - Run "npm test" to verify functionality');
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔧 VoidBeam Core API URL Examples

Usage:
  node example-api-url.js              Run all API URL examples
  node example-api-url.js basic        Run basic API URL example
  node example-api-url.js custom       Run custom server example
  node example-api-url.js errors       Run error handling example

Examples:
  node example-api-url.js basic        Test API URL management
  npm run example:api                  Run via npm script (if added)
`);
  process.exit(0);
}

// Run specific examples based on arguments
if (args.length > 0) {
  const example = args[0].toLowerCase();
  switch (example) {
    case 'basic':
      apiUrlExample().catch(console.error);
      break;
    case 'custom':
      customServerExample().catch(console.error);
      break;
    case 'errors':
      errorHandlingExample().catch(console.error);
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
