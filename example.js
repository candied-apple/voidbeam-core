const { Client, Authenticator } = require('./index');

// Create launcher instance
const launcher = new Client();

// Basic example
async function launchMinecraftBasic() {
  try {
    console.log('Setting up offline authentication...');
    const auth = await Authenticator.getAuth("OfflinePlayer");
    
    console.log('Configuring launch options...');
    const options = {
      authorization: auth,
      root: "./minecraft",
      version: {
        number: "1.20.1",
        type: "release"
      },
      memory: {
        max: "4G",
        min: "2G"
      }
    };

    console.log('Launching Minecraft...');
    const minecraftProcess = await launcher.launch(options);
    
    if (minecraftProcess) {
      console.log('✅ Minecraft launched successfully!');
      console.log(`Process PID: ${minecraftProcess.pid}`);
    } else {
      console.log('❌ Failed to launch Minecraft');
    }
  } catch (error) {
    console.error('❌ Launch error:', error.message);
  }
}

// Advanced example with custom settings
async function launchMinecraftAdvanced() {
  try {
    console.log('Setting up advanced configuration...');
    const auth = await Authenticator.getAuth("AdvancedPlayer");
    
    const options = {
      authorization: auth,
      root: "./minecraft",
      version: {
        number: "1.19.4",
        type: "release"
      },
      memory: {
        max: "6G",
        min: "3G"
      },
      javaPath: "java", // Use system Java
      window: {
        width: 1920,
        height: 1080,
        fullscreen: false
      },
      customArgs: [
        "-XX:+UnlockExperimentalVMOptions",
        "-XX:+UseG1GC",
        "-XX:G1NewSizePercent=20",
        "-XX:G1ReservePercent=20",
        "-XX:MaxGCPauseMillis=50"
      ],
      customLaunchArgs: [
        "--quickPlayMultiplayer", "localhost:25565"
      ],
      overrides: {
        gameDirectory: "./minecraft/saves",
        detached: true
      }
    };

    console.log('Launching Minecraft with advanced settings...');
    const minecraftProcess = await launcher.launch(options);
    
    if (minecraftProcess) {
      console.log('✅ Minecraft launched with advanced settings!');
    }
  } catch (error) {
    console.error('❌ Advanced launch error:', error.message);
  }
}

// Set up event listeners
launcher.on('debug', (message) => {
  console.log(`🔍 DEBUG: ${message}`);
});

launcher.on('data', (data) => {
  console.log(`📄 GAME: ${data.trim()}`);
});

launcher.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Minecraft closed successfully');
  } else {
    console.log(`❌ Minecraft exited with code: ${code}`);
  }
});

launcher.on('progress', (progress) => {
  const percentage = Math.round((progress.task / progress.total) * 100);
  console.log(`📥 ${progress.type.toUpperCase()}: ${progress.task}/${progress.total} (${percentage}%)`);
});

launcher.on('arguments', (args) => {
  console.log('🚀 Launch arguments:', args.join(' '));
});

// Demonstrate authenticator functions
async function demonstrateAuth() {
  console.log('\\n=== Authenticator Demo ===');
  
  // Get offline auth
  const auth = await Authenticator.getAuth("TestPlayer");
  console.log('✅ Offline auth created:', {
    name: auth.name,
    uuid: auth.uuid,
    type: auth.meta.type
  });
  
  // Validate (always true for offline)
  const isValid = await Authenticator.validate(auth.access_token, auth.client_token);
  console.log('✅ Token validation:', isValid);
  
  // Refresh (returns same for offline)
  const refreshed = await Authenticator.refreshAuth(auth.access_token, auth.client_token);
  console.log('✅ Token refreshed:', refreshed.name);
  
  // Invalidate (always succeeds for offline)
  const invalidated = await Authenticator.invalidate(auth.access_token, auth.client_token);
  console.log('✅ Token invalidated:', invalidated);
  
  // Sign out (always succeeds for offline)
  const signedOut = await Authenticator.signOut("TestPlayer");
  console.log('✅ Signed out:', signedOut);
}

// Main execution
async function main() {
  console.log('🚀 VoidBeam Core Example\\n');
  
  // Show usage options
  const args = process.argv.slice(2);
  const command = args[0] || 'basic';
  
  switch (command) {
    case 'basic':
      console.log('Running basic example...');
      await launchMinecraftBasic();
      break;
      
    case 'advanced':
      console.log('Running advanced example...');
      await launchMinecraftAdvanced();
      break;
      
    case 'auth':
      console.log('Running authenticator demo...');
      await demonstrateAuth();
      break;
      
    default:
      console.log('Available commands:');
      console.log('  node example.js basic    - Basic Minecraft launch');
      console.log('  node example.js advanced - Advanced launch with custom settings');
      console.log('  node example.js auth     - Demonstrate authenticator functions');
      break;
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  launchMinecraftBasic,
  launchMinecraftAdvanced,
  demonstrateAuth
};
