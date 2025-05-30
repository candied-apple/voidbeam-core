/// <reference types="node" />

declare module "voidbeam-core" {
  type OS = "windows" | "osx" | "linux";

  interface IOverrides {
    /**
     * Path where the game process generates folders like saves and resource packs.
     */
    gameDirectory?: string;
    /**
     * Path to Minecraft jar file.
     */
    minecraftJar?: string;
    /**
     * Replaces the value after the version flag.
     */
    versionName?: string;
    /**
     * Path to version json file.
     */
    versionJson?: string;
    /**
     * Where the Minecraft jar and version json are located.
     */
    directory?: string;
    /**
     * Native directory path.
     */
    natives?: string;
    /**
     * Asset root directory.
     */
    assetRoot?: string;
    /**
     * Asset index name.
     */
    assetIndex?: string;
    /**
     * Library root directory.
     */
    libraryRoot?: string;
    /**
     * Working directory of the java process.
     */
    cwd?: string;
    /**
     * Whether or not the client is detached from the parent / launcher.
     */
    detached?: boolean;
    /**
     * All class paths are required if you use this.
     */
    classes?: Array<string>;
    /**
     * The amount of launch arguments specified in the version file before it adds the default again.
     */
    minArgs?: number;
    /**
     * Max sockets for downloadAsync.
     */
    maxSockets?: number;
    /**
     * URL overrides for different resources.
     */
    url?: {
      /**
       * List of versions.
       */
      meta?: string;
      /**
       * Minecraft resources.
       */
      resource?: string;
    };
  }

  interface ILauncherOptions {
    /**
     * Path where you want the launcher to work in.
     * This will usually be your .minecraft folder
     */
    root: string;
    /**
     * OS override for minecraft natives
     * 
     * @default will autodetect
     */
    os?: OS;
    /**
     * Array of custom Minecraft arguments. 
     */
    customLaunchArgs?: Array<string>;
    /**
     * Array of custom Java arguments
     */
    customArgs?: Array<string>;
    /**
     * minecraft version info
     */
    version: {
      /**
       * Actual version. 
       * 
       * @example '1.16.4'
       */
      number: string;
      /**
       * Version type
       * 
       * @example 'release'
       */
      type?: string;
      /**
       * If the version is custom
       */
      custom?: string;
    };
    /**
     * Cache directory
     */
    cache?: string;
    /**
     * Memory allocation for Minecraft
     */
    memory?: {
      max: string | number;
      min: string | number;
    };
    /**
     * Authorization object returned from Authenticator
     */
    authorization: IUser;
    /**
     * Java path
     */
    javaPath?: string;
    /**
     * Window options
     */
    window?: {
      width?: string | number;
      height?: string | number;
      fullscreen?: boolean;
    };
    /**
     * Request timeout in milliseconds
     */
    timeout?: number;
    /**
     * Override options
     */
    overrides?: IOverrides;
  }
  interface IUser {
    /**
     * Access token for authentication
     */
    access_token: string;
    /**
     * Client token for authentication
     */
    client_token: string;
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Player name
     */
    name: string;
    /**
     * User properties as JSON string
     */
    user_properties: string;
    /**
     * Metadata about the authentication
     */
    meta: {
      /**
       * Authentication type: 'offline', 'microsoft', or 'yggdrasil'
       */
      type: 'offline' | 'microsoft' | 'yggdrasil';
      /**
       * Whether this is a demo account
       */
      demo?: boolean;
      /**
       * Xbox User ID (for Microsoft accounts)
       */
      xuid?: string;
      /**
       * Whether this is a legacy account (for Yggdrasil)
       */
      legacy?: boolean;
    };
  }

  interface IMicrosoftAuthOptions {
    /**
     * Whether to use GUI authentication (default: true)
     */
    gui?: boolean;
  }

  interface IAuthOptions {
    /**
     * Authentication type
     */
    type: 'offline' | 'microsoft' | 'yggdrasil';
    /**
     * Username (required for offline and yggdrasil)
     */
    username?: string;
    /**
     * Password (required for yggdrasil)
     */
    password?: string;
    /**
     * Microsoft auth options
     */
    gui?: boolean;
  }
  interface IAuthenticator {
    /**
     * Get authentication for any type
     * @param options Authentication options or username for offline
     * @param password Password for Yggdrasil authentication
     * @param type Authentication type
     */
    getAuth(options: IAuthOptions | string, password?: string, type?: string): Promise<IUser>;
    
    /**
     * Get offline authentication for a username
     * @param username Username for offline mode
     */
    getOfflineAuth(username: string): Promise<IUser>;
    
    /**
     * Get Microsoft authentication
     * @param options Microsoft authentication options
     */
    getMicrosoftAuth(options?: IMicrosoftAuthOptions): Promise<IUser>;
    
    /**
     * Get Yggdrasil (Mojang) authentication
     * @param username Email or username
     * @param password Account password
     */
    getYggdrasilAuth(username: string, password: string): Promise<IUser>;
    
    /**
     * Validate an authentication token
     * @param access_token Access token to validate
     * @param client_token Client token to validate
     * @param type Authentication type
     */
    validate(
      access_token: string,
      client_token: string,
      type?: string
    ): Promise<boolean>;
    
    /**
     * Refresh authentication token
     * @param access_token Access token to refresh
     * @param client_token Client token to refresh
     * @param type Authentication type
     */
    refreshAuth(
      access_token: string,
      client_token: string,
      type?: string
    ): Promise<IUser>;
    
    /**
     * Invalidate a token
     * @param access_token Access token to invalidate
     * @param client_token Client token to invalidate
     * @param type Authentication type
     */
    invalidate(
      access_token: string,
      client_token: string,
      type?: string
    ): Promise<boolean>;
    
    /**
     * Sign out
     * @param username Username to sign out
     * @param password Password for Yggdrasil
     * @param type Authentication type
     */
    signOut(username: string, password?: string, type?: string): Promise<boolean>;

    /**
     * Change the API URL for authentication services
     * @param url New base URL for authentication API
     * @param service Service to change URL for ('yggdrasil' or 'all')
     */
    changeApiUrl(url: string, service?: string): object;

    /**
     * Get current API URLs
     */
    getApiUrls(): object;

    /**
     * Reset API URLs to default Mojang endpoints
     */
    resetApiUrls(): object;
  }

  import { EventEmitter } from 'events'
  import { ChildProcess } from 'child_process'

  export class Client extends EventEmitter {
    /**
     * Launch Minecraft with the given options
     * @param options Launch options
     */
    launch(options: ILauncherOptions): Promise<ChildProcess | null>;

    /**
     * Events emitted by the launcher
     */
    on(event: 'debug', listener: (message: string) => void): this;
    on(event: 'data', listener: (data: string) => void): this;
    on(event: 'close', listener: (code: number) => void): this;
    on(event: 'arguments', listener: (args: string[]) => void): this;
    on(event: 'progress', listener: (progress: {
      type: string;
      task: number;
      total: number;
    }) => void): this;
  }

  export const Authenticator: IAuthenticator;
}
