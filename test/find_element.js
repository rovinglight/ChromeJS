import localServer from './fixtures/server.js'
import ChromeJS from '../index.js'
import assert from 'assert'

describe('find element tests', async () => {
  let serverPort, chromeJs
  process.on('SIGINT', async () => {
    await chromeJs.close()
    process.exit(1)
  })
  before((done) => {
    localServer(undefined, (err, instance) => {
      serverPort = instance.info.port
      done()
    })
  })
  after(localServer.stop)
  afterEach(async () => {
    await chromeJs.close()
  });
  it('test', async () => {
    chromeJs = new ChromeJS()
    await chromeJs.start()
    await chromeJs.goto(`http://localhost:${serverPort}/find_elements.html`)
    let nodeObj = await chromeJs.querySelector('li')
    assert.equal('HTMLLIElement', nodeObj.result.className)
  });
});
