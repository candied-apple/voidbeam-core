# VoidBeam Core

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![version](https://img.shields.io/badge/version-1.0.0-blue)

VoidBeam Core is a NodeJS Minecraft launcher library focused on offline authentication. It's designed to be a lightweight alternative to other launcher cores, providing essential functionality for launching Minecraft without requiring online authentication.

## Features

- 🚀 **Multiple Authentication Methods** - Offline, Microsoft (Xbox Live), and Yggdrasil (Mojang) support
- 🔗 **Custom API URLs** - Configurable authentication server endpoints for private/custom servers
- 📦 **Automatic Downloads** - Handles Minecraft versions, assets, and libraries
- 🔧 **Cross-Platform** - Works on Windows, macOS, and Linux
- 🎮 **Version Support** - Supports all Minecraft versions from 1.6+ 
- 📝 **TypeScript Support** - Full TypeScript definitions included
- 🔒 **Security Patches** - Includes log4j security fixes for affected versions
- 🎯 **Interactive CLI** - User-friendly command-line interface
- 🔄 **Token Management** - Validation, refresh, and invalidation support

## Installation

```bash
npm install voidbeam-core
```

### Optional Dependencies

For GUI Microsoft authentication, you may want to install Electron:

```bash
npm install electron
```

If Electron is not available, Microsoft authentication will automatically fall back to device code flow (CLI-based authentication).

## Quick Test

After installation, you can quickly test the module:

```bash
# Run basic functionality tests
npm test

# Test authenticator functions
npm run example:auth

# Test specific authentication methods
npm run example:auth:offline
npm run example:auth:microsoft
npm run example:auth:yggdrasil

# Test API URL management
npm run example:api
npm run example:api:basic
npm run example:api:custom
npm run example:api:errors

# See all available example commands
npm run example
```

## Interactive CLI

VoidBeam Core includes a user-friendly interactive CLI tool for easy testing and launching:

```bash
# Launch the interactive CLI
npm run cli

# Or run directly
node cli.js
```

The CLI will guide you through:
- Player name setup
- Minecraft version selection  
- Memory allocation
- Game directory configuration
- Automatic launching

You can also use command line options:
```bash
# Show help
node cli.js --help

# Show version
node cli.js --version
```

## Quick Start

```javascript
const { Client, Authenticator } = require('voidbeam-core');
const launcher = new Client();

async function launchMinecraft() {
  const auth = await Authenticator.getAuth("PlayerName");
  
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

  const minecraftProcess = await launcher.launch(options);
  
  if (minecraftProcess) {
    console.log('Minecraft launched successfully!');
  }
}

// Event listeners
launcher.on('debug', (e) => console.log(e));
launcher.on('data', (e) => console.log(e));
launcher.on('close', (code) => console.log(`Minecraft exited with code ${code}`));
launcher.on('progress', (progress) => {
  console.log(`${progress.type}: ${progress.task}/${progress.total}`);
});

launchMinecraft().catch(console.error);
```

## Authentication Methods

VoidBeam Core supports three different authentication methods:

### 1. Offline Authentication

Perfect for offline play and development. No account required.

```javascript
const { Authenticator } = require('voidbeam-core');

// Method 1: Legacy API (backward compatible)
const auth = await Authenticator.getAuth('PlayerName');

// Method 2: Direct offline method
const auth = await Authenticator.getOfflineAuth('PlayerName');

// Method 3: Unified API
const auth = await Authenticator.getAuth({
  type: 'offline',
  username: 'PlayerName'
});

console.log(`Player: ${auth.name}, UUID: ${auth.uuid}`);
```

### 2. Microsoft Authentication

For users with Xbox Live or Game Pass accounts.

```javascript
const { Authenticator } = require('voidbeam-core');

// GUI authentication (opens browser)
const auth = await Authenticator.getMicrosoftAuth({ gui: true });

// Or using unified API
const auth = await Authenticator.getAuth({
  type: 'microsoft',
  gui: true  // optional, defaults to true
});

console.log(`Microsoft user: ${auth.name}`);
console.log(`Xbox User ID: ${auth.meta.xuid}`);
```

### 3. Yggdrasil Authentication

For legacy Mojang accounts (Note: Mojang deprecated this method).

```javascript
const { Authenticator } = require('voidbeam-core');

// Direct method
const auth = await Authenticator.getYggdrasilAuth('email@example.com', 'password');

// Or using unified API
const auth = await Authenticator.getAuth({
  type: 'yggdrasil',
  username: 'email@example.com',
  password: 'password'
});

console.log(`Mojang user: ${auth.name}`);
```

### Token Management

All authentication methods support token management:

```javascript
// Validate tokens
const isValid = await Authenticator.validate(
  auth.access_token, 
  auth.client_token, 
  auth.meta.type
);

// Refresh tokens (Yggdrasil only)
const refreshed = await Authenticator.refreshAuth(
  auth.access_token, 
  auth.client_token, 
  auth.meta.type
);

// Invalidate tokens
await Authenticator.invalidate(
  auth.access_token, 
  auth.client_token, 
  auth.meta.type
);

// Sign out
await Authenticator.signOut(username, password, auth.meta.type);
```

### 4. API URL Management

VoidBeam Core allows customization of authentication server URLs for custom servers, development, or alternative authentication providers:

```javascript
const { Authenticator } = require('voidbeam-core');

// Change Yggdrasil API URL to custom server
Authenticator.changeApiUrl('https://auth.myminecraftserver.com');

// Get current API URLs
const urls = Authenticator.getApiUrls();
console.log('Current authenticate URL:', urls.yggdrasil.authenticate);

// Reset to default Mojang URLs
Authenticator.resetApiUrls();
```

**Use cases:**
- Custom authentication servers for private Minecraft servers
- Development/testing with local authentication services
- Alternative Mojang-compatible authentication providers
- Corporate/enterprise Minecraft deployments

**Note:** API URL changes only affect Yggdrasil authentication. Microsoft authentication uses fixed endpoints managed by the MSMC library.

```javascript
// Example: Full workflow with custom server
Authenticator.changeApiUrl('https://auth.example.com');
const auth = await Authenticator.getYggdrasilAuth('user', 'pass');
const isValid = await Authenticator.validate(auth.access_token, auth.client_token, 'yggdrasil');
Authenticator.resetApiUrls(); // Reset when done
```

## API Documentation

### Client

The main launcher class that handles Minecraft launching.

#### Methods

##### launch(options)

Launches Minecraft with the specified options.

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `options` | Object | Launch configuration options | Yes |

**Options Object:**

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `authorization` | Object | Authentication object from Authenticator.getAuth() | Yes |
| `root` | String | Path where launcher files will be stored | Yes |
| `version.number` | String | Minecraft version (e.g., "1.20.1") | Yes |
| `version.type` | String | Version type ("release", "snapshot", etc.) | No |
| `memory.max` | String/Number | Maximum memory allocation (e.g., "4G", 4096) | No |
| `memory.min` | String/Number | Minimum memory allocation (e.g., "2G", 2048) | No |
| `javaPath` | String | Path to Java executable | No |
| `customArgs` | Array | Custom JVM arguments | No |
| `customLaunchArgs` | Array | Custom Minecraft launch arguments | No |
| `window.width` | Number | Game window width | No |
| `window.height` | Number | Game window height | No |
| `window.fullscreen` | Boolean | Launch in fullscreen mode | No |
| `overrides` | Object | Advanced override options | No |

#### Events

- **debug** - Debug messages from the launcher
- **data** - Output data from Minecraft process
- **close** - Emitted when Minecraft process closes
- **arguments** - Launch arguments used to start Minecraft
- **progress** - Download/preparation progress updates

### Authenticator

Handles authentication for Minecraft with support for multiple methods.

#### Methods

##### getAuth(options|username, password?, type?)

Main authentication method supporting all authentication types.

**Parameters:**
- `options` (Object|String): Authentication options object or username for offline
- `password` (String, optional): Password for Yggdrasil authentication
- `type` (String, optional): Authentication type ('offline', 'microsoft', 'yggdrasil')

**Options Object:**
| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `type` | String | Authentication type: 'offline', 'microsoft', 'yggdrasil' | Yes |
| `username` | String | Username (offline/yggdrasil) | For offline/yggdrasil |
| `password` | String | Password (yggdrasil only) | For yggdrasil |
| `gui` | Boolean | Use GUI for Microsoft auth (default: true) | No |

##### getOfflineAuth(username)

Creates an offline authentication profile.

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `username` | String | Player name for offline mode | Yes |

##### getMicrosoftAuth(options?)

Authenticates with Microsoft/Xbox Live account.

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `options.gui` | Boolean | Use GUI authentication (default: true) | No |

##### getYggdrasilAuth(username, password)

Authenticates with Mojang account using Yggdrasil protocol.

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `username` | String | Email or username | Yes |
| `password` | String | Account password | Yes |

##### validate(accessToken, clientToken, type?)

Validates authentication tokens.

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `accessToken` | String | Access token to validate | Yes |
| `clientToken` | String | Client token to validate | Yes |
| `type` | String | Authentication type (default: 'offline') | No |

##### refreshAuth(accessToken, clientToken, type?)

Refreshes authentication tokens (Yggdrasil only, others return same tokens).

##### invalidate(accessToken, clientToken, type?)

Invalidates authentication tokens.

##### signOut(username, password?, type?)

Signs out a user (Yggdrasil requires password).

## Advanced Configuration

### Override Options

For advanced users, you can override default behaviors:

```javascript
const options = {
  // ... basic options
  overrides: {
    gameDirectory: "./saves",     // Custom game directory
    minecraftJar: "./custom.jar", // Custom Minecraft jar
    natives: "./natives",         // Custom natives directory
    assetRoot: "./assets",        // Custom assets directory
    libraryRoot: "./libraries",   // Custom libraries directory
    cwd: "./working",             // Working directory
    detached: true,               // Detach process
    url: {
      meta: "https://launchermeta.mojang.com",
      resource: "https://resources.download.minecraft.net"
    }
  }
};
```

### Custom Java Arguments

Add custom JVM arguments for performance tuning:

```javascript
const options = {
  // ... other options
  customArgs: [
    "-XX:+UnlockExperimentalVMOptions",
    "-XX:+UseG1GC",
    "-XX:G1NewSizePercent=20",
    "-XX:G1ReservePercent=20",
    "-XX:MaxGCPauseMillis=50",
    "-XX:G1HeapRegionSize=32M"
  ]
};
```

### Memory Management

Configure memory allocation:

```javascript
const options = {
  // ... other options
  memory: {
    max: "8G",    // Maximum heap size
    min: "4G"     // Minimum heap size
  }
};
```

## Error Handling

Always handle potential errors when launching:

```javascript
launcher.launch(options)
  .then(process => {
    if (process) {
      console.log('Launch successful');
    } else {
      console.log('Launch failed');
    }
  })
  .catch(error => {
    console.error('Launch error:', error);
  });

launcher.on('close', (code) => {
  if (code !== 0) {
    console.error(`Minecraft exited with error code: ${code}`);
  }
});
```

## Supported Minecraft Versions

VoidBeam Core supports Minecraft versions 1.6 and above, including:

- All release versions (1.6.1 - 1.20.4+)
- Most snapshot versions
- Legacy versions (with limited functionality)

## Platform Support

- **Windows** - Full support
- **macOS** - Full support  
- **Linux** - Full support

## Security

VoidBeam Core automatically applies security patches for affected Minecraft versions:

- Log4j vulnerability patches for versions 1.7-1.18
- Automatic configuration file downloads for security

## Troubleshooting

### Common Issues

**Java not found:**
```javascript
// Specify Java path explicitly
const options = {
  javaPath: "/path/to/java",
  // ... other options
};
```

**Memory errors:**
```javascript
// Reduce memory allocation
const options = {
  memory: {
    max: "2G",
    min: "1G"
  }
  // ... other options
};
```

**Download failures:**
- Check internet connection
- Verify firewall settings
- Check disk space in root directory

### Authentication Issues

**Microsoft Authentication:**
- Ensure you have a valid Microsoft account with Minecraft purchased
- For GUI authentication, install Electron: `npm install electron`
- If Electron is not available, authentication will use device code flow instead
- Make sure your system can open a browser window for authentication
- Check your internet connection
- If GUI authentication fails, the CLI will automatically fall back to offline mode

**Yggdrasil Authentication:**
- Note: Mojang has deprecated Yggdrasil authentication for new accounts
- Only works with legacy Mojang accounts (created before Microsoft migration)
- Ensure your credentials are correct
- Check if your account has been migrated to Microsoft

**Token Issues:**
- Microsoft tokens expire and cannot be refreshed - re-authentication is required
- Yggdrasil tokens can be refreshed using `refreshAuth()`
- Use `validate()` to check token status before launching
- Invalid tokens will cause launch failures

**General Authentication:**
- Always handle authentication errors gracefully
- Implement fallback to offline mode for better user experience
- Store authentication results securely (never store passwords in plain text)

```javascript
// Example: Robust authentication with fallback
async function authenticateWithFallback(preferredType = 'microsoft') {
  try {
    switch (preferredType) {
      case 'microsoft':
        return await Authenticator.getMicrosoftAuth();
      case 'yggdrasil':
        // Get credentials securely
        return await Authenticator.getYggdrasilAuth(email, password);
      default:
        return await Authenticator.getOfflineAuth(username);
    }
  } catch (error) {
    console.warn(`${preferredType} authentication failed, falling back to offline`);
    const fallbackUsername = await promptForUsername();
    return await Authenticator.getOfflineAuth(fallbackUsername);
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [MinecraftLauncher-core](https://github.com/Pierce01/MinecraftLauncher-core)
- Built for the Minecraft community
- Special thanks to all contributors

## Changelog

### 1.1.0
- **NEW**: Microsoft Authentication support with Xbox Live integration
- **NEW**: Yggdrasil (Mojang) Authentication for legacy accounts  
- **NEW**: Unified authentication API supporting all methods
- **NEW**: Enhanced CLI with authentication method selection
- **NEW**: Comprehensive token management (validate, refresh, invalidate)
- **NEW**: Interactive authentication examples and documentation
- **ENHANCED**: TypeScript definitions with full authentication support
- **ENHANCED**: Test suite covering all authentication methods
- Backward compatible with existing offline authentication code

### 1.0.0
- Initial release
- Offline authentication support
- Cross-platform compatibility
- Automatic asset and library downloading
- TypeScript support
