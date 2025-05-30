const child = require('child_process')
const path = require('path')
const Handler = require('./handler')
const fs = require('fs')
const EventEmitter = require('events').EventEmitter

class VoidBeamCore extends EventEmitter {
  /**
   * Launch Minecraft with the given options
   * @param {Object} options - Launch options
   * @returns {Promise<ChildProcess>} Minecraft process
   */
  async launch(options) {
    try {
      this.options = { ...options }
      this.options.root = path.resolve(this.options.root)
      this.options.overrides = {
        detached: true,
        ...this.options.overrides,
        url: {
          meta: 'https://launchermeta.mojang.com',
          resource: 'https://resources.download.minecraft.net',
          ...this.options.overrides
            ? this.options.overrides.url
            : undefined
        }
      }

      this.handler = new Handler(this)

      this.printVersion()

      // Check Java installation
      const java = await this.handler.checkJava(this.options.javaPath || 'java')
      if (!java.run) {
        this.emit('debug', `[VoidBeam]: Couldn't start Minecraft due to: ${java.message}`)
        this.emit('close', 1)
        return null
      }

      this.createRootDirectory()
      this.createGameDirectory()

      // Set up version directory
      const directory = this.options.overrides.directory || path.join(this.options.root, 'versions', this.options.version.number)
      this.options.directory = directory

      // Get version manifest and files
      const versionFile = await this.handler.getVersion()
      if (versionFile instanceof Error) {
        this.emit('debug', `[VoidBeam]: ${versionFile.message}`)
        this.emit('close', 1)
        return null
      }

      const mcPath = this.options.overrides.minecraftJar || path.join(directory, `${this.options.version.number}.jar`)
      this.options.mcPath = mcPath

      // Download natives
      const nativePath = await this.handler.getNatives()

      // Download jar if it doesn't exist
      if (!fs.existsSync(mcPath)) {
        this.emit('debug', '[VoidBeam]: Attempting to download Minecraft version jar')
        await this.handler.getJar()
      }

      // Set up JVM arguments
      const args = []
      let jvm = [
        '-XX:-UseAdaptiveSizePolicy',
        '-XX:-OmitStackTraceInFastThrow',
        '-Dfml.ignorePatchDiscrepancies=true',
        '-Dfml.ignoreInvalidMinecraftCertificates=true',
        `-Djava.library.path=${nativePath}`,
        `-Xmx${this.handler.getMemory()[0]}`,
        `-Xms${this.handler.getMemory()[1]}`
      ]

      // Add OS-specific JVM arguments
      if (this.handler.getOS() === 'osx') {
        if (parseInt(versionFile.id.split('.')[1]) > 12) {
          jvm.push(await this.handler.getJVM())
        }
      } else {
        jvm.push(await this.handler.getJVM())
      }

      // Add custom JVM arguments
      if (this.options.customArgs) {
        jvm = jvm.concat(this.options.customArgs)
      }

      // Add log4j configuration for security
      if (parseInt(versionFile.id.split('.')[1]) < 17) {
        if (!jvm.find(arg => arg.includes('Dlog4j.configurationFile'))) {
          const configPath = path.resolve(this.options.overrides.cwd || this.options.root)
          const intVersion = parseInt(versionFile.id.split('.')[1])
          
          if (intVersion >= 12) {
            await this.handler.downloadAsync(
              'https://launcher.mojang.com/v1/objects/02937d122c86ce73319ef9975b58896fc1b491d1/log4j2_112-116.xml',
              configPath, 'log4j2_112-116.xml', true, 'log4j'
            )
            jvm.push('-Dlog4j.configurationFile=log4j2_112-116.xml')
          } else if (intVersion >= 7) {
            await this.handler.downloadAsync(
              'https://launcher.mojang.com/v1/objects/dd2b723346a8dcd48e7f4d245f6bf09e98db9696/log4j2_17-111.xml',
              configPath, 'log4j2_17-111.xml', true, 'log4j'
            )
            jvm.push('-Dlog4j.configurationFile=log4j2_17-111.xml')
          }
        }
      }

      // Add log4j security fix for newer versions
      if (parseInt(versionFile.id.split('.')[1]) === 18 && !parseInt(versionFile.id.split('.')[2])) {
        jvm.push('-Dlog4j2.formatMsgNoLookups=true')
      }
      if (parseInt(versionFile.id.split('.')[1]) === 17) {
        jvm.push('-Dlog4j2.formatMsgNoLookups=true')
      }

      // Get class paths
      const classes = this.options.overrides.classes || this.handler.cleanUp(await this.handler.getClasses())
      const classPaths = ['-cp']
      const separator = this.handler.getOS() === 'windows' ? ';' : ':'
      
      this.emit('debug', `[VoidBeam]: Using ${separator} to separate class paths`)

      // Build class path string
      const jar = fs.existsSync(mcPath)
        ? `${separator}${mcPath}`
        : `${separator}${path.join(directory, `${this.options.version.number}.jar`)}`
      
      classPaths.push(`${classes.join(separator)}${jar}`)
      classPaths.push(versionFile.mainClass)

      // Download assets
      this.emit('debug', '[VoidBeam]: Attempting to download assets')
      await this.handler.getAssets()

      // Get launch arguments
      const launchOptions = await this.handler.getLaunchOptions(null)

      // Combine all arguments
      const launchArguments = args.concat(jvm, classPaths, launchOptions)
      this.emit('arguments', launchArguments)
      this.emit('debug', `[VoidBeam]: Launching with arguments ${launchArguments.join(' ')}`)

      return this.startMinecraft(launchArguments)
    } catch (e) {
      this.emit('debug', `[VoidBeam]: Failed to start due to ${e}, closing...`)
      this.emit('close', 1)
      return null
    }
  }

  /**
   * Print version information
   */
  printVersion() {
    if (fs.existsSync(path.join(__dirname, '..', 'package.json'))) {
      const { version } = require('../package.json')
      this.emit('debug', `[VoidBeam]: VoidBeam Core version ${version}`)
    } else {
      this.emit('debug', '[VoidBeam]: Package JSON not found, skipping version check.')
    }
  }

  /**
   * Create root directory if it doesn't exist
   */
  createRootDirectory() {
    if (!fs.existsSync(this.options.root)) {
      this.emit('debug', '[VoidBeam]: Attempting to create root folder')
      fs.mkdirSync(this.options.root, { recursive: true })
    }
  }

  /**
   * Create game directory if specified
   */
  createGameDirectory() {
    if (this.options.overrides.gameDirectory) {
      this.options.overrides.gameDirectory = path.resolve(this.options.overrides.gameDirectory)
      if (!fs.existsSync(this.options.overrides.gameDirectory)) {
        fs.mkdirSync(this.options.overrides.gameDirectory, { recursive: true })
      }
    }
  }

  /**
   * Start the Minecraft process
   * @param {Array<string>} launchArguments - Arguments to launch Minecraft with
   * @returns {ChildProcess} Minecraft process
   */
  startMinecraft(launchArguments) {
    const minecraft = child.spawn(
      this.options.javaPath ? this.options.javaPath : 'java',
      launchArguments,
      {
        cwd: this.options.overrides.cwd || this.options.root,
        detached: this.options.overrides.detached
      }
    )

    minecraft.stdout.on('data', (data) => this.emit('data', data.toString('utf-8')))
    minecraft.stderr.on('data', (data) => this.emit('data', data.toString('utf-8')))
    minecraft.on('close', (code) => this.emit('close', code))
    
    return minecraft
  }
}

module.exports = VoidBeamCore
