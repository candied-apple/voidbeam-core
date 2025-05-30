const fs = require('fs')
const path = require('path')
const request = require('request')
const checksum = require('checksum')
const Zip = require('adm-zip')
const child = require('child_process')

let counter = 0

class Handler {
  constructor(client) {
    this.client = client
    this.options = client.options
    this.baseRequest = request.defaults({
      pool: { maxSockets: this.options.overrides.maxSockets || 2 },
      timeout: this.options.timeout || 50000
    })
  }

  /**
   * Check if Java is installed and working
   * @param {string} java - Path to Java executable
   * @returns {Promise<Object>} Java check result
   */
  checkJava(java) {
    return new Promise(resolve => {
      child.exec(`"${java}" -version`, (error, stdout, stderr) => {
        if (error) {
          resolve({
            run: false,
            message: error
          })
        } else {
          this.client.emit('debug', `[VoidBeam]: Using Java version ${stderr.match(/"(.*?)"/).pop()} ${stderr.includes('64-Bit') ? '64-bit' : '32-Bit'}`)
          resolve({
            run: true
          })
        }
      })
    })
  }

  /**
   * Download a file asynchronously
   * @param {string} url - URL to download from
   * @param {string} directory - Directory to save file to
   * @param {string} name - Name of the file
   * @param {boolean} retry - Whether to retry on failure
   * @param {string} type - Type of download for progress tracking
   * @returns {Promise<void>}
   */
  downloadAsync(url, directory, name, retry, type) {
    return new Promise((resolve, reject) => {
      fs.mkdirSync(directory, { recursive: true })

      const downloadStart = Date.now()
      this.client.emit('debug', `[VoidBeam]: Downloading ${name} from ${url}`)

      const stream = this.baseRequest(url)
      stream.on('response', (response) => {
        if (response.statusCode !== 200) {
          this.client.emit('debug', `[VoidBeam]: Failed to download ${name}, status: ${response.statusCode}`)
          if (retry) return this.downloadAsync(url, directory, name, false, type)
          return reject(new Error(`Download failed: ${response.statusCode}`))
        }
      })

      stream.on('error', (error) => {
        this.client.emit('debug', `[VoidBeam]: Failed to download ${name}: ${error}`)
        if (retry) return this.downloadAsync(url, directory, name, false, type)
        reject(error)
      })

      const writeStream = fs.createWriteStream(path.join(directory, name))
      stream.pipe(writeStream)

      writeStream.on('finish', () => {
        const downloadTime = Date.now() - downloadStart
        this.client.emit('debug', `[VoidBeam]: Downloaded ${name} in ${downloadTime}ms`)
        resolve()
      })

      writeStream.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * Check file checksum
   * @param {string} hash - Expected hash
   * @param {string} file - Path to file
   * @returns {Promise<boolean>} Whether checksums match
   */
  checkSum(hash, file) {
    return new Promise((resolve, reject) => {
      checksum.file(file, (err, sum) => {
        if (err) {
          this.client.emit('debug', `[VoidBeam]: Failed to check file hash due to ${err}`)
          return resolve(false)
        }
        return resolve(hash === sum)
      })
    })
  }

  /**
   * Get Minecraft version manifest and specific version data
   * @returns {Promise<Object>} Version data
   */
  getVersion() {
    return new Promise(resolve => {
      const versionJsonPath = this.options.overrides.versionJson || path.join(this.options.directory, `${this.options.version.number}.json`)
      
      if (fs.existsSync(versionJsonPath)) {
        this.version = JSON.parse(fs.readFileSync(versionJsonPath))
        return resolve(this.version)
      }

      const manifest = `${this.options.overrides.url.meta}/mc/game/version_manifest.json`
      const cache = this.options.cache ? `${this.options.cache}/json` : `${this.options.root}/cache/json`
      
      request.get(manifest, (error, response, body) => {
        if (error && error.code !== 'ENOTFOUND') return resolve(error)
        
        if (!error) {
          if (!fs.existsSync(cache)) {
            fs.mkdirSync(cache, { recursive: true })
            this.client.emit('debug', '[VoidBeam]: Cache directory created.')
          }
          
          fs.writeFile(path.join(`${cache}/version_manifest.json`), body, (err) => {
            if (err) return resolve(err)
            
            const manifest = JSON.parse(body)
            const desiredVersion = manifest.versions.find(version => version.id === this.options.version.number)
            
            if (!desiredVersion) {
              return resolve(new Error(`Version ${this.options.version.number} not found`))
            }

            request.get(desiredVersion.url, (error, response, body) => {
              if (error) return resolve(error)
              
              this.version = JSON.parse(body)
              
              // Save version file
              if (!fs.existsSync(this.options.directory)) {
                fs.mkdirSync(this.options.directory, { recursive: true })
              }
              
              fs.writeFileSync(versionJsonPath, JSON.stringify(this.version, null, 2))
              resolve(this.version)
            })
          })
        } else {
          // Offline mode - try to use cached manifest
          const cachedManifest = path.join(cache, 'version_manifest.json')
          if (fs.existsSync(cachedManifest)) {
            const manifest = JSON.parse(fs.readFileSync(cachedManifest))
            const desiredVersion = manifest.versions.find(version => version.id === this.options.version.number)
            
            if (desiredVersion) {
              const cachedVersion = path.join(cache, `${this.options.version.number}.json`)
              if (fs.existsSync(cachedVersion)) {
                this.version = JSON.parse(fs.readFileSync(cachedVersion))
                return resolve(this.version)
              }
            }
          }
          
          resolve(new Error('No internet connection and no cached version available'))
        }
      })
    })
  }

  /**
   * Download Minecraft jar file
   * @returns {Promise<void>}
   */
  async getJar() {
    const jarPath = this.options.overrides.minecraftJar || path.join(this.options.directory, `${this.options.version.number}.jar`)
    
    if (fs.existsSync(jarPath)) {
      return
    }

    const downloadUrl = this.version.downloads.client.url
    const jarDirectory = path.dirname(jarPath)
    const jarName = path.basename(jarPath)

    this.client.emit('debug', '[VoidBeam]: Downloading Minecraft jar')
    await this.downloadAsync(downloadUrl, jarDirectory, jarName, true, 'client')
    this.client.emit('debug', '[VoidBeam]: Downloaded Minecraft jar')
  }

  /**
   * Download and prepare game assets
   * @returns {Promise<void>}
   */
  async getAssets() {
    const assetDirectory = this.options.overrides.assetRoot || path.join(this.options.root, 'assets')
    const assetIndex = this.options.overrides.assetIndex || this.version.assetIndex.id
    const assetIndexUrl = this.version.assetIndex.url
    
    const indexPath = path.join(assetDirectory, 'indexes', `${assetIndex}.json`)
    
    if (!fs.existsSync(indexPath)) {
      this.client.emit('debug', '[VoidBeam]: Downloading asset index')
      await this.downloadAsync(assetIndexUrl, path.dirname(indexPath), `${assetIndex}.json`, true, 'asset-index')
    }

    const index = JSON.parse(fs.readFileSync(indexPath))
    
    this.client.emit('progress', {
      type: 'assets',
      task: 0,
      total: Object.keys(index.objects).length
    })

    counter = 0
    await Promise.all(Object.keys(index.objects).map(async asset => {
      const hash = index.objects[asset].hash
      const subhash = hash.substring(0, 2)
      const subAsset = path.join(assetDirectory, 'objects', subhash)

      if (!fs.existsSync(path.join(subAsset, hash))) {
        await this.downloadAsync(`${this.options.overrides.url.resource}/${subhash}/${hash}`, subAsset, hash, true, 'assets')
      }
      
      counter++
      this.client.emit('progress', {
        type: 'assets',
        task: counter,
        total: Object.keys(index.objects).length
      })
    }))

    counter = 0
    this.client.emit('debug', '[VoidBeam]: Downloaded assets')
  }

  /**
   * Parse library rules to determine if library should be included
   * @param {Object} lib - Library object
   * @returns {boolean} Whether to exclude library
   */
  parseRule(lib) {
    if (!lib.rules) return false
    
    let action = false
    for (const rule of lib.rules) {
      if (rule.action === 'allow') {
        action = true
        if (rule.os) {
          action = rule.os.name === this.getOS()
        }
      } else if (rule.action === 'disallow') {
        if (rule.os && rule.os.name === this.getOS()) {
          action = false
        }
      }
    }
    
    return !action
  }

  /**
   * Download and extract native libraries
   * @returns {Promise<string>} Path to natives directory
   */
  async getNatives() {
    const nativeDirectory = path.resolve(this.options.overrides.natives || path.join(this.options.root, 'natives', this.version.id))

    if (parseInt(this.version.id.split('.')[1]) >= 19) {
      return this.options.overrides.cwd || this.options.root
    }

    if (!fs.existsSync(nativeDirectory) || !fs.readdirSync(nativeDirectory).length) {
      fs.mkdirSync(nativeDirectory, { recursive: true })

      const natives = []
      await Promise.all(this.version.libraries.map(async (lib) => {
        if (!lib.downloads || !lib.downloads.classifiers) return
        if (this.parseRule(lib)) return

        const native = this.getOS() === 'osx'
          ? lib.downloads.classifiers['natives-osx'] || lib.downloads.classifiers['natives-macos']
          : lib.downloads.classifiers[`natives-${this.getOS()}`]

        if (native) natives.push(native)
      }))

      // Download natives
      await Promise.all(natives.map(async (native) => {
        const nativePath = path.join(nativeDirectory, path.basename(native.path))
        if (!fs.existsSync(nativePath)) {
          await this.downloadAsync(native.url, nativeDirectory, path.basename(native.path), true, 'natives')
        }
      }))

      // Extract natives
      const nativeFiles = fs.readdirSync(nativeDirectory).filter(file => file.endsWith('.jar'))
      await Promise.all(nativeFiles.map(async (file) => {
        try {
          const zip = new Zip(path.join(nativeDirectory, file))
          zip.extractAllTo(nativeDirectory, true)
        } catch (e) {
          console.warn(e)
        }
        fs.unlinkSync(path.join(nativeDirectory, file))
      }))

      this.client.emit('debug', '[VoidBeam]: Downloaded and extracted natives')
    }

    return nativeDirectory
  }

  /**
   * Download libraries to directory
   * @param {string} directory - Target directory
   * @param {Array} libraries - Libraries to download
   * @param {string} eventName - Event name for progress
   * @returns {Promise<Array>} Paths to downloaded libraries
   */
  async downloadToDirectory(directory, libraries, eventName) {
    const libs = []
    
    counter = 0
    this.client.emit('progress', {
      type: eventName,
      task: 0,
      total: libraries.length
    })

    await Promise.all(libraries.map(async (lib) => {
      const downloadObj = lib.downloads ? lib.downloads.artifact : lib
      if (!downloadObj) return

      const libPath = path.join(directory, downloadObj.path)
      const libDir = path.dirname(libPath)

      if (!fs.existsSync(libPath)) {
        await this.downloadAsync(downloadObj.url, libDir, path.basename(libPath), true, eventName)
      }

      libs.push(libPath)
      counter++
      
      this.client.emit('progress', {
        type: eventName,
        task: counter,
        total: libraries.length
      })
    }))

    return libs
  }

  /**
   * Get class paths for launching
   * @returns {Promise<Array>} Array of class paths
   */
  async getClasses() {
    const libraryDirectory = path.resolve(this.options.overrides.libraryRoot || path.join(this.options.root, 'libraries'))
    
    const parsed = this.version.libraries.filter(lib => {
      if (lib.downloads && lib.downloads.artifact && !this.parseRule(lib)) {
        return true
      }
      return false
    })

    const libs = await this.downloadToDirectory(libraryDirectory, parsed, 'classes')
    counter = 0

    this.client.emit('debug', '[VoidBeam]: Collected class paths')
    return libs
  }

  /**
   * Get launch options and arguments
   * @param {Object} modification - Version modifications
   * @returns {Promise<Array>} Launch arguments
   */
  async getLaunchOptions(modification) {
    const type = Object.assign({}, this.version, modification)

    let args = type.minecraftArguments
      ? type.minecraftArguments.split(' ')
      : type.arguments.game

    const assetRoot = path.resolve(this.options.overrides.assetRoot || path.join(this.options.root, 'assets'))
    const assetPath = this.isLegacy()
      ? path.join(this.options.root, 'resources')
      : path.join(assetRoot)

    if (this.options.customLaunchArgs) {
      args = args.concat(this.options.customLaunchArgs)
    }

    this.options.authorization = await Promise.resolve(this.options.authorization)
    this.options.authorization.meta = this.options.authorization.meta || { type: 'offline' }

    const fields = {
      '${auth_player_name}': this.options.authorization.name,
      '${version_name}': this.options.version.number,
      '${game_directory}': this.options.overrides.gameDirectory || this.options.root,
      '${assets_root}': assetPath,
      '${assets_index_name}': this.options.overrides.assetIndex || this.version.assetIndex.id,
      '${auth_uuid}': this.options.authorization.uuid,
      '${auth_access_token}': this.options.authorization.access_token,
      '${user_type}': this.options.authorization.meta.type,
      '${version_type}': this.options.version.type || 'release',
      '${resolution_width}': this.options.window ? this.options.window.width : 856,
      '${resolution_height}': this.options.window ? this.options.window.height : 482
    }

    // Replace argument variables
    for (let index = 0; index < args.length; index++) {
      if (typeof args[index] === 'object') {
        if (args[index].rules) {
          // Handle conditional arguments
          let shouldInclude = true
          for (const rule of args[index].rules) {
            if (rule.action === 'allow') {
              shouldInclude = false
              if (rule.os && rule.os.name === this.getOS()) {
                shouldInclude = true
              }
            }
          }
          
          if (shouldInclude && args[index].value) {
            if (Array.isArray(args[index].value)) {
              args.splice(index, 1, ...args[index].value)
            } else {
              args[index] = args[index].value
            }
          } else {
            args.splice(index, 1)
            index--
          }
        }
      } else {
        if (Object.keys(fields).includes(args[index])) {
          args[index] = fields[args[index]]
        }
      }
    }

    // Add window options
    if (this.options.window) {
      if (this.options.window.fullscreen) {
        args.push('--fullscreen')
      } else {
        if (this.options.window.width) args.push('--width', this.options.window.width)
        if (this.options.window.height) args.push('--height', this.options.window.height)
      }
    }

    args = args.filter(value => typeof value === 'string' || typeof value === 'number')
    this.client.emit('debug', '[VoidBeam]: Set launch options')
    return args
  }

  /**
   * Get JVM arguments based on OS
   * @returns {Promise<string>} JVM arguments
   */
  async getJVM() {
    const opts = {
      windows: '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump',
      osx: '-XstartOnFirstThread',
      linux: '-Xss1M'
    }
    return opts[this.getOS()]
  }

  /**
   * Check if version is legacy
   * @returns {boolean} Whether version is legacy
   */
  isLegacy() {
    return this.version.assets === 'legacy' || this.version.assets === 'pre-1.6'
  }

  /**
   * Get current operating system
   * @returns {string} Operating system name
   */
  getOS() {
    if (this.options.os) {
      return this.options.os
    } else {
      switch (process.platform) {
        case 'win32': return 'windows'
        case 'darwin': return 'osx'
        default: return 'linux'
      }
    }
  }

  /**
   * Get memory settings for JVM
   * @returns {Array<string>} Memory settings
   */
  getMemory() {
    if (!this.options.memory) {
      this.client.emit('debug', '[VoidBeam]: Memory not set! Setting 1GB as MAX!')
      this.options.memory = {
        min: 512,
        max: 1023
      }
    }
    
    if (!isNaN(this.options.memory.max) && !isNaN(this.options.memory.min)) {
      if (this.options.memory.max < this.options.memory.min) {
        this.client.emit('debug', '[VoidBeam]: MIN memory is higher than MAX! Resetting!')
        this.options.memory.max = 1023
        this.options.memory.min = 512
      }
      return [`${this.options.memory.max}M`, `${this.options.memory.min}M`]
    } else {
      return [`${this.options.memory.max}`, `${this.options.memory.min}`]
    }
  }

  /**
   * Clean up array by removing null/undefined entries
   * @param {Array} array - Array to clean
   * @returns {Array} Cleaned array
   */
  cleanUp(array) {
    return array.filter(item => item != null)
  }
}

module.exports = Handler
