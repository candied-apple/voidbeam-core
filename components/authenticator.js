const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { Auth } = require('msmc');

/**
 * VoidBeam Core Authenticator - Supports Offline, Microsoft, and Yggdrasil authentication
 */

// Default API URLs
let API_URLS = {
  yggdrasil: {
    authenticate: 'https://authserver.mojang.com/authenticate',
    refresh: 'https://authserver.mojang.com/refresh',
    validate: 'https://authserver.mojang.com/validate',
    invalidate: 'https://authserver.mojang.com/invalidate',
    signout: 'https://authserver.mojang.com/signout'
  },
  microsoft: {
    // Microsoft URLs are handled by MSMC library
  }
};

/**
 * Creates an offline authentication profile for a given username
 * @param {string} username - The username for offline mode
 * @returns {Promise<Object>} User profile object for offline authentication
 */
async function getOfflineAuth(username) {
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required for offline authentication');
  }

  const offlineUuid = generateOfflineUuid(username);
  
  return {
    access_token: offlineUuid,
    client_token: offlineUuid,
    uuid: offlineUuid,
    name: username,
    user_properties: '{}',
    meta: {
      type: 'offline',
      demo: false
    }
  };
}

/**
 * Microsoft Authentication using MSMC
 * @param {Object} options - Authentication options
 * @param {boolean} options.gui - Whether to use GUI authentication (default: true)
 * @returns {Promise<Object>} User profile object for Microsoft authentication
 */
async function getMicrosoftAuth(options = {}) {
  try {
    const authManager = new Auth("select_account");
    
    let xboxManager;
    if (options.gui !== false) {
      try {
        // Try GUI authentication first
        xboxManager = await authManager.launch("electron");
      } catch (electronError) {
        console.warn('Electron not available for GUI authentication, falling back to device code flow');
        // Fallback to device code authentication if Electron is not available
        xboxManager = await authManager.launch("raw");
      }
    } else {
      // Console/device code authentication
      xboxManager = await authManager.launch("raw");
    }

    const token = await xboxManager.getMinecraft();
    
    if (!token.mclc()) {
      throw new Error('Failed to get Minecraft token from Microsoft account');
    }

    const profile = token.mclc();
    
    return {
      access_token: profile.access_token,
      client_token: profile.client_token || uuidv4(),
      uuid: profile.uuid,
      name: profile.name,
      user_properties: JSON.stringify(profile.user_properties || {}),
      meta: {
        type: 'microsoft',
        demo: false,
        xuid: token.xbox?.userHash || null
      }
    };
  } catch (error) {
    throw new Error(`Microsoft authentication failed: ${error.message}`);
  }
}

/**
 * Yggdrasil (Mojang) Authentication
 * @param {string} username - Email or username
 * @param {string} password - Account password
 * @returns {Promise<Object>} User profile object for Yggdrasil authentication
 */
async function getYggdrasilAuth(username, password) {
  if (!username || !password) {
    throw new Error('Username and password are required for Yggdrasil authentication');
  }

  const authData = {
    agent: {
      name: "Minecraft",
      version: 1
    },
    username: username,
    password: password,
    clientToken: uuidv4(),
    requestUser: true
  };
  try {
    const response = await axios.post(API_URLS.yggdrasil.authenticate, authData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const data = response.data;
    
    if (!data.accessToken || !data.selectedProfile) {
      throw new Error('Invalid response from Mojang servers');
    }

    return {
      access_token: data.accessToken,
      client_token: data.clientToken,
      uuid: data.selectedProfile.id,
      name: data.selectedProfile.name,
      user_properties: JSON.stringify(data.user?.properties || {}),
      meta: {
        type: 'yggdrasil',
        demo: false,
        legacy: data.selectedProfile.legacy || false
      }
    };
  } catch (error) {
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      throw new Error(`Yggdrasil authentication failed: ${errorData.errorMessage || errorData.error || 'Unknown error'}`);
    }
    throw new Error(`Yggdrasil authentication failed: ${error.message}`);
  }
}

/**
 * Main authentication function - supports all authentication types
 * @param {string|Object} usernameOrOptions - Username for offline, or options object
 * @param {string} [password] - Password for Yggdrasil authentication
 * @param {string} [type] - Authentication type: 'offline', 'microsoft', 'yggdrasil'
 * @returns {Promise<Object>} User profile object
 */
async function getAuth(usernameOrOptions, password, type) {
  // Handle different parameter patterns
  if (typeof usernameOrOptions === 'object') {
    const options = usernameOrOptions;
    switch (options.type) {
      case 'microsoft':
        return getMicrosoftAuth(options);
      case 'yggdrasil':
        return getYggdrasilAuth(options.username, options.password);
      case 'offline':
      default:
        return getOfflineAuth(options.username);
    }
  } else {
    // Legacy parameter pattern
    const username = usernameOrOptions;
    if (password && type === 'yggdrasil') {
      return getYggdrasilAuth(username, password);
    } else if (type === 'microsoft') {
      return getMicrosoftAuth();
    } else {
      // Default to offline
      return getOfflineAuth(username);
    }
  }
}

/**
 * Validates an authentication token
 * @param {string} accessToken - Access token to validate
 * @param {string} clientToken - Client token to validate
 * @param {string} [type] - Authentication type
 * @returns {Promise<boolean>} Token validity
 */
