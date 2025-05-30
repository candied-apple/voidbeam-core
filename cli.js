// VoidBeam Core Interactive CLI
console.log('Starting CLI...');

const { Client, Authenticator } = require('./index');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function interactiveLauncher() {
  console.log('🚀 VoidBeam Core Interactive Launcher\n');
  
  try {
    // Authentication type selection
    console.log('🔐 Select Authentication Method:');
    console.log('1. Offline (no account required)');
    console.log('2. Microsoft Account');
    console.log('3. Mojang/Yggdrasil Account');
    
    const authChoice = await question('Enter choice (1-3) [default: 1]: ') || '1';
    
    let auth;
    
    switch (authChoice) {
      case '2':
        console.log('\n🔧 Setting up Microsoft authentication...');
        console.log('📋 A browser window will open for Microsoft login');
        try {
          auth = await Authenticator.getMicrosoftAuth({ gui: true });
          console.log(`✅ Microsoft authentication successful for: ${auth.name}`);
        } catch (error) {
          console.error('❌ Microsoft authentication failed:', error.message);
          console.log('💡 Falling back to offline mode...');
          const username = await question('Enter player name for offline mode: ');
          auth = await Authenticator.getOfflineAuth(username);
        }
        break;
        
      case '3':
        console.log('\n🔧 Setting up Mojang/Yggdrasil authentication...');
        const email = await question('Enter email/username: ');
        const password = await question('Enter password: ');
        try {
          auth = await Authenticator.getYggdrasilAuth(email, password);
          console.log(`✅ Yggdrasil authentication successful for: ${auth.name}`);
        } catch (error) {
          console.error('❌ Yggdrasil authentication failed:', error.message);
          console.log('💡 Falling back to offline mode...');
          const username = await question('Enter player name for offline mode: ');
          auth = await Authenticator.getOfflineAuth(username);
        }
        break;
        
      case '1':
      default:
        console.log('\n🔧 Setting up offline authentication...');
        const username = await question('Enter player name: ');
        auth = await Authenticator.getOfflineAuth(username);
        console.log(`✅ Created offline profile for: ${auth.name}`);
        break;
    }
    
    // Get other launch parameters
    const version = await question('Enter Minecraft version (e.g., 1.20.1): ');
    const memory = await question('Enter max memory (e.g., 4G) [default: 4G]: ') || '4G';
    const rootPath = await question('Enter game directory [default: ./minecraft]: ') || './minecraft';
    
    console.log('🔧 Configuring launcher...');
    const launcher = new Client();
    
    // Set up event listeners
    launcher.on('debug', (message) => {
      console.log(`🔍 ${message}`);
    });
    
    launcher.on('progress', (progress) => {
      const percentage = Math.round((progress.task / progress.total) * 100);
      console.log(`📥 ${progress.type.toUpperCase()}: ${percentage}% (${progress.task}/${progress.total})`);
    });
    
    launcher.on('data', (data) => {
      console.log(`🎮 ${data.trim()}`);
    });
    
    launcher.on('close', (code) => {
      console.log(`\n🏁 Minecraft exited with code: ${code}`);
      rl.close();
    });
    
    const options = {
      authorization: auth,
      root: rootPath,
      version: {
        number: version,
        type: "release"
      },
      memory: {
        max: memory,
        min: Math.max(1, parseInt(memory) / 2) + 'G'
      }
    };
    
    console.log('\n🚀 Launching Minecraft...');
    const process = await launcher.launch(options);
    
    if (process) {
      console.log(`✅ Minecraft launched successfully! (PID: ${process.pid})`);
      console.log('📝 Game output will appear below:\n');
    } else {
      console.log('❌ Failed to launch Minecraft');
      rl.close();
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🚀 VoidBeam Core CLI

Usage:
  node cli.js              Run interactive launcher
  node cli.js --help       Show this help message
  node cli.js --version    Show version information

Examples:
  node cli.js              Launch interactive mode
  npm run cli              Launch via npm script
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const { version } = require('./package.json');
  console.log(`VoidBeam Core v${version}`);
  process.exit(0);
}

// Run interactive launcher
interactiveLauncher().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
