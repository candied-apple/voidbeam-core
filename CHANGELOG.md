# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-05-30

### Added
- **Microsoft Authentication** - Full support for Microsoft/Xbox Live accounts with GUI authentication
- **Yggdrasil Authentication** - Support for legacy Mojang accounts using Yggdrasil protocol
- **Unified Authentication API** - Single `getAuth()` method supporting all authentication types
- **API URL Customization** - `changeApiUrl()`, `getApiUrls()`, and `resetApiUrls()` functions for custom authentication servers
- **Enhanced CLI** - Interactive authentication method selection in CLI tool
- **Token Management** - Comprehensive token validation, refresh, and invalidation
- **New Example Scripts** - `example-auth.js` and `example-api-url.js` demonstrating all features
- **Enhanced TypeScript Definitions** - Updated type definitions for new authentication and API URL features
- **New Dependencies** - Added `axios`, `msmc`, and `node-fetch` for online authentication

### Enhanced
- **Authenticator Module** - Complete rewrite with backward compatibility and configurable API endpoints
- **CLI Interface** - Now prompts for authentication method selection
- **Test Suite** - Extended tests for all authentication methods and API URL management
- **Documentation** - Comprehensive authentication guide in README and AUTHENTICATION.md
- **Package Scripts** - New npm scripts for testing authentication types and API URL management

### Dependencies
- Added `axios@^1.6.0` for HTTP requests
- Added `msmc@^4.1.0` for Microsoft authentication
- Added `node-fetch@^2.7.0` for additional HTTP functionality

### Backward Compatibility
- All existing offline authentication code continues to work
- Legacy `Authenticator.getAuth(username)` still supported
- No breaking changes to existing APIs

## [1.0.0] - 2025-05-30

### Added
- Initial release of VoidBeam Core
- Offline authentication system for Minecraft launcher
- Cross-platform support (Windows, macOS, Linux)
- Automatic Minecraft version downloading and management
- Asset and library management
- Native library handling
- Interactive CLI tool for easy testing and launching
- TypeScript definitions for development support
- Log4j security vulnerability patches
- Comprehensive test suite and examples
- NPM scripts for testing, examples, and CLI usage
- TypeScript definitions included
- Comprehensive example scripts
- Full test suite
- Security patches for log4j vulnerabilities
- EventEmitter-based progress tracking
- Memory management configuration
- Custom JVM argument support
- Window size and fullscreen options

### Features
- **Offline Authentication**: Generate deterministic UUIDs for offline play
- **Version Support**: All Minecraft versions from 1.6+
- **Auto Downloads**: Automatically downloads Minecraft jars, assets, and libraries
- **Cross Platform**: Native support for Windows, macOS, and Linux
- **TypeScript**: Full TypeScript definitions for better development experience
- **Security**: Built-in log4j security patches for affected versions
- **Extensible**: Override system for advanced customization

### API
- `Client.launch(options)` - Main launcher method
- `Authenticator.getAuth(username)` - Generate offline authentication
- `Authenticator.validate()` - Validate authentication (always true for offline)
- `Authenticator.refreshAuth()` - Refresh authentication tokens
- `Authenticator.invalidate()` - Invalidate authentication tokens
- `Authenticator.signOut()` - Sign out user

### Events
- `debug` - Debug messages from launcher
- `data` - Output from Minecraft process
- `close` - Minecraft process exit
- `progress` - Download/preparation progress
- `arguments` - Launch arguments used

### Dependencies
- `adm-zip`: ^0.5.10 - ZIP file handling
- `checksum`: ^1.0.0 - File integrity verification
- `request`: ^2.88.2 - HTTP requests
- `uuid`: ^9.0.1 - UUID generation

### Compatibility
- Node.js: >=14.0.0
- Minecraft: 1.6+ (all versions)
- Java: 8+ (depending on Minecraft version)
