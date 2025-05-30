# VoidBeam Core Authentication Guide

This document provides comprehensive information about authentication methods supported by VoidBeam Core.

## Overview

VoidBeam Core supports three authentication methods:

1. **Offline Authentication** - No account required, perfect for development and offline play
2. **Microsoft Authentication** - For Xbox Live/Game Pass accounts (recommended)  
3. **Yggdrasil Authentication** - For legacy Mojang accounts (deprecated by Mojang)

## Quick Reference

### Offline Authentication
```javascript
// Method 1: Legacy (backward compatible)
const auth = await Authenticator.getAuth('PlayerName');

// Method 2: Direct
const auth = await Authenticator.getOfflineAuth('PlayerName');

// Method 3: Unified API
const auth = await Authenticator.getAuth({
  type: 'offline',
  username: 'PlayerName'
});
```

### Microsoft Authentication
```javascript
// GUI authentication (requires Electron)
const auth = await Authenticator.getMicrosoftAuth({ gui: true });

// Device code authentication (CLI-based)
const auth = await Authenticator.getMicrosoftAuth({ gui: false });

// Unified API
const auth = await Authenticator.getAuth({
  type: 'microsoft',
  gui: true  // optional, defaults to true
});
```

### Yggdrasil Authentication
```javascript
// Direct method
const auth = await Authenticator.getYggdrasilAuth('email@example.com', 'password');

// Unified API
const auth = await Authenticator.getAuth({
  type: 'yggdrasil',
  username: 'email@example.com',
  password: 'password'
});
```

## Authentication Object Structure

All authentication methods return an object with this structure:

```javascript
{
  access_token: string,    // Access token for authentication
  client_token: string,    // Client token for authentication
  uuid: string,           // Player UUID
  name: string,           // Player name
  user_properties: string, // User properties as JSON string
  meta: {
    type: string,         // 'offline', 'microsoft', or 'yggdrasil'
    demo: boolean,        // Whether this is a demo account
    xuid?: string,        // Xbox User ID (Microsoft only)
    legacy?: boolean      // Legacy account flag (Yggdrasil only)
  }
}
```

## Token Management

### Validation
```javascript
const isValid = await Authenticator.validate(
  auth.access_token,
  auth.client_token,
  auth.meta.type
);
```

### Refresh (Yggdrasil only)
```javascript
const refreshed = await Authenticator.refreshAuth(
  auth.access_token,
  auth.client_token,
  auth.meta.type
);
```

### Invalidation
```javascript
await Authenticator.invalidate(
  auth.access_token,
  auth.client_token,
  auth.meta.type
);
```

### Sign Out
```javascript
// Offline and Microsoft
await Authenticator.signOut(username, null, auth.meta.type);

// Yggdrasil (requires password)
await Authenticator.signOut(username, password, 'yggdrasil');
```

## Best Practices

### Error Handling
Always implement proper error handling with fallback options:

```javascript
async function authenticateWithFallback() {
  try {
    // Try Microsoft authentication first
    return await Authenticator.getMicrosoftAuth();
  } catch (error) {
    console.warn('Microsoft auth failed, falling back to offline');
    const username = await promptForUsername();
    return await Authenticator.getOfflineAuth(username);
  }
}
```

### Token Storage
- **Never store passwords in plain text**
- Store tokens securely (encrypted if persistent storage is needed)
- Validate tokens before use
- Handle token expiration gracefully

### Microsoft Authentication
- GUI mode requires Electron: `npm install electron`
- Device code mode works without additional dependencies
- Tokens cannot be refreshed - re-authentication required when expired

### Yggdrasil Authentication
- Only works with legacy Mojang accounts
- New accounts must use Microsoft authentication
- Tokens can be refreshed using `refreshAuth()`
- Will be removed when Mojang fully deprecates the service

## Testing

Run authentication tests:
```bash
# Test all authentication methods
npm run example:auth

# Test specific methods
npm run example:auth:offline
npm run example:auth:microsoft
npm run example:auth:yggdrasil

# Run unit tests
npm test
```

## Security Considerations

1. **Credential Protection**: Never log or store passwords
2. **Token Security**: Treat access tokens as sensitive data
3. **Network Security**: All authentication uses HTTPS
4. **Offline Safety**: Offline mode generates deterministic UUIDs
5. **Error Handling**: Don't expose authentication errors to end users

## Migration Guide

### From Offline-Only to Multi-Auth

If you're upgrading from offline-only VoidBeam Core:

```javascript
// Old code (still works)
const auth = await Authenticator.getAuth('PlayerName');

// New unified approach
const auth = await Authenticator.getAuth({
  type: 'offline',
  username: 'PlayerName'
});

// Or use specific methods
const auth = await Authenticator.getOfflineAuth('PlayerName');
```

All existing code continues to work without changes.

## Troubleshooting

### Common Issues

1. **Microsoft Auth Fails**: Install Electron or use device code flow
2. **Yggdrasil Fails**: Check if account is migrated to Microsoft
3. **Token Invalid**: Re-authenticate or refresh (Yggdrasil only)
4. **Launch Fails**: Verify authentication object structure

### Debug Mode

Enable debug logging:
```javascript
launcher.on('debug', (message) => console.log(`DEBUG: ${message}`));
```

For more troubleshooting, see the main README.md file.