async function validate(accessToken, clientToken, type = 'offline') {
  switch (type) {    case 'yggdrasil':
      try {
        const response = await axios.post(API_URLS.yggdrasil.validate, {
          accessToken: accessToken,
          clientToken: clientToken
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        return response.status === 204;
      } catch (error) {
        return false;
      }
    
    case 'microsoft':
      // Microsoft tokens are JWT tokens, basic validation
      try {
        if (!accessToken || accessToken.split('.').length !== 3) {
          return false;
        }
        // Additional validation could be added here
        return true;
      } catch (error) {
        return false;
      }
    
    case 'offline':
    default:
      return true;
  }
}

/**
 * Refreshes an authentication token
 * @param {string} accessToken - Access token to refresh
 * @param {string} clientToken - Client token to refresh
 * @param {string} [type] - Authentication type
 * @returns {Promise<Object>} Refreshed authentication object
 */
async function refreshAuth(accessToken, clientToken, type = 'offline') {
  switch (type) {    case 'yggdrasil':
      try {
        const response = await axios.post(API_URLS.yggdrasil.refresh, {
          accessToken: accessToken,
          clientToken: clientToken,
          requestUser: true
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });

        const data = response.data;
        return {
          access_token: data.accessToken,
          client_token: data.clientToken,
          uuid: data.selectedProfile.id,
          name: data.selectedProfile.name,
          user_properties: JSON.stringify(data.user?.properties || {}),
          meta: {
            type: 'yggdrasil',
            demo: false
          }
        };
      } catch (error) {
        throw new Error(`Token refresh failed: ${error.response?.data?.errorMessage || error.message}`);
      }
    
    case 'microsoft':
      throw new Error('Microsoft token refresh requires re-authentication');
    
    case 'offline':
    default:
      return {
        access_token: accessToken,
        client_token: clientToken,
        uuid: accessToken,
        name: 'OfflineUser',
        user_properties: '{}',
        meta: {
          type: 'offline',
          demo: false
        }
      };
  }
}

/**
 * Invalidates a token
 * @param {string} accessToken - Access token to invalidate
 * @param {string} clientToken - Client token to invalidate
 * @param {string} [type] - Authentication type
 * @returns {Promise<boolean>} Success status
 */
async function invalidate(accessToken, clientToken, type = 'offline') {
  switch (type) {    case 'yggdrasil':
      try {
        await axios.post(API_URLS.yggdrasil.invalidate, {
          accessToken: accessToken,
          clientToken: clientToken
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        return true;
      } catch (error) {
        return false;
      }
    
    case 'microsoft':
    case 'offline':
    default:
      return true;
  }
}

/**
 * Sign out
 * @param {string} username - Username to sign out
 * @param {string} password - Password for Yggdrasil
 * @param {string} [type] - Authentication type
 * @returns {Promise<boolean>} Success status
 */
async function signOut(username, password, type = 'offline') {
  switch (type) {
    case 'yggdrasil':
      if (!password) {
        throw new Error('Password required for Yggdrasil signout');
      }      try {
        await axios.post(API_URLS.yggdrasil.signout, {
          username: username,
          password: password
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        return true;
      } catch (error) {
        return false;
      }
    
    case 'microsoft':
    case 'offline':
    default:
      return true;
  }
}

/**
 * Changes the API URL for authentication services
 * @param {string} url - New base URL for authentication API
 * @param {string} [service] - Service to change URL for ('yggdrasil' or 'all'). Default: 'yggdrasil'
 * @returns {Object} Updated API URLs object
 */
function changeApiUrl(url, service = 'yggdrasil') {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required and must be a string');
  }

  // Remove trailing slash if present
  const baseUrl = url.replace(/\/$/, '');

  if (service === 'yggdrasil' || service === 'all') {
    API_URLS.yggdrasil = {
      authenticate: `${baseUrl}/authenticate`,
      refresh: `${baseUrl}/refresh`,
      validate: `${baseUrl}/validate`,
      invalidate: `${baseUrl}/invalidate`,
      signout: `${baseUrl}/signout`
    };
  }

  return { ...API_URLS };
}

/**
 * Gets the current API URLs
 * @returns {Object} Current API URLs object
 */
function getApiUrls() {
  return { ...API_URLS };
}

/**
 * Resets API URLs to default Mojang endpoints
 * @returns {Object} Reset API URLs object
 */
function resetApiUrls() {
  API_URLS.yggdrasil = {
    authenticate: 'https://authserver.mojang.com/authenticate',
    refresh: 'https://authserver.mojang.com/refresh',
    validate: 'https://authserver.mojang.com/validate',
    invalidate: 'https://authserver.mojang.com/invalidate',
    signout: 'https://authserver.mojang.com/signout'
  };
  
  return { ...API_URLS };
}

/**
 * Generate a deterministic UUID for offline mode based on username
 * @param {string} username - Username to generate UUID for
 * @returns {string} Generated UUID
 */
function generateOfflineUuid(username) {
  const namespace = 'OfflinePlayer:';
  const data = namespace + username;
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.substring(0, 8)}-${hex.substring(0, 4)}-4${hex.substring(1, 4)}-8${hex.substring(0, 3)}-${hex.substring(0, 12)}`;
}

// Export all functions
module.exports = {
  getAuth,
  getOfflineAuth,
  getMicrosoftAuth,
  getYggdrasilAuth,
  validate,
  refreshAuth,
  invalidate,
  signOut,
  changeApiUrl,
  getApiUrls,
  resetApiUrls
};
