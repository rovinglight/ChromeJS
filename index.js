import {ChromeLauncher} from 'lighthouse/lighthouse-cli/chrome-launcher'
import CDP from 'chrome-remote-interface'

class ChromeJS {
  constructor (options = {}) {
    const defaults = {
      port: 9222,
      headless: true
      // waitTimeout: 30000,
      // gotoTimeout: 30000,
      // loadTimeout: 30000,
      // evaluateTimeout: 30000,
      // typeInterval: 20
    }
    this.options = Object.assign(defaults, options)
    this.cdpOptions = {
      port: this.options.port
    }
    this.client = null
    this.launcher = null
    // this.messagePrefix = null
    // this.emulateMode = false
    // this.userAgentBeforeEmulate = null
  }

  _createChromeLauncher (options) {
    const flags = []
    flags.push('--disable-gpu')
    if (options.headless) {
      flags.push('--headless')
    }
    if (options.additionalChromeFlags && Array.isArray(options.additionalChromeFlags)) {
      options.additionalChromeFlags.forEach(f => {
        if (f.indexOf('--') === -1) {
          throw new Error('chrome flag must start "--". flag: ' + f)
        }
        flags.push(f)
      })
    }
    return new ChromeLauncher({
      port: options.port,
      autoSelectChrome: true,
      additionalFlags: flags
    })
  }

  async _waitFinish (timeout, callback) {
    const start = Date.now()
    let finished = false
    let error = null
    let result = null
    const f = async () => {
      try {
        result = await callback.apply()
        finished = true
        return result
      } catch (e) {
        error = e
        finished = true
      }
    }
    f.apply()
    while (!finished) {
      const now = Date.now()
      if ((now - start) > timeout) {
        throw new Error('timeout')
      }
      await this.sleep(50)
    }
    if (error !== null) {
      throw error
    }
    return result
  }

  async start () {
    if (this.client !== null) {
      return
    }
    if (this.launcher === null) {
      this.launcher = this._createChromeLauncher(this.options)
    }
    await this.launcher.run()
    return new Promise((resolve, reject) => {
      const actualCdpOptions = this.cdpOptions
      Object.assign(actualCdpOptions, {
        target: (targets) => {
          return targets.filter(t => t.type === 'page').shift()
        }
      })
      CDP(actualCdpOptions, async (client) => {
        this.client = client
        const {Network, Page, Runtime, Console} = client
        await Promise.all([Network.enable(), Page.enable(), Runtime.enable(), Console.enable()])

        // focuses to first tab
        const targets = await this.client.Target.getTargets()
        const page = targets.targetInfos.filter(t => t.type === 'page').shift()
        await this.client.Target.activateTarget({targetId: page.targetId})

        resolve(this)
      }).on('error', (err) => {
        reject(err)
      })
    })
  }

  async close () {
    if (this.client === null) {
      return false
    }
    await this.client.close()
    this.client = null
    if (this.launcher !== null) {
      await this.launcher.kill()
      this.launcher = null
    }
    return true
  }

  async checkStart () {
    if (this.client === null) {
      await this.start()
    }
  }

  async goto (url, options) {
    const defaultOptions = {
      waitLoadEvent: true
    }
    options = Object.assign(defaultOptions, options)
    await this.checkStart()
    try {
      await this._waitFinish(this.options.gotoTimeout, async () => {
        await this.client.Page.navigate({url: url})
        if (options.waitLoadEvent) {
          await this.client.Page.loadEventFired()
        }
      })
    } catch (e) {
      throw e
    }
  }

  async sleep (ms) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, ms)
    })
  }

  async querySelector (param) {
    if (typeof param === 'number') {
      await this.sleep(param)
    }
    return new Promise(async (resolve, reject) => {
      await this.sleep(50)
      let nodeObj = await this.client.Runtime.evaluate({expression: `document.querySelector('${param}')`})
      if (!nodeObj.result.subtype === 'node') {
        return await this.querySelector(param)
      }
      resolve(nodeObj)
    })
  }
}

module.exports = ChromeJS
