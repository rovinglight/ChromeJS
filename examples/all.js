const ChromeJS = require('ChromeJS')
async function test () {
  let chromeJs = new ChromeJS({headless: false, windowSize: {width: 375, height: 677}})
  await chromeJs.start()
  await chromeJs.goto(`http://localhost:8100`)
  await chromeJs.client.Emulation.setDeviceMetricsOverride({
    width: 375,
    height: 677,
    deviceScaleFactor: 1,
    mobile: true,
    fitWindow: false,
    // screenWidth: 375,
    // screenHeight: 677
  })
  // await chromeJs.client.Runtime.evaluate({expression:
// 'window.resizeTo(375, 677)'})
  // await chromeJs.client.Browser.getWindowForTarget({targetId: 1})
  // await chromeJs.client.Browser.getWindowBounds()
  // await chromeJs.client.Browser.enable()
  // await chromeJs.waitLoadEvent()
  // await chromeJs.wait(1000)
  await chromeJs.wait('.recommend-intro')
  await chromeJs.wait('.recommend-intro')
  await chromeJs.click('.recommend-intro')
  await chromeJs.wait('.l-input')
  await chromeJs.scroll('.pie-detail-page.scroll-content', 500)
  console.log(await chromeJs.scroll('.pie-detail-page.scroll-content', 1000))
  await chromeJs.wait(1000)//implement a wait for hide
  await chromeJs.click('.pie-detail-page .bar-footer')
  await chromeJs.wait("input[name=emailOrPhone]")
  await chromeJs.wait(1000)
  await chromeJs.click("input[name=emailOrPhone]")
  await chromeJs.type('kataa@gmail.com')
  await chromeJs.click("input[name=password]")
  await chromeJs.type('kata')
  await chromeJs.click(".login-wrap .lr-button")
  await chromeJs.wait(2000)
  // await chromeJs.click(".lr-button")
  await chromeJs.wait(".pie-detail-page .bar-footer")
  await chromeJs.click(".pie-detail-page .bar-footer")
  await chromeJs.wait(".list-mid")
  //TODO figure out how not to use sleep for cases like this
  await chromeJs.wait(500)
  // console.log(await chromeJs.box('.real-trade-page.scroll-content'))
  console.log(await chromeJs.scroll('.real-trade-page.scroll-content', 500))
  // console.log(await chromeJs.box('.real-trade-page.scroll-content'))
  console.log('cliick')
  await chromeJs.wait(500)
  await chromeJs.click(".trade-btn button")
  await chromeJs.wait(500)
  await chromeJs.click(".pay-content .forget-pwd")
  await chromeJs.wait(".bank-account")
  // TODO find and use a img lib, make it capable to clip dom element from this original screenshot
  // this could be useful for make the screenshot consistent in with and without mobile mode(could have white spaces at the window edges,
  // causes by the default window w/h)
  let png = await chromeJs.screenshot()
  fs.writeFileSync('./test/tmp/test.png', png)
  chromeJs.close()
}
test()
