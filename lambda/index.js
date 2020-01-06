const chromium = require("chrome-aws-lambda");
const path = require('path');
const geneticFilename = path.resolve(__dirname, "./genetic.js")
const genetic = require("fs").readFileSync(geneticFilename);

async function getBrowser() {
    const browser = await chromium.puppeteer.launch({
        executablePath: await chromium.executablePath,
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        headless: chromium.headless
      });
    return browser
}
const browserReady = getBrowser()

exports.handler = async function evolve({ timeout, semantic, legacy, style, pre, initial }) {
  const browser = await browserReady;
  const page = await browser.newPage();
  page.evaluate(`(() => {
        ${genetic};
        window.geneticCSS = geneticCSS;
    })()`);
  const res = await page.evaluate(
    async (timeout, semantic, legacy, style, pre, initial) => {
      let keepEvolving = true;
      let evolve = await geneticCSS.geneticCSS({
        semantic,
        legacy,
        style,
        pre,
        initial
      });
      setTimeout(() => (keepEvolving = false), timeout);
      let res;
      while (keepEvolving) {
        res = await evolve();
      }
      return res;
    },
    timeout,
    semantic,
    legacy,
    style,
    pre,
    initial
  );

  //  await page.title();
  console.log(res);
  await page.close();
  return res;
};
