import localServer from './fixtures/server.js'
import ChromeJS from '../index.js'
import assert from 'assert'
import fs from 'fs'
describe('chromejs tests', async () => {
  let serverPort, chromeJs
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
  describe('window size', function () {
    beforeEach(async () => {
      chromeJs = new ChromeJS({windowSize: {width: 400, height: 500}})
      await chromeJs.start()
      await chromeJs.goto(`http://localhost:${serverPort}/find_elements.html`)
    });
    it('should resize window', async () => {
      let evalResponse = await chromeJs.eval('JSON.stringify({width: window.innerWidth, height: window.innerHeight})')
      let size = JSON.parse(evalResponse.result.value)
      assert.equal(400, size.width)
      assert.equal(500, size.height)
    });
  });
  describe('screenshot', function () {
    beforeEach(async () => {
      chromeJs = new ChromeJS()
      await chromeJs.start()
      await chromeJs.goto(`http://localhost:${serverPort}/find_elements.html`)
    });
    it('without filepath param', async () => {
      let filePath = './test/tmp/screenshot.png'
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      let Jimp = require('jimp')
      //the size param is optional. set a width will force it scale to the corresponding size
      let pngbuf = await chromeJs.screenshot(undefined, {width: 800})
      let screenshot = await Jimp.read(pngbuf)
      assert(screenshot.bitmap)
      assert.equal(800, screenshot.bitmap.width)
      assert.equal(600, screenshot.bitmap.height)
    });
    it('with filepath param', async () => {
      let filePath = './test/tmp/screenshot.png'
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      await chromeJs.screenshot(filePath, {width: 800})
      assert(fs.existsSync(filePath))
      let Jimp = require('jimp')
      let screenshot = await Jimp.read(filePath)
      assert(screenshot.bitmap)
      assert.equal(800, screenshot.bitmap.width)
      assert.equal(600, screenshot.bitmap.height)
    });
  });
  describe('element', function () {
    beforeEach(async () => {
      chromeJs = new ChromeJS()
      await chromeJs.start()
      await chromeJs.goto(`http://localhost:${serverPort}/find_elements.html`)
    });
    it('should find an element', async () => {
      let nodeObj = await chromeJs.querySelector('li')
      assert.equal('HTMLLIElement', nodeObj.result.className)
    });
    it('should get box model for an element', async () => {
      let box = await chromeJs.box('li')
      assert(box.model)
    });
  });
  describe('mouse', function () {
    beforeEach(async () => {
      chromeJs = new ChromeJS()
      await chromeJs.start()
      await chromeJs.goto(`http://localhost:${serverPort}/mouse_test.html`)
    });
    it('should click an element', async () => {
      let evalResponse = await chromeJs.eval('document.querySelector("#target").textContent')
      assert.equal('default', evalResponse.result.value)
      await chromeJs.click('#target')
      evalResponse = await chromeJs.eval('document.querySelector("#target").textContent')
      assert.equal('mouseup', evalResponse.result.value)
    });
  });
  describe('typing', function () {
    beforeEach(async () => {
      chromeJs = new ChromeJS()
      await chromeJs.start()
      await chromeJs.goto(`http://localhost:${serverPort}/form.html`)
    });
    it('should type in a input field', async () => {
      await chromeJs.click('#emptyInput')
      await chromeJs.type('test input')
      let evalResponse = await chromeJs.eval('document.querySelector("#emptyInput").value')
      assert.equal('test input', evalResponse.result.value)
    });
  });
  describe('wait', function () {
    beforeEach(async () => {
      chromeJs = new ChromeJS()
      await chromeJs.start()
      await chromeJs.goto(`http://localhost:${serverPort}/basic_content.html`)
    });
    it('should wait until dom element appear', async () => {
      await chromeJs.click('#moreContentTrigger')
      let domElement = await chromeJs.querySelector('.moreContent')
      assert.equal(null, domElement.result.value)
      await chromeJs.wait('.moreContent')
      domElement = await chromeJs.querySelector('.moreContent')
      assert.equal('div.moreContent', domElement.result.description)
    });
    it('should throw timeout error after 3 sec wait for an element', async () => {
      await chromeJs.wait('.more', 3000).catch((e) => {
        assert.deepEqual(new Error('timeout'), e)
      })
    });
  });
  describe('scroll', function () {
    beforeEach(async () => {
      chromeJs = new ChromeJS()
      await chromeJs.start()
      await chromeJs.goto(`http://localhost:${serverPort}/scroll.html`)
    });
    it('should scroll', async () => {
      await chromeJs.click('#target')
      let evalResponse = await chromeJs.eval(`document.querySelector('#target').textContent`)
      assert.equal('default', evalResponse.result.value)
      await chromeJs.scroll('html', 500)
      await chromeJs.click('#target')
      evalResponse = await chromeJs.eval(`document.querySelector('#target').textContent`)
      assert.equal(evalResponse.result.value, 'mousedown')
    });
  });
});
